const assert=require('assert'),fs=require('fs'),vm=require('vm');global.window=global;global.THREE=require('../src/vendor/three.min.js');
for(const f of ['sea-state','boat-motion'])vm.runInThisContext(fs.readFileSync('src/'+f+'.js','utf8'));
const nav=(speed=0,heading=0)=>({x:0,z:0,heading,speed,yawRate:0,collision:false});
const flat=()=>0;
function settle(speed){const m=CB90.createBoatMotion(flat),n=nav(speed);m.reset(n,0);return m.pose;}
assert.equal(settle(0).pitch,0);assert(settle(8).pitch>settle(23).pitch);assert(settle(23).heave>.25);
const ramp=CB90.createBoatMotion(flat),n=nav();ramp.reset(n,0);for(let i=1;i<=240;i++){n.speed=i/120*2;ramp.update(1/120,i/120,{nav:n});}assert(ramp.pose.acceleration>1.8);assert(ramp.pose.pitch>settle(4).pitch);
const paused=JSON.stringify(ramp.pose);ramp.update(.1,20,{nav:n,paused:true});assert.equal(JSON.stringify(ramp.pose),paused);
for(const heading of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
 const m=CB90.createBoatMotion(flat),n=nav(10,heading);m.reset(n,0);const boat=new THREE.Group();m.apply(boat,n);boat.updateMatrixWorld(true);
 const center=boat.localToWorld(new THREE.Vector3(6,0,0)),bow=boat.localToWorld(new THREE.Vector3(14,0,0)),stern=boat.localToWorld(new THREE.Vector3(0,0,0));
 assert(bow.y>stern.y+.5);assert(Math.abs(center.y-m.pose.heave)<1e-8);assert(Math.abs(center.x-6*Math.cos(heading))<1e-8);assert(Math.abs(center.z+6*Math.sin(heading))<1e-8);
}
const slope=CB90.createBoatMotion((x,z)=>.02*x+.03*z);slope.reset(nav(),0);assert(Math.abs(slope.pose.pitch-Math.atan(.02))<1e-8);assert(Math.abs(slope.pose.roll+Math.atan(.03))<1e-8);
const right=CB90.createBoatMotion(flat),left=CB90.createBoatMotion(flat);right.reset({...nav(15),yawRate:-.2},0);left.reset({...nav(15),yawRate:.2},0);assert(right.pose.roll>0);assert(Math.abs(right.pose.roll+left.pose.roll)<1e-8);
function cruise(hz){const m=CB90.createBoatMotion(CB90.Sea.height),n=nav(10,.7);m.reset(n,0);for(let i=1;i<=hz*12;i++){n.x=10*i/hz*Math.cos(n.heading);n.z=-10*i/hz*Math.sin(n.heading);m.update(1/hz,i/hz,{nav:n});}return m.pose;}
const a=cruise(30),b=cruise(120);assert(Math.abs(a.heave-b.heave)<.025);assert(Math.abs(a.pitch-b.pitch)<.005);assert(Math.abs(a.roll-b.roll)<.01);
const grounded=CB90.createBoatMotion(flat);grounded.reset({...nav(15),collision:true},0);assert.equal(grounded.pose.pitch,0);assert.equal(grounded.pose.heave,0);
console.log('PASS rest, transition/running trim, acceleration lift, pause, all headings, centre of rotation, wave slopes, turn banking, 30/120 FPS agreement and grounding');
