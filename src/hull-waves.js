// Hull-driven free-surface waves, in metres. No renderer or THREE dependency.
// A linear shallow-water finite-volume solver transports height through face fluxes:
//   eta_t = -div(q) + B_t, q_t = -g * depth * grad(eta).
// B is the submerged hull volume per square metre. Its change pushes water ahead
// of the moving hull and draws water into the vacated footprint. The resulting
// crests/troughs then travel independently of the boat, including after it stops.
// A fine moving grid resolves the hull; a broad, slowly recentered grid carries
// the long wake away from it. Both are bounded shallow-water approximations.
window.CB90 = window.CB90 || {};
CB90.createHullWaves = function (options) {
  'use strict';
  options = options || {};
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const smooth = (lo, hi, value) => {
    const v = clamp((value - lo) / (hi - lo), 0, 1); return v * v * (3 - 2 * v);
  };
  const size = Math.round(clamp(finite(options.size, 256), 48, options._farField ? 512 : 256));
  const cell = clamp(finite(options.cell, .75), .35, 4);
  const count = size * size, span = (size - 1) * cell;
  const speed = clamp(finite(options.waveSpeed, 4.8), 1, 8), speed2 = speed * speed;
  // The 2-D Courant bound is c*dt/dx < 1/sqrt(2), including custom grid options.
  const fixedDt = Math.min(options._farField ? 1 / 15 : 1 / 60, cell / (speed * 2));
  const recenterDistance = clamp(finite(options.recenterDistance, 12), cell, span * .22);
  const height = new Float32Array(count), fluxX = new Float32Array(count), fluxZ = new Float32Array(count);
  const displacement = new Float32Array(count), depth = new Float32Array(count);
  const coeffX = new Float32Array(count), coeffZ = new Float32Array(count);
  const sponge = new Float32Array(count), scratch = new Float32Array(count);
  const origin = { x: 0, z: 0 };
  const blendOrigin = { x: 0, z: 0 };
  // The broad layer is an independently resolved low-frequency approximation
  // of the same displacement source, not a second additive wake. Blending the
  // two resolutions lets outward waves survive beyond the fine grid's sponge.
  const farField = options._farField || options.farField === false ? null : CB90.createHullWaves({
    _farField: true, size: 512, cell: 3, waveSpeed: speed, recenterDistance: 24
  });
  const fallback = [
    { x: 0, keelY: -.8, keelZ: 0, chineY: -.25, chineZ: 1.5, deckY: 1.1, deckZ: 1.65 },
    { x: 3, keelY: -.8, keelZ: 0, chineY: -.21, chineZ: 1.64, deckY: 1.16, deckZ: 1.83 },
    { x: 6, keelY: -.8, keelZ: 0, chineY: -.14, chineZ: 1.68, deckY: 1.34, deckZ: 1.9 },
    { x: 9, keelY: -.8, keelZ: 0, chineY: .05, chineZ: 1.6, deckY: 1.34, deckZ: 1.88 },
    { x: 11.5, keelY: -.69, keelZ: 0, chineY: .16, chineZ: 1.36, deckY: 1.32, deckZ: 1.67 },
    { x: 12.5, keelY: -.32, keelZ: 0, chineY: .25, chineZ: 1.04, deckY: 1.29, deckZ: 1.4 },
    { x: 13, keelY: 0, keelZ: .01, chineY: .29, chineZ: .88, deckY: 1.27, deckZ: 1.21 },
    { x: 14.87, keelY: .97, keelZ: .46, chineY: 1.01, chineZ: .49, deckY: 1.1, deckZ: .52 }
  ];
  const stations = CB90.STATIONS && CB90.STATIONS.length > 1 ? CB90.STATIONS : fallback;
  // Pre-interpolate the shell profile once; source rasterization allocates no objects.
  const profileStep = .125, profile = [];
  for (let x = 0, k = 0; x <= 15.125; x += profileStep) {
    while (k < stations.length - 2 && stations[k + 1].x < x) k++;
    const a = stations[k], b = stations[k + 1], f = clamp((x - a.x) / (b.x - a.x), 0, 1), p = {};
    for (const key of ['keelY', 'keelZ', 'chineY', 'chineZ', 'deckY', 'deckZ']) p[key] = a[key] + (b[key] - a[key]) * f;
    profile.push(p);
  }
  const edgeWidth = Math.min(18, size / 6);
  const blendStart = Math.min((edgeWidth + 6) * cell + recenterDistance, span * .23);
  const blendEnd = Math.min(blendStart + 24 * cell, span * .38);
  // Coarse cells need enough area samples to integrate a three-metre-wide hull
  // at every sub-cell position; four point samples can miss it completely.
  const areaSamples = options._farField ? 6 : 2;
  // Weak open-water drag: preserve travelling swell for minutes. This damps
  // height AND momentum, so .004/s means an energy half-life of about 87 s.
  // The edge sponge and nonlinear crest breaking remain independent safeguards.
  const waterDrag = .004;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const edge = Math.min(i, j, size - 1 - i, size - 1 - j);
    const edgeAmount = Math.max(0, 1 - edge / edgeWidth);
    sponge[j * size + i] = Math.exp(-fixedDt * (waterDrag + 5 * edgeAmount * edgeAmount));
  }
  let world = null, initialized = false, lastTime = null, simulationTime = null;
  let previous = null, sourcePose = null, sourceBounds = null, active = false;
  let revision = 0, steps = 0;

  function snapshot(nav, pose) {
    nav = nav || {}; pose = pose || {};
    return { x: finite(nav.x, 0), z: finite(nav.z, 0), heading: finite(nav.heading, 0), speed: finite(nav.speed, 0),
      heave: clamp(finite(pose.heave, 0), -1.5, 1.5), pitch: clamp(finite(pose.pitch, 0), -.35, .35),
      roll: clamp(finite(pose.roll, 0), -.45, .45), pivotX: finite(pose.pivotX, 6) };
  }
  function readDepth(x, z) {
    if (!world) return speed2 / 9.81;
    const ground = world.height(x, z);
    return Number.isFinite(ground) && ground < -.03 ? Math.min(speed2 / 9.81, Math.max(.05, -ground)) : 0;
  }
  function coefficients() {
    const scale = 9.81 * fixedDt / cell;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const k = j * size + i, d = depth[k];
      // No flux through dry land. Shallow water slows waves before they reach shore.
      coeffX[k] = i < size - 1 && d > 0 && depth[k + 1] > 0 ? Math.min(d, depth[k + 1]) * scale : 0;
      coeffZ[k] = j < size - 1 && d > 0 && depth[k + size] > 0 ? Math.min(d, depth[k + size]) * scale : 0;
    }
  }
  function bounds(pose) {
    const c = Math.cos(pose.heading), s = Math.sin(pose.heading);
    const cx = pose.x + 7 * c, cz = pose.z - 7 * s;
    const rx = 8 * Math.abs(c) + 4 * Math.abs(s) + cell;
    const rz = 8 * Math.abs(s) + 4 * Math.abs(c) + cell;
    return { i0: clamp(Math.floor((cx - rx - origin.x) / cell), 1, size - 2),
      i1: clamp(Math.ceil((cx + rx - origin.x) / cell), 1, size - 2),
      j0: clamp(Math.floor((cz - rz - origin.z) / cell), 1, size - 2),
      j1: clamp(Math.ceil((cz + rz - origin.z) / cell), 1, size - 2) };
  }
  function column(x, z, pose, sinPitch, sinRoll) {
    if (x < -.5 || x > 15 || Math.abs(z) > 3) return 0;
    const px = Math.max(0, x) / profileStep, n = Math.min(profile.length - 2, Math.floor(px));
    const a = profile[n], b = profile[n + 1], f = px - n, az = Math.abs(z);
    const kz = a.keelZ + (b.keelZ - a.keelZ) * f, ky = a.keelY + (b.keelY - a.keelY) * f;
    const cz = a.chineZ + (b.chineZ - a.chineZ) * f, cy = a.chineY + (b.chineY - a.chineY) * f;
    const dz = a.deckZ + (b.deckZ - a.deckZ) * f, dy = a.deckY + (b.deckY - a.deckY) * f;
    if (az >= dz) return 0;
    const bottom = az <= kz ? ky : az < cz ? ky + (cy - ky) * (az - kz) / (cz - kz) : cy + (dy - cy) * (az - cz) / (dz - cz);
    // The same buoyancy pivot and sign convention as boat-motion.js. Raised bow
    // and planing heave naturally reduce immersion, without a throttle-based wake.
    const waterline = -pose.heave - (x - pose.pivotX) * sinPitch + z * sinRoll;
    return clamp(waterline - bottom, 0, dy - bottom) * smooth(-.5, .35, x);
  }
  function rasterize(pose, prime) {
    const next = bounds(pose), old = sourceBounds || next;
    const i0 = Math.min(next.i0, old.i0), i1 = Math.max(next.i1, old.i1);
    const j0 = Math.min(next.j0, old.j0), j1 = Math.max(next.j1, old.j1);
    const c = Math.cos(pose.heading), s = Math.sin(pose.heading);
    const sp = Math.sin(pose.pitch), sr = Math.sin(pose.roll);
    let changed = false;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * size + i;
      let volume = 0;
      if (depth[k] > 0 && i >= next.i0 && i <= next.i1 && j >= next.j0 && j <= next.j1) {
        const wx = origin.x + i * cell - pose.x, wz = origin.z + j * cell - pose.z;
        // Area samples smooth sub-cell hull movement and conserve both the
        // positive leading and negative trailing displacement sources.
        for (let a = 0; a < areaSamples; a++) for (let b = 0; b < areaSamples; b++) {
          const dx = wx + ((a + .5) / areaSamples - .5) * cell;
          const dz = wz + ((b + .5) / areaSamples - .5) * cell;
          volume += column(dx * c - dz * s, dx * s + dz * c, pose, sp, sr) / (areaSamples * areaSamples);
        }
      }
      // Round before differencing: an unchanged footprint is exactly source-free.
      volume = Math.fround(volume);
      const change = volume - displacement[k];
      displacement[k] = volume;
      if (!prime && change !== 0) { height[k] += change; changed = true; }
    }
    sourcePose = pose; sourceBounds = next;
    return changed;
  }
  function reset(nav, pose) {
    if (farField) farField.reset(nav, pose);
    previous = snapshot(nav, pose); sourcePose = null; sourceBounds = null;
    const c = Math.cos(previous.heading), s = Math.sin(previous.heading);
    origin.x = Math.round((previous.x + 6 * c - span / 2) / cell) * cell;
    origin.z = Math.round((previous.z - 6 * s - span / 2) / cell) * cell;
    blendOrigin.x = previous.x + 6 * c - span / 2;
    blendOrigin.z = previous.z - 6 * s - span / 2;
    height.fill(0); fluxX.fill(0); fluxZ.fill(0); displacement.fill(0);
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) depth[j * size + i] = readDepth(origin.x + i * cell, origin.z + j * cell);
    coefficients(); rasterize(previous, true);
    initialized = true; active = false; lastTime = null; simulationTime = null; steps = 0; revision++;
    return api;
  }
  function recenter(pose) {
    const x = pose.x + 6 * Math.cos(pose.heading), z = pose.z - 6 * Math.sin(pose.heading);
    // Texture origins snap to whole cells, but the resolution transition tracks
    // the hull continuously. Otherwise every grid shift changes an entire band
    // of already-emitted waves in a single frame.
    if (blendOrigin.x !== x - span / 2 || blendOrigin.z !== z - span / 2) {
      blendOrigin.x = x - span / 2; blendOrigin.z = z - span / 2;
      if (farField) revision++;
    }
    if (Math.max(Math.abs(x - origin.x - span / 2), Math.abs(z - origin.z - span / 2)) <= recenterDistance) return;
    const ox = Math.round((x - span / 2) / cell) * cell, oz = Math.round((z - span / 2) / cell) * cell;
    const dx = Math.round((ox - origin.x) / cell), dz = Math.round((oz - origin.z) / cell);
    // Shift all dynamic state by an INTEGER number of cells. Surviving waves keep
    // their world positions and velocities instead of moving along with the hull.
    for (const field of [height, fluxX, fluxZ, displacement, depth]) {
      scratch.set(field); field.fill(0);
      for (let j = Math.max(0, -dz); j < Math.min(size, size - dz); j++) {
        const lo = Math.max(0, -dx), hi = Math.min(size, size - dx);
        if (lo < hi) field.set(scratch.subarray((j + dz) * size + lo + dx, (j + dz) * size + hi + dx), j * size + lo);
      }
    }
    origin.x = ox; origin.z = oz;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      if (i + dx < 0 || i + dx >= size || j + dz < 0 || j + dz >= size) depth[j * size + i] = readDepth(ox + i * cell, oz + j * cell);
    }
    coefficients(); sourceBounds = sourcePose ? bounds(sourcePose) : null; revision++;
  }
  function propagate() {
    let peak = 0;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const k = j * size + i;
      const h = height[k];
      // Linear waves otherwise resonate unrealistically when hull speed matches
      // wave speed. Breaking removes momentum from large/steep crests, not water
      // volume; small outward ripples retain their natural propagation and decay.
      if (coeffX[k]) {
        const dh = height[k + 1] - h;
        const breaking = 4 * Math.max(0, Math.max(Math.abs(h), Math.abs(height[k + 1])) - .45) + 3 * Math.max(0, Math.abs(dh) / cell - .35);
        fluxX[k] = (fluxX[k] - coeffX[k] * dh) * sponge[k] / (1 + fixedDt * breaking);
      } else fluxX[k] = 0;
      if (coeffZ[k]) {
        const dh = height[k + size] - h;
        const breaking = 4 * Math.max(0, Math.max(Math.abs(h), Math.abs(height[k + size])) - .45) + 3 * Math.max(0, Math.abs(dh) / cell - .35);
        fluxZ[k] = (fluxZ[k] - coeffZ[k] * dh) * sponge[k] / (1 + fixedDt * breaking);
      } else fluxZ[k] = 0;
    }
    const scale = fixedDt / cell;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const k = j * size + i;
      if (i === 0 || j === 0 || i === size - 1 || j === size - 1 || depth[k] === 0) { height[k] = 0; continue; }
      height[k] = (height[k] - scale * (fluxX[k] - fluxX[k - 1] + fluxZ[k] - fluxZ[k - size])) * sponge[k];
      peak = Math.max(peak, Math.abs(height[k]), Math.abs(fluxX[k]) / speed, Math.abs(fluxZ[k]) / speed);
    }
    active = peak > 1e-5;
    if (!active) { height.fill(0); fluxX.fill(0); fluxZ.fill(0); }
    revision++;
  }
  function updateLocal(t, state, pose) {
    if (!Number.isFinite(t) || !state || !state.nav) return api;
    const current = snapshot(state.nav, pose);
    if (!initialized) reset(state.nav, pose);
    if (lastTime === null) { lastTime = simulationTime = t; previous = current; return api; }
    if (state.paused) { lastTime = t; simulationTime = t; previous = current; return api; }
    const dt = t - lastTime;
    if (dt === 0) return api;
    const travel = Math.hypot(current.x - previous.x, current.z - previous.z);
    if (dt < 0 || dt > 1 || travel > Math.max(24, Math.max(Math.abs(current.speed), Math.abs(previous.speed)) * dt * 3 + 6)) {
      reset(state.nav, pose); lastTime = simulationTime = t; return api;
    }
    recenter(current);
    const turn = Math.atan2(Math.sin(current.heading - previous.heading), Math.cos(current.heading - previous.heading));
    while (simulationTime + fixedDt <= t + 1e-9) {
      simulationTime += fixedDt;
      const f = clamp((simulationTime - lastTime) / dt, 0, 1), p = {};
      for (const key of ['x', 'z', 'speed', 'heave', 'pitch', 'roll', 'pivotX']) p[key] = previous[key] + (current[key] - previous[key]) * f;
      p.heading = previous.heading + turn * f;
      const changed = rasterize(p, false);
      if (changed || active) propagate();
      steps++;
    }
    lastTime = t; previous = current;
    return api;
  }
  function update(t, state, pose) {
    updateLocal(t, state, pose);
    if (farField) farField.update(t, state, pose);
    return api;
  }
  function sampleLocal(x, z) {
    if (!initialized || !Number.isFinite(x) || !Number.isFinite(z)) return 0;
    const gx = (x - origin.x) / cell, gz = (z - origin.z) / cell;
    if (gx < 0 || gz < 0 || gx >= size - 1 || gz >= size - 1) return 0;
    const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j, k = j * size + i;
    return (height[k] * (1 - u) + height[k + 1] * u) * (1 - v) + (height[k + size] * (1 - u) + height[k + size + 1] * u) * v;
  }
  function sample(x, z) {
    if (!farField) return sampleLocal(x, z);
    if (!initialized || !Number.isFinite(x) || !Number.isFinite(z)) return 0;
    const edge = Math.min(x - blendOrigin.x, z - blendOrigin.z, blendOrigin.x + span - x, blendOrigin.z + span - z);
    const weight = smooth(blendStart, blendEnd, edge);
    if (weight === 1) return sampleLocal(x, z);
    const broad = farField.sampleLocal(x, z);
    return broad + (sampleLocal(x, z) - broad) * weight;
  }
  function stats() {
    let min = 0, max = 0, energy = 0, volume = 0, sourceVolume = 0;
    for (let k = 0; k < count; k++) {
      const h = height[k]; min = Math.min(min, h); max = Math.max(max, h); volume += h; sourceVolume += displacement[k];
      energy += h * h + (fluxX[k] * fluxX[k] + fluxZ[k] * fluxZ[k]) / speed2;
    }
    return { min, max, maxAbsHeight: Math.max(-min, max), energy: energy * cell * cell, volume: volume * cell * cell,
      sourceVolume: sourceVolume * cell * cell, steps, active, revision, origin: { x: origin.x, z: origin.z },
      far: farField ? farField.stats() : null };
  }
  function setWorld(next) {
    if (farField) farField.setWorld(next);
    world = next && typeof next.height === 'function' ? next : null;
    initialized = false; active = false; lastTime = simulationTime = null;
    height.fill(0); fluxX.fill(0); fluxZ.fill(0); displacement.fill(0); revision++;
    return api;
  }
  const api = { update, reset, sample, sampleLocal, sampleHeight: sample, stats, setWorld, height, size, cell, span, origin,
    farField, blendOrigin, blendStart, blendEnd,
    get revision() { return revision; } };
  return api;
};
