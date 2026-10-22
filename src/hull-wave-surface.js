// GPU view of the simulated hull waves. Filtered 16-bit heights and slopes keep
// displacement and normals consistent, including steep storm-driven crests.
window.CB90 = window.CB90 || {};
CB90.createHullWaveSurface = function (THREE) {
  'use strict';
  const field = CB90.createHullWaves();
  const size = field.size, cell = field.cell, span = (size - 1) * cell;
  const data = new Uint8Array(size * size * 4);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  const slopes = new Uint8Array(size * size * 4);
  const slopeTexture = new THREE.DataTexture(slopes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  for (const map of [texture, slopeTexture]) {
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    map.generateMipmaps = false; map.flipY = false;
    map.encoding = THREE.LinearEncoding; map.unpackAlignment = 1;
  }
  const uniforms = {
    hullWaveMap: { value: texture },
    hullWaveSlopeMap: { value: slopeTexture },
    hullWaveOrigin: { value: new THREE.Vector2() },
    hullWaveLayout: { value: new THREE.Vector2(size, span) }
  };
  const glsl = `
    uniform sampler2D hullWaveMap, hullWaveSlopeMap;
    uniform vec2 hullWaveOrigin, hullWaveLayout;
    float hullWave(vec2 p,out vec2 slope){
      vec2 uv=(p-hullWaveOrigin)/hullWaveLayout.y;
      vec2 edge=min(uv,1.0-uv);
      float coverage=smoothstep(0.0,0.045,min(edge.x,edge.y));
      vec2 texel=(clamp(uv,0.0,1.0)*(hullWaveLayout.x-1.0)+0.5)/hullWaveLayout.x;
      vec4 packed=texture2D(hullWaveMap,texel);
      // Exactly zero at integer code 32768; RG decoding commutes with bilinear filtering.
      float h=(dot(packed.rg,vec2(65280.0,255.0))-32768.0)/8191.0;
      vec4 gradients=texture2D(hullWaveSlopeMap,texel);
      slope=(vec2(dot(gradients.rg,vec2(65280.0,255.0)),dot(gradients.ba,vec2(65280.0,255.0)))-32768.0)/8191.0*coverage;
      return h*coverage;
    }
    void sea(vec2 p,out float height,out vec2 slope){
      ambientSea(p,height,slope);
      vec2 hullSlope;
      height+=hullWave(p,hullSlope);
      slope+=hullSlope;
    }
  `;
  let revision = -1;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function sync() {
    if (revision === field.revision) return;
    const heights = field.height;
    for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
      const i = z * size + x, o = i * 4;
      const h = Math.round(clamp(heights[i], -4, 4) * 8191 + 32768);
      const dx = (heights[z * size + Math.min(x + 1, size - 1)] - heights[z * size + Math.max(x - 1, 0)]) / (cell * (x === 0 || x === size - 1 ? 1 : 2));
      const dz = (heights[Math.min(z + 1, size - 1) * size + x] - heights[Math.max(z - 1, 0) * size + x]) / (cell * (z === 0 || z === size - 1 ? 1 : 2));
      data[o] = h >>> 8; data[o + 1] = h & 255;
      const sx = Math.round(clamp(dx, -4, 4) * 8191 + 32768);
      const sz = Math.round(clamp(dz, -4, 4) * 8191 + 32768);
      slopes[o] = sx >>> 8; slopes[o + 1] = sx & 255;
      slopes[o + 2] = sz >>> 8; slopes[o + 3] = sz & 255;
    }
    uniforms.hullWaveOrigin.value.set(field.origin.x, field.origin.z);
    texture.needsUpdate = true;
    slopeTexture.needsUpdate = true;
    revision = field.revision;
  }
  function update(t, state, pose) { field.update(t, state, pose); sync(); }
  function reset(nav, pose) { field.reset(nav, pose); sync(); }
  function setWorld(world) { field.setWorld(world); sync(); }
  sync();
  return { uniforms, glsl, update, reset, setWorld, sample: field.sample, stats: field.stats, field };
};
