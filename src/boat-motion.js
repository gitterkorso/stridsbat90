// Damped heave, pitch and roll driven by the rendered sea, not independent oscillations.
// The trim/lift curve is an artistic approximation of a planing hull, not measured CB90 sea-trial data.
window.CB90=window.CB90||{};
CB90.createBoatMotion=function(sampleHeight){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=Math.PI/180,PIVOT=6;
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const pose={heave:0,pitch:0,roll:0,trim:0,acceleration:0,pivotX:PIVOT};
  const velocity={heave:0,pitch:0,roll:0};
  let lastSpeed=0,lastNav=null;
  function targets(nav,t,acceleration){
    const c=Math.cos(nav.heading),s=Math.sin(nav.heading);let height=0,pitchMoment=0,rollMoment=0;
    // Eight waterline samples reject tiny ripples the 15 m hull cannot follow rigidly.
    for(const x of [1.5,4.5,7.5,10.5])for(const z of [-1.25,1.25]){
      const h=sampleHeight(nav.x+x*c+z*s,nav.z-x*s+z*c,t);
      height+=h;pitchMoment+=(x-PIVOT)*h;rollMoment+=z*h;
    }
    const speed=Math.max(0,nav.speed),planing=smooth(5,15,speed);
    // Bow-up hump during transition, then a lower running trim and increased hull lift.
    const trim=(2.6*smooth(1,7,speed)+2.4*Math.exp(-Math.pow((speed-8)/4,2))*smooth(0,3,speed))*rad;
    const ground=nav.collision?0:1;
    const accelerationTrim=clamp(acceleration*.019,-2*rad,2.8*rad)*smooth(0,2,speed);
    const bank=clamp(-Math.atan((nav.yawRate||0)*nav.speed/9.81)*.65,-9*rad,9*rad);
    return {heave:height/8*(ground?1:.15)+.30*planing*ground,
      pitch:clamp(Math.atan(pitchMoment/90)+trim+accelerationTrim,-5*rad,9*rad)*ground,
      roll:clamp(-Math.atan(rollMoment/12.5)+bank,-12*rad,12*rad)*ground,trim:trim*ground};
  }
  function reset(nav,t){const target=targets(nav,t,0);for(const key of ['heave','pitch','roll']){pose[key]=target[key];velocity[key]=0;}pose.trim=target.trim;pose.acceleration=0;lastSpeed=nav.speed;lastNav={x:nav.x,z:nav.z};return pose;}
  function update(dt,t,state){
    const nav=state.nav;
    if(!lastNav)return reset(nav,t);
    if(state.paused||dt<=0)return pose;
    if(Math.hypot(nav.x-lastNav.x,nav.z-lastNav.z)>Math.max(30,Math.abs(nav.speed)*dt+10))return reset(nav,t);
    const acceleration=nav.collision?0:clamp((nav.speed-lastSpeed)/dt,-4,3);
    const count=Math.max(1,Math.ceil(Math.min(dt,.1)*120)),h=Math.min(dt,.1)/count;
    for(let i=0;i<count;i++){
      pose.acceleration+=(acceleration-pose.acceleration)*(1-Math.exp(-h*4));
      const target=targets(nav,t-(count-1-i)*h,pose.acceleration);pose.trim=target.trim;
      for(const key of ['heave','pitch','roll']){
        const frequency=key==='heave'?4.8:key==='pitch'?3.8:3.2,damping=key==='roll'?.85:.9;
        velocity[key]+=(frequency*frequency*(target[key]-pose[key])-2*damping*frequency*velocity[key])*h;
        pose[key]+=velocity[key]*h;
      }
    }
    lastSpeed=nav.speed;lastNav.x=nav.x;lastNav.z=nav.z;return pose;
  }
  // Rotate about the hull's buoyancy centre while preserving navigation's transom-based coordinates.
  function apply(boat,nav){
    boat.rotation.set(pose.roll,nav.heading,pose.pitch,'YZX');
    const cp=Math.cos(pose.pitch),sp=Math.sin(pose.pitch),c=Math.cos(nav.heading),s=Math.sin(nav.heading);
    boat.position.set(nav.x+PIVOT*c*(1-cp),pose.heave-PIVOT*sp,nav.z-PIVOT*s*(1-cp));
    return pose;
  }
  return {pose,update,reset,apply};
};
