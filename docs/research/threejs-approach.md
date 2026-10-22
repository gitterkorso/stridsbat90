# Technical approach: articulated Stridsbåt 90 in Three.js r128 (UMD)

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

Scope: how to build the hull, the hinged hatches/doors/ramp, the two Kamewa-style waterjets (steering nozzle + reversing bucket / *backskopa*), the rotating radar, water and jet visualisation, rendering setup, URL-driven state for headless screenshots, and the r128-specific traps. Everything below was checked against the actual r128 bundle (see "Verification log" at the end); numbers about the boat itself are placeholders to be replaced from the hull/hatch/waterjet research reports.

## 0. Loading and conventions

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<!-- optional add-ons, same pattern (all verified to exist at 0.128.0 and to attach to THREE.*): -->
<!-- examples/js/utils/BufferGeometryUtils.js, examples/js/environments/RoomEnvironment.js,
     examples/js/objects/Water.js, examples/js/objects/Sky.js, examples/js/exporters/GLTFExporter.js -->
```

Verified with `curl`: `three.min.js` is 603,445 bytes, its UMD wrapper assigns `window.THREE` and reports `THREE.REVISION === "128"`; `OrbitControls.js` is 26,375 bytes, an IIFE with no ES `import`, ending in `THREE.OrbitControls = OrbitControls` (and `THREE.MapControls`). It must be loaded *after* `three.min.js` because it reads the global `THREE`.

Coordinate convention used throughout (right-handed, Y-up as Three.js expects):

| Axis | Meaning | Rotations about it |
|---|---|---|
| +X | forward (bow) | roll |
| +Y | up | steering nozzle yaw, side doors hinged on a vertical edge, radar |
| +Z | starboard | reversing bucket, deck hatches hinged fore/aft, bow ramp |

Units are metres, design waterline at `y = 0`, centreline at `z = 0`. Positive `rotation.y` on the nozzle deflects the jet to starboard (checked numerically: jet direction `(−0.906, 0, +0.423)` for +25°), which pushes the stern to port, i.e. a **starboard turn = positive helm**. Positive `rotation.z` swings an aft-hanging part *downward* (checked: aft lip moved `dy = −0.386` for +40°).

## (a) Lofting the planing hull from stations

Input is a list of stations (frames), each a **half-section** as 2-D points `[z, y]` from keel (z = 0) up to the sheer, all with the same point count. Hard edges (chine, spray rail) are declared by index; the keel and sheer are hard by construction. The function mirrors to port, adds a deck (with optional camber) and an ear-clipped transom, and lets `computeVertexNormals()` do the smoothing. Crease columns are emitted twice so the strips on either side get independent normals (a hard chine) while each strip stays smooth along the length.

```js
// +X forward, +Y up, +Z starboard. stations: [{ x, pts: [[z, y], ...] }], keel first, sheer last, equal counts.
// opts.creases: indices into pts that must be hard edges (e.g. [1] for a single chine).
function loftHull(stations, opts = {}) {
  const { creases = [], transom = true, deckCamber = 0.0 } = opts;
  const st = stations.slice().sort((a, b) => b.x - a.x);        // bow first, stern last (winding depends on it)
  const n = st.length, m = st[0].pts.length;
  const creaseSet = new Set(creases);
  const pos = [], uv = [], idx = [];
  const V = (x, y, z, u, v) => { pos.push(x, y, z); uv.push(u, v); return pos.length / 3 - 1; };

  // Column list: a crease point is emitted twice; the quad between the two copies is skipped.
  const cols = [];
  for (let j = 0; j < m; j++) {
    cols.push({ j, skip: false });
    if (creaseSet.has(j) && j > 0 && j < m - 1) { cols[cols.length - 1].skip = true; cols.push({ j, skip: false }); }
  }
  const C = cols.length;

  function shell(sign) {                                        // +1 starboard, -1 port
    const start = pos.length / 3;
    for (let i = 0; i < n; i++)
      for (let c = 0; c < C; c++) {
        const [z, y] = st[i].pts[cols[c].j];
        V(st[i].x, y, sign * z, i / (n - 1), c / (C - 1));      // u along length, v up the girth
      }
    for (let i = 0; i < n - 1; i++)
      for (let c = 0; c < C - 1; c++) {
        if (cols[c].skip) continue;
        const a = start + i * C + c, b = a + C, d = a + 1, e = b + 1;   // a=(i,c) b=(i+1,c) d=(i,c+1) e=(i+1,c+1)
        if (sign > 0) idx.push(a, d, b, d, e, b); else idx.push(a, b, d, d, b, e);   // mirrored side = reversed winding
      }
  }
  shell(+1); shell(-1);

  // Deck strip: port sheer -> cambered centreline -> starboard sheer, with its own vertices (hard sheer edge).
  {
    const start = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const [zs, ys] = st[i].pts[m - 1];
      V(st[i].x, ys, -zs, i / (n - 1), 0);
      V(st[i].x, ys + deckCamber, 0, i / (n - 1), 0.5);
      V(st[i].x, ys, +zs, i / (n - 1), 1);
    }
    for (let i = 0; i < n - 1; i++)
      for (let c = 0; c < 2; c++) {
        const a = start + i * 3 + c, b = a + 3, d = a + 1, e = b + 1;
        idx.push(a, b, d, d, b, e);                              // +Y normal
      }
  }

  // Transom: full polygon of the last station, ear-clipped with ShapeUtils, forced to face aft (-X).
  if (transom) {
    const s = st[n - 1], contour = [];
    for (let j = m - 1; j >= 0; j--) contour.push(new THREE.Vector2(+s.pts[j][0], s.pts[j][1]));  // stbd sheer -> keel
    for (let j = 1; j < m; j++)     contour.push(new THREE.Vector2(-s.pts[j][0], s.pts[j][1]));  // port keel -> sheer
    const start = pos.length / 3;
    contour.forEach((p, k) => V(s.x, p.y, p.x, k / contour.length, 0));
    const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
    for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(contour, [])) {
      A.fromArray(pos, (start + i0) * 3); B.fromArray(pos, (start + i1) * 3); Cc.fromArray(pos, (start + i2) * 3);
      const nx = B.sub(A).cross(Cc.sub(A)).x;
      if (nx <= 0) idx.push(start + i0, start + i1, start + i2); else idx.push(start + i0, start + i2, start + i1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();          // smooth within each strip, hard across creases/sheer/keel
  geo.computeBoundingSphere();
  return geo;
}
```

Illustrative station table (a deep-V with one chine: `pts = [keel, chine, sheer]`, `creases: [1]`). Overall proportions follow the published CB90 figures (about 15.9 m LOA, 3.8 m beam, 0.8 m draught); the section shapes are my estimate from photographs (deadrise at the transom ≈ 18°, confidence **low**) and must be replaced by the hull-dimensions report:

```js
const stations = [
  { x:  7.9, pts: [[0.00, 0.60], [0.02, 1.00], [0.05, 1.70]] },   // stem (tiny width avoids degenerate triangles)
  { x:  6.0, pts: [[0.00,-0.10], [0.90, 0.55], [1.30, 1.60]] },
  { x:  4.0, pts: [[0.00,-0.45], [1.40, 0.15], [1.75, 1.45]] },
  { x:  2.0, pts: [[0.00,-0.65], [1.60,-0.05], [1.85, 1.30]] },
  { x:  0.0, pts: [[0.00,-0.75], [1.70,-0.15], [1.90, 1.20]] },
  { x: -2.0, pts: [[0.00,-0.80], [1.75,-0.20], [1.90, 1.10]] },
  { x: -4.0, pts: [[0.00,-0.80], [1.75,-0.22], [1.90, 1.05]] },
  { x: -6.0, pts: [[0.00,-0.80], [1.75,-0.25], [1.90, 1.00]] },
  { x: -7.9, pts: [[0.00,-0.80], [1.70,-0.25], [1.85, 1.00]] },   // transom
];
const hull = new THREE.Mesh(loftHull(stations, { creases: [1], deckCamber: 0.08 }), hullMat);
hull.castShadow = hull.receiveShadow = true;
```

Result for that table, measured in Node against r128: 104 vertices, 99 triangles, no NaN normals; mean face normals starboard topside `(0.01, −0.13, 0.99)`, starboard bottom `(0.03, −0.94, 0.33)`, deck `(0.04, 0.78, 0)`, transom `(−1, 0, 0)`. Sixteen or so stations with 4–5 points each (keel, chine, spray rail, sheer) give a convincing CB90 hull; add a second crease index for the spray rail.

Notes:
- Round-bilge smoothing across a crease: omit it from `creases`. To make everything smooth (including the keel) run `THREE.BufferGeometryUtils.mergeVertices(geo, 1e-4)` (the add-on's static method exists at 0.128.0) then `computeVertexNormals()` again.
- The deck is a simple strip so the superstructure and cockpit well can sit on top of it. For a **deck with real hatch cut-outs** use a plan-view `THREE.Shape` with `holes` and `ShapeGeometry`, laid flat: `ShapeGeometry` is built in the XY plane facing +Z, so `geo.rotateX(-Math.PI/2)` gives a +Y normal and maps the shape's 2-D `v` to world `−z`. Draw the plan as `new THREE.Vector2(x, -z)` and it lines up with the boat frame.
- A hard-edged outline (nice for a technical look) is `new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), lineMat)`.
- Lofting a curved plank surface for the wheelhouse is the same function with `transom: false` and the deck strip ignored, or plain `BoxGeometry`/`ExtrudeGeometry` boxes; the CB90 superstructure is mostly flat panels.

## (b) Hinged parts: pivot Groups plus an easing tween

Rule: **put the hinge line on the pivot Group's origin, build the lid geometry so its hinge edge lies on that local axis (translate the geometry, not the mesh), place the Group at the hinge point in boat coordinates, rotate the Group about the hinge axis.** No tween library: a tiny state machine driven by `THREE.Clock` delta.

```js
const Ease = {
  inOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outCubic:   t => 1 - Math.pow(1 - t, 3),
};

class Hinge {
  // pivot: THREE.Vector3 hinge point in parent coordinates; axis: 'x' | 'y' | 'z'
  // angleClosed/angleOpen in radians (signed!). duration in seconds.
  constructor({ name, mesh, pivot, axis = 'z', angleClosed = 0, angleOpen, duration = 1.2, ease = Ease.inOutCubic }) {
    Object.assign(this, { name, axis, angleClosed, angleOpen, duration, ease });
    this.group = new THREE.Group(); this.group.name = name;
    this.group.position.copy(pivot);
    this.group.add(mesh);                    // mesh geometry already offset so hinge edge == local origin/axis
    this.t = 0; this.from = 0; this.to = 0; this.elapsed = Infinity;
    this._apply();
  }
  set(t, immediate = false) {
    t = THREE.MathUtils.clamp(t, 0, 1);
    if (immediate) { this.t = this.from = this.to = t; this.elapsed = Infinity; this._apply(); }
    else { this.from = this.t; this.to = t; this.elapsed = 0; }
  }
  open() { this.set(1); }  close() { this.set(0); }  toggle() { this.set(this.to > 0.5 ? 0 : 1); }
  get busy() { return this.elapsed < this.duration; }
  update(dt) {
    if (!this.busy) return;
    this.elapsed = Math.min(this.elapsed + dt, this.duration);
    this.t = THREE.MathUtils.lerp(this.from, this.to, this.ease(this.elapsed / this.duration));
    this._apply();
  }
  _apply() { this.group.rotation[this.axis] = THREE.MathUtils.lerp(this.angleClosed, this.angleOpen, this.t); }
}

const hinges = {};                       // registry used by the UI and by the URL state
function addHinge(parent, cfg) { const h = new Hinge(cfg); hinges[cfg.name] = h; parent.add(h.group); return h; }
```

Three typical CB90 cases (positions are placeholders):

```js
const d2r = THREE.MathUtils.degToRad;

// 1. Fore-deck hatch: 0.7 m (X) x 0.6 m (Z) lid, hinged along its FORWARD edge, opens up-and-forward.
//    Lid extends aft of the hinge (-X); lifting the aft edge means NEGATIVE rotation about Z.
const lidGeo = new THREE.BoxGeometry(0.70, 0.03, 0.60); lidGeo.translate(-0.35, 0.015, 0);
addHinge(boat, { name: 'foreHatch', mesh: new THREE.Mesh(lidGeo, hatchMat),
                 pivot: new THREE.Vector3(5.2, 1.62, 0), axis: 'z', angleOpen: d2r(-100) });

// 2. Wheelhouse side door (starboard), hinged on its forward vertical edge, swings outboard.
//    Door extends aft of the hinge; on the starboard side +Y rotation moves it to +Z (outboard).
const doorGeo = new THREE.BoxGeometry(0.70, 1.50, 0.03); doorGeo.translate(-0.35, 0.75, 0);
addHinge(boat, { name: 'doorS', mesh: new THREE.Mesh(doorGeo, hatchMat),
                 pivot: new THREE.Vector3(1.4, 1.65, 1.35), axis: 'y', angleOpen: d2r(95) });
// the mirrored port door uses pivot.z = -1.35 and angleOpen: d2r(-95)

// 3. Bow ramp: hinged at its lower forward edge. Built lying flat pointing FORWARD (+X); closed = raised
//    to vertical (+90 deg about Z lifts a +X point), open = dropped forward/down a little past horizontal.
const rampGeo = new THREE.BoxGeometry(1.60, 0.05, 1.20); rampGeo.translate(0.80, 0.025, 0);
addHinge(boat, { name: 'rampBow', mesh: new THREE.Mesh(rampGeo, rampMat),
                 pivot: new THREE.Vector3(7.5, 1.35, 0), axis: 'z', angleClosed: d2r(90), angleOpen: d2r(-15),
                 duration: 2.5 });
```

Per frame: `const dt = Math.min(clock.getDelta(), 0.1); for (const h of Object.values(hinges)) h.update(dt);` (clamping `dt` avoids a huge jump after a background tab). Nested hinges (a small inspection flap on a big hatch) work by passing the outer hinge's `group` as `parent`. Drop a `new THREE.AxesHelper(0.5)` into a pivot group while tuning to see the axis and sign; the right-hand rule around the axis decides the sign, as in the comments above.

Sliding parts (if the wheelhouse has a sliding roof panel) are the same class with `_apply()` writing `group.position[axis]` instead of rotation.

## (c) Waterjet hierarchy: housing -> steering nozzle, housing -> reversing bucket

Kamewa source material: the steering unit is a box aft of the nozzle that rotates about its attachment point, allowed to rotate 30° each way; the reversing mechanism is attached to the steering unit; neutral ("zero") thrust is obtained by splitting the jet so part goes aft and part forward (KTH thesis on the Kamewa steering concept, DiVA 708479, pp. 4–5). A related patent (US 6,152,792) describes the steering nozzle pivoting about a vertical axis and the reversing deflector pivoting about a horizontal transverse axis, resting above the nozzle "in the shadow" of the hull when inactive. Kongsberg's product pages describe the same "compact reversing bucket and steering nozzle" family. Two consequences for the model:

1. Nozzle yaw about **Y**, bucket about **Z**, bucket at rest sits above/aft of the nozzle exit and swings down into the jet.
2. On the real unit the bucket **rides on the steering unit** (so reversed flow yaws with the helm). The brief asks for the bucket to hang on the fixed housing; the code keeps that, with a one-line switch (`BUCKET_ON_NOZZLE`) if the waterjet research report decides otherwise. Confidence that the FF-jet on CB90 carries the bucket on the steering nozzle: medium (it is what the Kamewa illustrations and the patent show; not confirmed for the FF-410/450 specifically).

```js
const BUCKET_ON_NOZZLE = false;          // true = bucket child of the steering nozzle (Kamewa arrangement)

// helper: cylinder along X, radius rAft at x=-len, rFwd at x=0 (so the forward end sits on the group origin)
function cylX(rAft, rFwd, len, seg = 24, open = false, thetaStart = 0, thetaLen = Math.PI * 2) {
  const g = new THREE.CylinderGeometry(rAft, rFwd, len, seg, 1, open, thetaStart, thetaLen);
  g.rotateZ(Math.PI / 2);                // CylinderGeometry is built along +Y; +Y (radiusTop) -> -X (aft)
  g.translate(-len / 2, 0, 0);
  return g;
}

function buildWaterjet(side, P, mats) {  // side: +1 starboard, -1 port
  const housing = new THREE.Group(); housing.name = side > 0 ? 'jetS' : 'jetP';
  housing.position.set(P.x, P.y, side * P.z);                       // P.x = transom station, P.y = jet axis height

  housing.add(new THREE.Mesh(cylX(P.rHousing, P.rHousing, P.lenHousing), mats.steel));   // stator/outlet housing

  const nozzle = new THREE.Group(); nozzle.name = 'nozzle';
  nozzle.position.x = -P.lenHousing;                                 // yaw pivot at the housing outlet
  nozzle.add(new THREE.Mesh(cylX(P.rNozzle, P.rHousing, P.lenNozzle), mats.steel));      // tapers aft
  housing.add(nozzle);

  const bucket = new THREE.Group(); bucket.name = 'bucket';
  // hinge above the jet axis, just aft of the yaw pivot; expressed in the parent's frame
  bucket.position.set(BUCKET_ON_NOZZLE ? -P.lenNozzle * 0.35 : -P.lenHousing - P.lenNozzle * 0.35, P.rHousing * 1.25, 0);
  (BUCKET_ON_NOZZLE ? nozzle : housing).add(bucket);

  // Scoop: part-cylinder shell whose axis is parallel to Z and sits R below the hinge (about the jet axis).
  // theta runs from the top (at the hinge) aft and slightly down; deploying rotates it down behind the exit.
  const R = P.rHousing * 1.25, W = P.rNozzle * 2.6;
  const scoopGeo = new THREE.CylinderGeometry(R, R, W, 24, 1, true, Math.PI, THREE.MathUtils.degToRad(105));
  scoopGeo.rotateX(Math.PI / 2);          // cylinder axis -> Z; theta=pi -> +Y (top), theta=3pi/2 -> -X (aft)
  scoopGeo.translate(0, -R, 0);            // top of the arc lands on the hinge
  const scoop = new THREE.Mesh(scoopGeo, mats.bucket); scoop.material.side = THREE.DoubleSide;
  bucket.add(scoop);
  // hinge trunnions
  const trunnion = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, W + 0.1, 12).rotateX(Math.PI / 2), mats.steel);
  bucket.add(trunnion);

  const jet = { housing, nozzle, bucket, helmDeg: 0, deploy: 0,
    setHelm(deg) { this.helmDeg = THREE.MathUtils.clamp(deg, -P.maxHelmDeg, P.maxHelmDeg);
                   nozzle.rotation.y = THREE.MathUtils.degToRad(this.helmDeg); },      // + = jet to starboard
    setBucket(t) { this.deploy = THREE.MathUtils.clamp(t, 0, 1);
                   bucket.rotation.z = this.deploy * THREE.MathUtils.degToRad(P.maxBucketDeg); }, // + = swings down
  };
  return jet;
}

const JET = { x: -7.6, y: -0.45, z: 0.9, rHousing: 0.30, rNozzle: 0.20, lenHousing: 0.55, lenNozzle: 0.45,
              maxHelmDeg: 30, maxBucketDeg: 95 };            // dimensions are placeholders (FF-410/450 report)
const jets = { S: buildWaterjet(+1, JET, mats), P: buildWaterjet(-1, JET, mats) };
boat.add(jets.S.housing, jets.P.housing);
```

Both nozzles normally steer together (`jets.S.setHelm(h); jets.P.setHelm(h)`), while the buckets are independent (split-bucket manoeuvring is exactly what `bucketP`/`bucketS` in the URL state is for). Animate helm and bucket changes with the same tween pattern as `Hinge` (interpolate `helmDeg`/`deploy`), or set them directly from a slider. Keep one rotation axis per Group; if you ever need two axes on one object the Euler order (`XYZ` by default) starts to matter.

## (d) Rotating radar antenna

```js
const radar = new THREE.Group(); radar.name = 'radar';
radar.position.set(0.4, 4.1, 0);                     // mast top, placeholder
radar.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 16).translate(0, 0.075, 0), mats.black)); // pedestal
radar.add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 1.10).translate(0, 0.20, 0), mats.white));           // open-array bar
// (if the fitted set is a radome, use a short wide CylinderGeometry/SphereGeometry and rotate it anyway)
boat.add(radar);
radar.userData.rpm = 24;                              // typical small-craft navigation radar; confirm in the fittings report

// per frame:
if (state.radarOn) radar.rotation.y += radar.userData.rpm / 60 * Math.PI * 2 * dt;
```

For deterministic screenshots the angle is set from the URL (`radar=<deg>`) instead of accumulated.

## (e) Water plane and jet-stream visualisation

**Water.** A CPU-displaced plane is enough, keeps correct normals (recomputed per frame) and needs no textures (relevant if the page runs under a CSP that blocks image loads). `examples/js/objects/Water.js` (uniforms `time`, `sunDirection`, `sunColor`, `waterColor`, `distortionScale`, `alpha`) looks better but needs a `waterNormals` texture, i.e. either an allowed image URL or a procedurally generated `THREE.DataTexture`.

```js
const WSIZE = 70, WSEG = 110;
const waterGeo = new THREE.PlaneGeometry(WSIZE, WSIZE, WSEG, WSEG);
waterGeo.rotateX(-Math.PI / 2);                       // PlaneGeometry faces +Z; now faces +Y
waterGeo.attributes.position.setUsage(THREE.DynamicDrawUsage);
const waterBase = waterGeo.attributes.position.array.slice();
const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
  color: srgb(0x1f4f74), roughness: 0.22, metalness: 0.0, transparent: true, opacity: 0.86, envMapIntensity: 1.2 }));
water.receiveShadow = true;
scene.add(water);

function updateWater(time) {
  const p = waterGeo.attributes.position, a = p.array;
  for (let i = 0; i < p.count; i++) {
    const x = waterBase[i * 3], z = waterBase[i * 3 + 2];
    a[i * 3 + 1] = 0.05 * Math.sin(0.8 * x + 1.3 * time)
                 + 0.035 * Math.sin(0.6 * z - 0.9 * time + 0.5 * x)
                 + 0.015 * Math.sin(1.9 * (x + z) + 2.2 * time);
  }
  p.needsUpdate = true;
  waterGeo.computeVertexNormals();
  waterGeo.attributes.normal.needsUpdate = true;
}
```

**Jet streams.** Two translucent cones per jet: an *ahead* stream that is a child of the steering nozzle (so it yaws automatically) and a *reverse* stream that follows the bucket. The flow split follows the Kamewa illustration: at `deploy ≈ 0.5` half the jet goes aft and half forward (zero net thrust), at `deploy = 1` everything is turned forward-and-down. Because the bucket on a real unit is carried by the steering unit, the reversed flow is drawn in the housing frame and yawed by the helm even in the `BUCKET_ON_NOZZLE = false` hierarchy. The reversed flow leaves the bucket forward, downward and splayed outboard under the transom; the 40°/±25° angles below are an estimate from Kamewa/Kongsberg illustrations (confidence low-medium).

```js
const jetMat = new THREE.MeshBasicMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.35,
                                             depthWrite: false, blending: THREE.AdditiveBlending });
// cone with apex on the local origin, opening along +X (ConeGeometry apex is +Y; rotateZ(-90deg) maps +Y -> +X)
function flowCone(len, rEnd) {
  const g = new THREE.ConeGeometry(rEnd, len, 18, 1, true);
  g.rotateZ(-Math.PI / 2); g.translate(-len / 2, 0, 0);       // apex at x=0, base at x=-len
  return g;                                                     // i.e. it points along -X; use quaternion to aim
}
const AX = new THREE.Vector3(-1, 0, 0);                           // the cone's native direction

function addJetFlows(jet, P) {
  const L = 4.0;
  const ahead = new THREE.Mesh(flowCone(L, P.rNozzle * 1.8), jetMat);
  ahead.position.x = -P.lenNozzle;                                // nozzle exit
  jet.nozzle.add(ahead);                                          // yaws with the helm for free

  const rev = new THREE.Group(); jet.housing.add(rev);            // reversed flow, in the housing frame
  const dirs = [new THREE.Vector3(Math.cos(0.7), -Math.sin(0.7),  0.42).normalize(),   // fwd-down, splayed stbd
                new THREE.Vector3(Math.cos(0.7), -Math.sin(0.7), -0.42).normalize()];  // fwd-down, splayed port
  const revCones = dirs.map(d => {
    const m = new THREE.Mesh(flowCone(L * 0.6, P.rNozzle * 1.2), jetMat);
    m.quaternion.setFromUnitVectors(AX, d); rev.add(m); return m;
  });
  const lip = new THREE.Vector3();
  jet.updateFlows = function () {
    const s = THREE.MathUtils.smoothstep(this.deploy, 0.05, 1.0);  // 0 = clear of jet, 1 = fully in the jet
    ahead.scale.x = 1 - s; ahead.visible = ahead.scale.x > 0.03;
    rev.visible = s > 0.03; rev.scale.setScalar(Math.max(s, 1e-3));
    // start the reversed flow at the bucket lip (world -> housing coordinates), yaw it with the helm
    lip.set(0, -P.rHousing * 2.2, 0); this.bucket.localToWorld(lip); this.housing.worldToLocal(lip);
    rev.position.copy(lip); rev.rotation.y = this.nozzle.rotation.y;
  };
}
addJetFlows(jets.S, JET); addJetFlows(jets.P, JET);
// per frame: jets.S.updateFlows(); jets.P.updateFlows();
```

Particle variant (optional, ~25 lines): a `THREE.Points` with N particles, each with an age; on respawn read the nozzle-exit world position and the current stream direction (`AX.clone().applyQuaternion(nozzle.getWorldQuaternion(q))` for ahead, the bucket-lip direction for reverse), then advance `pos += vel * dt` and write into the `position` attribute with `needsUpdate = true`. Because particles keep the velocity they were born with, a helm change produces a curved trailing plume, which reads very well. Set `points.frustumCulled = false` (the bounding sphere is computed once and particles leave it). Do **not** use `Object3D.getWorldDirection()` for the jet axis: in r128 it returns the object's local **+Z** in world space (checked: `(0.423, 0, 0.906)` for the +25° nozzle), not the −X exit axis.

## (f) Shadows, lights, tone mapping, sRGB (r128 flavour)

```js
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();   // r128 has no ColorManagement: hex is taken as LINEAR

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: state.shot });  // see (g)
renderer.setPixelRatio(state.dpr || Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;               // default is LinearEncoding (3000) -> dull, dark image
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;                    // in r128 this only switches point/spot lights to
                                                            // inverse-square falloff (no pi rescale; that came in r155)

const scene = new THREE.Scene();
scene.background = srgb(0xa9c6e2);

// image-based ambient light: RoomEnvironment + PMREM (both in core/examples at r128)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;   // fromScene(scene, sigma, near, far)
pmrem.dispose();

const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x2f3d2f, 0.35);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.set(14, 20, 9);              // sun.target defaults to the origin; add it to the scene if you move it
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 });  // fits a 16 m boat
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;             // exists in r128; kills acne on the deep-V without peter-panning
scene.add(hemi, sun, sun.target);

// materials
const mats = {
  hull:   new THREE.MeshStandardMaterial({ color: srgb(0x3d4a3f), roughness: 0.65, metalness: 0.15 }),   // Swedish grey-green
  deck:   new THREE.MeshStandardMaterial({ color: srgb(0x2f3a31), roughness: 0.9 }),
  steel:  new THREE.MeshStandardMaterial({ color: srgb(0x8f959a), roughness: 0.45, metalness: 0.8 }),
  bucket: new THREE.MeshStandardMaterial({ color: srgb(0x6e7378), roughness: 0.5, metalness: 0.7 }),
  glass:  new THREE.MeshPhysicalMaterial({ color: srgb(0x8fb4cc), roughness: 0.1, metalness: 0, transparent: true, opacity: 0.45 }),
};
```

Every mesh that should throw or catch shadows needs `castShadow`/`receiveShadow = true` (they default to false). Thin lids and doors built from `BoxGeometry` (3 cm) shadow cleanly; if something must be a single-sided `PlaneGeometry` use `material.side = THREE.DoubleSide` **and** `material.shadowSide = THREE.DoubleSide` or the shadow disappears from one side. Use `new THREE.CameraHelper(sun.shadow.camera)` once to confirm the ortho frustum encloses the boat plus the opened ramp. `THREE.Sky` (verified at 0.128.0; uniforms `turbidity`, `rayleigh`, `mieCoefficient`, `mieDirectionalG`, `sunPosition`) gives a physically plausible sky instead of the flat colour; scale it to ~450 000 and drive `sunPosition` from `sun.position`.

## (g) Initial state from URL query parameters

Goal: `boat.html?view=stern&hatches=open&helm=25&bucketP=0.5&anim=0` renders a deterministic frame that a headless browser can capture.

```js
const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) && !Number.isNaN(+q.get(k))) ? +q.get(k) : d;
const state = {
  view:    q.get('view') || 'iso',                 // preset name or "x,y,z"
  target:  q.get('target'),                        // optional "x,y,z" look-at
  hatches: q.get('hatches') || 'closed',           // 'open' | 'closed' | 'foreHatch,doorS,rampBow'
  helm:    THREE.MathUtils.clamp(num('helm', 0), -30, 30),
  bucketP: THREE.MathUtils.clamp(num('bucketP', num('bucket', 0)), 0, 1),
  bucketS: THREE.MathUtils.clamp(num('bucketS', num('bucket', 0)), 0, 1),
  radar:   q.get('radar') ?? '1',                  // '0' | '1' | angle in degrees
  t:       num('t', 0),                            // phase for water/radar so frames are reproducible
  anim:    q.get('anim') !== '0',                  // anim=0 -> render two frames and stop
  wire:    q.get('wire') === '1',
  fov:     num('fov', 38),
  dpr:     num('dpr', 0),
  shot:    q.has('shot'),                          // enables preserveDrawingBuffer for canvas.toDataURL()
};

const VIEWS = { iso: [17, 8, 14], bow: [24, 4, 0], stern: [-24, 4, 0], port: [0, 3.5, -24], starboard: [0, 3.5, 24],
                top: [0, 30, 0.01], sternQuarterS: [-17, 6, 13], sternQuarterP: [-17, 6, -13], bowQuarterS: [17, 6, 13] };
const vec = (s, d) => { const a = (s || '').split(',').map(Number); return a.length === 3 && a.every(Number.isFinite) ? a : d; };

function applyState(s, immediate = true) {
  const openAll = s.hatches === 'open', list = new Set(s.hatches.split(','));
  for (const [name, h] of Object.entries(hinges)) h.set(openAll || list.has(name) ? 1 : 0, immediate);
  jets.S.setHelm(s.helm); jets.P.setHelm(s.helm);
  jets.S.setBucket(s.bucketS); jets.P.setBucket(s.bucketP);
  state.radarOn = s.radar === '1';
  if (!state.radarOn && s.radar !== '0') radar.rotation.y = THREE.MathUtils.degToRad(+s.radar || 0);
  camera.fov = s.fov; camera.updateProjectionMatrix();
  camera.position.fromArray(vec(s.view, VIEWS[s.view] || VIEWS.iso));
  controls.target.fromArray(vec(s.target, [0, 0.9, 0])); controls.update();
  scene.traverse(o => { if (o.isMesh && o.material.wireframe !== undefined) o.material.wireframe = s.wire; });
}
window.__applyState = partial => applyState(Object.assign(state, partial), false);   // for interactive automation

// render loop with a readiness flag for screenshot tools
const clock = new THREE.Clock(); let frames = 0;
function frame() {
  const dt = state.anim ? Math.min(clock.getDelta(), 0.1) : 0;
  const time = state.t + (state.anim ? clock.elapsedTime : 0);
  for (const h of Object.values(hinges)) h.update(dt);
  if (state.radarOn && state.anim) radar.rotation.y = (radar.userData.rpm / 60) * Math.PI * 2 * time;
  updateWater(time); jets.S.updateFlows(); jets.P.updateFlows();
  controls.update();
  renderer.render(scene, camera);
  frames++;
  if (frames === 2) window.__ready = true;          // frame 1 compiles shaders/shadow map, frame 2 is clean
  if (state.anim || frames < 2) requestAnimationFrame(frame);
}
applyState(state, true); frame();
```

Headless capture (Puppeteer). Recent Chrome no longer falls back to software GL by itself, so force ANGLE + SwiftShader; Puppeteer also injects its own `--use-angle=swiftshader-webgl`, which is fine for WebGL but can be dropped with `ignoreDefaultArgs` if it conflicts:

```js
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto('file:///.../boat.html?view=stern&hatches=open&helm=25&bucketP=0.5&anim=0&t=3', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
  await page.screenshot({ path: 'stern-open-helm25.png' });
  await browser.close();
})();
```

`page.screenshot` reads the composited page, so `preserveDrawingBuffer` is only needed when you grab `renderer.domElement.toDataURL()` yourself (the `shot` flag). SwiftShader is slow: keep `dpr=1`, shadow map at 2048 and the water at ~110×110 segments for headless runs, or pass `?water=0`.

## (h) r128 pitfalls (all verified against the bundle)

1. **`THREE.Geometry` is gone.** Removed from core in r125 together with `Face3`; `typeof THREE.Geometry === 'undefined'` in r128. Old snippets that push `geometry.vertices`/`faces` must be rewritten as `BufferGeometry` with `setAttribute('position', new THREE.Float32BufferAttribute(...))` + `setIndex()`. If you must paste legacy code, `examples/js/deprecated/Geometry.js` (verified at 0.128.0) restores `THREE.Geometry` with `.toBufferGeometry()`, but don't ship it.
2. **`*BufferGeometry` names are aliases.** `THREE.BoxBufferGeometry === THREE.BoxGeometry` (checked), so either spelling works; all generators return `BufferGeometry`. Raycasting only works on `BufferGeometry`.
3. **`ExtrudeGeometry` options** are `depth` (not `amount`, which only prints a rename warning), `bevelEnabled` (**defaults to true**, set `false` for hard-edged panels), `bevelThickness/Size/Offset/Segments`, `steps`, `curveSegments`, `extrudePath`, `UVGenerator`. It extrudes from `z = 0` to `z = depth` along **+Z** in the shape's own plane; rotate the geometry afterwards (`rotateX`, `rotateY`) to orient it. Shape winding does not matter: r128 normalises it (both CW and CCW inputs gave +Z caps).
4. **`LatheGeometry(points, segments = 12, phiStart = 0, phiLength = 2π)`** revolves `Vector2(x = radius, y = height)` about **Y**. List the points with **increasing y** (bottom to top) or the surface comes out inside-out: measured normal at the +x side is `+0.95` for increasing y and `−0.95` for decreasing y. Radii must be ≥ 0. Good for the radome, mast fittings and the bucket if you prefer a revolved scoop (`phiLength < 2π` gives a partial shell).
5. **Axis of primitives:** `CylinderGeometry`/`ConeGeometry` are built along Y (cone apex at +Y; `radiusTop` is the +Y end); `PlaneGeometry` and `ShapeGeometry` lie in XY facing +Z; `ShapeGeometry` faces +Z regardless of winding. Bake orientation with `geometry.rotateX/rotateY/rotateZ/translate` once, not with mesh rotations that then fight the hinge/nozzle rotations.
6. **Mirroring.** `geometry.scale(1, 1, -1)` flips the winding and the part is back-face culled / looks inside-out. Either rebuild with reversed indices (what `loftHull` does) or mirror at object level: `mesh.scale.z = -1` is safe because the renderer flips the front face when `matrixWorld.determinant() < 0` (present in r128). Normals are still correct in that case.
7. **Double-sided materials.** Zero-thickness lids, the bucket shell and the open cone jets need `side: THREE.DoubleSide`; shadows from double-sided thin parts need `shadowSide` set as well. Prefer thin boxes for hatches (they self-shadow properly and have an edge to see).
8. **Colour and gamma.** r128 has no `ColorManagement`; `new THREE.Color(0x808080).r === 0.502` (taken as linear), so paint swatches look washed out unless you `convertSRGBToLinear()` (0.502 → 0.216). Set `renderer.outputEncoding = THREE.sRGBEncoding` (the default is `LinearEncoding`) and `texture.encoding = THREE.sRGBEncoding` on colour textures (not on normal/roughness maps). `renderer.gammaOutput/gammaInput` were removed years before r128; `gammaFactor` still exists but only matters with `GammaEncoding`. Tone mapping only applies to materials with `toneMapped: true` (default) - keep it on for the water and off for pure-white UI helpers.
9. **`computeVertexNormals()`** averages every face that shares an *index*, so any shared vertex is smooth; hard edges need duplicated vertices (as in the loft), `toNonIndexed()`, or `material.flatShading = true`. Call it after `setIndex()`. For animated geometry (water) also set `attribute.needsUpdate = true` and give the attribute `DynamicDrawUsage`. After moving vertices far, recompute the bounding sphere or the mesh gets frustum-culled.
10. **`examples/js` at r128 are ES6 classes** (the r127→r128 migration note): `THREE.OrbitControls` etc. cannot be extended with ES5 `prototype` tricks, and they read the global `THREE` at load time, so script order matters.
11. **OrbitControls r128:** call `controls.update()` every frame when `enableDamping` is on; keyboard panning is off until `controls.listenToKeyEvents(window)`; use `controls.target` (not `camera.lookAt`) for the look-at point; `maxPolarAngle` slightly above π/2 lets the user peek at the waterjets from below the waterline; for the `top` preset offset the camera by a hair (`z = 0.01`) to avoid the singular straight-down case.
12. **`Object3D.getWorldDirection()`** returns the world-space **+Z** axis. For an X-axis nozzle transform your own vector with `getWorldQuaternion()`.
13. **`scene.environment`** must be a PMREM texture (`PMREMGenerator.fromScene/fromEquirectangular`) and only lights `MeshStandardMaterial`/`MeshPhysicalMaterial`; `MeshBasicMaterial` jets ignore it (intended). Dispose the generator after use.
14. **Transparent jets/water:** `depthWrite: false` on the jets so they don't punch holes in the water; if sorting glitches appear, `jet.renderOrder = 2`.
15. **Resize:** `renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();` and re-render once when `anim=0`.
16. **Frame delta:** clamp `clock.getDelta()` (0.1 s) so a tab that was in the background does not slam every hinge open in one frame.

## Suggested scene graph

```
scene
 ├─ water (Mesh)                        ├─ sun (DirectionalLight, castShadow) / hemi / environment
 └─ boat (Group, name 'boat')
     ├─ hull (Mesh, loftHull)           ├─ deck plan with cut-outs (ShapeGeometry, optional)
     ├─ superstructure (Group of boxes/extrusions)
     ├─ hinges: foreHatch, roofHatchP/S, doorP/S, engineHatch, aftDoor, rampBow ... (each a pivot Group)
     ├─ mast (Group) → radar (Group, rotation.y)
     ├─ jetP / jetS (housing Group)
     │    ├─ nozzle (Group, rotation.y = helm) → nozzle mesh, ahead-flow cone
     │    ├─ bucket (Group, rotation.z = deploy·max) → scoop, trunnions      (or child of nozzle)
     │    └─ reverse-flow Group (positioned at bucket lip each frame)
     └─ helpers (AxesHelper per hinge while tuning; hidden in production)
```

Naming every pivot (`group.name`) lets a GUI or the URL layer find parts with `boat.getObjectByName('rampBow')`, and a `GLTFExporter` (verified at 0.128.0) dump of `boat` gives other tools the same hierarchy.

## Verification log

- `curl https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` → HTTP 200, `application/javascript`, 603,445 bytes, UMD header, `REVISION = "128"`.
- `curl https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js` → HTTP 200, 26,375 bytes, `THREE.OrbitControls = OrbitControls;` (line 1043), zero `import` statements.
- jsdelivr 0.128.0 also serves (HTTP 200, attach the named global): `examples/js/utils/BufferGeometryUtils.js` (`mergeBufferGeometries`, `mergeVertices`, `computeTangents`, ...), `objects/Water.js`, `objects/Sky.js`, `environments/RoomEnvironment.js`, `deprecated/Geometry.js`, `loaders/GLTFLoader.js`, `exporters/GLTFExporter.js`, `objects/Reflector.js`, `helpers/VertexNormalsHelper.js`.
- Run in Node 24 against the downloaded bundle: `loftHull` (no NaN normals, outward normals on all six panel classes), Lathe orientation, Extrude `depth` direction and `amount` warning, Cylinder/Cone/Plane/Shape orientation, `ShapeUtils.triangulateShape` winding, `MathUtils` members (`clamp lerp damp inverseLerp smoothstep smootherstep degToRad radToDeg pingpong mapLinear ...`), constants (`sRGBEncoding = 3001`, `LinearEncoding = 3000`, `ACESFilmicToneMapping = 4`, `PCFSoftShadowMap = 2`), renderer defaults (`outputEncoding = LinearEncoding`, `gammaFactor = 2`, `physicallyCorrectLights = false`, `toneMapping = NoToneMapping`), `PMREMGenerator.fromScene(scene, sigma = 0, near = 0.1, far = 100)`, `shadow.normalBias`, `scene.environment`, negative-determinant front-face flip, nozzle/bucket sign conventions.

## Sources

- three.js r128 build: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js and add-ons under https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/
- three.js Migration Guide (r124→r125 Geometry removal, r127→r128 ES6 examples): https://github.com/mrdoob/three.js/wiki/Migration-Guide
- three.js r128 release notes: https://github.com/mrdoob/three.js/releases/tag/r128
- KTH thesis, "Water jet steering concept - evaluation of an environmental design" (Kamewa steering unit ±30°, reversing mechanism on the steering unit, zero-thrust split), DiVA 708479, pp. 4–5: https://www.diva-portal.org/smash/get/diva2:708479/FULLTEXT01.pdf
- US patent 6,152,792 "Steering and reversing apparatus for waterjet propulsion" (vertical steering axis, horizontal transverse reversing axis, deflector parked above the nozzle): https://patents.google.com/patent/US6152792A/en
- Kongsberg Maritime, Kamewa S-3/CA ("compact reversing bucket and steering nozzle"): https://kongsbergmaritime.com/products/propulsors-and-propulsion-systems/waterjets/steel-waterjets/s-3-ca/
- Waterjet control patent describing combined nozzle/bucket thrust vectors: https://patents.google.com/patent/US6865996
- Headless Chrome WebGL flags: https://developer.chrome.com/blog/supercharge-web-ai-testing and https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/docs/gpu/swiftshader.md ; Puppeteer `--use-angle=swiftshader-webgl` injection: https://github.com/puppeteer/puppeteer/issues/8638
- CB90 waterjet fit (two Kamewa FF-jet 450 on 90H, FF-jet 410 on 90HS, S32 on HSM): https://sv.wikipedia.org/wiki/Stridsb%C3%A5t_90H and https://www.soldf.com/fartyg-och-batar/stridsbat-90h-strb90h/
