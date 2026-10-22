#!/usr/bin/env node
// Numeric fit check (no browser): loads three r128 + src/{constants,util,hull,superstructure,equipment}.js in Node and reports
//   1. shell mesh sanity: degenerate / inward-facing triangles, unexpected boundary edges (= holes in the shell)
//   2. any vertex of a hull-group mesh (decks, hatches, interior) that lies outside the shell
//   3. deck fittings (bollards, cleats, lifting eyes, ring mount, aft-deck gear) floating above / buried in the deck
//   4. radar mounting plate on the roof, bow grab rails meeting footplates, foredeck coaming on the sloping shoulder
// Usage: node tools/fitcheck.js        (exit code 1 when something is off)
// Uses the same bundled Three.js as the model (or set THREE_MIN=/path/to/three.min.js).
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const threeFile = process.env.THREE_MIN || path.join(ROOT,'src/vendor/three.min.js');
global.window = global; global.self = global;
// Minimal DOM stand-in: the hull's tread-plate texture and the camo pattern draw on a 2D canvas at build time.
{ const noop = () => {};
  const imageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
  const context = new Proxy({ createImageData: imageData, getImageData: (_x, _y, w, h) => imageData(w, h),
    createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }),
    measureText: (t) => ({ width: String(t).length * 12 }) }, { get: (o, k) => (k in o ? o[k] : noop) });
  global.document = { createElement: () => ({ width: 300, height: 150, getContext: () => context }) }; }
global.THREE = require(threeFile);
for (const f of ['constants.js', 'util.js', 'hull.js', 'superstructure.js', 'equipment.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'), { filename: f });
}
const U = CB90.util, M = CB90.M;
let problems = 0;
const warn = (s) => { problems++; console.log('  PROBLEM: ' + s); };
const hull = CB90.buildHull(THREE), ss = CB90.buildSuperstructure(THREE), eq = CB90.buildEquipment(THREE);
[hull, ss, eq].forEach((m) => m.group.updateMatrixWorld(true));

// ---- 1. shell
{
  const shellGeo = hull.parts.shell.children[0].geometry, P = (shellGeo.index ? shellGeo.toNonIndexed() : shellGeo).attributes.position;
  const key = (i) => [P.getX(i), P.getY(i), P.getZ(i)].map((v) => v.toFixed(4)).join(',');
  const edges = new Map(); let inward = 0, tris = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), cen = new THREE.Vector3();
  for (let i = 0; i < P.count; i += 3) {
    tris++;
    a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
    const ks = [key(i), key(i + 1), key(i + 2)];
    for (let k = 0; k < 3; k++) { const e = [ks[k], ks[(k + 1) % 3]].sort().join('|'); edges.set(e, (edges.get(e) || 0) + 1); }
    n.crossVectors(b.clone().sub(a), c.clone().sub(a)); if (n.length() < 1e-7) continue;
    cen.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const st = U.stationAt(cen.x);
    if (n.dot(cen.clone().sub(new THREE.Vector3(cen.x, (st.keelY + st.deckY) / 2, 0))) < 0) inward++;
  }
  let other = 0;
  for (const [e, cnt] of edges) {
    if (cnt !== 1) continue;
    const [p, q] = e.split('|').map((s) => s.split(',').map(Number)); const st = U.stationAt((p[0] + q[0]) / 2);
    const onTransom = Math.abs(p[0]) < 1e-3 && Math.abs(q[0]) < 1e-3, onStem = Math.abs(p[0] - M.RAMP_HINGE_X) < 1e-3 && Math.abs(q[0] - M.RAMP_HINGE_X) < 1e-3;   // the stävport opening frame at the sill
    const onDeck = Math.abs(p[1] - U.stationAt(p[0]).deckY) < 0.03 && Math.abs(q[1] - U.stationAt(q[0]).deckY) < 0.03;
    if (!onTransom && !onStem && !onDeck) other++;
  }
  console.log('shell: ' + tris + ' triangles, inward-facing ' + inward + ', open edges not on transom/stem/sheer: ' + other);
  if (inward) warn('shell has ' + inward + ' inward-facing triangles');
  if (other) warn('shell has ' + other + ' open edges (holes)');
}

// ---- 2. hull-group vertices outside the shell
{
  const skip = new Set([hull.parts.shell, hull.parts.transom, hull.parts.forefoot, hull.parts.intakes, hull.articulations.find((r) => r.id === 'ramp_bow').pivot]);
  const v = new THREE.Vector3(); const offenders = [];
  hull.group.traverse((o) => {
    if (!o.isMesh || o.geometry.type === 'TubeGeometry') return;
    for (let p = o; p; p = p.parent) if (skip.has(p)) return;
    const P = o.geometry.attributes.position; let worst = null;
    const placements=[];
    if(o.isInstancedMesh) {
      const local=new THREE.Matrix4();
      for(let instance=0;instance<o.count;instance++) {
        o.getMatrixAt(instance,local);
        placements.push(new THREE.Matrix4().multiplyMatrices(o.matrixWorld,local));
      }
    } else placements.push(o.matrixWorld);
    for(const placement of placements)for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(placement);
      const st = U.stationAt(v.x); let d = 0, why = '';
      if (v.x < -1e-3 || v.x > M.STEM_X + 1e-3) { d = Math.max(-v.x, v.x - M.STEM_X); why = 'x outside hull'; }
      else if (v.y < st.keelY - 1e-3) { d = st.keelY - v.y; why = 'below keel'; }
      else if (v.y <= st.deckY + 1e-3) { d = Math.abs(v.z) - U.hullHalfWidthAt(v.x, v.y) - 0.004; why = 'outside topsides'; }
      if (d > 0 && (!worst || d > worst.d)) worst = { d, at: v.toArray().map((q) => +q.toFixed(3)), why };
    }
    if (worst) offenders.push({ name: o.name || o.parent.name || o.geometry.type, ...worst });
  });
  console.log('hull group: ' + (offenders.length ? offenders.length + ' meshes with vertices outside the shell' : 'all deck/hatch/interior vertices inside the shell'));
  offenders.sort((a, b) => b.d - a.d).slice(0, 12).forEach((o) => warn(o.name + ' pokes out ' + o.d.toFixed(3) + ' m at ' + o.at.join(',') + ' (' + o.why + ')'));
}

// ---- 3. deck fittings on the deck surface
{
  const contacts=eq.parts.deckContacts||[],counts=new Map();
  const required={'bollard':M.BOLLARDS.length,'cleat':4,'lifting-eye':4,'ring-foot':4,'mine-rail-foot':6,
    'ventilation-base':1,'stowage-case-foot':8,'aft-rail-foot':8,'trunk-rail-foot':12,'bow-grab-foot':4,'front-rail-foot':2};
  const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
  function displacement(object) {
    const bb=new THREE.Box3().setFromObject(object),x=(bb.min.x+bb.max.x)/2,z=(bb.min.z+bb.max.z)/2;
    // Compare the built foot against the actual deck mesh, not against its own construction coordinates.
    // Start above either surface so both floating and buried bases remain observable.
    const expected=U.deckYAt(x,z);
    ray.set(new THREE.Vector3(x,Math.max(bb.min.y,expected)+.20,z),down);
    const hit=ray.intersectObject(hull.group,true).find(hit=>Math.abs(hit.point.y-expected)<.10);
    return {x,z,d:hit?bb.min.y-hit.point.y:NaN};
  }
  for(const {object,kind} of contacts) {
    counts.set(kind,(counts.get(kind)||0)+1);
    const result=displacement(object),where=' at x='+result.x.toFixed(2)+' z='+result.z.toFixed(2);
    if(!Number.isFinite(result.d)) warn(kind+' has no supporting deck mesh'+where);
    else if(result.d>.025) warn(kind+' floats '+result.d.toFixed(3)+' m above the deck'+where);
    else if(result.d<-.025) warn(kind+' is buried '+(-result.d).toFixed(3)+' m in the deck'+where);
  }
  for(const [kind,n] of Object.entries(required)) if((counts.get(kind)||0)<n) warn('Missing contact coverage for '+kind);
  // Verify that this check really catches transformed bases in both directions.
  const sample=contacts.find(contact=>contact.kind==='bollard');
  if(sample) {
    const object=sample.object,original=object.position.y;
    for(const delta of [-.08,.08]) {
      object.position.y=original+delta;eq.group.updateMatrixWorld(true);
      const result=displacement(object);
      if(!Number.isFinite(result.d)||Math.sign(result.d)!==Math.sign(delta)||Math.abs(result.d)<.06)
        warn('Contact check failed to detect a '+delta+' m displaced base');
    }
    object.position.y=original;eq.group.updateMatrixWorld(true);
  }
  console.log('deck contacts checked: '+contacts.length+' in '+counts.size+' fitting categories');
}

// ---- 4. cross-module roof contact and rail-to-foot registration
{
  const down=new THREE.Vector3(0,-1,0),ray=new THREE.Raycaster();
  const foot=eq.parts.radarFoot;
  if(!foot)warn('Radar mounting plate is unavailable for contact verification');
  else {
    const box=new THREE.Box3().setFromObject(foot);
    for(const x of [box.min.x+.015,box.max.x-.015])for(const z of [box.min.z+.015,box.max.z-.015]) {
      ray.set(new THREE.Vector3(x,box.max.y+.10,z),down);
      const hit=ray.intersectObject(ss.parts.roof,true)[0];
      if(!hit)warn('Radar mounting plate has no roof beneath a corner');
      else if(Math.abs(box.min.y-hit.point.y)>.003)warn('Radar mounting plate is separated from the roof by '+(box.min.y-hit.point.y).toFixed(4)+' m');
    }
  }
  const grabs=eq.parts.bowGrabRails||[];
  if(grabs.length!==2)warn('Both bow grab rails must expose their attachment geometry');
  for(const {rail,feet} of grabs) {
    const positions=rail.geometry.attributes.position,uv=rail.geometry.attributes.uv;
    for(const [end,foot] of feet.entries()) {
      const centre=new THREE.Vector3(),p=new THREE.Vector3();let n=0;
      for(let i=0;i<positions.count;i++)if(Math.abs(uv.getX(i)-end)<1e-6) {
        // TubeGeometry duplicates the closing radial vertex; omit that duplicate.
        if(uv.getY(i)>1-1e-6)continue;
        centre.add(p.fromBufferAttribute(positions,i).applyMatrix4(rail.matrixWorld));n++;
      }
      if(!n){warn('Cannot measure the end of '+rail.name);continue;}
      centre.multiplyScalar(1/n);
      const bb=new THREE.Box3().setFromObject(foot),fc=bb.getCenter(new THREE.Vector3());
      if(Math.abs(centre.y-bb.max.y)>.003||Math.hypot(centre.x-fc.x,centre.z-fc.z)>.003)
        warn(rail.name+' end '+end+' does not meet its footplate');
    }
  }
  const coaming=eq.parts.foredeckAccessCoaming,lid=eq.parts.foredeckAccessLid;
  if(!coaming||!lid)warn('Port foredeck hatch support geometry is missing');
  else {
    const stations=new Map(),p=new THREE.Vector3(),pos=coaming.geometry.attributes.position;
    const box=new THREE.Box3().setFromObject(coaming),z=(box.min.z+box.max.z)/2;
    for(let i=0;i<pos.count;i++) {
      p.fromBufferAttribute(pos,i).applyMatrix4(coaming.matrixWorld);
      const key=p.x.toFixed(4),old=stations.get(key);
      if(!old||p.y<old.y)stations.set(key,p.clone());
    }
    for(const p of stations.values()) {
      ray.set(new THREE.Vector3(p.x,3,z),down);
      const hit=ray.intersectObject(hull.parts.decks,true)[0];
      if(!hit||Math.abs(p.y-hit.point.y)>.003)warn('Port foredeck coaming does not follow deck shoulder at x='+p.x.toFixed(3));
    }
    for(const mesh of [coaming,lid]) {
      const pos=mesh.geometry.attributes.position;
      for(let i=0;i<pos.count;i++) {
        p.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld);
        if(Math.abs(p.z)>U.stationAt(p.x).deckZ-.015){warn('Port foredeck hatch overhangs the hull plan');break;}
      }
    }
  }
  // Orientation comes from the 925 and manufacturer 113 photographs; the
  // tolerance only distinguishes the visible horizontal hoop from the old vertical rectangle.
  const guard=eq.parts.bridgeGuardHoop;
  if(!guard)warn('The central windscreen guard hoop is missing');
  else {
    const span=new THREE.Box3().setFromObject(guard).getSize(new THREE.Vector3());
    if(span.x<.7||span.y>.16)warn('The central windscreen guard is not a horizontal forward-projecting hoop');
  }
  console.log('roof, grab-rail and foredeck-hatch attachments checked against built geometry');
}
console.log(problems ? 'FIT CHECK: ' + problems + ' problem(s)' : 'FIT CHECK: OK');
process.exit(problems ? 1 : 0);
