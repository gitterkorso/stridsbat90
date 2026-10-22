#!/usr/bin/env node
// Independent geometry/dynamics checks for the procedural naval ensign.
// Run: node tools/flag-test.js. This tests observable mesh behaviour, not a
// duplicate of the deformation equations or a full cloth simulation.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),THREE=require(path.join(root,'src/vendor/three.min.js'));
const noop=()=>{},imageData=(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)});
const drawing=new Proxy({createImageData:imageData,getImageData:(_x,_y,w,h)=>imageData(w,h),
  createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),
  measureText:t=>({width:String(t).length*12})},{get:(o,k)=>k in o?o[k]:noop});
const context={THREE,console,document:{createElement:()=>({width:300,height:150,getContext:()=>drawing})}};
context.window=context;vm.createContext(context);
for(const file of ['constants.js','util.js','equipment.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context,{filename:file});
const CB=context.CB90;
function make(){
  const module=CB.buildEquipment(THREE);module.setRadar(false);
  return {module,mesh:module.parts.ensignFlag,rest:module.parts.ensignRest,layout:module.parts.ensignCloth};
}
const state=(wind={x:0,z:0},speed=0,heading=0)=>({paused:false,wind,nav:{speed,heading,yawRate:0}});
function run(f,seconds,s,hz=60){for(let i=0;i<Math.round(seconds*hz);i++)f.module.update(1/hz,s,i/hz);return f;}
const snapshot=f=>Array.from(f.mesh.geometry.attributes.position.array);
const maxDifference=(a,b)=>Math.max(...a.map((n,i)=>Math.abs(n-b[i])));
function vertex(f,row,col,rest=false){const i=(row*(f.layout.cols+1)+col)*3,p=rest?f.rest:f.mesh.geometry.attributes.position.array;return new THREE.Vector3(p[i],p[i+1],p[i+2]);}
function fly(f){const result=new THREE.Vector3();for(const row of [0,f.layout.rows/2,f.layout.rows])result.add(vertex(f,row,f.layout.cols).sub(vertex(f,row,0)));return result.multiplyScalar(1/3);}
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}

test('Three tongues and two notches belong to the mesh; the full hoist remains attached',()=>{
  const f=make(),{rows,cols}=f.layout,lengths=Array.from({length:rows+1},(_,r)=>vertex(f,r,cols,true).distanceTo(vertex(f,r,0,true)));
  const full=Math.max(...lengths),notches=[];
  for(let r=1;r<rows;r++)if(lengths[r]<lengths[r-1]&&lengths[r]<lengths[r+1])notches.push(r);
  assert.equal(notches.length,2,'The mesh must contain two cutouts, not just a rectangular alpha mask');
  assert.ok(Math.abs(lengths[0]-full)<1e-5&&Math.abs(lengths[rows/2]-full)<1e-5&&Math.abs(lengths[rows]-full)<1e-5,'Top, middle and bottom tongues must retain their full length');
  assert.ok(notches.every(r=>lengths[r]<full*.85),'Notches are missing or too shallow');
  for(const s of [state(),state({x:0,z:15}),state({x:0,z:0},23.15),state({x:0,z:0},-7.2)]){
    run(f,3,s);
    for(let row=0;row<=rows;row++)assert.ok(vertex(f,row,0).distanceTo(vertex(f,row,0,true))<1e-7,'A hoist vertex has moved away from the staff');
  }
});

test('The deformed fabric retains row lengths, finite normals and valid culling bounds',()=>{
  const f=make(),{rows,cols}=f.layout;
  for(const s of [state(),state({x:-4,z:-1}),state({x:0,z:15}),state({x:30,z:-20},23.15,2),state({x:0,z:0},-7.2)]){
    for(let sample=0;sample<8;sample++){
      run(f,.25,s);
      const g=f.mesh.geometry,p=g.attributes.position,n=g.attributes.normal,sphere=g.boundingSphere;
      assert.ok(sphere&&Number.isFinite(sphere.radius));
      for(let i=0;i<p.count;i++){
        const point=new THREE.Vector3().fromBufferAttribute(p,i),normal=new THREE.Vector3().fromBufferAttribute(n,i);
        assert.ok(point.toArray().every(Number.isFinite)&&normal.toArray().every(Number.isFinite),'Nonfinite cloth vertex or normal');
        assert.ok(point.distanceTo(sphere.center)<=sphere.radius+1e-6,'Moving fabric escapes its bounding sphere');
        assert.ok(normal.length()>.9&&normal.length()<1.1,'Degenerate fabric normal');
      }
      for(let row=0;row<=rows;row++){
        let actual=0,rest=0;
        for(let col=1;col<=cols;col++){actual+=vertex(f,row,col).distanceTo(vertex(f,row,col-1));rest+=vertex(f,row,col,true).distanceTo(vertex(f,row,col-1,true));}
        assert.ok(Math.abs(actual-rest)<2e-5,'Fabric stretches or collapses along a row');
      }
    }
  }
});

test('Weak wind lets the flag fall while stronger airflow extends it with height-dependent folds',()=>{
  const calm=run(make(),8,state()),windy=run(make(),8,state({x:-15,z:0})),a=fly(calm),b=fly(windy);
  assert.ok(a.y<-.40,'Calm fabric remains rigidly horizontal');
  assert.ok(Math.hypot(b.x,b.z)>Math.hypot(a.x,a.z)+.20,'Stronger air does not extend the flag');
  const upper=vertex(windy,0,windy.layout.cols).sub(vertex(windy,0,0)),lower=vertex(windy,windy.layout.rows,windy.layout.cols).sub(vertex(windy,windy.layout.rows,0));
  assert.ok(upper.distanceTo(lower)>.025,'All vertical rows move as one rigid curtain');
});

test('Apparent airflow responds to ahead, astern and world-space crosswind at all headings',()=>{
  for(const [speed,sign]of [[18,-1],[-7.2,1]]){
    const tip=fly(run(make(),7,state({x:0,z:0},speed)));
    assert.ok(tip.x*sign>.75,'Motion-induced airflow points the wrong way');
  }
  for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
    const f=run(make(),7,state({x:0,z:12},0,heading)),tip=fly(f).applyAxisAngle(new THREE.Vector3(0,1,0),heading);
    assert.ok(tip.z>.75&&Math.abs(tip.x)<.25,'World crosswind rotates with the boat or uses the wrong heading sign');
  }
  const fast=fly(run(make(),7,state({x:0,z:5},18)));
  assert.ok(fast.x<-.75&&fast.z>.10,'Forward motion does not combine with a crosswind');
});

test('Pause and zero delta freeze geometry and resume without chasing external time',()=>{
  const f=run(make(),2,state({x:-5,z:2},8)),control=run(make(),2,state({x:-5,z:2},8)),before=snapshot(f);
  f.module.update(10,{...state({x:25,z:-30},-7),paused:true},100000);
  f.module.update(0,state({x:25,z:-30},-7),200000);
  f.module.update(-1,state(),300000);
  assert.equal(maxDifference(before,snapshot(f)),0,'Paused cloth changed');
  const s=state({x:-5,z:2},8);f.module.update(1/60,s,300001);control.module.update(1/60,s,2+1/60);
  assert.equal(maxDifference(snapshot(f),snapshot(control)),0,'Resume depends on wall-clock time spent paused');
});

test('Fixed ticks agree at 30, 60 and 120 fps through changes of wind and vessel motion',()=>{
  function sequence(hz){const f=make();run(f,2,state({x:-4,z:-1},0),hz);run(f,2,state({x:2,z:8},18,.8),hz);run(f,2,state({x:0,z:0},-5,-1.2),hz);return snapshot(f);}
  const reference=sequence(120);
  for(const hz of [30,60])assert.ok(maxDifference(reference,sequence(hz))<1e-6,`Flag changes with ${hz} fps`);
  const gap=make(),clamped=make(),s=state({x:-4,z:-1},10);gap.module.update(10,s,10);clamped.module.update(.1,s,.1);
  assert.equal(maxDifference(snapshot(gap),snapshot(clamped)),0,'A suspended frame causes a long catch-up jump');
});

console.log(passed+' flag checks passed.');
