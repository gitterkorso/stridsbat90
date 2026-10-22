#!/usr/bin/env node
// Exercise the application's actual movement rules and model geometry. Canvas stubs are texture-only.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={};context.window=context;vm.createContext(context);
const source=file=>fs.readFileSync(path.join(root,'src',file),'utf8');
for(const file of ['constants.js','navigation.js'])vm.runInContext(source(file),context,{filename:file});
const M=context.CB90.M,doorX=M.WH_DOOR_X,floor=context.CB90.walkFloorAt,allowed=context.CB90.canWalkAt;
const doors=(engine=1,bow=1)=>({door_engine:{value:engine},door_wtFwd:{value:bow}});
const can=(from,x,z=0,hatches=doors())=>allowed({x:from,z:0},x,z,hatches);
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log(`PASS ${name}`);}catch(error){failed++;console.error(`FAIL ${name}: ${error.message}`);}}
function close(actual,expected,label,tolerance=1e-9){assert.ok(Math.abs(actual-expected)<=tolerance,`${label}: ${actual} versus ${expected}`);}
function route(from,to,hatches=doors()){
 let current=from,step=Math.sign(to-from)*.035;
 for(let n=0;n<1000&&Math.abs(current-to)>1e-8;n++){
  const next=Math.abs(to-current)<=Math.abs(step)?to:current+step;
  assert.ok(can(current,next,0,hatches),`Route blocked between ${current.toFixed(3)} and ${next.toFixed(3)}`);current=next;
 }
 close(current,to,'Route reaches destination');
}
test('Main movement delegates to the tested navigation APIs',()=>{
 assert.equal(typeof floor,'function');assert.equal(typeof allowed,'function');
 const main=source('main.js');assert.match(main,/CB90\.walkFloorAt\(x\)/);assert.match(main,/CB90\.canWalkAt\(walk,\s*x,\s*z,\s*state\.hatches\)/);
});
test('Engine, troop, cockpit and bow floors match the model elevations',()=>{
 for(const [x,y]of [[.9,-.45],[2.7,-.45],[3.999,-.45],[4,-.3],[6.4,-.3],[7.35,-.3],[7.975,-.3],[8.6,-.3],[9.8,-.3],[doorX,-.3],[(doorX+M.RAMP_HINGE_X)/2,.06],[M.RAMP_HINGE_X,.42]])close(floor(x),y,`Floor at ${x}`);
 for(let x=.9;x<=M.RAMP_HINGE_X;x+=.025)assert.ok(Number.isFinite(floor(x)));
});
test('Low aisle stays level through the wheelhouse',()=>{
 for(const x of [7.35,8.6,doorX])close(floor(x-1e-7),floor(x+1e-7),`Join at ${x}`,1e-6);
 for(let x=7.36;x<doorX;x+=.04)close(floor(x),M.TROOP_FLOOR_Y,`Low aisle ${x}`);route(7,9);route(9,7);
});
test('Open bulkhead doors allow a connected interior route in both directions',()=>{route(.95,13.9);route(13.9,.95);});
test('A closed engine door blocks entry from both sides, including a large step',()=>{
 for(const [from,to]of [[4.25,3.75],[3.75,4.25],[6.4,2.7],[2.7,6.4]]){
  assert.equal(can(from,to,0,doors(0,1)),false);assert.equal(can(from,to,0,doors(.5,1)),false);assert.equal(can(from,to,0,doors(1,1)),true);
 }
 assert.equal(can(6.4,6.45,0,doors(0,1)),true,'Closed engine door must not freeze troop cabin');
});
test('The forward door blocks the cockpit-to-bow passage until it is open',()=>{
 for(const [from,to]of [[doorX-.20,doorX+.15],[doorX+.15,doorX-.20],[doorX-.60,doorX+.80],[doorX+.80,doorX-.60]]){
  assert.equal(can(from,to,0,doors(1,0)),false);assert.equal(can(from,to,0,doors(1,.5)),false);assert.equal(can(from,to,0,doors(1,1)),true);
 }
 route(8.7,doorX-.20,doors(1,0));route(doorX+.15,13.9,doors(1,0));
});
test('Closing a door near the player permits retreat on the same side',()=>{
 assert.equal(can(4.08,4.30,0,doors(0,1)),true);assert.equal(can(3.92,3.70,0,doors(0,1)),true);
 assert.equal(can(doorX-.09,doorX-.30,0,doors(1,0)),true);assert.equal(can(doorX+.06,doorX+.25,0,doors(1,0)),true);
});
test('Troop seats, engine blocks and aisle sides cannot be walked through',()=>{
 for(const x of [1.2,2.7,3.6,4.5,5.8,7,7.6,8.3]){
  assert.equal(can(x,x,0),true);for(const z of [-1.16,-.52,.52,1.16])assert.equal(can(x,x,z*M.WH_WIDTH_SCALE),false,`Obstacle at ${x},${z}`);
 }
 for(const z of [-.29,.29])assert.equal(can(2.7,2.7,z),true);
});
test('Cockpit landing is traversable and occupied pilot seats remain solid',()=>{
 assert.equal(can(9,9,0),true);for(const z of [-1,1])assert.equal(can(9,9,z*M.WH_WIDTH_SCALE),false);
 for(const x of [9.4,9.7,10.1])for(const z of [-.73,.73])assert.equal(can(x,x,z*M.WH_WIDTH_SCALE),false);
 const approach=doorX-.34;assert.equal(can(approach,approach,.38*M.WH_WIDTH_SCALE),true);assert.equal(can(approach,approach,.50),false);
});
test('Stern, bow and corridor walls retain the player inside the model',()=>{
 for(const x of [-1,0,.89,M.RAMP_HINGE_X+.01,16])assert.equal(can(9,x,0),false);
 assert.equal(can(.95,.9,0),true);assert.equal(can(13.9,13.95,0),true);
 for(const x of [doorX+.2,12.5,13.8]){assert.equal(can(x,x,.31),true);assert.equal(can(x,x,.4),false);assert.equal(can(x,x,-.4),false);}
});
// Use the same fully local Three.js runtime as the app, never the old iCloud-evicted test cache.
function mockCanvas(){
 const canvas={width:1,height:1,toDataURL:()=> 'data:image/png;base64,'};
 const draw={canvas,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),createLinearGradient:()=>({addColorStop(){}}),measureText:text=>({width:String(text).length*10})};
 canvas.getContext=()=>new Proxy(draw,{get:(target,key)=>key in target?target[key]:()=>{}});return canvas;
}
const threeFile=path.join(root,'src/vendor/three.min.js');let hull,structure,equipment;
test('Model modules build successfully with valid, unique articulation records',()=>{
 assert.ok(fs.existsSync(threeFile),'Missing app runtime src/vendor/three.min.js');context.THREE=require(threeFile);
 context.document={createElement:type=>{assert.equal(type,'canvas');return mockCanvas();}};
 for(const file of ['util.js','hull.js','superstructure.js','equipment.js'])vm.runInContext(source(file),context,{filename:file});
 hull=context.CB90.buildHull(context.THREE);structure=context.CB90.buildSuperstructure(context.THREE);equipment=context.CB90.buildEquipment(context.THREE);
 const ids=new Set();
 for(const module of [hull,structure,equipment])for(const rec of module.articulations){
  assert.ok(!ids.has(rec.id),`Duplicate ${rec.id}`);ids.add(rec.id);assert.ok(['x','y','z'].includes(rec.axis));
  assert.ok(Number.isFinite(rec.closed)&&Number.isFinite(rec.open)&&rec.closed!==rec.open,`Invalid limits: ${rec.id}`);
  assert.ok(Number.isFinite(rec.speed)&&rec.speed>0);assert.ok(rec.pivot.children.length,`Missing moving geometry: ${rec.id}`);
  for(const value of [0,.5,1]){
   context.CB90.util.setArticulation(rec,value);module.group.updateMatrixWorld(true);
   rec.pivot.traverse(object=>{for(const n of object.matrixWorld.elements)assert.ok(Number.isFinite(n),`Invalid transform: ${rec.id}`);if(object.isMesh)for(const n of object.geometry.attributes.position.array)assert.ok(Number.isFinite(n),`Invalid vertex: ${rec.id}`);});
  }
  context.CB90.util.setArticulation(rec,0);
 }
 for(const id of ['door_engine','door_wtFwd','ramp_bow','hatch_engineP','hatch_engineS','hatch_troopAft','hatch_bowP','hatch_bowS'])assert.ok(ids.has(id),`Missing ${id}`);
});
test('Deck under the ring mount is closed and the wheelhouse aisle is low',()=>{
 const THREE=context.THREE;
 hull.group.updateMatrixWorld(true);structure.group.updateMatrixWorld(true);
 for(const x of [7.4,7.8,8.05]) {
  const ray=new THREE.Raycaster(new THREE.Vector3(x,2,0),new THREE.Vector3(0,-1,0));
  const hits=ray.intersectObject(hull.parts.decks,true);
  assert.ok(hits.length,`Deck missing under mount at ${x}`);
  close(hits[0].point.y,M.TRUNK_Y,'Closed deck',.01);
 }
 const ray=new THREE.Raycaster(new THREE.Vector3(9.0,.3,0),new THREE.Vector3(0,-1,0));
 const hits=ray.intersectObject(structure.parts.cabinSole,true);
 assert.ok(hits.length,'Missing low aisle sole');close(hits[0].point.y,M.TROOP_FLOOR_Y,'Aisle floor',.001);
 assert.equal(hull.group.getObjectByName('companionStairs'),undefined);
});
test('Swedish H troop cabin has nine inward seats per side and two forward seats aft',()=>{
 const THREE=context.THREE,seats=hull.parts.troopSeats.children.filter(o=>o.isGroup&&o.name.startsWith('troopSeat'));
 assert.equal(seats.length,20,'SHK RM 2008:02 p.12 documents twenty troop seats');
 const port=seats.filter(o=>o.userData.facing[2]===1),starboard=seats.filter(o=>o.userData.facing[2]===-1),aft=seats.filter(o=>o.userData.facing[0]===1);
 assert.equal(port.length,9);assert.equal(starboard.length,9);assert.equal(aft.length,2);
 hull.group.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 for(const seat of seats) {
  const [x,,z]=seat.userData.position,facing=new THREE.Vector3(...seat.userData.facing);
  // Check the actual batched surfaces, so a retained semantic record alone cannot pass.
  ray.set(new THREE.Vector3(x,.35,z),new THREE.Vector3(0,-1,0));
  const cushion=ray.intersectObject(hull.parts.troopSeats,true)[0];
  assert.ok(cushion,`Missing cushion ${seat.name}`);close(cushion.point.y,.2475,`${seat.name} seat surface`,.002);
  ray.set(new THREE.Vector3(x,.58,z),facing.negate());
  const back=ray.intersectObject(hull.parts.troopSeats,true)[0];
  assert.ok(back&&back.distance>.12&&back.distance<.35,`Backrest faces the wrong direction: ${seat.name}`);
 }
 for(const row of [port,starboard]) {
  const xs=row.map(s=>s.userData.position[0]).sort((a,b)=>a-b);
  assert.ok(xs[0]>4.7&&xs[8]<8.5,'Side rows must clear aft seats and wheelhouse');
  for(let i=1;i<xs.length;i++)assert.ok(xs[i]-xs[i-1]>=.40,'Adjacent seats overlap');
 }
 for(const s of aft)assert.ok(s.userData.position[0]<4.6&&Math.abs(s.userData.position[2])>.75,'Aft seats block machinery doorway');
 // The physical seat meshes must leave both the centre aisle and the troop-hatch ladder zone open.
 for(let x=4.03;x<8.55;x+=.13)for(const z of [-.40,0,.40]) {
  ray.set(new THREE.Vector3(x,1.1,z),new THREE.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(hull.parts.troopSeats,true).length,0,`Troop furniture obstructs aisle at ${x},${z}`);
 }
});
test('Forepeak has horizontal treads and navigation follows their actual surfaces',()=>{
 const THREE=context.THREE,edges=[doorX,...context.CB90.BOW_STEPS.map(t=>doorX+t*(M.RAMP_HINGE_X-doorX)),M.RAMP_HINGE_X];
 hull.group.updateMatrixWorld(true);
 let previous=M.TROOP_FLOOR_Y;
 for(let i=0;i<edges.length-1;i++) {
  const heights=[];
  for(const t of [.12,.5,.88])for(const z of [-.27,0,.27]) {
   const x=edges[i]+t*(edges[i+1]-edges[i]);
   const hit=new THREE.Raycaster(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0)).intersectObject(hull.parts.bowCorridor,true)[0];
   assert.ok(hit,`Forepeak aisle has no tread at ${x},${z}`);close(hit.point.y,floor(x),'Navigation matches physical tread',.002);heights.push(hit.point.y);
  }
  assert.ok(Math.max(...heights)-Math.min(...heights)<.002,'A horizontal tread reverted to a slope');
  assert.ok(heights[0]>=previous-.001&&heights[0]-previous<=.185,'Uneven or descending stair rise');previous=heights[0];
 }
 close(previous,M.RAMP_HINGE_Y+.02,'Top tread meets ramp sill',.001);
});
test('Gas springs stay attached and ramp chains retain their length through travel',()=>{
 const THREE=context.THREE,U=context.CB90.util;
 assert.equal(hull.parts.hatchGasSprings.length,4,'Both bow lids and both sides of the troop hatch need springs');
 assert.equal(hull.parts.rampChains.length,2,'The lowered ramp hangs on two chains');
 const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let pose=0;pose<=20;pose++) {
  for(const id of ['hatch_bowP','hatch_bowS','hatch_troopAft','ramp_bow'])U.setArticulation(hull.articulations.find(r=>r.id===id),pose/20);
  hull.update();hull.group.updateMatrixWorld(true);
  for(const spring of hull.parts.hatchGasSprings) {
   const moving=spring.movingPoint.clone().applyMatrix4(spring.rec.pivot.matrix);
   a.set(0,-.5,0).applyMatrix4(spring.body.matrix);b.set(0,.5,0).applyMatrix4(spring.rod.matrix);
   assert.ok(a.distanceTo(spring.fixedPoint)<1e-6,'Gas-spring barrel detached from fixed lug');
   assert.ok(b.distanceTo(moving)<1e-6,'Gas-spring rod detached from lid');
   assert.ok(spring.body.scale.y>=spring.barrelLength-.001,'Gas-spring barrel changes physical length');
  }
  for(const chain of hull.parts.rampChains) {
   const moving=chain.movingPoint.clone().applyMatrix4(chain.rec.pivot.matrix);
   chain.links.getMatrixAt(0,matrix);a.setFromMatrixPosition(matrix);
   chain.links.getMatrixAt(chain.links.count-1,matrix);b.setFromMatrixPosition(matrix);
   assert.ok(a.distanceTo(chain.fixedPoint)<1e-5&&b.distanceTo(moving)<1e-5,'A chain end floats away from its attachment');
   let measured=0;for(let i=1;i<chain.points.length;i++)measured+=chain.points[i].distanceTo(chain.points[i-1]);
   assert.ok(Math.abs(measured-chain.length)<.003,'Chain stretches while the ramp moves');
   for(let i=0;i<chain.links.count;i++){chain.links.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);assert.ok(p.toArray().every(Number.isFinite),'Invalid moving chain link');}
  }
 }
 for(const id of ['hatch_bowP','hatch_bowS','hatch_troopAft','ramp_bow'])U.setArticulation(hull.articulations.find(r=>r.id===id),0);
 hull.update();hull.group.updateMatrixWorld(true);
 const versions=hull.parts.rampChains.map(chain=>chain.links.instanceMatrix.version);
 for(let i=0;i<100;i++)hull.update();
 hull.parts.rampChains.forEach((chain,i)=>assert.equal(chain.links.instanceMatrix.version,versions[i],'Static frames needlessly rebuild and upload chain transforms'));
});
test('The bow opening reaches the ramp without a fixed transverse deck bridge',()=>{
 const THREE=context.THREE,U=context.CB90.util;
 for(const x of [14.45,14.60,14.74])for(const z of [-.25,0,.25]) {
  const ray=new THREE.Raycaster(new THREE.Vector3(x,2,z),new THREE.Vector3(0,-1,0));
  assert.ok(!ray.intersectObject(hull.parts.decks,true).some(hit=>hit.point.y>.7),'Fixed deck blocks the open ramp exit');
  const rec=hull.articulations.find(r=>r.id===(z<0?'hatch_bowP':'hatch_bowS'));
  const hit=ray.intersectObject(rec.pivot,true)[0];assert.ok(hit&&hit.point.y>1.05,'Closed bow lid does not reach the ramp edge');
 }
});
test('Engine working hatches align with the inner rectangles of the old-H plan',()=>{
 for(const id of ['hatch_engineP','hatch_engineS']) {
  const rec=hull.articulations.find(r=>r.id===id);close(rec.pivot.position.x,1.90,'Reconstructed aft hatch centre',.04);
  const bounds=new context.THREE.Box3().setFromObject(rec.pivot);
  assert.ok(bounds.min.x>.90&&bounds.min.x<1.0&&bounds.max.x>2.80&&bounds.max.x<2.9,'Hatch bounds follow the mine rails rather than the lid');
 }
});
test('Source-visible starboard stowage pockets are real recesses through the passage wall',()=>{
 const THREE=context.THREE,storage=hull.parts.bowStowage;
 assert.ok(storage);assert.equal(storage.children.length,2,'Only the two source-labelled stowage fields are reconstructed');
 hull.group.updateMatrixWorld(true);
 for(const [x,y] of [[11.28,.065],[12.03,.75]]) {
  const ray=new THREE.Raycaster(new THREE.Vector3(x,y,0),new THREE.Vector3(0,0,1));
  const hit=ray.intersectObject(hull.parts.interior,true)[0];
  assert.ok(hit&&hit.point.z>.59&&hit.point.z<.80,'An intact wall or unbounded hole replaces the storage pocket');
  ray.set(new THREE.Vector3(x,y,0),new THREE.Vector3(0,0,-1));
  const opposite=ray.intersectObject(hull.parts.interior,true)[0];
  assert.ok(opposite&&opposite.point.z>-.58,'Unverified identical port-side stowage was added');
 }
 for(const [x,y] of [[11.3,.45],[13.1,.75]]) {
  const hit=new THREE.Raycaster(new THREE.Vector3(x,y,0),new THREE.Vector3(0,0,1)).intersectObject(hull.parts.interior,true)[0];
  assert.ok(hit&&hit.point.z<.58,'Wall beside the measured pockets is missing');
 }
});
test('Forward door dogs match the documented free-edge and lower-centre arrangement',()=>{
 const dogs=hull.parts.forwardDoorDogs;
 assert.equal(dogs.length,4);assert.equal(dogs.filter(d=>d.position.z<-.70).length,2,'Two dogs belong to the free port edge');
 assert.ok(dogs.some(d=>d.position.y<.15&&Math.abs(d.position.z+.41)<.01),'Lower central dog is absent');
 for(const dog of dogs) {
  const box=new context.THREE.Box3().setFromObject(dog);
  assert.ok(box.min.x<doorX-.06&&box.max.x>doorX+.06,'Dog cannot be operated from both faces');
 }
});
test('Forward watertight door hinges to starboard, opens aft and clears the passage floor',()=>{
 const THREE=context.THREE,rec=hull.articulations.find(r=>r.id==='door_wtFwd'),point=new THREE.Vector3();
 assert.ok(rec.pivot.position.z>0,'Door hinge belongs to starboard');
 for(let i=0;i<=20;i++) {
  context.CB90.util.setArticulation(rec,i/20);hull.update();hull.group.updateMatrixWorld(true);
  point.set(0,.5,-.80).applyMatrix4(rec.pivot.matrixWorld);
  assert.ok(point.x<=doorX+.001,'Door free edge swings into the bow rather than the transport space');
  rec.pivot.traverse(o=>{
   if(!o.isMesh)return;const positions=o.geometry.attributes.position;
   for(let v=0;v<positions.count;v++) {
    point.fromBufferAttribute(positions,v).applyMatrix4(o.matrixWorld);
    assert.ok(point.y>=floor(point.x)+.014,`Door intersects floor at opening ${i/20}, ${point.toArray()}`);
   }
  });
 }
 context.CB90.util.setArticulation(rec,1);hull.update();hull.group.updateMatrixWorld(true);
 point.set(0,.5,-.80).applyMatrix4(rec.pivot.matrixWorld);
 assert.ok(point.x<doorX-.75,'Open door must lie beside the aft passage');
 context.CB90.util.setArticulation(rec,0);hull.update();hull.group.updateMatrixWorld(true);
});
test('Opening each hull hatch and door exposes real space behind its cover',()=>{
 assert.ok(hull,'Hull must build before aperture checks');const THREE=context.THREE;
 const checks=[['hatch_engineP',[2.5,2.8,-.95],[0,-1,0]],['hatch_engineS',[2.5,2.8,.95],[0,-1,0]],['hatch_engineCompanion',[.625,2.8,0],[0,-1,0]],['hatch_troopAft',[(M.TROOP_HATCH_X0+M.TROOP_HATCH_X1)/2,2.8,0],[0,-1,0]],['hatch_bowP',[13.55,2.8,-.275],[0,-1,0]],['hatch_bowS',[13.55,2.8,.275],[0,-1,0]],['door_engine',[4.5,.65,0],[-1,0,0]],['door_wtFwd',[doorX-.30,M.WH_FLOOR_Y+.52,0],[1,0,0]],['ramp_bow',[16.3,1,0],[-1,0,0]]];
 for(const [id,origin,direction]of checks){
  const rec=hull.articulations.find(rec=>rec.id===id),ray=new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction),0,30);
  const distance=value=>{context.CB90.util.setArticulation(rec,value);hull.group.updateMatrixWorld(true);const hits=ray.intersectObject(hull.group,true);return hits.length?hits[0].distance:Infinity;};
  const closed=distance(0),open=distance(1);assert.ok(Number.isFinite(closed),`Closed cover missing: ${id}`);assert.ok(open>closed+.15,`${id} aperture still blocked (${closed.toFixed(3)}m closed, ${open.toFixed(3)}m open)`);distance(0);
 }
});
console.log(`${passed} interior checks passed; ${failed} failed.`);process.exitCode=failed?1:0;
