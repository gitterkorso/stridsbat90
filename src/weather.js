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
 vec3 skyRadiance(vec3 d){
 float h=max(d.y,0.0);vec3 color=mix(skyHorizon,skyZenith,pow(h,.44));
 float sun=max(dot(d,sunDirection),0.0);
 color+=vec3(1.0,.60,.25)*pow(sun,12.0)*daylight*(1.0-cloudCover)*.20;
 color+=vec3(1.0,.85,.6)*pow(sun,2200.0)*daylight*(1.0-cloudCover)*3.0;
 vec2 cp=d.xz/max(.16,h)*1.7+vec2(atmosTime*.008,0.0);
 float n=skyNoise(cp)*.57+skyNoise(cp*2.03)*.28+skyNoise(cp*4.1)*.15;
 float clouds=smoothstep(.75-cloudCover*.65,.94-cloudCover*.65,n)*smoothstep(.0,.15,h);
 vec3 cloudColor=mix(vec3(.012,.018,.027),mix(vec3(.70,.73,.74),vec3(.20,.24,.28),cloudCover),daylight);
 color=mix(color,cloudColor,clouds);
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
 u.skyHorizon.value.setRGB(.006+day*(.44-current.cloud*.15)+twilight*.25,.010+day*(.60-current.cloud*.25)+twilight*.055,.021+day*(.69-current.cloud*.28));
 u.skyZenith.value.setRGB(.002+day*(.065+current.cloud*.09),.005+day*(.22-current.cloud*.04),.014+day*(.42-current.cloud*.15));
 sun.intensity=1.45*day*(1-current.cloud*.85);sun.color.setRGB(1,1-twilight*.35,1-twilight*.65);
 hemi.intensity=.045+day*(.70-current.cloud*.24);fill.intensity=.015+day*.18;
 scene.fog.color.copy(u.skyHorizon.value);scene.fog.density=current.fog;
 scene.background.copy(u.skyHorizon.value);CB90.Sea.strength.value=current.waves;
 ru.rainAmount.value=current.rain;ru.eye.value.copy(camera.position);ru.inside.value=state.mode==='exterior'?0:1;rain.visible=current.rain>.005;
 }
 function positionLights(){const n=state.nav||{x:0,z:0};sun.position.copy(u.sunDirection.value).multiplyScalar(90).add(new THREE.Vector3(n.x,0,n.z));sun.target.position.set(n.x+7,0,n.z);sun.target.updateMatrixWorld();ru.eye.value.copy(camera.position);}
 return {update,positionLights,setWeather,uniforms:u,rain,current};
};
