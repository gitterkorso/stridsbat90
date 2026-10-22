#!/bin/bash
# Smoke-test one module in headless Chrome: loads three r128 + constants.js + util.js + the module,
# calls the build function, renders one frame and reports mesh/triangle counts or the first error.
# Usage: tools/smoke.sh <module.js> <buildFnName> <out.png> [extraJS] [cameraPreset: overview|stern|bow|top|jets]
# Example: tools/smoke.sh src/waterjet.js buildWaterjets shots/jets.png "r.setHelm(25); r.setBucket('P',1); r.update(0.016,{throttle:1});" jets
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOD="$1"; FN="$2"; OUT="$3"; EXTRA="${4:-}"; CAM="${5:-overview}"
SCRATCH="${SMOKE_DIR:-$ROOT/shots}"; mkdir -p "$SCRATCH"
HTML="$SCRATCH/smoke-$(basename "$MOD" .js).html"
MODABS="$(cd "$(dirname "$MOD")" && pwd)/$(basename "$MOD")"
case "$CAM" in
  stern) CPOS="-7,3,5"; CTGT="0,0.3,0";;
  bow) CPOS="22,4,6"; CTGT="14,1,0";;
  top) CPOS="7.5,24,0.01"; CTGT="7.5,0,0";;
  jets) CPOS="-4.5,0.8,3"; CTGT="-0.5,-0.3,0";;
  wheelhouse) CPOS="15,5,6"; CTGT="10,2.4,0";;
  side) CPOS="7.5,1.0,20"; CTGT="7.5,0.6,0";;
  sidejets) CPOS="-0.6,-0.15,4.2"; CTGT="-0.6,-0.15,0";;
  front) CPOS="24,1.6,0.01"; CTGT="7,1.0,0";;
  belowaft) CPOS="-6,-1.6,4"; CTGT="1,-0.4,0";;
  topjets) CPOS="-0.6,4.5,0.01"; CTGT="-0.6,-0.35,0";;
  *) CPOS="22,7,13"; CTGT="7.5,0.8,0";;
esac
cat > "$HTML" <<HTML
<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#9db7cc}#status{position:fixed;left:4px;top:4px;font:12px monospace;color:#000;background:#fff8;padding:2px 4px;white-space:pre}</style></head><body>
<div id="status">LOADING</div>
<script>window.__errs=[];window.onerror=function(m,s,l,c){window.__errs.push(m+' @'+(s||'').split('/').pop()+':'+l+':'+c);document.getElementById('status').textContent='ERROR '+window.__errs.join(' | ');};</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="file://$ROOT/src/constants.js"></script>
<script src="file://$ROOT/src/util.js"></script>
<script src="file://$MODABS"></script>
<script>
try {
  const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(1280,800); renderer.shadowMap.enabled=true; renderer.outputEncoding=THREE.sRGBEncoding; document.body.appendChild(renderer.domElement);
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0x9db7cc);
  const cam=new THREE.PerspectiveCamera(45,1280/800,0.1,200); cam.position.set($CPOS); cam.lookAt($CTGT);
  scene.add(new THREE.HemisphereLight(0xdfe9f3,0x3a4a3a,0.9)); const sun=new THREE.DirectionalLight(0xffffff,1.1); sun.position.set(10,20,8); sun.castShadow=true; scene.add(sun);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x28506a,roughness:0.3,metalness:0.1,transparent:true,opacity:0.85})); water.rotation.x=-Math.PI/2; water.receiveShadow=true; if('$NOWATER'!=='1') scene.add(water);
  if('$NOGRID'!=='1'){ const grid=new THREE.GridHelper(30,30,0x445566,0x667788); grid.position.y=0.005; scene.add(grid); const axes=new THREE.AxesHelper(2); scene.add(axes); }
  const r=CB90['$FN'](THREE); const root=r.group||r.mesh; scene.add(root);
  $EXTRA
  scene.updateMatrixWorld(true);
  let meshes=0,tris=0; root.traverse(o=>{ if(o.isMesh){ meshes++; const g=o.geometry; const n=g.index?g.index.count:g.attributes.position.count; tris+=n/3; }});
  const arts=(r.articulations||[]).map(a=>a.id).join(',');
  const bb=new THREE.Box3().setFromObject(root); const mn=bb.min, mx=bb.max;
  renderer.render(scene,cam);
  document.getElementById('status').textContent='READY meshes='+meshes+' tris='+Math.round(tris)+' bbox=['+[mn.x,mn.y,mn.z].map(v=>v.toFixed(2))+' -> '+[mx.x,mx.y,mx.z].map(v=>v.toFixed(2))+'] articulations='+arts+(window.__errs.length?' ERRORS:'+window.__errs.join('|'):'');
} catch(e){ document.getElementById('status').textContent='ERROR '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' / '); }
</script></body></html>
HTML
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1280,800 --virtual-time-budget=8000 --allow-file-access-from-files --screenshot="$OUT" "file://$HTML" >/dev/null 2>&1 || true
"$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --allow-file-access-from-files --virtual-time-budget=8000 --dump-dom "file://$HTML" 2>/dev/null | grep -o '<div id="status">[^<]*' | sed 's/<div id="status">//'
[[ -s "$OUT" ]] && echo "screenshot: $OUT" || echo "no screenshot"
