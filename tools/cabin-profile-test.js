#!/usr/bin/env node
// The measured CB90 H cabin must keep its shape and usable interior when its datum moves.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const THREE = require(path.join(root, 'src/vendor/three.min.js'));
const noop = () => {};
const imageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
const canvasContext = new Proxy({
  createImageData: imageData, getImageData: (_x, _y, w, h) => imageData(w, h),
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
  measureText: text => ({ width: String(text).length * 12 }),
}, { get: (target, key) => key in target ? target[key] : noop });
const context = { THREE, console, document: { createElement: () => ({ width: 300, height: 150, getContext: () => canvasContext }) } };
context.window = context;
vm.createContext(context);
for (const file of ['constants.js', 'util.js', 'superstructure.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'src', file), 'utf8'), context, { filename: file });
}
const CB90 = context.CB90, M = CB90.M;
const cabin = CB90.buildSuperstructure(THREE);
cabin.group.updateMatrixWorld(true);
const bounds = object => new THREE.Box3().setFromObject(object);
let passed = 0;
function test(name, check) { check(); passed++; console.log('PASS ' + name); }
function vertices(object) {
  const result = [];
  object.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) result.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld));
  });
  return result;
}

test('Cabin silhouette matches the measured roof height and raked aft bulkhead', () => {
  assert.ok(Math.abs(bounds(cabin.parts.roof).max.y - (M.WH_ROOF_Y + 0.085)) < 0.005, 'Closed roof lids must sit on the roof');
  assert.ok(Math.abs(M.WH_ROOF_Y - 2.50) < 0.03, 'The cabin is taller than the product-sheet silhouette');
  const p = vertices(cabin.parts.aftWall.children[0]);
  const minY = Math.min(...p.map(v => v.y)), maxY = Math.max(...p.map(v => v.y));
  const aftXAt = y => Math.min(...p.filter(v => Math.abs(v.y - y) < 0.025).map(v => v.x));
  assert.ok(aftXAt(maxY) - aftXAt(minY) > 0.40, 'Aft wall must slope forward towards the roof');
  assert.ok(Math.abs(aftXAt(minY) - M.WH_AFT_BASE_X) < 0.04, 'Lower aft edge is at the wrong longitudinal station');
});

test('The 845 large aft side pane follows the sloping rear pillar and stays below the roof', () => {
  for (const side of ['P', 'S']) {
    const panes = cabin.parts['sideWindows' + side];
    assert.equal(panes.length, 2);
    const p = vertices(panes[0]), box = bounds(panes[0]);
    const rearAt = y => Math.min(...p.filter(v => Math.abs(v.y - y) < 0.08).map(v => v.x));
    assert.ok(rearAt(box.max.y) - rearAt(box.min.y) > 0.20, 'Aft side-window pillar is still vertical');
    assert.ok(box.max.x - box.min.x > 1.30, 'The broad 845 aft pane has been replaced by the narrower GA-803 pane');
    for (const pane of panes) {
      const b = bounds(pane);
      assert.ok(b.max.y < M.WH_ROOF_Y - 0.04 && b.min.y > M.WH_BASE_Y + 0.35, 'A side pane crosses the roof or lower panel');
    }
  }
});

test('Broad aft glazing leaves an open companionway beneath it', () => {
  assert.equal(cabin.parts.aftWindows.length, 2);
  for (const pane of cabin.parts.aftWindows) {
    const b = bounds(pane);
    assert.ok(b.max.z - b.min.z > 0.90 * M.WH_WIDTH_SCALE && b.max.y - b.min.y > 0.38, 'Rear panes are undersized');
  }
  for (const z of [-0.25, 0, 0.25]) {
    const ray = new THREE.Raycaster(new THREE.Vector3(M.WH_AFT_BASE_X - 0.20, M.WH_BASE_Y + 0.20, z), new THREE.Vector3(1, 0, 0));
    assert.equal(ray.intersectObject(cabin.parts.aftWall, true).length, 0, 'The sloped rear bulkhead blocks the companionway');
  }
});

test('Low centre aisle, raised helm and controls remain inside the cabin', () => {
  const b = bounds(cabin.parts.interior);
  assert.ok(Math.abs(cabin.parts.cabinBounds.floorY - M.TROOP_FLOOR_Y) < 1e-6, 'Walkable floor is disconnected from the cabin floor');
  assert.ok(Math.abs(bounds(cabin.parts.cabinSole).max.y - M.TROOP_FLOOR_Y) < 0.003, 'Cabin sole stayed at its old height');
  assert.ok(b.max.y <= M.WH_ROOF_Y - 0.05, 'Interior equipment protrudes through the roof');
  cabin.update(1 / 60, { helm: 20, engineP: 0.6, engineS: -0.4 });
  // Positive helm is clockwise viewed from the seat (+X forward).
  assert.ok(cabin.parts.helmWheel.rotation.x > 1 && cabin.parts.throttleP.rotation.z < 0 && cabin.parts.throttleS.rotation.z > 0, 'Bridge controls lost their articulation');
});
test('Three separate front windows leave a clear centre view and carry top-mounted wipers', () => {
  // 925 foredeck photograph and Dockstavarvet CB90H-113 forward-quarter photo.
  assert.equal(cabin.parts.frontWindows.length,3);
  assert.equal(cabin.parts.frontWipers.length,3);
  const boxes=cabin.parts.frontWindows.map(bounds).sort((a,b)=>a.min.z-b.min.z);
  assert.ok(boxes[1].min.z<-.35 && boxes[1].max.z>.35,'A centreline mullion must not split the centre glass');
  assert.ok(boxes[0].max.z<boxes[1].min.z && boxes[1].max.z<boxes[2].min.z,'Individual panes need solid pillars between them');
  for(const wiper of cabin.parts.frontWipers) {
    const mount=wiper.children[0].getWorldPosition(new THREE.Vector3());
    assert.ok(mount.y>M.WH_ROOF_Y-.12,'Wiper pivot should hang from the upper header');
  }
});

test('Raised pilot chairs have mounting feet in contact with their platforms', () => {
  for(const name of ['driverSeat','navigatorSeat']) {
    const feet=[];cabin.parts[name].traverse(o=>{if(o.name==='helmSeatFoot')feet.push(o);});
    assert.equal(feet.length,4);
    for(const foot of feet) {
      const b=bounds(foot),x=(b.min.x+b.max.x)/2,z=(b.min.z+b.max.z)/2;
      const ray=new THREE.Raycaster(new THREE.Vector3(x,b.min.y+.01,z),new THREE.Vector3(0,-1,0));
      const hit=ray.intersectObjects(cabin.parts.helmPlatforms,true)[0];
      assert.ok(hit && Math.abs(b.min.y-hit.point.y)<.002,'Seat support is floating above the platform');
    }
  }
});
test('Seated eye follows the elevated cushion and the seat remains below the roof',()=>{
  cabin.group.updateMatrixWorld(true);
  const cushion=bounds(cabin.parts.driverCushion),eye=cabin.parts.pilotEye.getWorldPosition(new THREE.Vector3());
  assert.ok(Math.abs(cushion.max.y-1.40)<.005,'Seat cushion stayed at the low position after the platform correction');
  assert.ok(eye.y-cushion.max.y>.70 && eye.y-cushion.max.y<.90,'Pilot viewpoint is standing above the seated body');
  assert.ok(bounds(cabin.parts.driverSeat).max.y<M.WH_ROOF_Y-.20,'Seat/headrest crosses the roof');
  assert.ok(eye.y<M.WH_ROOF_Y-.20 && eye.y>M.WH_WINDOW_SILL_Y+.20,'Seated viewpoint is outside the visible windshield band');
  const app=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
  assert.match(app,/parts\.pilotEye\.getWorldPosition\(localEye\)/,'Application must use the seat-mounted eye datum');
});

test('Older H operator layout has three monitors, keyboard and a folding middle seat',()=>{
  const displays=['plotterP','plotterP2','plotterS'].map(k=>bounds(cabin.parts[k]));
  assert.ok(displays[0].max.z<0&&displays[1].max.z<0&&displays[2].min.z>0,'Two navigator displays must be port, one driver display starboard');
  assert.ok(displays[0].max.z<displays[1].min.z,'Navigator monitors overlap');
  assert.ok(bounds(cabin.parts.navigatorKeyboard).max.z<0);
  assert.ok(bounds(cabin.parts.magneticCompass).min.y>M.WH_ROOF_Y-.4);
  const seat=cabin.articulations.find(r=>r.id==='seat_commander');
  assert.ok(seat,'Missing folding centre chair');
  cabin.group.updateMatrixWorld(true);
  const folded=bounds(seat.pivot);
  assert.ok(folded.max.z<-.33,'Stowed chair must leave the middle aisle clear');
  context.CB90.util.setArticulation(seat,1);cabin.group.updateMatrixWorld(true);
  const unfolded=bounds(seat.pivot);
  assert.ok(unfolded.max.z>0,'Deployed chair should occupy the centre crew position');
  context.CB90.util.setArticulation(seat,0);cabin.group.updateMatrixWorld(true);
  cabin.update(0,{helm:-20,bucketP:0,bucketS:1});
  assert.ok(cabin.parts.rudderNeedle.rotation.z>0,'Rudder indication does not follow helm');
  assert.ok(cabin.parts.bucketHandleP.rotation.z<0&&cabin.parts.bucketHandleS.rotation.z>0,'Bucket handles must follow each side independently');
});
console.log(passed + ' cabin-profile checks passed.');
