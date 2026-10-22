// CB90 H: submerged twin jets, aerated surface wash and planing chine spray.
// World-space emission preserves the curved trail. Visual approximation, not CFD.
window.CB90 = window.CB90 || {};
CB90.buildWake = function (THREE, waves, surfaceUniforms, sampleSurface) {
  'use strict';
  const group = new THREE.Group(); group.name = 'Persistent twin-jet wake and spray';
  const uniforms = { ...CB90.weatherUniforms(THREE),seaStrength:CB90.Sea.strength,time:{value:0}, boat:{value:new THREE.Vector3()} };
  Object.assign(uniforms,surfaceUniforms||{});
  const M=CB90.M, STEP=1/30;
  let seed=845, last=null, carry=0, previous=null;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function pool(count,foam){
    const g=foam?new THREE.InstancedBufferGeometry():new THREE.BufferGeometry();
    if(foam){const quad=new THREE.PlaneGeometry(1,1,2,2);g.index=quad.index;g.attributes.position=quad.attributes.position;g.attributes.uv=quad.attributes.uv;g.instanceCount=count;}
    else g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
    const arrays={},attrs={};
    for(const [name,width] of Object.entries({origin:3,velocity:3,birth:1,life:1,diameter:1,energy:1,seed:1})){
      const arr=new Float32Array(count*width); if(name==='birth')arr.fill(-1000);if(name==='life')arr.fill(1);
      arrays[name]=arr;attrs[name]=foam?new THREE.InstancedBufferAttribute(arr,width):new THREE.BufferAttribute(arr,width);
      attrs[name].setUsage(THREE.DynamicDrawUsage);g.setAttribute('a'+name,attrs[name]);
    }
    return {g,arrays,attrs,count,cursor:0,emitted:0};
  }
  const foam=pool(3200,true),drops=pool(4800,true);
  // Surface foam is a world-space density field sampled by the water material.
  // Separate transparent quads intersected the displaced water between their
  // vertices, producing flickering cuts and large rectangular foam fragments.
  const FOAM_SIZE=512,FOAM_CELL=1,FOAM_SPAN=(FOAM_SIZE-1)*FOAM_CELL;
  const foamData=new Uint8Array(FOAM_SIZE*FOAM_SIZE*4);
  const foamTexture=new THREE.DataTexture(foamData,FOAM_SIZE,FOAM_SIZE,THREE.RGBAFormat,THREE.UnsignedByteType);
  foamTexture.minFilter=foamTexture.magFilter=THREE.LinearFilter;
  foamTexture.wrapS=foamTexture.wrapT=THREE.ClampToEdgeWrapping;
  foamTexture.generateMipmaps=false;foamTexture.flipY=false;foamTexture.unpackAlignment=1;
  foamTexture.encoding=THREE.LinearEncoding;foamTexture.needsUpdate=true;
  const foamUniforms={wakeFoamMap:{value:foamTexture},wakeFoamOrigin:{value:new THREE.Vector2()},
    wakeFoamLayout:{value:new THREE.Vector2(FOAM_SIZE,FOAM_SPAN)}};
  const foamGLSL=`uniform sampler2D wakeFoamMap;uniform vec2 wakeFoamOrigin,wakeFoamLayout;
    float wakeFoam(vec2 p){
      vec2 uv=(p-wakeFoamOrigin)/wakeFoamLayout.y;
      vec2 edge=min(uv,1.0-uv);
      float coverage=smoothstep(0.0,0.035,min(edge.x,edge.y));
      vec2 texel=(clamp(uv,0.0,1.0)*(wakeFoamLayout.x-1.0)+0.5)/wakeFoamLayout.x;
      return texture2D(wakeFoamMap,texel).r*coverage;
    }`;
  let foamTick=-Infinity;
  const smooth=(a,b,x)=>{const f=Math.max(0,Math.min(1,(x-a)/(b-a)));return f*f*(3-2*f);};
  function updateFoam(t,nav){
    const tick=Math.floor(t/STEP+1e-6);if(tick===foamTick)return;
    // Integer world cells keep the texture stationary while it follows the boat.
    // Bias the coverage aft to retain the long trail at full planing speed.
    const aft=Math.max(-128,Math.min(128,nav.speed*5.5));
    const ox=Math.floor((nav.x-Math.cos(nav.heading)*aft-FOAM_SPAN/2)/FOAM_CELL)*FOAM_CELL;
    const oz=Math.floor((nav.z+Math.sin(nav.heading)*aft-FOAM_SPAN/2)/FOAM_CELL)*FOAM_CELL;
    foamData.fill(0);
    const a=foam.arrays;
    for(let i=0;i<foam.count;i++){
      const age=t-a.birth[i],f=age/a.life[i];if(age<0||f>=1)continue;
      const energy=a.energy[i],strength=energy*(1-smooth(0.08,1,f))*0.56;
      if(strength<0.003)continue;
      const drift=(1-Math.exp(-age*0.65))/0.65;
      const x=(a.origin[i*3]+a.velocity[i*3]*drift-ox)/FOAM_CELL;
      const z=(a.origin[i*3+2]+a.velocity[i*3+2]*drift-oz)/FOAM_CELL;
      const size=a.diameter[i]+age*(0.32+energy*0.32);
      // Integrate small boils over a texel footprint instead of losing them
      // between texels or snapping a bright point to the nearest grid cell.
      const radius=Math.sqrt(size*size*0.25+FOAM_CELL*FOAM_CELL*0.64)/FOAM_CELL;
      const invRadius=1/(radius*radius);
      const x0=Math.max(0,Math.ceil(x-radius)),x1=Math.min(FOAM_SIZE-1,Math.floor(x+radius));
      const z0=Math.max(0,Math.ceil(z-radius)),z1=Math.min(FOAM_SIZE-1,Math.floor(z+radius));
      for(let j=z0;j<=z1;j++)for(let k=x0;k<=x1;k++){
        const r2=((k-x)*(k-x)+(j-z)*(j-z))*invRadius;if(r2>=1)continue;
        const kernel=(1-r2)*(1-r2),index=(j*FOAM_SIZE+k)*4;
        foamData[index]=Math.round(foamData[index]+(255-foamData[index])*strength*kernel);
      }
    }
    // Publish the completed data and its matching origin in the same update.
    foamUniforms.wakeFoamOrigin.value.set(ox,oz);foamTexture.needsUpdate=true;foamTick=tick;
  }
  const attributes=`uniform float time; attribute vec3 aorigin;attribute vec3 avelocity;
    attribute float abirth,alife,adiameter,aenergy,aseed;varying float vAlpha;varying float vSeed;`;
  // Keep the public wake object and emitter attributes for existing inspectors;
  // its density is now drawn once by the water shader, without a second surface.
  foam.g.setDrawRange(0,0);
  const wake=new THREE.Mesh(foam.g,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  wake.frustumCulled=false;wake.name='Twin jet foam trail density';group.add(wake);
  const sprayMat=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,
    name:'Overlapping turbulent sheets of aerated spray',
    vertexShader:`${attributes} ${waves} varying vec2 vUv;
      void main(){float age=max(0.0,time-abirth),f=age/alife;vUv=uv;
        vec3 p=aorigin+avelocity*age;p.y-=4.905*age*age;
        vec4 mv=viewMatrix*vec4(p,1.0);
        // Camera-facing ribbons follow the projected ballistic flow instead of round point sprites.
        vec2 flow=(viewMatrix*vec4(avelocity-vec3(0.0,9.81*age,0.0),0.0)).xy;
        flow=length(flow)>0.01?normalize(flow):vec2(0.0,1.0);
        vec2 crossFlow=vec2(flow.y,-flow.x);
        float size=adiameter*3.4*(1.0+age*0.55);
        mv.xy+=crossFlow*position.x*size+flow*position.y*size*2.2;
        gl_Position=projectionMatrix*mv;
        float surface;vec2 slope;sea(p.xz,surface,slope);surface-=0.015;
        vAlpha=aenergy*smoothstep(0.0,0.06,age)*(1.0-smoothstep(0.55,1.0,f))*smoothstep(-0.06,0.12,p.y-surface);vSeed=aseed;
        if(f>=1.0||time<abirth||p.y<surface-0.08){vAlpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);}
      }`,
    fragmentShader:`uniform float daylight;varying float vAlpha;varying float vSeed;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 p=vUv*2.0-1.0;
        float coarse=n(vUv*vec2(5.0,3.0)+vSeed*41.0);
        float fine=n(vUv*vec2(26.0,13.0)+vSeed*67.0);
        float edge=1.0-smoothstep(0.18,1.0,length(p)+(coarse-0.5)*0.30);
        float density=0.40+coarse*0.40+fine*0.20;
        float alpha=edge*edge*density*vAlpha*0.34;
        if(alpha<0.003)discard;
        vec3 color=mix(vec3(0.43,0.61,0.61),vec3(0.86,0.92,0.88),density);
        gl_FragColor=vec4(color*mix(.035,1.0,daylight),alpha);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
  const spray=new THREE.Mesh(drops.g,sprayMat);spray.frustumCulled=false;spray.name='Continuous aerated stern spray';spray.renderOrder=3;group.add(spray);
  function emit(pool,t,x,y,z,vx,vy,vz,life,size,energy){
    const i=pool.cursor++%pool.count,a=pool.arrays;
    a.origin.set([x,y,z],i*3);a.velocity.set([vx,vy,vz],i*3);a.birth[i]=t;a.life[i]=life;
    a.diameter[i]=size;a.energy[i]=energy;a.seed[i]=random();pool.emitted++;
  }
  function sample(t,nav,state){
    const speed=nav.speed||0,fast=Math.min(Math.abs(speed)/23.15,1),plane=Math.max(0,(speed-3)/20);
    const co=Math.cos(nav.heading),si=Math.sin(nav.heading);
    function spawn(pool,lx,y,lz,vx,vy,vz,life,size,strength){
      const wx=nav.x+lx*co+lz*si,wz=nav.z-lx*si+lz*co;
      const surface=sampleSurface?sampleSurface(wx,wz,t):(CB90.Sea?CB90.Sea.height(wx,wz,t):0);
      emit(pool,t,wx,y+surface,wz,vx*co+vz*si,vy,-vx*si+vz*co,life,size,strength);
    }
    for(const side of [-1,1]){
      const lever=side<0?state.engineP:state.engineS;
      const power=state.enginesOn===false?0:Math.min(1,Math.abs(Number(lever)||0));
      const reverse=(Number(lever)||0)<-0.015;
      const yaw=(Number(state.helm)||0)*Math.PI/180;
      const jetX=M.JET_STEER_PIVOT_X+(M.JET_NOZZLE_X1-M.JET_STEER_PIVOT_X)*Math.cos(yaw);
      const jetZ=side*M.JET_Z-(M.JET_NOZZLE_X1-M.JET_STEER_PIVOT_X)*Math.sin(yaw);
      if(power>0.015){
        // The nozzles are submerged. Emit the visible surface boil just aft of the outlet,
        // not a high fountain from the deck. Reversing wash escapes forward and outboard.
        const lx=jetX-(reverse?0.2:0.6),lz=reverse?side*1.8:jetZ;
        const vx=reverse?1.8*power:-(1.0+4.5*power)*Math.cos(yaw);
        const vz=reverse?side*(1.5+power):4.5*power*Math.sin(yaw);
        spawn(foam,lx,0,lz,vx,0,vz,3+power*12,0.65+power*0.65,(0.08+power*0.72)*Math.min(1,0.25+Math.abs(speed)/6));
        const count=Math.floor(2+power*22+fast*10);
        for(let j=0;j<count;j++){
          const spread=random()-0.5;
          // Concentrate the upright plume behind the transom, in the twin jet wash.
          const rise=0.9+(0.4+Math.pow(random(),0.7)*0.6)*(power*2.5+(reverse?0:fast*3.0));
          const flight=2*rise/9.81+0.22;
          spawn(drops,lx-random()*0.7,0.06+random()*0.12,lz+spread*0.4,
            (reverse?2:-1)*(2+power*6)+speed*0.18,rise,
            vz+spread*(1.0+power*3),flight,0.08+random()*0.22,0.35+power*0.45);
        }
      }
      // A moving, unpowered hull still leaves a diminishing displacement wake.
      if(fast>0.025){
        spawn(foam,-0.2,0,side*1.6,-Math.sign(speed)*0.5,0,side*(0.55+fast*1.35),
          4+fast*12,0.65+fast*1.4,Math.min(0.85,fast*fast*1.1));
      }
      if(plane>0){
        const lx=7.4+random()*2.5,lz=side*(1.48+random()*0.15);
        spawn(foam,lx,0,side*1.85,-0.6,0,side*(1+plane*2.2),7+plane*5,0.75+plane,plane*0.65);
        for(let j=0;j<Math.ceil(plane*18);j++){
          // Keep the chine spray low and outward; the tall spray belongs aft.
          const rise=0.5+(0.35+Math.pow(random(),1.5)*0.65)*plane*2.0;
          const flight=2*rise/9.81+0.24;
          spawn(drops,lx,0.10,lz,speed*(0.40+random()*0.20),rise,
            side*(0.7+random()*3.0*plane),flight,0.07+random()*0.18,0.25+plane*0.25);
        }
      }
    }
  }
  function clear(){
    for(const p of [foam,drops]){p.arrays.birth.fill(-1000);p.cursor=0;p.attrs.birth.needsUpdate=true;}
    foamData.fill(0);foamTexture.needsUpdate=true;foamTick=-Infinity;carry=0;
  }
  function update(t,state){
    const n=state.nav||{},nav={x:Number(n.x)||0,z:Number(n.z)||0,heading:Number(n.heading)||0,speed:Number(n.speed)||0};
    uniforms.time.value=t;uniforms.boat.value.set(nav.x,nav.z,nav.heading);
    if(last===null){last=t;previous=nav;updateFoam(t,nav);return;}
    const dt=t-last;
    if(dt<0||Math.hypot(nav.x-previous.x,nav.z-previous.z)>Math.max(30,Math.abs(nav.speed)*dt+10)){clear();last=t;previous=nav;return;}
    if(dt>0){
      carry+=Math.min(dt,0.1);
      const turn=Math.atan2(Math.sin(nav.heading-previous.heading),Math.cos(nav.heading-previous.heading));
      while(carry>=STEP){carry-=STEP;const f=Math.max(0,1-carry/dt);
        sample(t-carry,{x:previous.x+(nav.x-previous.x)*f,z:previous.z+(nav.z-previous.z)*f,heading:previous.heading+turn*f,speed:nav.speed},state);}
      for(const p of [foam,drops])for(const attr of Object.values(p.attrs))attr.needsUpdate=true;
      updateFoam(t,nav);
    }
    last=t;previous=nav;
  }
  return {group,wake,spray,update,clear,foamUniforms,foamGLSL,
    stats:()=>({foamEmitted:foam.emitted,sprayEmitted:drops.emitted,capacity:foam.count+drops.count})};
};
