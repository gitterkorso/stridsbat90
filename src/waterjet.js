// Stridsbåt 90 H – waterjet module: two Kamewa FF-Jet 410 class units with steering nozzles and reversing buckets.
// Plain script; requires THREE (r128), constants.js and util.js. Adds CB90.buildWaterjets(THREE).
//
// Frame: hull frame (Y up, +X forward, +Z starboard). Each unit group sits at (0, JET_AXIS_Y, ±JET_Z); inside a unit
// x < 0 is aft of the transom. Hierarchy (see SPEC §7):
//   unit ─ flange, housing, fixed steering-shaft bracket
//        └ steerUnit (rotation.y = helm yaw, + = nozzle swings to starboard)
//             ├ nozzle, yoke, steering shaft + lever + tie-rod ball, reversing cylinder body, ahead stream
//             └ bucket (rotation.z = +value·50°, 0 = raised, 1 = lowered) ─ hood, cheeks, lug, reverse streams
// The tie rod joins the two lever balls; one steering cylinder from a transom bracket drives the SB lever.
window.CB90 = window.CB90 || {};
CB90.buildWaterjets = function (THREE) {
  const U = CB90.util, M = CB90.M, C = CB90.COLORS;
  const deg = U.deg;

  // ---------- constants derived from CB90.M (unit frame unless noted) ----------
  const STEER_X = M.JET_STEER_PIVOT_X;                       // -0.25 (vertical steering axis)
  const BUCKET_LX = M.JET_BUCKET_PIVOT_X - STEER_X;          // -0.22 (trunnions, steerUnit frame)
  const NOZZLE_EXIT_LX = M.JET_NOZZLE_X1 - STEER_X;          // -0.30 (steerUnit frame)
  const HOOD_LEN = M.JET_BUCKET_X1 - M.JET_BUCKET_PIVOT_X;   // -0.58 (aft reach of the raised hood, bucket frame)
  const HOOD_HALFW = M.JET_BUCKET_W / 2;                     // 0.375
  const LEVER_Y = M.JET_TIEROD_Y - M.JET_AXIS_Y;             // +0.40 (unit frame) = hull y +0.05
  const LEVER_LEN = 0.25;
  const BUCKET_MAX = deg(M.JET_BUCKET_MAX_DEG);
  const HELM_MAX = M.JET_STEER_MAX_DEG;
  const REV_ANCHOR = new THREE.Vector3(0.16, 0.30, 0);       // reversing cylinder trunnion (steerUnit frame)
  const REV_BODY_LEN = 0.30;
  const REV_ATTACH = new THREE.Vector3(0.03, 0.28, 0);       // rod eye on the bucket lug (bucket frame)
  const STEER_CYL_ANCHOR = new THREE.Vector3(-0.05, 0.05, 1.0); // transom bracket (hull frame)
  const STEER_CYL_BODY_LEN = 0.18;
  const AHEAD_LEN_MAX = 0.4 + 5.0, REV_LEN_MAX = 0.3 + 3.5;

  // ---------- materials ----------
  const alu = U.jetAlu(), steel = U.jetSteel(), hyd = U.hydraulic(), dark = U.darkMetal();
  const aluDouble = U.mat(C.JET_ALU, { roughness: 0.4, metalness: 0.75, side: THREE.DoubleSide, name: 'jetAluDouble' });
  const steelDouble = U.mat(C.JET_STEEL, { roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide, name: 'jetSteelDouble' });
  const hole = U.mat(0x101214, { roughness: 1, metalness: 0 });
  const rodMat = U.mat(0xd8dcdf, { roughness: 0.2, metalness: 0.95, name: 'chromeRod' });
  const streamMat = U.mat(C.JET_STREAM, { opacity: 0.55, transparent: true, emissive: 0x8fb8d0, roughness: 1 });
  streamMat.depthWrite = false;

  // ---------- small helpers ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /** Open-ended cone along -X: +X end (x = x0) radius r0, -X end (x = x1) radius r1. */
  function openCone(x0, r0, x1, r1, mat, segs) {
    const h = x0 - x1;
    const g = new THREE.CylinderGeometry(r0, r1, h, segs || 32, 1, true);
    const m = new THREE.Mesh(g, mat);
    m.rotation.z = -Math.PI / 2; // +Y -> +X (same convention as U.cyl axis 'x')
    m.position.set((x0 + x1) / 2, 0, 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  /** Disc facing -X at x. */
  function discAft(x, r, mat, segs) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, segs || 24), mat);
    m.rotation.y = -Math.PI / 2; // +Z normal -> -X
    m.position.set(x, 0, 0);
    return m;
  }
  function sphere(r, mat, pos) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = true;
    return m;
  }

  // ---------- jet stream meshes (cheap tube with per-frame vertex update) ----------
  const S_RINGS = 7, S_SEGS = 14;
  function makeStream() {
    const g = new THREE.BufferGeometry();
    const n = S_RINGS * S_SEGS + 2;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const idx = [];
    for (let i = 0; i < S_RINGS - 1; i++) for (let j = 0; j < S_SEGS; j++) {
      const a = i * S_SEGS + j, b = i * S_SEGS + (j + 1) % S_SEGS, c = a + S_SEGS, d = b + S_SEGS;
      idx.push(a, b, c, b, d, c);
    }
    const c0 = S_RINGS * S_SEGS, c1 = c0 + 1, last = (S_RINGS - 1) * S_SEGS;
    for (let j = 0; j < S_SEGS; j++) {
      idx.push(c0, (j + 1) % S_SEGS, j);                       // start cap (normal -dir)
      idx.push(c1, last + j, last + (j + 1) % S_SEGS);         // end cap (normal +dir)
    }
    g.setIndex(idx);
    const m = new THREE.Mesh(g, streamMat);
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false;
    m.renderOrder = 5;
    return m;
  }
  const _u = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _c = new THREE.Vector3(), _p = new THREE.Vector3();
  /** Write a tapered tube from origin along dir (both in the mesh's local frame). */
  function setStream(mesh, origin, dir, len, r0, r1) {
    const pos = mesh.geometry.attributes.position;
    _d.copy(dir).normalize();
    _u.set(0, 1, 0); if (Math.abs(_d.y) > 0.9) _u.set(1, 0, 0);
    _u.cross(_d).normalize();          // u ⟂ d
    _v.crossVectors(_d, _u).normalize(); // u × v = d  (right-handed)
    for (let i = 0; i < S_RINGS; i++) {
      const t = i / (S_RINGS - 1);
      _c.copy(origin).addScaledVector(_d, t * len);
      let r = U.lerp(r0, r1, t) * (0.9 + 0.1 * Math.sin(t * 9.0 + len) * t); // slight ripple along the stream
      if (i === S_RINGS - 1) r *= 0.55;                                       // tapered tip
      for (let j = 0; j < S_SEGS; j++) {
        const a = j / S_SEGS * Math.PI * 2;
        _p.copy(_c).addScaledVector(_u, Math.cos(a) * r).addScaledVector(_v, Math.sin(a) * r);
        pos.setXYZ(i * S_SEGS + j, _p.x, _p.y, _p.z);
      }
    }
    pos.setXYZ(S_RINGS * S_SEGS, origin.x, origin.y, origin.z);
    _c.copy(origin).addScaledVector(_d, len);
    pos.setXYZ(S_RINGS * S_SEGS + 1, _c.x, _c.y, _c.z);
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  // ---------- reversing bucket hood profile (bucket frame, raised; x aft-negative, y up) ----------
  // From the front-top edge (just above the yoke) aft along the crown and down to the aft lip, which stays above the
  // jet when raised and swings under the jet axis when the bucket is lowered 50°.
  const HOOD_PROFILE = [
    [0.00, 0.26], [-0.08, 0.31], [-0.20, 0.33], [-0.32, 0.32], [-0.42, 0.28], [-0.50, 0.22], [-0.55, 0.15], [HOOD_LEN, 0.09],
  ];
  const hoodLobe = (s) => 0.84 + 0.16 * Math.pow(Math.sin(Math.PI * s), 2); // two lobes with a centre seam and lower side edges
  function hoodPoint(p, s) { // profile point p at lateral fraction s in [-1,1]
    const k = hoodLobe(s);
    return V(p[0] * (0.95 + 0.05 * k), p[1] * k, s * HOOD_HALFW);
  }

  // ---------- one unit ----------
  function buildUnit(side) {
    const sgn = side === 'S' ? 1 : -1;
    const unit = new THREE.Group();
    unit.name = 'waterjet_' + side;
    unit.position.set(0, M.JET_AXIS_Y, sgn * M.JET_Z);
    const P = { unit: unit };
    const noReceive = [];   // thin/curved jet parts: cast shadows but do not receive them (avoids acne on the hood)

    // --- transom flange: rectangle clipped to the hull bottom line so it does not hang below the deadrise ---
    {
      const st = U.stationAt(0);
      const yb = (zHull) => st.keelY + Math.abs(zHull) / st.chineZ * (st.chineY - st.keelY) + 0.03; // hull frame
      const hw = M.JET_FLANGE_W / 2, top = M.JET_FLANGE_CY + M.JET_FLANGE_H / 2, bot = M.JET_FLANGE_CY - M.JET_FLANGE_H / 2;
      const pts = [[-hw, top - M.JET_AXIS_Y]];
      for (let i = 0; i <= 12; i++) {
        const zl = -hw + (2 * hw) * i / 12;                                    // unit frame z
        pts.push([zl, Math.max(bot, yb(sgn * M.JET_Z + zl)) - M.JET_AXIS_Y]);
      }
      pts.push([hw, top - M.JET_AXIS_Y]);
      const flange = U.extrudeShape(pts, M.JET_FLANGE_T, alu);
      flange.rotation.y = -Math.PI / 2; // local X -> +Z, extrusion (+Z) -> -X : plate x ∈ [-T, 0]
      unit.add(flange); P.flange = flange;
      // bolt heads around the flange edge
      const bolt = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8);
      const bolts = [];
      for (let i = 0; i < 8; i++) { bolts.push([-hw + 0.05 + (2 * hw - 0.1) * i / 7, top - M.JET_AXIS_Y - 0.05]); }
      for (let i = 1; i < 6; i++) { const y = U.lerp(top, bot, i / 6) - M.JET_AXIS_Y; bolts.push([-hw + 0.05, y], [hw - 0.05, y]); }
      bolts.forEach((b) => {
        if (b[1] < Math.max(bot, yb(sgn * M.JET_Z + b[0])) - M.JET_AXIS_Y + 0.05) return;
        const m = new THREE.Mesh(bolt, dark); m.rotation.z = -Math.PI / 2; m.position.set(-M.JET_FLANGE_T - 0.01, b[1], b[0]); unit.add(m);
      });
    }

    // --- fixed stator / outlet housing (cone from r 0.24 at the transom to r 0.15 at x = -0.20) ---
    const housing = U.cyl(M.JET_HOUSING_R0, M.JET_HOUSING_R1, -M.JET_HOUSING_X1, alu, 32, [M.JET_HOUSING_X1 / 2, 0, 0], 'x');
    unit.add(housing); P.housing = housing;
    // short inboard impeller housing (only visible in cutaway) + 5-blade impeller
    const inboard = U.cyl(0.25, 0.25, 0.34, alu, 24, [0.17, 0, 0], 'x');
    inboard.castShadow = false; unit.add(inboard);
    const impeller = new THREE.Group(); impeller.position.set(0.16, 0, 0);
    impeller.add(U.cyl(0.06, 0.06, 0.22, steel, 12, [0, 0, 0], 'x'));
    for (let i = 0; i < 5; i++) {
      const blade = U.box(0.10, 0.19, 0.03, steel, [0, 0.14, 0]);
      const holder = new THREE.Group(); holder.rotation.x = i / 5 * Math.PI * 2; holder.add(blade);
      blade.rotation.y = deg(35); impeller.add(holder);
    }
    unit.add(impeller); P.impeller = impeller;

    // --- fixed steering-shaft bracket: upper arm + bearing boss above the nozzle, lower arm + boss below ---
    const steerBracket = new THREE.Group(); unit.add(steerBracket); P.steerBracket = steerBracket;
    steerBracket.add(U.box(0.26, 0.06, 0.16, alu, [-0.13, 0.20, 0]));                        // upper arm x ∈ [-0.26, 0], y ∈ [0.17, 0.23]
    steerBracket.add(U.cyl(0.065, 0.065, 0.06, alu, 20, [STEER_X, 0.20, 0], 'y'));           // upper bearing boss
    steerBracket.add(U.box(0.30, 0.06, 0.12, alu, [-0.15, -0.23, 0]));                       // lower arm y ∈ [-0.26, -0.20]
    steerBracket.add(U.cyl(0.055, 0.055, 0.06, alu, 20, [STEER_X, -0.23, 0], 'y'));         // lower bearing boss

    // ===================== steering unit (rotates about the vertical shaft) =====================
    const steerUnit = new THREE.Group(); steerUnit.name = 'steerUnit_' + side;
    steerUnit.position.set(STEER_X, 0, 0);
    unit.add(steerUnit); P.steerUnit = steerUnit;

    // steering nozzle: box/duct outside the fixed outlet, cone from r 0.16 (x = +0.08) to r 0.13 (x = -0.30), open aft
    const nozzle = openCone(0.08, M.JET_NOZZLE_R0 + 0.01, NOZZLE_EXIT_LX, M.JET_NOZZLE_R1, steelDouble, 32);
    steerUnit.add(nozzle); P.nozzle = nozzle;
    steerUnit.add(discAft(NOZZLE_EXIT_LX + 0.08, M.JET_NOZZLE_R1 - 0.005, hole, 24)); // dark interior
    // front rim ring of the steering box
    const rim = new THREE.Mesh(new THREE.TorusGeometry(M.JET_NOZZLE_R0 + 0.01, 0.018, 8, 32), steel);
    rim.rotation.y = Math.PI / 2; rim.position.set(0.08, 0, 0); rim.castShadow = true; steerUnit.add(rim);

    // steering shaft (r 0.03) through the bearing bosses, from y = -0.22 up to the lever hub
    const shaft = U.cyl(0.03, 0.03, LEVER_Y + 0.04 + 0.22, steel, 16, [0, (LEVER_Y + 0.04 - 0.22) / 2, 0], 'y');
    steerUnit.add(shaft);
    // spine tying the shaft to the nozzle top (below the fixed arm)
    steerUnit.add(U.box(0.32, 0.065, 0.10, alu, [-0.10, 0.1325, 0]));                     // y ∈ [0.10, 0.165]
    // hub + lever + tie-rod ball at the top of the shaft
    steerUnit.add(U.cyl(0.05, 0.05, 0.08, steel, 16, [0, LEVER_Y, 0], 'y'));
    const steerLever = U.bar(V(0, LEVER_Y, 0), V(0, LEVER_Y, LEVER_LEN), 0.02, steel);
    steerUnit.add(steerLever); P.steerLever = steerLever;
    const tieRodBall = sphere(0.035, steel, [0, LEVER_Y, LEVER_LEN]);
    steerUnit.add(tieRodBall); P.tieRodBall = tieRodBall;

    // yoke: ring around the nozzle at the trunnion station + two cheeks + trunnion pins
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 32), alu);
    yoke.rotation.y = Math.PI / 2; yoke.position.set(BUCKET_LX, 0, 0); yoke.castShadow = true; steerUnit.add(yoke); P.yoke = yoke;
    [1, -1].forEach((s) => {
      steerUnit.add(U.box(0.14, 0.10, 0.10, alu, [BUCKET_LX, 0, s * 0.235]));                         // cheek z 0.185..0.285
      steerUnit.add(U.cyl(0.035, 0.035, 0.14, steel, 14, [BUCKET_LX, 0, s * 0.35], 'z'));             // trunnion pin z 0.28..0.42
    });

    // reversing cylinder bracket (on the shaft, above the fixed arm) + cylinder body (re-aimed every frame)
    steerUnit.add(U.box(0.20, 0.06, 0.10, alu, [0.08, 0.27, 0]));                          // y ∈ [0.24, 0.30]
    steerUnit.add(U.box(0.05, 0.10, 0.11, hyd, [REV_ANCHOR.x, REV_ANCHOR.y - 0.02, 0]));   // clevis
    const revCylinder = U.bar(REV_ANCHOR, V(REV_ANCHOR.x - REV_BODY_LEN, REV_ANCHOR.y, 0), 0.045, hyd);
    steerUnit.add(revCylinder); P.revCylinder = revCylinder;
    const revRod = U.bar(REV_ANCHOR, V(REV_ANCHOR.x - REV_BODY_LEN - 0.05, REV_ANCHOR.y, 0), 0.02, rodMat);
    steerUnit.add(revRod); P.revRod = revRod;
    const revRodEye = sphere(0.028, steel, [0, 0, 0]);
    steerUnit.add(revRodEye); P.revRodEye = revRodEye;

    // ahead stream (child of the steering unit so it follows the helm)
    const streamAhead = makeStream(); steerUnit.add(streamAhead); P.streamAhead = streamAhead;

    // ===================== reversing bucket (child of the steering unit, trunnions at BUCKET_LX) =====================
    const bucket = new THREE.Group(); bucket.name = 'bucket_' + side;
    bucket.position.set(BUCKET_LX, 0, 0);
    steerUnit.add(bucket); P.bucket = bucket;

    // hood: lofted two-lobe shell (13 lateral sections × profile), DoubleSide so the inside shows when lowered
    {
      const N = 13, sections = [];
      for (let i = 0; i < N; i++) { const s = -1 + 2 * i / (N - 1); sections.push(HOOD_PROFILE.map((p) => hoodPoint(p, s))); }
      const g = U.loft(sections, { flip: true });
      const hood = new THREE.Mesh(g, aluDouble); hood.castShadow = true;
      bucket.add(hood); P.hood = hood; noReceive.push(hood);
      // centre seam rib, aft lip rim and front rim
      const seam = U.tube(HOOD_PROFILE.map((p) => hoodPoint(p, 0)).map((v) => v.clone().setY(v.y + 0.008)), 0.012, alu, 24);
      bucket.add(seam); noReceive.push(seam);
      const lipPts = []; for (let i = 0; i < N; i++) lipPts.push(hoodPoint(HOOD_PROFILE[HOOD_PROFILE.length - 1], -1 + 2 * i / (N - 1)));
      const lip = U.tube(lipPts, 0.014, alu, 24); bucket.add(lip); noReceive.push(lip);
      const frontPts = []; for (let i = 0; i < N; i++) frontPts.push(hoodPoint(HOOD_PROFILE[0], -1 + 2 * i / (N - 1)));
      const front = U.tube(frontPts, 0.012, alu, 24); bucket.add(front); noReceive.push(front);
    }
    // side cheeks ("ears"): plates in the XY plane at z = ±HOOD_HALFW following the hood's side edge, tapering from a
    // wide arm at the trunnion to a narrow strip at the lip so the raised bucket leaves the jet clear underneath
    {
      const edge = HOOD_PROFILE.map((p) => hoodPoint(p, 1));
      const poly = [[0.07, -0.06], [0.07, 0.15], [0.03, 0.21]];
      edge.forEach((v) => poly.push([v.x, v.y]));
      poly.push([-0.50, 0.10], [-0.36, 0.125], [-0.22, 0.10], [-0.12, 0.02], [-0.06, -0.06]);
      [1, -1].forEach((s) => {
        const cheek = U.extrudeShape(poly, 0.02, alu);
        cheek.position.z = s > 0 ? HOOD_HALFW - 0.02 : -HOOD_HALFW;
        bucket.add(cheek);
        bucket.add(U.cyl(0.06, 0.06, 0.03, steel, 16, [0, 0, s * (HOOD_HALFW + 0.015)], 'z')); // bearing boss over the pin
      });
    }
    // lever lug on the front-top of the hood (rod eye at REV_ATTACH)
    bucket.add(U.box(0.10, 0.09, 0.06, alu, [0.0, 0.255, 0]));
    // reverse streams from the two side outlets
    const streamRev1 = makeStream(), streamRev2 = makeStream();
    bucket.add(streamRev1); bucket.add(streamRev2); P.streamRev1 = streamRev1; P.streamRev2 = streamRev2;

    U.shadowed(unit);
    noReceive.forEach((m) => { m.receiveShadow = false; });
    [streamAhead, streamRev1, streamRev2].forEach((s) => { s.castShadow = false; s.receiveShadow = false; });
    inboard.castShadow = false;
    return P;
  }

  // ---------- build both units ----------
  const group = new THREE.Group(); group.name = 'waterjets';
  const units = { P: buildUnit('P'), S: buildUnit('S') };
  group.add(units.P.unit); group.add(units.S.unit);

  // tie rod between the two lever balls (hull frame, re-aimed every frame)
  const tieRod = U.bar(V(STEER_X, M.JET_TIEROD_Y, -M.JET_Z + LEVER_LEN), V(STEER_X, M.JET_TIEROD_Y, M.JET_Z + LEVER_LEN), 0.025, steel);
  group.add(tieRod);
  // steering cylinder: bracket on the transom + body + rod to the SB lever ball
  const steerBracketT = U.box(0.10, 0.12, 0.10, alu, [-0.04, STEER_CYL_ANCHOR.y, STEER_CYL_ANCHOR.z]);
  group.add(steerBracketT);
  const steerCylinder = U.bar(STEER_CYL_ANCHOR, V(STEER_CYL_ANCHOR.x - 0.15, STEER_CYL_ANCHOR.y, STEER_CYL_ANCHOR.z - 0.15), 0.04, hyd);
  group.add(steerCylinder);
  const steerCylRod = U.bar(STEER_CYL_ANCHOR, V(STEER_X, M.JET_TIEROD_Y, M.JET_Z + LEVER_LEN), 0.018, rodMat);
  group.add(steerCylRod);
  const steerCylEye = sphere(0.03, steel, [STEER_CYL_ANCHOR.x, STEER_CYL_ANCHOR.y, STEER_CYL_ANCHOR.z]);
  group.add(steerCylEye);

  // ---------- state ----------
  const st = {
    helm: 0, helmTarget: 0,
    bucket: { P: 0, S: 0 }, bucketTarget: { P: 0, S: 0 },
    throttle: 0.5, showJet: true, spin: 0,
  };
  const thrustFraction = (v) => (v < 0.35 ? 1 : v < 0.70 ? (0.70 - v) / 0.35 : -M.JET_ASTERN_FRACTION * (v - 0.70) / 0.30);

  // ---------- per-frame kinematics ----------
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _w = new THREE.Vector3();
  const AHEAD_ORIGIN = V(NOZZLE_EXIT_LX, 0, 0), AHEAD_DIR = V(-1, 0, 0);
  const REV_ORIGIN = [V(-0.38, 0.0, 0.30), V(-0.38, 0.0, -0.30)];
  const REV_DIR = [V(0.15, -1.0, 0.55).normalize(), V(0.15, -1.0, -0.55).normalize()];

  function applyPose() {
    const yaw = deg(st.helm);
    ['P', 'S'].forEach((side) => {
      const u = units[side];
      u.steerUnit.rotation.y = yaw;                       // + = nozzle exit swings to starboard (SPEC §1)
      u.bucket.rotation.z = st.bucket[side] * BUCKET_MAX; // + = hood's aft part goes down over the jet
    });
    group.updateMatrixWorld(true);
    // reversing cylinder rod -> bucket lug (bucket frame -> steerUnit frame)
    ['P', 'S'].forEach((side) => {
      const u = units[side];
      _w.copy(REV_ATTACH); u.bucket.localToWorld(_w); u.steerUnit.worldToLocal(_w);
      _a.copy(REV_ANCHOR); _b.subVectors(_w, _a).normalize();
      U.setBar(u.revCylinder, _a, _a.clone().addScaledVector(_b, REV_BODY_LEN));
      U.setBar(u.revRod, _a.clone().addScaledVector(_b, REV_BODY_LEN * 0.5), _w);
      u.revRodEye.position.copy(_w);
    });
    // tie rod between the lever balls; steering cylinder from the transom bracket to the SB ball
    units.P.tieRodBall.getWorldPosition(_a); group.worldToLocal(_a);
    units.S.tieRodBall.getWorldPosition(_b); group.worldToLocal(_b);
    U.setBar(tieRod, _a, _b);
    _w.subVectors(_b, STEER_CYL_ANCHOR).normalize();
    U.setBar(steerCylinder, STEER_CYL_ANCHOR, STEER_CYL_ANCHOR.clone().addScaledVector(_w, STEER_CYL_BODY_LEN));
    U.setBar(steerCylRod, STEER_CYL_ANCHOR.clone().addScaledVector(_w, STEER_CYL_BODY_LEN * 0.5), _b);
  }

  function applyStreams() {
    ['P', 'S'].forEach((side) => {
      const u = units[side], f = thrustFraction(st.bucket[side]), th = st.throttle;
      const aheadOn = st.showJet && f > 0.02 && th > 0.02;
      const revOn = st.showJet && f < -0.02 && th > 0.02;
      u.streamAhead.visible = aheadOn;
      u.streamRev1.visible = revOn; u.streamRev2.visible = revOn;
      if (aheadOn) {
        const len = 0.4 + 5.0 * th * Math.max(0, f);
        setStream(u.streamAhead, AHEAD_ORIGIN, AHEAD_DIR, len, 0.12, U.lerp(0.13, 0.30, len / AHEAD_LEN_MAX));
      }
      if (revOn) {
        const len = 0.3 + 3.5 * th * Math.max(0, -f);
        setStream(u.streamRev1, REV_ORIGIN[0], REV_DIR[0], len, 0.07, U.lerp(0.08, 0.22, len / REV_LEN_MAX));
        setStream(u.streamRev2, REV_ORIGIN[1], REV_DIR[1], len, 0.07, U.lerp(0.08, 0.22, len / REV_LEN_MAX));
      }
    });
  }

  // ---------- API ----------
  function setHelm(d) { st.helmTarget = U.clamp(+d || 0, -HELM_MAX, HELM_MAX); }
  function setBucket(side, v) { if (st.bucketTarget[side] != null) st.bucketTarget[side] = U.clamp(+v || 0, 0, 1); }
  function setThrottle(v) { st.throttle = U.clamp(+v || 0, 0, 1); }
  function getThrust() { return { P: st.throttle * thrustFraction(st.bucket.P), S: st.throttle * thrustFraction(st.bucket.S) }; }
  function getAngles() { return { helm: st.helm, bucketP: st.bucket.P, bucketS: st.bucket.S }; }

  function update(dt, state) {
    dt = Math.max(0, Math.min(+dt || 0, 0.5));
    if (state) {
      if (state.throttle != null && isFinite(state.throttle)) st.throttle = U.clamp(state.throttle, 0, 1);
      if (state.showJet != null) st.showJet = !!state.showJet;
    }
    st.helm = U.moveTowards(st.helm, st.helmTarget, M.JET_STEER_RATE_DEG_S * dt);
    st.bucket.P = U.moveTowards(st.bucket.P, st.bucketTarget.P, M.JET_BUCKET_RATE_PER_S * dt);
    st.bucket.S = U.moveTowards(st.bucket.S, st.bucketTarget.S, M.JET_BUCKET_RATE_PER_S * dt);
    applyPose();
    applyStreams();
    // impeller spin (throttle × max rpm about the jet axis)
    st.spin += st.throttle * M.JET_MAX_RPM / 60 * Math.PI * 2 * dt;
    units.P.impeller.rotation.x = st.spin; units.S.impeller.rotation.x = -st.spin;
  }

  // initial pose
  applyPose(); applyStreams();

  return {
    group: group,
    parts: { P: units.P, S: units.S, tieRod: tieRod, steerCylinder: steerCylinder, steerCylRod: steerCylRod },
    articulations: [],
    setHelm: setHelm, setBucket: setBucket, setThrottle: setThrottle,
    getThrust: getThrust, getAngles: getAngles,
    update: update,
    setCutaway: function () { /* nothing to hide; the impeller is inside the hull and shows when the shell is translucent */ },
  };
};
