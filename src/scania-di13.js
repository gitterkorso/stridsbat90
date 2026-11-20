// Decode the explorer's packed engine meshes once per Three.js runtime.
window.CB90 = window.CB90 || {};
(function () {
  const templates = new WeakMap();

  function bytes(encoded) {
    const binary = atob(encoded);
    const data = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
    return data;
  }

  function unpackGeometry(THREE, source, units) {
    const xyz = new DataView(bytes(source.positions).buffer);
    const positions = new THREE.Float32BufferAttribute(xyz.byteLength / 2, 3);
    for (let i = 0; i < positions.array.length; i++) positions.array[i] = xyz.getInt16(i * 2, true) / units;

    const triangles = new DataView(bytes(source.indices).buffer);
    const indices = new THREE.Uint16BufferAttribute(triangles.byteLength / 2, 1);
    for (let i = 0; i < indices.count; i++) indices.array[i] = triangles.getUint16(i * 2, true);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positions);
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(bytes(source.normals).buffer), 3, true));
    geometry.setAttribute('color', new THREE.BufferAttribute(bytes(source.colors), 3, true));
    geometry.setIndex(indices);
    return geometry;
  }

  function makeTemplate(THREE, asset) {
    const finish = (name, metalness, roughness) =>
      new THREE.MeshStandardMaterial({ name, vertexColors: true, metalness, roughness });
    const materials = {
      paint: finish('paint', .18, .54),
      metal: finish('metal', .72, .36),
      rubber: finish('rubber', .02, .86),
    };
    const group = new THREE.Group();
    group.name = 'Scania DI13';
    for (const source of asset.nodes) {
      const part = new THREE.Group();
      part.name = source.name;
      part.position.fromArray(source.pivot);
      part.rotation.x = source.phase;
      part.userData = { phase: source.phase, speed: source.speed };
      for (const surface of source.meshes) {
        const geometry = unpackGeometry(THREE, surface, asset.unitsPerModelUnit);
        const mesh = new THREE.Mesh(geometry, materials[surface.finish]);
        mesh.castShadow = mesh.receiveShadow = true;
        part.add(mesh);
      }
      group.add(part);
    }
    return group;
  }

  CB90.buildDI13 = function (THREE) {
    if (!templates.has(THREE)) templates.set(THREE, makeTemplate(THREE, CB90.di13Asset));
    const group = templates.get(THREE).clone();
    const rotatingParts = group.children.filter(part => part.userData.speed !== 0);
    function setAngle(radians) {
      for (const part of rotatingParts) part.rotation.x = part.userData.phase + part.userData.speed * radians;
    }
    setAngle(0);
    return { group, setAngle };
  };
})();
