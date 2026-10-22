const assert = require('assert'), fs = require('fs'), vm = require('vm');
global.window = global;
const THREE = require('../src/vendor/three.min.js');
vm.runInThisContext(fs.readFileSync('src/water-depth.js', 'utf8'));
const tolerance = 32 / 65535 / 2 + 1e-9;
const clamp = h => Number.isFinite(h) ? Math.max(-24, Math.min(8, h)) : -24;
function heightAt(texture, x, z) {
  const data = texture.image.data, i = (z * texture.image.width + x) * 4;
  return -24 + (data[i] * 256 + data[i + 1]) / 65535 * 32;
}
function checkMap(depth, height) {
  const u = depth.uniforms, texture = u.seabedMap.value, origin = u.seabedOrigin.value;
  assert.equal(texture.image.width, 128); assert.equal(texture.image.height, 128);
  assert.equal(u.seabedSpan.value, 508); assert.equal(u.seabedReady.value, 1);
  for (let z = 0; z < 128; z++) for (let x = 0; x < 128; x++) {
    const expected = clamp(height(origin.x + x * 4, origin.y + z * 4));
    assert(Math.abs(heightAt(texture, x, z) - expected) <= tolerance, 'Packed seabed differs from its world position');
  }
}
function shaderSample(depth, x, z) {
  const u = depth.uniforms, texture = u.seabedMap.value, origin = u.seabedOrigin.value;
  // The shader uses (uv * 127 + 0.5) / 128, placing integer sample positions
  // exactly on texel centres. RG decoding is linear and commutes with filtering.
  const fx = (x - origin.x) / u.seabedSpan.value * 127;
  const fz = (z - origin.y) / u.seabedSpan.value * 127;
  const i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j;
  return (heightAt(texture, i, j) * (1 - a) + heightAt(texture, i + 1, j) * a) * (1 - b)
    + (heightAt(texture, i, j + 1) * (1 - a) + heightAt(texture, i + 1, j + 1) * a) * b;
}

const encoding = CB90.createWaterDepth(THREE);
assert.equal(encoding.uniforms.seabedReady.value, 0);
assert.equal(heightAt(encoding.uniforms.seabedMap.value, 0, 0), -24);
const extremes = x => x < -100 ? -80 : x > 100 ? 20 : x === 0 ? NaN : -12 + x * .05;
encoding.setWorld({ start: { x: 0, z: 0 }, height: extremes });
checkMap(encoding, extremes);
assert.equal(encoding.uniforms.seabedMap.value.minFilter, THREE.LinearFilter);
assert.equal(encoding.uniforms.seabedMap.value.magFilter, THREE.LinearFilter);
assert.equal(encoding.uniforms.seabedMap.value.encoding, THREE.LinearEncoding);
assert.equal(encoding.uniforms.seabedMap.value.generateMipmaps, false);
assert.equal(encoding.uniforms.seabedMap.value.flipY, false);

const depth = CB90.createWaterDepth(THREE), start = { x: -431, z: 213 };
let calls = 0;
const gradient = (x, z) => -9 + (x - start.x) * .01 + (z - start.z) * .017;
depth.setWorld({ start, height(x, z) { calls++; return gradient(x, z); } });
assert.equal(calls, 128 * 128);
checkMap(depth, gradient);
for (const [x, z] of [[-450.3, 233.7], [-398.1, 211.3], [-500.6, 190.9]]) {
  assert(Math.abs(shaderSample(depth, x, z) - gradient(x, z)) <= tolerance, 'Filtered RG height has a half-texel or axis offset');
  const sample = depth.sample(x, z);
  assert(Math.abs(sample.bottom - gradient(x, z)) <= tolerance);
  assert(Math.abs(sample.dx - .01) <= 1 / 126 && Math.abs(sample.dz - .017) <= 1 / 126,
    'Shore gradient does not point up the real seabed');
  assert.equal(sample.coverage, 1);
}
assert.equal(depth.sample(start.x + 700, start.z).coverage, 0, 'Local shoreline reflection extends beyond the map');

const oldMap = depth.uniforms.seabedMap.value, oldOrigin = depth.uniforms.seabedOrigin.value.clone();
const oldBytes = Uint8Array.from(oldMap.image.data), oldVersion = oldMap.version;
const destination = { x: start.x + 90, z: start.z + 20 };
let steps = 0;
do {
  const previous = calls;
  depth.update(destination.x, destination.z); steps++;
  assert(calls - previous <= 512, 'A frame sampled more than four rows');
  if (depth.uniforms.seabedMap.value === oldMap) {
    assert(depth.uniforms.seabedOrigin.value.equals(oldOrigin), 'Published coordinates changed before the texture completed');
    assert.deepEqual(oldMap.image.data, oldBytes, 'The currently rendered map was partially overwritten');
    assert.equal(oldMap.version, oldVersion, 'An unfinished texture was queued for GPU upload');
  }
  assert(steps <= 32, 'Recentring failed to finish');
} while (depth.uniforms.seabedMap.value === oldMap);
assert(steps > 1, 'Recentring blocked one frame with a complete map build');
checkMap(depth, gradient);
assert.equal(depth.uniforms.seabedOrigin.value.x % 4, 0);
assert.equal(depth.uniforms.seabedOrigin.value.y % 4, 0);
const settledCalls = calls;
for (let i = 0; i < 10; i++) depth.update(destination.x, destination.z);
assert.equal(calls, settledCalls, 'A stationary vessel repeatedly rebuilds its map');

// A replacement world must cancel an in-progress rebuild and publish only new terrain.
depth.update(destination.x + 90, destination.z);
let replacementCalls = 0;
const replacementStart = { x: 3401, z: -2155 };
depth.setWorld({ start: replacementStart, height() { replacementCalls++; return -2.75; } });
assert.equal(replacementCalls, 128 * 128);
checkMap(depth, () => -2.75);
const replacementMap = depth.uniforms.seabedMap.value, replacedCalls = calls;
for (let i = 0; i < 40; i++) depth.update(replacementStart.x, replacementStart.z);
assert.strictEqual(depth.uniforms.seabedMap.value, replacementMap);
assert.equal(calls, replacedCalls, 'A cancelled job continued sampling the old world');
assert.equal(replacementCalls, 128 * 128);

// Teleporting during a pending recenter starts a bounded job at the new location.
depth.update(replacementStart.x + 80, replacementStart.z);
const teleported = { x: 8001, z: 9243 };
for (let i = 0; i < 32; i++) {
  const previous = replacementCalls;
  depth.update(teleported.x, teleported.z);
  assert(replacementCalls - previous <= 512);
}
const teleportedOrigin = depth.uniforms.seabedOrigin.value;
assert(Math.abs(teleportedOrigin.x + 254 - teleported.x) <= 2);
assert(Math.abs(teleportedOrigin.y + 254 - teleported.z) <= 2);
checkMap(depth, () => -2.75);

depth.setWorld(null);
assert.equal(depth.uniforms.seabedReady.value, 0);
const invalidatedCalls = replacementCalls;
depth.update(0, 0);
assert.equal(replacementCalls, invalidatedCalls);
depth.setWorld({ height: () => -7 });
checkMap(depth, () => -7);
console.log('PASS seabed encoding/clamps, filtered gradients, bounded recentering, atomic publication, world replacement and teleport reset');
