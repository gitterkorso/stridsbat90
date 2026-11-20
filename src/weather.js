window.CB90=window.CB90||{};
CB90.WEATHER={clear:{name:'Klart',cloud:.12,fog:.00055,rain:0,waves:.65,wind:4},cloudy:{name:'Mulet',cloud:.88,fog:.0011,rain:0,waves:1.2,wind:7},fog:{name:'Dimma',cloud:.7,fog:.009,rain:0,waves:.45,wind:1.2},rain:{name:'Regn',cloud:.96,fog:.0028,rain:.55,waves:1.7,wind:9},storm:{name:'Oväder',cloud:1,fog:.004,rain:1,waves:2.8,wind:15}};
CB90.weatherUniforms=function(THREE){return CB90._weatherUniforms||(CB90._weatherUniforms={
 daylight:{value:1},cloudCover:{value:.12},atmosTime:{value:0},fogDensity:{value:.00055},
 sunDirection:{value:new THREE.Vector3(-.42,.68,.59).normalize()},
 skyHorizon:{value:new THREE.Color(.44,.60,.69)},skyZenith:{value:new THREE.Color(.065,.22,.42)}
});};
CB90.skyGLSL=`uniform float daylight,cloudCover,atmosTime;uniform vec3 sunDirection,skyHorizon,skyZenith;
 float skyHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float skyNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(skyHash(i),skyHash(i+vec2(1,0)),f.x),mix(skyHash(i+vec2(0,1)),skyHash(i+vec2(1,1)),f.x),f.y);}
 float cloudField(vec2 p){
   // Rotated octaves avoid square-looking cloud banks at low sun angles.
   mat2 spin=mat2(.80,-.60,.60,.80);
   float n=skyNoise(p)*.53;p=spin*p*2.07+13.7;
   n+=skyNoise(p)*.28;p=spin*p*2.03+7.1;
   return n+skyNoise(p)*.13+skyNoise(spin*p*2.01)*.06;
 }
 vec3 skyRadiance(vec3 d){
 float h=max(d.y,0.0),sun=max(dot(d,sunDirection),0.0);
 float lowSun=1.0-smoothstep(.06,.50,sunDirection.y);
 vec3 color=mix(skyHorizon,skyZenith,pow(h,.48));
 vec3 sunTint=mix(vec3(1.0,.92,.76),vec3(1.0,.48,.20),lowSun);
 // Broad aerosol scattering is strongest towards the sun, without a white horizon stripe.
 color+=sunTint*pow(sun,9.0)*daylight*(1.0-cloudCover)*(.075+lowSun*.18);
 color+=sunTint*pow(sun,2400.0)*daylight*(1.0-cloudCover)*4.2;
 vec2 cp=d.xz/max(.035,h)*1.35+vec2(atmosTime*.006,atmosTime*.0017);
 float n=cloudField(cp);
 float threshold=mix(.64,.22,cloudCover);
 float density=smoothstep(threshold,threshold+.22,n);
 float clouds=density*smoothstep(.035,.18,h);
 // Density and the sun-facing density difference make rounded, softly lit cloud volumes.
 float lit=skyNoise(cp+sunDirection.xz*.42)*.65+skyNoise(cp*2.07+sunDirection.xz*.65+13.7)*.35;
 float edge=clamp((n-lit)*2.8+.46,0.0,1.0);
 vec3 cloudShade=mix(vec3(.24,.31,.38),vec3(.14,.18,.23),cloudCover);
 vec3 cloudLight=mix(vec3(.86,.90,.91),vec3(1.0,.58,.31),lowSun*.67);
 vec3 cloudColor=mix(cloudShade,cloudLight,edge*(1.0-cloudCover*.56));
 cloudColor+=sunTint*pow(sun,24.0)*(1.0-density)*.32*(1.0-cloudCover);
 cloudColor=mix(vec3(.009,.014,.024),cloudColor,daylight);
 color=mix(color,cloudColor,clouds);
 // High, thin ice clouds give clear skies scale; they fade as the low cloud layer closes.
 float cirrus=pow(skyNoise(cp*vec2(.45,3.8)+vec2(19.0,atmosTime*.002)),3.0);
 color=mix(color,mix(vec3(.018,.024,.036),vec3(.65,.72,.78),daylight),cirrus*.12*(1.0-cloudCover)*smoothstep(.12,.50,h));
 float stars=pow(skyHash(floor(d.xz/max(.15,h)*480.0)),150.0)*smoothstep(.18,.45,h);
 color+=vec3(.6,.7,.9)*stars*(1.0-daylight)*(1.0-cloudCover)*.7;
 vec3 moonDir=normalize(vec3(.35,.55,-.76));float moon=smoothstep(.99965,.99983,dot(d,moonDir));
 color+=vec3(.45,.53,.65)*moon*(1.0-daylight)*(1.0-cloudCover);
 return color;
 }`;
CB90.createWeather=function(THREE,state,scene,camera,sun,hemi,fill){
 const u=CB90.weatherUniforms(THREE),current={...CB90.WEATHER.clear};
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 Object.assign(state,{hour:13,dayCycle:true,dayMinutes:12,weather:'clear'});
 // World-space air velocity in m/s, shared with the ensign. Preset speeds are
 // scene settings; direction is fixed in the world as the boat turns.
 state.wind={x:-current.wind*.953582665,z:-current.wind*.301131368};
 let snap=true;
 const geometry=new THREE.BufferGeometry(),vertices=[],seeds=[];
 for(let i=0;i<1800;i++){const a=(i*.61803398875)%1,b=(i*.754877666)%1,c=(i*.56984029)%1;for(let end=0;end<2;end++){vertices.push((a-.5)*70,c*32,(b-.5)*70);seeds.push(end);}}
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('end',new THREE.Float32BufferAttribute(seeds,1));
 const ru={...u,rainAmount:{value:0},eye:{value:new THREE.Vector3()},inside:{value:0}};
 const rain=new THREE.LineSegments(geometry,new THREE.ShaderMaterial({uniforms:ru,transparent:true,depthWrite:false,
 vertexShader:`uniform float atmosTime,rainAmount,inside;uniform vec3 eye;attribute float end;varying float alpha;
 void main(){vec3 p=position;p.y=mod(p.y-atmosTime*19.0,32.0)-10.0;p.x+=p.y*.16;
 float distance=length(p.xz);alpha=rainAmount*(1.0-smoothstep(22.0,35.0,distance));
 if(inside>.5)alpha*=smoothstep(5.0,8.0,distance);
 p+=eye;p.y+=end*.8;p.x+=end*.12;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);}`,
 fragmentShader:`uniform float daylight;varying float alpha;void main(){gl_FragColor=vec4(vec3(.42,.52,.60)*mix(.12,1.0,daylight),alpha*.35);
 #include <tonemapping_fragment>
 #include <encodings_fragment>
 }`}));rain.frustumCulled=false;rain.name='Wind-driven rain';scene.add(rain);
 scene.fog=new THREE.FogExp2(0x91acbb,.00055);
 function setWeather(name){if(CB90.WEATHER[name]){state.weather=name;snap=state.paused;}}
 function update(dt,t){
 const step=state.paused?0:dt;
 if(state.dayCycle)state.hour=(state.hour+step*24/(state.dayMinutes*60))%24;
 const target=CB90.WEATHER[state.weather]||CB90.WEATHER.clear,f=snap?1:1-Math.exp(-step*.7);snap=false;
 for(const key of ['cloud','fog','rain','waves','wind'])current[key]+=(target[key]-current[key])*f;
 state.wind.x=-current.wind*.953582665;state.wind.z=-current.wind*.301131368;
 const angle=(state.hour-6)/24*Math.PI*2,elevation=Math.sin(angle);
 u.sunDirection.value.set(-Math.cos(angle),elevation,.4).normalize();
 const day=smooth(-.12,.22,elevation),twilight=(1-smooth(.02,.30,Math.abs(elevation)))*(1-current.cloud*.7);
 u.daylight.value=day;u.cloudCover.value=current.cloud;u.atmosTime.value=t;u.fogDensity.value=current.fog;
 u.skyHorizon.value.setRGB(.006+day*(.40-current.cloud*.13)+twilight*.30,.010+day*(.57-current.cloud*.23)+twilight*.062,.021+day*(.68-current.cloud*.26));
 u.skyZenith.value.setRGB(.002+day*(.050+current.cloud*.10),.005+day*(.18-current.cloud*.015),.014+day*(.36-current.cloud*.10));
 const warm=(1-smooth(.08,.65,elevation))*(1-current.cloud*.62);
 sun.intensity=1.58*day*(1-current.cloud*.85);sun.color.setRGB(1,1-warm*.22,1-warm*.43);
 hemi.intensity=.045+day*(.58-current.cloud*.15);fill.intensity=.015+day*.15;
 hemi.color.copy(u.skyHorizon.value).lerp(u.skyZenith.value,.24);hemi.groundColor.setRGB(.23+day*.10,.25+day*.07,.23+day*.04);
 scene.fog.color.copy(u.skyHorizon.value);scene.fog.density=current.fog;
 scene.background.copy(u.skyHorizon.value);CB90.Sea.strength.value=current.waves;
 ru.rainAmount.value=current.rain;ru.eye.value.copy(camera.position);ru.inside.value=state.mode==='exterior'?0:1;rain.visible=current.rain>.005;
 }
 function positionLights(){const n=state.nav||{x:0,z:0};sun.position.copy(u.sunDirection.value).multiplyScalar(90).add(new THREE.Vector3(n.x,0,n.z));sun.target.position.set(n.x+7,0,n.z);sun.target.updateMatrixWorld();ru.eye.value.copy(camera.position);}
 return {update,positionLights,setWeather,uniforms:u,rain,current};
};
