#!/usr/bin/env node
// Neutral, repeatable reference views. Requires playwright and an installed Chrome.
// node tools/render-cabin.js [output-directory] [source-directory]
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, 'shots/full-audit-2026-10-20/cabin'));
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
      const camera=new THREE.PerspectiveCamera(76,1.6,.025,100);
      window.audit={scene,renderer,modules,camera};
    });
    const views={
      pilot:{position:[9.44,2.24,.657],target:[11,1.78,.657]},
      navigator:{position:[9.44,2.24,-.657],target:[11,1.65,-.657]},
      aisle:{position:[8.0,1.32,0],target:[10.7,.80,0]},
      layout:{position:[7.2,5.2,5.0],target:[9.65,.85,0]},
      seat:{position:[8.0,2.7,.2],target:[9.1,.95,0],seat:1}
    };
    for(const [name,view] of Object.entries(views)){
      await page.evaluate(({name,view})=>{
        const {scene,renderer,modules,camera}=audit;
        camera.position.set(...view.position);if(name==='pilot'||name==='navigator'){modules[1].parts.pilotEye.getWorldPosition(camera.position);if(name==='navigator')camera.position.z*=-1;}camera.lookAt(...view.target);camera.fov=name==='layout'?48:76;camera.updateProjectionMatrix();
        modules[0].group.visible=name!=='layout'&&name!=='seat';modules[2].group.visible=name!=='layout'&&name!=='seat';modules[3].group.visible=false;
        const cabin=modules[1];
        for(const key of ['walls','roof','windscreen','roofGear'])cabin.parts[key].visible=name!=='layout'&&name!=='seat';
        for(const key of ['foredeckCover','twinGunMount'])cabin.parts[key].visible=false;
        for(const art of cabin.articulations)if(art.id==='seat_commander')CB90.util.setArticulation(art,view.seat||0);
        cabin.update(0,{helm:0,engineP:0,engineS:0,bucketP:.7,bucketS:.7});
        modules[0].update(0,{},0);scene.updateMatrixWorld(true);renderer.render(scene,camera);
      },{name,view});
      await page.locator('canvas').screenshot({path:path.join(output,name+'.png')});
    }
    if(errors.length)throw new Error(errors.join('\n'));
    console.log('Rendered five cabin views without browser errors: '+output);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
