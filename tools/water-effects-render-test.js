// Render the production water shaders in reproducible scenarios, including the
// tight turn from the reported recording and a real procedural granite coast.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const output = path.resolve(process.env.WATER_QA_OUTPUT || 'shots/water-fix-2026-10-22');
fs.mkdirSync(output, {recursive: true});

(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 800}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const scripts = ['vendor/three.min', 'constants', 'util', 'hull', 'superstructure',
      'equipment', 'waterjet', 'archipelago', 'sea-state', 'weather', 'wake',
      'water-depth', 'hull-waves', 'hull-wave-surface', 'water', 'environment'];
    await page.setContent('<body style="margin:0">' + scripts.map(file => '<script>' +
      fs.readFileSync(path.join(__dirname, '../src', file + '.js'), 'utf8') + '</script>').join(''));
    await page.evaluate(() => {
      const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
      renderer.setSize(1280, 800); renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene(); scene.background = new THREE.Color(0x91acbb);
      const boat = new THREE.Group();
      for (const build of ['buildHull', 'buildSuperstructure', 'buildEquipment', 'buildWaterjets']) {
        boat.add(CB90[build](THREE).group);
      }
      scene.add(boat);
      scene.add(new THREE.HemisphereLight(0xe4f3ff, 0x566355, 1.0));
      const sun = new THREE.DirectionalLight(0xfff1db, 1.2);
      sun.position.set(-30, 70, 60); scene.add(sun);
      const camera = new THREE.PerspectiveCamera(50, 1.6, .1, 2500);
      const water = CB90.buildWater(THREE); scene.add(water.group);
      const deep = {start: {x: 0, z: 0}, height: () => -24};
      water.setWorld(deep);
      const pose = {heave: 0, pitch: 0, roll: 0, pivotX: 6};
      const q = window.waterQA = {renderer, scene, boat, camera, water, deep, pose};
      q.frame = (time, nav, power = 0) => {
        boat.position.set(nav.x, 0, nav.z); boat.rotation.y = nav.heading;
        boat.updateMatrixWorld(true);
        water.setBoatTransform(boat.visible ? boat.matrixWorld :
          new THREE.Matrix4().makeTranslation(nav.x + 10000, 0, nav.z), pose);
        water.update(time, {nav, engineP: power, engineS: power, enginesOn: power !== 0,
          wind: {x: -9.53, z: -3.01}});
      };
      q.draw = (eye, target) => {
        camera.position.set(...eye); camera.lookAt(...target);
        scene.updateMatrixWorld(true); renderer.render(scene, camera);
      };
      q.rms = (x0, x1, z0, z1) => {
        let sum = 0, count = 0;
        for (let z = z0; z <= z1; z += 2) for (let x = x0; x <= x1; x += 2) {
          sum += water.hullWaves.sample(x, z) ** 2; count++;
        }
        return Math.sqrt(sum / count);
      };
    });
    const capture = async name => {
      if (errors.length) throw Error('Rendering ' + name + ': ' + errors.map(error => error.slice(0,450)).join('\n'));
      await page.locator('canvas').screenshot({path: path.join(output, name + '.png')});
      console.log('Rendered ' + name);
    };

    await page.evaluate(() => {
      const q = waterQA; CB90.Sea.strength.value = .65;
      q.water.reset({x: 0, z: 0, heading: 0, speed: 21}, q.pose);
      for (let i = 0; i <= 180; i++) q.frame(i / 30, {x: 21 * i / 30, z: 0, heading: 0, speed: 21}, 1);
      q.draw([103, 16, 30], [125, 0, 0]);
    });
    await capture('hull-foam');

    await page.evaluate(() => {
      const q = waterQA; q.water.reset({x: 0, z: 0, heading: 0, speed: 21}, q.pose);
      for (let i = 0; i <= 420; i++) {
        const t = i / 30, a = t * 21 / 90;
        q.frame(t, {x: 90 * Math.sin(a), z: 90 * (1 - Math.cos(a)), heading: -a, speed: 21}, 1);
      }
      q.draw([-90, 135, 235], [30, 0, 100]);
    });
    await capture('turning-wake');

    const waveArrival = await page.evaluate(() => {
      const q = waterQA; CB90.Sea.strength.value = .20;
      q.water.reset({x: 0, z: 0, heading: 0, speed: 10}, q.pose);
      for (let i = 0; i <= 240; i++) q.frame(i / 30, {x: i / 3, z: 0, heading: 0, speed: 10}, .5);
      q.draw([36, 72, 110], [36, 0, 0]);
      return {before: q.rms(10, 75, 32, 48), distantBefore: q.rms(10, 75, 105, 120)};
    });
    await capture('stopped-wake-0s');
    waveArrival.after = await page.evaluate(() => {
      const q = waterQA;
      for (let i = 241; i <= 480; i++) q.frame(i / 30, {x: 80, z: 0, heading: 0, speed: 0});
      q.draw([36, 72, 110], [36, 0, 0]);
      return q.rms(10, 75, 32, 48);
    });
    await capture('stopped-wake-8s');
    waveArrival.distantAfter = await page.evaluate(() => {
      const q = waterQA;
      for (let i = 481; i <= 840; i++) q.frame(i / 30, {x: 80, z: 0, heading: 0, speed: 0});
      q.draw([36, 135, 190], [36, 0, 43]);
      return q.rms(10, 75, 105, 120);
    });
    await capture('stopped-wake-20s');
    waveArrival.minute = await page.evaluate(() => {
      const q = waterQA, before = q.water.hullWaves.field.farField.stats().energy;
      for (let i = 841; i <= 2040; i++) q.frame(i / 30, {x: 80, z: 0, heading: 0, speed: 0});
      q.draw([36, 190, 390], [36, 0, 95]);
      const remaining = q.water.hullWaves.field.farField.stats();
      return {energyAt20s: before, energyAt60s: remaining.energy, peakAt60s: remaining.maxAbsHeight};
    });
    await capture('stopped-wake-60s');

    await page.evaluate(() => {
      const q = waterQA; q.boat.visible = false; CB90.Sea.strength.value = .65;
      q.water.reset({x: 0, z: 0, heading: 0, speed: 0}, q.pose);
      q.frame(19, {x: 0, z: 0, heading: 0, speed: 0});
      q.draw([15, 12, 65], [0, 0, -20]);
    });
    await capture('clear-whitecaps');
    await page.evaluate(() => {
      const q = waterQA; CB90.Sea.strength.value = 2.8;
      q.frame(19, {x: 0, z: 0, heading: 0, speed: 0});
      q.water.mesh.material.uniforms.cloudCover.value = .9;
      q.draw([15, 12, 65], [0, 0, -20]);
    });
    await capture('storm-whitecaps');

    const coast = await page.evaluate(() => {
      const q = waterQA, world = CB90.Archipelago.create(90848);
      let coast = null;
      for (let x = 1500; x <= 4200; x += 8) for (let z = -1500; z <= 1500; z += 8) {
        const h = world.height(x, z);
        if (Math.abs(h) > .3) continue;
        const gx = (world.height(x + 3, z) - world.height(x - 3, z)) / 6;
        const gz = (world.height(x, z + 3) - world.height(x, z - 3)) / 6;
        const slope = Math.hypot(gx, gz);
        if (slope < .15 || (coast && slope <= coast.slope)) continue;
        if (world.height(x + gx / slope * 25, z + gz / slope * 25) < 2) continue;
        coast = {x, z, h, slope, nx: gx / slope, nz: gz / slope};
      }
      if (!coast) throw Error('Could not locate an exposed procedural granite shore');
      q.coast = coast;
      const nav = {x: coast.x - coast.nx * 25, z: coast.z - coast.nz * 25, heading: 0, speed: 0};
      world.start = {x: nav.x, z: nav.z};
      q.env = CB90.buildEnvironment(THREE, world); q.scene.add(q.env.group);
      for (let i = 0; i < 100; i++) q.env.update(.016, {nav}, 20);
      q.water.setWorld(world); q.water.reset(nav, q.pose); q.shoreNav = nav;
      CB90.Sea.strength.value = 2.8;
      q.frame(20, nav);
      q.draw([coast.x - coast.nx * 70 - coast.nz * 25, 19, coast.z - coast.nz * 70 + coast.nx * 25],
        [coast.x + coast.nx * 8, 1, coast.z + coast.nz * 8]);
      return coast;
    });
    await capture('rock-shore-breakers');
    await page.evaluate(() => {
      const q = waterQA;
      for (let i = 1; i <= 48; i++) q.frame(20 + i / 30, q.shoreNav);
      q.env.update(.016, {nav: q.shoreNav}, 21.6);
      q.scene.updateMatrixWorld(true); q.renderer.render(q.scene, q.camera);
    });
    await capture('rock-shore-breakers-next');

    const result = await page.evaluate(() => ({
      programs: waterQA.renderer.info.programs.map(p => ({name: p.name,
        runnable: !p.diagnostics || p.diagnostics.runnable})),
      field: waterQA.water.hullWaves.stats(),
      drawCalls: waterQA.renderer.info.render.calls
    }));
    assert.deepEqual(errors, [], 'Page or WebGL errors');
    assert(result.programs.every(program => program.runnable), 'A production shader failed to compile');
    assert(Number.isFinite(waveArrival.after) && waveArrival.after > .00001,
      'A stopped hull must leave propagating waves outside its track');
    assert(Number.isFinite(waveArrival.distantAfter) &&
      waveArrival.distantAfter > Math.max(.00001, waveArrival.distantBefore * 5),
      'Waves must reach water beyond the fine simulation grid after the hull stops');
    assert(waveArrival.minute.energyAt60s > waveArrival.minute.energyAt20s * .65 &&
      waveArrival.minute.peakAt60s > .025, 'Minute-old swell faded too quickly');
    const report = {status: 'PASS', output, waveArrival, coast, ...result};
    fs.writeFileSync(path.join(output, 'render-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
