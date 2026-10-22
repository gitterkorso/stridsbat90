const {chromium}=require('playwright'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
const p=await browser.newPage({viewport:{width:800,height:600}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});p.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}});await p.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);let configured=false;window.requestAnimationFrame=cb=>raf(t=>{if(window.CB90&&CB90.app&&!configured){configured=true;CB90.app.actions.setQuality('medium');}cb(t);});});await p.goto(pathToFileURL(path.resolve('dist/index.html')).href,{waitUntil:'domcontentloaded',timeout:90000});console.log('Page loaded');await p.waitForFunction(()=>window.CB90&&CB90.app&&CB90.app.frames()>5,null,{timeout:90000});
await p.evaluate(()=>{CB90.app.actions.setPaused(true);CB90.app.actions.setQuality('medium');CB90.app.actions.setDayCycle(false);});
await p.locator('[data-tab="weather"]').evaluate(e=>e.click());
for(const [name,hour] of [['clear',12],['clear',0],['cloudy',18],['fog',10],['rain',14],['storm',16]]){
 await p.locator('[data-weather="'+name+'"]').evaluate(e=>e.click());const frame=await p.evaluate(hour=>{CB90.app.actions.setHour(hour);return CB90.app.frames();},hour);await p.waitForFunction(f=>CB90.app.frames()>f+1,frame);await p.screenshot({path:path.resolve('shots/weather-'+name+'-'+hour+'.png')});
}
const result=await p.evaluate(()=>({errors:CB90.app.errors,programs:CB90.app.renderer.info.programs.every(p=>!p.diagnostics||p.diagnostics.runnable)}));if(errors.length||result.errors.length||!result.programs)throw Error(JSON.stringify({errors,result}));console.log('PASS day/night and all five weather modes, UI controls and WebGL shaders');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
