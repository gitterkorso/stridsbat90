// GPU view of the simulated hull waves. Filtered 16-bit heights and slopes keep
// displacement and normals consistent, including steep storm-driven crests.
window.CB90 = window.CB90 || {};
CB90.createHullWaveSurface = function (THREE) {
  'use strict';
  const field = CB90.createHullWaves();
  function layer(grid) {
    const size = grid.size;
    const data = new Uint8Array(size * size * 4), slopes = new Uint8Array(size * size * 4);
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    const slopeTexture = new THREE.DataTexture(slopes, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    for (const map of [texture, slopeTexture]) {
      map.minFilter = map.magFilter = THREE.LinearFilter;
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
      map.generateMipmaps = false; map.flipY = false;
      map.encoding = THREE.LinearEncoding; map.unpackAlignment = 1;
    }
    return { grid, data, slopes, texture, slopeTexture, origin: { value: new THREE.Vector2() },
      layout: { value: new THREE.Vector2(size, grid.span) }, revision: -1 };
  }
  const near = layer(field), far = layer(field.farField);
  const uniforms = {};
  for (const [prefix, map] of [['hullWave', near], ['farHullWave', far]]) {
    uniforms[prefix + 'Map'] = { value: map.texture };
    uniforms[prefix + 'SlopeMap'] = { value: map.slopeTexture };
    uniforms[prefix + 'Origin'] = map.origin;
    uniforms[prefix + 'Layout'] = map.layout;
  }
  uniforms.hullWaveBlend = { value: new THREE.Vector2(field.blendStart, field.blendEnd) };
  uniforms.hullWaveBlendOrigin = { value: new THREE.Vector2() };
  const glsl = `
    uniform sampler2D hullWaveMap, hullWaveSlopeMap, farHullWaveMap, farHullWaveSlopeMap;
    uniform vec2 hullWaveOrigin, hullWaveLayout, farHullWaveOrigin, farHullWaveLayout, hullWaveBlend, hullWaveBlendOrigin;
    float waveLayer(vec2 p,sampler2D heights,sampler2D normals,vec2 origin,vec2 gridLayout,out vec2 slope){
      vec2 uv=(p-origin)/gridLayout.y;
      vec2 texel=(clamp(uv,0.0,1.0)*(gridLayout.x-1.0)+0.5)/gridLayout.x;
      float coverage=step(0.0,min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y)));
      vec4 packed=texture2D(heights,texel);
      // Exactly zero at integer code 32768; RG decoding commutes with bilinear filtering.
      float h=(dot(packed.rg,vec2(65280.0,255.0))-32768.0)/8191.0;
      vec4 gradients=texture2D(normals,texel);
      slope=(vec2(dot(gradients.rg,vec2(65280.0,255.0)),dot(gradients.ba,vec2(65280.0,255.0)))-32768.0)/8191.0*coverage;
      return h*coverage;
    }
    float hullWave(vec2 p,out vec2 slope){
      vec2 nearSlope,farSlope;
      float a=waveLayer(p,hullWaveMap,hullWaveSlopeMap,hullWaveOrigin,hullWaveLayout,nearSlope);
      float b=waveLayer(p,farHullWaveMap,farHullWaveSlopeMap,farHullWaveOrigin,farHullWaveLayout,farSlope);
      vec2 local=p-hullWaveBlendOrigin,edge=min(local,hullWaveLayout.y-local);
      float distance=min(edge.x,edge.y);
      float f=clamp((distance-hullWaveBlend.x)/(hullWaveBlend.y-hullWaveBlend.x),0.0,1.0);
      float blend=f*f*(3.0-2.0*f);
      vec2 direction=edge.x<edge.y?vec2(local.x<hullWaveLayout.y*0.5?1.0:-1.0,0.0):vec2(0.0,local.y<hullWaveLayout.y*0.5?1.0:-1.0);
      slope=mix(farSlope,nearSlope,blend)+(a-b)*direction*6.0*f*(1.0-f)/(hullWaveBlend.y-hullWaveBlend.x);
      return mix(b,a,blend);
    }
    void sea(vec2 p,out float height,out vec2 slope){
      ambientSea(p,height,slope);
      vec2 hullSlope;
      height+=hullWave(p,hullSlope);
      slope+=hullSlope;
    }
  `;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function syncLayer(map) {
    const { grid, data, slopes, texture, slopeTexture } = map;
    if (map.revision === grid.revision) return;
    const heights = grid.height, size = grid.size, cell = grid.cell;
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
    map.origin.value.set(grid.origin.x, grid.origin.z);
    texture.needsUpdate = true;
    slopeTexture.needsUpdate = true;
    map.revision = grid.revision;
  }
  function sync() {
    syncLayer(near); syncLayer(far);
    uniforms.hullWaveBlendOrigin.value.set(field.blendOrigin.x, field.blendOrigin.z);
  }
  function update(t, state, pose) { field.update(t, state, pose); sync(); }
  function reset(nav, pose) { field.reset(nav, pose); sync(); }
  function setWorld(world) { field.setWorld(world); sync(); }
  sync();
  return { uniforms, glsl, update, reset, setWorld, sample: field.sample, stats: field.stats, field };
};
