// Stridsbåt 90 H – hull, with exterior arrangement corrected to the supplied 845/826 references.
// Lofted deep-V shell, raised troop deck, wheelhouse-foot shoulder and a low foredeck falling to the raked landing stem
// measured from the Dockstavarvet profile (constants.js STATIONS). The stävport is the whole raked stem face above the
// sill; its nose bumper moves with it, while the fixed bow-shoulder rubber belongs to equipment.js.
// Hatch openings connect the inhabited troop, machinery, cockpit and bow compartments.
// Plain script; requires THREE (r128), constants.js and util.js.
// Frame: metres, Y up, +X forward (bow), +Z starboard. Origin = transom × design waterline × centreline.
//
// Fit rules (so nothing pokes through the shell or leaves a gap):
//   * every deck plate ends INSET inside the shell (U.hullHalfWidthAt) and the raised trunk / front deck is clipped to the
//     hull with U.trunkHalfW(x) where the bow narrows; the trunk sides run all the way to the end of the slope;
//   * side decks and the foredeck lie M.DECK_EDGE_DROP below the sheer (the shell edge is the gunwale), so the foredeck
//     follows the sheer down toward the stem; the bow hatches sit on a frame tilted with that slope;
//   * interior parts (benches, bulkheads, bow corridor) are lofted against the hull section instead of being plain boxes;
//   * the deck plates have real openings under every lid (a dark recess shows when a hatch is open).
window.CB90 = window.CB90 || {};
CB90.buildHull = function (THREE) {
  const U = CB90.util, M = CB90.M, C = CB90.COLORS;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const forwardDoorX = M.WH_DOOR_X;
  const cockpitFloorY = M.TROOP_FLOOR_Y; // low continuous passage; pilot platforms remain raised

  const group = new THREE.Group(); group.name = 'hull';
  const parts = {};
  const articulations = [];
  const mechanismUpdates = [];
  const shellMats = [];              // materials dimmed by setCutaway()

  const deckMat = U.deck();
  const lidMat = U.mat(C.DECK_LIGHT, { roughness: 0.9, metalness: 0.05 });
  const darkMat = U.mat(0x0e1113, { roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide });
  const insideMat = U.mat(C.INTERIOR, { roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide });
  const rail = U.mat(C.DARK_METAL, { roughness: 0.6, metalness: 0.5 });

  // ---------------------------------------------------------------- sampling
  // Main shell sections (transom -> ramp sill) every 0.35 m plus every station x, plus the x where the chine crosses the
  // boot-top: there the two duplicated vertex rows (chine / boot-top) swap order, and an explicit section makes that swap
  // happen on a zero-width segment instead of twisting one loft segment. Forward of the sill the hull is only the two bow
  // cheeks either side of the stävport opening (XB, sampled every 0.1 m up to the stem deck corner).
  const XS = [], XB = [];
  { const sill = M.RAMP_HINGE_X, keyXs = [];
    CB90.STATIONS.forEach((s) => keyXs.push(s.x));
    for (let i = 0; i < CB90.STATIONS.length - 1; i++) {
      const a = CB90.STATIONS[i], b = CB90.STATIONS[i + 1];
      if ((a.chineY - M.BOOTTOP_Y) * (b.chineY - M.BOOTTOP_Y) < 0) keyXs.push(U.lerp(a.x, b.x, (M.BOOTTOP_Y - a.chineY) / (b.chineY - a.chineY)));
    }
    const dedupe = (xs) => { xs.sort((a, b) => a - b); for (let i = xs.length - 1; i > 0; i--) if (xs[i] - xs[i - 1] < 1e-6) xs.splice(i, 1); };
    for (let x = 0; x < sill; x += 0.35) if (!keyXs.some((k) => Math.abs(k - x) < 0.06)) XS.push(x);
    keyXs.forEach((k) => { if (k >= 0 && k <= sill + 1e-6) XS.push(k); });
    dedupe(XS);
    for (let x = sill; x < M.STEM_X; x += 0.1) if (!keyXs.some((k) => Math.abs(k - x) < 0.03)) XB.push(x);
    keyXs.forEach((k) => { if (k >= sill - 1e-6 && k <= M.STEM_X + 1e-6) XB.push(k); });
    dedupe(XB); }

  const S = (x) => U.stationAt(x);
  const deckY = (x) => S(x).deckY, deckZ = (x) => S(x).deckZ;
  const halfW = (x, y) => U.hullHalfWidthAt(x, y);
  const DROP = M.DECK_EDGE_DROP != null ? M.DECK_EDGE_DROP : 0.02;
  const INSET = 0.003;                                            // deck plates end this far inside the shell
  const sheerDeckY = (x) => deckY(x) - DROP;                     // walking surface of the side decks and the foredeck
  const tw = (x) => U.trunkHalfW(x);                              // raised troop deck and short wheelhouse-foot transition
  const slopeY = (x) => U.lerp(M.FRONTDECK_Y, sheerDeckY(M.FRONTDECK_SLOPE_X1),
    U.clamp((x - M.FRONTDECK_X1) / (M.FRONTDECK_SLOPE_X1 - M.FRONTDECK_X1), 0, 1));
  const trunkTopY = (x) => x > M.FRONTDECK_X1 ? slopeY(x) : U.lerp(M.TRUNK_Y, M.FRONTDECK_Y,
    U.clamp((x - M.WH_X0) / (M.FRONTDECK_X1 - M.WH_X0), 0, 1));

  // ---------------------------------------------------------------- shell
  // One loft per hull: each section runs port deck edge -> down the port side -> keel -> up to starboard deck edge
  // (points increase in z, sections increase in x => outward normals). Levels are chosen so that the CHINE and the
  // BOOT-TOP each get a duplicated vertex row: that gives a hard crease at the chine and a clean, straight
  // antifouling waterline instead of a saw-tooth of per-triangle colours. The KEEL row is duplicated as well: where the
  // stem face is blunt (station keelZ > 0) the flat strip between the port and starboard keel rows is the raked stem
  // face, and the duplicate row gives it a crease against the side panels (aft, at the sharp keel, the strip is empty).
  function sectionLevels(st) {
    const boot = U.clamp(M.BOOTTOP_Y, st.keelY + 1e-3, st.deckY - 1e-3);
    if (boot < st.chineY) {
      return [st.keelY, st.keelY, U.lerp(st.keelY, boot, 0.55), boot, boot, U.lerp(boot, st.chineY, 0.5), st.chineY, st.chineY,
        U.lerp(st.chineY, st.deckY, 0.35), U.lerp(st.chineY, st.deckY, 0.7), st.deckY];
    }
    return [st.keelY, st.keelY, U.lerp(st.keelY, st.chineY, 0.55), st.chineY, st.chineY, U.lerp(st.chineY, boot, 0.5), boot, boot,
      U.lerp(boot, st.deckY, 0.35), U.lerp(boot, st.deckY, 0.7), st.deckY];
  }
  function hullSection(x) {
    const st = S(x), ys = sectionLevels(st), pts = [];
    for (let i = ys.length - 1; i >= 0; i--) pts.push(V(x, ys[i], -halfW(x, ys[i])));   // port deck edge -> keel
    for (let i = 0; i < ys.length; i++) pts.push(V(x, ys[i], halfW(x, ys[i])));         // keel -> starboard deck edge
    return pts;
  }
  const shell = new THREE.Group(); shell.name = 'shell';
  // Paint UVs on the blunt stem face (the keel rows forward of x 13.2) run with z instead of the near-constant x.
  const stemFaceUv = (v) => { const st = S(v.x); return v.x > 13.2 && Math.abs(v.y - st.keelY) < 0.01 && Math.abs(v.z) <= st.keelZ + 0.002 ? v.z * 0.9 : 0; };
  function addShellMesh(geo, name) {
    const mesh = U.camoMesh(geo, null, { roughness: 0.85, uvShift: stemFaceUv });
    mesh.material = U.cloneCamoMaterial(mesh.material); mesh.material.vertexColors = true; mesh.material.side = THREE.DoubleSide;
    mesh.name = name; shellMats.push(mesh.material); shell.add(mesh); return mesh;
  }
  addShellMesh(U.loft(XS.map(hullSection), {}), 'shellMain');   // transom -> sill, incl. the stem face below the stävport
  // Bow cheeks: forward of the sill the topsides continue either side of the stävport opening, from the sheer down to the
  // edge of the raked stem face. Two half-section lofts leave the opening itself open; the ramp panel closes it.
  { const half = sectionLevels(S(M.STEM_X)).length;
    addShellMesh(U.loft(XB.map((x) => hullSection(x).slice(0, half)), {}), 'bowCheekP');
    addShellMesh(U.loft(XB.map((x) => hullSection(x).slice(half)), {}), 'bowCheekS'); }
  group.add(shell); parts.shell = shell;

  // Transom cap (flat, normal -X): the x = 0 section outline closed across the deck line.
  function capPolygon(outline, material) {
    const c = new THREE.Vector3();
    outline.forEach((p) => c.add(p)); c.multiplyScalar(1 / outline.length);
    const pos = [], idx = [];
    pos.push(c.x, c.y, c.z);
    outline.forEach((p) => pos.push(p.x, p.y, p.z));
    for (let i = 0; i < outline.length - 1; i++) idx.push(0, i + 1, i + 2);
    idx.push(0, outline.length, 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }
  {
    const transom = capPolygon(hullSection(0.001), U.camoMaterial({ roughness: 0.85 }));
    transom.geometry = U.applyCamo(transom.geometry);
    transom.material = U.cloneCamoMaterial(transom.material); transom.material.vertexColors = true; transom.material.side = THREE.DoubleSide;
    shellMats.push(transom.material);
    group.add(transom); parts.transom = transom;
  }
  // (No forefoot cap: the raked stem below the sill is the flat bottom strip of the main loft, ending on the sill ledge.)

  // ---------------------------------------------------------------- loft helpers
  /** Sorted x samples from x0 to x1 at `step`, always including the station x's (sheer kinks) and any extras. */
  const KEY_XS = CB90.STATIONS.map((s) => s.x).concat([8.50,8.60]);
  for (let i = 0; i < CB90.STATIONS.length - 1; i++) {                // x where U.trunkHalfW starts to follow the sheer (kink)
    const a = CB90.STATIONS[i], b = CB90.STATIONS[i + 1], fa = a.deckZ - 0.03 - M.TRUNK_HALFW, fb = b.deckZ - 0.03 - M.TRUNK_HALFW;
    if (fa * fb < 0) KEY_XS.push(U.lerp(a.x, b.x, fa / (fa - fb)));
  }
  function xsBetween(x0, x1, step, extra) {
    const xs = [x0, x1];
    KEY_XS.forEach((k) => { if (k > x0 + 1e-6 && k < x1 - 1e-6) xs.push(k); });
    (extra || []).forEach((x) => { if (x > x0 + 1e-6 && x < x1 - 1e-6) xs.push(x); });
    for (let x = x0 + step; x < x1 - 1e-6; x += step) if (!xs.some((k) => Math.abs(k - x) < step * 0.25)) xs.push(x);
    return xs.sort((a, b) => a - b);
  }
  /** Ruled surface between two curves p0(x), p1(x) (Vector3), sampled along x. flip inverts the winding. */
  function ribbon(x0, x1, p0, p1, material, step, extra, flip) {
    const secs = xsBetween(x0, x1, step || 0.4, extra).map((x) => [p0(x), p1(x)]);
    const mesh = new THREE.Mesh(U.loft(secs, { flip: !!flip }), material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }
  /** Horizontal deck strip y = yOf(x) between z0Of(x) (port) and z1Of(x) (starboard); normal up. */
  function deckStrip(x0, x1, yOf, z0Of, z1Of, material, step, extra) {
    return ribbon(x0, x1, (x) => V(x, yOf(x), z0Of(x)), (x) => V(x, yOf(x), z1Of(x)), material, step, extra, true);
  }
  /** Deck plate with rectangular openings [{x0,x1,z0,z1}]: built from strips around the holes (holes may share x ranges). */
  function deckPlate(x0, x1, yOf, z0Of, z1Of, material, step, holes) {
    const g = new THREE.Group();
    const hs = (holes || []).filter((h) => h.x1 > x0 && h.x0 < x1);
    const xb = [x0, x1]; hs.forEach((h) => { xb.push(U.clamp(h.x0, x0, x1), U.clamp(h.x1, x0, x1)); });
    const xs = Array.from(new Set(xb)).sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
      const xa = xs[i], xb2 = xs[i + 1]; if (xb2 - xa < 1e-6) continue;
      const xm = (xa + xb2) / 2;
      const active = hs.filter((h) => h.x0 < xm && h.x1 > xm).sort((a, b) => a.z0 - b.z0);
      const pieces = []; let lo = z0Of;
      active.forEach((h) => { const hz0 = h.z0, hz1 = h.z1; pieces.push([lo, () => hz0]); lo = () => hz1; });
      pieces.push([lo, z1Of]);
      pieces.forEach((p) => { if (p[1](xm) - p[0](xm) > 0.005) g.add(deckStrip(xa, xb2, yOf, p[0], p[1], material, step)); });
    }
    return g;
  }

  // ---------------------------------------------------------------- decks
  const decks = new THREE.Group(); decks.name = 'decks'; group.add(decks); parts.decks = decks;
  const deckMatOwn = deckMat.clone(); deckMatOwn.side = THREE.DoubleSide; shellMats.push(deckMatOwn);
  // Keep the access hatch and its ladder tied to the raised-deck break in the manufacturer's plan.
  const troopHatchX0 = M.TROOP_HATCH_X0, troopHatchX1 = M.TROOP_HATCH_X1;
  const troopHatchX = (troopHatchX0 + troopHatchX1) / 2;
  // Old-H manufacturer plan: inner U-shaped engine lids read about x .94–2.83m.
  // The longer lines to the bulkhead are the mine rails, not hatch boundaries.
  const engineLidX0=.95,engineLidX1=2.85,engineLidLength=engineLidX1-engineLidX0,engineLidX=(engineLidX0+engineLidX1)/2;
  // Openings in the deck plates under the lids (dimensions match the lids built further down).
  const OPEN = {
    engineP: { x0: engineLidX0+.03, x1: engineLidX1-.03, z0: -1.42, z1: -0.48 }, engineS: { x0: engineLidX0+.03, x1: engineLidX1-.03, z0: 0.48, z1: 1.42 },
    companion: { x0: 0.33, x1: 0.92, z0: -0.30, z1: 0.30 },
    troop: { x0: troopHatchX0 + 0.03, x1: troopHatchX1 - 0.03, z0: -0.42, z1: 0.42 },
    gangway: { x0: M.WH_X0, x1: forwardDoorX, z0: -1.44*M.WH_WIDTH_SCALE, z1: 1.44*M.WH_WIDTH_SCALE },   // inhabited wheelhouse ends at the common forward bulkhead datum
    bow: { x0: 12.15, x1: M.STEM_X-.10, z0: -0.53, z1: 0.53 },     // opens all the way to the moving ramp nose: no fixed bridge across the exit
  };

  // aft deck (flat, y = AFTDECK_Y, full width at that height)
  decks.add(deckPlate(M.AFTDECK_X0, M.AFTDECK_X1, () => M.AFTDECK_Y,
    (x) => -halfW(x, M.AFTDECK_Y) + INSET, (x) => halfW(x, M.AFTDECK_Y) - INSET, deckMatOwn, 0.4, [OPEN.engineP, OPEN.engineS, OPEN.companion]));
  // Raised deck stops at the wheelhouse foot. The narrow sloping shoulder then meets the low foredeck.
  // There is no central gun pit: the paired gun sits off-centre on the starboard foredeck in the reference.
  decks.add(deckPlate(M.TRUNK_X0, M.FRONTDECK_X1, trunkTopY, (x) => -tw(x), (x) => tw(x), deckMatOwn, 0.4, [OPEN.troop, OPEN.gangway]));
  decks.add(deckStrip(M.FRONTDECK_X1, M.FRONTDECK_SLOPE_X1, slopeY, (x) => -tw(x), (x) => tw(x), deckMatOwn, 0.1));
  // step at x = TRUNK_X0: the trunk's aft face (aft deck -> trunk top) plus the outboard step faces up to the side decks
  {
    const x = M.TRUNK_X0, w = tw(x);
    decks.add(U.box(0.05, M.TRUNK_Y - M.AFTDECK_Y, w * 2, deckMatOwn, [x + 0.025, (M.TRUNK_Y + M.AFTDECK_Y) / 2, 0]));
    [1, -1].forEach((sgn) => {
      const secs = [M.AFTDECK_Y, sheerDeckY(x)].map((y) => {
        const zi = sgn * w, zo = sgn * (halfW(x, y) - INSET);
        return sgn > 0 ? [V(x, y, zi), V(x, y, zo)] : [V(x, y, zo), V(x, y, zi)];
      });
      const m = new THREE.Mesh(U.loft(secs, { flip: true }), deckMatOwn);      // sections up (+y), points to +z => flip gives -x (aft)
      m.castShadow = true; m.receiveShadow = true; decks.add(m);
    });
  }
  // trunk sides: vertical walls from just under the side deck up to the trunk top / slope edge, aft step -> end of the slope
  [1, -1].forEach((sgn) => {
    const secs = xsBetween(M.TRUNK_X0, M.FRONTDECK_SLOPE_X1, 0.4, [M.WH_X0, M.FRONTDECK_X1]).map((x) =>
      [V(x, deckY(x) - 0.10, sgn * Math.min(tw(x), halfW(x, deckY(x) - 0.10) - INSET)), V(x, trunkTopY(x), sgn * tw(x))]);
    const m = new THREE.Mesh(U.loft(secs, { flip: sgn < 0 }), deckMatOwn);
    m.castShadow = true; m.receiveShadow = true; decks.add(m);
  });
  // side decks alongside the trunk (DROP below the sheer), from the trunk side out to the shell
  [1, -1].forEach((sgn) => {
    const a = (x) => sgn * tw(x), b = (x) => sgn * (halfW(x, sheerDeckY(x)) - INSET);
    decks.add(deckStrip(M.TRUNK_X0, M.FRONTDECK_SLOPE_X1, sheerDeckY, sgn > 0 ? a : b, sgn > 0 ? b : a, deckMatOwn, 0.4, [M.FRONTDECK_X1]));
  });
  // foredeck: follows the falling sheer down to the stem, with the opening for the bow hatches. It stops 10 cm short of
  // the deck corner: the top of the stävport (nose block) carries the last piece so the closed door reads as one face.
  decks.add(deckPlate(M.FRONTDECK_SLOPE_X1, M.STEM_X - 0.10, sheerDeckY,
    (x) => -halfW(x, sheerDeckY(x)) + INSET, (x) => halfW(x, sheerDeckY(x)) - INSET, deckMatOwn, 0.25, [OPEN.bow]));
  // Narrow welded metal toe edging, not another circular rubber fender around the boat.
  [1, -1].forEach((sgn) => {
    [[0.15, M.AFTDECK_X1], [M.FRONTDECK_SLOPE_X1, M.STEM_X - 0.15]].forEach((seg) => {
      const sections = xsBetween(seg[0], seg[1], .30).map(x => {
        const z=sgn*(deckZ(x)-.047), lo=sheerDeckY(x)-.004, hi=lo+.048;
        const a=V(x,lo,z-.009), b=V(x,lo,z+.009), c=V(x,hi,z+.009), d=V(x,hi,z-.009);
        return [a,b,b.clone(),c,c.clone(),d,d.clone(),a.clone()];
      });
      const edge=new THREE.Mesh(U.loft(sections,{capStart:true,capEnd:true}),rail);
      edge.name='weldedToeEdge';edge.castShadow=true;edge.receiveShadow=true;decks.add(edge);
    });
  });

  // ---------------------------------------------------------------- inhabited interior
  // The troop deck, low wheelhouse aisle and bow corridor are connected spaces, with real openings.
  const interior = new THREE.Group(); interior.name = 'interior'; group.add(interior); parts.interior = interior;
  const inW = (x, y) => Math.max(0.05, halfW(x, y) - 0.05);
  const enamel = U.mat(0xa3ada3, { roughness: 0.78, side:THREE.DoubleSide });
  const frameMat = U.mat(0x566158, { roughness: 0.6, metalness: 0.4 });
  const upholstery = U.mat(0x3d4939, { roughness: 0.96 });
  const beltMat = U.mat(0x191e1b, { roughness: 0.95 });
  const aluminium = U.mat(0x929b98, { roughness: 0.43, metalness: 0.7 });
  const orange = U.mat(0xda6034, { roughness: 0.92 });
  const safetyRed = U.mat(0xa22b20, { roughness: 0.48, metalness: 0.2 });
  const treadCanvas = document.createElement('canvas'); treadCanvas.width = treadCanvas.height = 128;
  const tc = treadCanvas.getContext('2d'); tc.fillStyle = '#49514c'; tc.fillRect(0,0,128,128);
  tc.strokeStyle = '#67716a'; tc.lineWidth = 3;
  for(let x=0;x<128;x+=32) for(let y=0;y<128;y+=32) {
    tc.beginPath(); tc.moveTo(x+7,y+6); tc.lineTo(x+20,y+19); tc.moveTo(x+8,y+27); tc.lineTo(x+21,y+14); tc.stroke();
  }
  const treadTex = new THREE.CanvasTexture(treadCanvas); treadTex.wrapS = treadTex.wrapT = THREE.RepeatWrapping;
  treadTex.repeat.set(3,3); treadTex.anisotropy = 4;
  const floorMat = new THREE.MeshStandardMaterial({color:0xa4afa3,map:treadTex,roughness:.85,metalness:.15,side:THREE.DoubleSide});
  const baseFloorMat=floorMat.clone();baseFloorMat.map=treadTex.clone();baseFloorMat.map.needsUpdate=true;baseFloorMat.map.repeat.set(22,12);
  // A rectangular sole cuts through the V bottom at its lower outboard corners. Loft the walking plates to the
  // available section at floor height instead; their outer edges terminate against the inboard hull lining.
  interior.add(deckStrip(4.01,8.64,()=>M.TROOP_FLOOR_Y,(x)=>-inW(x,M.TROOP_FLOOR_Y),(x)=>inW(x,M.TROOP_FLOOR_Y),baseFloorMat,.25));
  interior.add(deckStrip(.62,3.98,()=>M.ENGINE_FLOOR_Y,(x)=>-inW(x,M.ENGINE_FLOOR_Y),(x)=>inW(x,M.ENGINE_FLOOR_Y),baseFloorMat,.25));
  // Narrow textured aisle plates keep the scale of the pressed anti-slip tread consistent.
  for(let x=4.1;x<7.32;x+=0.43) interior.add(U.box(0.41,0.012,0.88,floorMat,[x,-0.293,0]));
  parts.troopSeats = new THREE.Group(); parts.troopSeats.name='troopSeating'; interior.add(parts.troopSeats);
  // Swedish H arrangement: nine inward-facing seats per side and two forward-facing
  // seats against the aft bulkhead (SHK RM 2008:02, printed p.12 / PDF p.13).
  // The report also confirms that these troop seats have no safety belts. Cushion
  // dimensions and pitch remain a reconstruction; the arrangement is documented.
  for(const side of [-1,1]) {
    for(let i=0;i<9;i++) {
      const x=4.85+i*0.425, z=side*1.16;
      const seat=new THREE.Group(); seat.name='troopSeat'+(side<0?'P':'S')+(i+1); parts.troopSeats.add(seat);
      seat.userData={position:[x,.205,z],facing:[0,0,-side],source:'SHK RM 2008:02 p.12'};
      seat.add(U.box(0.385,0.085,0.52,upholstery,[x,0.205,z]));
      const back=U.box(0.385,0.63,0.095,upholstery,[x,0.58,side*1.445]); back.rotation.x=side*0.11; seat.add(back);
      seat.add(U.box(0.37,0.025,0.54,frameMat,[x,0.144,z]));
      for(const dx of [-0.145,0.145]) {
        seat.add(U.bar(V(x+dx,-0.27,side*Math.min(1.4,inW(x+dx,-0.29)-.02)),V(x+dx,0.15,side*0.96),0.016,frameMat));
        seat.add(U.bar(V(x+dx,0.15,side*1.4),V(x+dx,0.94,side*1.49),0.015,frameMat));
      }
      const stowageZ=Math.min(1.22,inW(x+.14,-.225)-.065);
      seat.add(U.box(0.27,0.19,0.11,beltMat,[x,-0.13,side*stowageZ])); // strapped personal stowage
      // High-visibility flotation jackets stowed above the forward rows.
      if(i>2) {
        const vestY = M.TRUNK_Y - 0.50;
        const vest=U.box(0.32,0.14,0.28,orange,[x,vestY,side*1.24]); vest.rotation.x=side*0.15; seat.add(vest);
        seat.add(U.box(0.034,0.016,0.285,beltMat,[x,vestY + 0.08,side*1.24]));
      }
    }
    // Inboard hull lining follows the chine; exposed aluminium ribs tie floor and roof together.
    interior.add(ribbon(4.03,M.TRUNK_X0,(x)=>V(x,-0.27,side*Math.min(1.49,inW(x,-0.27))),(x)=>V(x,M.AFTDECK_Y-0.005,side*1.51),enamel,.25));
    interior.add(ribbon(M.TRUNK_X0,8.59,(x)=>V(x,-0.27,side*Math.min(1.49,inW(x,-0.27))),(x)=>V(x,M.TRUNK_Y-0.007,side*1.51),enamel,.25));
    for(let x=4.12;x<8.5;x+=0.425) {
      const top=x<M.TRUNK_X0?M.AFTDECK_Y-0.05:M.TRUNK_Y-0.11;
      interior.add(U.bar(V(x,-0.27,side*inW(x,-0.27)),V(x,top,side*Math.min(1.48,inW(x,top))),0.018,frameMat));
      if(side<0 && x>M.TRUNK_X0 && x<7.3) {
        // Split each transverse stiffener at the hatch; an open lid must expose the passage below.
        if(x > OPEN.troop.x0 && x < OPEN.troop.x1) {
          for(const sign of [-1,1]) interior.add(U.box(0.033,0.047,1.465-0.45,enamel,[x,M.TRUNK_Y-0.084,sign*(1.465+0.45)/2]));
        } else interior.add(U.box(0.033,0.047,2.93,enamel,[x,M.TRUNK_Y-0.084,0]));
      }
    }
    interior.add(U.tube([V(4.08,0.91,side*1.54),V(5.3,0.91,side*1.58),V(8.52,0.91,side*1.57)],0.024,aluminium,32));
    interior.add(U.tube([V(M.TRUNK_X0+0.06,M.TRUNK_Y-0.25,side*1.4),V(8.48,M.TRUNK_Y-0.25,side*1.4)],0.018,beltMat,20));
    for(let x=M.TRUNK_X0+0.15;x<8.45;x+=0.6) interior.add(U.box(0.075,0.075,0.055,frameMat,[x,M.TRUNK_Y-0.25,side*1.4]));
  }
  // The two aft seats leave the centre machinery doorway and the hatch ladder clear.
  // Their backs sit against the bulkhead at x=4; both occupants face the bow.
  for(const side of [-1,1]) {
    const x=4.32,z=side*1.03;
    const seat=new THREE.Group();seat.name='troopSeatAft'+(side<0?'P':'S');
    seat.userData={position:[x,.205,z],facing:[1,0,0],source:'SHK RM 2008:02 p.12'};
    parts.troopSeats.add(seat);
    seat.add(U.box(.52,.085,.46,upholstery,[x,.205,z]));
    const back=U.box(.095,.63,.46,upholstery,[4.11,.58,z]);back.rotation.z=.11;seat.add(back);
    seat.add(U.box(.54,.025,.445,frameMat,[x,.144,z]));
    for(const dz of [-.17,.17]) {
      const footZ=Math.sign(z+dz)*Math.min(Math.abs(z+dz),inW(x,-.29)-.025);
      seat.add(U.bar(V(x,-.27,footZ),V(x+.17,.15,z+dz),.016,frameMat));
      seat.add(U.bar(V(4.10,.15,z+dz),V(4.04,.94,z+dz),.015,frameMat));
    }
  }
  // Ceiling fixtures, bulkhead services and safety gear are visible from the central aisle.
  const lampMat=U.mat(0xffe7b5,{emissive:0xffce83,emissiveIntensity:0.9,roughness:0.5});
  for(const x of [5.0,6.8,8.1]) {
    const y=x<M.TRUNK_X0?M.AFTDECK_Y-0.075:M.TRUNK_Y-0.085;
    const z=x>7.35 || (x>OPEN.troop.x0 && x<OPEN.troop.x1) ? .72 : 0;
    interior.add(U.box(0.46,0.045,0.17,frameMat,[x,y,z]));
    interior.add(U.box(0.40,0.012,0.12,lampMat,[x,y-0.029,z]));
  }
  interior.add(U.box(0.36,0.44,0.16,U.mat(0xdddcc8,{roughness:0.8}),[6.85,0.98,-1.36]));
  interior.add(U.box(0.17,0.045,0.017,safetyRed,[6.85,0.98,-1.269]));
  interior.add(U.box(0.045,0.17,0.017,safetyRed,[6.85,0.98,-1.268]));
  function extinguisher(x,y,z) {
    interior.add(U.cyl(0.072,0.072,0.37,safetyRed,14,[x,y,z]));
    interior.add(U.cyl(0.044,0.055,0.06,aluminium,12,[x,y+0.21,z]));
    interior.add(U.box(0.12,0.026,0.045,beltMat,[x,y+0.262,z]));
    interior.add(U.tube([V(x,y+0.25,z),V(x+0.105,y+0.2,z),V(x+0.11,y-0.10,z)],0.012,beltMat,16));
    interior.add(U.box(0.09,0.12,0.01,U.mat(0xe8dfc9),[x,y,z+0.073]));
  }
  extinguisher(7.13,0.48,-1.38); extinguisher(3.69,0.20,1.25);
  // Twin V8 diesels: crankcase, ribbed cylinder banks, turbochargers, intake plumbing and filters.
  const engines=new THREE.Group(); engines.name='twinDiesels'; interior.add(engines); parts.engines=engines;
  const enginePaint=U.mat(0xb65332,{roughness:0.6,metalness:0.28});
  for(const side of [-1,1]) {
    const z=side*0.91, x=2.33;
    const eng=new THREE.Group(); eng.name=side<0?'dieselPort':'dieselStarboard'; engines.add(eng);
    eng.add(U.box(1.62,0.40,0.63,enginePaint,[x,-0.10,z]));
    const bedWidth=2*Math.min(.385,inW(x-.90,-.36)-Math.abs(z),inW(x+.90,-.36)-Math.abs(z));
    eng.add(U.box(1.80,0.075,bedWidth,frameMat,[x,-0.32,z]));
    for(const bank of [-1,1]) {
      const rocker=U.box(1.49,0.22,0.25,enginePaint,[x,0.30,z+bank*0.22]); rocker.rotation.x=bank*0.28; eng.add(rocker);
      eng.add(U.cyl(0.052,0.052,1.68,aluminium,12,[x,0.12,z+bank*0.40],'x'));
      for(let i=0;i<8;i++) {
        const xx=x-0.64+i*0.18;
        eng.add(U.box(0.022,0.24,0.28,frameMat,[xx,0.305,z+bank*0.22]));
        eng.add(U.cyl(0.014,0.014,0.015,aluminium,8,[xx,0.444,z+bank*0.24]));
      }
    }
    eng.add(U.box(1.16,0.16,0.14,aluminium,[x,0.46,z]));
    eng.add(U.cyl(0.135,0.135,0.18,darkMat,16,[x+0.79,0.36,z],'z'));
    eng.add(U.tube([V(x+0.75,0.40,z),V(x+0.59,0.67,z),V(x+0.20,0.65,z),V(x+0.05,0.49,z)],0.085,aluminium,24));
    eng.add(U.cyl(0.09,0.09,0.21,U.mat(0xe2ddd0,{metalness:0.2}),14,[x+0.72,0.04,z-side*0.42]));
    eng.add(U.cyl(0.11,0.11,0.17,enginePaint,16,[x-0.86,0.03,z],'x'));
    eng.add(U.cyl(0.058,0.058,1.37,aluminium,12,[0.82,-0.23,z],'x'));
    eng.add(U.tube([V(1.65,0.56,z),V(1.35,0.68,z),V(0.70,0.68,side*1.26),V(0.1,0.30,side*1.2)],0.074,frameMat,28));
    for(const dx of [-0.67,0.67]) for(const dz of [-0.29,0.29]) {
      const footZ=Math.sign(z+dz)*Math.min(Math.abs(z+dz),inW(x+dx+.09,-.42)-.065);
      eng.add(U.box(0.18,0.06,0.12,beltMat,[x+dx,-0.39,footZ]));
    }
    for(let i=0;i<5;i++) eng.add(U.tube([V(x-0.50+i*.23,.18,z),V(x-0.5+i*.23,.53,z-.17),V(x-0.41+i*.23,.43,z-.25)],.01,beltMat,10));
  }
  // Engine-room sound insulation and accessible switch cabinets.
  for(const side of [-1,1]) {
    for(let x=0.7;x<3.8;x+=0.4) {
      const panel=U.box(0.38,0.92,0.025,enamel,[x,0.30,side*1.51]); interior.add(panel);
      interior.add(U.box(0.013,0.90,0.035,aluminium,[x-0.19,0.30,side*1.49]));
    }
    interior.add(U.tube([V(0.6,0.85,side*1.44),V(3.65,0.85,side*1.44),V(3.65,-0.2,side*1.35)],0.027,aluminium,25));
  }
  /**
   * Transverse bulkhead: the hull section at x (inset 4 cm) from the keel up to yTop, t thick, closed with end caps.
   * The section plate stops at the side-deck level; above the sheer only the part inside the trunk continues (a box),
   * so nothing shows above the side decks outboard of the trunk.
   */
  function bulkhead(x, yTop, t, material) {
    const g = new THREE.Group(); g.name = 'bulkhead';
    const yPlate = Math.min(yTop, sheerDeckY(x) - 0.01);
    const outline = (xx) => {
      const st = S(xx), ys = [st.keelY + 0.04];
      if (st.chineY < yPlate - 0.05) ys.push(U.lerp(ys[0], st.chineY, 0.5), st.chineY);
      ys.push(U.lerp(ys[ys.length - 1], yPlate, 0.5), yPlate);
      const w = (y) => Math.max(0.01, halfW(xx, y) - 0.04), pts = [];
      for (let i = ys.length - 1; i >= 0; i--) pts.push(V(xx, ys[i], -w(ys[i])));
      for (let i = 0; i < ys.length; i++) pts.push(V(xx, ys[i], w(ys[i])));
      return pts;
    };
    const plate = new THREE.Mesh(U.loft([outline(x - t / 2), outline(x + t / 2)], { capStart: true, capEnd: true }), material);
    plate.receiveShadow = true; g.add(plate);
    if (yTop > yPlate + 0.01) g.add(U.box(t, yTop - yPlate + 0.01, 2 * (tw(x) - 0.02), material, [x, (yTop + yPlate - 0.01) / 2, 0]));
    return g;
  }
  interior.add(deckStrip(.10,.63,()=>M.ENGINE_FLOOR_Y,(x)=>-inW(x,M.ENGINE_FLOOR_Y),(x)=>inW(x,M.ENGINE_FLOOR_Y),insideMat,.12));
  // Close the machinery space against the inside of the transom.
  interior.add(bulkhead(.075,M.AFTDECK_Y-.025,.045,enamel));
  for(const side of [-1,1]) interior.add(ribbon(.10,3.97,(x)=>V(x,-.42,side*Math.min(1.35,inW(x,-.42))),(x)=>V(x,M.AFTDECK_Y-.02,side*Math.min(1.53,inW(x,M.AFTDECK_Y-.02))),enamel,.25));
  // Engine bulkhead has a genuine central access opening, matching the low engine-room headroom.
  const engineDoorTop=M.AFTDECK_Y-.05, engineDoorHeight=engineDoorTop-M.TROOP_FLOOR_Y;
  for(const side of [-1,1]) {
    const ys=[M.TROOP_FLOOR_Y,S(4).chineY,(engineDoorTop+S(4).chineY)/2,engineDoorTop+.025];
    const sections=ys.map(y=>[V(4,y,side*.46),V(4,y,side*inW(4,y))]);
    interior.add(new THREE.Mesh(U.loft(sections,{flip:side>0}),enamel));
  }
  interior.add(U.box(.075,.045,2.72,enamel,[4.0,M.AFTDECK_Y-.032,0]));
  interior.add(U.box(.22,.13,.88,floorMat,[4.0,-.367,0]));
  // Bow corridor: a low landing and horizontal steps rise to the stävport sill between fitted inner walls, so the
  // opening under the bow hatches looks down into the corridor and the lowered ramp leads straight out of it. Everything
  // stops at the sill: forward of it the raked stem face is outside the hull.
  {
    const sillX = M.RAMP_HINGE_X, sillY = M.RAMP_HINGE_Y + 0.02, corridorLength = sillX - forwardDoorX;
    const fy = CB90.bowPassageFloorAt;
    const top = (x) => U.deckYAt(x, 0) - 0.03;
    const cw = (x, y) => Math.min(0.56, Math.max(0.12, inW(x, y)));
    const kinks = [M.FRONTDECK_X1, M.FRONTDECK_SLOPE_X1];                       // deck-height kinks: keep the wall tops under the deck
    const floorMat = U.mat(0x3a3e40, { roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide });   // dark-grey tread plate
    const floor = new THREE.Group(); floor.name='forepeakStairs';
    const edges=[forwardDoorX,...CB90.BOW_STEPS.map(t=>forwardDoorX+t*corridorLength),sillX];
    for(let i=0;i<edges.length-1;i++) {
      const x0=edges[i],x1=edges[i+1],y=fy((x0+x1)/2);
      floor.add(deckStrip(x0,x1,()=>y,x=>-cw(x,y),x=>cw(x,y),floorMat,.12));
      if(i) {
        const below=fy(x0-.001), w=cw(x0,below), step=new THREE.Mesh(U.loft([[V(x0,below,-w),V(x0,below,w)],[V(x0,y,-cw(x0,y)),V(x0,y,cw(x0,y))]],{flip:true}),enamel);
        floor.add(step);
        // Contrasting tread nosing follows the available inner hull section.
        floor.add(U.box(.025,.008,2*(cw(x0+.015,y)-.018),aluminium,[x0+.015,y+.005,0]));
      }
    }
    interior.add(floor); parts.bowCorridor = floor;
    const railY = (x) => Math.min(U.lerp(cockpitFloorY,sillY,(x-forwardDoorX)/corridorLength)+.50,top(x)-.10);
    for(const side of [-1,1]) {
      const railZ=x=>Math.min(.525,cw(x,railY(x))-.03);
      interior.add(U.tube([forwardDoorX+.08,12.0,13.0,sillX-.15].map(x=>V(x,railY(x),side*railZ(x))),.016,aluminium,28));
      // Fasten the rail to intact wall sections outside the two storage openings.
      // At the narrowing bow, use the actual ruled-wall surface, not the outer hull.
      for(const x of [forwardDoorX+.08,13.0,sillX-.15]) {
        const y=railY(x),low=fy(x),high=top(x);
        const wallZ=U.lerp(cw(x,low),cw(x,high),(y-low)/(high-low));
        interior.add(U.bar(V(x,y,side*railZ(x)),V(x,y,side*wallZ),.012,aluminium));
        interior.add(U.cyl(.027,.027,.020,aluminium,12,[x,y,side*(wallZ+.004)],'z'));
      }
    }
    for(const x of [12.4,13.6]) interior.add(U.box(.27,.03,.09,lampMat,[x,top(x)-.034,.40]));
    // SHK Fig.4 labels two stowage fields; Fig.5 identifies them on the
    // starboard wall (image-left when viewed from the bow), with green rope aft.
    // Port-side duplication and the two small forward lightening holes are not
    // inferred from that partly obscured photograph. These are real recesses,
    // not dark rectangles laid over an intact passage wall.
    const niches=[
      {id:'aftLow',polygon:[[10.97,-.09],[11.01,-.13],[11.54,-.13],[11.58,-.09],[11.58,.29],[11.54,.33],[11.01,.33],[10.97,.29]],depth:.22},
      {id:'upper',polygon:[[11.68,.46],[11.71,.43],[12.26,.51],[12.76,1.04],[12.75,1.08],[11.71,1.10],[11.68,1.07]],depth:.22},
    ];
    const storage=new THREE.Group();storage.name='forepeakStarboardStowage';parts.bowStowage=storage;interior.add(storage);
    const intervals=(polygon,x)=>{
      const ys=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i],b=polygon[(i+1)%polygon.length];
        if(Math.abs(a[0]-b[0])<1e-8)continue;
        if(x>=Math.min(a[0],b[0])-1e-7&&x<=Math.max(a[0],b[0])+1e-7)ys.push(U.lerp(a[1],b[1],(x-a[0])/(b[0]-a[0])));
      }
      return [Math.min(...ys),Math.max(...ys)];
    };
    const splits=Array.from(new Set(edges.concat(niches.flatMap(n=>n.polygon.map(p=>p[0]))))).sort((a,b)=>a-b);
    for(let i=0;i<splits.length-1;i++) {
      const a=splits[i],b=splits[i+1],x=(a+b)/2,y=fy(x);
      interior.add(ribbon(a,b,xx=>V(xx,y,-cw(xx,y)),xx=>V(xx,top(xx),-cw(xx,top(xx))),enamel,.12,kinks));
      const niche=niches.find(n=>x>Math.min(...n.polygon.map(p=>p[0]))&&x<Math.max(...n.polygon.map(p=>p[0])));
      const bands=niche?[[()=>y,xx=>intervals(niche.polygon,xx)[0]],[xx=>intervals(niche.polygon,xx)[1],top]]:[[()=>y,top]];
      for(const [low,high] of bands)interior.add(ribbon(a,b,xx=>V(xx,low(xx),cw(xx,low(xx))),xx=>V(xx,high(xx),cw(xx,high(xx))),enamel,.12,kinks));
    }
    const nicheBack=U.mat(0x526055,{roughness:.95,side:THREE.DoubleSide});
    for(const niche of niches) {
      const pocket=new THREE.Group();pocket.name='forepeakStowage_'+niche.id;pocket.userData={source:'SHK RM 2008:02 Fig.4/5',depth:niche.depth};storage.add(pocket);
      const shape=new THREE.Shape(niche.polygon.map(p=>new THREE.Vector2(...p))),back=new THREE.Mesh(new THREE.ShapeGeometry(shape),nicheBack);
      back.position.z=.56+niche.depth;pocket.add(back);
      for(let i=0;i<niche.polygon.length;i++) {
        const a=niche.polygon[i],b=niche.polygon[(i+1)%niche.polygon.length],a0=V(a[0],a[1],.56),b0=V(b[0],b[1],.56),a1=a0.clone().add(V(0,0,niche.depth)),b1=b0.clone().add(V(0,0,niche.depth));
        pocket.add(new THREE.Mesh(U.loft([[a0,b0],[a1,b1]],{}),insideMat));
        pocket.add(U.bar(a0,b0,.012,enamel));
      }
      if(niche.id==='aftLow') {
        const pts=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*12;pts.push(V(11.28+.19*Math.cos(a),.065+.13*Math.sin(a),.625+.018*a/(Math.PI*2)));}
        pocket.add(U.tube(pts,.014,U.mat(0x4a6245,{roughness:1,metalness:0}),200));
      }
    }
  }

  // ---------------------------------------------------------------- waterjet intakes
  {
    const intakes = new THREE.Group(); intakes.name = 'intakes'; group.add(intakes); parts.intakes = intakes;
    [1, -1].forEach((sgn) => {
      const xm = (M.JET_INTAKE_X0 + M.JET_INTAKE_X1) / 2;
      const s = U.stationAt(xm);
      const y = s.keelY + Math.abs(M.JET_Z) / s.chineZ * (s.chineY - s.keelY);
      const rec = U.box(M.JET_INTAKE_X1 - M.JET_INTAKE_X0, 0.10, M.JET_INTAKE_W, darkMat, [xm, y - 0.03, sgn * M.JET_Z]);
      intakes.add(rec);
      for (let i = 0; i < 5; i++) {                                            // grid bars
        const x = M.JET_INTAKE_X0 + (i + 0.5) * (M.JET_INTAKE_X1 - M.JET_INTAKE_X0) / 5;
        intakes.add(U.box(0.05, 0.04, M.JET_INTAKE_W, U.metal(), [x, y - 0.005, sgn * M.JET_Z]));
      }
    });
  }

  // ---------------------------------------------------------------- articulated parts
  // Every lid: a light-grey panel over an opening in the deck plate, with a dark recess box underneath.
  function recess(x, y, z, lx, lz) {
    // Four thin coaming walls only: no opaque box fills the aperture below an open lid.
    const r = new THREE.Group(); r.name = 'openHatchCoaming';
    const d=0.10,t=0.022;
    for(const side of [-1,1]) {
      r.add(U.box(t,d,lz+0.04,rail,[x+side*(lx/2-t/2),y-d/2,z]));
      r.add(U.box(lx,d,t,rail,[x,y-d/2,z+side*(lz/2-t/2)]));
    }
    decks.add(r); return r;
  }
  function lidPanel(lx, lz, thick, cx, cz, exteriorHandle) {
    const t=thick||.05, p=new THREE.Group();
    p.add(U.box(lx,t,lz,lidMat,[cx,t/2,cz]));
    p.add(U.box(lx-.065,.012,lz-.065,deckMat,[cx,t+.007,cz]));
    for(const side of [-1,1]) {
      p.add(U.box(lx-.055,.02,.018,rail,[cx,-.01,cz+side*(lz/2-.03)]));
      p.add(U.box(.018,.02,lz-.065,rail,[cx+side*(lx/2-.03),-.01,cz]));
    }
    // Flush folding D handle with foot pads and through-bolts, plus inner stiffening ribs.
    if(exteriorHandle!==false) {
      for(const dx of [-.1,.1]) {
        p.add(U.box(.04,.02,.05,rail,[cx+dx,t+.03,cz]));
        p.add(U.cyl(.014,.014,.025,aluminium,8,[cx+dx,t+.055,cz]));
      }
      p.add(U.tube([V(cx-.1,t+.04,cz),V(cx-.1,t+.085,cz),V(cx+.1,t+.085,cz),V(cx+.1,t+.04,cz)],.012,aluminium,12));
    }
    for(const dx of [-lx*.28,lx*.28]) p.add(U.box(.035,.045,lz-.12,lidMat,[cx+dx,-.026,cz]));
    return p;
  }
  function addHinge(id, label, kind, pivot, axis, closed, open, speed, parent) {
    const rec = U.hinge({ id: id, label: label, kind: kind, parent: parent || group, pivot: pivot, axis: axis, closed: closed, open: open, speed: speed });
    articulations.push(rec); return rec;
  }

  // SHK RM 2008:02 p.15/Fig.4: spring-assisted lids and two rubber-damped
  // ramp chains. Each visible mechanism keeps both ends attached throughout
  // articulation. Sizes/attachment offsets are reconstructed from photographs.
  parts.hatchGasSprings=[]; parts.rampChains=[];
  function gasSpring(rec, fixedPoint, leafPoint, barrelLength, suffix) {
    const parent=rec.pivot.parent,g=new THREE.Group();g.name='gasSpring_'+suffix;parent.add(g);
    const a=V(...fixedPoint),b=V(),p=V(),rodStart=V(),moving=V(...leafPoint);
    const body=U.bar(a,a.clone().add(V(0,.1,0)),.018,rail);
    const rod=U.bar(a,a.clone().add(V(0,.1,0)),.008,aluminium);g.add(body,rod);
    const fixedLug=U.box(.065,.055,.055,lidMat,fixedPoint),leafLug=U.box(.065,.055,.055,lidMat,leafPoint);
    parent.add(fixedLug);rec.pivot.add(leafLug);
    // Carry the fixed clevis up to the coaming. This remains structurally
    // attached where the bow's stowage opening sits behind the lower lug.
    const mountZ=Math.sign(a.z)*(rec.axis==='x'?.55:.43),mountTop=rec.pivot.position.y;
    parent.add(U.box(.065,mountTop-a.y,.035,lidMat,[a.x,(mountTop+a.y)/2,mountZ]));
    const fixedEye=new THREE.Mesh(new THREE.SphereGeometry(.021,10,6),rail),leafEye=fixedEye.clone();
    fixedEye.position.copy(a);g.add(fixedEye,leafEye);
    const mechanism={group:g,rec,fixedPoint:a,movingPoint:moving,body,rod,leafEye,barrelLength};
    let previous=-1;
    const update=()=>{
      if(previous===rec.value)return;previous=rec.value;
      rec.pivot.updateMatrix();b.copy(moving).applyMatrix4(rec.pivot.matrix);
      const length=a.distanceTo(b);p.copy(a).lerp(b,Math.min(barrelLength,length*.85)/length);
      U.setBar(body,a,p);U.setBar(rod,rodStart.copy(p).lerp(a,.08),b);leafEye.position.copy(b);
    };
    mechanismUpdates.push(update);parts.hatchGasSprings.push(mechanism);update();
  }
  function rampChain(rec, leafPoint, fixedPoint, suffix) {
    const a=V(...fixedPoint),b=V(),moving=V(...leafPoint),g=new THREE.Group();
    g.name='rampStopChain_'+suffix;group.add(g);
    // Length is fixed from the fully lowered endpoint separation. The elastic
    // keeper draws surplus chain aft along the wall when the ramp is shut;
    // without it a gravity-only loop would drop through the rising hull bottom.
    const endOpen=moving.clone().applyAxisAngle(V(0,0,1),U.deg(rec.open)).add(rec.pivot.position);
    const length=a.distanceTo(endOpen)*1.008, count=Math.ceil(length/.028);
    const links=new THREE.InstancedMesh(new THREE.TorusGeometry(.0105,.0032,6,10),aluminium,count);
    links.instanceMatrix.setUsage(THREE.DynamicDrawUsage);links.name='chainLinks';g.add(links);
    const damper=U.bar(a,a.clone().add(V(.10,0,0)),.018,U.rubber());damper.name='rubberChainDamper';g.add(damper);
    const elasticAnchor=V(a.x-.31,a.y+.025,a.z),elastic=U.bar(elasticAnchor,a,.004,U.rubber());g.add(elastic);
    group.add(U.box(.065,.075,.065,lidMat,[a.x,a.y,a.z]));
    rec.pivot.add(U.box(.06,.045,.05,rail,leafPoint));
    const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),twist=new THREE.Quaternion(),scale=V(1,1.65,1),point=V(),direction=V(),up=V(0,1,0);
    const points=Array.from({length:97},()=>V()),cumulative=new Float64Array(97),arcPoint=V(),arcPrevious=V();
    const curve=(out,t,slack)=>{
      const u=1-t,aa=u*u*u,qq=3*u*t,bb=t*t*t;
      return out.set(a.x*aa+((a.x+b.x)/2-slack)*qq+b.x*bb,a.y*aa+(a.y+b.y)/2*qq+b.y*bb,a.z*aa+(a.z+b.z)/2*qq+b.z*bb);
    };
    const arcLength=slack=>{let sum=0;arcPrevious.copy(a);for(let i=1;i<=48;i++){curve(arcPoint,i/48,slack);sum+=arcPoint.distanceTo(arcPrevious);arcPrevious.copy(arcPoint);}return sum;};
    const mechanism={group:g,rec,fixedPoint:a,movingPoint:moving,links,length,damper,elastic,points};
    let previous=-1;
    const update=()=>{
      if(previous===rec.value)return;previous=rec.value;
      rec.pivot.updateMatrix();b.copy(moving).applyMatrix4(rec.pivot.matrix);
      let lo=0,hi=length*1.5;
      for(let i=0;i<15;i++){const mid=(lo+hi)/2;if(arcLength(mid)<length)lo=mid;else hi=mid;}
      for(let i=0;i<points.length;i++)curve(points[i],i/96,(lo+hi)/2);
      for(let i=1;i<points.length;i++)cumulative[i]=cumulative[i-1]+points[i].distanceTo(points[i-1]);
      let segment=1;
      for(let i=0;i<count;i++) {
        const distance=cumulative[96]*i/(count-1);
        while(segment<96&&cumulative[segment]<distance)segment++;
        point.copy(points[segment-1]).lerp(points[segment],(distance-cumulative[segment-1])/(cumulative[segment]-cumulative[segment-1]));
        direction.subVectors(points[segment],points[segment-1]).normalize();quaternion.setFromUnitVectors(up,direction);
        twist.setFromAxisAngle(up,i%2?Math.PI/2:0);quaternion.multiply(twist);
        matrix.compose(point,quaternion,scale);links.setMatrixAt(i,matrix);
      }
      links.instanceMatrix.needsUpdate=true;
      U.setBar(damper,points[4],points[12]);U.setBar(elastic,elasticAnchor,points[39]);
    };
    mechanismUpdates.push(update);parts.rampChains.push(mechanism);update();
  }

  // 1. Stävport / landstigningsramp: the whole raked stem face above the sill is the landing door (54° from vertical in
  //    the Dockstavarvet profile), bottom-hinged on the sill and lowered forward until it lies ~25° below horizontal.
  //    Built in the plate frame (y = up the rake, x = outward normal, z = athwartships). The short vertical nose under the
  //    deck corner, with the broad bow rubber, sits on top of the plate in the hinge frame, so the closed door reproduces
  //    the drawn nose-then-rake profile and the whole face swings forward and down when the ramp is lowered.
  {
    const F = M.RAMP_FACE, dx = F.x1 - F.x0, dy = F.y1 - F.y0, rake = Math.atan2(dx, dy);
    const ux = Math.sin(rake), uy = Math.cos(rake), nx = uy, ny = -ux;       // up the rake / outward normal of the closed face (forward-down)
    const faceX = -((M.RAMP_HINGE_X - F.x0) * nx + (M.RAMP_HINGE_Y - F.y0) * ny);   // outer face plane, from the hinge along the normal
    const L = (F.x1 - M.RAMP_HINGE_X - faceX * nx) / ux;                       // plate length: its OUTER top corner lands on (F.x1, F.y1)
    const wBot = S(M.RAMP_HINGE_X).keelZ, wTop = S(F.x1).keelZ;                 // blunt-face half-widths at the sill / top of the rake
    const h = S(M.STEM_X).deckY - M.RAMP_HINGE_Y, noseX = M.STEM_X - M.RAMP_HINGE_X;   // deck corner relative to the hinge
    const toHull = new THREE.Matrix4().makeTranslation(M.RAMP_HINGE_X, M.RAMP_HINGE_Y, 0);
    const faceUv = (v) => v.z * 0.9;                                            // paint pattern runs across the face, not along one column
    const rec = addHinge('ramp_bow', 'Stävport / landstigningsramp', 'ramp', [M.RAMP_HINGE_X, M.RAMP_HINGE_Y, 0], 'z', 0, M.RAMP_OPEN_DEG, 2.0);
    const plate = new THREE.Group(); plate.name = 'rampPlate'; plate.rotation.z = -rake; plate.updateMatrix(); rec.pivot.add(plate);
    const panel = U.extrudeShape([[-wBot, 0], [wBot, 0], [wTop, L], [-wTop, L]], M.RAMP_T, U.camoMaterial({ roughness: 0.85 }));
    panel.rotation.y = -Math.PI / 2; panel.position.x = faceX;                  // shape x -> +Z, depth -> -x (inward from the outer face)
    panel.updateMatrix();
    panel.geometry = U.applyCamo(panel.geometry, toHull.clone().multiply(plate.matrix).multiply(panel.matrix), faceUv);
    panel.material = U.cloneCamoMaterial(panel.material); panel.material.vertexColors = true;
    plate.add(panel); parts.bowRamp = panel; parts.rampPlate = plate;
    // Rubber D-strips down both raked edges of the door: the hatched stem strip of the profile drawing and the dark
    // edges of the stem face in the 845 illustration.
    for (const side of [-1, 1]) {                                                // 3 cm proud, 10 cm wide, ending just above the sill
      const strip = U.box(0.03, L - 0.02, 0.10, U.rubber(), [faceX + 0.015, L / 2, side * ((wBot + wTop) / 2 - 0.04)]);
      strip.rotation.x = side * Math.atan2(wTop - wBot, L); strip.name = 'rampEdgeRubber'; plate.add(strip);
    }
    // treads + a rubbing bar + side stiffeners on the inner (aft) face
    for (let i = 1; i <= 3; i++) {
      const w = U.lerp(wBot, wTop, i / 4) * 1.7;                                // treads span the trapezoid, never wider than it
      plate.add(U.box(0.05, 0.04, w, rail, [faceX - M.RAMP_T - 0.02, L * i / 4, 0]));
    }
    plate.add(U.box(0.06, 0.06, wTop * 1.8, rail, [faceX - M.RAMP_T - 0.03, L - 0.06, 0]));
    for (const side of [-1, 1]) plate.add(U.box(.025, L * .70, .045, rail, [faceX - M.RAMP_T - .02, L * .50, side * wTop * .53]));
    // Two separate hinges, as specified in the H boat handbook / SHK p.15.
    for(const side of [-1,1]) {
      const z=side*wBot*.66;
      rec.pivot.add(U.cyl(.035,.035,.17,aluminium,12,[0,0,z],'z'));
      rec.pivot.add(U.box(.10,.065,.075,rail,[.035,.012,z]));
      group.add(U.box(.12,.065,.075,rail,[M.RAMP_HINGE_X-.070,M.RAMP_HINGE_Y+.040,z]));
    }
    // Continuous sealing strip on the inner perimeter of the trapezoid.
    const sealX=faceX-M.RAMP_T-.006,seal=[V(sealX,.035,-wBot+.035),V(sealX,.035,wBot-.035),V(sealX,L-.035,wTop-.035),V(sealX,L-.035,-wTop+.035)];
    for(let i=0;i<4;i++)plate.add(U.bar(seal[i],seal[(i+1)%4],.009,U.rubber()));
    for(const side of [-1,1]) {
      const local=V(faceX-M.RAMP_T-.045,L*.82,side*wTop*.83).applyMatrix4(plate.matrix);
      rampChain(rec,local.toArray(),[13.70,.98,side*.505],side<0?'P':'S');
      // Keeper on the moving leaf, over-centre handle on the fixed cheek.
      const keeper=V(faceX-M.RAMP_T-.03,L-.055,side*wTop*.82);
      plate.add(U.box(.065,.07,.065,aluminium,keeper.toArray()));
      const closed=keeper.clone().applyMatrix4(plate.matrix).add(rec.pivot.position),lock=new THREE.Group();
      lock.name='rampOverCentreLock'+(side<0?'P':'S');lock.position.copy(closed).add(V(-.07,.005,0));group.add(lock);
      lock.add(U.box(.10,.035,.055,rail,[0,0,0]));
      const handle=new THREE.Group();lock.add(handle);
      handle.add(U.cyl(.014,.014,.06,aluminium,10,[0,.02,0],'z'));
      handle.add(U.box(.14,.018,.028,aluminium,[.055,.034,0]));
      mechanismUpdates.push(()=>{handle.rotation.z=-Math.min(1,rec.value*8)*1.25;});
      // Positive stop behind the leaf; closed position presses the gasket.
      group.add(U.box(.055,.045,.055,rail,[closed.x-.035,closed.y-.055,closed.z]));
    }
    // Rope-and-tackle hoist along the port wall, with a moving lower block.
    // The exact production rope routing is not dimensioned in the public source.
    {
      const fixed=V(13.73,1.035,-.505),moving=V(faceX-M.RAMP_T-.05,L*.60,-wTop*.76).applyMatrix4(plate.matrix),b=V();
      const pulleyMat=U.mat(0x4b524b,{roughness:.65,metalness:.3}),ropeMat=U.mat(0x4b493b,{roughness:1,metalness:0});
      const pulleyGeo=new THREE.TorusGeometry(.035,.009,6,16),fixedBlock=new THREE.Mesh(pulleyGeo,pulleyMat),movingBlock=fixedBlock.clone();
      fixedBlock.position.copy(fixed);group.add(fixedBlock,movingBlock);
      const ropeA=U.bar(fixed,fixed.clone().add(V(.1,0,0)),.006,ropeMat),ropeB=ropeA.clone();group.add(ropeA,ropeB);
      group.add(U.bar(V(forwardDoorX+.18,1.035,-.51),fixed,.006,ropeMat));
      const topFixed=fixed.clone().add(V(0,.031,0)),bottomFixed=fixed.clone().add(V(0,-.031,0)),ropeEnd=V();let previous=-1;
      mechanismUpdates.push(()=>{
        if(previous===rec.value)return;previous=rec.value;
        rec.pivot.updateMatrix();b.copy(moving).applyMatrix4(rec.pivot.matrix);movingBlock.position.copy(b);
        ropeEnd.copy(b);ropeEnd.y+=.031;U.setBar(ropeA,topFixed,ropeEnd);
        ropeEnd.copy(b);ropeEnd.y-=.031;U.setBar(ropeB,bottomFixed,ropeEnd);
      });
    }
    // Nose block: from the top of the rake the door continues to the deck corner with a short vertical face (0.97..1.10 in
    // the profile), which carries the broad bow rubber. Its chamfered ends overlap the fixed shoulder pads.
    const noseH = M.STEM_DECK_Y - F.y1;                                         // 0.95 .. 1.10: rake top -> deck corner (2 cm of it shows under the rubber)
    const noseGeo = new THREE.BoxGeometry(0.11, noseH, 2 * wTop + 0.06); noseGeo.translate(noseX - 0.055, h - noseH / 2, 0);
    const nose = U.camoMesh(noseGeo, toHull, { uvShift: faceUv }); nose.material = U.cloneCamoMaterial(nose.material); nose.material.vertexColors = true; nose.name = 'rampNose';
    rec.pivot.add(nose);
    const bumperHalfW = wTop + 0.16, bumperY = h - .065, bh = .065, chamfer = .03;   // 0.97 .. 1.10 above the waterline, as drawn
    const bumper=U.extrudeShape([
      [-bumperHalfW+chamfer,bumperY-bh],[bumperHalfW-chamfer,bumperY-bh],
      [bumperHalfW,bumperY-bh+chamfer],[bumperHalfW,bumperY+bh-chamfer],
      [bumperHalfW-chamfer,bumperY+bh],[-bumperHalfW+chamfer,bumperY+bh],
      [-bumperHalfW,bumperY+bh-chamfer],[-bumperHalfW,bumperY-bh+chamfer]
    ],.105,U.rubber());
    bumper.rotation.y=-Math.PI/2;bumper.position.x=noseX+.09;bumper.name='rampRubberFace';
    rec.pivot.add(bumper);parts.bowBumper=bumper;
  }
  // 2/3. Bow deck hatches (gull-wing, hinged outboard, free inboard edge lifts). They sit on a frame at the local
  //      foredeck height, tilted with the foredeck slope, so the flat lids lie flush on the sloping deck.
  {
    const lidX0=12.13,lidX1=OPEN.bow.x1,lidLength=lidX1-lidX0,hx=(lidX0+lidX1)/2;
    const hy=(sheerDeckY(lidX0)+sheerDeckY(lidX1))/2;
    const frame = new THREE.Group(); frame.name = 'bowHatchFrame';
    frame.position.set(hx, hy, 0);
    frame.rotation.z = Math.atan2(sheerDeckY(lidX1)-sheerDeckY(lidX0),lidLength);
    group.add(frame); parts.bowHatchFrame = frame;
    [['hatch_bowP', 'Stävlucka babord', -1, -95], ['hatch_bowS', 'Stävlucka styrbord', 1, 95]].forEach((h) => {
      const sgn = h[2];
      const rec = addHinge(h[0], h[1], 'hatch', [0, 0, sgn * 0.55], 'x', 0, h[3], 1.4, frame);
      // The 925 lid tops have painted stiffeners, without generic centre D handles.
      rec.pivot.add(lidPanel(lidLength, 0.55, 0.05, 0, -sgn * 0.275,false));
      rec.pivot.add(U.box(lidLength, 0.06, 0.06, lidMat, [0, 0.05, -sgn * 0.53]));
      // Visible hinge barrels, mounting ears and locking crossbar from the
      // supplied foredeck photo. All hardware belongs to its moving leaf.
      for(const dx of [-lidLength/2+.095,lidLength/2-.095]) {
        rec.pivot.add(U.cyl(.028,.028,.15,lidMat,12,[dx,.065,-sgn*.025],'x'));
        rec.pivot.add(U.box(.045,.09,.065,lidMat,[dx,.055,-sgn*.055]));
        rec.pivot.add(U.box(.045,.055,.065,lidMat,[dx,.07,-sgn*.50]));
      }
      rec.pivot.add(U.cyl(.018,.018,.47,lidMat,12,[-lidLength/2+.195,.095,-sgn*.275],'z'));
      gasSpring(rec,[-lidLength/2+.35,-.25,sgn*.52],[-lidLength/2+.35,-.035,-sgn*.40],.34,h[0]);
      // Sealing strip is under the lid, clear of the walking surface.
      const seal=[V(-lidLength/2+.035,-.018,-sgn*.025),V(lidLength/2-.035,-.018,-sgn*.025),V(lidLength/2-.035,-.018,-sgn*.525),V(-lidLength/2+.035,-.018,-sgn*.525)];
      for(let i=0;i<4;i++)rec.pivot.add(U.bar(seal[i],seal[(i+1)%4],.006,U.rubber()));
      if(sgn===-1) {
        // Port lid closes over and locks the starboard lid. The underside
        // espagnolette has a longitudinal shaft, central handle and end forks.
        rec.pivot.add(U.box(lidLength-.02,.018,.05,lidMat,[0,.085,.55]));
        rec.pivot.add(U.cyl(.012,.012,lidLength-.11,aluminium,10,[0,-.065,.40],'x'));
        for(const x of [-lidLength/2+.085,0,lidLength/2-.085])rec.pivot.add(U.box(.045,.055,.065,rail,[x,-.055,.40]));
        rec.pivot.add(U.tube([V(-.10,-.085,.36),V(0,-.085,.17),V(.10,-.085,.36),V(-.10,-.085,.36)],.012,aluminium,16));
        for(const x of [-lidLength/2+.035,lidLength/2-.035])for(const side of [-1,1])rec.pivot.add(U.box(.10,.025,.025,aluminium,[x,-.075,.40+side*.035]));
      }
      // Loose dark mooring line rests on the starboard leaf and follows it
      // when opened, instead of being left floating across the opening.
      if(sgn===1) {
        const ropeMat=U.mat(0x262923,{roughness:1,metalness:0});
        const rope=new THREE.Group();rope.name='bowMooringLine';rec.pivot.add(rope);parts.bowMooringLine=rope;
        const pts=[];
        for(let i=0;i<=360;i++) {
          const a=i/360*Math.PI*16,n=a/(Math.PI*2),turn=.27*Math.sin(n*2.1),rx=.18+.04*Math.sin(n*1.9),rz=.082+.018*Math.sin(n*2.7);
          const x=Math.cos(a)*rx,z=Math.sin(a)*rz;
          pts.push(V(.10+.065*Math.sin(n*2.4)+x*Math.cos(turn)-z*Math.sin(turn),.105+.010*n+.009*Math.sin(a*2.3),-.28+.032*Math.sin(n*2)+x*Math.sin(turn)+z*Math.cos(turn)));
        }
        rope.add(U.tube(pts,.015,ropeMat,400));
        rope.add(U.tube([V(-.12,.105,-.28),V(-.36,.104,-.38),V(-.57,.105,-.32),V(-.50,.106,-.17),V(-.27,.105,-.22),V(.22,.14,-.35)],.015,ropeMat,48));
      }

    });
    // (the opening OPEN.bow in the foredeck looks straight down into the bow corridor built above)
  }
  // 4. Watertight door: three frame pieces leave a real opening through the forward bulkhead.
  {
    // SHK RM 2008:02 (printed pp.14-15): starboard hinges, opening aft into the
    // transport space. It must not sweep forward through the rising bow passage.
    const doorGap=.025, openingHeight=M.WH_FLOOR_Y+.75-cockpitFloorY, doorHeight=openingHeight-doorGap;
    const rec = addHinge('door_wtFwd', 'Vattentät dörr (förpik)', 'door', [forwardDoorX, cockpitFloorY+doorGap, 0.42], 'y', 0, 90, 1.4);
    rec.pivot.add(U.box(0.055,doorHeight,0.82,enamel,[0,doorHeight/2,-0.41]));
    rec.pivot.add(U.box(0.067,doorHeight-.08,0.73,insideMat,[-.012,doorHeight/2,-0.41]));
    // Four dogs are specified in the report. Fig.5/7 show the lower central
    // dog and two at the free port edge; the obscured fourth is reconstructed
    // at upper centre. The old four-corner arrangement was not photographic.
    parts.forwardDoorDogs=[];
    const dogs=[['bottom',.105,-.41,1],['portLow',doorHeight*.23,-.735,1],['portHigh',doorHeight*.70,-.735,1],['top',doorHeight-.105,-.41,-1]];
    for(const [name,sy,sz,direction] of dogs) {
      const dog=new THREE.Group();dog.name='forwardDoorDog_'+name;dog.position.set(0,sy,sz);rec.pivot.add(dog);parts.forwardDoorDogs.push(dog);
      dog.userData={source:name==='top'?'Inferred fourth position; SHK text confirms total four':'SHK RM 2008:02 Fig.5/7'};
      dog.add(U.cyl(.019,.019,.15,aluminium,10,[0,0,0],'x'));
      for(const face of [-1,1]) {
        dog.add(U.cyl(.030,.030,.014,rail,12,[face*.041,0,0],'x'));
        dog.add(U.tube([V(face*.065,0,0),V(face*.090,0,direction*.045),V(face*.085,0,direction*.13)],.012,aluminium,10));
      }
      mechanismUpdates.push(()=>{dog.rotation.x=-Math.min(1,rec.value*10)*Math.PI/2;});
    }
    // The continuous frame gasket is visible when the watertight leaf is open.
    const gasket=[V(forwardDoorX+.035,cockpitFloorY+.028,-.42),V(forwardDoorX+.035,cockpitFloorY+.028,.42),V(forwardDoorX+.035,cockpitFloorY+openingHeight,.42),V(forwardDoorX+.035,cockpitFloorY+openingHeight,-.42)];
    for(let i=0;i<4;i++)interior.add(U.bar(gasket[i],gasket[(i+1)%4],.006,U.rubber()));
    const frameTop=trunkTopY(forwardDoorX), frameHeight=frameTop-cockpitFloorY;
    interior.add(U.box(.08,frameHeight,.12,enamel,[forwardDoorX,cockpitFloorY+frameHeight/2,-.49]));
    interior.add(U.box(.08,frameHeight,.12,enamel,[forwardDoorX,cockpitFloorY+frameHeight/2,.49]));
    interior.add(U.box(.08,frameHeight-openingHeight,1.10,enamel,[forwardDoorX,(frameTop+cockpitFloorY+openingHeight)/2,0]));
    interior.add(U.box(.09,.025,.92,aluminium,[forwardDoorX,cockpitFloorY+.006,0]));
    parts.forwardDoor=rec.pivot;
  }
  // 5. Troop-compartment hatch in the trunk top (hinged forward, aft edge lifts)
  {
    const rec = addHinge('hatch_troopAft', 'Transportrumslucka', 'hatch', [troopHatchX1, M.TRUNK_Y, 0], 'z', 0, -95, 1.6);
    rec.pivot.add(lidPanel(1.10, 0.90, 0.05, -0.55, 0));
    rec.pivot.add(U.box(0.06, 0.06, 0.90, rail, [-1.08, 0.05, 0]));
    for(const side of [-1,1])gasSpring(rec,[troopHatchX1-.15,M.TRUNK_Y-.27,side*.39],[-.62,-.03,side*.36],.44,'troop'+(side<0?'P':'S'));
    recess(troopHatchX, M.TRUNK_Y, 0, 1.10, 0.90, 1.2);
    const ladderTop=M.TRUNK_Y-0.23, ladderBottom=M.TROOP_FLOOR_Y+0.10;
    const ladderSteps=Math.max(2,Math.ceil((ladderTop-ladderBottom)/0.34)+1);
    for(let i=0;i<ladderSteps;i++) interior.add(U.box(0.64,0.035,0.13,aluminium,[troopHatchX,U.lerp(ladderTop,ladderBottom,i/(ladderSteps-1)),0.35]));
    for(const x of [troopHatchX-.35,troopHatchX+.35]) interior.add(U.bar(V(x,M.TROOP_FLOOR_Y+.05,.35),V(x,M.TRUNK_Y+.01,.35),.022,aluminium));
  }
  // 6/7. Engine-room working hatches in the aft deck (hinged outboard, free inboard edge lifts)
  [['hatch_engineP', 'Maskinrumslucka babord', -1, -90], ['hatch_engineS', 'Maskinrumslucka styrbord', 1, 90]].forEach((h) => {
    const sgn = h[2];
    const rec = addHinge(h[0], h[1], 'hatch', [engineLidX, M.AFTDECK_Y, sgn * 1.45], 'x', 0, h[3], 1.5);
    rec.pivot.add(lidPanel(engineLidLength, 1.00, 0.04, 0, -sgn * 0.50));
    rec.pivot.add(U.box(engineLidLength, 0.05, 0.05, rail, [0, 0.04, -sgn * 0.97]));
    recess(engineLidX, M.AFTDECK_Y, sgn * 0.95, engineLidLength, 1.00, 1.2);
  });
  // 8. Engine-room companionway hatch on a hollow coaming (hood), far aft (hinged aft, forward edge lifts)
  {
    const hx0 = 0.30, hx1 = 0.95, hz = 0.33, hy0 = M.AFTDECK_Y - 0.01, hy1 = M.AFTDECK_Y + 0.30, t = 0.03, hh = hy1 - hy0, hyc = (hy0 + hy1) / 2;
    decks.add(U.box(t, hh, 2 * hz, deckMatOwn, [hx0 + t / 2, hyc, 0]));
    decks.add(U.box(t, hh, 2 * hz, deckMatOwn, [hx1 - t / 2, hyc, 0]));
    [1, -1].forEach((sgn) => decks.add(U.box(hx1 - hx0, hh, t, deckMatOwn, [(hx0 + hx1) / 2, hyc, sgn * (hz - t / 2)])));
    const rec = addHinge('hatch_engineCompanion', 'Nedgångskapp maskinrum', 'hatch', [hx0, hy1, 0], 'z', 0, 100, 1.3);
    rec.pivot.add(lidPanel(hx1 - hx0, 2 * hz, 0.05, (hx1 - hx0) / 2, 0));
    recess((hx0 + hx1) / 2, M.AFTDECK_Y, 0, OPEN.companion.x1 - OPEN.companion.x0, OPEN.companion.z1 - OPEN.companion.z0, 1.0);
  }

  // Batch static repeated fittings by material to keep the detailed interior inexpensive to draw.
  function batchStatic(target, recursive) {
    const sources=[]; target.updateMatrixWorld(true);
    if(recursive) target.traverse(o=>{if(o.isMesh)sources.push(o);});
    else target.children.forEach(o=>{if(o.isMesh)sources.push(o);});
    const inverse=new THREE.Matrix4().copy(target.matrixWorld).invert(), batches=new Map();
    for(const mesh of sources) {
      if(Array.isArray(mesh.material)) continue;
      const geo=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone());
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
      const key=mesh.material.uuid;
      if(!batches.has(key)) batches.set(key,{mat:mesh.material,p:[],n:[],uv:[]});
      const b=batches.get(key), pos=geo.attributes.position, nor=geo.attributes.normal, uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++) {
        b.p.push(pos.getX(i),pos.getY(i),pos.getZ(i)); b.n.push(nor.getX(i),nor.getY(i),nor.getZ(i));
        b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
      }
      mesh.parent.remove(mesh); geo.dispose();
    }
    for(const b of batches.values()) {
      const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
      geo.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));
      const mesh=new THREE.Mesh(geo,b.mat); mesh.receiveShadow=true; target.add(mesh);
    }
  }
  batchStatic(parts.troopSeats,true); batchStatic(engines,true); batchStatic(interior,false);

  // Low watertight companion door from the troop compartment into the machinery space.
  {
    const rec=addHinge('door_engine','Dörr till maskinrum','door',[4.0,M.TROOP_FLOOR_Y,.445],'y',0,105,1.5);
    rec.pivot.add(U.box(.055,engineDoorHeight,.875,enamel,[0,engineDoorHeight/2,-.4375]));
    rec.pivot.add(U.box(.018,engineDoorHeight-.14,.72,insideMat,[.037,engineDoorHeight/2,-.4375]));
    for(const y of [.20,engineDoorHeight-.24]) for(const z of [-.75,-.13]) {
      rec.pivot.add(U.cyl(.022,.022,.10,aluminium,10,[.075,y,z],'x'));
      rec.pivot.add(U.box(.025,.10,.026,rail,[.136,y+.025,z]));
    }
    rec.pivot.add(U.tube([V(.05,.61,-.73),V(.13,.61,-.73),V(.13,.79,-.73),V(.05,.79,-.73)],.014,aluminium,10));
    for(const side of [-1,1]) interior.add(U.box(.035,engineDoorHeight,.025,rail,[4.012,M.TROOP_FLOOR_Y+engineDoorHeight/2,side*.445]));
    parts.engineDoor=rec.pivot;
  }

  // ---------------------------------------------------------------- cutaway
  let cutaway = false;
  function setCutaway(on) {
    if (on === cutaway) return;
    cutaway = !!on;
    shellMats.forEach((m) => {
      m.transparent = cutaway || m.userData_orig_transparent === true;
      m.opacity = cutaway ? 0.22 : 1;
      m.depthWrite = !cutaway;
      m.side = THREE.DoubleSide;
      m.needsUpdate = true;
    });
  }

  U.shadowed(group);
  interior.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  mechanismUpdates.forEach(update=>update());

  return {
    group: group, parts: parts, articulations: articulations,
    update: function () { mechanismUpdates.forEach(update=>update()); }, setCutaway: setCutaway,
  };
};
