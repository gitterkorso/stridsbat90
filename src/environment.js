// Procedural Swedish archipelago streamed around the boat as heightfield chunks. All positions are metres.
// The terrain is CB90.Archipelago (world.height) sampled into 256 m chunks with three levels of detail,
// coloured as weathered granite and planted with instanced pines, spruces, birches, shrubs and shoreline boulders.
window.CB90 = window.CB90 || {};
CB90.buildEnvironment = function (THREE, world) {
  'use strict';
  const A = CB90.Archipelago;
  if (!world) world = A.create(A.DEFAULT_SEED);
  const CHUNK = 256, LOD_CELL = [2, 4, 8], LOD_RANGE = [420, 900, 1500], DISPOSE_RANGE = 1900, LOD_MARGIN = 28;
  const SKIRT = 6, MIN_Y = -12, BUDGET_MS = 6, TAU = Math.PI * 2;
  const clock = typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Date.now();
  const group = new THREE.Group();
  function hash(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }
  function noise(x, z) { const ix = Math.floor(x), iz = Math.floor(z); let fx = x - ix, fz = z - iz; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz); return (1 - fz) * ((1 - fx) * hash(ix, iz) + fx * hash(ix + 1, iz)) + fz * ((1 - fx) * hash(ix, iz + 1) + fx * hash(ix + 1, iz + 1)); }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const lin = hex => { const c = new THREE.Color(hex).convertSRGBToLinear(); return [c.r, c.g, c.b]; };
  const linColor = hex => new THREE.Color(hex).convertSRGBToLinear();

  // ---------- materials ----------
  const foamTime = { value: 0 };
  const rockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.93, metalness: 0.015, envMapIntensity: 0.23 });
  rockMat.name = 'Weathered coastal granite, lichen and wet waterline';
  rockMat.onBeforeCompile = function (shader) {
    shader.uniforms.uShoreTime = foamTime;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockPoint;\nvarying vec3 vRockWorld;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vRockPoint=position;
      vec4 rockWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        rockWorld=instanceMatrix*rockWorld;
      #endif
      vRockWorld=(modelMatrix*rockWorld).xyz;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uShoreTime;
      varying vec3 vRockPoint;
      varying vec3 vRockWorld;
      float rHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float rNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(rHash(i),rHash(i+vec3(1,0,0)),f.x),mix(rHash(i+vec3(0,1,0)),rHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(rHash(i+vec3(0,0,1)),rHash(i+vec3(1,0,1)),f.x),mix(rHash(i+vec3(0,1,1)),rHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float fleck=rNoise(vRockPoint*13.0)*0.12+rNoise(vRockPoint*2.7)*0.19;
      float vein=pow(max(0.0,sin(vRockPoint.x*0.75+vRockPoint.y*3.5+vRockPoint.z*0.4+rNoise(vRockPoint*0.32)*4.0)),12.0);
      diffuseColor.rgb*=0.80+fleck;
      diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.16,vein*0.33);
      // A faint breaking ripple travels along the real waterline (world height within ±0.35 m).
      float shore=1.0-smoothstep(0.0,0.35,abs(vRockWorld.y));
      float ripple=0.5+0.5*sin(vRockWorld.x*1.7+vRockWorld.z*1.3+rNoise(vRockWorld*0.6)*5.0-uShoreTime*1.6);
      diffuseColor.rgb+=vec3(0.16,0.19,0.18)*shore*ripple*ripple*0.55;
    `);
  };
  const pineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, vertexColors: true, envMapIntensity: 0.12 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: linColor(0x64564a), roughness: 1, envMapIntensity: 0.18 });
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, envMapIntensity: 0.16 });
  const boulderMat = rockMat;
  const featureMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.57, metalness: 0.22 });
  featureMat.name = 'Painted steel of buoys and lighthouses';
  const dry = lin(0x85837c), wet = lin(0x3c4846), moss = lin(0x565b3c), pink = lin(0x94857e), forest = lin(0x3d4a33), seabed = lin(0x2b3a3b);
  /** Port of the island colouring: dry granite, wet dark band at the waterline, moss on flatter ground, pink tint and noise variation. */
  function vertexColour(out, o, x, z, y, ny, lod) {
    let r = dry[0], g = dry[1], b = dry[2];
    const pk = noise(x * 0.12, z * 0.13) * 0.45; r += (pink[0] - r) * pk; g += (pink[1] - g) * pk; b += (pink[2] - b) * pk;
    const wetness = Math.min(0.80, Math.max(0, 1 - y / 0.95) * 0.82); r += (wet[0] - r) * wetness; g += (wet[1] - g) * wetness; b += (wet[2] - b) * wetness;
    if (y > 1.0) {
      const flat = clamp01((ny - 0.78) / 0.17), lichen = noise(x * 0.23 + 8, z * 0.23);
      const m = Math.min(1, Math.max(0, lichen - 0.34) * Math.min(1, y / 3) * 1.7 * flat); r += (moss[0] - r) * m; g += (moss[1] - g) * m; b += (moss[2] - b) * m;
    }
    if (y < -0.5) { const d = Math.min(1, (-0.5 - y) / 5) * 0.7; r += (seabed[0] - r) * d; g += (seabed[1] - g) * d; b += (seabed[2] - b) * d; }
    // Dark humus, moss and grass occupy sheltered inner islands; exposed shores stay granite.
    const habitat=world.habitat?world.habitat(x,z):{forest:.4};
    const outcrop=clamp01((noise(x*.025+41,z*.025)-.3)/.4);
    const cover=habitat.forest*clamp01((y-1.1)/2.3)*clamp01((ny-.65)/.25)*(.35+.65*outcrop);
    r+=(forest[0]-r)*cover*.96;g+=(forest[1]-g)*cover*.96;b+=(forest[2]-b)*cover*.96;
    const v = 0.80 + noise(x * 0.65, z * 0.65) * 0.24; out[o] = r * v; out[o + 1] = g * v; out[o + 2] = b * v;
  }

  // ---------- shared vegetation geometry ----------
  /** Merge geometries (optionally with one THREE.Color each) into one non-indexed geometry with position, normal and colour. */
  function mergePieces(pieces, colours) {
    const p = [], n = [], c = [];
    pieces.forEach(function (g, k) {
      const geo = g.index ? g.toNonIndexed() : g; const pos = geo.attributes.position.array; p.push(...pos); n.push(...geo.attributes.normal.array);
      if (colours) { const col = colours[k]; for (let i = 0; i < pos.length; i += 3) c.push(col.r, col.g, col.b); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
    if (colours) g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return g;
  }
  // Scots pines: open trunks, spreading limbs and separate wind-shaped needle crowns. Lump indices select which of the
  // twelve crown clumps are built (11 is the leader), so the far variant is a subset of the near silhouette.
  function crownPieces(indices, detail) {
    return indices.map(function (i) {
      const a = i * 2.39996, r = i === 11 ? 0 : 0.28 + 0.53 * hash(i, 9);
      const y = i === 11 ? 0.95 : 0.53 + 0.29 * hash(i, 7);
      const width = i === 11 ? 0.44 : 0.43 + 0.21 * hash(i, 13);
      const g = new THREE.IcosahedronGeometry(1, typeof detail === 'function' ? detail(i) : detail), p = g.attributes.position;
      for (let j = 0; j < p.count; j++) {
        const x = p.getX(j), v = p.getY(j), z = p.getZ(j);
        const ragged = 0.82 + hash(Math.round(x * 100 + i * 11), Math.round(z * 100 + v * 20)) * 0.35;
        p.setXYZ(j, x * width * ragged + Math.cos(a) * r, v * (0.085 + hash(i, 4) * 0.055) * ragged + y, z * width * ragged + Math.sin(a) * r);
      }
      g.computeVertexNormals(); return g;
    });
  }
  function trunkPieces(branches, segs) {
    const pieces = [];
    const trunk = new THREE.CylinderGeometry(0.006, 0.021, 0.84, segs, 1, true); trunk.translate(0, 0.42, 0); pieces.push(trunk);
    for (let i = 0; i < branches; i++) {
      const a = i * 2.39996, base = new THREE.Vector3(0, 0.39 + i * 0.027, 0);
      const tip = new THREE.Vector3(Math.cos(a) * (0.17 + hash(i, 9) * 0.06), 0.57 + i * 0.027, Math.sin(a) * (0.17 + hash(i, 9) * 0.06));
      const axis = tip.clone().sub(base), g = new THREE.CylinderGeometry(0.0015, 0.0075, axis.length(), 4, 1, true);
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize())));
      g.translate((base.x + tip.x) / 2, (base.y + tip.y) / 2, (base.z + tip.z) / 2); pieces.push(g);
    }
    return pieces;
  }
  const white = new THREE.Color(1, 1, 1);
  const nearCrown = crownPieces([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], i => (i === 11 || i === 2 || i === 5 || i === 8 ? 1 : 0));
  const pineNearGeo = mergePieces(nearCrown, nearCrown.map(() => white));
  const trunkNearGeo = mergePieces(trunkPieces(9, 7));
  // Far pine: four clumps and a trunk in one geometry. The trunk colour is pre-divided by a typical crown tint since the
  // instance colour multiplies the whole tree; at 400 m and beyond the residual hue shift is invisible.
  const typicalTint = new THREE.Color().setHSL(0.2825, 0.28, 0.27).convertSRGBToLinear(), trunkLin = linColor(0x64564a);
  const trunkComp = new THREE.Color(Math.min(6, trunkLin.r / Math.max(0.01, typicalTint.r)), Math.min(6, trunkLin.g / Math.max(0.01, typicalTint.g)), Math.min(6, trunkLin.b / Math.max(0.01, typicalTint.b)));
  const farCrown = crownPieces([2, 5, 8, 11], 0), farTrunk = trunkPieces(0, 5)[0]; farTrunk.scale(1 / 0.35, 1, 1 / 0.35);
  const pineFarGeo = mergePieces(farCrown.concat([farTrunk]), farCrown.map(() => white).concat([trunkComp]));
  // Unit-height spruce and birch keep their species silhouette in both detail levels.
  // Bark is baked separately from foliage so birches retain white stems at a distance.
  function mixedTreeGeometry(species, far) {
    const pieces = [], colours = [];
    const add = (g, colour) => { pieces.push(g); colours.push(linColor(colour)); };
    const stem = new THREE.CylinderGeometry(.004, species === 'birch' ? .013 : .019, .94, far ? 5 : 7, far ? 1 : 12, true);
    stem.translate(0, .47, 0);
    if (species === 'birch') {
      const pos = stem.attributes.position, cs = [];
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i), angle = Math.atan2(pos.getZ(i), pos.getX(i));
        const scar = y < .12 || (Math.sin(y * 97 + angle * 2) > .48 && Math.sin(angle * 3 + y * 61) > .1);
        const c = linColor(scar ? 0x45463f : 0xdad9c9); cs.push(c.r, c.g, c.b);
      }
      stem.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    }
    add(stem, species === 'birch' ? 0xdad9c9 : 0x675344);
    if (species === 'spruce') {
      const tiers = far ? 5 : 8;
      for (let i = 0; i < tiers; i++) {
        const t = i / (tiers - 1), y = .21 + t * .67, width = .235 * (1 - t) + .028;
        const g = new THREE.ConeGeometry(width, .29 - t * .12, far ? 7 : 11, 2);
        const pos = g.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const x = pos.getX(j), z = pos.getZ(j), a = Math.atan2(z, x);
          const rag = 1 + .13 * Math.sin(a * 5 + i * 1.9);
          pos.setXYZ(j, x * rag, pos.getY(j) + .015 * Math.sin(a * 7 + i), z * rag);
        }
        g.rotateY(i * 2.39996); g.translate(0, y, 0); g.computeVertexNormals();
        add(g, i % 3 === 0 ? 0x354d38 : i % 3 === 1 ? 0x405d40 : 0x496447);
      }
    } else {
      const count = far ? 5 : 10;
      for (let i = 0; i < count; i++) {
        const a = i * 2.39996, t = i / (count - 1), radius = .13 * Math.sin(t * Math.PI);
        const g = new THREE.IcosahedronGeometry(1, far ? 0 : 1), pos = g.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
          const rag = .86 + .24 * hash(Math.round(x * 71 + i), Math.round(z * 53 + y * 19));
          pos.setXYZ(j, x * .15 * rag + Math.cos(a) * radius, y * .19 * rag + .43 + t * .42, z * .14 * rag + Math.sin(a) * radius);
        }
        g.computeVertexNormals(); add(g, [0x6d8548, 0x849952, 0x587440][i % 3]);
      }
    }
    const merged = mergePieces(pieces, colours);
    if (species === 'birch') {
      const bark = stem.index ? stem.toNonIndexed() : stem;
      merged.attributes.color.array.set(bark.attributes.color.array);
    }
    return merged;
  }
  const spruceGeos = [mixedTreeGeometry('spruce', false), mixedTreeGeometry('spruce', true)];
  const birchGeos = [mixedTreeGeometry('birch', false), mixedTreeGeometry('birch', true)];
  const shrubNearGeo = new THREE.IcosahedronGeometry(1, 1), shrubFarGeo = new THREE.IcosahedronGeometry(1, 0);
  function boulderGeometry(detail) {
    const stoneGeo = new THREE.IcosahedronGeometry(1, detail), stonePos = stoneGeo.attributes.position, stoneColors = [];
    for (let i = 0; i < stonePos.count; i++) {
      const x = stonePos.getX(i), y = stonePos.getY(i), z = stonePos.getZ(i);
      stonePos.setXYZ(i, x * (0.90 + noise(y * 3, z * 3) * 0.18), y * (0.90 + noise(x * 3, z * 3) * 0.18), z * (0.90 + noise(x * 3, y * 3) * 0.18));
      const v = 0.72 + noise(x * 2, z * 2) * 0.3; stoneColors.push(dry[0] * v, dry[1] * v, dry[2] * v);
    }
    stoneGeo.setAttribute('color', new THREE.Float32BufferAttribute(stoneColors, 3)); stoneGeo.computeVertexNormals(); return stoneGeo;
  }
  const boulderGeo = boulderGeometry(1);
  /** A per-chunk geometry sharing the vertex arrays of a kind so that each chunk gets its own bounding sphere (frustum culling). */
  function wrapGeometry(src, sphere) {
    const g = new THREE.BufferGeometry();
    for (const name in src.attributes) { const a = src.attributes[name]; g.setAttribute(name, new THREE.BufferAttribute(a.array, a.itemSize, a.normalized)); }
    if (src.index) g.setIndex(new THREE.BufferAttribute(src.index.array, 1));
    g.boundingSphere = sphere; return g;
  }

  // ---------- chunk streaming ----------
  const chunks = new Map(); let queue = [], job = null, scanX = Infinity, scanZ = Infinity, scanTime = -Infinity;
  let start, sampler, forestNoise, home;
  const obj = new THREE.Object3D(), tint = new THREE.Color();
  const centreDist = (cx, cz, px, pz) => Math.hypot(cx * CHUNK + CHUNK / 2 - px, cz * CHUNK + CHUNK / 2 - pz);
  const wantedLod = d => d < LOD_RANGE[0] ? 0 : d < LOD_RANGE[1] ? 1 : d < LOD_RANGE[2] ? 2 : -1;
  function instances(name, kind, geo, material, items, place, colour, margin, x0, z0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    items.forEach(function (it) { if (it.x < minX) minX = it.x; if (it.x > maxX) maxX = it.x; if (it.y < minY) minY = it.y; if (it.y > maxY) maxY = it.y; if (it.z < minZ) minZ = it.z; if (it.z > maxZ) maxZ = it.z; });
    const centre = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2 + margin * 0.4, (minZ + maxZ) / 2);
    const sphere = new THREE.Sphere(centre, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + margin);
    const mesh = new THREE.InstancedMesh(wrapGeometry(geo, sphere), material, items.length);
    items.forEach(function (it, i) { place(it); obj.updateMatrix(); mesh.setMatrixAt(i, obj.matrix); if (colour) { colour(it); mesh.setColorAt(i, tint); } });
    mesh.name = name; mesh.userData.kind = kind; mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.position.set(x0, 0, z0); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); return mesh;
  }
  /** Deterministic vegetation of one chunk: pines, shrubs and (LOD0) shoreline boulders. Positions never depend on the LOD. */
  function* vegetationJob(cx, cz, lod, x0, z0) {
    const meshes = [], base = world.hash2(cx * 3 + 101, cz * 5 + 7), h = (x, z) => world.height(x, z);
    {
      const rnd = A.mulberry32((base ^ 0x9E3779B9) >>> 0), cells = 32, s = CHUNK / cells, items = [], spruces = [], birches = [];
      for (let j = 0; j < cells && items.length < 700; j++) for (let i = 0; i < cells && items.length < 700; i++) {
        const x = x0 + (i + rnd()) * s, z = z0 + (j + rnd()) * s, keep = rnd(), hv = rnd(), rot = rnd(), t = rnd();
        const habitat=world.habitat?world.habitat(x,z):{forest:.5,exposure:.5};
        const y = h(x, z); if (y < 1.7+habitat.exposure*3.5) continue;
        const slope = Math.hypot(h(x + 1.5, z) - h(x - 1.5, z), h(x, z + 1.5) - h(x, z - 1.5)) / 3; if (slope > 0.55) continue;
        const woods = 0.5 + 0.5 * forestNoise(x * 0.012, z * 0.012);
        if (keep > (.12+habitat.forest*.88)*(.4+woods*.7)-slope*.22) continue;
        // Wind-stunted pines on the low skerries, full height on the higher ground.
        const th = (4.0 + hv * 6.0 + habitat.forest*6.0) * Math.min(1, Math.max(0.5, 0.45 + y / 12));
        const species = hash(x + world.seed, z - 71);
        const grove = noise(x * .018 + 17, z * .018 - 23);
        const spruceShare = habitat.forest * (.18 + .28 * grove) * clamp01((y - 3) / 5);
        const birchShare = (1 - habitat.exposure) * (.18 + .16 * (1 - grove));
        const target = species < spruceShare ? spruces : species < spruceShare + birchShare ? birches : items;
        target.push({ x: x - x0, y: y - 0.07, z: z - z0,
          h: th * (target === spruces ? 1.12 : target === birches ? .85 : 1), rot: rot * TAU, t });
      }
      if (items.length) {
        const placeCrown = it => { obj.position.set(it.x, it.y, it.z); obj.rotation.set(0, it.rot, 0); obj.scale.set(it.h * 0.35, it.h, it.h * 0.35); };
        const tintPine = it => tint.setHSL(0.265 + it.t * 0.045, 0.28 + it.t * 0.12, 0.16 + it.t * 0.07).convertSRGBToLinear();
        meshes.push(instances('Vindpinade tallar', 'pine', lod === 0 ? pineNearGeo : pineFarGeo, pineMat, items, placeCrown, tintPine, 12, x0, z0));
        if (lod === 0) meshes.push(instances('Tallstammar och grenar', 'trunk', trunkNearGeo, trunkMat, items, it => { obj.position.set(it.x, it.y, it.z); obj.rotation.set(0, it.rot, 0); obj.scale.set(it.h, it.h, it.h); }, null, 12, x0, z0));
      }
      const placeTree = it => { obj.position.set(it.x, it.y, it.z); obj.rotation.set(0, it.rot, 0); obj.scale.set(it.h, it.h, it.h); };
      const treeTint = it => tint.setRGB(.82 + it.t * .26, .86 + it.t * .20, .80 + it.t * .24);
      if (spruces.length) meshes.push(instances('Granar i skyddad skog', 'spruce', spruceGeos[lod], pineMat, spruces, placeTree, treeTint, 22, x0, z0));
      if (birches.length) meshes.push(instances('Björkar i skogsbryn', 'birch', birchGeos[lod], pineMat, birches, placeTree, treeTint, 18, x0, z0));
    }
    yield;
    {
      const rnd = A.mulberry32((base ^ 0x7F4A7C15) >>> 0), cells = 24, s = CHUNK / cells, items = [];
      for (let j = 0; j < cells && items.length < 500; j++) for (let i = 0; i < cells && items.length < 500; i++) {
        const x = x0 + (i + rnd()) * s, z = z0 + (j + rnd()) * s, keep = rnd(), sv = rnd(), rot = rnd(), t = rnd();
        const shelter=world.habitat?world.habitat(x,z).forest:.5;
        const patch=.25+.75*noise(x*.035,z*.035);
        const y = h(x, z); if (y < 0.4 || y > 3 || keep > (.12+.43*shelter)*patch) continue;
        items.push({ x: x - x0, y, z: z - z0, s: 0.7 + sv * 1.15, rot: rot * TAU, t });
      }
      if (items.length) meshes.push(instances('En och ljung', 'shrub', lod === 0 ? shrubNearGeo : shrubFarGeo, shrubMat, items,
        it => { obj.position.set(it.x, it.y + it.s * 0.28, it.z); obj.rotation.set(0, it.rot, 0); obj.scale.set(it.s, it.s * 0.65, it.s * 0.8); },
        it => tint.setHSL(0.20 + it.t * 0.055, 0.21, 0.27 + (it.t * 7.3 % 1) * 0.11).convertSRGBToLinear(), 3, x0, z0));
    }
    if (lod === 0) {
      yield;
      const rnd = A.mulberry32((base ^ 0x2545F491) >>> 0), cells = 32, s = CHUNK / cells, items = [];
      for (let j = 0; j < cells && items.length < 300; j++) for (let i = 0; i < cells && items.length < 300; i++) {
        const x = x0 + (i + rnd()) * s, z = z0 + (j + rnd()) * s, keep = rnd(), sv = rnd(), rot = rnd(), tx = rnd(), tz = rnd();
        const y = h(x, z); if (y < -0.3 || y > 0.6 || keep > 0.5) continue;
        items.push({ x: x - x0, y: y - 0.06, z: z - z0, s: 0.4 + sv * 1.8, rot: rot * TAU, tx: tx * 0.7, tz: tz * 0.2 });
      }
      if (items.length) meshes.push(instances('Strandblock av granit', 'boulder', boulderGeo, boulderMat, items,
        it => { obj.position.set(it.x, it.y, it.z); obj.rotation.set(it.tx, it.rot, it.tz); obj.scale.set(it.s, it.s * 0.49, it.s * 0.8); }, null, 3, x0, z0));
    }
    return meshes;
  }
  /** Builds one chunk in slices (yield between them) so update() can spread the work over frames. */
  function* chunkJob(cx, cz, lod) {
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    let deep = true;
    for (let j = 0; j <= 8 && deep; j++) for (let i = 0; i <= 8; i++) if (world.height(x0 + i * 32, z0 + j * 32) >= -3) { deep = false; break; }
    if (deep) return { water: true, lod, cx, cz, x0, z0, mesh: null, veg: [] };
    const cell = LOD_CELL[lod], n = CHUNK / cell, w = n + 3, H = new Float32Array(w * w);
    for (let j = -1; j <= n + 1; j++) {
      const z = z0 + j * cell, row = (j + 1) * w;
      for (let i = -1; i <= n + 1; i++) { const y = world.height(x0 + i * cell, z); H[row + i + 1] = y < MIN_Y ? MIN_Y : y; }
      if ((j & 15) === 15) yield;
    }
    const count = (n + 1) * (n + 1), ring = 4 * n, total = count + ring;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
    for (let j = 0; j <= n; j++) {
      for (let i = 0; i <= n; i++) {
        const k = (j + 1) * w + i + 1, y = H[k], v = (j * (n + 1) + i) * 3;
        const nx = (H[k - 1] - H[k + 1]) / (2 * cell), nz = (H[k - w] - H[k + w]) / (2 * cell), inv = 1 / Math.sqrt(nx * nx + 1 + nz * nz);
        pos[v] = i * cell; pos[v + 1] = y; pos[v + 2] = j * cell; nor[v] = nx * inv; nor[v + 1] = inv; nor[v + 2] = nz * inv;
        vertexColour(col, v, x0 + i * cell, z0 + j * cell, y, inv, lod);
      }
      if ((j & 15) === 15) yield;
    }
    // Perimeter walked so that the skirt walls face outward: south +x, east -z, north -x, west +z.
    const perimeter = new Int32Array(ring); let r = 0;
    for (let i = 0; i < n; i++) perimeter[r++] = n * (n + 1) + i;
    for (let j = n; j > 0; j--) perimeter[r++] = j * (n + 1) + n;
    for (let i = n; i > 0; i--) perimeter[r++] = i;
    for (let j = 0; j < n; j++) perimeter[r++] = j * (n + 1);
    for (let k = 0; k < ring; k++) { const s = (count + k) * 3, p = perimeter[k] * 3; pos[s] = pos[p]; pos[s + 1] = pos[p + 1] - SKIRT; pos[s + 2] = pos[p + 2]; for (let q = 0; q < 3; q++) { nor[s + q] = nor[p + q]; col[s + q] = col[p + q]; } }
    const tri = n * n * 2 + ring * 2, idx = total > 65535 ? new Uint32Array(tri * 3) : new Uint16Array(tri * 3); let t = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx[t++] = a; idx[t++] = c; idx[t++] = b; idx[t++] = b; idx[t++] = c; idx[t++] = d; }
    for (let k = 0; k < ring; k++) { const p0 = perimeter[k], p1 = perimeter[(k + 1) % ring], s0 = count + k, s1 = count + (k + 1) % ring; idx[t++] = p0; idx[t++] = s0; idx[t++] = p1; idx[t++] = s0; idx[t++] = s1; idx[t++] = p1; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, rockMat); mesh.name = 'Granit ' + cx + ',' + cz + ' · LOD' + lod; mesh.castShadow = false; mesh.receiveShadow = true;
    mesh.position.set(x0, 0, z0); mesh.matrixAutoUpdate = false; mesh.updateMatrix(); mesh.userData.chunk = { cx, cz, lod, cell, n, count };
    yield;
    const veg = lod < 2 ? yield* vegetationJob(cx, cz, lod, x0, z0) : [];
    return { water: false, lod, cx, cz, x0, z0, cell, n, count, mesh, veg };
  }
  function disposeChunk(rec) {
    if (rec.mesh) { group.remove(rec.mesh); rec.mesh.geometry.dispose(); }
    rec.veg.forEach(function (m) { group.remove(m); m.geometry.dispose(); m.dispose(); });
    chunks.delete(rec.key);
  }
  function commit(rec) {
    rec.key = rec.cx + ',' + rec.cz; const old = chunks.get(rec.key); if (old) disposeChunk(old);
    chunks.set(rec.key, rec); if (rec.mesh) group.add(rec.mesh); rec.veg.forEach(m => group.add(m));
  }
  /** Decide which chunks to create, re-mesh or dispose around (px, pz); nearest first. */
  function scan(px, pz) {
    scanX = px; scanZ = pz; scanTime = clock(); queue = [];
    const c0 = Math.floor((px - LOD_RANGE[2]) / CHUNK), c1 = Math.floor((px + LOD_RANGE[2]) / CHUNK), r0 = Math.floor((pz - LOD_RANGE[2]) / CHUNK), r1 = Math.floor((pz + LOD_RANGE[2]) / CHUNK);
    for (let cz = r0; cz <= r1; cz++) for (let cx = c0; cx <= c1; cx++) {
      const d = centreDist(cx, cz, px, pz), want = wantedLod(d); if (want < 0) continue;
      const rec = chunks.get(cx + ',' + cz);
      if (rec && (rec.water || rec.lod === want)) continue;
      if (rec && !(want < rec.lod ? d < LOD_RANGE[want] - LOD_MARGIN : d > LOD_RANGE[rec.lod] + LOD_MARGIN)) continue;
      if (job && job.cx === cx && job.cz === cz && job.lod === want) continue;
      queue.push({ cx, cz, lod: want, d });
    }
    if (job && wantedLod(centreDist(job.cx, job.cz, px, pz)) !== job.lod) job = null;
    chunks.forEach(function (rec) { if (centreDist(rec.cx, rec.cz, px, pz) > DISPOSE_RANGE) disposeChunk(rec); });
    queue.sort((a, b) => a.d - b.d);
  }
  /** Run chunk jobs until the deadline (performance.now() time stamp) passes. */
  function stream(deadline) {
    for (;;) {
      if (!job) { const next = queue.shift(); if (!next) return; job = { cx: next.cx, cz: next.cz, lod: next.lod, gen: chunkJob(next.cx, next.cz, next.lod) }; }
      const step = job.gen.next();
      if (step.done) { commit(step.value); job = null; }
      if (clock() > deadline) return;
    }
  }

  // ---------- features from the survey: lateral marks and lighthouses ----------
  const buoys = [], lights = [], features = new THREE.Group(); features.name = 'Sjömärken och fyrar'; group.add(features);
  const buoyGeos = {};
  function addBuoy(x, z, color, cone, label) {
    const key = cone ? 'cone' : 'can';
    if (!buoyGeos[key]) {
      const body = linColor(color), stripe = linColor(0xf3e7c5), steel = linColor(0x333e40), pieces = [], colours = [];
      const add = (g, y, c) => { g.translate(0, y, 0); pieces.push(g); colours.push(c); };
      add(new THREE.CylinderGeometry(0.38, 0.28, 0.42, 16), 0.13, body);
      add(new THREE.CylinderGeometry(0.06, 0.08, 2.6, 8), 1.4, body);
      add(new THREE.CylinderGeometry(0.084, 0.084, 0.16, 8), 2.45, stripe);
      add(cone ? new THREE.ConeGeometry(0.28, 0.42, 12) : new THREE.CylinderGeometry(0.26, 0.26, 0.32, 12), 2.91, body);
      add(new THREE.CylinderGeometry(0.12, 0.12, 0.10, 8), 2.72, steel);
      buoyGeos[key] = mergePieces(pieces, colours);
    }
    const b = new THREE.Mesh(buoyGeos[key], featureMat); b.position.set(x, 0, z); b.name = label; b.castShadow = false;
    features.add(b); buoys.push(b); return b;
  }
  const lanternMat = new THREE.MeshStandardMaterial({ color: linColor(0xfff2c8), emissive: linColor(0xffd98a), emissiveIntensity: 0.3, roughness: 0.4 });
  const haloMat = new THREE.MeshBasicMaterial({ color: linColor(0xffe4a8), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const glassMat = new THREE.MeshStandardMaterial({ color: linColor(0x9fb4bf), transparent: true, opacity: 0.32, roughness: 0.2, metalness: 0.5, side: THREE.DoubleSide, depthWrite: false });
  /** Compact Swedish tower: white shaft with a red band, gallery with railing, glazed lantern room and a red roof. */
  function addLight(L) {
    // Stand on the highest rock within a few metres of the surveyed shore cell.
    let bx = L.x, bz = L.z, by = -Infinity;
    for (let dz = -8; dz <= 8; dz += 4) for (let dx = -8; dx <= 8; dx += 4) { const y = world.height(L.x + dx, L.z + dz); if (y > by) { by = y; bx = L.x + dx; bz = L.z + dz; } }
    by = Math.max(0.25, by); const towerH = Math.min(26, Math.max(6, (L.height || 12) - by));
    const g = new THREE.Group(); g.position.set(bx, by, bz); g.name = 'Fyr ' + L.label; g.userData.light = L;
    const whiteC = linColor(0xe9e6dc), red = linColor(0xb8362b), dark = linColor(0x2e3133), stone = linColor(0x8a8880), roofC = linColor(0xa8332a);
    const pieces = [], colours = []; const add = (geo, y, c) => { geo.translate(0, y, 0); pieces.push(geo); colours.push(c); };
    add(new THREE.CylinderGeometry(2.4, 2.7, 1.2, 18), 0.3, stone);
    add(new THREE.CylinderGeometry(1.55, 1.9, towerH, 18, 1, true), towerH / 2, whiteC);
    add(new THREE.CylinderGeometry(1.75, 1.8, towerH * 0.16, 18, 1, true), towerH * 0.58, red);
    add(new THREE.CylinderGeometry(2.5, 2.2, 0.35, 18), towerH + 0.17, whiteC);
    add(new THREE.TorusGeometry(2.3, 0.05, 6, 24).rotateX(Math.PI / 2), towerH + 1.25, dark);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, post = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 5); post.translate(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3); add(post, towerH + 0.85, dark); }
    add(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 14), towerH + 0.5, dark);
    add(new THREE.ConeGeometry(1.45, 1.3, 14), towerH + 3.3, roofC);
    add(new THREE.SphereGeometry(0.16, 8, 6), towerH + 4.0, dark);
    const tower = new THREE.Mesh(mergePieces(pieces, colours), featureMat); tower.name = 'Fyrtorn'; tower.castShadow = false; tower.receiveShadow = true; g.add(tower);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 2.0, 14, 1, true), glassMat); glass.position.y = towerH + 1.65; glass.name = 'Lanternin'; g.add(glass);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), lanternMat.clone()); lantern.position.y = towerH + 1.65; lantern.name = 'Lykta'; g.add(lantern);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 8), haloMat); halo.position.y = towerH + 1.65; halo.name = 'Ljussken'; halo.visible = false; g.add(halo);
    const point = new THREE.PointLight(0xffe2a6, 0, 150, 1); point.position.y = towerH + 1.65; point.name = 'Fyrljus'; g.add(point);
    features.add(g); lights.push({ group: g, spec: L, lantern, halo, point, on: false }); return g;
  }
  function buildFeatures() {
    if (!home) return;
    if (home.fairway && home.fairway.marks) home.fairway.marks.forEach(function (m) { if (m.side === 'P') addBuoy(m.x, m.z, 0xb44337, false, 'Röd farledsprick'); else addBuoy(m.x, m.z, 0x34744b, true, 'Grön farledsprick'); });
    if (home.lights) home.lights.forEach(addLight);
  }
  function disposeFeatures() {
    features.traverse(function (o) { if (!o.isMesh) return; o.geometry.dispose(); if (o.name === 'Lykta') o.material.dispose(); });
    while (features.children.length) features.remove(features.children[0]);
    buoys.length = 0; lights.length = 0; for (const k in buoyGeos) delete buoyGeos[k];
  }

  // ---------- sky ----------
  const sunDirection = new THREE.Vector3(-0.42, 0.68, 0.59).normalize();
  const skyMaterial = new THREE.ShaderMaterial({
    name: 'Scandinavian maritime sky', side: THREE.BackSide, depthWrite: false,
    uniforms: CB90.weatherUniforms(THREE),
    vertexShader: 'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `precision highp float;varying vec3 vDirection;
      ${CB90.skyGLSL}
      void main(){gl_FragColor=vec4(skyRadiance(normalize(vDirection)),1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`

  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1750, 32, 20), skyMaterial); sky.name = 'Hazy late summer sky'; sky.renderOrder = -100; sky.frustumCulled = false; group.add(sky);

  // ---------- world binding, initial build and update ----------
  function bindWorld(w) {
    world = w; start = world.start || world.findStart(); home = world.home || null;
    sampler = world.createSampler(2); forestNoise = A.makeNoise((world.seed + 4242) >>> 0);
    const chart = world.chartName ? world.chartName() : null; group.name = chart ? chart.name : 'Skärgård';
    if (api) { api.sampler = sampler; api.world = world; }
    buildFeatures();
    sky.position.set(start.x, 0, start.z);
    // Every LOD0 chunk plus the LOD1 ring is built synchronously; the LOD2 ring streams over the first frames.
    scan(start.x, start.z); const far = queue.filter(q => q.lod === 2); queue = queue.filter(q => q.lod < 2);
    stream(Infinity); queue = far;
  }
  function disposeAll() {
    job = null; queue = []; chunks.forEach(disposeChunk); disposeFeatures(); if (sampler) sampler.clear();
  }
  function setWorld(newWorld) { if (!newWorld) return; disposeAll(); bindWorld(newWorld); }
  function update(dt, state, t) {
    const time = typeof t === 'number' ? t : (typeof dt === 'number' ? dt : 0);
    foamTime.value = time;
    buoys.forEach(function (b, i) { b.position.y = Math.sin(time * 1.2 + i * 2) * 0.055; b.rotation.x = Math.sin(time * 0.8 + i) * 0.025; b.rotation.z = Math.cos(time * 0.91 + i * 3) * 0.03; });
    lights.forEach(function (L) {
      const on = A.lightOn(L.spec.char, time + L.spec.phase); if (on === L.on) return; L.on = on;
      L.lantern.material.emissiveIntensity = on ? 2.4 : 0.3; L.halo.visible = on; L.point.intensity = on ? 0.9 : 0;
    });
    const nav = state && state.nav;
    const px = nav && Number.isFinite(nav.x) ? nav.x : start.x, pz = nav && Number.isFinite(nav.z) ? nav.z : start.z;
    sky.position.set(px, 0, pz);
    const now = clock();
    if (Math.hypot(px - scanX, pz - scanZ) > 24 || now - scanTime > 700) scan(px, pz);
    stream(now + BUDGET_MS);
  }
  /** Triangle and draw-call accounting for tests and tuning. */
  function stats() {
    const s = { chunks: chunks.size, water: 0, lod: [0, 0, 0], triangles: 0, drawCalls: 0, trees: 0, species: { pine: 0, spruce: 0, birch: 0 }, shrubs: 0, boulders: 0, queue: queue.length + (job ? 1 : 0) };
    chunks.forEach(function (rec) { if (rec.water) s.water++; else s.lod[rec.lod]++; });
    group.traverse(function (o) {
      if (!o.isMesh || !o.visible || o === sky) return; const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3;
      s.drawCalls++; s.triangles += tri * (o.isInstancedMesh ? o.count : 1);
      if (o.isInstancedMesh) { if (Object.prototype.hasOwnProperty.call(s.species, o.userData.kind)) { s.trees += o.count; s.species[o.userData.kind] += o.count; } else if (o.userData.kind === 'shrub') s.shrubs += o.count; else if (o.userData.kind === 'boulder') s.boulders += o.count; }
    });
    return s;
  }
  let api = null;
  bindWorld(world);
  api = { group, update, setWorld, sampler, heightAt: (x, z) => sampler.height(x, z), sunDirection, world, stats,
    parts: { sky, buoys, lights, chunks, features }, articulations: [] };
  return api;
};
