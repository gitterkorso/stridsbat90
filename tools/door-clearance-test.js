#!/usr/bin/env node
// Cross-module clearance of the forward door, including handles, against actual
// fixed cabin geometry throughout its sweep, plus the folding centre seat and
// the engine/bucket levers. Run: node tools/door-clearance-test.js
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),THREE=require(path.join(root,'src/vendor/three.min.js'));
const noop=()=>{},imageData=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
const drawing=new Proxy({createImageData:imageData,getImageData:(_x,_y,w,h)=>imageData(w,h),
  createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),
  measureText:t=>({width:String(t).length*12})},{get:(o,k)=>k in o?o[k]:noop});
const context={THREE,console,document:{createElement:()=>({width:300,height:150,getContext:()=>drawing})}};
context.window=context;vm.createContext(context);
for(const f of ['constants.js','util.js','hull.js','superstructure.js','navigation.js'])
  vm.runInContext(fs.readFileSync(path.join(root,'src',f),'utf8'),context,{filename:f});
const CB=context.CB90,U=CB.util,hull=CB.buildHull(THREE),cabin=CB.buildSuperstructure(THREE);
const door=hull.articulations.find(r=>r.id==='door_wtFwd');
assert.ok(door,'Forward watertight door is missing');
[hull,cabin].forEach(m=>m.group.updateMatrixWorld(true));
const poses=Array.from({length:21},(_,i)=>i/20),swept=new THREE.Box3();
for(const value of poses){U.setArticulation(door,value);hull.update();hull.group.updateMatrixWorld(true);swept.union(new THREE.Box3().setFromObject(door.pivot));}
const candidates=[],vicinity=swept.clone().expandByScalar(.15);
cabin.parts.interior.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh)return;
  const box=new THREE.Box3().setFromObject(mesh);
  if(vicinity.intersectsBox(box))candidates.push({mesh,box});
});
assert.ok(candidates.length>0,'Clearance check found no nearby fixed cabin geometry');
const ray=new THREE.Raycaster(),a=new THREE.Vector3(),b=new THREE.Vector3(),direction=new THREE.Vector3();
function crossing(targets,movingGroup=door.pivot,allowContact=()=>false){
  let collision=null;
  movingGroup.traverse(moving=>{
    if(collision||!moving.isMesh)return;
    const bound=new THREE.Box3().setFromObject(moving),nearby=targets.filter(t=>t.box.intersectsBox(bound));
    if(!nearby.length)return;
    const geometry=moving.geometry,index=geometry.index,positions=geometry.attributes.position,n=index?index.count:positions.count;
    for(let triangle=0;triangle<n&&!collision;triangle+=3)for(let edge=0;edge<3&&!collision;edge++){
      const i=triangle+edge,j=triangle+(edge+1)%3;
      a.fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(moving.matrixWorld);
      b.fromBufferAttribute(positions,index?index.getX(j):j).applyMatrix4(moving.matrixWorld);
      direction.subVectors(b,a);const length=direction.length();if(length<.002)continue;direction.divideScalar(length);
      ray.set(a,direction);ray.near=.001;ray.far=length-.001;
      for(const {mesh} of nearby){
        const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material],sides=materials.map(m=>m.side);
        materials.forEach(m=>m.side=THREE.DoubleSide);
        const hits=ray.intersectObject(mesh,false);
        materials.forEach((m,i)=>m.side=sides[i]);
        const hit=hits.find(hit=>!allowContact(hit.point,mesh,moving));
        if(hit){collision={part:mesh.name||mesh.parent?.name||mesh.geometry.type,point:hit.point.toArray()};break;}
      }
    }
  });
  return collision;
}
for(const value of poses){
  U.setArticulation(door,value);hull.update();hull.group.updateMatrixWorld(true);
  const hit=crossing(candidates);
  assert.equal(hit,null,`Forward door intersects cabin at ${(value*100).toFixed(0)}%: ${JSON.stringify(hit)}`);
}
console.log(`PASS Forward door and its handles clear ${candidates.length} nearby cabin meshes in all ${poses.length} poses`);
// A deliberately blocking solid validates the intersection detector itself.
// Its centre follows an actual moving-panel edge, without duplicating any cabin dimensions.
U.setArticulation(door,.5);hull.update();hull.group.updateMatrixWorld(true);
const leaf=door.pivot.children.find(m=>m.isMesh),p=leaf.geometry.attributes.position;
const centre=new THREE.Vector3().fromBufferAttribute(p,0).applyMatrix4(leaf.matrixWorld);
const blocker=new THREE.Mesh(new THREE.BoxGeometry(.15,.15,.15),new THREE.MeshBasicMaterial());blocker.position.copy(centre);blocker.updateMatrixWorld(true);
assert.ok(crossing([{mesh:blocker,box:new THREE.Box3().setFromObject(blocker)}]),'Clearance detector misses an inserted obstruction');
console.log('PASS Clearance detector rejects an inserted obstruction');
U.setArticulation(door,0);
hull.update();hull.group.updateMatrixWorld(true);

const centreSeat=cabin.articulations.find(r=>r.id==='seat_commander');
assert.ok(centreSeat&&cabin.parts.commanderSeat,'Foldable centre seat is missing');
const seatTargets=[],seatSweep=new THREE.Box3();
for(const value of poses){U.setArticulation(centreSeat,value);cabin.group.updateMatrixWorld(true);seatSweep.union(new THREE.Box3().setFromObject(centreSeat.pivot));}
cabin.parts.interior.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh)return;
  for(let p=mesh;p;p=p.parent)if(p===centreSeat.pivot)return;
  const box=new THREE.Box3().setFromObject(mesh);
  if(seatSweep.intersectsBox(box))seatTargets.push({mesh,box});
});
// The axle and its bearing blocks intentionally meet. Only contact close to
// this physical hinge axis is permitted; the cushion/backrest must clear the
// doorway, grab handles, fixed supports and all other cabin furniture.
const hingeOrigin=centreSeat.pivot.getWorldPosition(new THREE.Vector3());
const bearingContact=point=>Math.hypot(point.y-hingeOrigin.y,point.z-hingeOrigin.z)<.055;
for(const value of poses){
  U.setArticulation(centreSeat,value);cabin.group.updateMatrixWorld(true);
  const hit=crossing(seatTargets,centreSeat.pivot,bearingContact);
  assert.equal(hit,null,`Folding centre seat intersects fixed cabin geometry at ${(value*100).toFixed(0)}%: ${JSON.stringify(hit)}`);
}
U.setArticulation(centreSeat,0);cabin.group.updateMatrixWorld(true);
const seatBounds=new THREE.Box3().setFromObject(centreSeat.pivot);
assert.ok(seatBounds.max.z<-.32,'Stowed centre seat projects into the low centre passage');
const openDoors={door_engine:{value:1},door_wtFwd:{value:1},seat_commander:{value:0}};
assert.equal(CB.canWalkAt({x:8.65,z:0},9.35,0,openDoors),true,'Stowed centre seat blocks walking');
openDoors.seat_commander.value=1;
assert.equal(CB.canWalkAt({x:8.65,z:0},9.35,0,openDoors),false,'Walking passes through deployed centre seat');
assert.equal(CB.canWalkAt({x:8.9,z:0},8.6,0,openDoors),true,'A deploying centre seat prevents retreat');
console.log(`PASS Folding centre seat clears ${seatTargets.length} nearby fixed cabin meshes in all poses and preserves the aisle when stowed`);

const displayTargets=[];
for(const name of ['plotterP','plotterP2','plotterS']) {
  assert.ok(cabin.parts[name],`Missing operator display ${name}`);
  cabin.parts[name].traverse(mesh=>{if(mesh.isMesh)displayTargets.push({mesh,box:new THREE.Box3().setFromObject(mesh)});});
}
for(const value of poses) {
  cabin.update(0,{engineP:value*2-1,engineS:value*2-1,bucketP:value,bucketS:value});
  cabin.group.updateMatrixWorld(true);
  for(const name of ['throttleP','throttleS','bucketHandleP','bucketHandleS']) {
    assert.ok(cabin.parts[name],`Missing bridge control ${name}`);
    const hit=crossing(displayTargets,cabin.parts[name]);
    assert.equal(hit,null,`${name} intersects a display at ${(value*100).toFixed(0)}% travel: ${JSON.stringify(hit)}`);
  }
}
console.log('PASS Engine and bucket levers clear the three monitor housings throughout their full travel');

// Independent engine/bucket commands are possible. Testing only matching
// values would miss a lever crossing the other quadrant's fixed housing.
const bucketBase=cabin.group.getObjectByName('bucketControlBase');
assert.ok(bucketBase,'Missing separate bucket-control housing');
const bucketSweep=new THREE.Box3();
for(const value of poses){cabin.update(0,{bucketP:value,bucketS:value});cabin.group.updateMatrixWorld(true);bucketSweep.union(new THREE.Box3().setFromObject(bucketBase));}
const nearbyControls=[];
cabin.group.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh)return;
  for(let p=mesh;p;p=p.parent)if(p===bucketBase)return;
  if(bucketSweep.clone().expandByScalar(.20).intersectsBox(new THREE.Box3().setFromObject(mesh)))nearbyControls.push(mesh);
});
const mountingY=new THREE.Box3().setFromObject(bucketBase).min.y;
const mountingMeshes=[];
bucketBase.traverse(mesh=>{
  if(mesh.isMesh&&Math.abs(new THREE.Box3().setFromObject(mesh).min.y-mountingY)<.0001)mountingMeshes.push(mesh);
});
assert.ok(mountingMeshes.length,'Bucket controls have no mounting foot');
for(const foot of mountingMeshes) {
  const box=new THREE.Box3().setFromObject(foot);
  for(const x of [box.min.x+.001,box.max.x-.001])for(const z of [box.min.z+.001,box.max.z-.001]) {
    ray.set(new THREE.Vector3(x,mountingY+.01,z),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=.03;
    const support=ray.intersectObjects(nearbyControls,false)[0];
    assert.ok(support&&Math.abs(support.point.y-mountingY)<.001,'Bucket-control mounting foot is floating or buried in the console');
  }
}
for(let engineStep=0;engineStep<=10;engineStep++)for(let bucketStep=0;bucketStep<=10;bucketStep++) {
  const engine=engineStep/5-1,bucket=bucketStep/10;
  cabin.update(0,{engineP:engine,engineS:engine,bucketP:bucket,bucketS:bucket});cabin.group.updateMatrixWorld(true);
  const targets=nearbyControls.map(mesh=>({mesh,box:new THREE.Box3().setFromObject(mesh)}));
  // Allow the actual mounting face to meet the console, with 1mm numerical
  // tolerance. The housing, grips and stalks above it must remain clear.
  const hit=crossing(targets,bucketBase,point=>Math.abs(point.y-mountingY)<.001);
  assert.equal(hit,null,`Bucket controls intersect fixed cabin or throttle at engine ${engine}, bucket ${bucket}: ${JSON.stringify(hit)}`);
}
console.log('PASS Bucket controls sit on the console and clear the cabin/throttle in 121 independent command combinations');
