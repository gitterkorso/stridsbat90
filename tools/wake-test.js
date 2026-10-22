const assert=require('assert'),fs=require('fs'),vm=require('vm');
global.window=global;global.THREE=require('../src/vendor/three.min.js');
for(const f of ['constants','sea-state','weather','wake'])vm.runInThisContext(fs.readFileSync('src/'+f+'.js','utf8'));
const waves='void sea(vec2 p,out float h,out vec2 s){h=0.0;s=vec2(0.0);}';
function run(speed,power,seconds=3,hz=30){const w=CB90.buildWake(THREE,waves);for(let i=0;i<=seconds*hz;i++)w.update(i/hz,{nav:{x:speed*i/hz,z:0,heading:0,speed},engineP:power,engineS:power,enginesOn:true});return w;}
const idle=run(0,0),slow=run(3,.15),fast=run(23,1),coast=run(12,0),stationary=run(0,1);
assert.equal(idle.stats().foamEmitted,0);assert.equal(idle.stats().sprayEmitted,0);
assert(fast.stats().sprayEmitted>slow.stats().sprayEmitted*3);
assert(coast.stats().foamEmitted>0);assert(stationary.stats().sprayEmitted>0);
const highDrops=fast.spray.geometry.attributes,lowDrops=slow.spray.geometry.attributes;
let highest=0,lowHighest=0,sternRise=0,sideRise=0;
for(let i=0;i<highDrops.avelocity.count;i++)if(highDrops.abirth.getX(i)>=0){
 const rise=highDrops.avelocity.getY(i);highest=Math.max(highest,rise);
 const localX=highDrops.aorigin.getX(i)-23*highDrops.abirth.getX(i);
 if(localX<0)sternRise=Math.max(sternRise,rise);else sideRise=Math.max(sideRise,rise);
 assert(highDrops.alife.getX(i)>2*rise/9.81,'Droplets must survive the upward and downward flight');
}
for(let i=0;i<lowDrops.avelocity.count;i++)lowHighest=Math.max(lowHighest,lowDrops.avelocity.getY(i));
assert(highest>6&&highest>lowHighest*2,'High-speed spray must rise visibly higher');
assert(sternRise>6&&sideRise<2.6&&sideRise>0,'Tall spray stays behind the transom; side spray stays low');
const before=fast.stats(),origins=Array.from(fast.wake.geometry.attributes.aorigin.array);
fast.update(3,{nav:{x:69,z:0,heading:1,speed:23},engineP:1,engineS:1});
assert.deepEqual(fast.stats(),before);assert.deepEqual(Array.from(fast.wake.geometry.attributes.aorigin.array),origins);
fast.update(3.04,{nav:{x:500,z:0,heading:1,speed:23},engineP:1,engineS:1});
assert(Array.from(fast.wake.geometry.attributes.abirth.array).every(t=>t===-1000));
const reversed=run(-3,-1);const a=reversed.wake.geometry.attributes;
assert(a.aorigin.getZ(0)<-1.6);assert(a.avelocity.getX(0)>0);
const one=CB90.buildWake(THREE,waves);for(let i=0;i<60;i++)one.update(i/30,{nav:{},engineP:1,engineS:0});
assert(one.wake.geometry.attributes.aorigin.getZ(0)<0);
const f30=run(12,.7,3,30).stats(),f60=run(12,.7,3,60).stats();assert(Math.abs(f30.sprayEmitted-f60.sprayEmitted)<40);
console.log('PASS idle, low/high speed, coasting, stationary thrust, pause, persistent world positions, teleport reset, reverse, separate engines and frame-rate independence');
