// One wave spectrum for GPU water/foam and CPU hull buoyancy. Metres, seconds.
window.CB90=window.CB90||{};
CB90.Sea=(function(){
  const spectrum=[[1,.38,23,.135,.4],[.8,.62,12.5,.075,2.1],[-.3,1,8.1,.065,4.3],[1,-.62,5.3,.036,1.7]];
  const terms=spectrum.map(([x,z,length,amplitude,phase])=>{
    const k=2*Math.PI/length,d=Math.hypot(x,z);return {kx:x/d*k,kz:z/d*k,omega:Math.sqrt(9.81*k),amplitude,phase};
  });
  const strength={value:1};
  function height(x,z,t){let h=-.015;for(const w of terms){const a=w.kx*x+w.kz*z-w.omega*t+w.phase;h+=w.amplitude*(Math.sin(a)+.16*Math.sin(2*a));}return -.015+(h+.015)*strength.value;}
  const f=n=>Number(n).toFixed(9);
  const glsl=`uniform float seaStrength; void sea(vec2 p,out float height,out vec2 slope){height=0.0;slope=vec2(0.0);float a;vec2 k;\n`+terms.map(w=>
    `k=vec2(${f(w.kx)},${f(w.kz)});a=dot(k,p)-${f(w.omega)}*time+${f(w.phase)};height+=${f(w.amplitude)}*(sin(a)+0.16*sin(2.0*a));slope+=${f(w.amplitude)}*k*(cos(a)+0.32*cos(2.0*a));`).join('\n')+'\nheight*=seaStrength;slope*=seaStrength;}';
  return {height,glsl,strength};
})();
