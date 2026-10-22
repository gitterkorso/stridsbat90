#!/usr/bin/env node
// Isolated flag fixture; renders the actual equipment module, without opening the app or a user tab.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'shots/flag-2026-10-22'));
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1160},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<body style="margin:0;background:#dce4e6;font:16px system-ui"><div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr)"></div></body>');
  for(const f of ['vendor/three.min.js','constants.js','util.js','equipment.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,'src',f),'utf8')});
  await page.evaluate(()=>{
   const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(720,480);renderer.outputEncoding=THREE.sRGBEncoding;
   renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
   const scene=new THREE.Scene();scene.background=new THREE.Color('#dce4e6');
   scene.add(new THREE.HemisphereLight(0xf4fcff,0x47534c,.8));
   const sun=new THREE.DirectionalLight(0xfff4d7,1.2);sun.position.set(-2,5,3);scene.add(sun);
   const camera=new THREE.OrthographicCamera(-1.3,1.3,.866,-.866,.01,20),st=CB90.M.ENSIGN_STAFF,fy=st.y+st.h-.625/2-.035;
   camera.position.set(st.x,fy+.3,4);camera.lookAt(st.x,fy-.08,st.z);
   let equipment=null;
   const cases=[
    {name:'Stilla · ingen vind',state:{wind:{x:0,z:0},nav:{speed:0,heading:0}}},
    {name:'Lätt vind · förtöjd',state:{wind:{x:-3.8,z:-1.2},nav:{speed:0,heading:0}}},
    {name:'Fartvind · 40 knop',state:{wind:{x:-3.8,z:-1.2},nav:{speed:20.6,heading:.4}}},
    {name:'Medvind · aktern mot vinden',state:{wind:{x:-10,z:-2},nav:{speed:0,heading:Math.PI}}}
   ];
   for(const sample of cases){
    if(equipment)scene.remove(equipment.group);
    equipment=CB90.buildEquipment(THREE);scene.add(equipment.group);
    equipment.group.children.forEach(o=>o.visible=o===equipment.parts.transom);
    equipment.group.updateMatrixWorld(true);
    equipment.parts.transom.children.forEach(o=>{const b=new THREE.Box3().setFromObject(o);o.visible=o===equipment.parts.ensignFlag||(b.max.y>2.3&&b.max.x<.5&&b.min.x>0);});
    for(let i=0;i<600;i++)equipment.update(1/60,sample.state,i/60);
    for(let frame=0;frame<4;frame++){
     if(frame)for(let i=0;i<15;i++)equipment.update(1/60,sample.state,0);
     renderer.render(scene,camera);
     const card=document.createElement('div');card.style.cssText='padding:8px;box-sizing:border-box';
     const title=document.createElement('div');title.textContent=sample.name+' · '+(frame*.25).toFixed(2)+' s';title.style.cssText='font-size:13px;padding:7px 0';card.append(title);
     const img=new Image();img.src=renderer.domElement.toDataURL();img.style.cssText='display:block;width:100%;border-radius:8px';card.append(img);document.getElementById('grid').append(card);
    }
   }
  });
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  await page.locator('#grid').screenshot({path:path.join(out,'motion-study.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Rendered 16 flag poses without browser errors: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
