// Behaviour checks for the boat-driven surface, independent of its renderer.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
global.window = global;
for (const file of ['constants', 'hull-waves']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '../src', file + '.js'), 'utf8'), {filename: file + '.js'});
}

const pose = {heave: 0, pitch: 0, roll: 0, pivotX: 6};
const nav = (x = 0, z = 0, heading = 0, speed = 0) => ({x, z, heading, speed});
const state = n => ({nav: n, enginesOn: false, engineP: 0, engineS: 0});
const make = options => CB90.createHullWaves(options);
function evolve(waves, from, to, hz, motion, attitude = () => pose) {
  for (let i = 1; i <= Math.round((to - from) * hz); i++) {
    const t = from + i / hz;
    waves.update(t, state(motion(t)), attitude(t));
  }
  return waves;
}
function cruise(speed = 10, seconds = 4, hz = 60, options) {
  const waves = make(options);
  waves.update(0, state(nav(0, 0, 0, speed)), pose);
  return evolve(waves, 0, seconds, hz, t => nav(speed * t, 0, 0, speed));
}
function values(waves, x0, x1, z0, z1, step = 1.5) {
  const result = [];
  for (let z = z0; z <= z1; z += step) for (let x = x0; x <= x1; x += step) result.push(waves.sample(x, z));
  return result;
}
const rms = a => Math.sqrt(a.reduce((sum, v) => sum + v * v, 0) / a.length);
function energy(waves) {
  return waves.height.reduce((sum, v) => sum + v * v, 0) * waves.cell * waves.cell;
}
function assertFinite(waves, context) {
  assert(waves.height.every(Number.isFinite), context + ': every height must be finite');
  assert(waves.height.every(v => Math.abs(v) < 4), context + ': height remains below four metres');
  if (waves.farField) assertFinite(waves.farField, context + ' broad layer');
}
function check(name, test) { test(); console.log('PASS ' + name); }

check('a stationary hull does not generate an endless wave source', () => {
  const waves = make({size: 96});
  waves.update(0, state(nav()), pose);
  evolve(waves, 0, 6, 60, () => nav());
  assert.equal(energy(waves), 0);
});

check('coasting displaces real surface height into crests and troughs beside the hull', () => {
  const waves = cruise(10, 5);
  // Keep all samples outside the hull, so a depression hidden inside the boat cannot pass.
  const side = [...values(waves, 20, 65, 2.5, 18), ...values(waves, 20, 65, -18, -2.5)];
  assert(Math.max(...side) > 0.003, 'Visible water needs a positive crest');
  assert(Math.min(...side) < -0.003, 'Visible water needs a negative trough');
  assertFinite(waves, 'Cruise');
});

check('vertical hull motion pushes waves into the surrounding water', () => {
  const waves = make({size: 96});
  waves.update(0, state(nav()), pose);
  evolve(waves, 0, 1, 60, () => nav(), t => ({...pose, heave: 0.3 * Math.sin(Math.PI * t)}));
  evolve(waves, 1, 3, 60, () => nav());
  assert(rms(values(waves, -8, 22, 3, 14)) > 0.001, 'Heave must disturb water outside the stationary hull');
});

check('waves travel away from the track after the boat has stopped, then decay', () => {
  const waves = cruise(10, 3);
  // This strip is 24+ m from the track, beyond the initial short wake.
  const before = rms(values(waves, 0, 44, 24, 30));
  evolve(waves, 3, 7, 60, () => nav(30));
  const after = rms(values(waves, 0, 44, 24, 30));
  assert(after > Math.max(before * 3, 0.00005), `Off-track wave arrival: ${before} -> ${after}`);
  const initialEnergy = energy(waves);
  evolve(waves, 7, 42, 60, () => nav(30));
  assert(energy(waves) < initialEnergy * 0.12, 'A stopped hull must let the wake dissipate');
});

check('old waves keep their world positions when the local grid shifts or the boat turns', () => {
  const steady = cruise(10, 4);
  const shifted = cruise(10, 4);
  const turned = cruise(10, 4);
  const oldOrigin = {...shifted.origin};
  steady.update(4 + 1 / 60, state(nav(40)), pose);
  shifted.update(4 + 1 / 60, state(nav(58, 0, 0, 10)), pose);
  turned.update(4 + 1 / 60, state(nav(40, 0, Math.PI / 2)), pose);
  assert(shifted.origin.x !== oldOrigin.x || shifted.origin.z !== oldOrigin.z, 'Scenario must actually shift the grid');
  // Verify both physical grids separately: their continuous resolution blend
  // legitimately changes as the observer travels eighteen metres in one frame.
  for (const layer of [waves => waves, waves => waves.farField]) {
    const reference = values({sample: layer(steady).sampleLocal}, 5, 18, 5, 13, 0.75);
    assert(rms(reference) > 0.0001, 'The historical wake patch must contain waves');
    for (const [label, waves] of [['grid shift', shifted], ['turn', turned]]) {
      const sampled = values({sample: layer(waves).sampleLocal}, 5, 18, 5, 13, 0.75);
      const difference = rms(sampled.map((h, i) => h - reference[i]));
      assert(difference < 0.00001, `${label} must not drag or rotate existing waves: RMS error ${difference}`);
    }
  }
});

check('the wake keeps spreading beyond the fine grid after the hull stops', () => {
  const waves = cruise(10, 3);
  const distantStrip = () => values(waves, -6, 40, 98, 112, 2);
  const before = rms(distantStrip());
  evolve(waves, 3, 26, 30, () => nav(30));
  const after = rms(distantStrip());
  assert(after > Math.max(before * 10, 0.0001), `Broad wake must reach water outside the fine grid: ${before} -> ${after}`);
  assert.equal(rms(values({sample: waves.sampleLocal}, -6, 40, 98, 112, 2)), 0, 'Arrival must come from the broad propagation layer');
});

check('a departed hull leaves a moving wake in the world beyond its local grid', () => {
  const waves = cruise(10, 24, 30);
  assert(waves.origin.x > 100, 'The boat must have left the old wake region');
  const historical = values(waves, -10, 65, 75, 110, 2.5);
  assert(rms(historical) > 0.0001, 'Historical waves must survive after the fine grid has completely left them');
  assert.equal(rms(values({sample: waves.sampleLocal}, -10, 65, 75, 110, 2.5)), 0);
});

check('a stopped hull leaves substantial propagating swell for at least a minute', () => {
  const waves = cruise(10, 3, 30);
  evolve(waves, 3, 10, 30, () => nav(30));
  const settledEnergy = waves.farField.stats().energy;
  evolve(waves, 10, 63, 30, () => nav(30));
  const remaining = waves.farField.stats();
  assert(remaining.energy > settledEnergy * .55,
    `Open-water drag erased the swell too quickly: ${settledEnergy} -> ${remaining.energy}`);
  assert(remaining.energy < settledEnergy, 'The undriven swell must still lose energy');
  assert(remaining.maxAbsHeight > .025, 'Minute-old travelling waves must retain centimetre-scale crests');
  assertFinite(waves, 'Minute-old swell');
});

check('full-speed travel preserves the old wake after 30 seconds', () => {
  const waves = cruise(23, 30, 30);
  const oldSwell = values(waves, -30, 120, 30, 170, 3);
  assert(rms(oldSwell) > .008, 'Following a fast hull discarded its old propagating wake');
  assert.equal(rms(values({sample: waves.sampleLocal}, -30, 120, 30, 170, 3)), 0,
    'Old wake check must be entirely outside the fine grid');
});

check('the resolution blend moves continuously when texture grids recenter', () => {
  const waves = cruise(10, 3, 60);
  let origin = {...waves.origin}, shifts = 0;
  for (let frame = 1; frame <= 120; frame++) {
    const blendOrigin = {...waves.blendOrigin}, t = 3 + frame / 60;
    waves.update(t, state(nav(10 * t, 0, 0, 10)), pose);
    assert(Math.abs(waves.blendOrigin.x - blendOrigin.x - 10 / 60) < 1e-10, 'Blend position must follow the hull without cell-sized jumps');
    if (origin.x !== waves.origin.x) shifts++;
    origin = {...waves.origin};
  }
  assert(shifts > 0, 'Continuity check must cross a fine-grid recenter');
  const z = waves.blendOrigin.z + waves.blendStart;
  const h0 = waves.sample(30, z - .001), h1 = waves.sample(30, z + .001);
  assert(Math.abs(h1 - h0) < .001, 'Fine/broad blend boundary must be continuous');
});

check('coarse source integration retains hull volume at every sub-cell position', () => {
  const broad = make().farField, volumes = [];
  for (let offset = 0; offset <= broad.cell; offset += .25) {
    broad.reset(nav(0, offset, .37), pose);
    volumes.push(broad.stats().sourceVolume);
  }
  assert(Math.min(...volumes) > 10, 'A narrow hull must never disappear between broad-grid samples');
  assert(Math.min(...volumes) / Math.max(...volumes) > .95, 'Sub-cell motion must not pulse the displaced hull volume');
});

check('reverse travel creates a displaced surface without requiring running engines', () => {
  const waves = cruise(-6, 5);
  const surface = [...values(waves, -45, 0, 2.5, 15), ...values(waves, -45, 0, -15, -2.5)];
  assert(Math.max(...surface) > 0.003);
  assert(Math.min(...surface) < -0.003);
  assertFinite(waves, 'Reverse');
});

check('pause and an unchanged simulation time freeze the surface', () => {
  const waves = cruise();
  const frozen = Array.from(waves.height), origin = {...waves.origin};
  const broad = Array.from(waves.farField.height), broadOrigin = {...waves.farField.origin};
  const blendOrigin = {...waves.blendOrigin};
  waves.update(4, state(nav(41, 0, 0.2, 10)), pose);
  assert.deepStrictEqual(Array.from(waves.height), frozen);
  waves.update(14, {...state(nav(100, 20, 1, 10)), paused: true}, {...pose, heave: 1});
  assert.deepStrictEqual(Array.from(waves.height), frozen);
  assert.deepStrictEqual(waves.origin, origin);
  assert.deepStrictEqual(Array.from(waves.farField.height), broad);
  assert.deepStrictEqual(waves.farField.origin, broadOrigin);
  assert.deepStrictEqual(waves.blendOrigin, blendOrigin);
});

check('reset and teleport clear the previous wake without a synthetic splash', () => {
  const manual = cruise(), teleported = cruise();
  manual.reset(nav(800, -200), pose);
  assert.equal(energy(manual), 0);
  assert.equal(energy(manual.farField), 0);
  manual.update(4, state(nav(800, -200)), pose);
  evolve(manual, 4, 5, 60, () => nav(800, -200));
  assert.equal(energy(manual), 0);
  teleported.update(4 + 1 / 60, state(nav(800, -200)), pose);
  assert.equal(energy(teleported), 0);
  assert.equal(energy(teleported.farField), 0);
  evolve(teleported, 4 + 1 / 60, 5 + 1 / 60, 60, () => nav(800, -200));
  assert.equal(energy(teleported), 0);
});

check('dry terrain blocks waves, and replacing the world rebuilds the land mask', () => {
  // A continuous dry strip separates two water regions. Waves from the boat
  // cannot cross it; replacing the world moves the strip to the opposite side.
  const northBank = {height: (x, z) => z >= 4.5 && z <= 7.5 ? 1 : -8};
  const southBank = {height: (x, z) => z >= -7.5 && z <= -4.5 ? 1 : -8};
  const waves = make({size: 128});
  function assertDryCells(world) {
    let count = 0;
    for (let j = 0; j < waves.size; j++) for (let i = 0; i < waves.size; i++) {
      const x = waves.origin.x + i * waves.cell, z = waves.origin.z + j * waves.cell;
      if (world.height(x, z) >= 0) {
        assert.equal(waves.height[j * waves.size + i], 0, `Dry terrain has waves at ${x}, ${z}`);
        count++;
      }
    }
    assert(count > 100, 'Shoreline scenario must contain dry cells');
  }
  waves.setWorld(northBank);
  waves.update(0, state(nav(0, 0, 0, 6)), pose);
  evolve(waves, 0, 4, 60, t => nav(6 * t, 0, 0, 6));
  assertDryCells(northBank);
  assert(rms(values(waves, 0, 30, 2.25, 3.75, 0.75)) > 0.001, 'Waves must reach the water side of the bank');
  assert.equal(rms(values(waves, 0, 30, 9, 15)), 0, 'Waves must not cross dry land into isolated water');

  waves.setWorld(southBank);
  assert.equal(energy(waves), 0, 'World replacement must clear waves immediately');
  assert.equal(waves.sample(18, 3), 0, 'World replacement must invalidate sampling immediately');
  waves.update(4, state(nav(24, 0, 0, 6)), pose);
  evolve(waves, 4, 8, 60, t => nav(6 * t, 0, 0, 6));
  assertDryCells(southBank);
  assert(rms(values(waves, 24, 54, 5.25, 6.75, 0.75)) > 0.001, 'Former dry land must now transmit water waves');
  assert.equal(rms(values(waves, 24, 54, -15, -9)), 0, 'The replacement bank must block waves');
});

check('rock faces reflect arriving wave energy back into water at both resolutions', () => {
  for (const layer of [() => make({size: 128, farField: false}), () => make().farField]) {
    const open = layer(), bank = layer();
    bank.setWorld({height: (x, z) => z >= 12 ? 1 : -8});
    for (const waves of [open, bank]) {
      waves.update(0, state(nav()), pose);
      evolve(waves, 0, 1, 60, () => nav(), t => ({...pose, heave: .3 * Math.sin(Math.PI * t)}));
      evolve(waves, 1, 4.5, 60, () => nav());
    }
    // A no-flux wall has the same reflected solution as a mirrored source.
    // The actual wall is the cell face immediately before the first dry row.
    const mirror = 24 - bank.cell;
    let cross = 0, reflectedEnergy = 0, expectedEnergy = 0;
    for (let x = -3; x <= 20; x += .75) for (let z = 3; z <= 9; z += .75) {
      const reflection = bank.sample(x, z) - open.sample(x, z);
      const expected = open.sample(x, mirror - z);
      cross += reflection * expected;
      reflectedEnergy += reflection * reflection;
      expectedEnergy += expected * expected;
    }
    assert(reflectedEnergy > .001, 'Rock impact must return measurable wave energy toward the hull');
    assert(cross / Math.sqrt(reflectedEnergy * expectedEnergy) > .98, 'Reflected wave must travel back with the phase of a solid coastal boundary');
    assert.equal(rms(values(bank, -3, 20, 15, 24)), 0, 'Reflection must not transmit waves through dry rock');
  }
});

check('rapid motion and storm heave, pitch and roll remain finite and bounded', () => {
  const waves = make({size: 128});
  const motion = t => nav(65 * Math.sin(t * 0.36), 22 * Math.sin(t * 0.6), -Math.atan2(13.2 * Math.cos(t * 0.6), 23.4 * Math.cos(t * 0.36)), 24);
  const attitude = t => ({...pose, heave: 0.7 * Math.sin(t * 2.2), pitch: 0.12 * Math.sin(t * 1.6), roll: 0.18 * Math.sin(t * 2.6)});
  waves.update(0, state(motion(0)), attitude(0));
  for (let second = 0; second < 18; second++) {
    evolve(waves, second, second + 1, 60, motion, attitude);
    assertFinite(waves, 'Storm at ' + (second + 1) + ' seconds');
  }
  assert(energy(waves) > 0.001, 'Storm check must exercise a nonzero wave field');
});

check('sustained travel at the wave speed stays below the rendered height range', () => {
  const waves = make();
  waves.update(0, state(nav(0, 0, 0, 4.8)), pose);
  let peak = 0;
  for (let frame = 1; frame <= 20 * 60; frame++) {
    const t = frame / 60;
    waves.update(t, state(nav(4.8 * t, 0, 0, 4.8)), pose);
    for (const height of waves.height) peak = Math.max(peak, Math.abs(height));
  }
  // Check the physical field, before texture encoding can hide an unstable crest.
  // Retain a conservative physical bound, independent of the wider GPU encoding range.
  assert(peak > 0.01, 'Resonance scenario must exercise real hull displacement');
  assert(peak < 1.8, `Near-wave-speed resonance exceeds the visual range: ${peak.toFixed(3)} m`);
  console.log('  Peak surface displacement over 20 seconds: ' + peak.toFixed(3) + ' m');
});

check('30, 60 and 120 FPS produce similar surface heights on a curved course', () => {
  const motion = t => nav(10 * t, 4 * Math.sin(t * 0.4), -Math.atan(0.16 * Math.cos(t * 0.4)), 10);
  function simulation(hz) {
    const waves = make();
    waves.update(0, state(motion(0)), pose);
    evolve(waves, 0, 6, hz, motion);
    return values(waves, 20, 73, -24, 28, 1.5);
  }
  const reference = simulation(120);
  for (const hz of [30, 60]) {
    const result = simulation(hz);
    const error = rms(result.map((h, i) => h - reference[i]));
    assert(error < Math.max(0.002, rms(reference) * 0.18), `${hz} FPS differs by RMS ${error} (surface RMS ${rms(reference)})`);
  }
});

check('10 FPS and irregular frames preserve the wake and simulated elapsed time', () => {
  const motion = t => nav(10 * t, 4 * Math.sin(t * 0.4), -Math.atan(0.16 * Math.cos(t * 0.4)), 10);
  const reference = make();
  reference.update(0, state(motion(0)), pose);
  evolve(reference, 0, 6, 120, motion);
  const expected = values(reference, 20, 73, -24, 28, 1.5);
  for (const intervals of [[0.1], [0.1, 0.1, 0.0625, 0.1, 1 / 12, 0.05]]) {
    const waves = make();
    waves.update(0, state(motion(0)), pose);
    for (let t = 0, frame = 0; t < 6 - 1e-9; frame++) {
      t = Math.min(6, t + intervals[frame % intervals.length]);
      waves.update(t, state(motion(t)), pose);
      assertFinite(waves, 'Low frame rate');
    }
    assert.equal(waves.stats().steps, reference.stats().steps, 'Long frames must not drop simulated time');
    const sampled = values(waves, 20, 73, -24, 28, 1.5);
    const error = rms(sampled.map((h, i) => h - expected[i]));
    assert(error < Math.max(0.002, rms(expected) * 0.18), `Low-frame-rate surface RMS error ${error}`);
  }
});

console.log('PASS all hull-wave behaviour checks');
