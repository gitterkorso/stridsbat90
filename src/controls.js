// Stridsbåt 90 – camera controls (SPEC §9). Plain script; requires THREE (r128 UMD), constants.js, util.js.
// Uses THREE.OrbitControls when the examples/js/controls/OrbitControls.js UMD is loaded, otherwise a minimal
// built-in orbit (drag = orbit, wheel / pinch = dolly, shift|ctrl|meta|right-drag / two-finger drag = pan).
//
// CB90.createControls(THREE, camera, domElement) ->
//   { update(dt), setView(name, animateSeconds), views, autoRotate(bool), controls, isAnimating(), fallback, dispose() }
//
// Views (camera position -> orbit target), hull frame (Y up, +X bow, +Z starboard):
//   overview (22,7,13)->(7.5,0.8,0) · bow (24,3.5,6)->(14,1,0) · stern (-8,2.5,5)->(0,0.5,0)
//   top (7.5,26,0.01)->(7.5,0,0) · wheelhouse (14.5,4.5,5.5)->(10,2.4,0) · jets (-4.5,0.8,3)->(-0.5,-0.3,0)
// setView tweens target linearly and the camera offset in spherical coordinates (shortest azimuth), eased with
// U.ease, so the camera swings AROUND the boat instead of cutting through it. Any user input cancels the tween.
window.CB90 = window.CB90 || {};
(function () {
  const VIEWS = {
    overview:   { position: [21.3, 6.2, 15.2],      target: [7.5, 0.8, 0] },
    bow:        { position: [21, 3.2, 5.5],   target: [13.6, 1.2, 0] },
    stern:      { position: [-7.5, 2.4, 4.6], target: [0.5, 0.5, 0] },
    top:        { position: [7.5, 28, 0.01],  target: [7.5, 0.6, 0] },
    wheelhouse: { position: [15.2, 4.2, 4.8], target: [10.0, 2.3, 0] },
    jets:       { position: [-4.5, 0.8, 3],   target: [-0.5, -0.3, 0] },
  };
  CB90.VIEWS = VIEWS;

  const TWO_PI = Math.PI * 2;

  /**
   * Minimal OrbitControls stand-in (same public surface as the subset we use: target, enableDamping, dampingFactor,
   * min/maxDistance, min/maxPolarAngle, autoRotate, autoRotateSpeed, enabled, update(dt), dispose(), 'start'/'end'/'change' events).
   * Pointer events: 1 pointer = orbit (or pan with shift/ctrl/meta or a non-left button), 2 pointers = pinch dolly + pan.
   */
  function makeMiniOrbit(THREE, camera, domElement) {
    const U = CB90.util;
    class MiniOrbit extends THREE.EventDispatcher {
      constructor(object, dom) {
        super();
        const scope = this;
        this.isMiniOrbit = true;
        this.object = object;
        this.domElement = dom || null;
        this.target = new THREE.Vector3();
        this.enabled = true;
        this.enableDamping = false; this.dampingFactor = 0.05;
        this.minDistance = 0; this.maxDistance = Infinity;
        this.minPolarAngle = 0; this.maxPolarAngle = Math.PI;
        this.autoRotate = false; this.autoRotateSpeed = 2.0; // 2.0 = 30 s per orbit (same as OrbitControls)
        this.enableRotate = true; this.enableZoom = true; this.enablePan = true;
        this.rotateSpeed = 1.0; this.zoomSpeed = 1.0; this.panSpeed = 1.0;
        this.screenSpacePanning = true;

        const spherical = new THREE.Spherical();
        const delta = { theta: 0, phi: 0 };
        const panOffset = new THREE.Vector3(), offset = new THREE.Vector3(), v = new THREE.Vector3();
        const lastPos = new THREE.Vector3(), lastQuat = new THREE.Quaternion();
        let scale = 1;
        const pointers = new Map(); // pointerId -> {x, y}
        let mode = 'none';          // 'none' | 'rotate' | 'pan' | 'pinch'
        let pinchDist = 0, pinchMidX = 0, pinchMidY = 0;
        const doc = dom && dom.ownerDocument ? dom.ownerDocument : (typeof document !== 'undefined' ? document : null);

        const height = () => (dom && dom.clientHeight) || 800;
        const rotateLeft = (a) => { delta.theta -= a; };
        const rotateUp = (a) => { delta.phi -= a; };
        function pan(dx, dy) { // screen-space pan, same maths as OrbitControls (perspective camera)
          const cam = scope.object;
          cam.updateMatrix();
          offset.copy(cam.position).sub(scope.target);
          const fov = cam.isPerspectiveCamera ? cam.fov : 45;
          const dist = offset.length() * Math.tan(U.deg(fov / 2)) * scope.panSpeed;
          v.setFromMatrixColumn(cam.matrix, 0).multiplyScalar(-2 * dx * dist / height()); panOffset.add(v);
          v.setFromMatrixColumn(cam.matrix, 1).multiplyScalar(2 * dy * dist / height()); panOffset.add(v);
        }
        function pinchState() {
          const it = pointers.values(); const a = it.next().value, b = it.next().value;
          return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        }

        function onPointerDown(e) {
          if (!scope.enabled) return;
          pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.size === 1) {
            const wantPan = e.button === 1 || e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey;
            mode = wantPan ? (scope.enablePan ? 'pan' : 'none') : (scope.enableRotate ? 'rotate' : 'none');
            if (doc) {
              doc.addEventListener('pointermove', onPointerMove);
              doc.addEventListener('pointerup', onPointerUp);
              doc.addEventListener('pointercancel', onPointerUp);
            }
            scope.dispatchEvent({ type: 'start' });
          } else if (pointers.size === 2) {
            mode = 'pinch';
            const s = pinchState(); pinchDist = s.d; pinchMidX = s.mx; pinchMidY = s.my;
          }
          if (e.pointerType === 'mouse' && e.cancelable) e.preventDefault();
        }
        function onPointerMove(e) {
          if (!scope.enabled) return;
          const p = pointers.get(e.pointerId); if (!p) return;
          if (mode === 'pinch' && pointers.size >= 2) {
            p.x = e.clientX; p.y = e.clientY;
            const s = pinchState();
            if (scope.enableZoom && pinchDist > 0 && s.d > 0) scale *= Math.pow(pinchDist / s.d, scope.zoomSpeed); // fingers apart = dolly in
            if (scope.enablePan) pan((s.mx - pinchMidX) * scope.panSpeed, (s.my - pinchMidY) * scope.panSpeed);
            pinchDist = s.d; pinchMidX = s.mx; pinchMidY = s.my;
            return;
          }
          const dx = e.clientX - p.x, dy = e.clientY - p.y;
          p.x = e.clientX; p.y = e.clientY;
          if (mode === 'rotate') {
            rotateLeft(TWO_PI * dx * scope.rotateSpeed / height()); // yes, height (as OrbitControls)
            rotateUp(TWO_PI * dy * scope.rotateSpeed / height());
          } else if (mode === 'pan') {
            pan(dx * scope.panSpeed, dy * scope.panSpeed);
          }
        }
        function onPointerUp(e) {
          pointers.delete(e.pointerId);
          if (pointers.size === 0) {
            mode = 'none';
            if (doc) {
              doc.removeEventListener('pointermove', onPointerMove);
              doc.removeEventListener('pointerup', onPointerUp);
              doc.removeEventListener('pointercancel', onPointerUp);
            }
            scope.dispatchEvent({ type: 'end' });
          } else if (pointers.size === 1) {
            mode = scope.enableRotate ? 'rotate' : 'none'; // the remaining finger keeps orbiting
          }
        }
        function onWheel(e) {
          if (!scope.enabled || !scope.enableZoom || mode === 'pan' || mode === 'pinch') return;
          if (e.cancelable) e.preventDefault();
          const s = Math.pow(0.95, scope.zoomSpeed);
          if (e.deltaY < 0) scale *= s; else if (e.deltaY > 0) scale /= s;
          scope.dispatchEvent({ type: 'start' });
          scope.dispatchEvent({ type: 'end' });
        }
        function onContextMenu(e) { if (scope.enabled) e.preventDefault(); }

        if (dom) {
          dom.addEventListener('pointerdown', onPointerDown);
          dom.addEventListener('wheel', onWheel, { passive: false });
          dom.addEventListener('contextmenu', onContextMenu);
          if (dom.style) dom.style.touchAction = 'none';
        }

        /** update(dt seconds; default 1/60). Returns true when the camera moved. */
        this.update = function (dt) {
          dt = typeof dt === 'number' && dt > 0 ? Math.min(dt, 0.1) : 1 / 60;
          const cam = scope.object;
          offset.copy(cam.position).sub(scope.target);
          spherical.setFromVector3(offset);
          if (scope.autoRotate && mode === 'none') rotateLeft(TWO_PI / 60 * scope.autoRotateSpeed * dt);
          const f = scope.enableDamping ? 1 - Math.pow(1 - scope.dampingFactor, dt * 60) : 1; // frame-rate independent damping
          spherical.theta += delta.theta * f;
          spherical.phi += delta.phi * f;
          spherical.phi = U.clamp(spherical.phi, scope.minPolarAngle, scope.maxPolarAngle);
          spherical.makeSafe();
          spherical.radius = U.clamp(spherical.radius * scale, scope.minDistance, scope.maxDistance);
          scope.target.addScaledVector(panOffset, f);
          offset.setFromSpherical(spherical);
          cam.position.copy(scope.target).add(offset);
          cam.lookAt(scope.target);
          delta.theta *= 1 - f; delta.phi *= 1 - f; panOffset.multiplyScalar(1 - f);
          scale = 1;
          if (lastPos.distanceToSquared(cam.position) > 1e-12 || 8 * (1 - lastQuat.dot(cam.quaternion)) > 1e-12) {
            scope.dispatchEvent({ type: 'change' });
            lastPos.copy(cam.position); lastQuat.copy(cam.quaternion);
            return true;
          }
          return false;
        };
        this.dispose = function () {
          if (dom) {
            dom.removeEventListener('pointerdown', onPointerDown);
            dom.removeEventListener('wheel', onWheel);
            dom.removeEventListener('contextmenu', onContextMenu);
          }
          if (doc) {
            doc.removeEventListener('pointermove', onPointerMove);
            doc.removeEventListener('pointerup', onPointerUp);
            doc.removeEventListener('pointercancel', onPointerUp);
          }
          pointers.clear();
        };
      }
    }
    return new MiniOrbit(camera, domElement);
  }

  CB90.createControls = function (THREE, camera, domElement) {
    const U = CB90.util;
    const hasOrbit = typeof THREE.OrbitControls === 'function';
    const controls = hasOrbit ? new THREE.OrbitControls(camera, domElement) : makeMiniOrbit(THREE, camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = 0.49 * Math.PI + 0.08; // a little below the waterline, to see the jets from below
    controls.minPolarAngle = 0;
    controls.minDistance = 2;
    controls.maxDistance = 140;
    controls.screenSpacePanning = true;
    controls.autoRotateSpeed = 1.0; // gentle: ~60 s per orbit at 60 fps
    if (domElement && domElement.style) domElement.style.touchAction = 'none';
    // NOTE: OrbitControls' keyboard panning is deliberately NOT enabled (main.js owns the arrow keys for helm/throttle).

    // ---- view tween ----
    let tween = null, referenceFrame = null;
    const sphA = new THREE.Spherical(), sphB = new THREE.Spherical();
    const tgtA = new THREE.Vector3(), tgtB = new THREE.Vector3(), posB = new THREE.Vector3(), off = new THREE.Vector3();

    function cancelTween() { tween = null; }
    controls.addEventListener('start', cancelTween);

    /** setView(name, animateSeconds) – 0 / undefined = instant. Returns false for an unknown view name. */
    function setView(name, seconds) {
      const view = VIEWS[name];
      if (!view) { console.warn('CB90.createControls: unknown view "' + name + '"'); return false; }
      posB.fromArray(view.position); tgtB.fromArray(view.target);
      if (referenceFrame) { referenceFrame.updateMatrixWorld(true); referenceFrame.localToWorld(posB); referenceFrame.localToWorld(tgtB); }
      seconds = typeof seconds === 'number' && seconds > 0 ? seconds : 0;
      if (seconds === 0) {
        tween = null;
        controls.target.copy(tgtB);
        camera.position.copy(posB);
        camera.lookAt(tgtB);
        controls.update();
        return true;
      }
      tgtA.copy(controls.target);
      sphA.setFromVector3(off.subVectors(camera.position, tgtA)); sphA.makeSafe();
      sphB.setFromVector3(off.subVectors(posB, tgtB)); sphB.makeSafe();
      let dTheta = sphB.theta - sphA.theta;
      while (dTheta > Math.PI) dTheta -= TWO_PI;
      while (dTheta < -Math.PI) dTheta += TWO_PI;
      tween = { t: 0, dur: seconds, dTheta: dTheta, name: name };
      return true;
    }

    function stepTween(dt) {
      tween.t += dt;
      const done = tween.t >= tween.dur;
      const k = done ? 1 : U.ease(tween.t / tween.dur);
      const theta = sphA.theta + tween.dTheta * k;
      const phi = U.lerp(sphA.phi, sphB.phi, k);
      const radius = U.lerp(sphA.radius, sphB.radius, k);
      controls.target.lerpVectors(tgtA, tgtB, k);
      if (done) {
        camera.position.copy(posB); // land exactly on the view
      } else {
        off.setFromSphericalCoords(radius, phi, theta);
        camera.position.copy(controls.target).add(off);
      }
      camera.lookAt(controls.target);
      if (done) tween = null;
    }

    /** update(dt seconds) – call every frame. */
    function update(dt) {
      dt = typeof dt === 'number' && dt > 0 ? Math.min(dt, 0.1) : 1 / 60;
      if (tween) {
        controls.update(dt);   // lets leftover drag momentum / auto-rotate decay while the tween owns the pose
        stepTween(dt);
        return true;
      }
      return controls.update(dt);
    }

    function autoRotate(on) { controls.autoRotate = !!on; return controls.autoRotate; }

    function dispose() {
      controls.removeEventListener('start', cancelTween);
      if (controls.dispose) controls.dispose();
    }

    return {
      update: update,
      setFrame: (frame) => { referenceFrame = frame; },
      cancelTween: cancelTween,
      setView: setView,
      views: VIEWS,
      autoRotate: autoRotate,
      controls: controls,
      camera: camera,
      isAnimating: () => tween !== null,
      fallback: !hasOrbit,
      dispose: dispose,
    };
  };
})();
