const assert=require('assert'),fs=require('fs'),vm=require('vm');global.window=global;const THREE=require('../src/vendor/three.min.js');
for(const f of ['sea-state','weather'])vm.runInThisContext(fs.readFileSync('src/'+f+'.js','utf8'));
const state={paused:false,mode:'exterior'},scene=new THREE.Scene();scene.background=new THREE.Color();const camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight(),hemi=new THREE.HemisphereLight(),fill=new THREE.DirectionalLight();const w=CB90.createWeather(THREE,state,scene,camera,sun,hemi,fill);
state.dayCycle=false;state.hour=12;w.update(0,0);assert(w.uniforms.daylight.value>.99);assert(sun.intensity>1);
state.hour=0;w.update(0,0);assert.equal(w.uniforms.daylight.value,0);assert.equal(sun.intensity,0);
state.dayCycle=true;state.hour=23.99;state.dayMinutes=3;w.update(1,1);assert(state.hour<1);
state.paused=true;const hour=state.hour;w.update(10,1);assert.equal(state.hour,hour);
const windObject=state.wind;
for(const [key,p] of Object.entries(CB90.WEATHER)){w.setWeather(key);w.update(0,1);assert(Math.abs(CB90.Sea.strength.value-p.waves)<1e-8);assert.equal(w.rain.visible,p.rain>0);assert(Math.abs(scene.fog.density-p.fog)<1e-10);assert(Math.abs(Math.hypot(state.wind.x,state.wind.z)-p.wind)<1e-7,'Preset wind speed is not published to the flag');assert.strictEqual(state.wind,windObject,'Weather replaces the shared wind object');}
state.mode='pilot';w.update(0,1);assert.equal(w.rain.material.uniforms.inside.value,1);
console.log('PASS noon/night, midnight wrap, cycle speed, pause, all weather presets, sea strength, wind speed, fog and interior rain');

// Explicit weather selection may snap while paused; an ongoing transition
// must stop, then continue smoothly when the simulation resumes.
w.setWeather('clear');w.update(0,1);state.paused=false;state.dayCycle=false;
const clearWind={...state.wind};w.setWeather('storm');w.update(0,1);
assert.deepEqual(state.wind,clearWind,'Changing a running preset causes an instant wind jump');
w.update(.1,1.1);const changing=Math.hypot(state.wind.x,state.wind.z);
assert(changing>CB90.WEATHER.clear.wind&&changing<CB90.WEATHER.storm.wind,'Wind does not interpolate between presets');
state.paused=true;const held={...state.wind};state.nav={heading:Math.PI/2};w.update(8,999);
assert.deepEqual(state.wind,held,'Paused wind transition continues or rotates with vessel heading');
state.paused=false;let previous=changing;
for(let i=0;i<100;i++){
  state.nav.heading=i*.1;w.update(.1,1.2+i*.1);const speed=Math.hypot(state.wind.x,state.wind.z);
  assert(speed>=previous-1e-10&&speed<CB90.WEATHER.storm.wind+1e-7,'Wind transition overshoots or reverses');
  assert(Math.abs(state.wind.x*clearWind.z-state.wind.z*clearWind.x)<1e-8,'World wind rotates when the vessel turns');previous=speed;
}
assert(previous>CB90.WEATHER.storm.wind-.02,'Wind transition never reaches the requested weather');
function windSequence(hz){
  const s={paused:false,mode:'exterior'},sc=new THREE.Scene();sc.background=new THREE.Color();
  const weather=CB90.createWeather(THREE,s,sc,new THREE.PerspectiveCamera(),new THREE.DirectionalLight(),new THREE.HemisphereLight(),new THREE.DirectionalLight());
  s.dayCycle=false;weather.update(0,0);
  for(const name of ['storm','fog']){weather.setWeather(name);for(let i=0;i<hz*2;i++)weather.update(1/hz,i/hz);}
  return s.wind;
}
const wind30=windSequence(30),wind120=windSequence(120);
assert(Math.hypot(wind30.x-wind120.x,wind30.z-wind120.z)<1e-8,'Weather wind depends on frame rate');
console.log('PASS world-fixed wind direction, smooth weather transitions, pause/resume and 30/120 FPS wind agreement');
