#!/usr/bin/env node
// Neutral, repeatable reference views. Requires playwright and an installed Chrome.
// node tools/render-forepeak.js [output-directory] [source-directory]
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'shots/hardware-2026-10-20-stowage'));
const source = path.resolve(process.argv[3] || path.join(root, 'src'));
fs.mkdirSync(output, { recursive: true });
const scripts = ['vendor/three.min.js','constants.js','util.js','hull.js','superstructure.js','equipment.js','waterjet.js'];
const html = '<html><body style="margin:0">' + scripts.map(file => '<script>' + fs.readFileSync(path.join(source,file),'utf8').replace(/<\/script/gi,'<\\/script') + '</script>').join('') + '</body></html>';
(async () => {
  const browser = await chromium.launch({ channel:'chrome', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport:{width:1600,height:1000}, deviceScaleFactor:1 });
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.setContent(html);
    await page.evaluate(() => {
      const scene=new THREE.Scene(); scene.background=new THREE.Color(0xe5e9e7);
      const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
      renderer.setSize(1600,1000);renderer.outputEncoding=THREE.sRGBEncoding;renderer.setPixelRatio(1);
      document.body.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffffff,0x767c6b,1.0));
      const light=new THREE.DirectionalLight(0xffffff,.8); light.position.set(6,12,8);scene.add(light);
      const modules=[CB90.buildHull(THREE),CB90.buildSuperstructure(THREE),CB90.buildEquipment(THREE),CB90.buildWaterjets(THREE)];
      modules.forEach(m=>scene.add(m.group));
      // Match the application's sRGB-to-linear conversion; otherwise painted
      // fittings look much paler in these reference views than in the app.
      const treated=new Set();
      modules.forEach(m=>m.group.traverse(o=>{
        if(!o.isMesh)return;
        (Array.isArray(o.material)?o.material:[o.material]).forEach(mat=>{
          if(!mat || treated.has(mat))return;treated.add(mat);
          if(mat.isMeshStandardMaterial)mat.color.convertSRGBToLinear();
        });
      }));
      const camera=new THREE.PerspectiveCamera(68,1.6,.025,100);
      window.audit={scene,renderer,modules,camera};
    });
    const views={'stowage-detail':[13.25,.95,-.25]};
    for(const [name,position] of Object.entries(views)){
      await page.evaluate(({name,position})=>{
        const {scene,renderer,modules,camera}=audit;
        camera.position.set(...position);camera.lookAt(11.5,.38,.56);
        modules[1].setForedeckGun(false); const zoom=1;camera.zoom=zoom;camera.updateProjectionMatrix();
        modules.forEach(m=>(m.articulations||[]).forEach(r=>{if(['hatch','door','ramp','mast'].includes(r.kind))CB90.util.setArticulation(r,0);}));
        if(['open','half','corridor','stowage','stowage-detail'].includes(name))modules.forEach(m=>(m.articulations||[]).forEach(r=>{if(['hatch','door','ramp','mast'].includes(r.kind))CB90.util.setArticulation(r,name==='half'?.5:1);}));
        CB90.util.setArticulation(modules[0].articulations.find(r=>r.id==='door_wtFwd'),0);modules[0].update(); if(name==='troop'){modules.slice(1).forEach(m=>m.group.visible=false);modules[0].group.children.forEach(c=>c.visible=c===modules[0].parts.interior);} scene.updateMatrixWorld(true);renderer.render(scene,camera);
      },{name,position});
      await page.locator('canvas').screenshot({path:path.join(output,name+'.png')});
    }
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('Rendered forepeak storage view without browser errors: '+output);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
