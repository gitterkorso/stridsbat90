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
  return { uniforms, setWorld, update };
};
