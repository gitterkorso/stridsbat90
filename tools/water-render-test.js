// Render actual WebGL shaders and check reflection/wake integration in the standalone app.
const {chromium}=require('playwright');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href+'?seed=90848');
  await page.waitForFunction(()=>window.CB90&&CB90.app&&CB90.app.frames()>8,{},{timeout:60000});
  await page.evaluate(()=>CB90.app.actions.setPaused(true));
  await page.locator('#viewport canvas').screenshot({path:'shots/water-realistic-overview.png'});
  for(const mode of ['pilot','walk','exterior']){
   await page.evaluate(mode=>{CB90.app.actions.setMode(mode);},mode);
   const frame=await page.evaluate(()=>CB90.app.frames());
   await page.waitForFunction(f=>CB90.app.frames()>f+2,frame);
   if(mode==='pilot')await page.locator('#viewport canvas').screenshot({path:'shots/water-realistic-pilot.png'});
  }
  const result=await page.evaluate(()=>{
   const a=CB90.app,w=a.modules.water;
   a.state.nav.speed=12;
   w.update(17,{nav:a.state.nav});
   a.renderer.render(a.scene,a.camera);
   return {errors:a.errors,reflection:w.mesh.material.uniforms.reflectionEnabled.value,wakeVisible:w.parts.wake.visible,vertices:w.mesh.geometry.attributes.position.count,programs:a.renderer.info.programs.map(p=>({name:p.name,ok:!p.diagnostics||p.diagnostics.runnable}))};
  });
  await page.locator('#viewport canvas').screenshot({path:'shots/water-realistic-wake.png'});
  await page.evaluate(()=>CB90.app.actions.setQuality('low'));
  const frame=await page.evaluate(()=>CB90.app.frames());
  await page.waitForFunction(f=>CB90.app.frames()>f+2,frame);
  const fallback=await page.evaluate(()=>CB90.app.modules.water.mesh.material.uniforms.reflectionEnabled.value);
  if(errors.length||result.errors.length||result.programs.some(p=>!p.ok)||result.reflection!==1||!result.wakeVisible||fallback!==0)throw Error(JSON.stringify({errors,result,fallback}));
  console.log(JSON.stringify({status:'PASS',reflection:result.reflection,fallback,vertices:result.vertices,shaderPrograms:result.programs.length,views:['overview','pilot','walk','wake']},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
