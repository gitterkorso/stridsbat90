// Image-based lighting from the same linear sky radiance used by sea and sky.
// Refresh only when the sky changes perceptibly; no network images or HDR files.
window.CB90 = window.CB90 || {};
CB90.createSkyLighting = function (THREE, renderer, scene) {
  'use strict';
  const uniforms = CB90.weatherUniforms(THREE);
  const skyScene = new THREE.Scene();
  const material = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vSkyDirection; void main(){vSkyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec3 vSkyDirection;\n' + CB90.skyGLSL + `
      void main(){
        vec3 direction=normalize(vSkyDirection);
        vec3 radiance=skyRadiance(direction);
        // The lower hemisphere is diffuse sea bounce, not a second bright sky.
        vec3 seaBounce=skyHorizon*vec3(.18,.25,.27);
        radiance=mix(seaBounce,radiance,smoothstep(-.12,.035,direction.y));
        gl_FragColor=vec4(max(radiance,vec3(0.0)),1.0);
        #include <encodings_fragment>
      }`
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(180,32,16), material);
  skyScene.add(sphere);
  const generator = new THREE.PMREMGenerator(renderer);
  const previousSun = new THREE.Vector3(99,99,99), previousHorizon = new THREE.Color();
  let target = null, lastUpdate = -Infinity, previousCloud = -1, previousDay = -1, updates = 0;
  function update(force) {
    const now = performance.now();
    const horizon = uniforms.skyHorizon.value;
    const colorDelta = Math.abs(horizon.r-previousHorizon.r)+Math.abs(horizon.g-previousHorizon.g)+Math.abs(horizon.b-previousHorizon.b);
    const changed = previousSun.distanceToSquared(uniforms.sunDirection.value)>.0012 || colorDelta>.035 ||
      Math.abs(previousCloud-uniforms.cloudCover.value)>.045 || Math.abs(previousDay-uniforms.daylight.value)>.025;
    if(!force && target && (!changed || now-lastUpdate<750)) return;
    // PMREM's render targets are linear HDR. Tone mapping happens once in the
    // final view, preserving warm sunlight and dark night-time reflections.
    const next = generator.fromScene(skyScene,0,.1,300);
    scene.environment=next.texture;
    if(target) target.dispose();
    target=next; lastUpdate=now; updates++;
    previousSun.copy(uniforms.sunDirection.value); previousHorizon.copy(horizon);
    previousCloud=uniforms.cloudCover.value; previousDay=uniforms.daylight.value;
  }
  function dispose() {
    if(scene.environment===target?.texture) scene.environment=null;
    if(target) target.dispose();
    sphere.geometry.dispose(); material.dispose(); generator.dispose();
  }
  return {update,dispose,get updates(){return updates;}};
};
