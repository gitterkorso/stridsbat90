// Procedural Swedish archipelago shared by the 3D world, the handling model and the chart plotters.
// Plain script: no THREE, no DOM. Also loads in Node (module.exports) for tools/archipelago-test.js.
// FRAME: world metres. +X east (boat heading 0 = course 090), +Z south, so -Z is north. Sea level y = 0.
// Everything is a pure function of (seed, x, z): the plotter and the terrain never disagree.
(function (root) {
  'use strict';
  const A = {};
  A.DEFAULT_SEED = 90848;
  A.VERSION = 3;
  // Chart origin (0, 0) is placed in the Stockholm outer archipelago for lat/long readouts.
  A.LAT0 = 59 + 20 / 60; A.LON0 = 18 + 45 / 60;
  A.M_PER_MIN_LAT = 1852; A.M_PER_MIN_LON = 1852 * Math.cos(A.LAT0 * Math.PI / 180);
  const TAU = Math.PI * 2;

  // ---------- deterministic random and gradient noise ----------
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function makeNoise(seed) {
    const rnd = mulberry32(seed); const p = new Uint8Array(512); const base = [];
    for (let i = 0; i < 256; i++) base[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = base[i]; base[i] = base[j]; base[j] = t; }
    for (let i = 0; i < 512; i++) p[i] = base[i & 255];
    const GX = [1, -1, 1, -1, 1, -1, 0, 0], GY = [1, 1, -1, -1, 0, 0, 1, -1];
    return function (x, y) {
      const X = Math.floor(x), Y = Math.floor(y); const xf = x - X, yf = y - Y; const xi = X & 255, yi = Y & 255;
      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      const A0 = p[xi] + yi, B0 = p[xi + 1] + yi;
      const aa = p[A0] & 7, ab = p[A0 + 1] & 7, ba = p[B0] & 7, bb = p[B0 + 1] & 7;
      const n00 = GX[aa] * xf + GY[aa] * yf, n10 = GX[ba] * (xf - 1) + GY[ba] * yf, n01 = GX[ab] * xf + GY[ab] * (yf - 1), n11 = GX[bb] * (xf - 1) + GY[bb] * (yf - 1);
      const x1 = n00 + (n10 - n00) * u, x2 = n01 + (n11 - n01) * u; return x1 + (x2 - x1) * v;
    };
  }
  function fbm(n, x, y, oct, lac, gain) { let a = 1, f = 1, s = 0, norm = 0; for (let i = 0; i < oct; i++) { s += a * n(x * f, y * f); norm += a; a *= gain; f *= lac; } return s / norm; }
  A.mulberry32 = mulberry32; A.makeNoise = makeNoise; A.fbm = fbm;

  // ---------- Swedish place names ----------
  A.PRE = ['Stor', 'Lill', 'Norr', 'Söder', 'Väster', 'Öster', 'Björk', 'Gran', 'Tall', 'Al', 'Ek', 'Rön', 'Grå', 'Svart', 'Vit', 'Röd', 'Lång', 'Bred', 'Hög', 'Käring', 'Gås', 'Svan', 'Örn', 'Trut', 'Häst', 'Ko', 'Får', 'Get', 'Kalv', 'Kyrk', 'Fisk', 'Sten', 'Sand', 'Berg', 'Ask', 'Hamn', 'Sjö', 'Ut', 'Inner', 'Mellan', 'Bränn', 'Kvarn', 'Sälg', 'Vik', 'Torr', 'Näs', 'Lind', 'Furu', 'Ram', 'Ängs', 'Djup', 'Tjock', 'Skarp', 'Själ', 'Vrak', 'Ok'];
  A.SUF_L = ['ön', 'landet', 'ö', 'ön']; A.SUF_M = ['holmen', 'ö', 'holm', 'skäret', 'holmen']; A.SUF_S = ['skär', 'kobben', 'klubben', 'hällan', 'bådan', 'grundet', 'skäret']; A.SUF_W = ['fjärden', 'fjärden', 'viken', 'sundet', 'fjärden', 'djupet'];
  // Light characteristics: p = alternating on/off seconds. per = period.
  A.LIGHT_CHARS = [{ n: 'Fl 3s', p: [.5, 2.5] }, { n: 'Fl(2) 6s', p: [.4, .8, .4, 4.4] }, { n: 'LFl 8s', p: [2, 6] }, { n: 'Iso 4s', p: [2, 2] }, { n: 'Oc 5s', p: [4, 1] }, { n: 'Fl(3) 10s', p: [.4, .8, .4, .8, .4, 7.2] }, { n: 'Q', p: [.5, .5] }, { n: 'Fl(2) 10s', p: [.5, 1, .5, 8] }];
  for (const c of A.LIGHT_CHARS) c.per = c.p.reduce((a, b) => a + b, 0);
  /** True while a light with characteristic ch is lit at time t (seconds). */
  A.lightOn = function (ch, t) { let tt = ((t % ch.per) + ch.per) % ch.per; for (let i = 0; i < ch.p.length; i++) { if (tt < ch.p[i]) return i % 2 === 0; tt -= ch.p[i]; } return false; };

  /** Geographic position of a world point for chart readouts. */
  A.geo = function (x, z) { return { lat: A.LAT0 - z / A.M_PER_MIN_LAT / 60, lon: A.LON0 + x / A.M_PER_MIN_LON / 60 }; };
  A.formatLat = function (lat) { const d = Math.floor(lat); return d + '°' + ((lat - d) * 60).toFixed(2).padStart(5, '0') + '′N'; };
  A.formatLon = function (lon) { const d = Math.floor(lon); return String(d).padStart(3, '0') + '°' + ((lon - d) * 60).toFixed(2).padStart(5, '0') + '′E'; };

  /**
   * A.create(seed, options) -> world. Options (all in metres): L wavelength of the largest islands (1000),
   * sea level offset sea (0.06), depthScale (48), landScale (34), detail (granite lump amplitude, 0.9).
   */
  A.create = function (seed, options) {
    seed = Number.isFinite(seed) && seed >= 0 ? Math.floor(seed) >>> 0 : A.DEFAULT_SEED;
    const o = Object.assign({ L: 1000, sea: 0.06, depthScale: 48, landScale: 34, detail: 0.9 }, options || {});
    const n1 = makeNoise(seed), n2 = makeNoise((seed * 3 + 11) | 0), n3 = makeNoise(seed + 7919), n4 = makeNoise(seed + 104729), n5 = makeNoise(seed + 31337);
    const r = mulberry32(seed * 31 + 7); const ang = (r() * 70 - 35) * Math.PI / 180; const stretch = 1.5 + r() * 0.8;
    const ca = Math.cos(ang), sa = Math.sin(ang), L = o.L, s = o.sea;
    const world = { seed, options: o, angle: ang, stretch };

    const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    const coastPhase=r()*TAU;
    // Broad west-to-east succession, with an irregular boundary rather than straight biome stripes.
    function coast(x,z){return x+420*Math.sin(z/1700+coastPhase)+180*Math.sin(z/610-coastPhase);}
    function exposure(x,z){return smooth(-1200,5200,coast(x,z));}
    function fjord(x,z){
      const center=620*Math.sin(x/1850+coastPhase);
      const width=260+150*(.5+.5*Math.sin(x/1300));
      return Math.max(Math.exp(-Math.pow((z-center)/width,2)),.85*Math.exp(-Math.pow((z-center-2600)/420,2)));
    }
    world.habitat=function(x,z){const e=exposure(x,z);return {exposure:e,forest:Math.pow(1-e,1.6)};};
    world.biome=function(x,z){const e=exposure(x,z),offshore=smooth(4800,8000,coast(x,z)),bay=fjord(x,z);
      return {exposure:e,forest:Math.pow(1-e,1.6),fjord:bay,offshore,
        name:offshore>.8?'Öppet hav':e>.72?'Ytterskärgård':bay>.65?'Fjärd':e<.25?'Innerskärgård':'Mellanskärgård'};
    };

    /** Unitless field; values above world.options.sea are land. */
    function field(wx, wz, e, coastal, broad) {
      if(coastal===undefined)coastal=coast(wx,wz);
      if(e===undefined)e=smooth(-1200,5200,coastal);
      const x = (wx * ca - wz * sa) / (L * stretch), y = (wx * sa + wz * ca) / L;
      const qx = fbm(n3, x * 0.8, y * 0.8, 3, 2, 0.5), qy = fbm(n4, x * 0.8 + 5.2, y * 0.8 + 1.3, 3, 2, 0.5);
      const px = x + 0.55 * qx, py = y + 0.55 * qy;
      let v = fbm(n1, px, py, broad ? 3 : 6, 2.1, 0.52) * 1.9;
      v += 0.32 * fbm(n2, x * 4.5, y * 4.5, broad ? 1 : 3, 2, 0.5) * 1.9;      // holmar och skär
      if (!broad) v += 0.10 * fbm(n5, x * 11, y * 11, 2, 2, 0.5) * 1.9;        // små kobbar och undervattensgrund
      const inner=1-smooth(-2500,1200,coastal);
      // Low, fragmented granite skerries outside; larger wooded islands inside.
      v=v*(1-.42*e)+.20*inner-.13*e;
      v-=fjord(wx,wz)*.58;
      v-=smooth(4800,8000,coastal)*1.3;
      return v;
    }
    /** Terrain height in metres at world (x, z): negative below sea level (depth = -height), positive on land. */
    function height(wx, wz) {
      const coastal=coast(wx,wz),exposed=smooth(-1200,5200,coastal);
      const v = field(wx, wz,exposed,coastal) - s;
      if (v <= 0) return v * o.depthScale;
      const t = v / (1 - s);
      // Compass-aligned shore aspect: +X/-X faces are cliffs, +/-Z faces are
      // gently polished slabs. Sample across 48 m to ignore individual cracks.
      const dx = field(wx + 24, wz, undefined, undefined, true) - field(wx - 24, wz, undefined, undefined, true);
      const dz = field(wx, wz + 24, undefined, undefined, true) - field(wx, wz - 24, undefined, undefined, true);
      const eastWest = dx * dx / (dx * dx + dz * dz + 0.0004);
      const cliff = smooth(.2, .8, eastWest);
      let e = o.landScale * (1-.62*exposed) * Math.pow(t, 0.88) * (.82 + .18 * cliff);
      // Rise quickly inland of east/west shores, then blend back into the crown.
      // Zero at sea level preserves the coast and the existing underwater shoals.
      e += o.landScale * .32 * (1-.62*exposed) * cliff * smooth(0, .065, v) * Math.exp(-v / .32);
      // Weathered granite lumps fade in a few metres above the shoreline so the coast itself stays clean.
      const fade = Math.min(1, e / 4);
      e += fade * o.detail * fbm(n5, wx * 0.045, wz * 0.018, 3, 2.2, 0.5) * (.35 + 1.95 * cliff);
      return e;
    }
    const depth = (x, z) => Math.max(0, -height(x, z));
    const isLand = (x, z) => height(x, z) > 0;
    /** Stable hash of a quantised world position; used for names and light characteristics. */
    function hash2(x, z) { let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; }
    Object.assign(world, { field, height, depth, isLand, hash2 });

    // ---------- names ----------
    /** Island name for an island whose highest point is near world (x, z); area in m². used: Set of taken names. */
    world.islandName = function (x, z, area, used) {
      const hsh = hash2(Math.round(x / 120), Math.round(z / 120));
      const suf = area > 1.2e6 ? A.SUF_L : area > 2.5e5 ? A.SUF_M : A.SUF_S;
      let name = A.PRE[hsh % A.PRE.length] + suf[(hsh >>> 8) % suf.length]; let k = 1;
      while (used && used.has(name)) { name = A.PRE[(hsh + k * 7) % A.PRE.length] + suf[((hsh >>> 8) + k) % suf.length]; k++; }
      if (used) used.add(name); return name;
    };
    world.waterName = function (x, z) { const hsh = hash2(Math.round(x / 400) + 77, Math.round(z / 400) + 77); return A.PRE[hsh % A.PRE.length] + A.SUF_W[(hsh >>> 8) % A.SUF_W.length]; };
    world.chartName = function () { const hsh = hash2(11, 13); const suf = ['ö', 'holms', 'skärs', 'viks', 'hamns', 'sunds', 'näs']; return { no: 6000 + hsh % 999, name: A.PRE[(hsh >>> 3) % A.PRE.length] + suf[(hsh >>> 9) % suf.length] + ' skärgård' }; };

    // ---------- cached bilinear sampler for per-frame queries (handling model, camera, vegetation) ----------
    /** createSampler(cell = 2 m). sampler.height(x, z) interpolates lazily generated 64×64-cell tiles. */
    world.createSampler = function (cell) {
      cell = cell || 2; const N = 64; const tiles = new Map(); const order = [];
      function tile(tx, tz) {
        const key = tx + ',' + tz; let t = tiles.get(key);
        if (t) return t;
        t = new Float32Array((N + 1) * (N + 1));
        const x0 = tx * N * cell, z0 = tz * N * cell;
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) t[j * (N + 1) + i] = height(x0 + i * cell, z0 + j * cell);
        tiles.set(key, t); order.push(key);
        if (order.length > 64) tiles.delete(order.shift());
        return t;
      }
      return {
        cell, tileCells: N,
        height(x, z) {
          const fx = x / cell, fz = z / cell; const tx = Math.floor(fx / N), tz = Math.floor(fz / N);
          const t = tile(tx, tz); let i = fx - tx * N, j = fz - tz * N; const i0 = Math.min(N - 1, Math.floor(i)), j0 = Math.min(N - 1, Math.floor(j));
          const u = i - i0, v = j - j0, r0 = j0 * (N + 1) + i0, r1 = r0 + N + 1;
          return (t[r0] * (1 - u) + t[r0 + 1] * u) * (1 - v) + (t[r1] * (1 - u) + t[r1 + 1] * u) * v;
        },
        depth(x, z) { return Math.max(0, -this.height(x, z)); },
        clear() { tiles.clear(); order.length = 0; }
      };
    };

    // ---------- start position ----------
    /** A safe start in open water near the origin: at least 3.5 m under the keel within 45 m, bow towards open water. */
    world.findStart = function () {
      if (world.start) return world.start;
      let best = null;
      for (let ring = 0; ring <= 60 && !best; ring++) {
        const R = ring * 40, n = ring === 0 ? 1 : ring * 8;
        for (let k = 0; k < n; k++) {
          const a = k / n * TAU, x = Math.cos(a) * R, z = Math.sin(a) * R;
          let ok = depth(x, z) >= 5;
          for (let q = 0; q < 12 && ok; q++) { const b = q / 12 * TAU; for (const rr of [22, 45]) if (depth(x + Math.cos(b) * rr, z + Math.sin(b) * rr) < 3.5) { ok = false; break; } }
          if (ok) { best = { x, z }; break; }
        }
      }
      if (!best) best = { x: 0, z: 0 };
      // Heading: the direction with the longest clear water ray. heading 0 = +X, positive turns toward -Z (north).
      let bestA = 0, bestLen = -1;
      for (let q = 0; q < 24; q++) {
        const a = q / 24 * TAU; let len = 0;
        for (let d = 10; d <= 900; d += 10) { if (depth(best.x + Math.cos(a) * d, best.z + Math.sin(a) * d) < 2.5) break; len = d; }
        if (len > bestLen) { bestLen = len; bestA = a; }
      }
      world.start = { x: Math.round(best.x * 100) / 100, z: Math.round(best.z * 100) / 100, heading: -bestA, clearAhead: bestLen };
      return world.start;
    };

    // ---------- survey: a regular grid of heights and the chart features derived from it ----------
    /**
     * world.survey(cx, cz, half, cell, opts) -> survey. Synchronous. See world.surveyJob for a sliced version.
     * survey = { cx, cz, half, cell, x0, z0, cols, rows, H: Float32Array(rows*cols) heights in metres (row j = z0 + j*cell),
     *   D: Float32Array distance to land in cells, islands: [{x, z, area, name, size:'L'|'M'|'S'|'skerry', peakX, peakZ, edge}],
     *   waters: [{x, z, name}], rocks: [{x, z, depth}], lights: [{x, z, char, sectors:[{cls:'W'|'R'|'X', a0, a1}], label, height, range, phase, flareDir}],
     *   fairway: {path: [[x, z], ...], marks: [{x, z, side:'P'|'S'}]} | null,
     *   heightAt(x, z) bilinear from H, index(i, j) }
     * Angles in sectors are screen/world angles: 0 = +X (east), positive towards +Z (south), like Math.atan2(dz, dx).
     */
    world.survey = function (cx, cz, half, cell, opts) { const job = world.surveyJob(cx, cz, half, cell, opts); while (!job.step(1e9)); return job.result; };
    world.surveyJob = function (cx, cz, half, cell, opts) {
      opts = opts || {}; cell = cell || 6; half = half || 1800;
      const cols = Math.floor(2 * half / cell) + 1, rows = cols; const x0 = cx - half, z0 = cz - half;
      const H = new Float32Array(cols * rows); let row = 0; let phase = 0;
      const S = { cx, cz, half, cell, x0, z0, cols, rows, H, D: null, islands: [], waters: [], rocks: [], lights: [], fairway: null, done: false };
      S.index = (i, j) => j * cols + i;
      S.heightAt = function (x, z) {
        const fx = (x - x0) / cell, fz = (z - z0) / cell; let i = Math.floor(fx), j = Math.floor(fz);
        i = Math.max(0, Math.min(cols - 2, i)); j = Math.max(0, Math.min(rows - 2, j));
        const u = Math.max(0, Math.min(1, fx - i)), v = Math.max(0, Math.min(1, fz - j)); const r0 = j * cols + i, r1 = r0 + cols;
        return (H[r0] * (1 - u) + H[r0 + 1] * u) * (1 - v) + (H[r1] * (1 - u) + H[r1 + 1] * u) * v;
      };
      const job = { result: S, progress: 0 };
      /** step(ms): work for about ms milliseconds; returns true when finished. */
      job.step = function (ms) {
        const t0 = now();
        if (phase === 0) {
          while (row < rows) { const z = z0 + row * cell; for (let i = 0; i < cols; i++) H[row * cols + i] = height(x0 + i * cell, z); row++; if (now() - t0 > ms) { job.progress = row / rows * 0.8; return false; } }
          phase = 1;
        }
        if (phase === 1) { S.D = distToLand(S); findIslands(S, opts); phase = 2; job.progress = 0.85; if (now() - t0 > ms) return false; }
        if (phase === 2) { findRocks(S); findWaters(S); pickLights(S); phase = 3; job.progress = 0.92; if (now() - t0 > ms) return false; }
        if (phase === 3) { if (opts.fairway !== false) S.fairway = findFairway(S); phase = 4; S.done = true; job.progress = 1; }
        return true;
      };
      return job;
    };
    function now() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }

    function distToLand(S) {
      const { H, cols, rows } = S; const D = new Float32Array(cols * rows);
      for (let k = 0; k < D.length; k++) D[k] = H[k] > 0 ? 0 : 1e6;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i; let d = D[k]; if (d === 0) continue;
        if (i > 0) d = Math.min(d, D[k - 1] + 1); if (j > 0) { d = Math.min(d, D[k - cols] + 1); if (i > 0) d = Math.min(d, D[k - cols - 1] + 1.414); if (i < cols - 1) d = Math.min(d, D[k - cols + 1] + 1.414); } D[k] = d; }
      for (let j = rows - 1; j >= 0; j--) for (let i = cols - 1; i >= 0; i--) { const k = j * cols + i; let d = D[k]; if (d === 0) continue;
        if (i < cols - 1) d = Math.min(d, D[k + 1] + 1); if (j < rows - 1) { d = Math.min(d, D[k + cols] + 1); if (i < cols - 1) d = Math.min(d, D[k + cols + 1] + 1.414); if (i > 0) d = Math.min(d, D[k + cols - 1] + 1.414); } D[k] = d; }
      return D;
    }
    function findIslands(S, opts) {
      const { H, cols, rows, cell, x0, z0 } = S; const label = new Int32Array(cols * rows).fill(-1); const stack = []; const used = new Set(); const list = [];
      for (let k0 = 0; k0 < H.length; k0++) {
        if (H[k0] <= 0 || label[k0] >= 0) continue;
        const id = list.length; const I = { id, n: 0, sx: 0, sz: 0, peak: k0, minI: cols, maxI: 0, minJ: rows, maxJ: 0, edge: false };
        stack.length = 0; stack.push(k0); label[k0] = id;
        while (stack.length) {
          const k = stack.pop(); const i = k % cols, j = (k - i) / cols; I.n++; I.sx += i; I.sz += j; if (H[k] > H[I.peak]) I.peak = k;
          if (i < I.minI) I.minI = i; if (i > I.maxI) I.maxI = i; if (j < I.minJ) I.minJ = j; if (j > I.maxJ) I.maxJ = j;
          if (i === 0 || j === 0 || i === cols - 1 || j === rows - 1) I.edge = true;
          if (i > 0) { const m = k - 1; if (label[m] < 0 && H[m] > 0) { label[m] = id; stack.push(m); } }
          if (i < cols - 1) { const m = k + 1; if (label[m] < 0 && H[m] > 0) { label[m] = id; stack.push(m); } }
          if (j > 0) { const m = k - cols; if (label[m] < 0 && H[m] > 0) { label[m] = id; stack.push(m); } }
          if (j < rows - 1) { const m = k + cols; if (label[m] < 0 && H[m] > 0) { label[m] = id; stack.push(m); } }
        }
        list.push(I);
      }
      S.label = label;
      list.sort((a, b) => b.n - a.n);
      for (const I of list) {
        const pi = I.peak % cols, pj = (I.peak - pi) / cols; const area = I.n * cell * cell;
        const isl = { id: I.id, area, n: I.n, x: x0 + I.sx / I.n * cell, z: z0 + I.sz / I.n * cell, peakX: x0 + pi * cell, peakZ: z0 + pj * cell, peakY: H[I.peak], edge: I.edge, minI: I.minI, maxI: I.maxI, minJ: I.minJ, maxJ: I.maxJ };
        isl.size = area > 1.2e6 ? 'L' : area > 2.5e5 ? 'M' : area >= 1.5e4 ? 'S' : 'skerry';
        isl.name = isl.size === 'skerry' ? null : world.islandName(isl.peakX, isl.peakZ, area, used);
        S.islands.push(isl);
      }
    }
    function findRocks(S) {
      const { H, D, cols, rows, cell, x0, z0 } = S; const pts = [];
      for (let j = 2; j < rows - 2; j++) for (let i = 2; i < cols - 2; i++) {
        const k = j * cols + i; const v = H[k]; if (v > 0) continue; const d = -v; if (d > 2.2 || d < 0.15) continue; if (D[k] < 3) continue;
        let mx = true; for (let dj = -1; dj <= 1 && mx; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; if (H[k + dj * cols + di] > v) { mx = false; break; } }
        if (!mx) continue; const x = x0 + i * cell, z = z0 + j * cell;
        if (pts.some(p => Math.abs(p.x - x) < 6 * cell && Math.abs(p.z - z) < 6 * cell)) continue;
        pts.push({ x, z, depth: d });
      }
      S.rocks = pts;
    }
    function findWaters(S) {
      const { D, cols, rows, cell, x0, z0 } = S; const taken = [];
      for (let t = 0; t < 3; t++) {
        let bk = -1, bd = 14;
        for (let j = 4; j < rows - 4; j += 2) for (let i = 4; i < cols - 4; i += 2) { const k = j * cols + i; const d = D[k]; if (d <= bd) continue; const x = x0 + i * cell, z = z0 + j * cell; if (taken.some(p => Math.hypot(p.x - x, p.z - z) < 900)) continue; bd = d; bk = k; }
        if (bk < 0) break; const i = bk % cols, j = (bk - i) / cols; const x = x0 + i * cell, z = z0 + j * cell; const w = { x, z, name: world.waterName(x, z), clear: bd * cell }; taken.push(w); S.waters.push(w);
      }
    }
    function lightSectors(S, L) {
      const { H, cols, rows, label } = S; const bins = 24, step = TAU / bins; const arr = [];
      for (let b = 0; b < bins; b++) {
        const ang = (b + 0.5) * step; let cls = 'W';
        for (let r = 3; r <= 34; r += 1.5) {
          const ii = Math.round(L.ci + Math.cos(ang) * r), jj = Math.round(L.cj + Math.sin(ang) * r); if (ii < 0 || jj < 0 || ii >= cols || jj >= rows) break; const k = jj * cols + ii;
          if (H[k] > 0) { cls = (label[k] === L.id && r < 8) ? 'X' : 'R'; break; } if (-H[k] < 6) { cls = 'R'; break; }
        }
        arr.push(cls);
      }
      let start = 0; while (start < bins && arr[start] === arr[(start + bins - 1) % bins]) start++;
      if (start === bins) return [{ cls: arr[0], a0: 0, a1: TAU }];
      const out = []; let rs = 0, cur = arr[start];
      for (let k = 1; k <= bins; k++) { const cls = k < bins ? arr[(start + k) % bins] : null; if (cls !== cur) { out.push({ cls: cur, a0: (start + rs) * step, a1: (start + k) * step }); rs = k; cur = cls; } }
      return out;
    }
    function pickLights(S) {
      const { H, cols, rows, cell, x0, z0, label } = S; const cands = [];
      for (const I of S.islands) {
        if (I.n < 5 || I.area > 4e5 || I.edge) continue; const pi = Math.round((I.peakX - x0) / cell), pj = Math.round((I.peakZ - z0) / cell);
        let wc = 0, tc = 0; for (let dj = -16; dj <= 16; dj += 2) for (let di = -16; di <= 16; di += 2) { if (di * di + dj * dj > 256) continue; const ii = pi + di, jj = pj + dj; if (ii < 0 || jj < 0 || ii >= cols || jj >= rows) continue; tc++; if (H[jj * cols + ii] <= 0) wc++; }
        const hsh = hash2(Math.round(I.peakX / 90) + 5, Math.round(I.peakZ / 90) + 5);
        cands.push({ I, score: wc / tc + ((hsh % 1000) / 1000) * 0.35, hsh, pi, pj });
      }
      cands.sort((a, b) => b.score - a.score); const picked = []; const maxLights = Math.max(2, Math.round(S.half / 700));
      for (const c of cands) {
        if (picked.length >= maxLights || c.score < 0.78) break; const I = c.I;
        if (Math.abs(I.peakX - S.cx) > S.half - 200 || Math.abs(I.peakZ - S.cz) > S.half - 200) continue;
        if (picked.some(p => Math.hypot(p.x - I.peakX, p.z - I.peakZ) < 900)) continue;
        let best = null, bestE = -1;
        for (let j = I.minJ; j <= I.maxJ; j++) for (let i = I.minI; i <= I.maxI; i++) {
          const k = j * cols + i; if (label[k] !== I.id) continue;
          if (!((i > 0 && H[k - 1] <= 0) || (i < cols - 1 && H[k + 1] <= 0) || (j > 0 && H[k - cols] <= 0) || (j < rows - 1 && H[k + cols] <= 0))) continue;
          let e = 0; for (let dj = -6; dj <= 6; dj += 2) for (let di = -6; di <= 6; di += 2) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= cols || jj >= rows) continue; if (H[jj * cols + ii] <= 0) e++; }
          if (e > bestE) { bestE = e; best = [i, j]; }
        }
        if (!best) continue; const ch = A.LIGHT_CHARS[c.hsh % A.LIGHT_CHARS.length];
        // Put the tower one cell inland from the most exposed shore cell so it stands on rock.
        const L = { x: x0 + best[0] * cell, z: z0 + best[1] * cell, ci: best[0], cj: best[1], id: I.id, island: I.name, char: ch, phase: (c.hsh % 997) / 997 * ch.per, height: 8 + (c.hsh >>> 4) % 22, range: 5 + (c.hsh >>> 9) % 12 };
        L.sectors = lightSectors(S, L);
        const W = L.sectors.filter(x => x.cls === 'W').sort((a, b) => (b.a1 - b.a0) - (a.a1 - a.a0))[0]; L.flareDir = W ? (W.a0 + W.a1) / 2 : -Math.PI / 4;
        const tok = ch.n.split(' '); const code = L.sectors.some(x => x.cls === 'R') ? 'WR' : 'W';
        L.label = [tok[0], code].concat(tok.slice(1), [L.height + 'm', L.range + 'M']).join(' ');
        picked.push(L);
      }
      S.lights = picked;
    }
    // Deepest practical route across the survey square (west to east, else north to south) and its lateral marks.
    function findFairway(S) {
      const { H, D, cols, rows, cell, x0, z0 } = S; const F = 2; const cw = Math.floor(cols / F), ch = Math.floor(rows / F); const cost = new Float32Array(cw * ch);
      for (let cj = 0; cj < ch; cj++) for (let ci = 0; ci < cw; ci++) {
        const k = (cj * F) * cols + ci * F; const v = H[k]; const dl = D[k];
        if (v > 0) { cost[cj * cw + ci] = Infinity; continue; } const d = -v; let c = d < 3 ? 30 : d < 6 ? 8 : d < 10 ? 2.4 : d < 15 ? 1.4 : 1; if (dl < 1.5) c += 60; else if (dl < 3) c += 12; else if (dl < 6) c += 3; cost[cj * cw + ci] = c;
      }
      const u = cell * F; const margin = 3; const c0 = margin, c1 = cw - 1 - margin, r0 = margin, r1 = ch - 1 - margin;
      const rng = (a, b, f) => { const o = []; for (let t = a; t <= b; t++) o.push(f(t)); return o; };
      const tries = [
        { A: rng(r0 + 4, r1 - 4, cj => cj * cw + c0), B: new Set(rng(r0 + 4, r1 - 4, cj => cj * cw + c1)), h: n => Math.abs(c1 - (n % cw)) },
        { A: rng(c0 + 4, c1 - 4, ci => r0 * cw + ci), B: new Set(rng(c0 + 4, c1 - 4, ci => r1 * cw + ci)), h: n => Math.abs(r1 - Math.floor(n / cw)) }];
      for (const t of tries) {
        const starts = t.A.filter(k => cost[k] !== Infinity); if (!starts.length) continue;
        const p = astar(cost, cw, ch, starts, n => t.B.has(n), t.h); if (!p || p.length < 20) continue;
        const pts = chaikin(p.map(n => { const x = n % cw; return [x0 + x * u, z0 + (n - x) / cw * u]; }), 2);
        const path = resample(pts, 10);
        return { path, marks: lateralMarks(S, path) };
      }
      return null;
    }
    function astar(cost, cw, ch, starts, isGoal, hf) {
      const N = cw * ch; const g = new Float32Array(N).fill(Infinity); const came = new Int32Array(N).fill(-1); const closed = new Uint8Array(N); const heap = [];
      const push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; const t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; } };
      const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; const t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m; } } return top; };
      for (const st of starts) { g[st] = 0; push(hf(st), st); }
      const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], DC = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142]; let exp = 0, goal = -1;
      while (heap.length) {
        const top = pop(); const n = top[1]; if (closed[n]) continue; closed[n] = 1; if (isGoal(n)) { goal = n; break; } if (++exp > 400000) return null; const x = n % cw, y = (n - x) / cw;
        for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue; const m = ny * cw + nx; if (closed[m]) continue; const c = cost[m]; if (c === Infinity) continue; const ng = g[n] + (c + cost[n]) * 0.5 * DC[d]; if (ng < g[m]) { g[m] = ng; came[m] = n; push(ng + hf(m), m); } }
      }
      if (goal < 0) return null; const path = []; for (let n = goal; n !== -1; n = came[n]) path.push(n); path.reverse(); return path;
    }
    function chaikin(pts, iter) { for (let t = 0; t < iter; t++) { const out = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; out.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } out.push(pts[pts.length - 1]); pts = out; } return pts; }
    function resample(pts, step) { const out = [pts[0]]; let carry = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L === 0) continue; let d = step - carry; while (d <= L) { const t = d / L; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += step; } carry = L - (d - step); } return out; }
    /** Port (red) marks on the left of the direction of travel, starboard (green) on the right, where shoals close in. */
    function lateralMarks(S, path) {
      const out = []; const sp = 12; // a station every 120 m along the route
      for (let i = sp; i < path.length - sp; i += sp) {
        const p = path[i], a = path[i - 2], b = path[i + 2]; let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
        for (const side of ['P', 'S']) {
          const nx = side === 'P' ? tz : -tz, nz = side === 'P' ? -tx : tx; let hit = -1;
          for (let d = 15; d <= 160; d += 5) { const hv = S.heightAt(p[0] + nx * d, p[1] + nz * d); if (hv > -3) { hit = d; break; } }
          if (hit < 0) continue; const bd = Math.max(12, Math.min(hit - 8, hit * 0.6)); const x = p[0] + nx * bd, z = p[1] + nz * bd;
          if (S.heightAt(x, z) > -2.5) continue; if (out.some(o => Math.hypot(o.x - x, o.z - z) < 110)) continue;
          out.push({ x, z, side });
        }
        if (out.length >= 40) break;
      }
      return out;
    }
    return world;
  };

  root.CB90 = root.CB90 || {}; root.CB90.Archipelago = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
