#!/usr/bin/env node
// Exercise the packaged app, including actual GPU shaders and its UI controls.
// Run after tools/build.js. Screenshots are local QA artifacts, not test fixtures.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.GRAPHICS_QA_OUTPUT||path.join(root,'shots/graphics-2026-11-19'));
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--allow-file-access-from-files']});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
    await page.waitForFunction(()=>window.CB90?.app?.frames()>12,null,{timeout:90000});
    const initial=await page.evaluate(()=>({collision:CB90.app.state.nav.collision,hour:CB90.app.state.hour,panel:CB90.app.state.panelOpen}));
    assert.equal(initial.collision,false,'Building the scene must not generate a false grounding alarm');
    assert.ok(initial.hour>=13,'Startup must not simulate negative time');
    assert.equal(initial.panel,false);
    await page.evaluate(()=>{const a=CB90.app;a.actions.setPaused(true);a.actions.setDayCycle(false);a.actions.setHour(13);});
    const settle=async()=>{const frame=await page.evaluate(()=>CB90.app.frames());await page.waitForFunction(f=>CB90.app.frames()>f+8,frame);};
    const shot=async name=>{await settle();await page.screenshot({path:path.join(output,name+'.png')});};
    await shot('overview');
    const baseline=await page.evaluate(()=>({updates:CB90.app.modules.lighting.updates,textures:CB90.app.renderer.info.memory.textures}));
    await settle();
    assert.equal(await page.evaluate(()=>CB90.app.modules.lighting.updates),baseline.updates,'A paused sky must reuse its reflection map');
    await page.locator('#scenePresets [data-scene=evening]').click();
    await page.waitForFunction(n=>CB90.app.modules.lighting.updates>n,baseline.updates);
    assert.equal(await page.evaluate(()=>CB90.app.state.dayCycle),false);
    await shot('evening');
    await page.locator('#focusBtn').click();
    assert.equal(await page.evaluate(()=>CB90.app.state.focusView),true);
    await shot('focus-evening');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>CB90.app.state.focusView),false);
    await page.locator('#scenePresets [data-scene=day]').click();
    await page.evaluate(()=>CB90.app.actions.setView('wheelhouse',0));
    await shot('wheelhouse');
    await page.evaluate(()=>{const a=CB90.app;for(const r of a.articulations){if(/^(hatch|door|ramp|mast)$/.test(r.kind)){a.state.hatches[r.id].value=a.state.hatches[r.id].target=1;CB90.util.setArticulation(r,1);}}a.actions.setView('overview',0);});
    await shot('open');
    await page.evaluate(()=>CB90.app.actions.setCutaway(true));
    await shot('cutaway');
    await page.locator('button[data-mode=pilot]').click();
    assert.equal(await page.evaluate(()=>CB90.app.state.mode),'pilot');
    await shot('pilot');
    await page.evaluate(()=>{const a=CB90.app;a.actions.setQuality('low');a.actions.setWeather('storm');});
    await shot('pilot-storm-low');
    assert.equal(await page.evaluate(()=>CB90.app.modules.water.mesh.material.uniforms.reflectionEnabled.value),0);
    await page.evaluate(()=>{const a=CB90.app;a.actions.setMode('exterior');a.actions.setPanel(false);a.actions.setQuality('high');a.actions.setWeather('clear');a.actions.setHour(0);});
    await shot('night');
    await page.waitForFunction(()=>CB90.app.modules.lighting.updates>=3);
    assert.ok(await page.evaluate(()=>CB90.app.renderer.info.memory.textures)<=baseline.textures+3,'Sky refreshes must dispose their old reflection textures');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{const a=CB90.app;a.actions.setHour(13);a.actions.setView('overview',0);a.actions.setPanel(false);for(const r of a.articulations){if(/^(hatch|door|ramp|mast)$/.test(r.kind)){a.state.hatches[r.id].value=a.state.hatches[r.id].target=0;CB90.util.setArticulation(r,0);}}});
    await shot('mobile');
    assert.ok(await page.evaluate(()=>{
      const a=CB90.app,p=new THREE.Vector3();
      return [0,14.9].every(x=>{p.set(x,1,0);a.boat.localToWorld(p);p.project(a.camera);return Math.abs(p.x)<.95;});
    }),'Bow and stern remain inside the portrait frame');
    await page.locator('#panelToggle').click();
    await shot('mobile-panel');
    const panel=await page.locator('#panel').boundingBox();
    assert.ok(panel.x>=0&&panel.x+panel.width<=390&&panel.y>=0&&panel.y+panel.height<=844,'Mobile panel fits the viewport');
    assert.deepEqual(await page.evaluate(()=>CB90.app.errors),[]);
    assert.deepEqual(errors,[],'No JavaScript or WebGL shader errors');
    console.log('PASS packaged graphics: startup, dynamic sky/reuse/disposal, presets, focus, cabin, hatches, cutaway, pilot, storm, low quality, night and mobile');
    console.log('Screenshots: '+output);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
