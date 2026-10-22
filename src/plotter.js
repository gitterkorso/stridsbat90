// CB90 H – live chart plotters (sjökort) for the two wheelhouse navigation displays. Plain script; requires
// THREE (r128) and archipelago.js. A north-up raster chart tile is drawn from a world.survey() in sliced steps and
// then, on every redraw, composed boat-centred (head-up or north-up) with constant-size vector symbols onto one
// canvas texture shared by both screens. The drawing follows docs/research/skargardskortet-reference.html with
// heights in metres (survey.H > 0 is land, soundings are -H).
// FRAME: world metres, +X east, +Z south (north is -Z). Canvas: x right, y down, so a north-up chart maps world
// (x, z) straight to (right, down). nav.heading is the boat's Y rotation: forward = (cos h, -sin h) in (x, z).
window.CB90 = window.CB90 || {};
CB90.createPlotter = function (THREE, world, state, screens, options) {
  'use strict';
  const A = CB90.Archipelago, TAU = Math.PI * 2, NM = 1852;
  const o = Object.assign({ tilePx: 2048, nearHalf: 1800, nearCell: 6, farHalf: 7200, farCell: 24 }, options || {});
  const W = 1024, H = 408, BAR = 52, PAD = 6;                              // screen canvas, same aspect as the 0.652 × 0.259 m plane
  const WIN = { x: PAD, y: PAD, w: W - 2 * PAD, h: H - BAR - PAD - 2 };   // chart window; the information bar sits below it
  const RANGES = [0.25, 0.5, 1, 2];                                       // nautical miles from the screen centre to the top edge
  const SERIF = 'Georgia, "Times New Roman", serif', SANS = '-apple-system, "Helvetica Neue", Arial, sans-serif', MONO = 'ui-monospace, Menlo, Consolas, monospace';
  // Night palette of the reference chart: this is an emissive screen in a dim wheelhouse.
  const P = { deep: '#0e1a27', w10: '#132436', w6: '#193049', w3: '#213d5c', land: '#35392b', coast: '#c9c2a3', contour: '#5b88b3', contour20: '#3f6486',
    sound: '#9fb6ca', name: '#ece6d2', water: '#8fb8d8', magenta: '#ff62c5', red: '#ff6b5e', green: '#5ed47a', yellow: '#ffd964', ink: '#ece6d2', rose: '#8d99a5',
    fairway: '#e4e0d4', nodata: '#0a1420', bezel: '#000000', bar: '#0a121a', ui: '#d9e4e6', dim: '#7d95a1', warn: '#ff5a4a', hull: '#0b1418',
    track: 'rgba(238,244,232,0.6)', ring: 'rgba(190,214,232,0.3)', glowW: '255,240,180', glowR: '255,110,95' };

  // ---------- canvas, texture and screens (all optional so the plotter also constructs headless) ----------
  const canvas = typeof document !== 'undefined' && document.createElement ? document.createElement('canvas') : null;
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  const ok = !!ctx;
  if (canvas) { canvas.width = W; canvas.height = H; }
  let texture = null;
  if (ok && THREE && THREE.CanvasTexture) {
    texture = new THREE.CanvasTexture(canvas); texture.encoding = THREE.sRGBEncoding; texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.anisotropy = 4;
  }
  (screens || []).forEach(mesh => {
    const m = mesh && mesh.material; if (!m) return;
    if (texture) { m.map = texture; if (m.color && m.color.set) m.color.set(0xffffff); }
    m.needsUpdate = true; mesh.castShadow = false;
  });

  // ---------- state ----------
  let range = 0.5, orientation = 'head', dirty = true, lastDraw = -Infinity, lastT = 0, meta = null, start = null;
  const view = { ppm: 0, rot: 0, cx: 0, cy: 0, cr: 1, sr: 0 };   // last screen transform (read by tests and the UI)
  const stats = { draws: 0, tiles: 0, surveys: 0 };
  const pt = { x: 0, y: 0 }, dash = [0, 0], NODASH = [], DASH_SECTOR = [5, 5];
  const sv = (v, d) => v.toFixed(d).replace('.', ',');
  const pad3 = n => (n < 10 ? '00' : n < 100 ? '0' : '') + n;
  const fmtRange = r => r < 1 ? sv(r, 2).replace(/0$/, '') : sv(r, r % 1 ? 1 : 0);
  const clock = () => typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

  // Near tile: ±1800 m at 6 m (the working chart). Far tile: ±7200 m at 24 m, bands and coast only, for the 1–2 M ranges.
  const near = { kind: 'near', half: o.nearHalf, cell: o.nearCell, trigger: 1000, canvas: null, S: null, ready: false, x0: 0, z0: 0, size: 0, rocks: [], tiny: [], lights: [], marks: [], path: null };
  const far = { kind: 'far', half: o.farHalf, cell: o.farCell, trigger: 4000, canvas: null, S: null, ready: false, x0: 0, z0: 0, size: 0, rocks: [], tiny: [], lights: [], marks: [], path: null };
  const spare = []; let work = null, bandBuf = null, bandU32 = null;
  const LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  function packed(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return LE ? (255 << 24 | b << 16 | g << 8 | r) >>> 0 : (r << 24 | g << 16 | b << 8 | 255) >>> 0; }
  const BANDS = [packed(P.land), packed(P.w3), packed(P.w6), packed(P.w10), packed(P.deep)];

  // Track: positions sampled every ~10 m in a ring buffer of the last 400 samples.
  const TRACK = 400; const trk = new Float32Array(TRACK * 2); let trkN = 0, trkHead = 0, trkX = 0, trkZ = 0;
  function sampleTrack(nav) {
    if (trkN && Math.hypot(nav.x - trkX, nav.z - trkZ) > 150) trkN = trkHead = 0;   // teleport (reset): start a fresh track
    if (trkN && Math.hypot(nav.x - trkX, nav.z - trkZ) < 10) return;
    trk[trkHead * 2] = nav.x; trk[trkHead * 2 + 1] = nav.z; trkHead = (trkHead + 1) % TRACK; if (trkN < TRACK) trkN++; trkX = nav.x; trkZ = nav.z;
  }

  // ---------- background work: sliced surveys and tile builds, one step per update ----------
  function newCanvas(px) { const c = document.createElement('canvas'); c.width = px; c.height = px; return c; }
  function stepWork() {
    if (!work) return;
    let done = false;
    try { done = work.step(); } catch (e) { if (typeof console !== 'undefined') console.error('plotter: ' + (e && e.message || e)); work = null; return; }
    if (done) { const w = work; work = null; w.finish(); }
  }
  function startSurvey(tile, cx, cz) {
    const job = world.surveyJob(cx, cz, tile.half, tile.cell, tile.kind === 'far' ? { fairway: false } : undefined);
    stats.surveys++;
    work = { kind: 'survey', tile, progress: () => job.progress * 0.8, step: () => job.step(3), finish: () => startTileBuild(tile, job.result) };
  }
  function startTileBuild(tile, S) {
    const b = tileSteps(tile, S); const total = b.steps.length;
    work = { kind: 'tile', tile, progress: () => 0.8 + 0.2 * (1 - b.steps.length / total), step() { const f = b.steps.shift(); if (f) f(); return b.steps.length === 0; }, finish() { swapIn(tile, b.T); } };
  }
  function swapIn(tile, T) {
    if (tile.canvas) spare.push(tile.canvas);
    const S = T.S;
    tile.canvas = T.canvas; tile.S = S; tile.x0 = S.x0; tile.z0 = S.z0; tile.size = T.size; tile.ready = true;
    tile.rocks = S.rocks; tile.tiny = S.islands.filter(I => I.n <= 3); tile.lights = S.lights;
    tile.marks = S.fairway ? S.fairway.marks : []; tile.path = S.fairway ? S.fairway.path : null;
    stats.tiles++; dirty = true;
  }
  function stale(tile, nav) { return !tile.S || Math.hypot(nav.x - tile.S.cx, nav.z - tile.S.cz) > tile.trigger; }
  function checkTriggers(nav) {
    if (work) return;
    if (stale(near, nav)) startSurvey(near, nav.x, nav.z);
    else if (stale(far, nav)) startSurvey(far, nav.x, nav.z);
  }
  function dropTiles() { work = null; for (const tile of [near, far]) { tile.S = null; tile.ready = false; tile.rocks = []; tile.tiny = []; tile.lights = []; tile.marks = []; tile.path = null; } trkN = trkHead = 0; }
  function adopt(w) {
    world = w; meta = world.chartName ? world.chartName() : { no: 0, name: '' };
    start = world.start || (world.findStart ? world.findStart() : { x: 0, z: 0, heading: 0 });
    if (!(world.home && world.home.done)) world.home = world.survey(start.x, start.z, o.nearHalf, o.nearCell);
    if (ok) startTileBuild(near, world.home);
  }

  // ---------- raster tile ----------
  function tileSteps(tile, S) {
    const px = o.tilePx; const c = spare.pop() || newCanvas(px); const tctx = c.getContext('2d');
    const size = (S.cols - 1) * S.cell, s = px / size, cpx = s * S.cell;   // s = tile px per metre, cpx = tile px per survey cell
    const T = { tile, S, canvas: c, ctx: tctx, px, size, s, cpx, occ: [], coarse: tile.kind === 'far', ci: new Int32Array(px), ct: new Float32Array(px) };
    for (let x = 0; x < px; x++) { const fx = x / cpx; const i = Math.min(S.cols - 2, fx | 0); T.ci[x] = i; T.ct[x] = fx - i; }
    const steps = [], SLICE = 256;
    for (let y = 0; y < px; y += SLICE) steps.push(() => paintBands(T, y, Math.min(px, y + SLICE)));
    if (T.coarse) {
      steps.push(() => drawContour(T, -20, P.contour20, 1)); steps.push(() => drawContour(T, -10, P.contour, 1.1)); steps.push(() => drawContour(T, 0, P.coast, 1.6));
    } else {
      steps.push(() => drawContour(T, -20, P.contour20, 1.1)); steps.push(() => drawContour(T, -10, P.contour, 1.3));
      steps.push(() => drawContour(T, -6, P.contour, 1.3)); steps.push(() => drawContour(T, -3, P.contour, 1.3)); steps.push(() => drawContour(T, 0, P.coast, 2.2));
      steps.push(() => drawSectors(T)); steps.push(() => drawNames(T)); steps.push(() => drawLightLabels(T)); steps.push(() => drawSoundings(T));
    }
    return { T, steps };
  }
  /** Depth bands, bilinear from the survey grid, for tile rows y0..y1 (one slice per frame). */
  function paintBands(T, y0, y1) {
    const S = T.S, px = T.px, cpx = T.cpx, ci = T.ci, ct = T.ct, H = S.H, cols = S.cols, rows = S.rows, n = y1 - y0;
    if (!bandBuf || bandBuf.width !== px || bandBuf.height < n) { bandBuf = T.ctx.createImageData(px, n); bandU32 = new Uint32Array(bandBuf.data.buffer); }
    const u32 = bandU32, L = BANDS[0], B3 = BANDS[1], B6 = BANDS[2], B10 = BANDS[3], D = BANDS[4]; let p = 0;
    for (let y = y0; y < y1; y++) {
      const fy = y / cpx; let j = fy | 0; if (j > rows - 2) j = rows - 2; const ty = fy - j, sy = 1 - ty; const r0 = j * cols, r1 = r0 + cols;
      for (let x = 0; x < px; x++) {
        const i = ci[x], tx = ct[x], k0 = r0 + i, k1 = r1 + i;
        const v = (H[k0] * (1 - tx) + H[k0 + 1] * tx) * sy + (H[k1] * (1 - tx) + H[k1 + 1] * tx) * ty;
        u32[p++] = v > 0 ? L : v > -3 ? B3 : v > -6 ? B6 : v > -10 ? B10 : D;
      }
    }
    T.ctx.putImageData(bandBuf, 0, y0, 0, 0, px, n);
  }
  /** Marching-squares contour of the survey grid at `level` metres, stroked in batches. */
  function drawContour(T, level, color, width) {
    const S = T.S, c = T.ctx, cpx = T.cpx, H = S.H, cols = S.cols, rows = S.rows; let n = 0;
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    const seg = (ax, ay, bx, by) => { c.moveTo(ax * cpx, ay * cpx); c.lineTo(bx * cpx, by * cpx); if (++n >= 4000) { c.stroke(); c.beginPath(); n = 0; } };
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const k = j * cols + i; const a = H[k], b = H[k + 1], cc = H[k + cols + 1], d = H[k + cols];
      const idx = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (cc > level ? 2 : 0) | (d > level ? 1 : 0); if (idx === 0 || idx === 15) continue;
      const tx = i + (level - a) / (b - a), ty = j, rx = i + 1, ry = j + (level - b) / (cc - b), bx = i + (level - d) / (cc - d), by = j + 1, lx = i, ly = j + (level - a) / (d - a);
      switch (idx) {
        case 1: case 14: seg(lx, ly, bx, by); break;
        case 2: case 13: seg(bx, by, rx, ry); break;
        case 3: case 12: seg(lx, ly, rx, ry); break;
        case 4: case 11: seg(tx, ty, rx, ry); break;
        case 6: case 9: seg(tx, ty, bx, by); break;
        case 7: case 8: seg(lx, ly, tx, ty); break;
        case 5: if ((a + b + cc + d) / 4 > level) { seg(lx, ly, tx, ty); seg(bx, by, rx, ry); } else { seg(tx, ty, rx, ry); seg(lx, ly, bx, by); } break;
        case 10: if ((a + b + cc + d) / 4 > level) { seg(tx, ty, rx, ry); seg(lx, ly, bx, by); } else { seg(lx, ly, tx, ty); seg(bx, by, rx, ry); } break;
      }
    }
    c.stroke();
  }
  function free(occ, r, px) {
    if (r.x < 2 || r.y < 2 || r.x + r.w > px - 2 || r.y + r.h > px - 2) return false;
    for (const q of occ) if (r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y) return false;
    return true;
  }
  /** Coloured sector arcs (about 250 m radius) and dashed sector limits for lights with obscured or red sectors. */
  function drawSectors(T) {
    const S = T.S, c = T.ctx, s = T.s, R = 250 * s;
    for (const L of S.lights) {
      const x = (L.x - S.x0) * s, y = (L.z - S.z0) * s; T.occ.push({ x: x - 16, y: y - 16, w: 32, h: 32 });
      if (!L.sectors.some(q => q.cls === 'R')) continue;
      for (const q of L.sectors) {
        if (q.cls === 'X') continue;
        c.beginPath(); c.arc(x, y, R, q.a0, q.a1); c.strokeStyle = q.cls === 'R' ? P.red : P.yellow; c.lineWidth = q.cls === 'W' ? 2.4 : 3.2; c.globalAlpha = 0.9; c.stroke();
      }
      c.globalAlpha = 1; c.setLineDash(DASH_SECTOR); c.strokeStyle = P.rose; c.lineWidth = 1.2;
      for (const q of L.sectors) { c.beginPath(); c.moveTo(x + Math.cos(q.a0) * 18, y + Math.sin(q.a0) * 18); c.lineTo(x + Math.cos(q.a0) * (R + 6), y + Math.sin(q.a0) * (R + 6)); c.stroke(); }
      c.setLineDash(NODASH);
    }
  }
  /** Island names (uppercase serif for large, italic for medium and small) and spaced italic water names. */
  function drawNames(T) {
    const S = T.S, c = T.ctx, s = T.s, occ = T.occ, px = T.px; let count = 0;
    c.textBaseline = 'top'; c.textAlign = 'left';
    for (const I of S.islands) {
      if (!I.name) continue; if (count >= 36) break;
      // Centroids suit the big islands unless the shape is concave; the peak is always on the island.
      const big = I.size !== 'S' && S.heightAt(I.x, I.z) > 0;
      const x = ((big ? I.x : I.peakX) - S.x0) * s, y = ((big ? I.z : I.peakZ) - S.z0) * s;
      let size, spacing, txt = I.name;
      if (I.size === 'L') { size = 38; c.font = '600 38px ' + SERIF; spacing = 5; txt = txt.toUpperCase(); }
      else if (I.size === 'M') { size = 30; c.font = 'italic 600 30px ' + SERIF; spacing = 1.5; }
      else { size = 24; c.font = 'italic 24px ' + SERIF; spacing = 0.8; }
      c.letterSpacing = spacing + 'px'; const tw = c.measureText(txt).width + spacing * txt.length;
      const cands = [[x - tw / 2, y - size / 2], [x - tw / 2, y + 10], [x - tw / 2, y - size - 10], [x + 14, y - size / 2], [x - tw - 14, y - size / 2]];
      for (const cnd of cands) {
        const r = { x: cnd[0] - 3, y: cnd[1] - 2, w: tw + 6, h: size + 5 };
        if (free(occ, r, px)) { occ.push(r); c.fillStyle = P.name; c.fillText(txt, cnd[0], cnd[1]); count++; break; }
      }
    }
    c.font = 'italic 32px ' + SERIF; c.letterSpacing = '7px'; c.textBaseline = 'middle';
    for (const w of S.waters) {
      const x = (w.x - S.x0) * s, y = (w.z - S.z0) * s; const tw = c.measureText(w.name).width + 7 * w.name.length;
      const r = { x: x - tw / 2 - 3, y: y - 20, w: tw + 6, h: 40 };
      if (free(occ, r, px)) { occ.push(r); c.fillStyle = P.water; c.fillText(w.name, x - tw / 2, y); }
    }
    c.letterSpacing = '0px';
  }
  function drawLightLabels(T) {
    const S = T.S, c = T.ctx, s = T.s, occ = T.occ, px = T.px;
    c.font = '500 24px ' + SANS; c.textBaseline = 'top'; c.textAlign = 'left';
    for (const L of S.lights) {
      const x = (L.x - S.x0) * s, y = (L.z - S.z0) * s; const tw = c.measureText(L.label).width;
      const cands = [[x + 22, y - 14], [x - tw - 22, y - 14], [x - tw / 2, y + 22], [x - tw / 2, y - 48]];
      for (const cnd of cands) {
        const r = { x: cnd[0] - 5, y: cnd[1] - 3, w: tw + 10, h: 32 }; if (!free(occ, r, px)) continue; occ.push(r);
        c.fillStyle = 'rgba(14,26,39,0.72)'; c.fillRect(r.x, r.y, r.w, r.h); c.fillStyle = P.name; c.fillText(L.label, cnd[0], cnd[1]); break;
      }
    }
  }
  /** Soundings on a jittered ~150 m lattice: whole metres with subscript decimetres below 20 m, clear of land and labels. */
  function drawSoundings(T) {
    const S = T.S, c = T.ctx, s = T.s, occ = T.occ, px = T.px;
    const rnd = A.mulberry32((world.seed * 7 + 99 + Math.round(S.cx) * 13 + Math.round(S.cz) * 31) | 0); const step = 150 * s;
    c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = P.sound;
    for (let y = step * 0.6; y < px - 10; y += step) for (let x = step * 0.5; x < px - 10; x += step) {
      const qx = x + (rnd() - 0.5) * step * 0.6, qy = y + (rnd() - 0.5) * step * 0.6;
      const wx = S.x0 + qx / s, wz = S.z0 + qy / s; const hv = S.heightAt(wx, wz); if (hv > 0) continue; const d = -hv; if (d < 0.3) continue;
      const i = Math.round((wx - S.x0) / S.cell), j = Math.round((wz - S.z0) / S.cell); if (S.D[j * S.cols + i] < 2.5) continue;
      const whole = Math.floor(d), dec = Math.floor((d - whole) * 10), main = String(whole), showDec = d < 20;
      c.font = '22px ' + SERIF; const mw = c.measureText(main).width, sw = showDec ? 10 : 0;
      const r = { x: qx - mw / 2 - 2, y: qy - 19, w: mw + sw + 4, h: 24 }; if (!free(occ, r, px)) continue; occ.push(r);
      c.fillText(main, qx - mw / 2, qy);
      if (showDec) { c.font = '14px ' + SERIF; c.fillText(String(dec), qx + mw / 2 + 1, qy + 5); }
    }
  }

  // ---------- screen composition ----------
  function toScreen(x, z, nav) { const dx = x - nav.x, dz = z - nav.z; pt.x = view.cx + view.ppm * (dx * view.cr - dz * view.sr); pt.y = view.cy + view.ppm * (dx * view.sr + dz * view.cr); return pt; }
  function inWin(q, m) { return q.x > WIN.x - m && q.x < WIN.x + WIN.w + m && q.y > WIN.y - m && q.y < WIN.y + WIN.h + m; }
  function drawStar(c, x, y, r, fill, edge) {
    c.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = fill; c.fill(); if (edge) { c.strokeStyle = edge; c.lineWidth = 1; c.stroke(); }
  }
  function drawMark(c, x, y, side) {
    c.fillStyle = P.ink; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); c.lineWidth = 1; c.strokeStyle = P.hull;
    if (side === 'P') { c.fillStyle = P.red; c.fillRect(x - 3.5, y - 12, 7, 9); c.strokeRect(x - 3.5, y - 12, 7, 9); }
    else { c.fillStyle = P.green; c.beginPath(); c.moveTo(x, y - 13); c.lineTo(x + 4.2, y - 2.5); c.lineTo(x - 4.2, y - 2.5); c.closePath(); c.fill(); c.stroke(); }
  }
  function field(c, x, label, value, color, blink) {
    c.textAlign = 'left'; c.font = '600 9px ' + SANS; c.fillStyle = blink ? color : P.dim; c.fillText(label, x, H - BAR + 13);
    c.font = '500 17px ' + MONO; c.fillStyle = color || P.ui; c.fillText(value, x, H - BAR + 33);
  }
  function draw(nav, st, t) {
    const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.setLineDash(NODASH); c.lineCap = 'butt'; c.lineJoin = 'miter';
    c.fillStyle = P.bezel; c.fillRect(0, 0, W, H);
    const cx = WIN.x + WIN.w / 2, cy = WIN.y + WIN.h / 2, ppm = (WIN.h / 2) / (range * NM);
    const rot = orientation === 'head' ? nav.heading - Math.PI / 2 : 0;   // head-up: the boat's forward vector (-heading on screen) turns to point up
    view.ppm = ppm; view.rot = rot; view.cx = cx; view.cy = cy; view.cr = Math.cos(rot); view.sr = Math.sin(rot);

    // 1. Raster chart, fairway, track and range ring in the world frame (metres).
    c.save(); c.beginPath(); c.rect(WIN.x, WIN.y, WIN.w, WIN.h); c.clip();
    c.fillStyle = P.nodata; c.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    c.translate(cx, cy); c.rotate(rot); c.scale(ppm, ppm); c.translate(-nav.x, -nav.z);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (far.ready) c.drawImage(far.canvas, far.x0, far.z0, far.size, far.size);
    if (near.ready) c.drawImage(near.canvas, near.x0, near.z0, near.size, near.size);
    if (near.ready && near.path) {
      const p = near.path; c.strokeStyle = P.fairway; c.globalAlpha = 0.7; c.lineWidth = 1.2 / ppm; dash[0] = 10 / ppm; dash[1] = 6 / ppm; c.setLineDash(dash);
      c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.stroke(); c.setLineDash(NODASH); c.globalAlpha = 1;
    }
    if (trkN > 1) {
      c.strokeStyle = P.track; c.lineWidth = 1.6 / ppm; c.beginPath(); const first = trkN < TRACK ? 0 : trkHead;
      for (let k = 0; k < trkN; k++) { const i = ((first + k) % TRACK) * 2; if (k) c.lineTo(trk[i], trk[i + 1]); else c.moveTo(trk[i], trk[i + 1]); }
      c.lineTo(nav.x, nav.z); c.stroke();
    }
    c.strokeStyle = P.ring; c.lineWidth = 1 / ppm; dash[0] = dash[1] = 5 / ppm; c.setLineDash(dash);
    c.beginPath(); c.arc(nav.x, nav.z, range * NM / 2, 0, TAU); c.stroke(); c.setLineDash(NODASH);
    c.restore();

    // 2. Constant-size symbols in the screen frame: rocks, skerries, lateral marks, lights and own ship.
    c.save(); c.beginPath(); c.rect(WIN.x, WIN.y, WIN.w, WIN.h); c.clip();
    if (near.ready) {
      if (range <= 1) {
        c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath();
        for (const r of near.rocks) { const q = toScreen(r.x, r.z, nav); if (!inWin(q, 6)) continue; c.moveTo(q.x - 4, q.y); c.lineTo(q.x + 4, q.y); c.moveTo(q.x, q.y - 4); c.lineTo(q.x, q.y + 4); }
        for (const I of near.tiny) {
          const q = toScreen(I.x, I.z, nav); if (!inWin(q, 6)) continue;
          for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.moveTo(q.x - Math.cos(a) * 3.5, q.y - Math.sin(a) * 3.5); c.lineTo(q.x + Math.cos(a) * 3.5, q.y + Math.sin(a) * 3.5); }
        }
        c.stroke();
      }
      for (const m of near.marks) { const q = toScreen(m.x, m.z, nav); if (inWin(q, 14)) drawMark(c, q.x, q.y, m.side); }
      for (const L of near.lights) {
        const q = toScreen(L.x, L.z, nav); if (!inWin(q, 60)) continue;
        if (A.lightOn(L.char, t + L.phase)) {
          for (const sec of L.sectors) {
            if (sec.cls === 'X') continue; const rgb = sec.cls === 'R' ? P.glowR : P.glowW;
            const g = c.createRadialGradient(q.x, q.y, 2, q.x, q.y, 40); g.addColorStop(0, 'rgba(' + rgb + ',0.75)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
            c.fillStyle = g; c.beginPath(); c.moveTo(q.x, q.y); c.arc(q.x, q.y, 40, sec.a0 + rot, sec.a1 + rot); c.closePath(); c.fill();
          }
          const a = L.flareDir + rot, fx = q.x + Math.cos(a) * 9, fy = q.y + Math.sin(a) * 9, nx = -Math.sin(a), ny = Math.cos(a);
          c.fillStyle = P.magenta; c.globalAlpha = 0.92; c.beginPath(); c.arc(fx, fy, 3.6, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(fx + nx * 3.4, fy + ny * 3.4); c.lineTo(q.x, q.y); c.lineTo(fx - nx * 3.4, fy - ny * 3.4); c.closePath(); c.fill(); c.globalAlpha = 1;
        }
        drawStar(c, q.x, q.y, 6, P.ink, P.hull);
      }
    }
    const phi = rot - nav.heading, cog = nav.speed < 0 ? phi + Math.PI : phi;   // screen angle of the bow and of the movement
    c.strokeStyle = 'rgba(217,228,230,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + Math.cos(phi) * 17, cy + Math.sin(phi) * 17); c.lineTo(cx + Math.cos(phi) * 1400, cy + Math.sin(phi) * 1400); c.stroke();
    const len = Math.abs(nav.speed) * 60 * ppm;   // where the boat will be in one minute
    if (len > 18) {
      const ex = cx + Math.cos(cog) * len, ey = cy + Math.sin(cog) * len;
      c.strokeStyle = P.ui; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + Math.cos(cog) * 17, cy + Math.sin(cog) * 17); c.lineTo(ex, ey);
      c.moveTo(ex - Math.sin(cog) * 5, ey + Math.cos(cog) * 5); c.lineTo(ex + Math.sin(cog) * 5, ey - Math.cos(cog) * 5); c.stroke();
    }
    c.save(); c.translate(cx, cy); c.rotate(phi); c.fillStyle = P.hull; c.strokeStyle = P.ui; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(16, 0); c.lineTo(7, -4.4); c.lineTo(-14, -4.4); c.lineTo(-14, 4.4); c.lineTo(7, 4.4); c.closePath(); c.fill(); c.stroke(); c.strokeRect(-5, -2.8, 8, 5.6);
    c.restore(); c.restore();

    // 3. Window frame, chart title, north arrow, range and orientation, work status.
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1; c.strokeRect(WIN.x + 0.5, WIN.y + 0.5, WIN.w - 1, WIN.h - 1);
    c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = '600 11px ' + SANS;
    const title = 'SJÖKORT ' + meta.no + '  ·  ' + meta.name.toUpperCase(); const tw = c.measureText(title).width;
    c.fillStyle = 'rgba(7,14,22,0.78)'; c.fillRect(WIN.x + 8, WIN.y + 8, tw + 18, 22); c.fillStyle = P.ui; c.fillText(title, WIN.x + 17, WIN.y + 19);
    const nx = WIN.x + WIN.w - 30, ny = WIN.y + 30;
    c.fillStyle = 'rgba(7,14,22,0.78)'; c.beginPath(); c.arc(nx, ny, 21, 0, TAU); c.fill();
    c.save(); c.translate(nx, ny); c.rotate(rot); c.fillStyle = P.ui; c.beginPath(); c.moveTo(0, -14); c.lineTo(5, 4); c.lineTo(0, 0); c.lineTo(-5, 4); c.closePath(); c.fill(); c.restore();
    c.textAlign = 'center'; c.font = '600 10px ' + SANS; c.fillText('N', nx + Math.cos(rot - Math.PI / 2) * 24 - Math.sin(rot) * 0, ny + Math.sin(rot - Math.PI / 2) * 24);
    c.fillStyle = 'rgba(7,14,22,0.78)'; c.fillRect(nx - 128, ny - 16, 96, 32);
    c.textAlign = 'right'; c.font = '600 14px ' + MONO; c.fillStyle = P.ui; c.fillText(fmtRange(range) + ' M', nx - 38, ny - 7);
    c.font = '9px ' + SANS; c.fillStyle = P.dim; c.fillText(orientation === 'head' ? 'KURS UPP' : 'NORD UPP', nx - 38, ny + 8);
    if (!near.ready) {
      c.textAlign = 'center'; c.font = '600 16px ' + SANS; c.fillStyle = P.ui; c.fillText('SJÖKORT LADDAS…', cx, cy - 10);
      c.font = '11px ' + MONO; c.fillStyle = P.dim; c.fillText(Math.round((work ? work.progress() : 0) * 100) + ' %', cx, cy + 12);
    } else if (work) {
      c.textAlign = 'left'; c.font = '10px ' + MONO; c.fillStyle = P.dim; c.fillText('NY KARTBILD ' + Math.round(work.progress() * 100) + ' %', WIN.x + 10, WIN.y + WIN.h - 12);
    }

    // 4. Information bar.
    c.fillStyle = P.bar; c.fillRect(WIN.x, H - BAR, WIN.w, BAR - PAD); c.textBaseline = 'alphabetic';
    const kn = Math.abs(nav.speed) * 1.943844, course = ((90 - nav.heading * 180 / Math.PI) % 360 + 360) % 360;
    const cogDeg = Math.round(nav.speed < 0 ? course + 180 : course) % 360;
    const g = A.geo(nav.x, nav.z), depth = -world.height(nav.x, nav.z), shallow = depth < 1.5, blink = (t * 2) % 1 < 0.5;
    const col = (WIN.w - 24) / 7, x0 = WIN.x + 14;
    field(c, x0, 'SOG', sv(kn, 1) + ' kn'); field(c, x0 + col, 'COG', pad3(cogDeg) + '°');
    field(c, x0 + col * 2, shallow ? 'GRUND' : 'DJUP', (depth < 0 ? '0,0' : sv(depth, 1)) + ' m', shallow ? P.warn : P.ui, shallow && blink);
    field(c, x0 + col * 3, 'LAT', A.formatLat(g.lat)); field(c, x0 + col * 4, 'LONG', A.formatLon(g.lon));
    field(c, x0 + col * 5, 'RÄCKVIDD', fmtRange(range) + ' M'); field(c, x0 + col * 6, 'ORIENTERING', orientation === 'head' ? 'KURS UPP' : 'NORD UPP');
    stats.draws++;
  }

  // ---------- public API ----------
  function currentNav(st) { return (st && st.nav) || (state && state.nav) || start; }
  /** update(dt, state, t): steps background work every call; redraws at ~8 Hz when near (or 1 Hz far away). t in seconds. */
  function update(dt, st, t) {
    if (!ok) return;
    const nav = currentNav(st); if (!nav) return;
    stepWork(); checkTriggers(nav); sampleTrack(nav);
    const isNear = st && st.plotterNear !== undefined ? !!st.plotterNear : !(st && st.mode === 'exterior');
    const now = typeof t === 'number' ? t * 1000 : clock(); if (typeof t === 'number') lastT = t;
    if (dirty || now - lastDraw >= (isNear ? 125 : 1000) || now < lastDraw) { lastDraw = now; dirty = false; draw(nav, st || state || {}, typeof t === 'number' ? t : lastT); if (texture) texture.needsUpdate = true; }
  }
  /** render(t): force an immediate redraw (screenshots, tests). */
  function render(t) { if (!ok) return; const nav = currentNav(); if (!nav) return; if (typeof t === 'number') lastT = t; draw(nav, state || {}, lastT); dirty = false; if (texture) texture.needsUpdate = true; }
  function setRange(nm) { const r = Math.max(0.1, Math.min(8, +nm || 0.5)); if (r !== range) { range = r; dirty = true; } return range; }
  /** cycleRange(dir): dir > 0 steps to the next larger preset (zoom out), dir < 0 to the next smaller; clamped at the ends. */
  function cycleRange(dir) {
    let i = 0; for (let k = 1; k < RANGES.length; k++) if (Math.abs(RANGES[k] - range) < Math.abs(RANGES[i] - range)) i = k;
    i = Math.max(0, Math.min(RANGES.length - 1, i + (dir < 0 ? -1 : 1))); return setRange(RANGES[i]);
  }
  function setOrientation(mode) { const m = mode === 'north' ? 'north' : 'head'; if (m !== orientation) { orientation = m; dirty = true; } return orientation; }
  function toggleOrientation() { return setOrientation(orientation === 'head' ? 'north' : 'head'); }
  /** setWorld(world): drop tiles and track, then chart the new world from world.home (or a fresh survey at its start). */
  function setWorld(w) { dropTiles(); adopt(w); dirty = true; }

  adopt(world);
  const api = { update, render, setRange, cycleRange, setOrientation, toggleOrientation, setWorld, canvas, texture, view, stats, tiles: { near, far }, RANGES };
  Object.defineProperty(api, 'range', { enumerable: true, get: () => range, set: setRange });
  Object.defineProperty(api, 'orientation', { enumerable: true, get: () => orientation, set: setOrientation });
  Object.defineProperty(api, 'busy', { enumerable: true, get: () => !!work });
  return api;
};
