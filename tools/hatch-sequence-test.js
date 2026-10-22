#!/usr/bin/env node
// Source-backed bow-lid overlap: exercise the actual application's request and
// animation APIs, including mid-motion reversal and record-order independence.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),THREE=require(path.join(root,'src/vendor/three.min.js'));
const ctx={THREE};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['constants.js','util.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),ctx,{filename:file});
const U=ctx.CB90.util;
function fixture(reverse=false){
  const group=new THREE.Group(),records=['P','S'].map(side=>U.hinge({id:'hatch_bow'+side,kind:'hatch',parent:group,pivot:[0,0,0],axis:'x',open:90,speed:1}));
  const hatches=Object.fromEntries(records.map(r=>[r.id,{value:0,target:0}]));if(reverse)records.reverse();
  const step=(count=1)=>{for(let i=0;i<count;i++){
    const p=hatches.hatch_bowP,s=hatches.hatch_bowS,prev={p:p.value,s:s.value};
    U.stepArticulations(records,hatches,.025);
    if(s.value>prev.s)assert.equal(p.value,1,'Starboard opens under closed/partly open port overlap');
    if(p.value<prev.p)assert.equal(s.value,0,'Port closes on starboard overlap');
    for(const r of records)assert.ok(Math.abs(r.value-U.ease(hatches[r.id].value))<1e-10,'Visible lid pose differs from animation state');
  }};
  return {records,hatches,step,p:hatches.hatch_bowP,s:hatches.hatch_bowS};
}
for(const reverse of [false,true]){
  const f=fixture(reverse);
  U.requestHatch(f.hatches,'hatch_bowS',1);assert.equal(f.p.target,1);f.step(20);assert.equal(f.s.value,0);f.step(100);assert.equal(f.p.value,1);assert.equal(f.s.value,1);
  U.requestHatch(f.hatches,'hatch_bowP',0);assert.equal(f.s.target,0);f.step(20);assert.equal(f.p.value,1);f.step(100);assert.equal(f.s.value,0);assert.equal(f.p.value,0);
  U.requestHatch(f.hatches,'hatch_bowS',1);f.step(55);U.requestHatch(f.hatches,'hatch_bowP',0);f.step(10);U.requestHatch(f.hatches,'hatch_bowS',1);f.step(120);assert.equal(f.p.value,1);assert.equal(f.s.value,1);
  const before=f.records.map(r=>r.value);U.requestHatch(f.hatches,'hatch_bowP',0);U.stepArticulations(f.records,f.hatches,0);assert.deepEqual(f.records.map(r=>r.value),before,'Pause moves lids');f.step(120);
}
console.log('PASS Bow lids open port-first and close starboard-first, in either record order');
console.log('PASS Mid-motion reversal and pause preserve the lid overlap sequence');
