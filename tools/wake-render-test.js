const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.setContent('<body style="margin:0">'+['vendor/three.min','constants','util','hull','superstructure','equipment','waterjet','sea-state','weather','wake','water-depth','hull-waves','hull-wave-surface','water'].map(f=>'<script>'+fs.readFileSync('src/'+f+'.js','utf8')+'</script>').join(''));
await page.evaluate(()=>{
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,800);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 document.body.appendChild(renderer.domElement);const scene=new THREE.Scene();scene.background=new THREE.Color(0x91acbb);
 const boat=new THREE.Group();for(const build of ['buildHull','buildSuperstructure','buildEquipment','buildWaterjets'])boat.add(CB90[build](THREE).group);scene.add(boat);
 const water=CB90.buildWater(THREE);scene.add(water.group);scene.add(new THREE.HemisphereLight(0xe4f3ff,0x566355,1.2));const sun=new THREE.DirectionalLight(0xfff1db,1.2);sun.position.set(-30,70,60);scene.add(sun);
 const camera=new THREE.PerspectiveCamera(50,1.6,.1,2000);window.test={renderer,scene,boat,water,camera};
});
for(const [name,speed,power] of [['idle',0,0],['slow',3,.15],['fast',23,1],['reverse',-3,-.7]]){
 await page.evaluate(({speed,power})=>{const {renderer,scene,boat,water,camera}=test;water.wakeSystem.clear();water.update(0,{nav:{}});for(let i=0;i<=240;i++){const t=i/30;water.update(t,{nav:{x:speed*t,z:0,heading:0,speed},engineP:power,engineS:power,enginesOn:true,helm:0});}boat.position.x=speed*8;camera.position.set(boat.position.x-24,13,24);camera.lookAt(boat.position.x-5,0,0);scene.updateMatrixWorld(true);renderer.render(scene,camera);},{speed,power});
 await page.locator('canvas').screenshot({path:path.resolve('shots/wake-'+name+'.png')});
}
const programs=await page.evaluate(()=>test.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable));if(errors.length||!programs)throw Error(errors.join('\n'));console.log('PASS WebGL shaders and idle / slow / fast / reverse renders');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
