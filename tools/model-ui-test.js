#!/usr/bin/env node
// Isolated control-panel fixture: no application navigation, simulation or user tab.
// Drives the actual UI against the actual cabin articulation/visibility API.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const markup=fs.readFileSync(path.join(root,'src/page.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  await page.setContent(markup);
  await page.locator('#loading').evaluate(e=>e.remove());
  for(const f of ['vendor/three.min.js','constants.js','util.js','hull.js','superstructure.js','ui.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,'src',f),'utf8')});
  await page.evaluate(()=>{
   CB90.WEATHER={clear:{name:'Klart'}};
   const cabin=CB90.buildSuperstructure(THREE),hull=CB90.buildHull(THREE),records=[...cabin.articulations,...hull.articulations];
   const state={mode:'exterior',panelOpen:true,foredeckGun:false,radarOn:true,hatches:{},hour:12,dayMinutes:12,helm:0,engineP:0,engineS:0,enginesOn:true,plotterRange:1,quality:'high'};
   records.forEach(r=>state.hatches[r.id]={value:0,target:0});
   const actions=new Proxy({
    getWorld:()=>null,setPanel:v=>state.panelOpen=v,
    setForedeckGun:v=>{state.foredeckGun=v;cabin.setForedeckGun(v);},
    setHatch:(id,v)=>CB90.util.requestHatch(state.hatches,id,v),
    setAllHatches:v=>records.filter(r=>/^(hatch|door|ramp|mast)$/.test(r.kind)).forEach(r=>actions.setHatch(r.id,v))
   },{get:(o,k)=>k in o?o[k]:()=>{}});
   const ui=CB90.createUI(document.getElementById('panel'),state,actions,records,document.getElementById('hud'));ui.refresh();
   window.fixture={cabin,state,ui};
  });
  const mode=()=>page.evaluate(()=>({gun:fixture.cabin.parts.twinGunMount.visible,cover:fixture.cabin.parts.foredeckCover.visible,seat:fixture.state.hatches.seat_commander.target}));
  assert.deepEqual(await mode(),{gun:false,cover:true,seat:0});
  await page.locator('label.text[for="toggle-foredeckGun"]').click();
  assert.deepEqual(await mode(),{gun:true,cover:false,seat:0});
  await page.locator('label.text[for="toggle-foredeckGun"]').click();
  assert.deepEqual(await mode(),{gun:false,cover:true,seat:0});
  console.log('PASS Foredeck checkbox swaps complete weapon and cover in both directions');
  await page.locator('label.text[for="toggle-seat_commander"]').click();
  assert.equal((await mode()).seat,1);
  await page.getByRole('button',{name:'Stäng alla',exact:true}).click();
  assert.equal((await mode()).seat,1,'Hatch control should not change the crew seat');
  await page.locator('label.text[for="toggle-seat_commander"]').click();
  assert.equal((await mode()).seat,0);
  console.log('PASS Folding chair has its own working control, separate from hatch controls');
  await page.locator('label.text[for="toggle-hatch_bowS"]').click();
  assert.equal(await page.locator('#toggle-hatch_bowP').isChecked(),true,'Opening starboard must request port first');
  await page.locator('label.text[for="toggle-hatch_bowP"]').click();
  assert.equal(await page.locator('#toggle-hatch_bowS').isChecked(),false,'Closing port must request starboard first');
  console.log('PASS Bow-lid controls show the paired opening and closing requests');
  assert.deepEqual(errors,[]);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
