// Local seabed height field for the sea shader. RG stores a linear 16-bit height,
// -24..8 metres; samples are 4 m apart, with the first sample at seabedOrigin.
window.CB90 = window.CB90 || {};
CB90.createWaterDepth = function (THREE) {
  'use strict';
  const SIZE = 128, CELL = 4, SPAN = (SIZE - 1) * CELL;
  const MIN_HEIGHT = -24, HEIGHT_RANGE = 32, RECENTER = 64, ROWS_PER_UPDATE = 4;
  function texture() {
    const data = new Uint8Array(SIZE * SIZE * 4);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    const t = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.generateMipmaps = false; t.flipY = false; t.unpackAlignment = 1;
    t.encoding = THREE.LinearEncoding; t.needsUpdate = true;
    return t;
  }
  let active = texture(), staging = texture(), world = null, job = null;
  const uniforms = {
    seabedMap: { value: active }, seabedOrigin: { value: new THREE.Vector2() },
    seabedSpan: { value: SPAN }, seabedReady: { value: 0 }
  };
  // BA carries the signed seabed gradient, so shoreline reflection and foam use
  // the same coast as the depth shading without four extra fragment lookups.
  const glsl = `
    uniform sampler2D seabedMap;
    uniform vec2 seabedOrigin;
    uniform float seabedSpan, seabedReady;
    void seabed(vec2 p,out float bottom,out vec2 gradient,out float coverage){
      vec2 uv=(p-seabedOrigin)/seabedSpan;
      vec2 edge=min(uv,1.0-uv);
      coverage=seabedReady*smoothstep(0.0,0.065,min(edge.x,edge.y));
      vec4 packed=texture2D(seabedMap,(clamp(uv,0.0,1.0)*127.0+0.5)/128.0);
      bottom=-24.0+dot(packed.rg,vec2(65280.0,255.0))/65535.0*32.0;
      gradient=(packed.ba*255.0-128.0)/63.0;
    }
  `;
  function begin(x, z) {
    // Keep every generation on the same world grid, including negative positions.
    job = { x: Math.round((x - SPAN / 2) / CELL) * CELL,
      z: Math.round((z - SPAN / 2) / CELL) * CELL, row: 0 };
  }
  function rows(count) {
    const end = Math.min(SIZE, job.row + count), data = staging.image.data;
    for (; job.row < end; job.row++) {
      const z = job.z + job.row * CELL;
      for (let i = 0; i < SIZE; i++) {
        const height = world.height(job.x + i * CELL, z);
        const normalized = Number.isFinite(height) ? Math.max(0, Math.min(1, (height - MIN_HEIGHT) / HEIGHT_RANGE)) : 0;
        const packed = Math.round(normalized * 65535), index = (job.row * SIZE + i) * 4;
        data[index] = packed >>> 8; data[index + 1] = packed & 255;
      }
    }
    if (job.row === SIZE) {
      const height = i => MIN_HEIGHT + (data[i * 4] * 256 + data[i * 4 + 1]) / 65535 * HEIGHT_RANGE;
      for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
        const i = z * SIZE + x;
        const dx = (height(z * SIZE + Math.min(SIZE - 1, x + 1)) - height(z * SIZE + Math.max(0, x - 1))) / (CELL * (x === 0 || x === SIZE - 1 ? 1 : 2));
        const dz = (height(Math.min(SIZE - 1, z + 1) * SIZE + x) - height(Math.max(0, z - 1) * SIZE + x)) / (CELL * (z === 0 || z === SIZE - 1 ? 1 : 2));
        data[i * 4 + 2] = Math.round(Math.max(-2, Math.min(2, dx)) * 63 + 128);
        data[i * 4 + 3] = Math.round(Math.max(-2, Math.min(2, dz)) * 63 + 128);
      }
      // Publish data and its matching coordinates together. Never expose partial rows.
      const old = active; active = staging; staging = old;
      active.needsUpdate = true;
      uniforms.seabedMap.value = active;
      uniforms.seabedOrigin.value.set(job.x, job.z);
      uniforms.seabedReady.value = 1;
      job = null;
    }
  }
  function setWorld(next) {
    job = null; uniforms.seabedReady.value = 0;
    world = next && typeof next.height === 'function' ? next : null;
    if (!world) return;
    const start = world.start || {};
    begin(Number.isFinite(start.x) ? start.x : 0, Number.isFinite(start.z) ? start.z : 0);
    // Initial sampling happens during the world's existing loading/rebuild phase.
    rows(SIZE);
  }
  function update(x, z) {
    if (!world || !Number.isFinite(x) || !Number.isFinite(z)) return;
    if (job && Math.hypot(x - job.x - SPAN / 2, z - job.z - SPAN / 2) > SPAN / 4) begin(x, z);
    if (!job) {
      const origin = uniforms.seabedOrigin.value;
      if (Math.hypot(x - origin.x - SPAN / 2, z - origin.y - SPAN / 2) < RECENTER) return;
      begin(x, z);
    }
    rows(ROWS_PER_UPDATE);
  }
  function sample(x, z) {
    if (!uniforms.seabedReady.value) return { bottom: -24, dx: 0, dz: 0, coverage: 0 };
    const u = (x - uniforms.seabedOrigin.value.x) / SPAN, v = (z - uniforms.seabedOrigin.value.y) / SPAN;
    const edge = Math.max(0, Math.min(1, Math.min(u, v, 1 - u, 1 - v) / .065));
    const gx = Math.max(0, Math.min(SIZE - 1.000001, u * (SIZE - 1)));
    const gz = Math.max(0, Math.min(SIZE - 1.000001, v * (SIZE - 1)));
    const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
    const data = active.image.data, i = (iz * SIZE + ix) * 4;
    const channel = c => (data[i + c] * (1 - fx) + data[i + 4 + c] * fx) * (1 - fz)
      + (data[i + SIZE * 4 + c] * (1 - fx) + data[i + (SIZE + 1) * 4 + c] * fx) * fz;
    return { bottom: MIN_HEIGHT + (channel(0) * 256 + channel(1)) / 65535 * HEIGHT_RANGE,
      dx: (channel(2) - 128) / 63, dz: (channel(3) - 128) / 63, coverage: edge * edge * (3 - 2 * edge) };
  }
  return { uniforms, glsl, setWorld, update, sample };
};
