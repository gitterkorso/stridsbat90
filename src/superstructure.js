// Stridsbåt 90 H – reference-led wheelhouse with FORWARD-raked windscreen and two side windows.
// The supplied 845 cutaway and 826 photo override the legacy SPEC rake and centered gun well.
// The starboard twin installation is low on the foredeck. The recessed cockpit has working
// controls, dark plotters and openable hatches. Requires THREE (r128),
// constants.js and util.js. Frame: metres, Y up, +X forward (bow), +Z starboard. Built in hull coordinates.
window.CB90 = window.CB90 || {};
CB90.buildSuperstructure = function (THREE) {
  const U = CB90.util, M = CB90.M, C = CB90.COLORS;
  const PI = Math.PI;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const group = new THREE.Group(); group.name = 'superstructure';
  const parts = {}, articulations = [];
  const sub = (name, parent) => { const g = new THREE.Group(); g.name = name; (parent || group).add(g); parts[name] = g; return g; };

  // ---------- materials ----------
  // Private clone of the shared camo material so setCutaway() does not affect the hull.
  const camoMat = U.cloneCamoMaterial(U.camoMaterial()); camoMat.vertexColors = true; camoMat.name = 'camo-wheelhouse';
  const insideShellMat = new THREE.MeshStandardMaterial({ color: 0xb9c3bd, roughness: 0.72, metalness: 0.10 });
  // The glazing needs to remain readable from a seated eye as well as reflecting the sky outside.
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x86a4a0, roughness: 0.09, metalness: 0.04,
    transparent: true, opacity: 0.27, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1 });
  const frame = U.mat(0x1c1e20, { roughness: 0.6, metalness: 0.3, name: 'frame' });
  const darkHole = U.mat(0x101214, { roughness: 1 });
  const darkLining = U.mat(0x101214, { roughness: 1, side: THREE.DoubleSide, name: 'lining' });
  const lidMat = U.mat(C.DECK_LIGHT, { roughness: 0.8 });
  const floorMat = U.mat(C.DECK, { roughness: 0.95 });
  const seatMat = U.mat(0x2a2c2e, { roughness: 0.9 });
  const consoleMat = U.mat(0x3a3d40, { roughness: 0.8, metalness: 0.2 });
  const screenMat = U.mat(0x0c1014, { roughness: 0.3, metalness: 0.4, emissive: 0x0a2230 });
  const metal = U.metal(), dark = U.darkMetal();
  const gun = U.mat(0x25282a, { roughness: 0.55, metalness: 0.5, name: 'gun' });
  const ammo = U.mat(0x4a5040, { roughness: 0.9 });
  const white = U.mat(C.WHITE, { roughness: 0.6, metalness: 0.05, name: 'white' });
  const lamp = U.mat(0xfff6dc, { roughness: 0.2, emissive: 0xb8ac88 });
  const red = U.mat(C.RED, { roughness: 0.5 });

  // ---------- wheelhouse dimensions ----------
  const T = 0.05;                       // wall thickness
  const RT = 0.06;                      // roof thickness
  const BASE_Y = M.WH_BASE_Y - 0.01;    // walls start 1 cm inside the deck (no coplanar faces with the deck top)
  const TOP_Y = M.WH_ROOF_Y - 0.03;     // walls end inside the roof plate
  // Cabin details use the same vertical datum as the shell. Moving the wheelhouse
  // to the measured GA height must not leave its windows or interior above the roof.
  const cabinDatumShift = (M.WH_FLOOR_Y == null ? M.WH_ROOF_Y - 2.10 : M.WH_FLOOR_Y) - 0.90;
  /** Half-width of the wheelhouse at height y (tumblehome). */
  const hw = (y) => U.lerp(M.WH_HALFW_BASE, M.WH_HALFW_ROOF, (y - M.WH_BASE_Y) / (M.WH_ROOF_Y - M.WH_BASE_Y));
  // The aft bulkhead rakes forward towards the roof in both the 845 cutaway and CB90 H GA.
  const aftBaseX = M.WH_AFT_BASE_X == null ? M.WH_X0 - 0.50 : M.WH_AFT_BASE_X;
  const aftX = y => U.lerp(aftBaseX, M.WH_X0, (y - M.WH_BASE_Y) / (M.WH_ROOF_Y - M.WH_BASE_Y));
  /** x of the windscreen line at height y (between dash top and roof). */
  const wsX = (y) => U.lerp(M.WH_DASH_TOP_X, M.WH_WS_TOP_X, (y - M.WH_DASH_TOP_Y) / (M.WH_ROOF_Y - M.WH_DASH_TOP_Y));

  // ---------- helpers ----------
  /** Group whose local X and Y axes are the given hull-frame vectors (local Z = X × Y), placed at origin. */
  function frameAt(origin, xAxis, yAxis) {
    const g = new THREE.Group();
    const xa = xAxis.clone().normalize(), ya = yAxis.clone().normalize();
    const za = new THREE.Vector3().crossVectors(xa, ya).normalize();
    g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, ya, za));
    g.position.copy(origin);
    g.updateMatrix();
    return g;
  }
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  /** Extruded polygon (optional holes) drawn in a frame group's local XY plane, extruded along local +Z by depth and shifted by zShift. */
  function plate(pts, holes, depth, zShift, material) {
    const shape = new THREE.Shape();
    pts.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
    shape.closePath();
    (holes || []).forEach((h) => {
      const path = new THREE.Path();
      h.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
      path.closePath();
      shape.holes.push(path);
    });
    const geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, steps: 1 });
    if (zShift) geo.translate(0, 0, zShift);
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }
  /** Split every triangle of a geometry until no edge is longer than maxEdge (longest-edge bisection, winding kept); flat normals. */
  function refine(geometry, maxEdge) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const P = g.attributes.position.array, out = [], max2 = maxEdge * maxEdge;
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    function tri(a, b, c, depth) {
      const ab = d2(a, b), bc = d2(b, c), ca = d2(c, a), m = Math.max(ab, bc, ca);
      if (m <= max2 || depth > 14) { out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); return; }
      if (m === ab) { const q = mid(a, b); tri(a, q, c, depth + 1); tri(q, b, c, depth + 1); }
      else if (m === bc) { const q = mid(b, c); tri(a, b, q, depth + 1); tri(a, q, c, depth + 1); }
      else { const q = mid(c, a); tri(a, b, q, depth + 1); tri(q, b, c, depth + 1); }
    }
    for (let i = 0; i < P.length; i += 9) tri([P[i], P[i + 1], P[i + 2]], [P[i + 3], P[i + 4], P[i + 5]], [P[i + 6], P[i + 7], P[i + 8]], 0);
    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    ng.computeVertexNormals();
    if (g !== geometry) g.dispose();
    return ng;
  }
  /**
   * Camo-paint a plate that lives in frame group g (hull matrix = g.matrix). The plate is tessellated (~12 cm) and every
   * triangle is coloured flat from the camo pattern at its centroid so the splinter fields keep hard edges (plain per-vertex
   * colours on the few huge extrude triangles would blend into one muddy tone). Faces whose local normal points along
   * innerZ (the inside of the wheelhouse) get the interior colour instead.
   */
  function camoPlate(mesh, g, innerZ) {
    g.add(mesh); g.updateMatrix();
    const old = mesh.geometry;
    const geo = refine(old, 0.12); old.dispose();
    mesh.geometry = geo;
    U.applyCamo(geo, g.matrix);                        // shared pattern/material contract (colour attribute + antifouling rule)
    const pos = geo.attributes.position, nrm = geo.attributes.normal, col = geo.attributes.color;
    const ic = new THREE.Color(C.INTERIOR), paintWhite = new THREE.Color(0xffffff), v = new THREE.Vector3(), cen = new THREE.Vector3();
    const outsideIndices = [], insideIndices = [];
    for (let i = 0; i < pos.count; i += 3) {
      cen.set(0, 0, 0);
      for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, i + k); cen.add(v); }
      cen.multiplyScalar(1 / 3).applyMatrix4(g.matrix);
      const inward = nrm.getZ(i) * innerZ > 0.7;
      const c = inward ? ic : (camoMat.map ? paintWhite : U.camoColor(cen.x, cen.y, cen.z));
      (inward ? insideIndices : outsideIndices).push(i, i + 1, i + 2);
      for (let k = 0; k < 3; k++) col.setXYZ(i + k, c.r, c.g, c.b);
    }
    geo.setIndex(outsideIndices.concat(insideIndices));
    geo.clearGroups();
    geo.addGroup(0, outsideIndices.length, 0);
    geo.addGroup(outsideIndices.length, insideIndices.length, 1);
    mesh.material = [camoMat, insideShellMat];
    return mesh;
  }
  const sphere = (r, p, m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m || metal); s.position.copy(p); s.castShadow = true; return s; };

  // ================= WALLS (camo, tumblehome) =================
  const walls = sub('walls');
  const wallGlass = [];
  // -- two broad side panes, with clipped gasket corners as in the supplied 845/826 references
  {
    const slope = V3(0, M.WH_ROOF_Y - M.WH_BASE_Y, -(M.WH_HALFW_BASE - M.WH_HALFW_ROOF)); // starboard "up" direction along the wall
    const N = slope.length();
    const vOf = (y) => (y - M.WH_BASE_Y) / (M.WH_ROOF_Y - M.WH_BASE_Y) * N;       // distance along the wall from the base line
    const v0 = vOf(M.WH_DASH_TOP_Y + 0.01), v1 = vOf(M.WH_ROOF_Y - 0.09);
    const chamfer = (points, amount) => points.flatMap((p, i) => {
      const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
      const toward = q => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + (q[0] - p[0]) * amount / d, p[1] + (q[1] - p[1]) * amount / d]; };
      return [toward(prev), toward(next)];
    });
    [-1, 1].forEach((s) => {
      const up = V3(0, slope.y, s * slope.z);
      const g = frameAt(V3(0, M.WH_BASE_Y, s * M.WH_HALFW_BASE), V3(1, 0, 0), up);
      g.name = s > 0 ? 'wallS' : 'wallP';
      const zOut = s > 0;                       // local Z = X × up is outward on the starboard side, inward on port
      const outline = [
        [aftX(BASE_Y), vOf(BASE_Y)], [M.WH_X1, vOf(BASE_Y)],
        [M.WH_DASH_TOP_X, vOf(M.WH_DASH_TOP_Y)], [wsX(TOP_Y), vOf(TOP_Y)], [aftX(TOP_Y), vOf(TOP_Y)]];
      const holes = [
        chamfer([[M.WH_X0 - 0.05, v0], [9.985, v0], [9.985, v1], [M.WH_X0 + 0.29, v1]], 0.045),
        chamfer([[10.085, v0], [M.WH_DASH_TOP_X - 0.05, v0], [M.WH_WS_TOP_X - 0.10, v1], [10.085, v1]], 0.045),
      ];
      parts[s > 0 ? 'sideWindowsS' : 'sideWindowsP'] = [];
      camoPlate(plate(outline, holes, T, zOut ? -T : 0, camoMat), g, zOut ? -1 : 1);
      holes.forEach((h, index) => {
        const p = plate(h, null, 0.012, (zOut ? -T / 2 : T / 2) - 0.006, glass); p.castShadow = false;
        p.name = 'sideWindow' + (s > 0 ? 'S' : 'P') + (index + 1);
        parts[s > 0 ? 'sideWindowsS' : 'sideWindowsP'].push(p); g.add(p); wallGlass.push(p);
        for (let j = 0; j < h.length; j++) {
          const a = h[j], b = h[(j + 1) % h.length];
          g.add(U.bar(V3(a[0], a[1], zOut ? -T / 2 : T / 2), V3(b[0], b[1], zOut ? -T / 2 : T / 2), 0.023, frame));
        }
      });
      walls.add(g);
    });
  }
  // -- aft wall: forward-raked, with two broad rear panes visible in the 845 cutaway.
  {
    const up = V3(M.WH_X0 - aftBaseX, M.WH_ROOF_Y - M.WH_BASE_Y, 0);
    const length = up.length();
    const vOf = y => (y - M.WH_BASE_Y) / up.y * length;
    const g = frameAt(V3(aftBaseX, M.WH_BASE_Y, 0), V3(0, 0, 1), up);
    g.name = 'wallAft'; parts.aftWall = g;
    const windowSill = M.WH_ROOF_Y - 0.53, windowTop = M.WH_ROOF_Y - 0.12;
    const holes = [rect(-1.08, vOf(windowSill), -0.10, vOf(windowTop)),
      rect(0.10, vOf(windowSill), 1.08, vOf(windowTop))];
    // Keep the bottom-open companionway below the rear glazing. The troop-deck
    // aperture continues inside it; the sloping bulkhead must never bridge that opening.
    const portalTop = vOf(M.WH_ROOF_Y - 0.57);
    const portalOutline = [[-hw(BASE_Y), vOf(BASE_Y)], [-0.44, vOf(BASE_Y)], [-0.44, portalTop], [0.44, portalTop],
      [0.44, vOf(BASE_Y)], [hw(BASE_Y), vOf(BASE_Y)], [hw(TOP_Y), vOf(TOP_Y)], [-hw(TOP_Y), vOf(TOP_Y)]];
    camoPlate(plate(portalOutline, holes, T, -T, camoMat), g, -1);
    parts.aftWindows = [];
    holes.forEach((h, index) => {
      const p = plate(h, null, 0.012, -T / 2 - 0.006, glass); p.castShadow = false;
      p.name = 'aftWindow' + (index ? 'S' : 'P');
      g.add(p); wallGlass.push(p); parts.aftWindows.push(p);
      for (let j = 0; j < h.length; j++) {
        const a = h[j], b = h[(j + 1) % h.length];
        g.add(U.bar(V3(a[0], a[1], -T / 2), V3(b[0], b[1], -T / 2), 0.023, frame));
      }
    });
    walls.add(g);
  }
  // -- substantial lower front slope: the foot is forward of the sill, and glazing above leans forward
  {
    const dir = V3(M.WH_DASH_TOP_X - M.WH_X1, M.WH_DASH_TOP_Y - M.WH_BASE_Y, 0);
    const L = dir.length();
    const g = frameAt(V3(M.WH_X1, M.WH_BASE_Y, 0), V3(0, 0, 1), dir);   // local Z = inward (aft/down)
    g.name = 'dash';
    const w0 = hw(M.WH_BASE_Y), w1 = hw(M.WH_DASH_TOP_Y);
    camoPlate(plate([[-w0, -0.02], [w0, -0.02], [w1, L], [-w1, L]], null, T, 0, camoMat), g, 1);
    walls.add(g);
  }

  // ================= ROOF (camo plate with two hatch holes + brow over the windscreen) =================
  const roof = sub('roof');
  const HX0 = 9.60, HX1 = 10.15, HZ0 = 0.55, HZ1 = 1.10;      // hatch holes (lid x∈[-0.55,0] from the pivot at 10.15, z±0.275 about ±0.825)
  const BROW_X = M.WH_WS_TOP_X + 0.07;                          // thin full-width brow, just ahead of the forward-raked glass
  {
    const g = frameAt(V3(0, M.WH_ROOF_Y - RT, 0), V3(1, 0, 0), V3(0, 0, -1));   // local X = hull x, local Y = -hull z, local Z = up
    g.name = 'roofPlate';
    const rx0 = M.WH_ROOF_X0 - 0.05, rz = M.WH_HALFW_ROOF + 0.05;
    const outline = [[rx0, -rz], [BROW_X - 0.05, -rz], [BROW_X, -(rz - 0.05)], [BROW_X, rz - 0.05], [BROW_X - 0.05, rz], [rx0, rz]];
    const holes = [rect(HX0, HZ0, HX1, HZ1), rect(HX0, -HZ1, HX1, -HZ0)];
    camoPlate(plate(outline, holes, RT, 0, camoMat), g, -1);
    roof.add(g);
  }
  // hatch coamings: low lip on top, dark lining below the roof (the "dark opening"), hinge knuckles, then the lids
  const lids = sub('roofHatches', roof);
  [['hatch_roofP', 'Taklucka styrhytt babord', -1], ['hatch_roofS', 'Taklucka styrhytt styrbord', 1]].forEach(([id, label, s]) => {
    const zc = s * (HZ0 + HZ1) / 2, hl = HX1 - HX0, hwid = HZ1 - HZ0, xc = (HX0 + HX1) / 2;
    const lipW = 0.04, lipH = 0.02;
    // lip (4 boxes) y 2.99..3.02 around the hole
    lids.add(U.box(hl + 2 * lipW, lipH + 0.01, lipW, lidMat, [xc, M.WH_ROOF_Y + lipH / 2 - 0.005, zc - hwid / 2 - lipW / 2]));
    lids.add(U.box(hl + 2 * lipW, lipH + 0.01, lipW, lidMat, [xc, M.WH_ROOF_Y + lipH / 2 - 0.005, zc + hwid / 2 + lipW / 2]));
    lids.add(U.box(lipW, lipH + 0.01, hwid, lidMat, [HX0 - lipW / 2, M.WH_ROOF_Y + lipH / 2 - 0.005, zc]));
    lids.add(U.box(lipW, lipH + 0.01, hwid, lidMat, [HX1 + lipW / 2, M.WH_ROOF_Y + lipH / 2 - 0.005, zc]));
    // dark trunk lining under the roof (y 2.78..2.945)
    const ly0 = M.WH_ROOF_Y - RT - 0.16, ly1 = M.WH_ROOF_Y - RT + 0.005, lh = ly1 - ly0, lyc = (ly0 + ly1) / 2;
    lids.add(U.box(hl, lh, 0.015, darkLining, [xc, lyc, zc - hwid / 2 + 0.0075]));
    lids.add(U.box(hl, lh, 0.015, darkLining, [xc, lyc, zc + hwid / 2 - 0.0075]));
    lids.add(U.box(0.015, lh, hwid, darkLining, [HX0 + 0.0075, lyc, zc]));
    lids.add(U.box(0.015, lh, hwid, darkLining, [HX1 - 0.0075, lyc, zc]));
    // hinge knuckles on the forward edge
    [-0.19, 0.19].forEach((dz) => lids.add(U.cyl(0.018, 0.018, 0.12, dark, 10, [HX1, M.WH_ROOF_Y + 0.012, zc + dz], 'z')));
    // the lid: hinged at its FORWARD edge (x = 10.15), extends aft (-X); open = -85° about z lifts the aft edge up
    const rec = U.hinge({ id: id, label: label, kind: 'hatch', parent: lids, pivot: [HX1, M.WH_ROOF_Y, zc], axis: 'z', closed: 0, open: -85, speed: 1.2 });
    rec.pivot.add(U.box(hl + 0.06, 0.04, hwid + 0.06, lidMat, [-hl / 2, 0.045, 0]));      // lid y 0.025..0.065 (5 mm above the lip)
    rec.pivot.add(U.box(0.14, 0.025, 0.03, dark, [-hl + 0.12, 0.012, 0]));                  // inside handle (aft end)
    rec.pivot.add(U.box(0.04, 0.02, 0.10, dark, [-0.09, 0.075, s * 0.12]));                  // small dog/lock on top
    articulations.push(rec);
    parts[id] = rec.pivot;
  });

  // ================= WINDSCREEN: three independently framed panes =================
  // Photo 925 governs: a broad centre pane, no centreline mullion, and three
  // top-mounted wipers. Manufacturer photo CB90H-113 corroborates this layout.
  const windscreen = sub('windscreen');
  {
    const dir = V3(M.WH_WS_TOP_X - M.WH_DASH_TOP_X, M.WH_ROOF_Y - M.WH_DASH_TOP_Y, 0);
    const L = dir.length();
    const g = frameAt(V3(M.WH_DASH_TOP_X, M.WH_DASH_TOP_Y, 0), V3(0, 0, 1), dir);
    g.name = 'wsFrame';
    const w0 = hw(M.WH_DASH_TOP_Y), w1 = hw(M.WH_ROOF_Y);
    const y0 = .045, y1 = L - .055;
    const widthAt = y => U.lerp(w0, w1, y / L);
    // Sample a small round at every corner, keeping straight sides between them.
    const rounded = (polygon, r) => polygon.flatMap((p, i) => {
      const prev=polygon[(i+polygon.length-1)%polygon.length],next=polygon[(i+1)%polygon.length];
      const toward=q=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);return [p[0]+(q[0]-p[0])*r/d,p[1]+(q[1]-p[1])*r/d];};
      const a=toward(prev),b=toward(next),points=[];
      for(let k=0;k<=5;k++){const t=k/5,u=1-t;points.push([u*u*a[0]+2*u*t*p[0]+t*t*b[0],u*u*a[1]+2*u*t*p[1]+t*t*b[1]]);}
      return points;
    });
    const holes=[
      rounded([[-widthAt(y0)+.055,y0],[-.48,y0],[-.48,y1],[-widthAt(y1)+.055,y1]],.045),
      rounded([[-.42,y0],[.42,y0],[.42,y1],[-.42,y1]],.045),
      rounded([[.48,y0],[widthAt(y0)-.055,y0],[widthAt(y1)-.055,y1],[.48,y1]],.045)
    ];
    camoPlate(plate([[-w0,0],[w0,0],[w1,L],[-w1,L]],holes,.045,0,camoMat),g,1);
    const glazing=new THREE.Group();glazing.name='forwardRakedWindscreenGlass';g.add(glazing);
    parts.windscreenGlass=glazing;parts.frontWindows=[];parts.frontWipers=[];
    holes.forEach((h,i)=>{
      const pane=plate(h,null,.012,.014,glass);pane.name='frontWindow'+['P','Centre','S'][i];pane.castShadow=false;
      glazing.add(pane);wallGlass.push(pane);parts.frontWindows.push(pane);
      for(let j=0;j<h.length;j++) {
        const a=h[j],b=h[(j+1)%h.length];
        g.add(U.bar(V3(a[0],a[1],.012),V3(b[0],b[1],.012),.013,frame));
      }
      const wiper=new THREE.Group();wiper.name='frontWiper'+i;g.add(wiper);parts.frontWipers.push(wiper);
      const z=[-.86,0,.86][i],mountZ=z-.16,tipZ=z+.10,top=y1-.025;
      wiper.add(U.cyl(.022,.022,.04,dark,12,[mountZ,top,-.022],'z'));
      wiper.add(U.box(.095,.04,.035,frame,[mountZ+.025,top+.012,.06])); // motor behind the upper header
      for(const offset of [0,.024])wiper.add(U.bar(V3(mountZ+offset,top,-.028),V3(tipZ+offset,.23,-.036),.007,dark));
      wiper.add(U.bar(V3(tipZ-.025,.12,-.044),V3(tipZ+.055,.56,-.044),.009,frame));
      wiper.add(U.bar(V3(tipZ+.01,.24,-.036),V3(tipZ+.01,.32,-.044),.008,metal));
    });
    windscreen.add(g);
  }

  // ================= ROOF GEAR: searchlight, horn, GPS, compass repeater =================
  const roofGear = sub('roofGear');
  {
    const SL = M.SEARCHLIGHT, ry = M.WH_ROOF_Y;
    roofGear.add(U.cyl(0.05, 0.06, 0.05, dark, 14, [SL.x, ry + 0.025, SL.z]));                     // base
    roofGear.add(U.cyl(0.02, 0.02, 0.10, metal, 8, [SL.x, ry + 0.10, SL.z]));                        // stem
    roofGear.add(U.box(0.03, 0.10, 0.26, metal, [SL.x - 0.03, ry + 0.17, SL.z]));                    // yoke (trunnions on both sides)
    roofGear.add(U.cyl(SL.r, SL.r, 0.18, metal, 18, [SL.x, ry + 0.17, SL.z], 'x'));                  // drum
    roofGear.add(U.cyl(SL.r - 0.015, SL.r - 0.015, 0.012, lamp, 18, [SL.x + 0.095, ry + 0.17, SL.z], 'x')); // lens
    roofGear.add(U.box(0.05, 0.03, 0.04, dark, [SL.x - 0.10, ry + 0.17, SL.z]));                     // rear housing
    // signal horn, starboard front
    roofGear.add(U.box(0.06, 0.04, 0.06, dark, [10.42, ry + 0.02, 0.28]));
    roofGear.add(U.cyl(0.05, 0.022, 0.20, metal, 12, [10.55, ry + 0.07, 0.28], 'x'));
    // GPS mushroom antenna, aft starboard of the hatches
    roofGear.add(U.cyl(0.012, 0.012, 0.12, metal, 8, [9.40, ry + 0.06, 0.40]));
    roofGear.add(U.cyl(0.06, 0.05, 0.04, white, 14, [9.40, ry + 0.14, 0.40]));
  }

  // ================= WALKABLE WHEELHOUSE =================
  const interior = sub('interior');
  interior.position.y = cabinDatumShift;
  const interiorLights = [], engineNeedles = [];
  parts.interiorLights = interiorLights;
  const doorX = M.WH_DOOR_X || M.WH_X1 - 0.27;
  parts.cabinBounds = { x0: M.WH_X0 + 0.02, x1: doorX - 0.06, z0: -1.34, z1: 1.34, floorY: M.TROOP_FLOOR_Y, ceilingY: M.WH_ROOF_Y - RT };
  {
    const enamel = U.mat(0xb9c3bd, { roughness: 0.68, metalness: 0.12 });
    const panelPaint = U.mat(0x404c49, { roughness: 0.55, metalness: 0.30 });
    const consoleTop = U.mat(0x202827, { roughness: 0.8, metalness: 0.07 });
    const upholstery = U.mat(0x293331, { roughness: 0.94, metalness: 0 });
    const stitching = U.mat(0x89928b, { roughness: 1, metalness: 0 });
    const aluminum = U.mat(0xa3ada9, { roughness: 0.38, metalness: 0.78 });
    const brass = U.mat(0x998568, { roughness: 0.4, metalness: 0.7 });
    const rubber = U.mat(0x111715, { roughness: 0.85, metalness: 0 });
    const amber = U.mat(0xd9a85b, { emissive: 0x714315, roughness: 0.35 });
    const green = U.mat(0x93d6b3, { emissive: 0x346c4b, roughness: 0.25 });
    const safety = U.mat(0xc6a351, { roughness: 0.8 });
    const screwPoints = [];
    // Fit the established cockpit to the shorter GA silhouette instead of extending it through the sloped front.
    const bodyShift = M.WH_X1 - 11.40;
    const displayX = M.WH_DASH_TOP_X - 0.10;
    const wheelX = M.WH_DASH_TOP_X - 0.47;
    const soleX0 = M.WH_X0 + 0.01, soleX1 = doorX, soleL = soleX1 - soleX0, soleCX = (soleX0 + soleX1) / 2;
    const liningL = M.WH_X1 - M.WH_X0 - 0.12, liningCX = (M.WH_X0 + M.WH_X1) / 2;

    function roundedBox(w, h, d, r, material, position) {
      r = Math.min(r, w / 3, h / 3, d / 3);
      const x = -w / 2 + r, y = -h / 2 + r, sw = w - 2 * r, sh = h - 2 * r;
      const shape = new THREE.Shape(); shape.moveTo(x, y); shape.lineTo(x + sw, y);
      shape.lineTo(x + sw, y + sh); shape.lineTo(x, y + sh); shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * r, bevelEnabled: true,
        bevelSegments: 3, steps: 1, bevelSize: r, bevelThickness: r, curveSegments: 4 });
      geo.translate(0, 0, -d / 2 + r);
      const mesh = new THREE.Mesh(geo, material); mesh.position.set(...position);
      mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
    }
    function canvasMaterial(draw, w, h, emissive) {
      if (typeof document === 'undefined') return U.mat(0x9eaaa2, { roughness: 0.6 });
      const c = document.createElement('canvas'); c.width = w || 512; c.height = h || 128;
      const ctx = c.getContext('2d'); draw(ctx, c.width, c.height);
      const map = new THREE.CanvasTexture(c); map.encoding = THREE.sRGBEncoding;
      map.anisotropy = 4;
      return new THREE.MeshStandardMaterial({ map, roughness: 0.68, metalness: 0.10,
        transparent: true, depthWrite: false, emissive: emissive || 0x29312b, emissiveMap: map });
    }
    function label(text, width, height, parent, position, color, bg) {
      const material = canvasMaterial((ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
        ctx.fillStyle = color || '#cdd7cc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '600 36px Arial, sans-serif'; ctx.fillText(text, w / 2, h / 2, w - 24);
      }, 512, 64);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
      mesh.position.set(...position); parent.add(mesh); return mesh;
    }
    function screws(parent, width, height, z, material) {
      [-1, 1].forEach(a => [-1, 1].forEach(b => {
        const screw = U.cyl(0.006, 0.006, 0.003, material || aluminum, 8, [a * (width / 2 - 0.025), b * (height / 2 - 0.025), z], 'z');
        parent.add(screw);
        parent.add(U.box(0.0065, 0.0014, 0.001, rubber, [screw.position.x, screw.position.y, z + 0.002]));
      }));
    }
    const instrumentFrame = (x, y, z) => frameAt(V3(x, y, z), V3(0, 0, 1), V3(0.22, 0.975, 0));

    // Stippled nonslip rubber floor, with raised aluminium tread strips and a clear central aisle.
    const floorTexture = canvasMaterial((ctx, w, h) => {
      ctx.fillStyle = '#303a37'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 10) for (let x = 0; x < w; x += 12) {
        ctx.fillStyle = (x + y) % 3 ? '#46504a' : '#242d29';
        ctx.fillRect(x + (y % 20 ? 5 : 0), y, 4, 2);
      }
    }, 512, 512, 0x000000);
    floorTexture.transparent = false; floorTexture.depthWrite = true;
    const aisleY = M.TROOP_FLOOR_Y - cabinDatumShift;
    const platformY=.90+M.HELM_PLATFORM_RISE;
    const sole = U.box(soleL + .01, 0.045, .90, floorTexture, [soleCX - .005, aisleY - .0225, 0]);
    sole.name = 'wheelhouseSole'; parts.cabinSole = sole; interior.add(sole);
    // Raised outboard platforms support the chairs; the centre passage stays at troop-floor level.
    parts.helmPlatforms=[];parts.helmPlatformWalls=[];
    // Starboard forward corner is recessed for the aft-opening watertight door
    // and its four projecting dogs (SHK RM2008:02 pp14–15).
    const doorPocketX=9.93,doorPocketZ=.67;
    for(const side of [-1,1]) {
      const spans=side>0?[[soleX0,doorPocketX,.45],[doorPocketX,soleX1,doorPocketZ]]:[[soleX0,soleX1,.45]];
      for(const [x0,x1,inner] of spans) {
        const width=1.37-inner,cx=(x0+x1)/2,zc=side*(1.37+inner)/2;
        const platform=U.box(x1-x0,.045,width,floorTexture,[cx,platformY-.0225,zc]);
        platform.name='helmPlatform';interior.add(platform);parts.helmPlatforms.push(platform);
        const wall=U.box(x1-x0,platformY-aisleY,.035,enamel,[cx,(platformY+aisleY)/2,side*(inner+.0175)]);
        wall.name='helmPlatformRiser';interior.add(wall);parts.helmPlatformWalls.push(wall);
      }
      if(side>0) {
        const returnWall=U.box(.035,platformY-aisleY,doorPocketZ-.45,enamel,[doorPocketX-.0175,(platformY+aisleY)/2,(doorPocketZ+.45)/2]);
        interior.add(returnWall);parts.helmPlatformWalls.push(returnWall);
      }
    }
    for(let x=M.WH_X0+.15;x<soleX1-.02;x+=.39) {
      interior.add(U.box(.012,.006,.86,aluminum,[x,aisleY+.004,0]));
      for(const side of [-1,1]) {
        const inner=side>0&&x>=doorPocketX?doorPocketZ:.45;
        interior.add(U.box(.012,.006,1.32-inner,aluminum,[x,platformY+.004,side*(1.32+inner)/2]));
      }
      for(const z of [-1.27,1.27])screwPoints.push([x,platformY+.01,z]);
    }
    [-1, 1].forEach(s => {
      interior.add(U.box(liningL, 1.06, 0.035, enamel, [liningCX, 1.43, s * 1.385]));
      interior.add(U.box(liningL, 0.065, 0.045, aluminum, [liningCX, 0.95, s * 1.355]));
      interior.add(U.box(liningL, 0.055, 0.070, panelPaint, [liningCX, 1.95, s * 1.36]));
      // Lower aft bulkhead leaves the real companionway unobstructed.
      interior.add(U.box(0.065, 1.07, 0.95, enamel, [8.63, 1.43, s * 0.915]));
      interior.add(U.box(0.095, 1.55, 0.045, aluminum, [8.68, 1.66, s * 0.463]));
      // Wall seams, stiffeners and continuous handrail below the windows.
      [8.92, 9.48, 10.04].forEach(x => {
        interior.add(U.box(0.025, 0.93, 0.025, aluminum, [x, 1.43, s * 1.355]));
        [1.04, 1.38, 1.82].forEach(y => screwPoints.push([x, y, s * 1.337]));
      });
      interior.add(U.bar(V3(8.94, 2.26, s * 1.27), V3(10.26, 2.26, s * 1.27), 0.019, aluminum));
      [8.98, 9.60, 10.21].forEach(x => interior.add(U.bar(V3(x, 2.26, s * 1.27), V3(x, 2.26, s * hw(2.26 + cabinDatumShift)), 0.013, aluminum)));
    });
    interior.add(U.box(0.095, 0.06, 0.96, aluminum, [8.68, 2.45, 0]));
    interior.add(U.box(0.18, 0.006, 0.88, safety, [8.70, aisleY+.006, 0]));

    // Two shock-mitigating pilot chairs: suspension, slides, curved cushions, bolsters,
    // stitching, headrests, harnesses, armrests and a footrest. The aisle stays open.
    [-1, 1].forEach(s => {
      const x = 9.54, z = s * 0.77;
      const chair = new THREE.Group(); chair.name = s > 0 ? 'driverSeat' : 'navigatorSeat'; chair.position.y=M.HELM_PLATFORM_RISE; interior.add(chair);
      parts[s > 0 ? 'driverSeat' : 'navigatorSeat'] = chair;
      if (s > 0) chair.userData.control = 'seat';
      [-0.20, 0.20].forEach(dz => {
        const slide=roundedBox(0.68,0.055,0.045,0.01,aluminum,[x,0.955,z+dz]);
        slide.name='helmSeatSlide';chair.add(slide);
        for(const dx of [-.25,.25]) {
          const foot=U.box(.11,.0275,.065,panelPaint,[x+dx,.91375,z+dz]);
          foot.name='helmSeatFoot';chair.add(foot);
        }
        for (const dx of [-0.25, 0.25]) screwPoints.push([x + dx, 0.986+M.HELM_PLATFORM_RISE, z + dz]);
      });
      chair.add(U.box(0.32, 0.06, 0.36, panelPaint, [x, 1.02, z]));
      chair.add(U.cyl(0.065, 0.078, 0.25, dark, 20, [x, 1.165, z]));
      chair.add(U.cyl(0.038, 0.038, 0.16+M.HELM_SEAT_LIFT, aluminum, 20, [x, 1.235+M.HELM_SEAT_LIFT/2, z]));
      // Bellows around the vertical shock absorber.
      for (let y = 1.07; y < 1.20; y += 0.018) chair.add(U.cyl(0.081, 0.081, 0.009, rubber, 20, [x, y, z]));
      // The GA helm section places the cushion about 1.0–1.1 m below the roof.
      // Raise the seat body on its telescoping support, preserving the platform
      // and the requested elevated viewpoint. These heights are reconstructed.
      const upper=new THREE.Group();upper.name='helmSeatUpper';upper.position.y=M.HELM_SEAT_LIFT;chair.add(upper);
      const cushion=roundedBox(0.56,0.12,0.52,0.026,upholstery,[x+.05,1.36,z]);
      cushion.name='helmSeatCushion';upper.add(cushion);parts[s>0?'driverCushion':'navigatorCushion']=cushion;
      if(s>0){
        const eye=new THREE.Object3D();eye.name='pilotEye';eye.position.set(9.44,1.42+M.HELM_EYE_ABOVE_CUSHION,.73);
        upper.add(eye);parts.pilotEye=eye;
      }
      [-1, 1].forEach(b => {
        upper.add(roundedBox(0.45, 0.12, 0.065, 0.017, upholstery, [x + 0.06, 1.42, z + b * 0.232]));
        upper.add(U.box(0.38, 0.003, 0.005, stitching, [x + 0.06, 1.425, z + b * 0.15]));
      });
      const back = roundedBox(0.14, 0.61, 0.52, 0.03, upholstery, [x - 0.22, 1.68, z]); back.rotation.z = -0.09; upper.add(back);
      upper.add(roundedBox(0.07, 0.40, 0.35, 0.018, seatMat, [x - 0.135, 1.72, z]));
      for (let y = 1.50; y < 1.91; y += 0.09) upper.add(U.box(0.008, 0.008, 0.32, rubber, [x - 0.092, y, z]));
      [-0.13, 0.13].forEach(dz => upper.add(U.cyl(0.008, 0.008, 0.20, aluminum, 10, [x - 0.23, 2.0, z + dz])));
      upper.add(roundedBox(0.15, 0.19, 0.35, 0.032, upholstery, [x - 0.23, 2.08, z]));
      [-1, 1].forEach(b => {
        upper.add(U.bar(V3(x - 0.16, 1.57, z + b * 0.30), V3(x - 0.16, 1.71, z + b * 0.30), 0.015, aluminum));
        upper.add(roundedBox(0.38, 0.065, 0.075, 0.018, upholstery, [x + 0.01, 1.74, z + b * 0.30]));
        upper.add(U.bar(V3(x-.09,1.42,z+b*.23),V3(x+.04,1.44,z+b*.025),.016,rubber));
      });
      upper.add(roundedBox(0.065, 0.032, 0.075, 0.008, aluminum, [x + 0.04, 1.438, z]));
      upper.add(U.box(0.03, 0.008, 0.035, red, [x + 0.04, 1.46, z]));
      chair.add(U.bar(V3(x+.31,1.08+M.HELM_FOOTREST_LIFT,z-.22),V3(x+.31,1.08+M.HELM_FOOTREST_LIFT,z+.22),.025,aluminum));
      chair.add(U.bar(V3(x,1.12+M.HELM_FOOTREST_LIFT,z),V3(x+.31,1.08+M.HELM_FOOTREST_LIFT,z),.019,dark));
      chair.add(U.cyl(0.025, 0.025, 0.04, amber, 14, [x - 0.08, 1.16, z + s * 0.24], 'z'));
      chair.traverse(o => { if (o.isMesh && s > 0) o.userData.control = 'seat'; });
    });

    // Foldable command/mechanic seat between the operators (SHK RM2008:02 p12).
    // Its mounting dimensions are reconstructed; it stows against the port
    // platform so the low centre passage remains clear when not in use.
    const centreSeat=U.hinge({id:'seat_commander',label:'Fäll ned mittstolen',kind:'seat',parent:interior,
      pivot:[9.05,1.48,-.42],axis:'x',closed:-90,open:0,speed:1.5});
    const foldingSeat=centreSeat.pivot;foldingSeat.name='commanderSeat';parts.commanderSeat=foldingSeat;
    const seatBase=roundedBox(.47,.07,.44,.018,upholstery,[0,.035,.25]);foldingSeat.add(seatBase);
    foldingSeat.add(U.box(.44,.035,.46,panelPaint,[0,-.015,.25]));
    const centreBack=roundedBox(.065,.43,.45,.016,upholstery,[-.245,.28,.25]);foldingSeat.add(centreBack);
    for(const xx of [-.18,.18]) {
      interior.add(U.box(.075,.08,.05,aluminum,[9.05+xx,1.48,-.435]));
      interior.add(U.box(.10,.02,.16,panelPaint,[9.05+xx,platformY+.01,-.55]));
      interior.add(U.bar(V3(9.05+xx,platformY+.02,-.55),V3(9.05+xx,1.48,-.55),.018,aluminum));
      interior.add(U.bar(V3(9.05+xx,1.48,-.55),V3(9.05+xx,1.48,-.435),.018,aluminum));
      foldingSeat.add(U.cyl(.023,.023,.09,aluminum,12,[xx,0,0],'x'));
      foldingSeat.add(U.bar(V3(xx,-.025,.02),V3(xx,-.025,.44),.014,aluminum));
    }
    for(const sign of [-1,1])foldingSeat.add(U.bar(V3(-.15,.082,.25+sign*.20),V3(.04,.085,.25+sign*.025),.015,rubber));
    foldingSeat.add(U.box(.055,.02,.06,aluminum,[.04,.09,.25]));
    U.setArticulation(centreSeat,0);articulations.push(centreSeat);

    // Port and starboard consoles are hollow shells. Access doors reveal wiring and a shelf,
    // and the low centre passage continues forward under the windscreen.
    [-1, 1].forEach(s => {
      const z=s*(s>0?1.01:.91),w=s>0?.66:.86;
      interior.add(roundedBox(0.83, 0.10, w, 0.025, consoleTop, [10.84 + bodyShift, 1.99, z]));
      interior.add(U.box(0.75, 0.89, 0.026, panelPaint, [10.86 + bodyShift, 1.50, z - s * (w / 2 - 0.015)]));
      interior.add(U.box(0.75, 0.89, 0.026, panelPaint, [10.86 + bodyShift, 1.50, z + s * (w / 2 - 0.015)]));
      interior.add(U.box(0.035, 0.89, w, panelPaint, [11.23 + bodyShift, 1.50, z]));
      interior.add(U.box(0.72, 0.025, w - 0.04, aluminum, [10.87 + bodyShift, 1.12, z]));
      interior.add(U.box(0.72, 0.025, w - 0.04, aluminum, [10.87 + bodyShift, 1.47, z]));
      interior.add(U.box(0.18, 0.12, 0.37, dark, [11.0 + bodyShift, 1.55, z]));
      for (let i = 0; i < 4; i++) interior.add(U.tube([V3(11.07 + bodyShift, 1.57, z - 0.16 + i * 0.07), V3(11.16 + bodyShift, 1.67, z - 0.16 + i * 0.07), V3(11.16 + bodyShift, 1.86, z - 0.16 + i * 0.07)], 0.005, i === 0 ? red : rubber, 8));
      const rec = U.hinge({ id: s > 0 ? 'hatch_consoleS' : 'hatch_consoleP', label: s > 0 ? 'Elskåp styrbord' : 'Elskåp babord', kind: 'hatch', parent: interior,
        pivot: [10.45 + bodyShift, 1.13, z + s * (w/2-.03)], axis: 'y', closed: 0, open: s * 102, speed: 1.8 });
      rec.pivot.add(roundedBox(.035,.75,w-.06,.008,panelPaint,[0,.375,-s*(w-.06)/2]));
      rec.pivot.add(U.box(0.025, 0.12, 0.028, aluminum, [-.03,.45,-s*(w-.18)]));
      for (let y = 0.18; y < 0.35; y += 0.03) rec.pivot.add(U.box(0.003, 0.006, w*.5,rubber,[-.020,y,-s*(w-.06)/2]));
      articulations.push(rec); parts[rec.id] = rec.pivot;
      // Older Swedish H: one driver monitor and two navigator monitors
      // (radar/chart), documented in SHK RM2008:02 p12. Screens remain inactive.
      const layouts=s>0?[{z:.83,w:.78,name:'plotterS'}]:[
        {z:-1.07,w:.38,name:'plotterP'},{z:-.63,w:.38,name:'plotterP2'}];
      for(const layout of layouts) {
        const dw=layout.w,screenW=dw-.09;
        interior.add(U.cyl(.019,.019,.17,aluminum,12,[displayX+.05,2.12,layout.z]));
        interior.add(U.box(.19,.016,Math.min(.22,dw-.03),dark,[displayX+.05,2.045,layout.z]));
        const display=instrumentFrame(displayX,2.215,layout.z);
        display.name=layout.name;interior.add(display);
        display.add(roundedBox(dw,.36,.073,.014,rubber,[0,0,0]));
        const faceGlass=new THREE.MeshPhysicalMaterial({color:0x041011,roughness:.19,metalness:.22,clearcoat:1});
        display.add(roundedBox(screenW,.262,.008,.002,faceGlass,[-.014,.012,.042]));
        const sheen=new THREE.Mesh(new THREE.PlaneGeometry(screenW-.003,.259),canvasMaterial((ctx,w,h)=>{
          const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#7caaaa22');grad.addColorStop(.48,'#26423c08');grad.addColorStop(1,'#07121100');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
        },512,256,0));sheen.position.set(-.014,.012,.047);display.add(sheen);
        label('NAVIGATION',Math.min(.26,dw-.08),.017,display,[-.02,-.154,.041],'#8d9c92');
        const bx=dw/2-.027;
        for(let i=0;i<4;i++)display.add(U.cyl(.009,.009,.010,panelPaint,16,[bx,.105-i*.055,.043],'z'));
        display.add(U.cyl(.016,.016,.016,aluminum,20,[bx,-.120,.045],'z'));
        display.add(U.cyl(.003,.003,.002,amber,8,[bx-.045,-.153,.044],'z'));
        screws(display,dw,.36,.040);parts[layout.name]=display;
      }
      if(s<0) {
        const keyboard=new THREE.Group();keyboard.name='navigatorKeyboard';interior.add(keyboard);parts.navigatorKeyboard=keyboard;
        keyboard.add(roundedBox(.18,.025,.46,.008,rubber,[10.25,2.058,-.90]));
        for(let row=0;row<5;row++)for(let col=0;col<13;col++) {
          if(row===4&&col>2&&col<10)continue;
          keyboard.add(U.box(.022,.008,.024,panelPaint,[10.19+row*.027,2.076,-1.086+col*.031]));
        }
        keyboard.add(U.box(.022,.008,.22,panelPaint,[10.298,2.076,-.90]));
      }
    });

    // The central bridge houses genuine three-dimensional engine instruments above the passage.
    const bridge = instrumentFrame(displayX, 2.185, 0); interior.add(bridge);
    bridge.add(roundedBox(0.77, 0.235, 0.09, 0.016, panelPaint, [0, 0, 0]));
    const dialMat = canvasMaterial((ctx, w, h) => {
      const r = w * 0.46; ctx.fillStyle = '#111b18'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#c6d2c2'; ctx.lineWidth = 3; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '22px Arial';
      for (let i = 0; i <= 30; i++) {
        const a = Math.PI * (0.78 + 1.44 * i / 30), a0 = r * (i % 5 ? 0.88 : 0.79);
        ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * a0, h / 2 + Math.sin(a) * a0); ctx.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); ctx.stroke();
        if (!(i % 5)) ctx.fillStyle = '#b8cabc', ctx.fillText(String(i / 10), w / 2 + Math.cos(a) * r * 0.60, h / 2 + Math.sin(a) * r * 0.60);
      }
      ctx.fillStyle = '#92a69a'; ctx.font = '18px Arial'; ctx.fillText('RPM × 1000', w / 2, h * 0.74);
    }, 256, 256, 0x29392f);
    [-0.22, 0.22].forEach((x, i) => {
      bridge.add(U.cyl(0.080, 0.080, 0.014, aluminum, 40, [x, 0, 0.057], 'z'));
      bridge.add(U.cyl(0.074, 0.074, 0.016, rubber, 40, [x, 0, 0.061], 'z'));
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.069, 40), dialMat); face.position.set(x, 0, 0.072); bridge.add(face);
      const needle = new THREE.Group(); needle.position.set(x, 0, 0.075); bridge.add(needle);
      needle.add(U.box(0.003, 0.053, 0.002, amber, [0, 0.022, 0])); needle.add(U.cyl(0.007, 0.007, 0.004, dark, 12, [0, 0, 0], 'z'));
      needle.rotation.z = 2.2; engineNeedles.push(needle);
      label(i ? 'STYRBORD' : 'BABORD', 0.17, 0.018, bridge, [x, -0.098, 0.058]);
    });
    for (let i = 0; i < 3; i++) bridge.add(U.cyl(0.007, 0.007, 0.006, i === 2 ? amber : green, 12, [0, 0.055 - i * 0.052, 0.055], 'z'));
    screws(bridge, 0.77, 0.235, 0.05);

    // Switch banks: each toggle, rocker, rotary control and indicator is geometry.
    [-1, 1].forEach(s => {
      const bank = instrumentFrame(10.395 + bodyShift, 1.94, s * 0.91); interior.add(bank);
      bank.add(roundedBox(0.68, 0.22, 0.028, 0.008, dark, [0, 0, 0]));
      label(s > 0 ? 'MANÖVER / STYRSYSTEM' : 'BELYSNING / LÄNSPUMP', 0.48, 0.023, bank, [0, 0.080, 0.020]);
      const labels = s > 0 ? ['PUMP', 'JET', 'LARM', 'AUTO', 'START'] : ['DÄCK', 'HYTT', 'NAV', 'LÄNS', 'RES'];
      for (let i = 0; i < 5; i++) {
        const x = -0.26 + i * 0.13;
        bank.add(U.cyl(0.018, 0.018, 0.011, aluminum, 16, [x, -0.008, 0.023], 'z'));
        bank.add(U.bar(V3(x, -0.008, 0.024), V3(x, 0.014, 0.047), 0.006, aluminum));
        bank.add(U.cyl(0.003, 0.003, 0.003, i === 3 ? amber : green, 8, [x + 0.036, 0.034, 0.022], 'z'));
        label(labels[i], 0.10, 0.020, bank, [x, -0.069, 0.021]);
      }
      screws(bank, 0.68, 0.22, 0.019);
    });

    // Helm: the mount carries the rake; the child wheel turns around its local X axis.
    const helmMount = new THREE.Group(); helmMount.position.set(wheelX, 2.105, 0.77); helmMount.rotation.z = -0.19; interior.add(helmMount);
    const wheel = new THREE.Group(); wheel.name = 'helmWheel'; wheel.userData.control = 'helm'; helmMount.add(wheel); parts.helmWheel = wheel;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.019, 12, 64), rubber); rim.rotation.y = PI / 2; wheel.add(rim);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.177, 0.006, 8, 64), aluminum); innerRim.rotation.y = PI / 2; wheel.add(innerRim);
    for (let i = 0; i < 3; i++) {
      const a = i * 2 * PI / 3 + PI / 2;
      wheel.add(U.bar(V3(-0.01, 0.025 * Math.cos(a), 0.025 * Math.sin(a)), V3(0, 0.179 * Math.cos(a), 0.179 * Math.sin(a)), 0.011, aluminum));
      wheel.add(U.bar(V3(-0.013, 0.044 * Math.cos(a), 0.044 * Math.sin(a)), V3(-0.002, 0.146 * Math.cos(a), 0.146 * Math.sin(a)), 0.004, panelPaint));
    }
    wheel.add(U.cyl(0.052, 0.052, 0.054, aluminum, 32, [-0.01, 0, 0], 'x'));
    wheel.add(U.cyl(0.039, 0.039, 0.008, rubber, 32, [-0.041, 0, 0], 'x'));
    wheel.add(U.box(0.007, 0.016, 0.005, stitching, [-0.048, 0.023, 0]));
    // A spinner knob makes both the control and its rotation readable in first person.
    wheel.add(U.cyl(0.014, 0.014, 0.04, aluminum, 14, [-0.030, 0.115, 0.155], 'x'));
    wheel.add(sphere(0.025, V3(-0.060, 0.115, 0.155), rubber));
    helmMount.add(U.cyl(0.036, 0.045, 0.30, aluminum, 20, [0.16, 0, 0], 'x'));
    helmMount.add(U.cyl(0.057, 0.060, 0.07, rubber, 20, [0.29, 0, 0], 'x'));
    wheel.traverse(o => { o.userData.control = 'helm'; });

    // Independent port / starboard throttle quadrants, with a detent scale and rubber grips.
    const throttleBase = new THREE.Group(); throttleBase.position.set(wheelX, 1.855, 1.13); interior.add(throttleBase);
    throttleBase.add(roundedBox(0.32, 0.095, 0.25, 0.023, dark, [0, 0, 0]));
    throttleBase.add(U.box(0.27, 0.04, 0.19, aluminum, [0, -0.055, 0.15]));
    throttleBase.add(U.box(0.27, 0.20, 0.026, panelPaint, [0, -0.135, 0.225]));
    [-0.060, 0.060].forEach((z, i) => {
      throttleBase.add(U.box(0.25, 0.005, 0.018, rubber, [0, 0.051, z]));
      for (let j = -3; j <= 3; j++) throttleBase.add(U.box(0.003, 0.004, j === 0 ? 0.025 : 0.013, j === 0 ? amber : aluminum, [j * 0.035, 0.053, z + 0.023]));
      const lever = new THREE.Group(); lever.name = i ? 'throttleS' : 'throttleP'; lever.userData.control = lever.name; lever.position.set(0, 0.035, z); throttleBase.add(lever);
      lever.add(U.cyl(0.012, 0.012, 0.22, aluminum, 16, [0, 0.12, 0]));
      lever.add(roundedBox(0.081, 0.07, 0.048, 0.012, rubber, [0, 0.26, 0]));
      lever.add(U.box(0.055, 0.008, 0.025, i ? green : red, [0, 0.296, 0]));
      lever.add(U.cyl(0.025, 0.025, 0.035, aluminum, 16, [0, 0, 0], 'z'));
      lever.traverse(o => { o.userData.control = lever.name; });
      parts[lever.name] = lever;
    });
    const quadrantLabel = frameAt(V3(wheelX - 0.166, 1.855, 1.13), V3(0, 0, 1), V3(0, 1, 0)); interior.add(quadrantLabel);
    label('P  /  S', 0.14, 0.033, quadrantLabel, [0, 0, 0.003]);
    // Separate bucket handles are visible beside the engine throttle pair.
    // The simplified driving controls keep them coupled to the signed command;
    // the handles themselves follow each waterjet's commanded bucket position.
    const bucketBase=new THREE.Group();bucketBase.name='bucketControlBase';bucketBase.position.set(10.18,2.09,.95);bucketBase.scale.set(.8,1,.5);interior.add(bucketBase);
    bucketBase.add(roundedBox(.22,.07,.24,.015,panelPaint,[0,0,0]));
    bucketBase.add(U.box(.18,.015,.19,dark,[0,-.0425,0]));
    for(const [i,z]of [-.06,.06].entries()) {
      bucketBase.add(U.box(.18,.005,.025,rubber,[0,.037,z]));
      const lever=new THREE.Group();lever.name=i?'bucketHandleS':'bucketHandleP';lever.position.set(0,.025,z);lever.scale.y=.75;bucketBase.add(lever);
      lever.add(U.cyl(.009,.009,.13,aluminum,12,[0,.065,0]));
      lever.add(U.cyl(.023,.023,.06,rubber,16,[0,.14,0],'z'));
      parts[lever.name]=lever;
    }
    // Steering-angle indication is explicitly listed among the old H controls.
    const rudder=instrumentFrame(wheelX+.24,2.285,1.11);rudder.name='rudderIndicator';interior.add(rudder);parts.rudderIndicator=rudder;
    rudder.add(U.cyl(.056,.056,.024,aluminum,32,[0,0,0],'z'));
    rudder.add(U.cyl(.050,.050,.026,rubber,32,[0,0,.004],'z'));
    for(let i=-3;i<=3;i++) {
      const a=i*PI/9;
      rudder.add(U.bar(V3(Math.sin(a)*.035,Math.cos(a)*.035,.02),V3(Math.sin(a)*.043,Math.cos(a)*.043,.02),.0015,white));
    }
    const needle=new THREE.Group();needle.position.z=.024;rudder.add(needle);parts.rudderNeedle=needle;
    needle.add(U.box(.0025,.036,.002,amber,[0,.016,0]));needle.add(U.cyl(.005,.005,.004,aluminum,12,[0,0,0],'z'));
    label('RODER',.060,.012,rudder,[0,-.025,.021]);
    interior.add(U.bar(V3(wheelX+.24,2.05,1.11),V3(wheelX+.24,2.235,1.11),.012,aluminum));

    // Guarded stop switch and the smaller backup steering joystick.
    interior.add(U.cyl(0.037, 0.037, 0.016, safety, 24, [M.WH_DASH_TOP_X - 0.26, 2.050, 1.20]));
    interior.add(U.cyl(0.022, 0.022, 0.033, red, 20, [M.WH_DASH_TOP_X - 0.26, 2.072, 1.20]));
    interior.add(U.cyl(0.034, 0.034, 0.027, rubber, 20, [M.WH_DASH_TOP_X - 0.26, 2.040, 0.48]));
    interior.add(U.cyl(0.009, 0.009, 0.08, aluminum, 12, [M.WH_DASH_TOP_X - 0.26, 2.09, 0.48]));
    interior.add(sphere(0.017, V3(M.WH_DASH_TOP_X - 0.26, 2.14, 0.48), rubber));

    // VHF radio with handset, coiled cable, speaker grille and labeled overhead circuit panel.
    const radio = instrumentFrame(wheelX + 0.02, 1.74, -1.13); interior.add(radio);
    radio.add(roundedBox(0.37, 0.15, 0.10, 0.014, rubber, [0, 0, 0]));
    radio.add(U.box(0.17, 0.05, 0.008, screenMat, [-0.043, 0.019, 0.058]));
    label('VHF', 0.09, 0.019, radio, [-0.035, -0.043, 0.055]);
    for (let i = 0; i < 2; i++) radio.add(U.cyl(0.017, 0.017, 0.025, aluminum, 20, [0.123, 0.035 - i * 0.075, 0.06], 'z'));
    radio.add(roundedBox(0.067, 0.15, 0.041, 0.013, rubber, [-0.244, 0, 0.01]));
    for (let i = 0; i < 5; i++) radio.add(U.box(0.037, 0.003, 0.002, aluminum, [-0.244, 0.035 - i * 0.015, 0.033]));
    const coilPts = [];
    for (let i = 0; i < 100; i++) { const t = i / 99; coilPts.push(V3(wheelX + 0.03 + 0.018 * Math.cos(t * PI * 32), 1.65 - t * 0.34, -1.30 + 0.018 * Math.sin(t * PI * 32))); }
    interior.add(U.tube(coilPts, 0.004, rubber, 160));
    const overhead = frameAt(V3(M.WH_WS_TOP_X - 0.28, 2.825, 0), V3(0, 0, 1), V3(0.32, 0.95, 0)); interior.add(overhead);
    overhead.add(roundedBox(1.0, 0.14, 0.06, 0.012, consoleTop, [0, 0, 0]));
    for (let i = 0; i < 10; i++) {
      const x = -0.425 + i * 0.094;
      overhead.add(U.box(0.043, 0.055, 0.015, panelPaint, [x, 0.008, 0.038]));
      overhead.add(U.box(0.019, 0.009, 0.003, i % 4 ? green : amber, [x, 0.015, 0.048]));
      label(String(i + 1).padStart(2, '0'), 0.040, 0.019, overhead, [x, -0.046, 0.037]);
    }
    screws(overhead, 1.0, 0.14, 0.036);
    // Roof-suspended magnetic compass, above the driver; common Swedish H
    // instrument, confirmed by SHK 2026:02. Card dimensions are reconstructed.
    const compass=new THREE.Group();compass.name='magneticCompass';parts.magneticCompass=compass;interior.add(compass);
    const cx=10.53,cz=.78;
    compass.add(U.box(.19,.025,.17,consoleTop,[cx,2.9275,cz]));
    compass.add(U.cyl(.015,.015,.10,aluminum,12,[cx,2.865,cz]));
    compass.add(U.cyl(.095,.085,.085,rubber,32,[cx,2.785,cz],'x'));
    const compassDial=canvasMaterial((ctx,w,h)=>{
      ctx.fillStyle='#121d17';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#d9dec6';ctx.fillStyle='#d9dec6';ctx.textAlign='center';ctx.textBaseline='middle';
      for(let i=0;i<36;i++) {
        const a=i/36*PI*2,rr=w*.43,inner=rr*(i%3?.90:.78);ctx.lineWidth=i%3?2:3;ctx.beginPath();ctx.moveTo(w/2+Math.sin(a)*inner,h/2-Math.cos(a)*inner);ctx.lineTo(w/2+Math.sin(a)*rr,h/2-Math.cos(a)*rr);ctx.stroke();
      }
      ctx.font='bold 34px Arial';for(const [t,a]of [['N',0],['E',PI/2],['S',PI],['W',PI*1.5]])ctx.fillText(t,w/2+Math.sin(a)*w*.28,h/2-Math.cos(a)*h*.28);
      ctx.fillStyle='#d7a175';ctx.fillRect(w*.49,h*.04,w*.02,h*.17);
    },256,256,0x172318);
    const card=new THREE.Mesh(new THREE.CircleGeometry(.079,40),compassDial);card.rotation.y=-PI/2;card.position.set(cx-.045,2.785,cz);compass.add(card);

    const idPlate = frameAt(V3(8.688, 2.585, 0), V3(0, 0, -1), V3(0, 1, 0)); interior.add(idPlate);
    idPlate.add(U.box(0.76, 0.15, 0.007, dark, [0, 0, 0]));
    label('STRIDSBÅT 90 H  /  ' + M.HULL_NUMBER, 0.70, 0.037, idPlate, [0, 0.025, 0.005]);
    label('STYRHYTT  ·  TVÅ VATTENJET', 0.68, 0.023, idPlate, [0, -0.035, 0.005], '#899e91');
    screws(idPlate, 0.76, 0.15, 0.007, brass);

    // Roof lining is built around the actual hatch apertures, never across them.
    [-1, 1].forEach(s => {
      interior.add(U.box(1.98, 0.017, 0.09, enamel, [9.65, 2.924, s * 1.165]));
      interior.add(U.box(1.99, 0.024, 0.035, aluminum, [9.65, 2.915, s * 0.38]));
      interior.add(U.box(0.66, 0.025, 0.07, dark, [9.08, 2.91, s * 0.91]));
      const diffuserMat = U.mat(0xf0ecd1, { roughness: 0.35, emissive: 0x86754f });
      interior.add(roundedBox(0.60, 0.018, 0.045, 0.005, diffuserMat, [9.08, 2.893, s * 0.91]));
      const light = new THREE.PointLight(0xffead1, 0.24, 3.2, 2); light.position.set(9.40, 2.75, s * 0.74); interior.add(light); interiorLights.push(light);
      // Flexible ventilation tubes and two visible circular adjustable eyeball vents.
      interior.add(U.tube([V3(8.77, 2.73, s * 1.17), V3(9.05, 2.73, s * 1.17), V3(9.24, 2.73, s * 1.16)], 0.029, dark, 16));
      interior.add(U.cyl(0.055, 0.055, 0.03, aluminum, 24, [9.26, 2.73, s * 1.155], 'x'));
      interior.add(U.cyl(0.043, 0.043, 0.037, rubber, 24, [9.26, 2.73, s * 1.155], 'x'));
      for (let i = -2; i <= 2; i++) interior.add(U.box(0.008, 0.005, 0.07, aluminum, [9.238, 2.73 + i * 0.012, s * 1.155]));
      // Vertical cable trunk, clamps and cabin grab handle next to the companionway.
      interior.add(U.box(0.042, 1.63, 0.064, panelPaint, [8.72, 1.80, s * 1.26]));
      [1.12, 1.75, 2.40].forEach(y => interior.add(U.box(0.053, 0.020, 0.076, aluminum, [8.72, y, s * 1.26])));
      interior.add(U.bar(V3(8.74, 1.57, s * 0.51), V3(8.74, 2.14, s * 0.51), 0.021, aluminum));
      [1.57, 2.14].forEach(y => interior.add(U.bar(V3(8.74, y, s * 0.51), V3(8.68, y, s * 0.51), 0.017, aluminum)));
    });
    // Polished screw heads are instanced to keep the close-detail pass inexpensive.
    const fasteners = new THREE.InstancedMesh(new THREE.SphereGeometry(0.006, 8, 4), aluminum, screwPoints.length);
    fasteners.frustumCulled = false;
    const matrix = new THREE.Matrix4(); screwPoints.forEach((p, i) => { matrix.makeTranslation(...p); fasteners.setMatrixAt(i, matrix); }); interior.add(fasteners);
  }

  // ================= LOW STARBOARD TWIN INSTALLATION (845 REFERENCE) =================
  // The drawing shows two closely spaced, plain heavy barrels in one deck mounting, beside
  // the bow passage. It does not have the old model's raised centreline well or flared muzzles.
  const twinMount = sub('twinGunMount');
  {
    const W = M.TWIN_MG, deckY = U.deckYAt(W.x, W.z), gap = W.spacing || 0.115;
    const steel = U.mat(0x34464a, { roughness: 0.50, metalness: 0.68 });
    const barrelSteel = U.mat(0x253338, { roughness: 0.40, metalness: 0.78 });
    const beltBrass = U.mat(0xa59359, { roughness: 0.46, metalness: 0.74 });
    const gunRubber = U.mat(0x131919, { roughness: 0.92, metalness: 0.03 });
    const boltSteel = U.mat(0x728282, { roughness: 0.37, metalness: 0.80 });
    const base = new THREE.Group(); base.position.set(W.x, deckY, W.z); base.name = 'starboardTwinDeckBase'; twinMount.add(base); parts.twinMgBase = base;
    base.add(U.box(0.59, 0.025, 0.54, steel, [-0.07, 0.017, 0]));
    for (const x of [-0.29, 0.15]) for (const z of [-0.22, 0.22]) base.add(U.cyl(0.014, 0.014, 0.009, boltSteel, 6, [x, 0.034, z]));
    base.add(U.cyl(0.070, 0.095, 0.11, steel, 20, [0, 0.08, 0]));
    const pedestalH = Math.max(0.06, W.y - deckY - 0.15);
    base.add(U.cyl(0.052, 0.066, pedestalH, barrelSteel, 20, [0, 0.135 + pedestalH / 2, 0]));
    // Compact yoke supports the trunnions; the complete paired receiver / barrel / feed assembly tilts together.
    for (const side of [-1, 1]) {
      const yoke = plate([[-0.16, -0.015], [0.15, -0.015], [0.10, 0.17], [-0.11, 0.17]], null, 0.023, -0.0115, steel);
      yoke.position.set(W.x, W.y - 0.16, W.z + side * 0.225); twinMount.add(yoke);
      twinMount.add(U.cyl(0.035, 0.035, 0.041, boltSteel, 16, [W.x, W.y, W.z + side * 0.235], 'z'));
    }
    const rec = U.hinge({ id: 'elev_twinMg', label: 'Dubbelkulspruta 12,7 mm (elevation)', kind: 'elev', parent: twinMount,
      pivot: [W.x, W.y, W.z], axis: 'z', closed: W.elevMin, open: W.elevMax, speed: 1.5 });
    const p = rec.pivot; p.name = 'starboardTwinGunElevation'; parts.twinMg = p;
    p.add(U.cyl(0.027, 0.027, 0.48, barrelSteel, 20, [0, 0, 0], 'z'));
    p.add(U.box(0.35, 0.032, 0.41, steel, [-0.09, -0.055, 0]));
    const circle = (x, y, radius) => Array.from({ length: 16 }, (_, i) => [x + Math.cos(i * Math.PI / 8) * radius, y + Math.sin(i * Math.PI / 8) * radius]);
    [-1, 1].forEach(side => {
      const z = side * gap;
      const receiver = U.box(0.53, 0.112, 0.098, steel, [-0.07, 0.036, z]); receiver.name = side > 0 ? 'twinReceiverS' : 'twinReceiverP'; p.add(receiver);
      p.add(U.box(0.40, 0.017, 0.105, barrelSteel, [-0.085, 0.102, z]));  // hinged top cover
      p.add(U.box(0.032, 0.019, 0.111, boltSteel, [-0.247, 0.106, z]));
      p.add(U.box(0.11, 0.023, 0.117, barrelSteel, [0.145, 0.055, z]));
      p.add(U.cyl(0.026, 0.034, 0.075, barrelSteel, 20, [0.23, 0.033, z], 'x'));
      // Perforated rectangular cooling shroud: real circular apertures in both thin side plates.
      const holes = [0, 1, 2, 3, 4].map(i => circle(0.31 + i * 0.064, 0.035, 0.017));
      for (const flank of [-1, 1]) {
        const sidePlate = plate(rect(0.27, -0.006, 0.62, 0.076), holes, 0.004, -0.002, steel);
        sidePlate.position.z = z + flank * 0.036; p.add(sidePlate);
      }
      p.add(U.box(0.35, 0.006, 0.075, steel, [0.445, 0.079, z]));
      p.add(U.box(0.35, 0.006, 0.075, steel, [0.445, -0.009, z]));
      p.add(U.cyl(0.024, 0.024, 0.028, boltSteel, 20, [0.632, 0.033, z], 'x'));
      const barrel = U.cyl(0.014, 0.019, W.barrelL || 1.1, barrelSteel, 24, [0.28 + (W.barrelL || 1.1) / 2, 0.033, z], 'x');
      barrel.name = side > 0 ? 'twinBarrelS' : 'twinBarrelP'; p.add(barrel);
      const muzzleX = 0.28 + (W.barrelL || 1.1);
      p.add(U.cyl(0.0158, 0.0158, 0.024, barrelSteel, 20, [muzzleX, 0.033, z], 'x'));
      p.add(U.cyl(0.008, 0.008, 0.002, gunRubber, 16, [muzzleX + 0.013, 0.033, z], 'x'));
      // Low blade front sight and rear sight, with the operating handle on the outside receiver wall.
      p.add(U.box(0.025, 0.040, 0.012, barrelSteel, [0.705, 0.062, z]));
      p.add(U.box(0.045, 0.018, 0.031, barrelSteel, [-0.202, 0.122, z]));
      p.add(U.cyl(0.009, 0.009, 0.065, boltSteel, 10, [-0.13, 0.053, z + side * 0.068], 'z'));
      p.add(U.cyl(0.015, 0.015, 0.054, gunRubber, 12, [-0.13, 0.049, z + side * 0.102], 'y'));
      p.add(U.box(0.032, 0.089, 0.119, barrelSteel, [-0.350, 0.025, z]));
      // Paired aft handgrips and charging linkage have the characteristic small, open outline.
      p.add(U.bar(V3(-0.37, 0.05, z - 0.039), V3(-0.414, 0.05, z - 0.060), 0.007, steel));
      p.add(U.bar(V3(-0.37, 0.05, z + 0.039), V3(-0.414, 0.05, z + 0.060), 0.007, steel));
      for (const dz of [-0.061, 0.061]) p.add(U.cyl(0.010, 0.010, 0.07, gunRubber, 12, [-0.414, 0.02, z + dz]));
      for (let i = 0; i < 5; i++) p.add(U.cyl(0.0045, 0.0045, 0.003, boltSteel, 8, [-0.26 + i * 0.095, 0.011, z + side * 0.0505], 'z'));
      // Ammunition containers and short exposed feeds sit below/outboard of the breeches.
      const az = z + side * 0.168;
      p.add(U.box(0.28, 0.155, 0.17, ammo, [-0.07, -0.135, az]));
      p.add(U.box(0.29, 0.014, 0.183, steel, [-0.07, -0.051, az]));
      p.add(U.box(0.16, 0.018, 0.025, barrelSteel, [-0.07, -0.054, az]));
      for (let i = 0; i < 6; i++) {
        const bz = z + side * (0.06 + i * 0.024), by = 0.059 - Math.pow(i / 5, 2) * 0.10;
        p.add(U.cyl(0.008, 0.008, 0.083, beltBrass, 10, [-0.06, by, bz], 'x'));
        p.add(U.box(0.012, 0.003, 0.025, barrelSteel, [-0.083, by + 0.008, bz]));
      }
    });
    articulations.push(rec);
    U.setArticulation(rec, (0 - W.elevMin) / (W.elevMax - W.elevMin));
  }

  // User's 925 foredeck photo: a broad, faceted cover replaces the complete
  // starboard weapon installation. Geometry uses hull coordinates for the paint.
  const foredeckCover=sub('foredeckCover');
  {
    // The outer edge follows the narrowing bow; the old rectangular footprint
    // projected 11 cm through the side. Leave a painted margin at the gunwale.
    const rows=[{x:11.28,h:.36},{x:11.58,h:.39},{x:12.66,h:.12}].map(a=>{
      const zi=.64,zo=Math.min(1.48,U.stationAt(a.x).deckZ-.16),y=U.deckYAt(a.x,(zi+zo)/2);
      return {...a,zi,zo,y};
    });
    const sections=rows.map(a=>[
      V3(a.x,a.y+.015,a.zi),V3(a.x,a.y+.015,a.zo),
      V3(a.x,a.y+.07,a.zo),V3(a.x,a.y+a.h,a.zo-.10),
      V3(a.x,a.y+a.h,a.zi+.09),V3(a.x,a.y+.07,a.zi),V3(a.x,a.y+.015,a.zi)
    ]);
    const coverGeometry=U.loft(sections,{capStart:true,capEnd:true}).toNonIndexed();
    coverGeometry.computeVertexNormals();
    const cover=U.camoMesh(coverGeometry);cover.name='foredeckCoverShell';foredeckCover.add(cover);
    for(const key of ['zi','zo'])for(let i=1;i<rows.length;i++) {
      const a=rows[i-1],b=rows[i];
      foredeckCover.add(U.bar(V3(a.x,a.y+.014,a[key]),V3(b.x,b.y+.014,b[key]),.007,dark));
    }
    const front=rows[rows.length-1];
    for(const z of [front.zi+.12,front.zo-.12]) {
      foredeckCover.add(U.box(.025,.07,.045,metal,[front.x+.012,front.y+.05,z]));
      foredeckCover.add(U.cyl(.007,.007,.008,metal,8,[front.x+.029,front.y+.065,z],'x'));
    }
  }
  function setForedeckGun(on) {
    twinMount.visible=!!on;foredeckCover.visible=!on;
  }
  setForedeckGun(false);

  // Keep glazing, interior, dashboard and controls aligned as one cabin.
  // Foredeck cover/weapon retain their own deck coordinates.
  const cabinEnvelope=new THREE.Group();cabinEnvelope.name='cabinEnvelope';
  for(const child of [...group.children]) if(child!==twinMount&&child!==foredeckCover)cabinEnvelope.add(child);
  cabinEnvelope.scale.z=M.WH_WIDTH_SCALE;group.add(cabinEnvelope);parts.cabinEnvelope=cabinEnvelope;
  parts.cabinBounds.z0*=M.WH_WIDTH_SCALE;parts.cabinBounds.z1*=M.WH_WIDTH_SCALE;

  U.shadowed(group);
  wallGlass.forEach((p) => { p.castShadow = false; });
  parts.windscreenGlass.castShadow = false;

  // ---------- API ----------
  function setCutaway(on) {
    camoMat.transparent = !!on || false;
    camoMat.opacity = on ? 0.25 : 1;
    camoMat.depthWrite = !on;
    camoMat.needsUpdate = true;
  }
  function update(dt, state, t) {
    state = state || {};
    // Physical controls follow the two signed propulsion commands without being tied to plotters.
    const p = U.clamp(state.engineP != null ? state.engineP : (state.throttle || 0), -1, 1);
    const s = U.clamp(state.engineS != null ? state.engineS : (state.throttle || 0), -1, 1);
    // Viewed from the helm seat (+X forward), positive X rotation turns clockwise toward starboard.
    parts.helmWheel.rotation.x = U.deg((state.helm || 0) * 4.5);
    parts.throttleP.rotation.z = -p * 0.66;
    parts.throttleS.rotation.z = -s * 0.66;
    parts.bucketHandleP.rotation.z=(U.clamp(state.bucketP==null?(p>0?0:p<0?1:.7):state.bucketP,0,1)-.5)*1.0;
    parts.bucketHandleS.rotation.z=(U.clamp(state.bucketS==null?(s>0?0:s<0?1:.7):state.bucketS,0,1)-.5)*1.0;
    parts.rudderNeedle.rotation.z=-U.deg((state.helm||0)*2);
    engineNeedles.forEach((needle, i) => { needle.rotation.z = 2.2 - (0.15 + Math.abs(i ? s : p) * 0.79) * 4.4; });
  }

  return { group: group, parts: parts, articulations: articulations, update: update, setForedeckGun, setCutaway: setCutaway };
};
