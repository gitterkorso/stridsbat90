#!/usr/bin/env node
// Reference 845 geometry invariants. Run: node tools/reference-test.js
// This verifies placement and orientation with real Three.js geometry; visual QA remains separate.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const THREE = require(path.join(root, 'src/vendor/three.min.js'));
const noop = () => {};
function canvas() {
  const imageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
  const context = new Proxy({
    createImageData: imageData,
    getImageData: (_x, _y, w, h) => imageData(w, h),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    measureText: text => ({ width: String(text).length * 12 }),
  }, { get: (object, key) => key in object ? object[key] : noop });
  return { width: 300, height: 150, getContext: () => context };
}
const context = { THREE, console, document: { createElement: canvas }, performance: { now: () => 0 } };
context.window = context;
vm.createContext(context);
for (const file of ['constants.js', 'util.js', 'hull.js', 'superstructure.js', 'equipment.js', 'navigation.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'src', file), 'utf8'), context, { filename: file });
}
const CB90 = context.CB90, M = CB90.M;
const hull = CB90.buildHull(THREE), cabin = CB90.buildSuperstructure(THREE), equipment = CB90.buildEquipment(THREE);
for (const module of [hull, cabin, equipment]) module.group.updateMatrixWorld(true);
const bounds = object => { assert.ok(object, 'Expected reference component is missing'); return new THREE.Box3().setFromObject(object); };
const size = object => bounds(object).getSize(new THREE.Vector3());
function points(object) {
  assert.ok(object, 'Expected measurable geometry is missing');
  object.updateMatrixWorld(true);
  const result = [];
  object.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
    const attribute = mesh.geometry.attributes.position;
    for (let i = 0; i < attribute.count; i++) result.push(new THREE.Vector3().fromBufferAttribute(attribute, i).applyMatrix4(mesh.matrixWorld));
  });
  assert.ok(result.length > 0, 'Reference component has no vertices');
  return result;
}
function capCentre(vertices, top) {
  const edge = top ? Math.max(...vertices.map(p => p.y)) : Math.min(...vertices.map(p => p.y));
  const cap = vertices.filter(p => Math.abs(p.y - edge) < 0.018);
  return cap.reduce((sum, p) => sum.add(p), new THREE.Vector3()).multiplyScalar(1 / cap.length);
}
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
}

test('The windshield leans forward in dimensions and actual glazing geometry', () => {
  assert.ok(M.WH_WS_TOP_X > M.WH_DASH_TOP_X + 0.12, 'Glass top must be forward of its sill');
  const vertices = points(cabin.parts.windscreenGlass), bottom = capCentre(vertices, false), top = capCentre(vertices, true);
  assert.ok(top.x > bottom.x + 0.12, `Built glass leans aft or stands vertical: bottom x${bottom.x}, top x${top.x}`);
  assert.ok(top.y - bottom.y > 0.45, 'The front panes must remain tall enough to see through');
  assert.ok(M.WH_X1 > M.WH_DASH_TOP_X, 'Lower cabin face must slope down and forward from the sill');
});

test('Reconstructed profile meets the product-sheet deck levels and aft deck transition', () => {
  // Independent acceptance bands around measurements of the printed scale, not manufacturing tolerances.
  assert.ok(Math.abs(M.WH_ROOF_Y-2.50)<.08,'Cabin has reverted to the old 3 m roof');
  assert.ok(Math.abs(M.TRUNK_Y-1.65)<.08,'Raised troop deck is too high');
  const rayAt=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,4,z),new THREE.Vector3(0,-1,0)).intersectObject(hull.parts.decks,true)[0];
  assert.ok(Math.abs(rayAt(3.9,1.1).point.y-1.07)<.03,'Aft deck surface is not at the reconstructed datum');
  assert.ok(Math.abs(rayAt(4.4,1.1).point.y-1.65)<.03,'Raised deck must already exist at x4.4, not start at x5.2');
  const hatch=articulation=>hull.articulations.find(r=>r.id===articulation);
  assert.ok(Math.abs(hatch('hatch_troopAft').pivot.position.x-5.35)<.03,'Troop hatch did not move with the deck transition');
});

test('Private cutaway hull materials retain the black underwater paint shader', () => {
  let checked=0;
  hull.parts.shell.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const shader={vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>'};
    mesh.material.onBeforeCompile(shader,{});
    assert.ok(shader.vertexShader.includes('vHullHeight=hullHeight'),'Cloning removed the hull-height input');
    assert.ok(shader.fragmentShader.includes('if(vHullHeight<0.10)'),'Cloning removed the underwater paint mask');
    checked++;
  });
  assert.ok(checked>=3,'All shell sections must be checked');
});

test('Each cabin side has two large, separate panes with usable height', () => {
  for (const side of ['P', 'S']) {
    const panes = cabin.parts[`sideWindows${side}`];
    assert.ok(Array.isArray(panes), `Expose the built side ${side} glazing in parts.sideWindows${side}`);
    assert.equal(panes.length, 2, `${side} must have two large side windows`);
    const boxes = panes.map(bounds).sort((a, b) => a.min.x - b.min.x);
    assert.ok(boxes[0].max.x - boxes[0].min.x >= 0.90, 'The broad aft side pane has narrowed');
    assert.ok(boxes[1].max.x - boxes[1].min.x >= 0.50, 'The forward side pane has become too narrow');
    const forward = [...panes].sort((a, b) => bounds(a).min.x - bounds(b).min.x)[1];
    const vertices = points(forward), low = Math.min(...vertices.map(p => p.y)), high = Math.max(...vertices.map(p => p.y));
    const widthAt = y => { const band = vertices.filter(p => Math.abs(p.y - y) < 0.06); return Math.max(...band.map(p => p.x)) - Math.min(...band.map(p => p.x)); };
    assert.ok(widthAt(high) > widthAt(low) + 0.10, 'The forward side pane should widen toward its forward-raked top');
    for (const box of boxes) {
      assert.ok(box.max.y - box.min.y > 0.45, 'Side windows should retain their tall viewing area');
      assert.ok(side === 'P' ? box.max.z < 0 : box.min.z > 0, 'Side glazing is on the wrong side of the boat');
    }
    assert.ok(boxes[0].max.x < boxes[1].min.x + 0.025, 'Side panes overlap rather than leaving a mullion');
  }
});

test('Twin foredeck MG stays low on the starboard pedestal and clear of the centre corridor', () => {
  const pivot = cabin.parts.twinMg;
  assert.ok(pivot, 'Twin gun articulation is missing');
  const p = pivot.getWorldPosition(new THREE.Vector3());
  assert.ok(p.x > 11.9 && p.x < 12.65, `Gun is outside the reference foredeck station: x${p.x}`);
  assert.ok(Math.abs(p.z - 0.85) < 0.12, `Twin gun must be on starboard, got z${p.z}`);
  assert.ok(p.y > 1.55 && p.y < 1.85, `Gun is not on the low foredeck (sheer 1.37 there): y${p.y}`);
  assert.ok(bounds(pivot).min.z > 0.35, 'The receiver/cradle obstructs the centre landing corridor');
  const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(pivot.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(direction.x > 0.85, 'Twin barrels should point forward at rest');
});

test('The former central MG well has a continuous low foredeck beneath it', () => {
  const x = 12.20, z = 0;
  const ray = new THREE.Raycaster(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
  const hits = ray.intersectObject(hull.group, true);
  assert.ok(hits.length > 0, 'No deck surface under the former gun well');
  const y = hits[0].point.y;
  assert.ok(y > 1.25 && y < 1.50, `Expected the low foredeck (sheer 1.38 at x 12.2), got y${y}`);
});

test('Radar uses a low compact roof pedestal, forward of the mast, with no full-width arch', () => {
  const pedestal = equipment.parts.radarPedestal, radar = equipment.parts.radarAntenna;
  assert.ok(pedestal && radar, 'Low radar pedestal and rotating antenna must remain individually available');
  const supportBounds = new THREE.Box3();
  for (const piece of pedestal.children) if (piece.isMesh) supportBounds.union(bounds(piece));
  const footprint = supportBounds.getSize(new THREE.Vector3()), position = radar.getWorldPosition(new THREE.Vector3());
  assert.ok(footprint.z < 0.8 && footprint.x < 0.8, 'Radar support has expanded into an arch');
  assert.ok(position.y > M.WH_ROOF_Y && position.y < M.WH_ROOF_Y + 0.50, 'Radar sits too high above the cabin');
  const mast = equipment.parts.mast.getWorldPosition(new THREE.Vector3());
  assert.ok(position.x > mast.x + 0.8, 'Both supplied references place radar forward of the mast');
  assert.ok(position.z > 0.35, 'Radar should be offset to starboard');
  equipment.group.traverse(mesh => {
    if (!mesh.isMesh) return;
    const box = bounds(mesh), extent = box.getSize(new THREE.Vector3());
    const bridgesAftRoof = box.min.x > 8.3 && box.max.x < 10.0 && box.min.y > M.WH_ROOF_Y - 0.08
      && box.max.y > M.WH_ROOF_Y + 0.40 && extent.z > 1.7 && extent.x < 0.4;
    assert.ok(!bridgesAftRoof, 'A tall full-width radar arch is still built above the aft roof');
  });
});

test('Thick rubber reinforcement is restricted to the bow instead of circling the hull', () => {
  const pads = equipment.parts.bowFenderPads;
  const box = bounds(pads);
  assert.ok(box.min.x > 11.35 && box.max.x > 14.6 && box.max.x - box.min.x < 3.8, 'Thick bow shoulder pads must stay on the foredeck section');
  const rubber = CB90.util.rubber();
  equipment.group.traverse(mesh => {
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (!materials.some(material => material === rubber || material.color && material.color.equals(rubber.color) && material.roughness === rubber.roughness && material.metalness === rubber.metalness)) return;
    assert.ok(size(mesh).x < 5, 'A long rubber tube still wraps the sheer; the reference uses local bow pads');
  });
});

test('Four ring-mount support legs splay outward toward their individual deck feet', () => {
  const supports = equipment.parts.ringSupportLegs;
  assert.ok(supports, 'Ring support group is missing');
  const legs = [];
  supports.traverse(mesh => { if (mesh.isMesh && mesh.name === 'ringSupportLeg') legs.push(mesh); });
  assert.equal(legs.length, 4, 'Expected four separately supported ring-mount legs');
  for (const leg of legs) {
    const vertices = points(leg), foot = capCentre(vertices, false), top = capCentre(vertices, true);
    const footRadius = Math.hypot(foot.x - M.RING_MOUNT.x, foot.z), topRadius = Math.hypot(top.x - M.RING_MOUNT.x, top.z);
    assert.ok(footRadius > topRadius + 0.12, 'Ring support is vertical or converges down toward the centre');
    assert.ok(foot.y > M.TRUNK_Y - 0.08 && foot.y < M.TRUNK_Y + 0.10, 'Ring foot is detached from the raised deck');
  }
});

test('The 845 ring-mounted gun points forward and above the cabin at rest', () => {
  const gun = equipment.parts.ringMg;
  assert.ok(gun, 'Ring-mounted gun is missing');
  const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(gun.getWorldQuaternion(new THREE.Quaternion()));
  assert.ok(direction.x > 0.80 && direction.y > 0.20 && Math.abs(direction.z) < 0.08,
    `Wrong ring-gun rest direction: ${direction.toArray().map(n => n.toFixed(3)).join(', ')}`);
  assert.ok(bounds(gun).max.y > M.WH_ROOF_Y + 0.65, 'Elevated barrel should clear the roof silhouette');
});


const modules = [hull, cabin, equipment];
const articulations = modules.flatMap(module => Array.from(module.articulations || []));
function updateWorld() { hull.update(0,{},0); for (const module of modules) module.group.updateMatrixWorld(true); }
function matrixClose(a, b, message, tolerance = 1e-9) {
  for (let i = 0; i < 16; i++) assert.ok(Math.abs(a.elements[i] - b.elements[i]) < tolerance, message);
}
function validateGeometry(label) {
  const checked = new Set(); let meshes = 0;
  for (const module of modules) module.group.traverse(mesh => {
    if (!mesh.isMesh) return;
    meshes++;
    const geometry = mesh.geometry, position = geometry.attributes.position;
    assert.ok(position && position.count, `${label}: ${mesh.name || 'mesh'} has no position vertices`);
    if (!checked.has(geometry)) {
      for (const coordinate of position.array) assert.ok(Number.isFinite(coordinate), `${label}: nonfinite vertex in ${mesh.name || 'mesh'}`);
      geometry.computeBoundingBox(); checked.add(geometry);
    }
    assert.ok(mesh.matrixWorld.elements.every(Number.isFinite), `${label}: invalid world transform in ${mesh.name || 'mesh'}`);
    const box = geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    for (const coordinate of [...box.min.toArray(), ...box.max.toArray()]) {
      assert.ok(Number.isFinite(coordinate), `${label}: invalid world bounds in ${mesh.name || 'mesh'}`);
    }
  });
  assert.ok(meshes > 200, `${label}: an expected boat module was not built`);
}

test('All public articulations preserve finite geometry at closed, halfway and fully open poses', () => {
  const expected = [
    'ramp_bow', 'hatch_bowP', 'hatch_bowS', 'door_wtFwd', 'hatch_troopAft',
    'hatch_engineP', 'hatch_engineS', 'hatch_engineCompanion', 'door_engine',
    'hatch_roofP', 'hatch_roofS', 'hatch_consoleP', 'hatch_consoleS', 'elev_twinMg',
    'mast_signal', 'turret_ring', 'seat_commander',
  ];
  assert.deepEqual(articulations.map(record => record.id).sort(), expected.sort(), 'Public IDs changed or an articulation was lost/duplicated');
  const previous = articulations.map(record => record.value), closed = new Map();
  try {
    for (const value of [0, 0.5, 1]) {
      for (const record of articulations) {
        CB90.util.setArticulation(record, value);
        assert.equal(record.value, value, `${record.id}: public setter did not apply the pose`);
        if (value === 0) closed.set(record.id, record.pivot.quaternion.clone());
        if (value === 0.5) assert.ok(record.pivot.quaternion.angleTo(closed.get(record.id)) > 0.10, `${record.id}: halfway pose does not move its hinge`);
      }
      updateWorld(); validateGeometry(`all articulations=${value}`);
    }
  } finally {
    articulations.forEach((record, i) => CB90.util.setArticulation(record, previous[i])); updateWorld();
  }
});

test('The stem is the low, raked landing bow of the Dockstavarvet profile and plan', () => {
  const st = x => CB90.util.stationAt(x);
  assert.ok(Math.abs(st(M.STEM_X).deckY - 1.10) < 0.03, `Stem deck corner must be 1.10 m above the waterline, got ${st(M.STEM_X).deckY}`);
  assert.ok(st(M.STEM_X).deckY < st(12.0).deckY - 0.2 && st(12.0).deckY < st(9.0).deckY, 'The sheer must fall toward the bow (reverse sheer forward)');
  for (const [x, y] of [[13.00, 0.00], [14.05, 0.40], [14.4, 0.62], [14.87, 0.97]]) assert.ok(Math.abs(st(x).keelY - y) < 0.03, `Stem line at x${x}: expected y${y}, got ${st(x).keelY}`);
  for (const [x, z] of [[13.5, 1.01], [14.0, 0.82], [14.5, 0.66], [14.87, 0.52]]) assert.ok(Math.abs(st(x).deckZ - z) < 0.05, `Deck half-breadth at x${x}: expected ${z}, got ${st(x).deckZ}`);
  // Independent written nominal waterline length: SHK RM 2008:02, p12.
  const crossing=CB90.STATIONS.findIndex((p,i,a)=>i>0&&p.keelY>=0&&a[i-1].keelY<0);
  assert.ok(crossing>0,'Stem must cross the design waterline');
  const a=CB90.STATIONS[crossing-1],b=CB90.STATIONS[crossing];
  const waterlineEnd=a.x+(b.x-a.x)*(-a.keelY)/(b.keelY-a.keelY);
  assert.ok(Math.abs(waterlineEnd-13.00)<.005,`Nominal LWL must be 13.00 m; actual stem intersection ${waterlineEnd}`);
  assert.ok(st(14.4).keelZ > 0.25 && st(14.4).keelZ < st(14.4).deckZ, 'The stem face must be a blunt raked plate, not a knife edge');
  const ramp = articulations.find(record => record.id === 'ramp_bow'), panel = hull.parts.bowRamp;
  assert.ok(ramp && panel, 'Raked stävport panel is missing');
  const previous = ramp.value;
  try {
    CB90.util.setArticulation(ramp, 0); updateWorld();
    const vertices = points(panel), low = Math.min(...vertices.map(p => p.y)), high = Math.max(...vertices.map(p => p.y));
    const bottom = vertices.filter(p => p.y < low + 0.03), top = vertices.filter(p => p.y > high - 0.03);
    const xAt = list => list.reduce((s, p) => s + p.x, 0) / list.length;
    const rakeDeg = Math.atan2(xAt(top) - xAt(bottom), high - low) * 180 / Math.PI;
    assert.ok(rakeDeg > 48 && rakeDeg < 60, `Closed stävport should rake ~54° from vertical, got ${rakeDeg.toFixed(1)}°`);
    assert.ok(xAt(top) > 14.75 && xAt(top) < 14.92, `Top of the closed ramp should reach the stem nose, got x${xAt(top).toFixed(2)}`);
    assert.ok(Math.abs(low - M.RAMP_HINGE_Y) < 0.08, `Ramp bottom should sit on the sill at y${M.RAMP_HINGE_Y}, got ${low.toFixed(2)}`);
    const shell = new THREE.Box3().setFromObject(hull.parts.shell);
    assert.ok(shell.max.x > M.STEM_X - 0.02 && shell.max.x < M.STEM_X + 0.02, `Shell must end at the stem deck corner x${M.STEM_X}, got ${shell.max.x.toFixed(3)}`);
    assert.ok(shell.min.y < -0.79, 'Keel depth lost');
  } finally { CB90.util.setArticulation(ramp, previous); updateWorld(); }
});

test('Bow-ramp rubber follows the moving ramp while the fixed shoulder pads remain in place', () => {
  const ramp = articulations.find(record => record.id === 'ramp_bow'), bumper = hull.parts.bowBumper;
  assert.ok(ramp && bumper && hull.parts.bowRamp, 'Ramp panel or its rubber face is missing');
  const previous = ramp.value;
  try {
    CB90.util.setArticulation(ramp, 0); updateWorld();
    const inverse = ramp.pivot.matrixWorld.clone().invert();
    const localBumper = new THREE.Matrix4().multiplyMatrices(inverse, bumper.matrixWorld);
    const localPanel = new THREE.Matrix4().multiplyMatrices(inverse, hull.parts.bowRamp.matrixWorld);
    const fixedPads = equipment.parts.bowFenderPads.matrixWorld.clone();
    const closedCentre = bounds(bumper).getCenter(new THREE.Vector3());
    for (const value of [0.5, 1]) {
      CB90.util.setArticulation(ramp, value); updateWorld();
      const nowInverse = ramp.pivot.matrixWorld.clone().invert();
      matrixClose(new THREE.Matrix4().multiplyMatrices(nowInverse, bumper.matrixWorld), localBumper, 'Rubber face detached from the ramp transform');
      matrixClose(new THREE.Matrix4().multiplyMatrices(nowInverse, hull.parts.bowRamp.matrixWorld), localPanel, 'Ramp panel detached from its hinge');
      matrixClose(equipment.parts.bowFenderPads.matrixWorld, fixedPads, 'Fixed bow shoulders moved with the ramp');
    }
    const openCentre = bounds(bumper).getCenter(new THREE.Vector3());
    assert.ok(openCentre.y < closedCentre.y - 0.6 && openCentre.x > closedCentre.x - 0.1,
      'Lowering the raked bow ramp must swing its nose rubber down to the water without pulling it back into the hull');
    assert.ok(Math.abs(openCentre.y) < 0.40, `The lowered ramp tip should reach the waterline, nose at y${openCentre.y.toFixed(2)}`);
  } finally { CB90.util.setArticulation(ramp, previous); updateWorld(); }
});

test('Twin-gun pedestal stays on the low deck while both barrels elevate together', () => {
  const record = articulations.find(item => item.id === 'elev_twinMg'), base = cabin.parts.twinMgBase;
  assert.ok(record && base, 'Twin-gun fixed base or elevation articulation is missing');
  const basePosition = base.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(basePosition.y - CB90.util.deckYAt(basePosition.x, basePosition.z)) < 0.03, 'Twin-gun base floats above or penetrates the foredeck');
  const barrels = ['twinBarrelP', 'twinBarrelS'].map(name => cabin.group.getObjectByName(name));
  assert.ok(barrels.every(Boolean), 'Both twin-gun barrel meshes must be present');
  const previous = record.value;
  try {
    CB90.util.setArticulation(record, 0); updateWorld();
    const fixedBase = base.matrixWorld.clone();
    const closed = barrels.map(barrel => barrel.getWorldPosition(new THREE.Vector3()));
    for (const value of [0.5, 1]) {
      CB90.util.setArticulation(record, value); updateWorld();
      matrixClose(base.matrixWorld, fixedBase, 'Elevating the gun also moved the fixed pedestal');
      const current = barrels.map(barrel => barrel.getWorldPosition(new THREE.Vector3()));
      assert.ok(current.every((point, i) => point.y > closed[i].y + 0.05), 'Both barrels must rise during elevation');
      assert.ok(Math.abs(current[0].distanceTo(current[1]) - closed[0].distanceTo(closed[1])) < 1e-9, 'Twin barrels changed their fixed separation');
    }
  } finally { CB90.util.setArticulation(record, previous); updateWorld(); }
});


test('Closed engine and forward doors block crossing; opening each door permits passage', () => {
  for (const [id, x] of [['door_engine', 4], ['door_wtFwd', M.WH_DOOR_X]]) {
    const hatches = { door_engine: { value: 1 }, door_wtFwd: { value: 1 } };
    for (const direction of [-1, 1]) {
      const current = { x: x - direction * 0.30, z: 0 }, destination = x + direction * 0.30;
      hatches[id].value = 0;
      assert.equal(CB90.canWalkAt(current, destination, 0, hatches), false, `${id}: walking passes through a shut door`);
      hatches[id].value = 0.5;
      assert.equal(CB90.canWalkAt(current, destination, 0, hatches), false, `${id}: partly open door is not yet clear`);
      hatches[id].value = 1;
      assert.equal(CB90.canWalkAt(current, destination, 0, hatches), true, `${id}: opening the door does not clear its passage`);
    }
  }
});

test('A person can retreat if a closing door surrounds them, without crossing the closed leaf', () => {
  const hatches = { door_engine: { value: 0 }, door_wtFwd: { value: 0 } };
  for (const [id, x] of [['door_engine', 4], ['door_wtFwd', M.WH_DOOR_X]]) {
    for (const side of [-1, 1]) {
      const current = { x: x + side * 0.04, z: 0 };
      assert.equal(CB90.canWalkAt(current, x + side * 0.22, 0, hatches), true, `${id}: closing the door traps a person on side ${side}`);
      assert.equal(CB90.canWalkAt(current, x + side * 0.02, 0, hatches), false, `${id}: walking deeper into a closed door remains possible`);
      assert.equal(CB90.canWalkAt(current, x - side * 0.22, 0, hatches), false, `${id}: retreat logic permits crossing the door`);
    }
  }
});

test('Open doors connect the centre aisle from engine room to bow, with continuous floor at the relocated portal', () => {
  const hatches = { door_engine: { value: 1 }, door_wtFwd: { value: 1 } };
  let current = { x: 1, z: 0 };
  for (let x = 1.05; x <= M.RAMP_HINGE_X - 0.10; x += 0.05) {
    assert.equal(CB90.canWalkAt(current, x, 0, hatches), true, `The centre aisle is disconnected at x${x.toFixed(2)}`);
    assert.ok(Number.isFinite(CB90.walkFloorAt(x)), `Invalid walk floor at x${x}`);
    current = { x, z: 0 };
  }
  for (const boundary of [7.35, 8.6, M.WH_DOOR_X, M.RAMP_HINGE_X]) {
    const before = CB90.walkFloorAt(boundary - 0.0001), after = CB90.walkFloorAt(boundary + 0.0001);
    assert.ok(Math.abs(after - before) < 0.001, `Walk-floor jump at x${boundary}`);
  }
  assert.ok(Math.abs(CB90.walkFloorAt(M.WH_DOOR_X) - M.TROOP_FLOOR_Y) < 0.01, 'Relocated forward door no longer meets the cabin floor');
  assert.ok(Math.abs(CB90.walkFloorAt(M.RAMP_HINGE_X) - (M.RAMP_HINGE_Y + M.RAMP_T)) < 0.10, 'Bow-corridor exit floor does not meet the ramp sill level');
  assert.equal(CB90.canWalkAt(current, M.RAMP_HINGE_X + 0.1, 0, hatches), false, 'Walking should not continue out through the closed stävport');
  assert.equal(CB90.canWalkAt({ x: M.WH_DOOR_X + 0.3, z: 0 }, M.WH_DOOR_X + 0.3, 0.50, hatches), false, 'The narrow bow corridor allows walking through its side wall');
});

test('Foredeck switches between the complete gun and the reference cover', () => {
  assert.equal(cabin.parts.twinGunMount.visible, false);
  assert.equal(cabin.parts.foredeckCover.visible, true);
  for(const on of [true,false,true,false]) {
    cabin.setForedeckGun(on);
    assert.equal(cabin.parts.twinGunMount.visible,on);
    assert.equal(cabin.parts.foredeckCover.visible,!on);
  }
  const cover=bounds(cabin.parts.foredeckCover);
  assert.ok(cover.min.z>.55, 'Cover must leave the centre hatch clear');
  assert.ok(cover.max.y<2, 'Cover should be low, below the windscreen');
  for(const p of points(cabin.parts.foredeckCover)) {
    assert.ok(Math.abs(p.z)<CB90.util.stationAt(p.x).deckZ-.09,'Cover protrudes through the bow side or removes the gunwale margin');
  }
  assert.equal(hull.parts.bowMooringLine.parent,hull.articulations.find(r=>r.id==='hatch_bowS').pivot);
});

test('Photo correction keeps rubber at the bow corners, wide side decks and a central guard', () => {
  const pads=bounds(equipment.parts.bowFenderPads);
  assert.ok(pads.min.x>=13.60 && pads.max.x-pads.min.x<1.30,'Bow rubber extends aft toward the cover');
  for(const x of [8.7,9.5,10.5,11.0]) {
    const width=CB90.util.stationAt(x).deckZ-CB90.util.trunkHalfW(x);
    assert.ok(width>.39,'Side passage is still pinched by the cabin pedestal');
    assert.ok(CB90.util.deckYAt(x,1.53)<1.35,'Side passage remains raised/blocked');
  }
  const rail=bounds(equipment.parts.bridgeWingRails);
  assert.ok(rail.min.z<-.75 && rail.max.z>.75,'Guard must span the middle windscreen');
  assert.ok(rail.max.z<.85 && rail.min.z>-.85,'Old side wing rails remain');
  assert.equal(equipment.parts.deckContacts.filter(c=>c.kind==='front-rail-foot').length,2);
});

console.log(`${passed} reference checks passed${failed ? `; ${failed} failed` : ''}.`);
process.exitCode = failed ? 1 : 0;
