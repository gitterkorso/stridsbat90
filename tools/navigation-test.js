#!/usr/bin/env node
// Deterministic handling checks: node tools/navigation-test.js
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = { window: {} };
context.window = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/navigation.js'), 'utf8'), context);
const make = (terrain = [], start) => {
  const state = { enginesOn: true, engineP: 0, engineS: 0, helm: 0, paused: false };
  return { state, control: context.CB90.createNavigation(state, terrain, start) };
};
function run(test, seconds, dt = 1 / 60, check) {
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i++) { test.control.step(dt); if (check) check(test.control.nav); }
  return test.control.nav;
}
function close(actual, expected, message, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} versus ${expected}`);
}
function snapshot(nav) { return JSON.parse(JSON.stringify(nav)); }
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }

// Sample the actual hull footprint independently of the navigation collision helper.
// Six lateral samples every 0.25 m cover the chines, centreline and full beam.
function assertHullClear(nav, islands) {
  const beamStations = [[0, 1.65], [3, 1.83], [6, 1.9], [9, 1.88], [12, 1.6], [13.5, 1.25], [14.9, 0.58]];
  const c = Math.cos(nav.heading), s = Math.sin(nav.heading);
  for (let x = 0; x <= 14.9; x += 0.25) {
    const i = beamStations.findIndex(station => station[0] >= x);
    const hi = beamStations[Math.max(1, i)], lo = beamStations[Math.max(1, i) - 1];
    const beam = lo[1] + (hi[1] - lo[1]) * (x - lo[0]) / (hi[0] - lo[0]);
    for (const lateral of [-1, -0.5, 0, 0.5, 1]) {
      const localZ = lateral * beam;
      const worldX = nav.x + c * x + s * localZ;
      const worldZ = nav.z - s * x + c * localZ;
      for (const island of islands) {
        const r = ((worldX - island.x) / island.rx) ** 2 + ((worldZ - island.z) / island.rz) ** 2;
        assert.ok(r >= 1 - 1e-9, `Hull penetrated island at ${worldX.toFixed(2)}, ${worldZ.toFixed(2)} (ellipse ${r.toFixed(5)})`);
      }
    }
  }
}

test('Initial rest and engines off produce no movement', () => {
  const t = make(); const initial = snapshot(t.control.nav);
  run(t, 4);
  assert.deepEqual(snapshot(t.control.nav), initial);
  t.state.engineP = t.state.engineS = 1; t.state.enginesOn = false;
  run(t, 4);
  assert.deepEqual(snapshot(t.control.nav), initial);
});

test('Equal forward power accelerates straight ahead and records travelled distance', () => {
  const t = make(); t.state.engineP = t.state.engineS = 1;
  const nav = run(t, 12);
  assert.ok(nav.speed > 15 && nav.speed <= 23.15);
  assert.ok(nav.x > 100 && nav.x < 250);
  close(nav.z, 0, 'Equal thrust has no sideways movement');
  close(nav.heading, 0, 'Equal thrust has no yaw');
  close(nav.distance, nav.x, 'Distance equals straight forward travel');
});

test('Signed reverse power brakes forward motion before producing astern motion', () => {
  const t = make(); t.state.engineP = t.state.engineS = 1;
  run(t, 8); const aheadSpeed = t.control.nav.speed;
  t.state.engineP = t.state.engineS = -1;
  run(t, 1);
  assert.ok(t.control.nav.speed > 0 && t.control.nav.speed < aheadSpeed, 'Reverse must first brake inertia');
  run(t, 24); const asternX = t.control.nav.x, distance = t.control.nav.distance;
  assert.ok(t.control.nav.speed < -3 && t.control.nav.speed >= -7.2);
  run(t, 2);
  assert.ok(t.control.nav.x < asternX && t.control.nav.distance > distance);
});

test('Port and starboard helm produce mirror-image turns in the boat coordinate frame', () => {
  const port = make(), starboard = make();
  for (const t of [port, starboard]) t.state.engineP = t.state.engineS = 0.65;
  port.state.helm = -20; starboard.state.helm = 20;
  run(port, 8); run(starboard, 8);
  assert.ok(port.control.nav.heading > 0 && port.control.nav.z < 0);
  assert.ok(starboard.control.nav.heading < 0 && starboard.control.nav.z > 0);
  close(port.control.nav.heading, -starboard.control.nav.heading, 'Opposite helm yaw');
  close(port.control.nav.z, -starboard.control.nav.z, 'Opposite helm lateral travel');
  close(port.control.nav.x, starboard.control.nav.x, 'Opposite helm forward travel');
});

test('Differential engines turn correctly with a centred helm', () => {
  const portStrong = make(), starboardStrong = make();
  portStrong.state.engineP = 1; portStrong.state.engineS = 0.2;
  starboardStrong.state.engineP = 0.2; starboardStrong.state.engineS = 1;
  run(portStrong, 4); run(starboardStrong, 4);
  assert.ok(portStrong.control.nav.heading < -0.1 && portStrong.control.nav.z > 0);
  assert.ok(starboardStrong.control.nav.heading > 0.1 && starboardStrong.control.nav.z < 0);
  close(portStrong.control.nav.heading, -starboardStrong.control.nav.heading, 'Differential engine symmetry');
});

test('Forward collision stops the full hull outside an island and allows reversing away', () => {
  const islands = [{ x: 62, z: 0, rx: 18, rz: 26 }], t = make(islands);
  t.state.engineP = t.state.engineS = 1;
  let hit = false;
  run(t, 15, 0.1, nav => { hit ||= nav.collision; assertHullClear(nav, islands); });
  assert.ok(hit && t.control.nav.collision, 'Collision should be reported while pushing into shore');
  close(t.control.nav.speed, 0, 'Grounding stops the boat');
  const impactX = t.control.nav.x;
  t.state.engineP = t.state.engineS = -1;
  run(t, 8, 0.1, nav => assertHullClear(nav, islands));
  assert.ok(t.control.nav.x < impactX - 10 && !t.control.nav.collision);
});

test('A turning hull cannot sweep sideways into an elliptical shoreline', () => {
  const islands = [{ x: 43, z: 24, rx: 22, rz: 16 }], t = make(islands);
  t.state.engineP = t.state.engineS = 0.85; t.state.helm = 19;
  let hit = false;
  run(t, 22, 0.1, nav => { hit ||= nav.collision; assertHullClear(nav, islands); });
  assert.ok(hit, 'Test course must actually encounter the island');
});

test('Fixed substeps give stable results at 10 FPS and 60 FPS', () => {
  const slow = make(), fast = make();
  for (const t of [slow, fast]) { t.state.engineP = 0.9; t.state.engineS = 0.65; t.state.helm = -11; }
  run(slow, 12, 0.1); run(fast, 12, 1 / 60);
  for (const key of ['x', 'z', 'heading', 'speed', 'yawRate', 'distance']) {
    close(slow.control.nav[key], fast.control.nav[key], `Frame-rate-independent ${key}`);
  }
});

test('Pause preserves motion state; reset clears controls, travel and collision state', () => {
  const t = make(); t.state.engineP = 1; t.state.engineS = 0.6; t.state.helm = 12;
  run(t, 6); t.state.paused = true; const moving = snapshot(t.control.nav);
  run(t, 5, 0.1);
  assert.deepEqual(snapshot(t.control.nav), moving);
  t.state.paused = false; run(t, 0.5);
  assert.ok(t.control.nav.distance > moving.distance);
  t.control.nav.collision = true; t.control.nav.collisionTime = 2;
  t.control.reset();
  assert.deepEqual(snapshot(t.control.nav), snapshot(make().control.nav));
  assert.equal(t.state.engineP, 0); assert.equal(t.state.engineS, 0); assert.equal(t.state.helm, 0);
  run(t, 2);
  assert.equal(t.control.nav.distance, 0);
});

// ---- Heightfield terrain (procedural archipelago path): terrain = { height(x, z) } in metres, negative below sea level.
const heightfield = fn => ({ height: fn });
const slope = heightfield((x, z) => x / 40 - 5);                        // shore line at x = 200, 0.8 m of water at x = 168
const bump = heightfield((x, z) => 6 * Math.exp(-((x - 90) ** 2 + (z - 30) ** 2) / (2 * 18 ** 2)) - 5); // a round skerry
const hullPoint = (nav, x, lateral) => {
  const beamStations = [[0, 1.65], [3, 1.83], [6, 1.9], [9, 1.88], [12, 1.6], [13.5, 1.25], [14.9, 0.58]];
  const i = beamStations.findIndex(station => station[0] >= x), hi = beamStations[Math.max(1, i)], lo = beamStations[Math.max(1, i) - 1];
  const beam = lo[1] + (hi[1] - lo[1]) * (x - lo[0]) / (hi[0] - lo[0]);
  const c = Math.cos(nav.heading), s = Math.sin(nav.heading), localZ = lateral * beam;
  return [nav.x + c * x + s * localZ, nav.z - s * x + c * localZ];
};
function assertHullAfloat(nav, terrain) {
  for (let x = 0; x <= 14.9; x += 0.25) for (const lateral of [-1, -0.5, 0, 0.5, 1]) {
    const [wx, wz] = hullPoint(nav, x, lateral);
    assert.ok(terrain.height(wx, wz) < 0, `Hull on dry land at ${wx.toFixed(2)}, ${wz.toFixed(2)}`);
  }
}

test('Heightfield: the boat runs aground when the bow reaches about 0.8 m of water, and never climbs the shore', () => {
  const t = make(slope); t.state.engineP = t.state.engineS = 1;
  let hit = false;
  run(t, 20, 0.1, nav => { hit ||= nav.collision; assertHullAfloat(nav, slope); });
  const nav = t.control.nav;
  assert.ok(hit && nav.collision, 'Grounding should be reported while pushing onto the slope');
  close(nav.speed, 0, 'Grounding stops the boat');
  const bowDepth = -slope.height(...hullPoint(nav, 14.9, 0));
  assert.ok(bowDepth > 0.8 && bowDepth < 1.05, `Bow should stop in roughly 0.8-1.0 m of water, got ${bowDepth.toFixed(2)} m`);
  assert.ok(nav.depth > 0.9 && nav.depth < 1.4, `Sounding at midships should be a little deeper than the bow: ${nav.depth}`);
  close(nav.underKeel, nav.depth - 0.8, 'Under-keel clearance is depth minus draught', 1e-9);
});

test('Heightfield: reversing frees a grounded boat and clears the alarm', () => {
  const t = make(slope); t.state.engineP = t.state.engineS = 1;
  run(t, 20, 0.1);
  assert.ok(t.control.nav.collision);
  const impactX = t.control.nav.x;
  t.state.engineP = t.state.engineS = -1;
  run(t, 8, 0.1, nav => assertHullAfloat(nav, slope));
  assert.ok(t.control.nav.x < impactX - 10 && !t.control.nav.collision, 'Boat should back away into deeper water');
  assert.ok(t.control.nav.underKeel > 0.8, 'Clearance grows again in deeper water');
});

test('Heightfield: a beam point touches a skerry alongside before the centreline does', () => {
  const t = make(bump); t.state.engineP = t.state.engineS = 0.9;
  // Course 090 passes just south of the skerry centre (z = 30): the starboard chine reaches it first.
  t.control.nav.z = 30 - 1.71 - 4;
  let hit = false;
  run(t, 12, 0.05, nav => { hit ||= nav.collision; assertHullAfloat(nav, bump); });
  assert.ok(hit, 'The turning skerry must be hit by the hull side');
  const nav = t.control.nav;
  const centreDepth = -bump.height(...hullPoint(nav, 7.5, 0)), starboardDepth = -bump.height(...hullPoint(nav, 7.5, 0.9));
  assert.ok(starboardDepth < centreDepth, 'The grounded side is the shallow side');
  assert.ok(nav.x < 90, 'Boat stopped before passing the skerry');
});

test('Heightfield: depth and under-keel clearance are finite, clamped and follow the sounding under the hull centre', () => {
  const t = make(slope, { x: 40, z: 5, heading: 0 });
  const nav = t.control.nav;
  close(nav.depth, -slope.height(47.5, 5), 'Initial sounding at midships');
  close(nav.underKeel, nav.depth - 0.8, 'Initial clearance');
  t.state.engineP = t.state.engineS = 0.7;
  run(t, 6, 0.1, n => { assert.ok(Number.isFinite(n.depth) && Number.isFinite(n.underKeel) && n.underKeel >= 0 && n.depth >= n.underKeel); });
  close(nav.depth, -slope.height(nav.x + 7.5, nav.z), 'Sounding tracks the boat');
  const dry = make(heightfield(() => 3)).control.nav;
  assert.equal(dry.depth, 0); assert.equal(dry.underKeel, 0);
  const legacy = make([]).control.nav;
  assert.equal(legacy.depth, 99); close(legacy.underKeel, 98.2, 'Legacy islands report a deep, finite sounding');
});

test('Start position and heading are honoured by the initial state, reset and setTerrain', () => {
  const start = { x: -28.28, z: -28.28, heading: -1.309 };
  const t = make(slope, start);
  close(t.control.nav.x, start.x, 'start x'); close(t.control.nav.z, start.z, 'start z'); close(t.control.nav.heading, start.heading, 'start heading');
  t.state.engineP = t.state.engineS = 1; t.state.helm = 8;
  run(t, 8);
  assert.ok(Math.hypot(t.control.nav.x - start.x, t.control.nav.z - start.z) > 30, 'Boat must have left the start');
  t.control.reset();
  close(t.control.nav.x, start.x, 'reset x'); close(t.control.nav.z, start.z, 'reset z'); close(t.control.nav.heading, start.heading, 'reset heading');
  assert.equal(t.control.nav.speed, 0); assert.equal(t.control.nav.distance, 0); assert.equal(t.state.helm, 0);
  const elsewhere = { x: 500, z: -120, heading: 2 };
  t.control.setTerrain(bump, elsewhere);
  close(t.control.nav.x, start.x, 'setTerrain alone does not move the boat');
  close(t.control.nav.depth, -bump.height(start.x + Math.cos(start.heading) * 7.5, start.z - Math.sin(start.heading) * 7.5), 'Sounding switches to the new terrain');
  t.control.reset();
  close(t.control.nav.x, elsewhere.x, 'reset uses the new start'); close(t.control.nav.heading, elsewhere.heading, 'reset heading uses the new start');
  t.control.setTerrain([]);
  assert.equal(t.control.nav.depth, 99, 'Legacy terrain restores the constant sounding');
});
console.log(`${passed} navigation checks passed (including heightfield).`);
