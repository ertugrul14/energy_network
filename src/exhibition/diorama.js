/**
 * EXHIBITION — Diorama
 * Split-screen view: a 3D render of model_exh.glb on the left, narrative
 * frames on the right. Advancing through the frames drives the model:
 *   Frame 0 (Select city & AI task) → the `tablet` node glows
 *   Frame 1 (Light up the model)     → the `TRANSPARENT` nodes glow from within
 *   Frame 2 (Watch the big screen)   → the TV (screen.html iframe) wakes up
 *
 * The TV is an iframe of /screen.html positioned behind the model. We drive it
 * over the same BroadcastChannel the tablet uses, so the existing screen
 * controller renders a real energy-flow visualization.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { gsap } from 'gsap';
import { i18n } from '../i18n/i18n.js';
import MODEL_URL from '/model_exh.glb?url';

// Same channel the tablet/screen pair use to talk.
const channel = new BroadcastChannel('ghost-network-exhibition');

// A representative scenario to bring the screen to life on the final frame.
const DEMO_SCENARIO = {
  city: 'barcelona',
  workload: 'image',
};

const GLOW = {
  transparent: { color: 0x8fe9ff, intensity: 2.0 },
};

class Diorama {
  constructor() {
    this.stage = document.getElementById('diorama-stage');
    this.canvas = document.getElementById('diorama-canvas');
    this.tvOff = document.getElementById('tv-off');
    this.currentStep = 0;
    this.glowMeshes = { transparent: [] };

    this.initThree();
    this.loadModel();
    this.bindUI();
    this.bindLangSwitcher();
    i18n.applyToDOM();
  }

  // ─── Three.js scene ───────────────────────────────

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, this._aspect(), 0.1, 2000);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true, // transparent clear so the TV shows through behind the model
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Separate CSS3D layer renders DOM (the tablet iframe) in perspective,
    // in sync with the same camera. It sits behind the transparent WebGL
    // canvas; the `tablet` mesh is hidden so the iframe shows through.
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.domElement.className = 'css3d-layer';
    this.stage.appendChild(this.cssRenderer.domElement);

    this._resize();

    // Lighting — soft studio setup so the matte "Plastic" model reads well.
    this.scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x202830, 1.1));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 10, 8);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x88c8ff, 0.6);
    fill.position.set(-8, 4, -6);
    this.scene.add(fill);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    // Pause auto-rotate while the visitor is interacting.
    this.controls.addEventListener('start', () => { this.controls.autoRotate = false; });

    const ro = new ResizeObserver(() => this._resize());
    ro.observe(this.stage);

    const tick = () => {
      requestAnimationFrame(tick);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.cssRenderer.render(this.scene, this.camera);
    };
    tick();
  }

  _aspect() {
    return (this.stage.clientWidth || 1) / (this.stage.clientHeight || 1);
  }

  _resize() {
    const w = this.stage.clientWidth;
    const h = this.stage.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.cssRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  loadModel() {
    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        this.scene.add(model);
        this._frameModel(model);
        this._collectGlowMeshes(model);
        this._mountTabletScreen(model);
        const loading = document.getElementById('stage-loading');
        if (loading) loading.remove();
      },
      undefined,
      (err) => {
        console.error('[Diorama] Failed to load model:', err);
        const loading = document.getElementById('stage-loading');
        if (loading) loading.textContent = 'MODEL FAILED TO LOAD';
      },
    );
  }

  // Center the model at origin and pull the camera back to frame it nicely
  // in the lower-center of the stage (so the TV behind stays visible above).
  _frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    model.position.sub(center); // recenter to origin

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    let dist = (maxDim / 2) / Math.tan(fov / 2);
    dist *= 1.5; // breathing room

    this.camera.position.set(dist * 0.55, dist * 0.5, dist * 0.85);
    // Aim slightly above origin so the model sits low in frame, TV above it.
    this.controls.target.set(0, size.y * 0.12, 0);
    this.controls.minDistance = dist * 0.5;
    this.controls.maxDistance = dist * 2.2;
    this.controls.maxPolarAngle = Math.PI * 0.52; // don't drop below the ground
    this.controls.update();
  }

  // Find meshes belonging to the `tablet` and `TRANSPARENT` nodes and give
  // each its own cloned material so we can light them independently (every
  // mesh in this GLB shares a single "Plastic" material instance).
  _collectGlowMeshes(model) {
    const matches = (obj, needle) => {
      let n = obj;
      while (n) {
        if (n.name && n.name.toLowerCase().includes(needle)) return true;
        n = n.parent;
      }
      return false;
    };

    model.traverse((o) => {
      if (!o.isMesh || !matches(o, 'transparent')) return;
      // Clone so we can light these independently (all meshes share one material).
      o.material = o.material.clone();
      o.material.emissive = new THREE.Color(GLOW.transparent.color);
      o.material.emissiveIntensity = 0;
      o.material.transparent = true;
      o.material.opacity = 0.85;
      this.glowMeshes.transparent.push(o);
    });

    if (!this.glowMeshes.transparent.length) console.warn('[Diorama] no `TRANSPARENT` mesh found');
  }

  // Mount a live tablet.html (deep-linked to the city/AI selection page) onto
  // the `tablet` node's plane via CSS3D, then hide the plain mesh behind it.
  _mountTabletScreen(model) {
    const node = model.getObjectByName('tablet');
    if (!node) { console.warn('[Diorama] no `tablet` node found'); return; }

    const box = new THREE.Box3().setFromObject(node);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Element authored at a fixed pixel size, then scaled to world units so
    // the iframe exactly covers the tablet footprint (X by Z, lying flat).
    const PX = 1024;
    const wrap = document.createElement('div');
    wrap.className = 'tablet3d';
    wrap.style.width = `${PX}px`;
    wrap.style.height = `${Math.round(PX * (size.z / size.x))}px`;

    const iframe = document.createElement('iframe');
    iframe.src = '/tablet.html#select';
    iframe.title = 'Tablet';
    wrap.appendChild(iframe);

    const obj = new CSS3DObject(wrap);
    const scale = size.x / PX;
    obj.scale.setScalar(scale);
    obj.position.set(center.x, box.max.y, center.z);
    obj.rotation.x = -Math.PI / 2; // lay flat, screen facing up
    this.scene.add(obj);

    node.visible = false; // hide the plain mesh; the iframe stands in for it
    this.tabletObject = obj;
  }

  _setGlow(key, on) {
    const target = on ? GLOW[key].intensity : 0;
    this.glowMeshes[key].forEach((mesh) => {
      gsap.to(mesh.material, {
        emissiveIntensity: target,
        duration: 1.1,
        ease: 'power2.out',
      });
    });
  }

  // ─── Narrative frames ─────────────────────────────

  bindUI() {
    document.querySelectorAll('.dframe-next').forEach((btn) => {
      btn.addEventListener('click', () => this.goToStep(Number(btn.dataset.next)));
    });
    this.applyStep(0); // set initial model/TV state for frame 0
  }

  goToStep(step) {
    if (step === this.currentStep) return;

    document.querySelectorAll('.dframe').forEach((f) => {
      f.classList.toggle('active', Number(f.dataset.frame) === step);
    });
    document.querySelectorAll('.dstep-dot').forEach((d) => {
      d.classList.toggle('active', Number(d.dataset.step) <= step);
    });

    this.currentStep = step;
    this.applyStep(step);
  }

  // Drive the model + TV to match the active frame. Written as absolute
  // state (not deltas) so jumping straight to Restart resets cleanly.
  applyStep(step) {
    switch (step) {
      case 0: // Select city & AI task — tablet screen active, buildings dark
        this._setGlow('transparent', false);
        this._wakeScreen(false);
        break;
      case 1: // Light up the model — buildings glow from within
        this._setGlow('transparent', true);
        this._wakeScreen(false);
        break;
      case 2: // Watch the big screen — everything on, screen alive
        this._setGlow('transparent', true);
        this._wakeScreen(true);
        break;
    }
  }

  _wakeScreen(on) {
    this.tvOff.classList.toggle('hidden', on);
    channel.postMessage(
      on
        ? { type: 'trace-energy-flow', ...DEMO_SCENARIO, hour: new Date().getHours() }
        : { type: 'idle' },
    );
  }

  // ─── Language ─────────────────────────────────────

  bindLangSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;
    this._updateLangButtons();
    switcher.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        this._updateLangButtons();
        i18n.applyToDOM();
        channel.postMessage({ type: 'lang-change', lang: btn.dataset.lang });
      });
    });
  }

  _updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === i18n.currentLang);
    });
  }
}

new Diorama();
