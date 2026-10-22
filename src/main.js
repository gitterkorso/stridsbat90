// CB90 H — scene, ship navigation, first-person boarding and physical cockpit interaction.
window.CB90 = window.CB90 || {};
(function () {
  'use strict';
  const U=CB90.util, M=CB90.M, $=id=>document.getElementById(id), q=new URLSearchParams(location.search);
  const viewport=$('viewport'), status=$('status'), errors=[];
  function error(e){const msg=String(e&&e.message||e);if(!errors.includes(msg))errors.push(msg);status.textContent='ERROR '+errors.join(' | ');console.error(e);$('loadMessage').textContent='Kunde inte starta 3D-vyn: '+msg;}
  window.addEventListener('error',e=>error(e.error||e.message));
  window.addEventListener('unhandledrejection',e=>error(e.reason));
  if(typeof THREE==='undefined'){error('3D-biblioteket saknas. Bygg projektet igen.');return;}
  const state={hatches:{},mode:'exterior',view:'overview',engineP:0,engineS:0,enginesOn:true,helm:0,throttle:0,bucketP:.7,bucketS:.7,linkBuckets:true,foredeckGun:false,radarOn:true,radarRpm:24,cutaway:false,showJet:false,showWater:true,shadows:true,paused:false,sound:false,panelOpen:true,helpOpen:false,autoRotate:false,quality:'high',interaction:'',walkZone:'Styrhytt',seed:0,chart:null,plotterRange:1,plotterOrientation:'north',plotterNear:true,notice:''};
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});}catch(e){error(e);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  viewport.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interaktiv 3D-vy av Stridsbåt 90 H');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xaabec1);scene.fog=new THREE.Fog(0xafc2c5,420,1600);
  const camera=new THREE.PerspectiveCamera(44,1,.035,2500);
  const boat=new THREE.Group();boat.name='CB90 H · 845';scene.add(boat);
  const hemi=new THREE.HemisphereLight(0xd6e7ef,0x726b51,.70);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffebc6,1.35);sun.position.set(-38,72,65);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:160});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0002;sun.shadow.normalBias=.025;scene.add(sun,sun.target);
  const fill=new THREE.DirectionalLight(0xb9d9ed,.22);fill.position.set(20,5,-20);scene.add(fill);
  // Soft studio-like sky reflection on glazing and exposed metal; the visible sky remains part of the archipelago.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
  const ec=envCanvas.getContext('2d'), grad=ec.createLinearGradient(0,0,0,256);
  grad.addColorStop(0,'#6c9bbd');grad.addColorStop(.45,'#cbdadc');grad.addColorStop(.53,'#f5e7cb');grad.addColorStop(.58,'#526b6c');grad.addColorStop(1,'#263d3a');ec.fillStyle=grad;ec.fillRect(0,0,512,256);
  const envTex=new THREE.CanvasTexture(envCanvas);envTex.mapping=THREE.EquirectangularReflectionMapping;envTex.encoding=THREE.sRGBEncoding;
  const pmrem=new THREE.PMREMGenerator(renderer), envTarget=pmrem.fromEquirectangular(envTex);scene.environment=envTarget.texture;pmrem.dispose();envTex.dispose();
  // Procedural archipelago: one seed (URL ?seed=N) drives the terrain, the handling model and the chart plotters.
  const A=CB90.Archipelago;let world=null;
  function readSeed(){const raw=q.get('seed');const n=raw==null||raw===''?NaN:Number(raw);return Number.isFinite(n)&&n>=0?Math.floor(n):A.DEFAULT_SEED;}
  function makeWorld(seed){const w=A.create(seed);w.start=w.findStart();w.home=w.survey(w.start.x,w.start.z,1800,6);return w;}
  function applyWorld(w){world=w;state.seed=w.seed;state.chart=w.chartName();const c=$('chartName');if(c)c.textContent=state.chart.name.toUpperCase()+' · '+state.chart.no;}
  try{if(!A)throw new Error('archipelago.js saknas');$('loadMessage').textContent='Mäter upp skärgården…';applyWorld(makeWorld(readSeed()));}catch(e){error('archipelago: '+e.message);world=null;}
  const modules={};
  function build(key,fn,parent,...args){try{const m=CB90[fn](THREE,...args);modules[key]=m;parent.add(m.group||m.mesh);return m;}catch(e){error(key+': '+e.message);return null;}}
  const water=build('water','buildWater',scene), environment=build('environment','buildEnvironment',scene,world);
  if(water&&water.setWorld)water.setWorld(world);
  const terrainOf=env=>env&&env.sampler&&typeof env.sampler.height==='function'?env.sampler:(env&&Array.isArray(env.islands)?env.islands:[]);
  const hull=build('hull','buildHull',boat), superstructure=build('superstructure','buildSuperstructure',boat), waterjets=build('waterjets','buildWaterjets',boat), equipment=build('equipment','buildEquipment',boat);
  // Three r128 expects linear material colors when rendering to sRGB. Texture maps already declare their color space.
  const treatedMaterials=new Set();
  boat.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
    if(!m||treatedMaterials.has(m))return;treatedMaterials.add(m);
    if(m.isMeshStandardMaterial){m.color.convertSRGBToLinear();m.envMapIntensity=.65;}
    if(m.name==='camo'){const painted=U.camoMaterial();m.onBeforeCompile=painted.onBeforeCompile;m.customProgramCacheKey=painted.customProgramCacheKey;}
  });});
  const controls=CB90.createControls(THREE,camera,renderer.domElement);controls.setFrame(boat);modules.controls=controls;
  const weather=CB90.createWeather(THREE,state,scene,camera,sun,hemi,fill);modules.weather=weather;
  const navigation=CB90.createNavigation(state,terrainOf(environment),world?world.start:null);
  const motion=CB90.createBoatMotion(CB90.Sea.height);modules.motion=motion;
  let plotter=null;
  try{const screens=superstructure&&superstructure.parts&&superstructure.parts.plotterScreens;if(world&&screens&&typeof CB90.createPlotter==='function'){plotter=CB90.createPlotter(THREE,world,state,screens);modules.plotter=plotter;}}catch(e){error('plotter: '+e.message);plotter=null;}
  function syncPlotter(){if(plotter){state.plotterRange=plotter.range;state.plotterOrientation=plotter.orientation;}}
  syncPlotter();
  if(q.get('plotter')==='1'&&plotter&&plotter.canvas){const c=plotter.canvas;Object.assign(c.style,{position:'fixed',left:'0',bottom:'0',width:'512px',height:'204px',zIndex:'20',pointerEvents:'none'});$('app').appendChild(c);}
  const reflectionTarget=new THREE.WebGLRenderTarget(768,512,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat});
  reflectionTarget.texture.encoding=THREE.LinearEncoding;
  const mirrorCamera=new THREE.PerspectiveCamera(),mirrorDirection=new THREE.Vector3(),mirrorLook=new THREE.Vector3();
  const reflectionMatrix=new THREE.Matrix4(),reflectionBias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  const reflectionClip=[new THREE.Plane(new THREE.Vector3(0,1,0),.015)];
  function reflectSea(){
    if(!water||!water.setReflection)return;
    if(state.quality!=='high'||!state.showWater||camera.position.y<0.05){water.setReflection(null,null,false);return;}
    mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=-camera.position.y-0.03;
    camera.getWorldDirection(mirrorDirection);mirrorDirection.y*=-1;
    mirrorLook.copy(mirrorCamera.position).add(mirrorDirection);mirrorCamera.up.copy(camera.up);mirrorCamera.up.y*=-1;mirrorCamera.lookAt(mirrorLook);
    mirrorCamera.near=camera.near;mirrorCamera.far=camera.far;mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);mirrorCamera.updateMatrixWorld(true);
    reflectionMatrix.copy(reflectionBias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
    const previousTarget=renderer.getRenderTarget(),previousTone=renderer.toneMapping,previousClip=renderer.clippingPlanes,waterVisible=(water.group||water.mesh).visible;
    (water.group||water.mesh).visible=false;renderer.toneMapping=THREE.NoToneMapping;renderer.clippingPlanes=reflectionClip;
    const shadowUpdate=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;
    renderer.setRenderTarget(reflectionTarget);renderer.clear();renderer.render(scene,mirrorCamera);
    renderer.setRenderTarget(previousTarget);renderer.toneMapping=previousTone;renderer.clippingPlanes=previousClip;renderer.shadowMap.autoUpdate=shadowUpdate;(water.group||water.mesh).visible=waterVisible;
    water.setReflection(reflectionTarget.texture,reflectionMatrix,true);
  }

  const artRecords=[],artById={};
  const toggleKind=r=>/^(hatch|door|ramp|mast)$/.test(r.kind);
  Object.values(modules).forEach(m=>(m.articulations||[]).forEach(r=>{if(artById[r.id])return;artById[r.id]=r;artRecords.push(r);const v=r.kind==='elev'?(0-r.closed)/(r.open-r.closed):0;state.hatches[r.id]={value:v,target:v};U.setArticulation(r,v);if(toggleKind(r)||r.kind==='seat')r.pivot.userData.hatch=r.id;}));
  const keys=new Set(),pressedAt=new Map(),keyTimers=new Map(), walk={x:9.02,z:0,yaw:0,pitch:-.10}, look={yaw:0,pitch:-.13};
  let ui, currentHover=null, dragging=null, oldX=0,oldZ=0,oldHeading=0, elapsed=0,frames=0,lastTime=performance.now(),photoTime=0;
  let panelBeforePilot=true, walkEyeY=M.WH_FLOOR_Y+1.63;
  const localEye=new THREE.Vector3(),worldTarget=new THREE.Vector3(),axisY=new THREE.Vector3(0,1,0),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),pickList=[],wheelhouseWorld=new THREE.Vector3();
  // Put the hull (and thereby the exterior camera frame) at the navigation state without a per-frame delta.
  function placeBoat(){const n=state.nav;motion.reset(n,elapsed);motion.apply(boat,n);boat.updateMatrixWorld(true);oldX=n.x;oldZ=n.z;oldHeading=n.heading;}
  placeBoat();
  boat.traverse(o=>{if(o.isMesh)pickList.push(o);});
  function cutaway(on){state.cutaway=!!on;[hull,superstructure,equipment].forEach(m=>{if(m&&m.setCutaway)m.setCutaway(on);});}
  function setMode(mode,zone){
    if(!['exterior','walk','pilot'].includes(mode))return;
    const previous=state.mode;state.mode=mode;currentHover=null;$('objectHint').hidden=true;keys.clear();dragging=null;controls.cancelTween();
    controls.controls.enabled=mode==='exterior';controls.autoRotate(false);state.autoRotate=false;
    if(mode!=='exterior'){cutaway(false);state.panelOpen=false;camera.clearViewOffset();camera.fov=mode==='pilot'?80:76;camera.updateProjectionMatrix();}
    if(mode==='pilot'){if(previous==='exterior')panelBeforePilot=state.panelOpen;look.yaw=0;look.pitch=-.30;}
    if(mode==='walk'){
      if(zone==='troop'){walk.x=6.4;walk.z=0;walk.yaw=0;}
      else if(zone==='bow'){walk.x=12.4;walk.z=0;walk.yaw=0;actions.setHatch('door_wtFwd',1);}
      else if(zone==='engine'){walk.x=2.7;walk.z=0;walk.yaw=Math.PI;}
      else {walk.x=9.0;walk.z=0;walk.yaw=previous==='pilot'?Math.PI:0;}
      walk.pitch=-.08;
    }
    if(mode==='walk')walkEyeY=walkFloor(walk.x)+walkEyeHeight(walk.x);
    if(mode==='exterior'){camera.up.set(0,1,0);if(document.pointerLockElement)document.exitPointerLock();state.panelOpen=true;camera.fov=44;camera.updateProjectionMatrix();actions.setView(state.view||'overview',0);}
    $('app').dataset.mode=mode;resize();if(ui)ui.refresh();
  }
  function setEngine(side,value){const v=U.clamp(+value||0,-1,1);if(side==='P'||side==='both')state.engineP=v;if(side==='S'||side==='both')state.engineS=v;}
  function actOnHit(hit){
    if(!hit)return;
    if(hit.hatch){const h=state.hatches[hit.hatch];actions.setHatch(hit.hatch,h.target<.5?1:0);}
    else if(hit.control==='seat'||hit.control==='helm')setMode('pilot');
    if(ui)ui.refresh();
  }
  const actions={
    setMode, setEngine,
    setWeather: name=>weather.setWeather(name),
    setHour: hour=>{state.hour=((Number(hour)||0)%24+24)%24;},
    setDayCycle: enabled=>{state.dayCycle=!!enabled;},
    setDayMinutes: minutes=>{state.dayMinutes=Math.max(3,Math.min(60,Number(minutes)||12));},
    setHelm(v){state.helm=U.clamp(+v||0,-30,30);},
    setThrottle(v){setEngine('both',v);},
    setEngines(on){state.enginesOn=!!on;},
    neutral(){setEngine('both',0);},
    centerHelm(){state.helm=0;},
    reset(){navigation.reset();placeBoat();if(water&&water.reset)water.reset(state.nav,motion.pose);setMode(state.mode);},
    newArchipelago(seed){
      if(!A)return;const next=seed!=null&&seed!==''&&Number.isFinite(+seed)?Math.floor(+seed)>>>0:100000+Math.floor(Math.random()*900000);
      state.notice='Ritar ny skärgård…';if(ui)ui.refresh();
      // Let the notice paint before the synchronous rebuild (about a quarter of a second).
      setTimeout(()=>{
        try{
          applyWorld(makeWorld(next));
          if(environment&&environment.setWorld)environment.setWorld(world);
          if(water&&water.setWorld)water.setWorld(world);
          navigation.setTerrain(terrainOf(environment),world.start);
          if(plotter&&plotter.setWorld)plotter.setWorld(world);
          actions.reset();
          try{const u=new URL(location.href);u.searchParams.set('seed',String(next));history.replaceState(null,'',u.href);}catch(e){}
        }catch(e){error(e);}
        state.notice='';if(ui)ui.refresh();
      },40);
    },
    setPlotterRange(nm){if(plotter&&plotter.setRange)plotter.setRange(+nm);syncPlotter();},
    cyclePlotterRange(dir){if(plotter&&plotter.cycleRange)plotter.cycleRange(dir>=0?1:-1);syncPlotter();},
    togglePlotterOrientation(){if(plotter&&plotter.toggleOrientation)plotter.toggleOrientation();syncPlotter();},
    setPlotterOrientation(o){if(plotter&&plotter.setOrientation)plotter.setOrientation(o==='head'?'head':'north');syncPlotter();},
    getPlotter:()=>plotter,getWorld:()=>world,
    setHatch(id,v){U.requestHatch(state.hatches,id,v);},
    setAllHatches(v){artRecords.forEach(r=>{if(toggleKind(r))U.requestHatch(state.hatches,r.id,v);});},
    setForedeckGun(v){state.foredeckGun=!!v;if(superstructure)superstructure.setForedeckGun(state.foredeckGun);},
    setRadar(v){state.radarOn=!!v;},setRadarRpm(v){state.radarRpm=U.clamp(v,0,48);},
    setView(name,secs){if(!controls.views[name])return;state.view=name;if(state.mode!=='exterior')setMode('exterior');controls.setView(name,secs==null?.7:secs);},
    setAutoRotate(v){state.autoRotate=!!v;controls.autoRotate(v);},
    setCutaway:cutaway,
    setShowJet(v){state.showJet=!!v;},setShowWater(v){state.showWater=!!v;},
    setPanel(v){state.panelOpen=!!v;resize();},setHelp(v){state.helpOpen=!!v;keys.clear();},
    setPaused(v){state.paused=!!v;keys.clear();},
    setSound(v){state.sound=!!v;if(v)initAudio();},
    setQuality(v){state.quality=v;renderer.setPixelRatio(v==='high'?Math.min(devicePixelRatio||1,1.6):1);renderer.shadowMap.enabled=v==='high';resize(true);},
    moveKey(k,on){if(on){clearTimeout(keyTimers.get(k));pressedAt.set(k,performance.now());keys.add(k);}else releaseKey(k);},
    lockMouse(){renderer.domElement.focus();try{const promise=renderer.domElement.requestPointerLock();if(promise&&promise.catch)promise.catch(()=>{state.interaction='Dra med musen för att se dig omkring';});}catch(e){state.interaction='Dra med musen för att se dig omkring';}},
    interact(){if(currentHover)actOnHit(currentHover);else if(state.mode==='walk'&&walk.x>8.6&&walk.x<10.5)setMode('pilot');},
    photo(){renderer.render(scene,camera);const a=document.createElement('a');a.download='CB90H-'+new Date().toISOString().slice(0,10)+'.png';a.href=renderer.domElement.toDataURL('image/png');a.click();photoTime=2;},
    getAngles:()=>waterjets&&waterjets.getAngles?waterjets.getAngles():{helm:state.helm,bucketP:state.bucketP,bucketS:state.bucketS},
    getThrust:()=>({P:state.engineP,S:state.engineS})
  };
  ui=CB90.createUI($('panel'),state,actions,artRecords,$('hud'));
  function resize(force){const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
    if(force||renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||camera.aspect!==w/h){renderer.setSize(w,h,false);camera.aspect=w/h;}
    if(state.mode==='exterior'&&state.panelOpen&&w>900)camera.setViewOffset(w,h,128,0,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();
  }
  window.addEventListener('resize',()=>resize(true));
  function controlOf(object){let o=object;while(o&&o!==boat){if(o.userData.hatch)return {hatch:o.userData.hatch,label:artById[o.userData.hatch].label};if(o.userData.control)return {control:o.userData.control,label:({helm:'Ratt · dra i sidled',throttleP:'Babords reglage · dra upp / ned',throttleS:'Styrbords reglage · dra upp / ned',seat:'Förarplats · sätt dig'})[o.userData.control]||'Förarplats'};o=o.parent;}return null;}
  function pick(clientX,clientY){
    const r=renderer.domElement.getBoundingClientRect();pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(pickList,false);
    for(const h of hits){if(!h.object.visible)continue;let p=h.object,visible=true;while(p){if(!p.visible){visible=false;break;}p=p.parent;}if(!visible)continue;
      const data=controlOf(h.object);if(data)return data;
      const m=h.object.material;if(m&&m.transparent)continue;
      // First opaque surface blocks controls behind it.
      return null;
    }return null;
  }
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0&&e.button!==2)return;
    canvas.focus();const hit=document.pointerLockElement===canvas?pick(innerWidth/2,innerHeight/2):pick(e.clientX,e.clientY);
    if(hit||state.mode!=='exterior'){
      e.stopImmediatePropagation();e.preventDefault();canvas.setPointerCapture(e.pointerId);
      if(hit&&hit.control&&/^helm|throttle/.test(hit.control)&&state.mode==='pilot')dragging={type:'control',hit,x:e.clientX,y:e.clientY,helm:state.helm,p:state.engineP,s:state.engineS};
      else dragging={type:'look',hit,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:0};
    }
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(dragging&&dragging.type==='control'&&document.pointerLockElement===canvas){
      const d=dragging;if(d.hit.control==='helm')actions.setHelm(state.helm+e.movementX*.28);else{const side=d.hit.control==='throttleP'?'P':'S';setEngine(side,(side==='P'?state.engineP:state.engineS)-e.movementY*.006);}return;
    }
    if(document.pointerLockElement===canvas&&state.mode!=='exterior'){
      const l=state.mode==='pilot'?look:walk;l.yaw-=e.movementX*.0027;l.pitch=U.clamp(l.pitch-e.movementY*.0027,-1.22,1.05);return;
    }
    if(dragging){const d=dragging;
      if(d.type==='control'){
        if(d.hit.control==='helm')actions.setHelm(d.helm+(e.clientX-d.x)*.28);
        else {const side=d.hit.control==='throttleP'?'P':'S';setEngine(side,(side==='P'?d.p:d.s)+(d.y-e.clientY)*.006);}
      } else if(state.mode!=='exterior'){
        const l=state.mode==='pilot'?look:walk;const dx=e.clientX-d.lastX,dy=e.clientY-d.lastY;l.yaw-=dx*.004;l.pitch=U.clamp(l.pitch-dy*.004,-1.22,1.05);d.moved+=Math.abs(dx)+Math.abs(dy);d.lastX=e.clientX;d.lastY=e.clientY;
      }
      return;
    }
    currentHover=pick(e.clientX,e.clientY);canvas.style.cursor=currentHover?'pointer':(state.mode==='exterior'?'grab':'crosshair');
    const hint=$('objectHint');hint.textContent=currentHover?currentHover.label:'';hint.hidden=!currentHover;hint.style.left=Math.min(e.clientX+18,innerWidth-300)+'px';hint.style.top=(e.clientY+16)+'px';
  });
  canvas.addEventListener('pointerup',e=>{if(!dragging)return;const d=dragging;dragging=null;if(d.type==='look'&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<6)actOnHit(d.hit);if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
  canvas.addEventListener('pointercancel',()=>{dragging=null;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('pointerlockchange',()=>{if(ui)ui.refresh();});
  function inputTarget(e){return /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;}
  window.addEventListener('keydown',e=>{
    if(e.metaKey||e.ctrlKey||e.altKey||inputTarget(e))return;
    if(state.helpOpen&&e.key!=='Escape'){if(e.key==='Tab'){e.preventDefault();$('closeHelp').focus();}return;}
    const k=e.key.toLowerCase();clearTimeout(keyTimers.get(k));if(!keys.has(k))pressedAt.set(k,performance.now());keys.add(k);
    if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    if(e.repeat)return;
    if(k==='1')setMode('exterior');if(k==='2')setMode('walk');if(k==='3')setMode('pilot');
    if(k==='f')setMode(state.mode==='pilot'?'walk':'pilot');
    if(k==='e')actions.interact();if(k===' ')actions.neutral();if(k==='c')actions.centerHelm();
    if(k==='h')actions.setAllHatches(artRecords.some(r=>toggleKind(r)&&state.hatches[r.id].target<.5)?1:0);
    if(k==='i')state.panelOpen=!state.panelOpen;if(k==='p')actions.setPaused(!state.paused);if(k==='?')state.helpOpen=!state.helpOpen;
    if(k==='+'||k==='=')actions.cyclePlotterRange(1);if(k==='-')actions.cyclePlotterRange(-1);if(k==='r')actions.togglePlotterOrientation();
    if(k==='escape'){state.helpOpen=false;dragging=null;keys.clear();}
    if(ui)ui.refresh();
  });
  function releaseKey(k){const wait=Math.max(0,90-(performance.now()-(pressedAt.get(k)||0)));if(wait>0)keyTimers.set(k,setTimeout(()=>keys.delete(k),wait));else keys.delete(k);}
  window.addEventListener('keyup',e=>releaseKey(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{keys.clear();dragging=null;});document.addEventListener('visibilitychange',()=>{keys.clear();lastTime=performance.now();});
  function walkFloor(x){return CB90.walkFloorAt(x);}
  function walkEyeHeight(x){
    const floor=walkFloor(x), crouch=U.clamp((x-M.WH_CROUCH_X)/(M.WH_CROUCH_END_X-M.WH_CROUCH_X),0,1);
    let eye=x<M.TRUNK_X0+.08?1.10:1.63;
    eye+=(Math.max(.48,M.WH_FLOOR_Y+.52-floor)-eye)*crouch;
    if(x>7.35&&x<8.78)eye=Math.min(eye,M.WH_ROOF_Y-.67-floor);
    if(x>M.WH_DOOR_X)eye=Math.min(eye,U.deckYAt(x,0)-.13-floor); // the bow corridor ceiling follows the low, falling foredeck
    return eye;
  }
  function canWalk(x,z){return CB90.canWalkAt(walk,x,z,state.hatches);}
  function updateInput(dt){
    if(state.paused)return;
    if(state.mode==='walk'){
      const ahead=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const speed=(keys.has('shift')?1.85:1.15)*dt/Math.max(1,Math.hypot(ahead,side));
      const dx=(Math.cos(walk.yaw)*ahead+Math.sin(walk.yaw)*side)*speed,dz=(-Math.sin(walk.yaw)*ahead+Math.cos(walk.yaw)*side)*speed;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.045));
      for(let i=0;i<steps;i++){if(canWalk(walk.x+dx/steps,walk.z))walk.x+=dx/steps;if(canWalk(walk.x,walk.z+dz/steps))walk.z+=dz/steps;}
    }else{
      const gas=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
      if(gas){setEngine('P',state.engineP+gas*dt*.28);setEngine('S',state.engineS+gas*dt*.28);}
      const turn=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);if(turn)actions.setHelm(state.helm+turn*dt*27);
    }
    if(keys.has('j'))setEngine('P',state.engineP+dt*.25);if(keys.has('n'))setEngine('P',state.engineP-dt*.25);
    if(keys.has('k'))setEngine('S',state.engineS+dt*.25);if(keys.has('m'))setEngine('S',state.engineS-dt*.25);
  }
  function updateCamera(dt){
    if(state.mode==='exterior'){
      if(!controls.isAnimating()){
        camera.position.sub(new THREE.Vector3(oldX,0,oldZ)).applyAxisAngle(axisY,state.nav.heading-oldHeading).add(new THREE.Vector3(state.nav.x,0,state.nav.z));
        controls.controls.target.sub(new THREE.Vector3(oldX,0,oldZ)).applyAxisAngle(axisY,state.nav.heading-oldHeading).add(new THREE.Vector3(state.nav.x,0,state.nav.z));
      }
      controls.update(dt);
    }else{
      let yaw,pitch;
      if(state.mode==='pilot'){superstructure.parts.pilotEye.getWorldPosition(localEye);boat.worldToLocal(localEye);yaw=look.yaw;pitch=look.pitch;state.walkZone='Förarplats';}
      else {
        const floor=walkFloor(walk.x),eye=walkEyeHeight(walk.x);
        walkEyeY+=(floor+eye-walkEyeY)*(1-Math.exp(-dt*16));
        // Never let smoothing carry the camera through the low instrument bridge while crouching.
        if(walk.x>M.WH_CROUCH_X)walkEyeY=Math.min(walkEyeY,floor+eye);
        localEye.set(walk.x,walkEyeY,walk.z);yaw=walk.yaw;pitch=walk.pitch;
        state.walkZone=walk.x<4?'Maskinrum':walk.x<8.6?'Transportrum':walk.x<M.WH_DOOR_X?'Styrhytt':'Förpik · hukad';
      }
      camera.position.copy(boat.localToWorld(localEye));
      worldTarget.set(Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.sin(yaw)*Math.cos(pitch)).applyQuaternion(boat.quaternion).add(camera.position);camera.up.set(0,1,0).applyQuaternion(boat.quaternion);camera.lookAt(worldTarget);
      if(document.pointerLockElement===canvas)currentHover=pick(innerWidth/2,innerHeight/2);
    }
    oldX=state.nav.x;oldZ=state.nav.z;oldHeading=state.nav.heading;
  }
  let audioCtx,audioGain,audioOsc;
  function initAudio(){if(audioCtx){audioCtx.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();audioGain=audioCtx.createGain();audioGain.gain.value=0;const filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=220;filter.connect(audioGain);audioGain.connect(audioCtx.destination);audioOsc=[0,1,2].map((_,i)=>{const o=audioCtx.createOscillator();o.type=i===2?'triangle':'sawtooth';o.frequency.value=30+i*1.5;o.connect(filter);o.start();return o;});}
  function updateAudio(){if(!audioCtx)return;const power=(Math.abs(state.engineP)+Math.abs(state.engineS))*.5;audioGain.gain.setTargetAtTime(state.sound&&state.enginesOn&&!state.paused?.022+power*.026:0,audioCtx.currentTime,.2);audioOsc.forEach((o,i)=>o.frequency.setTargetAtTime((i===2?2:1)*(29+power*55+i*1.4),audioCtx.currentTime,.25));}
  const debug=$('status'),shot=q.get('shot')==='1';
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;if(document.hidden)return;
    try{
      if(!state.paused)elapsed+=dt;updateInput(dt);navigation.step(dt);
      weather.update(dt,elapsed);
      treatedMaterials.forEach(m=>{if(m.isMeshStandardMaterial)m.envMapIntensity=.65*(.04+.96*weather.uniforms.daylight.value);});
      motion.update(state.paused?0:dt,elapsed,state);motion.apply(boat,state.nav);
      // Two signed physical levers drive each jet's reversing bucket separately.
      state.throttle=state.enginesOn?Math.max(Math.abs(state.engineP),Math.abs(state.engineS)):0;
      state.bucketP=state.engineP>.015?0:state.engineP<-.015?1:.7;state.bucketS=state.engineS>.015?0:state.engineS<-.015?1:.7;
      const adt=state.paused?0:dt;
      U.stepArticulations(artRecords,state.hatches,adt);
      if(waterjets){waterjets.setHelm&&waterjets.setHelm(state.helm);waterjets.setBucket&&waterjets.setBucket('P',state.bucketP);waterjets.setBucket&&waterjets.setBucket('S',state.bucketS);waterjets.setThrottle&&waterjets.setThrottle(state.throttle);waterjets.update&&waterjets.update(adt,state,elapsed);}
      if(equipment){equipment.setRadar&&equipment.setRadar(state.radarOn,state.radarRpm);equipment.update&&equipment.update(adt,state,elapsed);}
      if(hull&&hull.update)hull.update(adt,state,elapsed);if(superstructure&&superstructure.update)superstructure.update(adt,state,elapsed);
      boat.updateMatrixWorld(true);if(water&&water.setBoatTransform)water.setBoatTransform(boat.matrixWorld,motion.pose);updateCamera(dt);
      if(water){(water.group||water.mesh).visible=state.showWater;water.update&&water.update(elapsed,state);}
      if(environment&&environment.update)environment.update(adt,state,elapsed);
      if(plotter&&plotter.update){state.plotterNear=state.mode!=='exterior'||camera.position.distanceTo(boat.localToWorld(wheelhouseWorld.set(9.7,M.WH_DASH_TOP_Y,0)))<8;plotter.update(adt,state,elapsed);syncPlotter();}
      weather.positionLights();
      updateAudio();if(frames>3)reflectSea();renderer.render(scene,camera);frames++;
      if(frames%6===0){ui.refresh();status.textContent=errors.length?'ERROR '+errors.join(' | '):'READY';debug.dataset.nav=JSON.stringify(state.nav);debug.dataset.mode=state.mode;debug.dataset.walk=JSON.stringify(walk);debug.dataset.hatches=JSON.stringify(state.hatches);debug.dataset.engines=JSON.stringify({p:state.engineP,s:state.engineS,helm:state.helm});debug.dataset.stats=JSON.stringify(renderer.info.render);}
      if(frames%6===0&&water&&water.hullWaves)debug.dataset.waves=JSON.stringify(water.hullWaves.stats());
      if(frames===2){$('loading').classList.add('loaded');document.body.classList.add('ready');}
      if(shot&&frames===5&&!status.dataset.png){try{status.dataset.png=renderer.domElement.toDataURL('image/png');}catch(e){error(e);}}
      if(photoTime>0)photoTime-=dt;
    }catch(e){error(e);}
  }
  window.CB90.app={state,actions,scene,camera,renderer,modules,controls,boat,navigation,environment,plotter,articulations:artRecords,errors,walk,look,canWalk,walkFloor,frames:()=>frames,get world(){return world;}};
  if(q.has('ui')&&q.get('ui')==='0')$('app').classList.add('no-ui');
  if(q.get('hatches')==='open')actions.setAllHatches(1);
  if(q.get('open'))q.get('open').split(',').forEach(id=>actions.setHatch(id,1));
  if(q.get('cutaway')==='1')actions.setCutaway(true);
  if(q.has('helm'))actions.setHelm(Number(q.get('helm')));
  if(q.has('throttle'))actions.setEngine('both',Number(q.get('throttle'))/100);
  const cam=q.get('cam'),tgt=q.get('tgt');if(cam&&tgt)controls.views.custom={position:cam.split(',').map(Number),target:tgt.split(',').map(Number)};
  state.view=cam&&tgt?'custom':(controls.views[q.get('view')]?q.get('view'):'overview');
  actions.setView(state.view,0);if(q.get('mode'))setMode(q.get('mode'),q.get('zone'));
  if(innerWidth<760)state.panelOpen=false;resize(true);ui.refresh();requestAnimationFrame(frame);
})();
