const {chromium}=require('playwright'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1100,height:700}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);await page.waitForFunction(()=>window.CB90&&CB90.app&&CB90.app.frames()>4,null,{timeout:60000});
 await page.evaluate(()=>{const a=CB90.app;a.actions.setPaused(true);a.actions.setQuality('low');a.state.panelOpen=false;});
 for(const [name,speed] of [['rest',0],['bow-lift',8],['planing',23]]){
  const frame=await page.evaluate(speed=>{const a=CB90.app,n=a.state.nav;n.speed=speed;n.collision=false;a.modules.motion.reset(n,10);a.modules.motion.apply(a.boat,n);a.boat.updateMatrixWorld(true);const local=new THREE.Vector3(6,3.4,24);a.camera.position.copy(a.boat.localToWorld(local));a.controls.controls.target.copy(a.boat.localToWorld(new THREE.Vector3(7,0,0)));a.controls.update(0);return a.frames();},speed);
  await page.waitForFunction(f=>CB90.app.frames()>f+1,frame);await page.locator('#viewport canvas').screenshot({path:path.resolve('shots/motion-'+name+'.png')});
 }
 let frame=await page.evaluate(()=>{CB90.app.actions.setMode('pilot');return CB90.app.frames();});await page.waitForFunction(f=>CB90.app.frames()>f+1,frame);
 const result=await page.evaluate(()=>{const a=CB90.app,localUp=new THREE.Vector3(0,1,0).applyQuaternion(a.boat.quaternion);return {errors:a.errors,upAlignment:localUp.dot(a.camera.up),pitch:a.modules.motion.pose.pitch,programs:a.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable)};});
 await page.locator('#viewport canvas').screenshot({path:path.resolve('shots/motion-pilot.png')});
 frame=await page.evaluate(()=>{CB90.app.actions.setMode('exterior');CB90.app.actions.reset();return CB90.app.frames();});await page.waitForFunction(f=>CB90.app.frames()>f+1,frame);
 const reset=await page.evaluate(()=>({speed:CB90.app.state.nav.speed,up:CB90.app.camera.up.y}));
 if(errors.length||result.errors.length||result.upAlignment<.999||!result.programs||reset.speed!==0||reset.up!==1)throw Error(JSON.stringify({errors,result,reset}));
 console.log('PASS standalone render, rest / bow lift / planing, cockpit orientation, reset and exterior horizon '+JSON.stringify(result));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
