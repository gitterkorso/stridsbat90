// Animated Baltic sea. World coordinates are metres; +X is the boat's bow.
window.CB90 = window.CB90 || {};
CB90.buildWater = function (THREE) {
  'use strict';
  const group = new THREE.Group(); group.name = 'Baltic sea and wake';
  const depthMap = CB90.createWaterDepth(THREE);
  const hullWaves = CB90.createHullWaveSurface(THREE);
  const sunDirection = new THREE.Vector3(-0.42, 0.68, 0.59).normalize();
  const uniforms = {
    time: { value: 0 }, sunDirection: { value: sunDirection },
    boat: { value: new THREE.Vector4(0, 0, 0, 0) },
    seaColor: { value: new THREE.Color(0x123e49).convertSRGBToLinear() },
    windVelocity: { value: new THREE.Vector2(-3.81, -1.20) },
    reflectionMap: { value: null }, reflectionMatrix: { value: new THREE.Matrix4() },
    reflectionTexel: { value: new THREE.Vector2(1 / 768, 1 / 512) },
    reflectionEnabled: { value: 0 }, hullInverse: { value: new THREE.Matrix4() }
  };
  Object.assign(uniforms,CB90.weatherUniforms(THREE),depthMap.uniforms,hullWaves.uniforms,{seaStrength:CB90.Sea.strength});
  const waves=CB90.Sea.glsl.replace('void sea(', 'void ambientSea(')+hullWaves.glsl;
  // Clip water only inside the moving hull, retaining water underneath a lifted bow.
  const vec=v=>'vec3('+v.map(n=>n.toFixed(5)).join(',')+')';
  const sections=CB90.STATIONS;
  const hullGLSL='void hullSection(float x,out vec3 bottom,out vec3 top){'+sections.slice(1).map((b,i)=>{
    const a=sections[i],lower=o=>vec([o.keelY,o.keelZ,o.chineY]),upper=o=>vec([o.chineZ,o.deckY,o.deckZ]);
    return `${i?'else ':''}if(x<=${b.x.toFixed(5)}){float f=clamp((x-${a.x.toFixed(5)})/${(b.x-a.x).toFixed(5)},0.0,1.0);bottom=mix(${lower(a)},${lower(b)},f);top=mix(${upper(a)},${upper(b)},f);}`;
  }).join('')+'else{bottom=vec3(1.0,0.0,1.0);top=vec3(0.0,1.0,0.0);}}';
  const material = new THREE.ShaderMaterial({
    name: 'Baltic water · depth, wind ripples and soft reflections', uniforms: uniforms,
    extensions: { derivatives: true },
    vertexShader: `
      uniform float time;
      varying vec3 vWorldPosition;
      ${waves}
      void main() {
        vec3 p=position;
        vec2 worldXZ=(modelMatrix*vec4(p,1.0)).xz;
        float height; vec2 slope;
        sea(worldXZ,height,slope);
        p.y+=height;
        vec4 world=modelMatrix*vec4(p,1.0);
        vWorldPosition=world.xyz;
        gl_Position=projectionMatrix*viewMatrix*world;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float time;
      ${CB90.skyGLSL}
      uniform float fogDensity;
      uniform vec3 seaColor;
      uniform vec2 windVelocity;
      uniform sampler2D seabedMap;
      uniform vec2 seabedOrigin;
      uniform float seabedSpan, seabedReady;
      uniform vec4 boat;
      uniform mat4 hullInverse;
      ${hullGLSL}
      uniform sampler2D reflectionMap;
      uniform vec2 reflectionTexel;
      uniform mat4 reflectionMatrix;
      uniform float reflectionEnabled;
      varying vec3 vWorldPosition;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      // Value noise and its analytic gradient: irregular wavelets without tiled normal maps.
      vec3 noiseGradient(vec2 p){
        vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f),du=6.0*f*(1.0-f);
        float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
        float crossTerm=a-b-c+d;
        return vec3(a+(b-a)*u.x+(c-a)*u.y+crossTerm*u.x*u.y,
          du*vec2(b-a+crossTerm*u.y,c-a+crossTerm*u.x));
      }
      ${waves}
      void main(){
        vec2 p=vWorldPosition.xz;
        // Derivatives must be evaluated before any neighbouring hull fragment is discarded.
        float footprint=max(length(dFdx(p)),length(dFdy(p)));
        vec3 local=(hullInverse*vec4(vWorldPosition,1.0)).xyz;
        if(local.x>0.015&&local.x<14.87&&abs(local.z)<1.91&&local.y<1.4){
          vec3 bottom,top;hullSection(local.x,bottom,top);
          if(local.y>=bottom.x&&local.y<=top.y){
            float width=local.y<bottom.z?mix(bottom.y,top.x,clamp((local.y-bottom.x)/max(0.001,bottom.z-bottom.x),0.0,1.0)):
              mix(top.x,top.z,clamp((local.y-bottom.z)/max(0.001,top.y-bottom.z),0.0,1.0));
            if(abs(local.z)<width-0.015)discard;
          }
        }
        float height; vec2 deriv;
        sea(p,height,deriv);
        float dist=length(cameraPosition-vWorldPosition);
        float detail=1.0-smoothstep(70.0,360.0,dist);
        vec2 wind=windVelocity/max(length(windVelocity),0.001);
        vec2 across=vec2(-wind.y,wind.x);
        vec2 flow=vec2(dot(p,wind),dot(p,across));
        vec2 drift=vec2(time*0.72,time*0.12);
        vec2 warp=vec2(noise(flow*0.17-drift*0.13),noise(flow*0.21+17.0-drift*0.09));
        vec2 ripples=flow+(warp-0.5)*2.4;
        float patches=mix(0.55,1.15,noise(flow*0.065-drift*0.035));
        float windStrength=clamp(0.28+seaStrength*0.78,0.35,1.85);
        // Projected pixel size filters the fine bands before they alias at grazing angles.
        float fine=detail*(1.0-smoothstep(0.10,0.45,footprint));
        float micro=(1.0-smoothstep(18.0,80.0,dist))*(1.0-smoothstep(0.025,0.14,footprint));
        vec2 rippleSlope=noiseGradient(ripples*vec2(1.1,2.3)-drift).yz*vec2(1.1,2.3)*0.052*fine;
        rippleSlope+=noiseGradient(ripples*vec2(2.7,4.1)+drift*1.27+8.3).yz*vec2(2.7,4.1)*0.014*fine;
        rippleSlope+=noiseGradient(ripples*vec2(7.3,10.7)-drift*2.1).yz*vec2(7.3,10.7)*0.0028*micro;
        deriv+=(wind*rippleSlope.x+across*rippleSlope.y)*patches*windStrength;
        vec3 N=normalize(vec3(-deriv.x,1.0,-deriv.y));
        vec3 V=normalize(cameraPosition-vWorldPosition);
        vec3 R=reflect(-V,N);
        float ndv=max(dot(N,V),0.0);
        float fresnel=0.0204+0.9796*pow(1.0-ndv,5.0);
        // Read the real seabed, fading the local map into deep water at its boundary.
        vec2 depthUV=(p-seabedOrigin)/seabedSpan;
        vec2 edge=min(depthUV,1.0-depthUV);
        float depthCoverage=seabedReady*smoothstep(0.0,0.065,min(edge.x,edge.y));
        vec2 packed=texture2D(seabedMap,(clamp(depthUV,0.0,1.0)*127.0+0.5)/128.0).rg;
        float bottom=-24.0+dot(packed,vec2(65280.0,255.0))/65535.0*32.0;
        float waterDepth=mix(24.0,max(0.0,vWorldPosition.y-bottom),depthCoverage);
        vec3 deep=seaColor*(0.82+0.18*noise(p*0.045));
        float crest=smoothstep(-0.10,0.24,height/max(seaStrength,0.1));
        // Soft light scattered through crests; rock-green shallows lose red first with depth.
        deep+=vec3(0.002,0.012,0.010)*crest*(0.4+0.6*max(dot(sunDirection,-V),0.0));
        vec3 transmission=exp(-vec3(0.54,0.25,0.19)*waterDepth/max(ndv,0.28));
        vec3 bottomColor=vec3(0.13,0.17,0.105)*(0.86+0.14*noise(p*0.34));
        vec3 body=deep*(1.0-transmission)+bottomColor*transmission;
        vec3 reflectedColor=skyRadiance(R);
        // Optional linear-color planar pass; the analytic sea remains the fallback.
        if(reflectionEnabled>0.5){
          vec3 reflectedPoint=vec3(p.x,-0.015,p.y)+vec3(N.x,0.0,N.z)*mix(0.8,2.8,1.0-ndv);
          vec4 projected=reflectionMatrix*vec4(reflectedPoint,1.0);
          if(projected.w>0.0){
            vec2 uv=projected.xy/projected.w;
            if(uv.x>0.0&&uv.x<1.0&&uv.y>0.0&&uv.y<1.0){
              // A small roughness footprint softens trees and boat reflections without extra scene passes.
              vec2 blur=reflectionTexel*(0.75+1.8*windStrength)*vec2(1.0,0.65);
              vec3 reflected=texture2D(reflectionMap,uv).rgb*0.40;
              reflected+=texture2D(reflectionMap,uv+vec2(blur.x,0.0)).rgb*0.15;
              reflected+=texture2D(reflectionMap,uv-vec2(blur.x,0.0)).rgb*0.15;
              reflected+=texture2D(reflectionMap,uv+vec2(0.0,blur.y)).rgb*0.15;
              reflected+=texture2D(reflectionMap,uv-vec2(0.0,blur.y)).rgb*0.15;
              float border=smoothstep(0.0,0.018,uv.x)*smoothstep(0.0,0.018,uv.y)
                          *smoothstep(0.0,0.018,1.0-uv.x)*smoothstep(0.0,0.018,1.0-uv.y);
              reflectedColor=mix(reflectedColor,reflected,border);
            }
          }
        }
        vec3 color=mix(body*mix(0.025,1.0,daylight),reflectedColor,fresnel);
        vec3 H=normalize(V+sunDirection);
        float ndh=max(dot(N,H),0.0),ndl=max(dot(N,sunDirection),0.0);
        // GGX sun glint: broad shoulders and a bright, narrow core.
        float roughness=clamp(0.14+windStrength*0.035+(1.0-fine)*0.065,0.14,0.28);
        float a2=pow(roughness,4.0);
        float denom=ndh*ndh*(a2-1.0)+1.0;
        float D=a2/(3.14159265*denom*denom);
        float k=pow(roughness+1.0,2.0)/8.0;
        float Gv=ndv/(ndv*(1.0-k)+k);
        float Gl=ndl/(ndl*(1.0-k)+k);
        float F=0.0204+0.9796*pow(1.0-max(dot(V,H),0.0),5.0);
        vec3 sunColor=mix(vec3(1.0,0.57,0.30),vec3(1.0,0.94,0.82),smoothstep(0.02,0.45,sunDirection.y));
        color+=sunColor*min(4.0,D*Gv*Gl*F/max(4.0*ndv,0.001))*1.7*daylight*(1.0-cloudCover);
        // Sparse broken crests in rough weather, and a soft wash along the actual shallows.
        float foamNoise=noise(p*0.72-wind*time*0.32)*0.65+noise(p*2.1+time*0.16)*0.35;
        float whitecaps=smoothstep(1.15,2.65,seaStrength)*smoothstep(0.15,0.26,height/max(seaStrength,0.1));
        whitecaps*=smoothstep(0.52,0.76,foamNoise);
        float shore=(1.0-smoothstep(0.15,1.15,waterDepth))*smoothstep(-0.12,0.12,-bottom)*depthCoverage;
        float wash=0.5+0.5*sin(waterDepth*7.0-time*1.7+noise(p*0.7)*4.0);
        float foam=clamp(whitecaps*0.60+shore*smoothstep(0.36,0.73,foamNoise)*wash*0.42,0.0,0.65);
        color=mix(color,vec3(0.66,0.76,0.72)*mix(0.035,1.0,daylight),foam);
        // A soft horizon also keeps the infinite plane free from a hard edge.
        float fog=1.0-exp(-dist*dist*fogDensity*fogDensity);
        color=mix(color,skyHorizon,fog);
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }
    `
  });
  const geometry=new THREE.PlaneGeometry(2,2,256,256);
  geometry.rotateX(-Math.PI/2);
  // Concentrate the same triangle budget near the vessel, where the silhouette matters.
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i);
    positions.setXYZ(i,x*(0.045+0.955*x*x)*1800,0,z*(0.045+0.955*z*z)*1800);
  }
  positions.needsUpdate=true; geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material); mesh.name='water'; mesh.frustumCulled=false;
  mesh.position.y=-0.015; group.add(mesh);

  function sampleHeight(x,z,t){return CB90.Sea.height(x,z,t)+hullWaves.sample(x,z);}
  const wakeSystem=CB90.buildWake(THREE,waves,hullWaves.uniforms,sampleHeight);
  const wake=wakeSystem.wake;group.add(wakeSystem.group);
  let followsHull=false, hullPose=null;
  const hullFrame=new THREE.Matrix4();
  function setBoatTransform(matrix,pose){uniforms.hullInverse.value.copy(matrix).invert();followsHull=true;hullPose=pose||null;}
  const sky=new THREE.Color(0x8daebf);
  function update(a,b,c){
    const t=typeof c==='number'?c:(typeof a==='number'?a:0);
    const state=b||{},nav=state.nav||{};
    const x=Number(nav.x)||0,z=Number(nav.z)||0,heading=Number(nav.heading)||0,speed=Number(nav.speed)||0;
    depthMap.update(x,z);
    hullWaves.update(t,state,hullPose);
    if(state.wind)uniforms.windVelocity.value.set(Number(state.wind.x)||0,Number(state.wind.z)||0);
    if(!followsHull){hullFrame.makeRotationY(heading);hullFrame.setPosition(x,0,z);uniforms.hullInverse.value.copy(hullFrame).invert();}
    uniforms.time.value=t;uniforms.boat.value.set(x,z,heading,speed);
    wakeSystem.update(t,state);
    // Waves remain world anchored as the dense part of the grid follows the vessel.
    mesh.position.x=x;mesh.position.z=z;
  }
  /** Provide a linear-color target and bias * projection * inverse-world matrix.
   *  Render the planar pass with water.group hidden; false restores the analytic sea.
   */
  function setReflection(texture,matrix,enabled){
    uniforms.reflectionMap.value=texture||null;
    if(texture&&texture.image)uniforms.reflectionTexel.value.set(1/(texture.image.width||768),1/(texture.image.height||512));
    if(matrix)uniforms.reflectionMatrix.value.copy(matrix);
    uniforms.reflectionEnabled.value=texture&&matrix&&enabled!==false?1:0;
  }
  function applyScene(scene){scene.background=sky;scene.fog=new THREE.Fog(0x8daebf,450,1600);return scene;}
  function setWorld(world){depthMap.setWorld(world);hullWaves.setWorld(world);}
  function reset(nav,pose){hullWaves.reset(nav,pose);wakeSystem.clear();}
  return {mesh:mesh,group:group,update:update,sky:sky,applyScene:applyScene,setReflection:setReflection,
    sampleHeight:sampleHeight,setBoatTransform:setBoatTransform,setWorld:setWorld,reset:reset,hullWaves:hullWaves,
    parts:{water:mesh,wake:wake,spray:wakeSystem.spray},wakeSystem:wakeSystem,articulations:[]};
};
