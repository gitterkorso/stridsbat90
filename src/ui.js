// Swedish, scene-first interface. UI is a view of the same state that drives the 3D controls.
window.CB90=window.CB90||{};
CB90.createUI=function(panel,state,actions,articulations,hud){
  const $=id=>document.getElementById(id),sync=[];let panelTab='details';
  function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function button(text,fn,cls='small-btn'){const e=el('button',cls,text);e.type='button';e.addEventListener('click',()=>{fn();refresh();});return e;}
  function label(text,right){const e=el('div','section-label');e.append(el('span','',text));if(right)e.append(el('span','',right));return e;}
  function toggle(text,get,set,id,sub){const row=el('div','row'), lab=el('label','switch');const input=el('input');input.type='checkbox';input.id='toggle-'+id;input.setAttribute('aria-label',text);input.dataset.id=id;input.addEventListener('change',()=>{set(input.checked);refresh();});lab.append(input,el('span','track'));const title=el('label','text',text);title.htmlFor=input.id;if(sub)title.append(el('span','subtext',sub));row.append(title,lab);sync.push(()=>{input.checked=!!get();});return row;}
  function slider(text,min,max,step,get,set,fmt,id,ends){const b=el('div','range-block'),t=el('div','range-top'),input=el('input');input.type='range';input.min=min;input.max=max;input.step=step;input.id=id;input.setAttribute('aria-label',text);input.dataset.id=id;const lab=el('label','',text);lab.htmlFor=id;const out=el('output','range-value');out.htmlFor=id;t.append(lab,out);input.addEventListener('input',()=>{set(+input.value);out.textContent=fmt(+input.value);});b.append(t,input);if(ends){const e=el('div','range-ends');e.append(el('span','',ends[0]),el('span','',ends[1]),el('span','',ends[2]));b.append(e);}sync.push(()=>{input.value=get();out.textContent=fmt(+input.value);});return b;}
  const pct=n=>Math.abs(n)<.015?'N':(n<0?'−':'+')+Math.round(Math.abs(n)*100)+'%';
  const helm=n=>Math.abs(n)<.5?'MIDSKIPS':(n<0?'BB ':'SB ')+Math.round(Math.abs(n))+'°';
  function pair(...buttons){const e=el('div','pair');e.append(...buttons);return e;}
  panel.innerHTML='';
  const header=el('div','panel-head'),title=el('div');title.append(el('div','eyebrow','DIN BÅT / 845'),el('h2','', 'Närmare detaljerna'));header.append(title,button('×',()=>actions.setPanel(false),'panel-close'));panel.append(header);
  const tabs=el('div','panel-tabs');const tabNames={details:'Luckor & delar',helm:'Manövrering',views:'Kameror',weather:'Väder'};const bodies={};Object.entries(tabNames).forEach(([key,name])=>{const b=button(name,()=>{panelTab=key;},'');b.dataset.tab=key;tabs.append(b);});panel.append(tabs);
  Object.keys(tabNames).forEach(key=>{bodies[key]=el('div','tab-body');panel.append(bodies[key]);});
  const weatherPanel=bodies.weather;
  const clock=h=>{const m=Math.floor(h*60)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  weatherPanel.append(label('TID PÅ DYGNET'));
  weatherPanel.append(slider('Klockslag',0,23.99,.05,()=>state.hour,actions.setHour,clock,'dayHour',['MIDNATT','12:00','MIDNATT']));
  weatherPanel.append(toggle('Automatisk dygnscykel',()=>state.dayCycle,actions.setDayCycle,'dayCycle'));
  weatherPanel.append(slider('Ett dygn tar',3,60,1,()=>state.dayMinutes,actions.setDayMinutes,v=>v+' min','dayMinutes',['3 MIN','30 MIN','60 MIN']));
  weatherPanel.append(el('div','divider'),label('VÄDER'));
  const weatherButtons=el('div','camera-list');Object.entries(CB90.WEATHER).forEach(([key,preset])=>{const b=button(preset.name,()=>actions.setWeather(key),'');b.dataset.weather=key;weatherButtons.append(b);});weatherPanel.append(weatherButtons);
  sync.push(()=>weatherButtons.querySelectorAll('button').forEach(b=>{const on=b.dataset.weather===state.weather;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}));
  weatherPanel.append(el('p','quiet-note','Vädret förändrar moln, sikt, regn och vågor. Båten följer sjögången. Paus stannar även klockan och vädret.'));
  const detail=bodies.details;
  const toggles=articulations.filter(r=>/^(hatch|door|ramp|mast)$/.test(r.kind));
  detail.append(toggle('Fördäckskanon',()=>state.foredeckGun,actions.setForedeckGun,'foredeckGun','Av: täckbox enligt referensbilden'));
  detail.append(el('div','divider'));
  detail.append(label('ÖPPNINGSBART',toggles.length+' DELAR'));
  const short={ramp_bow:'Stävport & ramp',hatch_bowP:'Stävlucka · babord',hatch_bowS:'Stävlucka · styrbord',door_wtFwd:'Dörr till förpik',hatch_troopAft:'Transportrumslucka',hatch_engineP:'Maskinlucka · babord',hatch_engineS:'Maskinlucka · styrbord',hatch_engineCompanion:'Nedgång · maskinrum',hatch_roofP:'Taklucka · babord',hatch_roofS:'Taklucka · styrbord',mast_signal:'Fällbar signalmast',door_engine:'Dörr till maskinrum'};
  toggles.forEach(r=>detail.append(toggle(short[r.id]||r.label,()=>state.hatches[r.id].target>.5,v=>actions.setHatch(r.id,v?1:0),r.id)));
  detail.append(pair(button('Öppna alla',()=>actions.setAllHatches(1)),button('Stäng alla',()=>actions.setAllHatches(0))));
  articulations.filter(r=>r.kind==='seat').forEach(r=>detail.append(toggle(r.label,()=>state.hatches[r.id].target>.5,v=>actions.setHatch(r.id,v?1:0),r.id)));
  detail.append(el('div','divider'));detail.append(toggle('Visa genomskärning',()=>state.cutaway,actions.setCutaway,'cutaway'));
  detail.append(toggle('Roterande radar',()=>state.radarOn,actions.setRadar,'radarOn'));
  detail.append(el('p','quiet-note','Peka och klicka på luckorna i 3D-vyn. Gångjärn, beslag och inredningen följer med när de öppnas. Stävluckorna öppnas och stängs automatiskt i rätt ordning.'));
  const propulsion=bodies.helm;
  propulsion.append(label('FRÅN BRYGGAN'));propulsion.append(toggle('Motorerna igång',()=>state.enginesOn,actions.setEngines,'engines'));
  propulsion.append(slider('Ratt / roder',-30,30,1,()=>state.helm,actions.setHelm,helm,'helm', ['BABORD','0°','STYRBORD']));
  propulsion.append(slider('Motor babord',-1,1,.01,()=>state.engineP,v=>actions.setEngine('P',v),pct,'engineP',['BACK','NEUTRAL','FRAM']));
  propulsion.append(slider('Motor styrbord',-1,1,.01,()=>state.engineS,v=>actions.setEngine('S',v),pct,'engineS',['BACK','NEUTRAL','FRAM']));
  propulsion.append(pair(button('Neutral',actions.neutral),button('Ratt midskepps',actions.centerHelm)));
  // Live chart plotters: range and orientation mirror the +/− and R keys.
  propulsion.append(el('div','divider'));propulsion.append(label('PLOTTER','RÄCKVIDD · ORIENTERING'));
  const ranges=el('div','camera-list quad');[[0.25,'0,25 nm'],[0.5,'0,5 nm'],[1,'1 nm'],[2,'2 nm']].forEach(([nm,name])=>{const b=button(name,()=>actions.setPlotterRange(nm),'');b.dataset.range=String(nm);ranges.append(b);});propulsion.append(ranges);
  const orient=el('div','camera-list');[['north','Nord upp'],['head','Kurs upp']].forEach(([key,name])=>{const b=button(name,()=>{if(actions.setPlotterOrientation)actions.setPlotterOrientation(key);else if((state.plotterOrientation||'north')!==key)actions.togglePlotterOrientation();},'');b.dataset.orientation=key;orient.append(b);});orient.style.marginTop='6px';propulsion.append(orient);
  sync.push(()=>{const r=+state.plotterRange||0,o=state.plotterOrientation||'north';ranges.querySelectorAll('button').forEach(b=>b.classList.toggle('active',Math.abs(+b.dataset.range-r)<1e-6));orient.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.orientation===o));});
  propulsion.append(el('div','divider'));propulsion.append(label('DÄCKSUTRUSTNING'));
  articulations.filter(r=>/^(turret|elev)$/.test(r.kind)).forEach(r=>propulsion.append(slider(r.kind==='turret'?'Ringlavett':'Dubbelmontage · höjd',0,1,.01,()=>state.hatches[r.id].target,v=>actions.setHatch(r.id,v),v=>Math.round(r.closed+(r.open-r.closed)*v)+'°',r.id)));
  propulsion.append(el('p','quiet-note','Separata reglage för babords och styrbords vattenjet. Olika pådrag låter dig manövrera med små rörelser.'));
  const views=bodies.views;views.append(label('UTANFÖR BÅTEN'));const cameras=el('div','camera-list');
  Object.entries({overview:'Översikt',bow:'Fören',stern:'Aktern',top:'Ovanifrån',wheelhouse:'Styrhytten',jets:'Vattenjetarna'}).forEach(([key,name])=>{const b=button(name,()=>actions.setView(key),'');b.dataset.view=key;cameras.append(b);});views.append(cameras);
  views.append(el('div','divider'),label('GÅ OMBORD'));
  const interior=el('div','camera-list');Object.entries({cabin:'Styrhytt',troop:'Transportrum',bow:'Förpik',engine:'Maskinrum'}).forEach(([key,name])=>interior.append(button(name,()=>actions.setMode('walk',key),'')));views.append(interior);
  views.append(el('div','divider'));views.append(toggle('Rotera runt båten',()=>state.autoRotate,actions.setAutoRotate,'rotate'));
  views.append(toggle('Hög detaljnivå',()=>state.quality==='high',v=>actions.setQuality(v?'high':'medium'),'quality'));
  views.append(el('div','divider'),label('SKÄRGÅRD'));
  const chartLine=el('div','chart-line'),chartName=el('div','chart-name'),chartSeed=el('div','subtext');chartLine.append(chartName,chartSeed);views.append(chartLine);
  views.append(el('p','quiet-note','Västerut ligger den skogiga innerskärgården. Österut glesnar öarna till låga kobbar och öppet hav. Fjärdarna binder ihop områdena.'));
  views.append(pair(button('Ny skärgård',()=>actions.newArchipelago()),button('Åter till start',actions.reset)));
  sync.push(()=>{const c=state.chart;chartName.textContent=c?c.name+' · sjökort '+c.no:'Skärgården kunde inte ritas';const w=actions.getWorld(),n=state.nav;chartSeed.textContent='frö '+(state.seed||'—')+(w&&w.biome&&n?' · '+w.biome(n.x,n.z).name:'');});
  views.append(el('p','quiet-note','CB90 H 845 efter Borgs genomskärningsbild, med proportioner från Dockstavarvets produktblad. Skärgården ritas ur fröet i adressen (?seed=N); Ny skärgård slumpar ett nytt.'));
  // Compact helm overlay mirrors the physical controls for keyboard, touch and mouse users.
  const pad=$('walkPad');[['w','↑','Gå framåt'],['a','←','Gå åt vänster'],['s','↓','Gå bakåt'],['d','→','Gå åt höger']].forEach(([key,arrow,name])=>{
    const b=el('button','',arrow);b.type='button';b.setAttribute('aria-label',name);
    b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);actions.moveKey(key,true);e.preventDefault();});
    b.addEventListener('pointerup',e=>{actions.moveKey(key,false);if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);});b.addEventListener('pointercancel',()=>actions.moveKey(key,false));
    b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){actions.moveKey(key,true);e.preventDefault();}});b.addEventListener('keyup',()=>actions.moveKey(key,false));
    pad.append(b);
  });
  const pilot=$('pilotControls');pilot.append(label('VATTENJET / REGLAGE','2 × V8'));
  pilot.append(slider('Ratt',-30,30,1,()=>state.helm,actions.setHelm,helm,'pilotHelm',['BB','0°','SB']));
  const levers=el('div','levers');levers.append(slider('Babord',-1,1,.01,()=>state.engineP,v=>actions.setEngine('P',v),pct,'pilotP',['BACK','N','FRAM']),slider('Styrbord',-1,1,.01,()=>state.engineS,v=>actions.setEngine('S',v),pct,'pilotS',['BACK','N','FRAM']));pilot.append(levers);
  pilot.append(pair(button('Neutral',actions.neutral),button('Midskepps',actions.centerHelm)));
  hud.innerHTML=[['FART','speed'],['KURS','course'],['DJUP','depth'],['RODER','rudder'],['BABORD / STYRBORD','rpm'],['DISTANS','distance']].map(([l,id])=>'<div class="stat"><div class="stat-label">'+l+'</div><div class="stat-num" id="read-'+id+'"></div></div>').join('');
  document.querySelectorAll('.mode-nav button').forEach(b=>b.addEventListener('click',()=>{actions.setMode(b.dataset.mode);refresh();}));
  const bind=(id,fn)=>$(id).addEventListener('click',()=>{fn();refresh();});
  bind('driveBtn',()=>actions.setMode(state.mode==='pilot'?'walk':'pilot'));
  bind('panelToggle',()=>actions.setPanel(!state.panelOpen));bind('photoBtn',actions.photo);
  bind('pauseBtn',()=>actions.setPaused(!state.paused));bind('soundBtn',()=>actions.setSound(!state.sound));
  bind('helpBtn',()=>actions.setHelp(true));bind('closeHelp',()=>actions.setHelp(false));
  bind('mouseLock',()=>{if(document.pointerLockElement)document.exitPointerLock();else actions.lockMouse();});
  $('helpModal').addEventListener('click',e=>{if(e.target===$('helpModal')){actions.setHelp(false);refresh();}});
  let oldMode='',oldPanel,helpWasOpen=false;
  function refresh(){
    sync.forEach(fn=>fn());
    document.querySelectorAll('.mode-nav button').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));});
    tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tab===panelTab));Object.entries(bodies).forEach(([k,b])=>b.hidden=k!==panelTab);
    cameras.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    $('app').classList.toggle('panel-hidden',!state.panelOpen);$('panelToggle').setAttribute('aria-expanded',String(state.panelOpen));
    if(oldPanel!==state.panelOpen){oldPanel=state.panelOpen;actions.setPanel(state.panelOpen);}
    $('pauseBtn').textContent=state.paused?'▶':'Ⅱ';$('pauseBtn').setAttribute('aria-label',state.paused?'Fortsätt simuleringen':'Pausa simuleringen');$('pauseBtn').classList.toggle('active',state.paused);
    $('soundBtn').classList.toggle('active',state.sound);$('soundBtn').setAttribute('aria-label',state.sound?'Stäng av motorljud':'Slå på motorljud');
    $('helpModal').hidden=!state.helpOpen;if(state.helpOpen&&!helpWasOpen)$('closeHelp').focus();if(!state.helpOpen&&helpWasOpen)$('helpBtn').focus();helpWasOpen=state.helpOpen;
    const isInside=state.mode!=='exterior';$('locationPill').hidden=!isInside;$('locationText').textContent=state.walkZone;
    $('mouseLock').textContent=document.pointerLockElement?'Frigör musen':'Lås musen';
    $('driveBtn').querySelector('small').textContent=state.mode==='pilot'?'UTFORSKA INTERIÖREN':'KLIV OMBORD';$('driveBtn').querySelector('b').textContent=state.mode==='pilot'?'Res dig från stolen':'Ta rodret';
    if(oldMode!==state.mode){oldMode=state.mode;$('keyHints').innerHTML=state.mode==='exterior'?'<span>Dra för att rotera</span><span>Scrolla för att zooma</span><span class="optional"><kbd>H</kbd> Alla luckor</span>':state.mode==='walk'?'<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Gå</span><span>Dra för att se dig omkring</span><span><kbd>E</kbd> Använd</span><span class="optional"><kbd>F</kbd> Sätt dig</span>':'<span><kbd>W</kbd><kbd>S</kbd> Pådrag</span><span><kbd>A</kbd><kbd>D</kbd> Ratt</span><span class="optional"><kbd>Space</kbd> Neutral</span><span class="optional"><kbd>+</kbd><kbd>−</kbd> Plotter</span><span class="optional"><kbd>R</kbd> Nord / kurs upp</span>';}
    const n=state.nav||{speed:0,heading:0,distance:0};const course=((90-n.heading*180/Math.PI)%360+360)%360;
    $('read-speed').innerHTML=(n.speed*1.94384).toFixed(1).replace('.',',')+'<small>kn</small>';
    $('read-course').innerHTML=String(Math.round(course)%360).padStart(3,'0')+'<small>°</small>';
    const clearance=n.collision?0:Number.isFinite(n.underKeel)?n.underKeel:0;$('read-depth').innerHTML=(clearance>=10?Math.round(clearance):clearance.toFixed(1)).toString().replace('.',',')+'<small>m</small>';
    $('read-rudder').innerHTML=Math.round(Math.abs(state.helm))+'<small>° '+(state.helm<-.5?'BB':state.helm>.5?'SB':'—')+'</small>';
    const rpm=v=>state.enginesOn?Math.round((600+1700*Math.abs(v))/10)*10:0;
    $('read-rpm').innerHTML='<span class="direction">'+rpm(state.engineP)+' / '+rpm(state.engineS)+'</span><small>rpm</small>';
    $('read-distance').innerHTML=(n.distance/1852).toFixed(2).replace('.',',')+'<small>nm</small>';
    $('compassNeedle').style.transform='rotate('+(-course)+'deg)';
    const alert=$('alert');alert.hidden=!state.notice&&!n.collision&&!state.paused;alert.textContent=state.notice?state.notice:n.collision?'Grundkänning · backa försiktigt':state.paused?'Simuleringen är pausad · tryck P för att fortsätta':'';
  }
  return {refresh,updateHud:()=>{},updateReadout:refresh};
};
