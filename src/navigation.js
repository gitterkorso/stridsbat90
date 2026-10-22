// Compact, deterministic handling model. +X forward, +Z starboard, heading is Three.js Y rotation.
// terrain is either the legacy array of ellipse islands {x, z, rx, rz} or an object with height(x, z) in metres
// (negative = water depth, e.g. world.createSampler() from archipelago.js). start {x, z, heading} is optional.
window.CB90 = window.CB90 || {};
CB90.createNavigation = function (state, terrain, start) {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const DRAFT = 0.8, GROUND_Y = -0.95; // draught plus a 0.15 m margin: shallower than this and the hull touches
  // Hull footprint sampled against the heightfield: six centreline stations plus beam points at 90 % of the half-beam.
  const FOOTPRINT = [[0, 0], [2.85, 0], [5.7, 0], [8.55, 0], [11.4, 0], [14.25, 0], [3, 1.647], [3, -1.647], [7.5, 1.71], [7.5, -1.71], [12, 1.44], [12, -1.44]];
  let islands = null, field = null, origin = { x: 0, z: 0, heading: 0 };
  const nav = state.nav = { x: 0, z: 0, heading: 0, speed: 0, yawRate: 0, distance: 0, collision: false, collisionTime: 0, depth: 99, underKeel: 99 - DRAFT };
  const thrust = value => value >= 0 ? value : value * 0.46;
  function setTerrain(newTerrain, newStart) {
    islands = Array.isArray(newTerrain) ? newTerrain : null;
    field = !islands && newTerrain && typeof newTerrain.height === 'function' ? newTerrain : null;
    if (newStart) origin = { x: +newStart.x || 0, z: +newStart.z || 0, heading: +newStart.heading || 0 };
    sound();
  }
  function overlaps(x, z, heading) {
    const c = Math.cos(heading), s = Math.sin(heading);
    if (field) {
      for (let k = 0; k < FOOTPRINT.length; k++) {
        const p = FOOTPRINT[k];
        if (field.height(x + c * p[0] + s * p[1], z - s * p[0] + c * p[1]) > GROUND_Y) return true;
      }
      return false;
    }
    return (islands || []).some(island => {
      for (let k = 0; k <= 5; k++) {
        const along = k * 2.85;
        const dx = (x + c * along - island.x) / (island.rx + 1.9);
        const dz = (z - s * along - island.z) / (island.rz + 1.9);
        if (dx * dx + dz * dz < 1) return true;
      }
      return false;
    });
  }
  /** Water depth under the hull centre (x = 7.5 on the centreline) and the clearance under the keel. */
  function sound() {
    if (!field) { nav.depth = 99; nav.underKeel = 99 - DRAFT; return; }
    const h = field.height(nav.x + Math.cos(nav.heading) * 7.5, nav.z - Math.sin(nav.heading) * 7.5);
    nav.depth = Number.isFinite(h) ? Math.max(0, -h) : 0;
    nav.underKeel = Math.max(0, nav.depth - DRAFT);
  }
  function step(dt) {
    if (state.paused) return;
    // Fixed small substeps keep collision and handling stable even at low frame rates.
    const steps = Math.max(1, Math.ceil(dt / (1 / 60))), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const p = state.enginesOn ? thrust(state.engineP || 0) : 0;
      const s = state.enginesOn ? thrust(state.engineS || 0) : 0;
      const power = (p + s) * 0.5;
      const drag = (nav.speed < 0 ? 0.022 : 0.0044) * nav.speed * Math.abs(nav.speed) + nav.speed * 0.023;
      nav.speed = clamp(nav.speed + (2.38 * power - drag) * h, -7.2, 23.15);
      if (Math.abs(nav.speed) < 0.006 && power === 0) nav.speed = 0;
      const desiredYaw = -(state.helm || 0) / 30 * nav.speed * 0.019 - (p - s) * 0.16;
      nav.yawRate += (desiredYaw - nav.yawRate) * (1 - Math.exp(-h * 1.9));
      const newHeading = nav.heading + nav.yawRate * h;
      const x = nav.x + Math.cos(newHeading) * nav.speed * h;
      const z = nav.z - Math.sin(newHeading) * nav.speed * h;
      if (overlaps(x, z, newHeading)) {
        nav.speed = 0; nav.yawRate *= 0.8; nav.collisionTime = 2.6;
      } else {
        nav.distance += Math.abs(nav.speed) * h;
        nav.x = x; nav.z = z; nav.heading = newHeading;
      }
      nav.collisionTime = Math.max(0, nav.collisionTime - h);
    }
    nav.collision = nav.collisionTime > 0;
    sound();
  }
  function reset() {
    Object.assign(nav, { x: origin.x, z: origin.z, heading: origin.heading, speed: 0, yawRate: 0, distance: 0, collision: false, collisionTime: 0 });
    state.engineP = state.engineS = state.helm = 0;
    sound();
  }
  setTerrain(terrain, start);
  Object.assign(nav, { x: origin.x, z: origin.z, heading: origin.heading }); sound();
  return { step, reset, overlaps, nav, setTerrain };
};

// Walkable centre aisle, portals and deck elevations in the model coordinate frame.
CB90.walkFloorAt = function(x) {
  const M=CB90.M, door=M.WH_DOOR_X;
  if(x<M.ENGINE_X1)return M.ENGINE_FLOOR_Y;
  if(x<door)return M.TROOP_FLOOR_Y;
  return CB90.bowPassageFloorAt(x);
}; // shared floor datums keep the camera on the reconstructed cockpit and landing passage

CB90.canWalkAt = function(current,x,z,hatches){const doorX=CB90.M.WH_DOOR_X;if(x<.9||x>CB90.M.RAMP_HINGE_X-.05)return false;
    const centreSeat=hatches.seat_commander;
    if(centreSeat&&centreSeat.value>.20&&Math.min(current.x,x)<9.32&&Math.max(current.x,x)>8.78) {
      const retreat=(current.x-9.05)*(x-9.05)>=0&&Math.abs(x-9.05)>=Math.abs(current.x-9.05);
      if(!retreat)return false;
    }
    const engineDoor=hatches.door_engine;
    if(engineDoor&&engineDoor.value<.82&&Math.min(current.x,x)<4.15&&Math.max(current.x,x)>3.85){
      const retreat=(current.x-4)*(x-4)>=0&&Math.abs(x-4)>=Math.abs(current.x-4);
      if(!retreat)return false;
    }
    if(x>=CB90.M.WH_X0 && x<doorX-.25)z/=CB90.M.WH_WIDTH_SCALE;
    let half=.34;
    if(x>=8.72&&x<=9.25)half=.34;
    else if(x>9.25&&x<10.35)half=Math.abs(z)<.34?.34:0; // centre aisle between occupied seat positions
    else if(x>=10.35&&x<doorX-.25)half=.39;
    else if(x>=doorX-.25)half=.32;
    if(x<4)half=.30;
    if(Math.abs(z)>half)return false;
    const door=hatches.door_wtFwd;
    if(door&&door.value<.82&&Math.min(current.x,x)<doorX+.11&&Math.max(current.x,x)>doorX-.16){
      const retreat=(current.x-doorX)*(x-doorX)>=0&&Math.abs(x-doorX)>=Math.abs(current.x-doorX);
      if(!retreat)return false;
    }
    return true;
  };
