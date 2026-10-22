// Check the real solver -> texture -> water/foam integration without a browser.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
global.window = global;
const THREE = require('../src/vendor/three.min.js');
for (const file of ['constants', 'sea-state', 'weather', 'water-depth', 'hull-waves', 'hull-wave-surface', 'wake', 'water']) {
  vm.runInThisContext(fs.readFileSync('src/' + file + '.js', 'utf8'), { filename: file + '.js' });
}
const surface = CB90.createHullWaveSurface(THREE);
const state = { nav: { x: 0, z: 0, heading: 0, speed: 8 }, enginesOn: false };
surface.update(0, state);
for (let step = 1; step <= 120; step++) {
  state.nav.x = step * 8 / 60;
  surface.update(step / 60, state);
}
const field = surface.field, map = surface.uniforms.hullWaveMap.value;
const texture = map.image.data, size = field.size;
const gradients = surface.uniforms.hullWaveSlopeMap.value.image.data;
const decode = i => (texture[i * 4] * 256 + texture[i * 4 + 1] - 32768) / 8191;
let peak = 0;
for (let i = 0; i < size * size; i++) {
  peak = Math.max(peak, Math.abs(field.height[i]));
  assert(Math.abs(decode(i) - field.height[i]) < 0.00007, 'Rendered displacement clipped or differs from simulated water');
}
assert(peak > .02, 'Integration test did not generate hull waves');
assert.equal(surface.uniforms.hullWaveOrigin.value.x, field.origin.x);
assert.equal(surface.uniforms.hullWaveOrigin.value.y, field.origin.z);
assert.equal(map.minFilter, THREE.LinearFilter);
assert.equal(map.flipY, false);
const farMap = surface.uniforms.farHullWaveMap.value;
for (let i = 0; i < field.farField.height.length; i++) {
  const bytes = farMap.image.data;
  assert(Math.abs((bytes[i * 4] * 256 + bytes[i * 4 + 1] - 32768) / 8191 - field.farField.height[i]) < .00007,
    'Far wave texture differs from the propagated field');
}
assert.equal(surface.uniforms.hullWaveBlendOrigin.value.x, field.blendOrigin.x);
assert.equal(surface.uniforms.hullWaveBlendOrigin.value.y, field.blendOrigin.z);

// The surface normal should tilt up toward a crest and down away from it.
for (let z = 1; z < size - 1; z += 3) for (let x = 1; x < size - 1; x += 3) {
  const i = z * size + x;
  const cpuDx = (field.sampleLocal(field.origin.x + (x + 1) * field.cell, field.origin.z + z * field.cell)
    - field.sampleLocal(field.origin.x + (x - 1) * field.cell, field.origin.z + z * field.cell)) / (2 * field.cell);
  assert(Math.abs((gradients[i * 4] * 256 + gradients[i * 4 + 1] - 32768) / 8191 - cpuDx) < .00007, 'GPU slope has the wrong scale or direction');
}
const version = map.version, farVersion = farMap.version, held = Uint8Array.from(texture);
state.paused = true;
surface.update(7, state);
assert.equal(map.version, version, 'Paused water uploads new GPU data');
assert.equal(farMap.version, farVersion, 'Paused distant waves upload new GPU data');
assert.deepEqual(map.image.data, held, 'Paused water moves');
surface.reset(state.nav);
for (let i = 0; i < field.farField.height.length; i++) {
  assert.equal(farMap.image.data[i * 4] * 256 + farMap.image.data[i * 4 + 1], 32768,
    'Reset leaves distant waves in the rendered surface');
}
for (let i = 0; i < size * size; i++) {
  assert.equal(decode(i), 0, 'Reset leaves an offset in the packed water surface');
  assert.equal(gradients[i * 4] * 256 + gradients[i * 4 + 1], 32768);
  assert.equal(gradients[i * 4 + 2] * 256 + gradients[i * 4 + 3], 32768);
}

const water = CB90.buildWater(THREE);
water.setWorld({ start: { x: 0, z: 0 }, height: () => -12 });
const material = water.mesh.material, spray = water.parts.spray.material;
assert.equal(water.parts.wake.geometry.drawRange.count, 0, 'Intersecting foam sheets are still drawn');
for (const [name, uniform] of Object.entries(water.wakeSystem.foamUniforms)) {
  assert.strictEqual(material.uniforms[name], uniform, 'Persistent foam is not shaded on the water surface');
}
for (const name of ['hullWaveMap', 'hullWaveSlopeMap', 'hullWaveOrigin', 'hullWaveLayout', 'farHullWaveMap', 'farHullWaveSlopeMap', 'hullWaveBlendOrigin']) {
  assert.strictEqual(material.uniforms[name], spray.uniforms[name], 'Spray does not land on the rendered wave surface');
}
state.paused = false; state.nav.x = 0;
for (let i = 0; i <= 90; i++) { state.nav.x = i * 8 / 60; water.update(i / 60, state); }
const t = material.uniforms.time.value;
for (const [x, z] of [[10, 3], [6, -4], [0, 8]]) {
  assert(Math.abs(water.sampleHeight(x, z, t) - CB90.Sea.height(x, z, t) - water.hullWaves.sample(x, z)) < 1e-10);
}
water.reset(state.nav);
assert.equal(water.hullWaves.stats().maxAbsHeight, 0, 'Return to start keeps the old swell');
// A rocky coast must modify the incoming sea without creating waves in flat deep water.
const coastal = CB90.buildWater(THREE);
coastal.setWorld({start: {x: -12, z: 0}, height: x => x * .5});
coastal.update(0, {nav: {x: -12, z: 0, heading: 0, speed: 0}});
let reflectedEnergy = 0;
for (let t = 0; t < 12; t += .2) {
  reflectedEnergy += (coastal.sampleHeight(-2, 0, t) - CB90.Sea.height(-2, 0, t)) ** 2;
  assert(Math.abs(coastal.sampleHeight(-40, 0, t) - CB90.Sea.height(-40, 0, t)) < .002, 'Coast reflection leaks into deep water');
}
assert(reflectedEnergy > .005, 'Rocky shore has no reflected/run-up wave motion');
console.log('PASS signed texture heights/slopes, pause/reset, water foam, shared spray uniforms and coastal wave sampling');

// Strong heave/turns previously exceeded the texture range even though the
// numerical field was stable. Inspect encoded values, not just solver finiteness.
const storm = CB90.createHullWaveSurface(THREE), stormField = storm.field;
let stormPeak = 0, steepest = 0;
for (let frame = 0; frame <= 18 * 60; frame++) {
  const t = frame / 60;
  storm.update(t, {nav: {x: 65 * Math.sin(t * .36), z: 22 * Math.sin(t * .6),
    heading: -Math.atan2(13.2 * Math.cos(t * .6), 23.4 * Math.cos(t * .36)), speed: 24}},
    {heave: .7 * Math.sin(t * 2.2), pitch: .12 * Math.sin(t * 1.6), roll: .18 * Math.sin(t * 2.6), pivotX: 6});
  const heights = stormField.height, packed = storm.uniforms.hullWaveMap.value.image.data;
  const slopeBytes = storm.uniforms.hullWaveSlopeMap.value.image.data;
  for (let z = 1; z < stormField.size - 1; z++) for (let x = 1; x < stormField.size - 1; x++) {
    const i = z * stormField.size + x, o = i * 4;
    const gpuHeight = (packed[o] * 256 + packed[o + 1] - 32768) / 8191;
    const dx = (heights[i + 1] - heights[i - 1]) / (2 * stormField.cell);
    const dz = (heights[i + stormField.size] - heights[i - stormField.size]) / (2 * stormField.cell);
    const gpuDx = (slopeBytes[o] * 256 + slopeBytes[o + 1] - 32768) / 8191;
    const gpuDz = (slopeBytes[o + 2] * 256 + slopeBytes[o + 3] - 32768) / 8191;
    stormPeak = Math.max(stormPeak, Math.abs(heights[i]));
    steepest = Math.max(steepest, Math.abs(dx), Math.abs(dz));
    assert(Math.abs(gpuHeight - heights[i]) < .00007, 'Storm crest clipped in the rendered surface');
    assert(Math.abs(gpuDx - dx) < .00007 && Math.abs(gpuDz - dz) < .00007, 'Storm normal clipped in the rendered surface');
  }
}
assert(stormPeak > 2 && steepest > 1, 'Stress scenario must exceed the old encoding limits');
console.log('PASS storm surface/normal encoding without clipping: height ' + stormPeak.toFixed(3) + ' m, slope ' + steepest.toFixed(3));
