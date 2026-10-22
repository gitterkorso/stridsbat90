#!/usr/bin/env node
// Procedural archipelago checks: node tools/archipelago-test.js
// Loads src/archipelago.js the way the browser does (plain script on window.CB90) and verifies determinism,
// plausible land cover, a safe start, a usable survey (names, lights, rocks, fairway) and the chart readouts.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Supply native Math: VM global proxy lookup otherwise dominates this timing check.
const context = { Math, performance: { now: () => Date.now() }, console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/archipelago.js'), 'utf8'), context, { filename: 'archipelago.js' });
const browserAPI = context.CB90 && context.CB90.Archipelago;
// Time native execution, not VM proxy overhead; verify the browser entry point matches it.
const A = require('../src/archipelago.js');
assert.ok(browserAPI);
assert.equal(browserAPI.create(90848).height(123,456),A.create(90848).height(123,456));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`PASS ${name}`); } catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); } }
const close = (a, b, message, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${message}: ${a} versus ${b}`);
// Deterministic sample points independent of the world's own generator.
function samplePoints(n, extent) { let s = 12345; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; const pts = []; for (let i = 0; i < n; i++) pts.push([(rnd() * 2 - 1) * extent, (rnd() * 2 - 1) * extent]); return pts; }

let world, start, home;
test('The module exposes CB90.Archipelago with the documented API', () => {
  assert.ok(A, 'CB90.Archipelago is missing');
  assert.equal(typeof A.create, 'function'); assert.equal(typeof A.DEFAULT_SEED, 'number');
  for (const fn of ['geo', 'formatLat', 'formatLon', 'lightOn']) assert.equal(typeof A[fn], 'function', fn);
  assert.ok(Array.isArray(A.LIGHT_CHARS) && A.LIGHT_CHARS.length > 0);
  world = A.create(A.DEFAULT_SEED);
  for (const fn of ['height', 'depth', 'isLand', 'createSampler', 'findStart', 'survey', 'surveyJob', 'islandName', 'waterName', 'chartName']) assert.equal(typeof world[fn], 'function', fn);
  assert.equal(world.seed, A.DEFAULT_SEED);
});

test('The same seed reproduces identical heights and another seed gives a different world', () => {
  const pts = samplePoints(200, 3000);
  const a = A.create(A.DEFAULT_SEED), b = A.create(A.DEFAULT_SEED), c = A.create(A.DEFAULT_SEED + 1);
  let differ = 0;
  for (const [x, z] of pts) {
    assert.equal(a.height(x, z), b.height(x, z), `Heights differ at ${x}, ${z}`);
    if (Math.abs(a.height(x, z) - c.height(x, z)) > 1e-6) differ++;
  }
  assert.ok(differ > 150, `Another seed should change most heights, changed ${differ} of 200`);
  assert.equal(a.chartName().name, b.chartName().name);
  assert.deepEqual(a.findStart(), b.findStart());
});

test('Heights are finite over a 4 km square and the land fraction is plausible for a Swedish archipelago', () => {
  let land = 0, n = 0, min = Infinity, max = -Infinity;
  for (let x = -2000; x <= 2000; x += 25) for (let z = -2000; z <= 2000; z += 25) {
    const h = world.height(x, z); assert.ok(Number.isFinite(h), `Non-finite height at ${x}, ${z}`);
    n++; if (h > 0) land++; if (h < min) min = h; if (h > max) max = h;
    assert.equal(world.isLand(x, z), h > 0); close(world.depth(x, z), Math.max(0, -h), 'depth is the negative height');
  }
  const fraction = land / n;
  assert.ok(fraction > 0.15 && fraction < 0.6, `Land fraction ${fraction.toFixed(3)} outside 15-60 %`);
  assert.ok(max > 5 && max < 80, `Highest point ${max.toFixed(1)} m`); assert.ok(min < -10 && min > -200, `Deepest point ${min.toFixed(1)} m`);
});

test('findStart gives deep water at the start, clear water within 45 m and a heading towards open water', () => {
  start = world.findStart();
  for (const key of ['x', 'z', 'heading', 'clearAhead']) assert.ok(Number.isFinite(start[key]), key);
  assert.ok(world.depth(start.x, start.z) >= 5, `Start depth ${world.depth(start.x, start.z)}`);
  let shallowest = Infinity;
  for (let r = 0; r <= 45; r += 2.5) for (let q = 0; q < 48; q++) { const a = q / 48 * Math.PI * 2; shallowest = Math.min(shallowest, world.depth(start.x + Math.cos(a) * r, start.z + Math.sin(a) * r)); }
  assert.ok(shallowest >= 2, `Water within 45 m of the start is only ${shallowest.toFixed(2)} m deep`);
  assert.ok(start.clearAhead >= 200, `Only ${start.clearAhead} m clear ahead`);
  // The boat moves x += cos(heading), z -= sin(heading): the ray ahead must stay navigable for the reported distance.
  for (let d = 10; d <= Math.min(start.clearAhead, 900); d += 10) assert.ok(world.depth(start.x + Math.cos(start.heading) * d, start.z - Math.sin(start.heading) * d) >= 2.5, `Shoal ${d} m ahead of the start`);
});

test('A survey around the start contains named islands, sector lights, rocks, waters and a coherent grid', () => {
  const t0 = Date.now();
  home = world.survey(start.x, start.z, 1800, 6);
  const ms = Date.now() - t0;
  assert.ok(home.done && home.cols === home.rows && home.cols === Math.floor(3600 / 6) + 1, 'Grid dimensions');
  assert.equal(home.H.length, home.cols * home.rows); assert.equal(home.D.length, home.H.length);
  for (let k = 0; k < home.H.length; k += 97) assert.ok(Number.isFinite(home.H[k]));
  // Row j is z0 + j * cell, column i is x0 + i * cell.
  close(home.H[home.index(10, 20)], world.height(home.x0 + 10 * 6, home.z0 + 20 * 6), 'Grid layout', 1e-4);
  close(home.heightAt(start.x, start.z), world.height(start.x, start.z), 'heightAt near the start', 0.6);
  const named = home.islands.filter(i => i.name);
  assert.ok(home.islands.length >= 5 && named.length >= 3, `Islands ${home.islands.length}, named ${named.length}`);
  const names = new Set(named.map(i => i.name)); assert.equal(names.size, named.length, 'Island names must be unique');
  for (const isl of home.islands) {
    assert.ok(['L', 'M', 'S', 'skerry'].includes(isl.size)); assert.ok(isl.area > 0 && Number.isFinite(isl.peakX) && isl.peakY > 0, isl.name || 'skerry');
    if (isl.size === 'skerry') assert.equal(isl.name, null); else assert.match(isl.name, /^[A-ZÅÄÖ][a-zåäö]+$/);
  }
  assert.ok(home.lights.length >= 1, 'At least one light');
  for (const L of home.lights) {
    assert.ok(Array.isArray(L.sectors) && L.sectors.length >= 1, 'Sectors');
    let span = 0; for (const s of L.sectors) { assert.ok(['W', 'R', 'X'].includes(s.cls)); assert.ok(s.a1 > s.a0); span += s.a1 - s.a0; }
    close(span, Math.PI * 2, 'Sectors cover the full circle', 1e-6);
    assert.ok(L.char && L.char.per > 0 && Number.isFinite(L.phase) && L.height > 0 && L.range > 0 && typeof L.label === 'string' && Number.isFinite(L.flareDir));
    assert.ok(world.height(L.x, L.z) > -1, 'Light stands on or at the shore');
  }
  assert.ok(home.rocks.length >= 5, `Rocks ${home.rocks.length}`);
  for (const r of home.rocks) assert.ok(r.depth > 0 && r.depth <= 2.5 && world.height(r.x, r.z) < 0.5, 'Rock is an underwater shoal');
  assert.ok(home.waters.length >= 1 && home.waters.every(w => /fjärden|viken|sundet|djupet/.test(w.name)), 'Named waters');
  assert.ok(ms < 3000, `Survey took ${ms} ms`);
});

test('The fairway keeps to the water and its lateral marks stand in more than 2 m of water', () => {
  const fw = home.fairway;
  assert.ok(fw && Array.isArray(fw.path) && fw.path.length >= 20, 'Fairway path');
  for (let i = 0; i < fw.path.length; i++) {
    const [x, z] = fw.path[i];
    assert.ok(world.height(x, z) < 0, `Fairway crosses land at ${x.toFixed(0)}, ${z.toFixed(0)}`);
    if (i > 0) { const [px, pz] = fw.path[i - 1]; const d = Math.hypot(x - px, z - pz); assert.ok(d > 5 && d < 15, `Path spacing ${d.toFixed(1)} m`); }
  }
  assert.ok(fw.marks.length >= 1, 'Lateral marks');
  for (const m of fw.marks) { assert.ok(m.side === 'P' || m.side === 'S'); assert.ok(world.height(m.x, m.z) < -2, `Mark in ${(-world.height(m.x, m.z)).toFixed(2)} m of water`); }
});

test('surveyJob can be sliced and ends with the same result as the synchronous survey', () => {
  const job = world.surveyJob(start.x, start.z, 600, 12);
  let steps = 0; while (!job.step(2)) { steps++; assert.ok(job.progress >= 0 && job.progress <= 1); assert.ok(steps < 100000); }
  assert.equal(job.progress, 1);
  const sync = world.survey(start.x, start.z, 600, 12);
  assert.deepEqual(Array.from(job.result.H.slice(0, 500)), Array.from(sync.H.slice(0, 500)));
  assert.equal(job.result.islands.length, sync.islands.length);
});

test('The cached sampler agrees with the analytic height to within 0.3 m', () => {
  const sampler = world.createSampler(2);
  let worst = 0;
  for (const [x, z] of samplePoints(3000, 1800)) worst = Math.max(worst, Math.abs(sampler.height(x, z) - world.height(x, z)));
  assert.ok(worst < 0.3, `Sampler error ${worst.toFixed(3)} m`);
  close(sampler.depth(start.x, start.z), Math.max(0, -sampler.height(start.x, start.z)), 'sampler depth');
  sampler.clear();
  close(sampler.height(start.x, start.z), world.height(start.x, start.z), 'Sampler after clear', 0.3);
});

test('Chart readouts: names, geographic position and light characteristics', () => {
  const chart = world.chartName();
  assert.ok(chart.no >= 6000 && chart.no < 7000 && /skärgård$/.test(chart.name), JSON.stringify(chart));
  const origin = A.geo(0, 0);
  close(origin.lat, 59 + 20 / 60, 'Origin latitude'); close(origin.lon, 18.75, 'Origin longitude');
  assert.equal(A.formatLat(origin.lat), '59°20.00′N'); assert.equal(A.formatLon(origin.lon), '018°45.00′E');
  const north = A.geo(0, -1852); close(north.lat, origin.lat + 1 / 60, 'One nautical mile north is one minute of latitude');
  const east = A.geo(1852 * Math.cos(origin.lat * Math.PI / 180), 0); close(east.lon, origin.lon + 1 / 60, 'One minute of longitude east', 1e-9);
  assert.equal(A.formatLat(59.5), '59°30.00′N'); assert.equal(A.formatLon(18.05), '018°03.00′E');
  const fl3 = A.LIGHT_CHARS[0];
  assert.equal(fl3.n, 'Fl 3s'); close(fl3.per, 3, 'Fl 3s period');
  assert.equal(A.lightOn(fl3, 0.1), true); assert.equal(A.lightOn(fl3, 1.5), false); assert.equal(A.lightOn(fl3, 3.1), true); assert.equal(A.lightOn(fl3, -0.2), false);
  assert.equal(typeof world.islandName(100, 100, 3e5, new Set()), 'string'); assert.equal(typeof world.waterName(0, 0), 'string');
});

console.log(`${passed} archipelago checks passed; ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
