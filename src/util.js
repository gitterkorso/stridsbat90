// Stridsbåt 90 – shared helpers. Plain script; requires THREE (r128 UMD) and constants.js loaded first.
// Every module uses these so that materials, hinges and lofts behave identically.
window.CB90 = window.CB90 || {};
(function () {
  const U = {};
  CB90.util = U;

  // ---------- maths ----------
  U.deg = (d) => d * Math.PI / 180;
  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.ease = (t) => { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); }; // smoothstep
  U.moveTowards = (v, target, maxDelta) => (Math.abs(target - v) <= maxDelta ? target : v + Math.sign(target - v) * maxDelta);

  // ---------- materials (cached by key) ----------
  const matCache = new Map();
  /** U.mat(hex, opts) -> MeshStandardMaterial. opts: {roughness, metalness, transparent, opacity, side, flat, emissive, name} */
  U.mat = function (hex, opts) {
    opts = opts || {};
    const key = JSON.stringify([hex, opts]);
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: opts.roughness != null ? opts.roughness : 0.75,
      metalness: opts.metalness != null ? opts.metalness : 0.1,
      transparent: !!opts.transparent || (opts.opacity != null && opts.opacity < 1),
      opacity: opts.opacity != null ? opts.opacity : 1,
      side: opts.side != null ? opts.side : THREE.FrontSide,
      flatShading: !!opts.flat,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
    });
    if (opts.name) m.name = opts.name;
    matCache.set(key, m);
    return m;
  };
  U.glass = () => U.mat(CB90.COLORS.GLASS, { roughness: 0.15, metalness: 0.6, opacity: 0.78, side: THREE.DoubleSide, name: 'glass' });
  U.metal = () => U.mat(CB90.COLORS.METAL, { roughness: 0.45, metalness: 0.7 });
  U.darkMetal = () => U.mat(CB90.COLORS.DARK_METAL, { roughness: 0.5, metalness: 0.6 });
  U.deck = () => {
    const m = U.mat(0x45483c, { roughness: 0.93, metalness: 0.13 });
    if (!m.bumpMap && typeof document !== 'undefined') {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const ctx = c.getContext('2d'), d = ctx.createImageData(128,128);
      let seed = 8571;
      for(let i=0;i<d.data.length;i+=4) { seed=(seed*16807)%2147483647; const n=110+seed%70; d.data[i]=d.data[i+1]=d.data[i+2]=n;d.data[i+3]=255; }
      ctx.putImageData(d,0,0); const t = new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);
      m.bumpMap=t;m.bumpScale=.018;
    }
    return m;
  };
  U.rubber = () => U.mat(CB90.COLORS.RUBBER, { roughness: 1.0, metalness: 0.0 });
  U.jetAlu = () => U.mat(CB90.COLORS.JET_ALU, { roughness: 0.4, metalness: 0.75 });
  U.jetSteel = () => U.mat(CB90.COLORS.JET_STEEL, { roughness: 0.3, metalness: 0.9 });
  U.hydraulic = () => U.mat(CB90.COLORS.HYDRAULIC, { roughness: 0.4, metalness: 0.6 });

  /** Splinter camouflage: returns one of CB90.COLORS.CAMO by hull position (hard-edged angular fields, symmetric port/starboard). */
  const camoCols = null;
  U.camoIndex = function (x, y, z) {
    const s = z < 0 ? -1 : 1;
    const a = Math.floor((x * 0.85 + y * 1.9 + s * 0.6) / 2.6);
    const b = Math.floor((x * 0.45 - y * 1.5 + 6.0) / 2.3);
    const c = Math.floor((x * 1.15 + y * 0.4) / 4.1);
    return ((a * 2 + b * 5 + c * 7) % 3 + 3) % 3;
  };
  U.camoColor = function (x, y, z) {
    return new THREE.Color(CB90.COLORS.CAMO[U.camoIndex(x, y, z)]);
  };
  // A continuous, hand-drawn splinter pattern in hull coordinates. Polygon edges do not depend on mesh triangles.
  let camoTexture;
  function getCamoTexture() {
    if (camoTexture || typeof document === 'undefined') return camoTexture;
    const c=document.createElement('canvas');c.width=2048;c.height=768;
    const x=c.getContext('2d');x.fillStyle='#606657';x.fillRect(0,0,c.width,c.height);
    const patches=[
      ['#343b30',[0,0,285,0,480,250,292,400,65,245]],
      ['#252b28',[240,0,568,0,512,230,420,340]],
      ['#858a7f',[600,0,840,0,920,186,720,306,530,180]],
      ['#343e31',[950,0,1180,0,1360,190,1040,430,900,195]],
      ['#232c27',[1260,0,1510,0,1620,330,1420,230]],
      ['#81867c',[1690,0,1930,0,2048,120,1860,260]],
      ['#2e382d',[0,335,188,228,460,550,380,760,0,620]],
      ['#898c80',[110,390,278,305,445,477,530,715,310,585]],
      ['#262e28',[490,264,634,343,846,742,622,620,560,450]],
      ['#787d72',[770,300,1000,180,1140,418,980,740,860,585]],
      ['#303a2f',[1110,369,1290,300,1495,606,1440,768,1220,652]],
      ['#82867b',[1430,310,1660,275,1840,576,1580,523]],
      ['#26312a',[1790,335,1960,205,2048,390,2048,750,1860,682]],
      ['#85897d',[20,730,235,605,340,768]],
      ['#313b30',[882,646,970,560,1110,768,920,768]]
    ];
    for(const [color,p] of patches) {x.fillStyle=color;x.beginPath();x.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)x.lineTo(p[i],p[i+1]);x.closePath();x.fill();}
    // Restrained paint grain rather than noisy geometry coloration.
    let seed=512; const d=x.getImageData(0,0,c.width,c.height);
    for(let i=0;i<d.data.length;i+=4){seed=(seed*16807)%2147483647;const n=(seed%9)-4;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}
    x.putImageData(d,0,0);
    camoTexture=new THREE.CanvasTexture(c);camoTexture.encoding=THREE.sRGBEncoding;camoTexture.wrapS=camoTexture.wrapT=THREE.RepeatWrapping;camoTexture.anisotropy=8;
    return camoTexture;
  }
  U.camoMaterial = function(opts) {
    const m=U.mat(0xffffff,Object.assign({roughness:0.84,metalness:0.12,name:'camo'},opts||{}));
    m.map=getCamoTexture();
    m.onBeforeCompile=(shader)=>{
      shader.vertexShader='attribute float hullHeight; varying float vHullHeight;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHullHeight=hullHeight;');
      shader.fragmentShader='varying float vHullHeight;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(vHullHeight<0.10) diffuseColor.rgb=vec3(0.027,0.034,0.031);');
    };
    m.customProgramCacheKey=()=> 'cb90-paint-v2';
    return m;
  };
  // Three r128's Material.clone omits shader callbacks. Preserve the paint's
  // waterline mask when giving a module its own cutaway opacity/material.
  U.cloneCamoMaterial = function(source) {
    const clone = source.clone();
    clone.onBeforeCompile = source.onBeforeCompile;
    clone.customProgramCacheKey = source.customProgramCacheKey;
    return clone;
  };
  /**
   * Paint UVs run with x along the hull. On the blunt stem face (the raked stävport and the stem plate below its sill)
   * x is nearly constant across the face, which would smear one texture column sideways; uvShift(v) returns an extra
   * x-offset for such vertices (the stem face uses its z) so the pattern keeps its scale there.
   */
  U.applyCamo = function(geometry,matrix,uvShift) {
    const g=geometry, p=g.attributes.position, uv=[],col=[],height=[],v=new THREE.Vector3();
    for(let i=0;i<p.count;i++){
      v.fromBufferAttribute(p,i);if(matrix)v.applyMatrix4(matrix);
      uv.push((v.x+(uvShift?uvShift(v):0))/16, (v.y+Math.abs(v.z)*.38+1.35)/5.7);
      col.push(1,1,1);height.push(v.y);
    }
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    g.setAttribute('hullHeight',new THREE.Float32BufferAttribute(height,1));
    return g;
  };
  /** Mesh with a camo material and per-vertex colours (geometry must be in hull coordinates or pass matrix). opts.uvShift as in U.applyCamo. */
  U.camoMesh = function (geometry, matrix, opts) {
    const g = U.applyCamo(geometry, matrix, opts && opts.uvShift);
    const mo = Object.assign({}, opts || {}); delete mo.uvShift;
    const m = U.camoMaterial(mo);
    m.vertexColors = true;
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  };

  // ---------- geometry helpers ----------
  /** U.box(w, h, d, material, [x, y, z]) -> Mesh (BoxGeometry centred at position). */
  U.box = function (w, h, d, material, pos) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  /** U.cyl(rTop, rBottom, h, material, segs, [x,y,z], axis) -> Mesh. axis 'y' (default) | 'x' | 'z' = direction of the cylinder's length. */
  U.cyl = function (rTop, rBottom, h, material, segs, pos, axis) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segs || 24), material);
    if (axis === 'x') m.rotation.z = -Math.PI / 2;      // +Y -> +X
    else if (axis === 'z') m.rotation.x = Math.PI / 2;  // +Y -> +Z
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  /** U.tube(pointsArray(Vector3[]), radius, material, segs) -> Mesh along a CatmullRom curve. */
  U.tube = function (points, radius, material, segs) {
    const curve = new THREE.CatmullRomCurve3(points);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segs || Math.max(8, points.length * 6), radius, 10, false), material);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  /** U.bar(a(Vector3), b(Vector3), radius, material) -> straight cylinder from a to b (recomputed with U.setBar). */
  U.bar = function (a, b, radius, material) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 12), material);
    m.castShadow = true;
    U.setBar(m, a, b);
    return m;
  };
  /** Re-orient a U.bar mesh between two points (both in the mesh parent's frame). Use for hydraulic rods / tie rods every frame. */
  const _dir = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  U.setBar = function (mesh, a, b) {
    _dir.subVectors(b, a);
    const len = _dir.length() || 1e-6;
    mesh.position.copy(a).addScaledVector(_dir, 0.5);
    mesh.scale.set(1, len, 1);
    mesh.quaternion.setFromUnitVectors(_up, _dir.multiplyScalar(1 / len));
    return mesh;
  };
  /**
   * U.extrudeShape(points2D([[x,y],...]), depth, material, opts) -> Mesh of an extruded polygon.
   * The shape is drawn in the local XY plane and extruded along +Z by depth (starts at z = 0). opts: {bevel:false}
   */
  U.extrudeShape = function (pts, depth, material, opts) {
    const shape = new THREE.Shape();
    pts.forEach((p, i) => (i === 0 ? shape.moveTo(p[0], p[1]) : shape.lineTo(p[0], p[1])));
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, steps: 1 });
    const m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };
  /**
   * U.loft(sections, opts) -> BufferGeometry. sections = array of arrays of THREE.Vector3 (same length each).
   * Quads are built between consecutive sections; the surface faces outward if sections are listed with consistent winding
   * (use opts.flip=true to flip). opts: {capStart:false, capEnd:false, flip:false, smooth:true}. Normals are computed
   * (smooth across the strip; build separate lofts where you want a hard crease such as the chine).
   */
  U.loft = function (sections, opts) {
    opts = opts || {};
    const n = sections.length, m = sections[0].length;
    const verts = [], idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const p = sections[i][j]; verts.push(p.x, p.y, p.z); }
    const add = (a, b, c) => (opts.flip ? idx.push(a, c, b) : idx.push(a, b, c));
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m - 1; j++) {
      const a = i * m + j, b = a + 1, c = a + m, d = c + 1;
      add(a, c, b); add(b, c, d);
    }
    const fan = (i0, reverse) => { // triangle fan over a section (assumes the section is roughly planar & convex)
      const base = i0 * m;
      for (let j = 1; j < m - 1; j++) reverse ? add(base, base + j + 1, base + j) : add(base, base + j, base + j + 1);
    };
    if (opts.capStart) fan(0, false);
    if (opts.capEnd) fan(n - 1, true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  /** Interpolate between two station records (CB90.STATIONS entries) at x. */
  U.stationAt = function (x) {
    const S = CB90.STATIONS;
    if (x <= S[0].x) return Object.assign({}, S[0]);
    if (x >= S[S.length - 1].x) return Object.assign({}, S[S.length - 1]);
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / (b.x - a.x), o = { x: x };
        for (const k of ['keelY', 'keelZ', 'chineZ', 'chineY', 'deckZ', 'deckY']) o[k] = U.lerp(a[k] || 0, b[k] || 0, t);
        return o;
      }
    }
    return Object.assign({}, S[S.length - 1]);
  };
  /**
   * Half-breadth of the hull at (x, y): linear between keel-chine and chine-deck panels. Below the keel line it returns the
   * section's keelZ (0 for the sharp keel; the half-width of the blunt raked stem face forward of x≈13).
   */
  U.hullHalfWidthAt = function (x, y) {
    const s = U.stationAt(x), keelZ = s.keelZ || 0;
    if (y <= s.keelY) return keelZ;
    if (y <= s.chineY) return U.lerp(keelZ, s.chineZ, (y - s.keelY) / Math.max(1e-6, s.chineY - s.keelY));
    if (y <= s.deckY) return U.lerp(s.chineZ, s.deckZ, (y - s.chineY) / Math.max(1e-6, s.deckY - s.chineY));
    return s.deckZ;
  };
  /** Half-width of the raised trunk / front deck at x: M.TRUNK_HALFW, clipped 3 cm inside the sheer where the bow narrows (x > ~12). */
  U.trunkHalfW = function (x) {
    const M=CB90.M;
    // Narrow only the cabin pedestal; preserve the troop deck and its rail feet.
    const t=U.clamp((x-8.50)/.10,0,1);
    const w=U.lerp(M.TRUNK_HALFW,M.CABIN_PLINTH_HALFW,t);
    return Math.min(w,U.stationAt(x).deckZ-.03);
  };
  /**
   * Height of the walking surface at (x, z) – the deck layout of SPEC §5: aft deck (flat), trunk top / front deck (flat, inside
   * U.trunkHalfW) with the side decks outboard of it, the slope down to the foredeck, and the foredeck. Side decks and the
   * foredeck lie M.DECK_EDGE_DROP below the sheer line (deckY), so the foredeck slopes gently down toward the stem.
   */
  U.deckYAt = function (x, z) {
    const M = CB90.M, drop = M.DECK_EDGE_DROP != null ? M.DECK_EDGE_DROP : 0.02;
    const sheer = (xx) => U.stationAt(xx).deckY - drop;
    if (x < M.TRUNK_X0) return M.AFTDECK_Y;
    if (Math.abs(z) > U.trunkHalfW(x) || x >= M.FRONTDECK_SLOPE_X1) return sheer(x);
    if (x <= M.WH_X0) return M.TRUNK_Y;
    if (x < M.FRONTDECK_X1) return U.lerp(M.TRUNK_Y, M.FRONTDECK_Y, (x - M.WH_X0) / (M.FRONTDECK_X1 - M.WH_X0));
    return U.lerp(M.FRONTDECK_Y, sheer(M.FRONTDECK_SLOPE_X1), (x - M.FRONTDECK_X1) / (M.FRONTDECK_SLOPE_X1 - M.FRONTDECK_X1));
  };

  // ---------- articulations (hinges) ----------
  /**
   * U.hinge(spec) -> articulation record. spec = { id, label, kind, parent(Object3D), pivot:[x,y,z] (in parent's frame),
   *   axis:'x'|'y'|'z', closed:deg, open:deg, speed?:seconds for full travel (default 1.2) }.
   * Creates a THREE.Group at pivot, adds it to parent, and returns
   *   { id, label, kind, pivot: Group, axis, closed, open, speed, value: 0 }   (value 0 = closed, 1 = open).
   * Add the moving meshes as children of record.pivot, positioned RELATIVE TO THE HINGE LINE.
   * kinds: 'hatch' | 'door' | 'ramp' | 'mast' | 'turret' | 'elev' | 'seat' (turret/elev are sliders in the UI, others are toggles).
   */
  U.hinge = function (spec) {
    const g = new THREE.Group();
    g.name = spec.id;
    g.position.set(spec.pivot[0], spec.pivot[1], spec.pivot[2]);
    spec.parent.add(g);
    const rec = { id: spec.id, label: spec.label, kind: spec.kind || 'hatch', pivot: g, axis: spec.axis, closed: spec.closed || 0, open: spec.open, speed: spec.speed || 1.2, value: 0 };
    U.setArticulation(rec, 0);
    return rec;
  };
  /** Set an articulation to value v in [0,1] (0 = closed angle, 1 = open angle). */
  U.setArticulation = function (rec, v) {
    rec.value = U.clamp(v, 0, 1);
    const ang = U.deg(U.lerp(rec.closed, rec.open, rec.value));
    rec.pivot.rotation.set(0, 0, 0);
    rec.pivot.rotation[rec.axis] = ang;
  };

  // The port bow lid overlaps the starboard lid (SHK RM 2008:02, p15).
  // Requests operate the pair in the correct order. Full travel is used as a
  // conservative release point; the source gives no exact latch-release angle.
  U.requestHatch = function (hatches, id, value) {
    if (!hatches[id]) return;
    const v = U.clamp(value, 0, 1);
    hatches[id].target = v;
    if (id === 'hatch_bowS' && v > 0 && hatches.hatch_bowP) hatches.hatch_bowP.target = 1;
    if (id === 'hatch_bowP' && v < 1 && hatches.hatch_bowS) hatches.hatch_bowS.target = 0;
  };
  U.stepArticulations = function (records, hatches, dt) {
    const port = hatches.hatch_bowP, starboard = hatches.hatch_bowS;
    for (const rec of records) {
      const h = hatches[rec.id];
      if (!h) continue;
      let target = h.target;
      if (rec.id === 'hatch_bowS' && target > h.value && port && port.value < 1) target = h.value;
      if (rec.id === 'hatch_bowP' && target < h.value && starboard && starboard.value > 0) target = h.value;
      h.value = U.moveTowards(h.value, target, Math.max(0, dt) / (rec.speed || 1.2));
      U.setArticulation(rec, /^(hatch|door|ramp|mast)$/.test(rec.kind) ? U.ease(h.value) : h.value);
    }
  };

  // ---------- misc ----------
  U.shadowed = function (obj) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return obj; };
  U.mirrorZ = function (v) { return new THREE.Vector3(v.x, v.y, -v.z); };
  U.text = null; // no text rendering (no external fonts); hull numbers are done with simple box segments in equipment.js
})();
