// Stridsbåt 90 H – equipment arranged from reference boat 845: low radar pedestal, folding signal mast,
// ring mount with rotating gun cradle, railings/grab rails, rubbing strakes and fenders, bollards, cleats,
// lifting eyes, transom gear (exhausts, trim planes, ensign staff + flag), mine rails, life-raft canisters and
// the hull number on both bows. Plain script; requires THREE (r128), constants.js and util.js.
// Frame: metres, Y up, +X forward (bow), +Z starboard. Everything is built directly in hull coordinates.
window.CB90 = window.CB90 || {};
CB90.buildEquipment = function (THREE) {
  const U = CB90.util, M = CB90.M, C = CB90.COLORS, S = CB90.STATIONS;
  const PI = Math.PI;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  const group = new THREE.Group(); group.name = 'equipment';
  const parts = {}, articulations = [];
  const sub = (name, parent) => { const g = new THREE.Group(); g.name = name; (parent || group).add(g); parts[name] = g; return g; };
  // Real load-bearing feet for geometry QA; raised housings, latticework and rail tops are deliberately not deck contacts.
  parts.deckContacts=[];
  const deckContact=(object,kind)=>{parts.deckContacts.push({object,kind});return object;};

  // ---------- materials ----------
  // The 845 illustration and the 826 photograph show painted fittings rather than polished aluminium.
  const metal = U.mat(0x45483f, { roughness: .82, metalness: .12, name: 'painted-deck-fittings' });
  const dark = U.darkMetal(), rubber = U.rubber(), hyd = U.hydraulic();
  const radarPaint = U.mat(0x565853, { roughness: .78, metalness: .12, name: 'radar-painted-housing' });
  const white = U.mat(C.WHITE, { roughness: 0.6, metalness: 0.05, name: 'white' });
  const antGrey = U.mat(0xd9dbda, { roughness: 0.5, metalness: 0.1, name: 'antenna' });
  const gun = U.mat(0x25282a, { roughness: 0.55, metalness: 0.5, name: 'gun' });
  const ammo = U.mat(0x4a5040, { roughness: 0.9 });
  const pad = U.mat(0x3a3f3b, { roughness: 0.9, side: THREE.DoubleSide });
  const green = U.mat(C.GREEN, { roughness: 0.35, emissive: 0x0b4d26 });
  const red = U.mat(C.RED, { roughness: 0.35, emissive: 0x5a120c });
  const lamp = U.mat(0xf6f7f2, { roughness: 0.3, emissive: 0x8c8c80 });
  const blue = U.mat(0x0e5cad, { roughness: 0.85, side: THREE.DoubleSide });
  const yellow = U.mat(0xf3c500, { roughness: 0.85, side: THREE.DoubleSide });
  const soot = U.mat(0x0a0b0c, { roughness: 1 });

  // ---------- small helpers ----------
  const sphere = (r, p, m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m || metal); s.position.copy(p); s.castShadow = true; return s; };
  /** Height of the walking surface at (x, z) – decks per SPEC §5 (shared rule in util.js so fittings sit on the real deck). */
  const deckYAt = (x, z) => U.deckYAt(x, z);
  /** Merge several (transformed) meshes into ONE mesh with the given material (keeps the mesh count down). */
  function mergeMeshes(meshes, material) {
    const pos = [], nor = [];
    for (const m of meshes) {
      m.updateMatrix();
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
      const p = g.attributes.position.array, n = g.attributes.normal.array;
      for (let i = 0; i < p.length; i++) pos.push(p[i]);
      for (let i = 0; i < n.length; i++) nor.push(n[i]);
      g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    const mesh = new THREE.Mesh(g, material); mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  function roundedCase(w,h,d,r,material,position) {
    // Bevelled extrusion: shrink the core so the bevel stays inside w/h/d.
    const shape=new THREE.Shape(), x=w/2-r, yy=h/2-r;
    shape.moveTo(-x,-yy);shape.lineTo(x,-yy);shape.lineTo(x,yy);shape.lineTo(-x,yy);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,steps:1,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:1});
    geometry.translate(0,0,-(d-2*r)/2);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);
    mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }

  const roofY = M.WH_ROOF_Y, aftY = M.AFTDECK_Y;
  const aftRailY = aftY + .89, aftRailMidY = aftY + .45;

  // Low roof pedestal and compact open radar array, forward of the signal mast.
  const radar = sub('radarPedestal');
  // The assembly's dimensions use the legacy radar datum; register its actual
  // mounting plate to the roof so a cabin-height change cannot leave an air gap.
  radar.position.y=roofY-(M.RADAR_BASE_Y-.035/2);
  const ax = M.RADAR_X, az = M.RADAR_Z;
  const radarFoot=U.box(.29,.035,.27,metal,[ax,M.RADAR_BASE_Y,az]);
  radarFoot.name='radarMountingPlate';radar.add(radarFoot);parts.radarFoot=radarFoot;
  radar.add(U.box(.29,.18,.27,radarPaint,[ax,M.RADAR_BASE_Y+.107,az]));
  radar.add(U.cyl(.065,.065,.07,dark,16,[ax,M.RADAR_AXIS_Y-.025,az]));
  for(const dx of [-.10,.10]) for(const dz of [-.09,.09])
    radar.add(U.cyl(.012,.012,.012,dark,8,[ax+dx,M.RADAR_BASE_Y+.024,az+dz]));
  const radarAntenna = new THREE.Group(); radarAntenna.name = 'radarAntenna';
  radarAntenna.position.set(ax,M.RADAR_AXIS_Y,az);radar.add(radarAntenna);parts.radarAntenna=radarAntenna;
  radarAntenna.add(U.box(.17,.10,.18,radarPaint,[-.045,.03,0]));
  radarAntenna.add(U.box(M.RADAR_ANT_D,M.RADAR_ANT_H,M.RADAR_ANT_L,radarPaint,[.035,.075,0]));
  radarAntenna.add(U.box(.012,.035,M.RADAR_ANT_L-.07,dark,[.132,.075,0]));

  // ================= FOLDING SIGNAL MAST (mast_signal, folds AFT = +90° about z) =================
  const mastBase = sub('mastBase');
  const mastRec = U.hinge({ id: 'mast_signal', label: 'Fällbar signalmast', kind: 'mast', parent: mastBase,
    pivot: [M.MAST_X, M.MAST_FOOT_Y, M.MAST_Z], axis: 'z', closed: 0, open: 90, speed: 2 });
  articulations.push(mastRec);
  const mp = mastRec.pivot; parts.mast = mp;
  const mastH = M.MAST_TOP_Y - M.MAST_FOOT_Y;
  mp.add(U.cyl(M.MAST_R * .65, M.MAST_R, mastH, metal, 12, [0, mastH / 2, 0]));
  const mastLens = U.mat(0xc7d1d0, { roughness: .35, metalness: .15, name: 'unlit-mast-lens' });
  function mastLight(x, y, z) {
    mp.add(U.cyl(.037,.037,.082,mastLens,12,[x,y,z]));
    for(const dy of [-.05,.05]) mp.add(U.cyl(.044,.044,.018,dark,12,[x,y+dy,z]));
  }
  mastLight(0,mastH+.045,0);
  // The two clear lamps have dark hoods. The small blue signal glass hangs below the upper bracket in Borg's 845.
  for(const fraction of [.34,.86]) {
    const h=mastH*fraction;
    mp.add(U.bar(V3(0,h,0),V3(0,h,.19),.009,metal));
    mastLight(0,h+.062,.11);
    mp.add(U.bar(V3(0,h-.09,0),V3(0,h,.19),.007,metal));
  }
  const signalBlue = U.mat(0x233f67, { roughness: .32, metalness: .1 });
  mp.add(U.cyl(.026,.026,.075,signalBlue,12,[0,mastH*.86-.055,.19]));
  mp.add(U.cyl(.035,.035,.018,dark,12,[0,mastH*.86-.007,.19]));
  mp.add(U.box(0.06, 0.05, 0.05, dark, [0.03, 0.55, 0]));                                              // halyard cleat
  // tabernacle (fixed): two cheek plates + hinge pin at the pivot
  [-0.055, 0.055].forEach(z => mastBase.add(U.box(0.12, 0.16, 0.02, metal, [M.MAST_X, M.MAST_FOOT_Y + 0.06, M.MAST_Z+z])));
  mastBase.add(U.cyl(0.012, 0.012, 0.16, dark, 8, [M.MAST_X, M.MAST_FOOT_Y, M.MAST_Z], 'z'));

  // ================= NAV LIGHTS on the roof edge (green SB +z, red BB -z) =================
  const lights = sub('lights');
  [[1, green], [-1, red]].forEach(([s, m]) => {
    lights.add(U.box(0.12, 0.02, 0.10, dark, [M.NAVLIGHT_X, roofY + 0.01, s * M.NAVLIGHT_Z]));
    lights.add(U.box(0.10, 0.06, 0.07, m, [M.NAVLIGHT_X, M.NAVLIGHT_Y + 0.02, s * M.NAVLIGHT_Z]));
  });

  // ================= WHEELHOUSE ROOF: handrail, whip antennas, GPS dome, horn =================
  const roofGear = sub('roofGear');
  {
    const rz = 1.15, ry = roofY + 0.08, x0 = M.WH_ROOF_X0 + 0.30, x1 = M.WH_ROOF_X1 - 0.20, xf = M.WH_ROOF_X1 - 0.05;
    const pts = [V3(x0, ry, -rz), V3(x1, ry, -rz), V3(xf, ry, -(rz - 0.15)), V3(xf, ry, rz - 0.15), V3(x1, ry, rz), V3(x0, ry, rz)];
    const rr = [];
    for (let i = 0; i < pts.length - 1; i++) rr.push(U.bar(pts[i], pts[i + 1], 0.012, metal));
    pts.forEach(p => rr.push(sphere(0.012, p)));
    [[x0 + 0.05, -rz], [(x0 + x1) / 2, -rz], [x1 - 0.05, -rz], [x0 + 0.05, rz], [(x0 + x1) / 2, rz], [x1 - 0.05, rz], [xf, -0.5], [xf, 0.5]]
      .forEach(([x, z]) => rr.push(U.cyl(0.01, 0.01, ry - roofY, metal, 8, [x, (ry + roofY) / 2, z])));
    roofGear.add(mergeMeshes(rr, metal));
    // whip antennas on the aft roof corners
    const wx = M.WH_ROOF_X0 + 0.12;
    [1.16].forEach(z => {
      roofGear.add(U.cyl(0.03, 0.03, 0.10, dark, 10, [wx, roofY + 0.05, z]));
      roofGear.add(U.cyl(0.008, 0.008, 1.6, dark, 6, [wx, roofY + 0.10 + 0.8, z]));
    });
    // GPS and horn belong to superstructure.js; a second pair here previously duplicated them.
    // Two short handholds flank the rear roof passage, clear of the two forward-opening hatch lids.
    for(const z of [-.40,.40]) roofGear.add(U.tube([
      V3(M.WH_ROOF_X0+.08,roofY,z),V3(M.WH_ROOF_X0+.08,roofY+.38,z),
      V3(M.WH_ROOF_X0+.17,roofY+.45,z),V3(M.WH_ROOF_X0+.49,roofY+.45,z),
      V3(M.WH_ROOF_X0+.55,roofY+.38,z),V3(M.WH_ROOF_X0+.55,roofY,z)
    ],.018,metal,24));
    // Bronze ship's bell beside the mast, visible on the 845 roof.
    const bronze=U.mat(0x9b7043,{roughness:.46,metalness:.65});
    const bx=M.MAST_X+.33,bz=M.MAST_Z+.55;
    roofGear.add(U.bar(V3(bx,roofY,bz),V3(bx,roofY+.35,bz),.012,metal));
    roofGear.add(U.bar(V3(bx,roofY+.35,bz),V3(bx+.08,roofY+.35,bz),.012,metal));
    roofGear.add(U.cyl(.025,.082,.12,bronze,20,[bx+.08,roofY+.265,bz]));
    roofGear.add(U.cyl(.088,.088,.017,bronze,20,[bx+.08,roofY+.197,bz]));
  }

  // The 925 foredeck photo and Docksta's 113 photo show a horizontal rounded
  // hoop projecting from the roof, not a vertical rectangle over the glass.
  // Two diagonal legs converge onto separate centre-deck footplates.
  const bridgeRails=sub('bridgeWingRails');
  const guardBackX=M.WH_WS_TOP_X-.03,guardFrontX=11.90,half=.78,corner=.08;
  const guardY=x=>U.lerp(roofY+.08,roofY+.03,(x-guardBackX)/(guardFrontX-guardBackX));
  const guardPoint=(x,z)=>V3(x,guardY(x),z);
  const guardHoop=U.tube([
    guardPoint(guardBackX,-half+corner),guardPoint(guardBackX+corner,-half),
    guardPoint(guardFrontX-corner,-half),guardPoint(guardFrontX,-half+corner),
    guardPoint(guardFrontX,half-corner),guardPoint(guardFrontX-corner,half),
    guardPoint(guardBackX+corner,half),guardPoint(guardBackX,half-corner),
    guardPoint(guardBackX,-half+corner)
  ],.024,metal,64);
  guardHoop.name='horizontalWindscreenGuard';bridgeRails.add(guardHoop);parts.bridgeGuardHoop=guardHoop;
  for(const side of [-1,1]) {
    const bx=11.85,bz=side*.20,by=deckYAt(bx,bz);
    bridgeRails.add(U.bar(V3(bx,by+.018,bz),guardPoint(guardFrontX-corner,side*half),.023,metal));
    bridgeRails.add(deckContact(U.box(.12,.018,.10,metal,[bx,by+.009,bz]),'front-rail-foot'));
    // Short welded brackets attach the aft side of the hoop to the roof brow.
    bridgeRails.add(U.bar(V3(guardBackX,roofY,side*(half-corner)),guardPoint(guardBackX,side*(half-corner)),.018,metal));
  }
  roofGear.scale.z=M.WH_WIDTH_SCALE;
  lights.scale.z=M.WH_WIDTH_SCALE;

  // ================= RING MOUNT (ringlavett) with rotating cradle (turret_ring) =================
  const RM = M.RING_MOUNT, R = RM.r;
  const ring = sub('ringMount');
  {
    // Broad, flat annular rail in the 845 illustration, rather than a round pipe hoop.
    const section=[[-.045,-.025],[.045,-.025],[.045,.025],[-.045,.025],[-.045,-.025]]
      .map(([dr,y])=>new THREE.Vector2(R+dr,y));
    const annulus = new THREE.Mesh(new THREE.LatheGeometry(section,64),metal);
    annulus.position.set(RM.x,RM.ringY,0);annulus.castShadow=true;ring.add(annulus);
    const legs=sub('ringSupportLegs',ring);
    for(let i=0;i<RM.struts;i++) {
      const a=PI/4+i*PI/2;
      const upper=V3(RM.x+R*Math.cos(a),RM.ringY-.025,R*Math.sin(a));
      const foot=V3(RM.x+.90*Math.cos(a),RM.y+.025,.86*Math.sin(a));
      const leg=U.bar(foot,upper,.026,metal);leg.name='ringSupportLeg';
      leg.userData.foot=foot.toArray();leg.userData.upper=upper.toArray();legs.add(leg);
      legs.add(deckContact(U.box(.14,.035,.14,metal,[foot.x,RM.y+.0175,foot.z]),'ring-foot'));
    }
    // Open standing basket under the ring, with foot grating and slender stays.
    const basket=sub('ringStandingBasket',ring);
    const footRing=new THREE.Mesh(new THREE.TorusGeometry(.40,.018,8,40),dark);
    footRing.rotation.x=PI/2;footRing.position.set(RM.x,RM.y+.19,0);basket.add(footRing);
    const basketMesh=[];
    // Open wire basket is an external visual detail; its upper opening remains clear.
    for(const y of [.30,.43,.56]) {
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.40,.007,5,40),dark);
      rim.rotation.x=PI/2;rim.position.set(RM.x,RM.y+y,0);basketMesh.push(rim);
    }
    for(let i=0;i<24;i++) {
      const a=i*PI/12,b=a+PI/12;
      const point=(angle,y)=>V3(RM.x+.40*Math.cos(angle),RM.y+y,.40*Math.sin(angle));
      basketMesh.push(U.bar(point(a,.19),point(b,.56),.004,dark));
      basketMesh.push(U.bar(point(b,.19),point(a,.56),.004,dark));
    }
    basket.add(mergeMeshes(basketMesh,dark));
    for(let z=-.30;z<=.301;z+=.10) {
      const half=Math.sqrt(.40*.40-z*z);
      basket.add(U.box(half*2,.025,.025,dark,[RM.x,RM.y+.19,z]));
    }
    for(const side of [-1,1]) basket.add(U.bar(V3(RM.x-.25,RM.y+.19,side*.29),V3(RM.x-.36,RM.ringY-.06,side*.36),.014,dark));
  }
  const turret = U.hinge({ id: 'turret_ring', label: 'Ringlavett (vridning)', kind: 'turret', parent: ring,
    pivot: [RM.x, RM.ringY, 0], axis: 'y', closed: 0, open: 360, speed: 4 });
  articulations.push(turret);
  // The reference gun is trained forward and elevated above the aft edge of the cabin.
  const cg=new THREE.Group();cg.name='ringCarriage';turret.pivot.add(cg);parts.ringCradle=turret.pivot;
  {
    const carriage = [];
    carriage.push(U.box(0.18, 0.11, 0.16, dark, [R, 0.0, 0]));                 // gun carriage riding on the rail (+X side)
    carriage.push(U.cyl(0.03, 0.03, 0.32, metal, 12, [R, 0.21, 0]));           // pintle post
    carriage.push(U.box(0.12, 0.06, 0.18, dark, [R, 0.38, 0]));                // cradle yoke
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R - 0.055, 0.018, 8, 48), dark); // inner ring tying carriage + back-rest
    inner.rotation.x = PI / 2; inner.position.y = -0.03; carriage.push(inner);
    [-1, 1].forEach(s => {                                                     // back-rest carriage (-X side)
      const a = PI + s * 0.35, r2 = R + 0.035;
      carriage.push(U.box(0.14, 0.10, 0.14, dark, [R * Math.cos(a), 0, R * Math.sin(a)]));
      carriage.push(U.box(0.04, 0.30, 0.04, dark, [r2 * Math.cos(a), 0.18, r2 * Math.sin(a)]));
    });
    cg.add(mergeMeshes(carriage, dark));
    const rest = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.30, 12, 1, true, 1.5 * PI - 0.42, 0.84), pad);
    rest.position.y = 0.24; rest.castShadow = true; cg.add(rest);            // curved back-rest pad
    // 12.7 mm MG (KSP 88 / M2HB) on the pintle, pointing +X at value 0
    const mg = new THREE.Group(); mg.name = 'ringMg'; mg.position.set(R, 0.45, 0); mg.rotation.z=U.deg(25); cg.add(mg); parts.ringMg = mg;
    const L = M.TWIN_MG.barrelL;
    const g = [];
    g.push(U.box(0.45, 0.16, 0.14, gun, [0, 0, 0]));                                       // receiver x -0.225..0.225
    g.push(U.box(0.10, 0.05, 0.05, gun, [0.02, 0.105, 0]));                                // top cover / sight
    g.push(U.cyl(0.045, 0.045, 0.35, gun, 12, [0.225 + 0.175, 0, 0], 'x'));                // barrel jacket
    g.push(U.cyl(0.03, 0.03, L, gun, 12, [0.225 + L / 2, 0, 0], 'x'));                     // barrel r 0.03 l 1.1
    g.push(U.cyl(0.036, 0.036, 0.09, gun, 12, [0.225 + L - 0.045, 0, 0], 'x'));            // flash hider
    [-0.07, 0.07].forEach(z => g.push(U.cyl(0.015, 0.015, 0.14, gun, 8, [-0.29, 0.03, z], 'x'))); // spade grips
    mg.add(mergeMeshes(g, gun));
    mg.add(U.box(0.30, 0.19, 0.15, ammo, [-0.03, -0.01, -0.165]));                         // ammo box (feed from the left)
  }

  // ================= RAILINGS along the aft-deck sheer + grab rails on the trunk sides =================
  const rails = sub('railings');
  [-1, 1].forEach(side => {
    const railEnd=M.TRUNK_X0-.15;
    [0.5,1.5,2.5,railEnd].forEach(x => {
      const s = U.stationAt(x), z = side * (s.deckZ - 0.10), h = aftRailY - aftY;
      rails.add(deckContact(U.cyl(0.015, 0.015, h, metal, 10, [x, M.AFTDECK_Y + h / 2, z]),'aft-rail-foot'));
    });
    const top = [], mid = [];
    for (let i = 0; i <= 12; i++) {
      const x = U.lerp(.35,railEnd,i/12), s = U.stationAt(x), z = side * (s.deckZ - 0.10);
      top.push(V3(x, aftRailY, z)); mid.push(V3(x, aftRailMidY, z));
    }
    rails.add(U.tube(top, 0.015, metal, 40));
    rails.add(U.tube(mid, 0.010, metal, 40));
    // Grab rail follows the actual raised-deck edge, including its corrected aft end.
    const gz = side * (M.TRUNK_HALFW + 0.06), gy = M.TRUNK_Y - 0.12;
    const grabX0=M.TRUNK_X0+.25,grabX1=M.WH_X0-.15;
    const gr = [U.bar(V3(grabX0, gy, gz), V3(grabX1, gy, gz), 0.015, metal)];
    [grabX0+.15,(grabX0+grabX1)/2,grabX1-.15].forEach(x => gr.push(U.bar(V3(x, gy, side * M.TRUNK_HALFW), V3(x, gy, gz), 0.012, metal)));
    rails.add(mergeMeshes(gr, metal));
  });

  // The large resilient pads cover only the bow shoulders. A thin flat rubbing strip runs aft.
  // The centre piece belongs to the moving bow ramp in hull.js, leaving visible joints at both corners.
  const fend=sub('fenders'), bowPads=sub('bowFenderPads',fend), aftStrips=sub('aftRubbingStrips',fend);
  function sweptPad(x0,x1,side,profile,material,name) {
    const positions=[],indices=[],n=64,m=profile.length;
    for(let i=0;i<=n;i++) {
      const x=x0+(x1-x0)*i/n,st=U.stationAt(x);
      for(const [out,dy] of profile) positions.push(x,st.deckY+dy,side*(st.deckZ+out));
    }
    for(let i=0;i<n;i++) for(let k=0;k<m;k++) {
      const a=i*m+k,b=i*m+(k+1)%m,c=(i+1)*m+k,d=(i+1)*m+(k+1)%m;
      indices.push(a,c,b,b,c,d);
    }
    for(let k=1;k<m-1;k++){indices.push(0,k,k+1);indices.push(n*m,n*m+k+1,n*m+k);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  // Six-sided rubber face: flat outer face with chamfered upper/lower edges, not a round inflated tube.
  const bowProfile=[[.008,.031],[.100,.031],[.142,-.004],[.142,-.090],[.100,-.126],[.008,-.126]];
  const stripProfile=[[.006,-.063],[.028,-.063],[.028,-.097],[.006,-.097]];
  const stripMat=U.mat(0x333d36,{roughness:.87,metalness:.3,side:THREE.DoubleSide});
  const padMat=rubber.clone();padMat.side=THREE.DoubleSide;
  for(const side of [-1,1]) {
    bowPads.add(sweptPad(M.BOW_RUBBER_X0,M.STEM_X-.01,side,bowProfile,padMat,side<0?'bowPadP':'bowPadS'));
    aftStrips.add(sweptPad(.02,M.BOW_RUBBER_X0,side,stripProfile,stripMat,side<0?'aftStripP':'aftStripS'));
  }

  // ================= BOLLARDS, CLEATS, LIFTING EYES =================
  const fittings = sub('fittings');
  M.BOLLARDS.forEach(([x, z]) => {                                                           // paired outward-raked posts, as drawn on 845
    // The older H plan places the aft pair outside the mine channels. Their
    // narrower foot remains on the deck edge and clears the opening engine lids.
    const y = deckYAt(x, z), b = [U.box(0.30, 0.03, x<2?.12:.16, metal, [x, y + 0.015, z])];
    if(x>12) {
      // Horizontal double-post mooring bitt visible on the reference foredeck.
      for(const dx of [-.085,.085]) b.push(U.cyl(.026,.026,.16,metal,12,[x+dx,y+.11,z]));
      b.push(U.cyl(.038,.038,.39,metal,16,[x,y+.20,z],'x'));
    } else [-1,1].forEach(s => {
      const bottom=V3(x+s*.055,y+.035,z),top=V3(x+s*.115,y+.25,z);
      b.push(U.bar(bottom,top,.032,metal));
      const cap=U.cyl(.052,.052,.018,metal,12,top.toArray());cap.rotation.z=-s*Math.atan2(.060,.215);b.push(cap);
    });
    fittings.add(deckContact(mergeMeshes(b, metal),'bollard'));
  });
  [[4.6, 1.60], [10.3, 1.70]].forEach(([x, hz]) => [-1, 1].forEach(side => {                // horn cleats
    const z = side * hz, y = deckYAt(x, z);
    const c = [U.box(0.26, 0.04, 0.05, metal, [x, y + 0.08, z])];
    [-0.06, 0.06].forEach(dx => c.push(U.cyl(0.015, 0.015, 0.06, metal, 8, [x + dx, y + 0.03, z])));
    fittings.add(deckContact(mergeMeshes(c, metal),'cleat'));
  }));
  [[7.0, 1.75], [12.9, 1.02]].forEach(([x, hz]) => [-1, 1].forEach(side => {                // 4 lifting eyes (forward pair inside the narrow foredeck)
    const z = side * hz, y = deckYAt(x, z);
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), metal); eye.position.set(x, y + 0.065, z);
    fittings.add(deckContact(mergeMeshes([U.box(0.14, 0.02, 0.09, metal, [x, y + 0.01, z]), eye], metal),'lifting-eye'));
  }));

  // ================= TRANSOM: exhausts, trim planes, ensign staff + flag + stern light =================
  const transom = sub('transom');
  [-1, 1].forEach(side => {
    const z = side * M.EXHAUST.z;
    transom.add(U.cyl(M.EXHAUST.r, M.EXHAUST.r, 0.15, dark, 20, [-0.075, M.EXHAUST.y, z], 'x'));  // pipe x -0.15..0
    const disc = new THREE.Mesh(new THREE.CircleGeometry(M.EXHAUST.r * 0.85, 20), soot);
    disc.position.set(-0.151, M.EXHAUST.y, z); disc.rotation.y = -PI / 2; transom.add(disc);    // dark open end facing -X
    // trim plane: hinged at the transom bottom edge, static 5° down
    const T = M.TRIMPLANE, tz = side * T.z;
    const tp = new THREE.Group(); tp.position.set(0, T.y, tz); tp.rotation.z = U.deg(5); transom.add(tp);
    tp.add(U.box(T.l, 0.02, T.w, dark, [-T.l / 2, 0, 0]));
    tp.add(U.cyl(0.02, 0.02, T.w, metal, 10, [0, 0, 0], 'z'));                                    // hinge knuckle
    const ramTop = V3(-0.03, T.y + 0.28, tz), ramBot = V3(-0.30, T.y - 0.30 * Math.sin(U.deg(5)) + 0.012, tz);
    transom.add(U.bar(ramTop, ramBot, 0.018, U.jetSteel()));                                     // ram rod
    transom.add(U.bar(ramTop, ramTop.clone().lerp(ramBot, 0.45), 0.032, hyd));                   // ram body
    transom.add(U.box(0.06, 0.08, 0.10, dark, [-0.03, T.y + 0.30, tz]));                          // transom bracket
  });
  {
    const st=M.ENSIGN_STAFF;
    transom.add(U.cyl(.03,.03,.08,dark,10,[st.x,st.y+.04,st.z]));
    transom.add(U.cyl(.015,.015,st.h,metal,10,[st.x,st.y+st.h/2,st.z]));
    transom.add(sphere(.023,V3(st.x,st.y+st.h,st.z),metal));
    const fw=1.0,fh=.625,fy=st.y+st.h-fh/2-.035,hoist=st.x-.018;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#1665ac';ctx.fillRect(0,0,512,320);
    ctx.fillStyle='#edc638';ctx.fillRect(332,0,64,320);ctx.fillRect(0,128,512,64);
    ctx.globalCompositeOperation='destination-out';
    for(const yy of [64,256]) {ctx.beginPath();ctx.moveTo(0,yy-64);ctx.lineTo(154,yy);ctx.lineTo(0,yy+64);ctx.closePath();ctx.fill();}
    ctx.globalCompositeOperation='source-over';
    const tex=new THREE.CanvasTexture(canvas);tex.encoding=THREE.sRGBEncoding;
    // Fit the mesh to the three tongues, so the notches also belong to the
    // geometry (including its silhouette and shadows), not just an alpha mask.
    const cols=40,rows=30,positions=[],uvs=[],indices=[];
    for(let row=0;row<=rows;row++) {
      const v=row/rows;
      const notch=v<.4?1-Math.abs(v-.2)/.2:v>.6?1-Math.abs(v-.8)/.2:0;
      const length=fw*(1-(154/512)*Math.max(0,notch));
      for(let col=0;col<=cols;col++) {
        const distance=length*col/cols;
        positions.push(fw/2-distance,fh*(.5-v),0);uvs.push(1-distance/fw,1-v);
        if(row<rows&&col<cols) {
          const a=row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;
          indices.push(a,c,b,b,c,d);
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
    const flag=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xffffff,map:tex,alphaTest:.5,roughness:.96,metalness:0,side:THREE.DoubleSide}));
    flag.name='navalEnsign';flag.position.set(hoist-fw/2,fy,st.z);flag.castShadow=true;transom.add(flag);parts.ensignFlag=flag;parts.ensignWidth=fw;
    parts.ensignRest=flag.geometry.attributes.position.array.slice();
    // Sewn hoist and two short lashings remain attached to the staff.
    transom.add(U.bar(V3(hoist,fy-fh/2,st.z),V3(hoist,fy+fh/2,st.z),.003,white));
    for(const y of [fy-fh/2+.012,fy+fh/2-.012])transom.add(U.tube([
      V3(hoist,y,st.z),V3(st.x-.021,y,st.z-.019),V3(st.x+.015,y,st.z-.012),V3(st.x+.018,y,st.z+.012)
    ],.0025,white,12));
    parts.ensignCloth={cols,rows,width:fw,height:fh};
  }

  // Aft mine channels extend over the grated stern platform, with open U section and support braces.
  const aftDeck=sub('aftDeckGear'), mineRails=sub('mineRails',aftDeck);
  const mineX0=-.86,mineX1=M.TRUNK_X0-.13,mineL=mineX1-mineX0,mineCX=(mineX0+mineX1)/2;
  for(const side of [-1,1]) {
    const z=side*1.52;
    mineRails.add(U.box(mineL,.025,.15,dark,[mineCX,aftY+.0475,z]));
    for(const edge of [-1,1]) mineRails.add(U.box(mineL,.085,.018,metal,[mineCX,aftY+.1025,z+edge*.069]));
    for(const x of [-.68,.35,1.4,mineX1-.25]) {
      const foot=U.box(.08,.035,.19,dark,[x,aftY+.0175,z]);
      mineRails.add(x>=0?deckContact(foot,'mine-rail-foot'):foot);
      if(x<0) mineRails.add(U.bar(V3(-.06,.52,z),V3(x,aftY+.035,z),.026,metal));
    }
  }
  const vent=sub('aftVentilation',aftDeck);
  // The box is outboard of the engine hatch; it must not intersect the opening lid.
  const ventX=M.TRUNK_X0-.90,ventZ=-1.63;
  vent.add(deckContact(U.box(1.15,.40,.30,U.mat(0x65715a,{roughness:.86}),[ventX,aftY+.20,ventZ]),'ventilation-base'));
  vent.add(U.box(1.20,.035,.34,dark,[ventX,aftY+.405,ventZ]));
  vent.add(U.box(1.04,.27,.016,soot,[ventX,aftY+.21,ventZ-.154]));
  for(let i=0;i<7;i++) vent.add(U.box(1.04,.015,.045,metal,[ventX,aftY+.095+i*.038,ventZ-.163]));
  const whip=sub('aftWhip',aftDeck);
  const whipX=M.TRUNK_X0+.15,whipY=M.TRUNK_Y+.93,whipZ=-M.TRUNK_HALFW+.025;
  whip.add(U.box(.17,.08,.19,radarPaint,[whipX,whipY-.04,whipZ]));
  whip.add(U.cyl(.04,.04,.10,dark,10,[whipX,whipY+.05,whipZ]));
  whip.add(U.bar(V3(whipX,whipY+.10,whipZ),V3(whipX-.06,M.MAST_TOP_Y+1.25,whipZ),.009,dark));

  // ================= HULL IDENTIFICATION: PAINTED NAVAL LETTERING =================
  const numbers = sub('hullNumbers');
  {
    const canvas=document.createElement('canvas'); canvas.width=768;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,768,256);
    ctx.font='italic 700 218px Arial';ctx.fillStyle='#34372f';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(M.HULL_NUMBER,384,130);
    const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.anisotropy=4;
    const paint=new THREE.MeshStandardMaterial({map,transparent:true,alphaTest:.2,roughness:.88,depthWrite:false,side:THREE.DoubleSide});
    // Mid-height on the topsides under the twin gun, as drawn on the 803 profile and the 845 illustration; the low bow
    // sheer (1.27 at x 13) leaves no room for the marking any higher or further forward.
    for(const side of [-1,1]) {
      const geo=new THREE.PlaneGeometry(1.25,.55,12,3),p=geo.attributes.position, uv=geo.attributes.uv;
      for(let i=0;i<p.count;i++) {
        const x=12.40+side*p.getX(i),y=.66+p.getY(i),z=side*(U.hullHalfWidthAt(x,y)+.018);
        p.setXYZ(i,x,y,z);
      }
      geo.computeVertexNormals(); const mesh=new THREE.Mesh(geo,paint);mesh.name=side<0?'hullNumberP':'hullNumberS';numbers.add(mesh);
    }
    // Pale angular camouflage field behind the dark stern marking, visible on reference 845.
    const field=new THREE.BufferGeometry();field.setAttribute('position',new THREE.Float32BufferAttribute([
      -.058,aftY-.72,-.80, -.058,aftY-.11,-.80, -.058,aftY-.17,.38,
      -.058,aftY-.72,-.80, -.058,aftY-.17,.38, -.058,aftY-.61,.65
    ],3));field.computeVertexNormals();
    numbers.add(new THREE.Mesh(field,U.mat(0x858a7f,{roughness:.9,side:THREE.DoubleSide})));
    const stern=new THREE.Mesh(new THREE.PlaneGeometry(.66,.28),paint);stern.rotation.y=-PI/2;stern.position.set(-.059,aftY-.43,0);numbers.add(stern);
  }

  // ================= REFERENCE OUTFITTING: RAILS, ROPES, SURVIVAL GEAR =================
  const detail=sub('workingDeckDetails');
  parts.bowGrabRails=[];
  const orange=U.mat(0xe75822,{roughness:.78}), ropeMat=U.mat(0xb2ad8e,{roughness:.98});
  const fieldGreen=U.mat(0x515444,{roughness:.88,metalness:.05});
  const rimGreen=U.mat(0x30362c,{roughness:.85});
  // The raised troop deck carries a tall protective rail, as on the reference boat.
  for(const side of [-1,1]) {
    const z=side*(M.TRUNK_HALFW-.025),y=M.TRUNK_Y;
    const railPieces=[];
    const trunkRailX0=M.TRUNK_X0+.15,trunkRailX1=M.WH_X0-.13;
    for(let i=0;i<=5;i++) {
      const x=U.lerp(trunkRailX0,trunkRailX1,i/5);
      railPieces.push(U.cyl(.02,.02,.94,metal,10,[x,y+.47,z]));
      detail.add(deckContact(U.box(.10,.025,.12,dark,[x,y+.0125,z]),'trunk-rail-foot'));
    }
    railPieces.push(U.bar(V3(trunkRailX0,y+.93,z),V3(trunkRailX1,y+.93,z),.021,metal));
    railPieces.push(U.bar(V3(trunkRailX0,y+.52,z),V3(trunkRailX1,y+.52,z),.014,metal));
    railPieces.push(U.bar(V3(M.TRUNK_X0-.20,aftRailY,side*1.69),V3(trunkRailX0,y+.93,z),.019,metal));
    // Closely spaced vertical guards above the cases, visible on both 845
    // and 826; their lower ends stop at the middle rail.
    for(let i=0;i<5;i++) {
      const a=U.lerp(trunkRailX0,trunkRailX1,i/5),b=U.lerp(trunkRailX0,trunkRailX1,(i+1)/5);
      for(const t of [.36,.64]) railPieces.push(U.bar(V3(U.lerp(a,b,t),y+.52,z),V3(U.lerp(a,b,t),y+.93,z),.012,metal));
    }
    detail.add(mergeMeshes(railPieces,metal));
    // Olive survival cases on the raised side decks, with rubber lid seals and webbing straps.
    for(const x of [6.00,7.12]) {
      const caseG=new THREE.Group();caseG.name='survivalCase';detail.add(caseG);
      for(const dx of [-.27,.27]) caseG.add(deckContact(U.box(.07,.06,.43,rimGreen,[x+dx,y+.03,side*1.13]),'stowage-case-foot'));
      // Moulded cases have soft corners and a shallow overlapping lid, not
      // square crates. Bounds retain the existing deck feet and clear walkway.
      const cz=side*1.13;
      caseG.add(roundedCase(.83,.28,.43,.045,fieldGreen,[x,y+.20,cz]));
      caseG.add(roundedCase(.85,.035,.45,.015,rimGreen,[x,y+.345,cz]));
      caseG.add(roundedCase(.85,.10,.45,.035,fieldGreen,[x,y+.4125,cz]));
      for(const dx of [-.25,.25]) {
        // Separate surface straps: the old solid black slabs cut right through
        // the lid and projected above it like handles.
        for(const face of [-1,1]) {
          caseG.add(U.box(.035,.25,.012,rubber,[x+dx,y+.245,cz+face*.222]));
          caseG.add(U.box(.035,.048,.012,rubber,[x+dx,y+.407,cz+face*.228]));
          caseG.add(U.bar(V3(x+dx,y+.431,cz+face*.228),V3(x+dx,y+.465,cz+face*.19),.014,rubber));
          caseG.add(U.bar(V3(x+dx,y+.12,cz+face*.222),V3(x+dx,y+.065,cz+face*.17),.014,rubber));
        }
        caseG.add(U.box(.035,.008,.38,rubber,[x+dx,y+.466,cz]));
        caseG.add(U.box(.055,.07,.019,metal,[x+dx,y+.29,cz+side*.234]));
        caseG.add(U.box(.026,.035,.022,rimGreen,[x+dx,y+.29,cz+side*.245]));
      }
      // Recessed handle, end ribs and hinges visible in the supplied references.
      for(const face of [-1,1]) {
        caseG.add(roundedCase(.24,.085,.018,.007,rimGreen,[x,y+.245,cz+face*.219]));
        caseG.add(U.bar(V3(x-.08,y+.26,cz+face*.236),V3(x+.08,y+.26,cz+face*.236),.012,metal));
        for(const dx of [-.37,.37]) caseG.add(U.box(.025,.16,.018,fieldGreen,[x+dx,y+.22,cz+face*.216]));
      }
      for(const dx of [-.22,.22]) caseG.add(U.cyl(.018,.018,.08,metal,8,[x+dx,y+.35,cz-side*.23],'x'));
    }
    // 925 photograph: short inverted-U grab handles beside the bow hatches,
    // not a continuous guardrail along the foredeck.
    const gx=13.30,gz=side*.76,gy=deckYAt(gx,gz);
    const grabFeet=[-.17,.17].map(dx=>{
      const foot=U.box(.10,.015,.085,metal,[gx+dx,deckYAt(gx+dx,gz)+.0075,gz]);
      detail.add(deckContact(foot,'bow-grab-foot'));return foot;
    });
    const grab=U.tube([V3(gx-.17,deckYAt(gx-.17,gz)+.015,gz),V3(gx-.17,gy+.25,gz),V3(gx-.12,gy+.31,gz),V3(gx+.12,gy+.31,gz),V3(gx+.17,gy+.25,gz),V3(gx+.17,deckYAt(gx+.17,gz)+.015,gz)],.023,metal,32);
    grab.name=side<0?'bowGrabP':'bowGrabS';detail.add(grab);parts.bowGrabRails.push({rail:grab,feet:grabFeet});
    // Coiled mooring line and a suspended cylindrical fender near the aft quarter.
    const ropeX=1.25,ropeZ=side*.98,ropeY=aftY+.042;
    for(let i=0;i<5;i++) {
      const r=.085+i*.026,pts=[];
      for(let j=0;j<=48;j++){const a=j/48*PI*2;pts.push(V3(ropeX+Math.cos(a)*r,ropeY+i*.003,ropeZ+Math.sin(a)*r));}
      detail.add(U.tube(pts,.012,ropeMat,48));
    }
    const fx=M.TRUNK_X0-.51,fz=side*(U.stationAt(fx).deckZ+.10),fy=aftY-.13;
    detail.add(U.cyl(.125,.125,.43,rubber,14,[fx,fy,fz]));
    detail.add(sphere(.125,V3(fx,fy+.21,fz),rubber));detail.add(sphere(.125,V3(fx,fy-.21,fz),rubber));
    detail.add(U.tube([V3(fx,fy+.3,fz),V3(fx,aftRailY-.19,side*1.76),V3(fx+.06,aftRailY-.27,side*1.73)],.014,ropeMat,16));
  }
  function lifeRing(x,y,z,side) {
    const g=new THREE.Group();g.name='lifebuoy';g.position.set(x,y,z);detail.add(g);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.28,.067,12,40),orange);g.add(ring);
    for(let i=0;i<4;i++) {
      const a=i*PI/2;
      const band=new THREE.Mesh(new THREE.TorusGeometry(.28,.071,10,5,.26),white);band.rotation.z=a-.13;g.add(band);
    }
    const cord=new THREE.Mesh(new THREE.TorusGeometry(.355,.009,6,48),ropeMat);g.add(cord);
    g.add(U.box(.66,.038,.025,metal,[0,0,-side*.076]));
    g.add(U.box(.03,.17,.05,dark,[0,-.34,-side*.06]));
  }
  lifeRing(7.92,M.TRUNK_Y+.53,-1.65,-1);lifeRing(2.75,aftY+.57,1.78,1);
  const rescuePole=sub('rescueMarkerPole',detail);
  rescuePole.add(U.cyl(.015,.015,1.67,orange,10,[8.18,M.TRUNK_Y+.935,-1.51]));
  rescuePole.add(U.cyl(.035,.025,.40,white,10,[8.18,M.TRUNK_Y+1.94,-1.51]));
  rescuePole.add(U.cyl(.063,.063,.20,orange,14,[8.18,M.TRUNK_Y+1.03,-1.51]));
  rescuePole.add(U.box(.11,.09,.05,dark,[8.18,M.TRUNK_Y+.24,-1.52]));
  // Stern platform with perforated aluminium grating and tubular safety perimeter.
  const sternGear=sub('sternPlatform');
  const grate=[];
  for(let x=-.86;x<-.13;x+=.085) grate.push(U.box(.018,.035,3.04,metal,[x,.40,0]));
  for(let z=-1.50;z<1.51;z+=.11) grate.push(U.box(.78,.025,.015,metal,[-.51,.39,z]));
  sternGear.add(mergeMeshes(grate,metal));
  sternGear.add(U.tube([V3(-.11,.47,-1.60),V3(-.95,.47,-1.60),V3(-1.03,.47,-1.40),V3(-1.03,.47,1.40),V3(-.95,.47,1.60),V3(-.11,.47,1.60)],.030,metal,42));
  for(const side of [-1,1]) {
    sternGear.add(U.bar(V3(-.06,aftY-.03,side*1.57),V3(-.93,.45,side*1.57),.032,metal));
    sternGear.add(U.bar(V3(-.10,-.14,side*1.50),V3(-.92,.39,side*1.50),.030,dark));
    // Ventilation grilles on the transom, with individual louvres.
    sternGear.add(U.box(.06,.27,.47,dark,[-.05,aftY-.26,side*1.13]));
    const louvres=[];for(let i=0;i<6;i++)louvres.push(U.box(.075,.018,.42,metal,[-.087,aftY-.365+i*.04,side*1.13]));
    sternGear.add(mergeMeshes(louvres,metal));
  }
  // Boarding ladder under the port quarter, and split stern rails with an open centre exit.
  const ladder=sub('boardingLadder',sternGear);
  for(const z of [-1.39,-.96]) ladder.add(U.tube([V3(-.29,.46,z),V3(-.83,.47,z),V3(-1.02,.30,z),V3(-1.02,-.61,z)],.019,metal,24));
  for(const y of [.23,-.03,-.29,-.55]) ladder.add(U.bar(V3(-1.02,y,-1.39),V3(-1.02,y,-.96),.017,metal));
  for(const side of [-1,1]) {
    for(const z of [.48,1.5]) rails.add(U.bar(V3(.28,aftY,side*z),V3(.28,aftRailY,side*z),.018,metal));
    for(const y of [aftRailMidY,aftRailY]) rails.add(U.bar(V3(.28,y,side*.48),V3(.28,y,side*1.5),.015,metal));
  }
  // Removable safety chains across the stern boarding gap (845 reference).
  const chains=sub('sternSafetyChains',rails), links=[];
  for(const height of [aftRailMidY,aftRailY]) {
    for(let i=0;i<28;i++) {
      const t=i/27,z=U.lerp(-.48,.48,t),y=height-.10*Math.sin(PI*t);
      const link=new THREE.Mesh(new THREE.TorusGeometry(.021,.004,5,10),metal);
      link.scale.set(1,1.35,1);link.rotation.y=PI/2;
      if(i%2)link.rotation.z=PI/2;
      link.position.set(.28,y,z);links.push(link);
    }
  }
  chains.add(mergeMeshes(links,metal));
  // Three inset ventilation slots below the raised troop deck. The supplied 845 illustration has no regular rivet row.
  for(const side of [-1,1]) {
    for(const x of [5.72,6.75,7.78]) {
      const y=U.stationAt(x).deckY-.45,z=side*(U.hullHalfWidthAt(x,y)+.024);
      detail.add(U.box(.61,.088,.022,soot,[x,y,z]));
      detail.add(U.box(.64,.014,.035,dark,[x,y+.055,z]));
    }
  }

  // Photo-specific port access lid, low coaming and deck-edge fasteners.
  const foredeckDetails=sub('foredeckPhotoDetails');
  {
    const x=11.93,z=-1.03,x0=x-.47,x1=x+.47;
    const top0=deckYAt(x0,z)+.055,top1=deckYAt(x1,z)+.055;
    const topAt=xx=>U.lerp(top0,top1,(xx-x0)/(x1-x0));
    // The shoulder bends under this hatch. Its welded coaming follows that
    // bend below a planar lid, rather than burying a level box in the shoulder.
    const stations=[x0,M.FRONTDECK_SLOPE_X1,x1].filter(xx=>xx>=x0&&xx<=x1);
    const sections=stations.map(xx=>[
      V3(xx,deckYAt(xx,z),z-.31),V3(xx,deckYAt(xx,z),z+.31),
      V3(xx,topAt(xx),z+.31),V3(xx,topAt(xx),z-.31),V3(xx,deckYAt(xx,z),z-.31)
    ]);
    const coaming=new THREE.Mesh(U.loft(sections,{capStart:true,capEnd:true}),metal);
    coaming.name='portForedeckCoaming';coaming.castShadow=true;coaming.receiveShadow=true;
    foredeckDetails.add(coaming);parts.foredeckAccessCoaming=coaming;
    const lidFrame=new THREE.Group();lidFrame.name='portForedeckAccess';lidFrame.position.set(x,(top0+top1)/2,z);
    lidFrame.rotation.z=Math.atan2(top1-top0,x1-x0);foredeckDetails.add(lidFrame);
    const length=Math.hypot(x1-x0,top1-top0);
    lidFrame.add(U.box(length+.02,.010,.64,dark,[0,.005,0]));
    const lid=U.box(length+.04,.035,.66,U.deck(),[0,.0275,0]);lidFrame.add(lid);parts.foredeckAccessLid=lid;
    for(const dx of [-.29,.29]) {
      lidFrame.add(U.cyl(.018,.018,.13,metal,12,[dx,.047,-.31],'x'));
      lidFrame.add(U.tube([V3(dx-.05,.045,.22),V3(dx-.05,.10,.22),V3(dx+.05,.10,.22),V3(dx+.05,.045,.22)],.009,metal,12));
    }
    for(const side of [-1,1]) for(let x=11.55;x<14.7;x+=.18) {
      const st=U.stationAt(x),z=side*(st.deckZ-.025);
      foredeckDetails.add(U.box(.05,.018,.04,metal,[x,st.deckY+.009,z]));
    }
  }
  // ================= behaviour =================
  let radarOn = true, radarRpm = M.RADAR_RPM;
  function setRadar(on, rpm) { radarOn = !!on; if (rpm != null && isFinite(rpm)) radarRpm = rpm; }
  // Lightweight cloth approximation: integrate unit tangents along each row.
  // This gives folds in all three axes without stretching the fabric length.
  // Phase travels from hoist to fly; variation across the height lets the three
  // tongues flutter separately. It is a visual model, not a cloth FEM solver.
  const cloth={time:0,phase:0,remainder:0,windX:-3.8,windZ:-1.2,angle:Math.atan2(-1.2,-3.8)};
  function shapeEnsign() {
    const {cols,rows,width,height}=parts.ensignCloth,geometry=parts.ensignFlag.geometry;
    const p=geometry.attributes.position,rest=parts.ensignRest;
    const speed=Math.hypot(cloth.windX,cloth.windZ),dx=Math.cos(cloth.angle),dz=Math.sin(cloth.angle);
    const droop=1.32/(1+Math.pow(speed/2.5,1.6));
    const energy=U.clamp(speed/2,0,1),fold=energy*.54/(1+speed*.055);
    for(let row=0;row<=rows;row++) {
      const v=row/rows,start=row*(cols+1),length=width/2-rest[(start+cols)*3],ds=length/cols;
      let x=width/2,y=height*(.5-v),z=0;
      p.setXYZ(start,x,y,z);
      for(let col=1;col<=cols;col++) {
        const u=(col-.5)*ds/width,free=1-Math.exp(-u*4.5);
        const billow=Math.sin(u*7.4-cloth.phase+v*1.8+.35*Math.sin(cloth.time*.7));
        const ripple=Math.sin(u*18-cloth.phase*2.1-v*4.3);
        const tip=Math.sin(u*32-cloth.phase*3.6+v*11);
        const whip=u*u*Math.sin(u*5-cloth.phase*2.6+v*7);
        const slack=(1-energy)*.18*Math.sin(v*10+u*4);
        const side=free*(fold*(billow+.32*ripple+.20*u*u*tip+.55*whip+.22*Math.sin(cloth.time*.8))+slack);
        const pitch=-droop*free+free*energy*(.085*Math.sin(u*10-cloth.phase*1.13+v*5)+.035*u*tip+.12*whip);
        const forward=Math.cos(pitch),cs=Math.cos(side),sn=Math.sin(side);
        x+=ds*forward*(dx*cs-dz*sn);y+=ds*Math.sin(pitch);z+=ds*forward*(dz*cs+dx*sn);
        p.setXYZ(start+col,x,y,z);
      }
    }
    p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
  }
  function updateEnsign(dt,state) {
    if(!(dt>0)||state.paused)return;
    // Fixed ticks give the same motion at 30, 60 and 120 fps, and avoid jumps
    // when a suspended browser resumes. Never chase an external wall clock.
    cloth.remainder+=Math.min(dt,.1);const h=1/120,blend=1-Math.exp(-h*3.5);
    let changed=false;
    while(cloth.remainder+1e-10>=h) {
      cloth.remainder-=h;cloth.time+=h;changed=true;
      const nav=state.nav||{},heading=nav.heading||0,c=Math.cos(heading),s=Math.sin(heading);
      const air=state.wind||{x:-3.8,z:-1.2},gust=1+.12*Math.sin(cloth.time*.71)+.065*Math.sin(cloth.time*1.83+.7);
      // Wind is a world-space air velocity. Subtract the staff's boat velocity,
      // including yaw about midships, before expressing it in the boat frame.
      const wx=(Number.isFinite(air.x)?air.x:0)*gust,wz=(Number.isFinite(air.z)?air.z:0)*gust;
      const yaw=nav.yawRate||0,localX=c*wx-s*wz-(nav.speed||0)-yaw*M.ENSIGN_STAFF.z;
      const localZ=s*wx+c*wz+yaw*(M.ENSIGN_STAFF.x-M.LH/2);
      cloth.windX+=(localX-cloth.windX)*blend;cloth.windZ+=(localZ-cloth.windZ)*blend;
      const speed=Math.hypot(cloth.windX,cloth.windZ);
      if(speed>.08) {
        const target=Math.atan2(cloth.windZ,cloth.windX),delta=Math.atan2(Math.sin(target-cloth.angle),Math.cos(target-cloth.angle));
        cloth.angle+=delta*(1-Math.exp(-h*1.8));
      }
      cloth.phase+=h*(1.4+Math.sqrt(speed)*1.65);
    }
    if(changed)shapeEnsign();
  }
  shapeEnsign();
  function update(dt, state, t) {
    updateEnsign(dt,state||{});
    if (radarOn && dt > 0) radarAntenna.rotation.y = (radarAntenna.rotation.y + radarRpm / 60 * 2 * PI * dt) % (2 * PI);
  }
  // (castShadow/receiveShadow are set per mesh by the U helpers; hull numbers deliberately do not cast)
  return { group, parts, articulations, setRadar, update, setCutaway() {} };
};
