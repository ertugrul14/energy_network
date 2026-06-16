/**
 * Holographic Three.js globe for the tablet landing page.
 * Wireframe icosphere + scan-line shimmer + fresnel rim,
 * city hotspots with CSS labels, datacenter pulses, animated great-circle arcs,
 * orbit rings, starfield, cursor magnetism tilt.
 *
 * Ported from hero-globe.jsx (React) to vanilla ES module.
 */

import * as THREE from 'three';

const ACCENT = '#5ABEF0';

const HERO_CITIES = [
  { id: 'barcelona', name: 'Barcelona',   lat:  41.39, lon:    2.16 },
  { id: 'riyadh',    name: 'Riyadh',      lat:  24.71, lon:   46.68 },
  { id: 'singapore', name: 'Singapore',   lat:   1.35, lon:  103.82 },
  { id: 'nairobi',   name: 'Nairobi',     lat:  -1.29, lon:   36.82 },
  { id: 'lagos',     name: 'Lagos',       lat:   6.52, lon:    3.38 },
  { id: 'saopaulo',  name: 'São Paulo',   lat: -23.55, lon:  -46.63 },
  { id: 'mexico',    name: 'Mexico City', lat:  19.43, lon:  -99.13 },
  { id: 'newyork',   name: 'New York',    lat:  40.71, lon:  -74.01 },
  { id: 'london',    name: 'London',      lat:  51.51, lon:   -0.13 },
  { id: 'reykjavik', name: 'Reykjavík',   lat:  64.13, lon:  -21.94 },
  { id: 'mumbai',    name: 'Mumbai',      lat:  19.08, lon:   72.88 },
  { id: 'tokyo',     name: 'Tokyo',       lat:  35.68, lon:  139.65 },
  { id: 'sydney',    name: 'Sydney',      lat: -33.87, lon:  151.21 },
  { id: 'capetown',  name: 'Cape Town',   lat: -33.92, lon:   18.42 },
  { id: 'istanbul',  name: 'Istanbul',    lat:  41.01, lon:   28.98 },
  { id: 'jakarta',   name: 'Jakarta',     lat:  -6.21, lon:  106.85 },
];

const HERO_DATACENTERS = [
  { id: 'amsterdam', name: 'Amsterdam', lat: 52.37, lon:   4.90 },
  { id: 'finland',   name: 'Helsinki',  lat: 60.17, lon:  24.94 },
  { id: 'singdc',    name: 'Jurong',    lat:  1.33, lon: 103.71 },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.11, lon:   8.68 },
  { id: 'ireland',   name: 'Dublin',    lat: 53.35, lon:  -6.26 },
];

const HERO_ROUTES = [
  { from: 'barcelona', to: 'frankfurt' },
  { from: 'riyadh',    to: 'singdc'    },
  { from: 'singapore', to: 'singdc'    },
  { from: 'nairobi',   to: 'amsterdam' },
  { from: 'lagos',     to: 'amsterdam' },
  { from: 'saopaulo',  to: 'frankfurt' },
  { from: 'mexico',    to: 'ireland'   },
  { from: 'newyork',   to: 'ireland'   },
  { from: 'london',    to: 'ireland'   },
  { from: 'reykjavik', to: 'finland'   },
  { from: 'mumbai',    to: 'singdc'    },
  { from: 'tokyo',     to: 'singdc'    },
  { from: 'sydney',    to: 'singdc'    },
  { from: 'capetown',  to: 'frankfurt' },
  { from: 'istanbul',  to: 'frankfurt' },
  { from: 'jakarta',   to: 'singdc'    },
];

function latLonToVec3(lat, lon, r = 1) {
  const phi   = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function arcPoints(a, b, segments = 72, lift = 0.32) {
  const out = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(a, b, t).normalize();
    const h = 1 + Math.sin(t * Math.PI) * lift;
    p.multiplyScalar(h);
    out.push(p);
  }
  return out;
}

function makeHaloTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grad.addColorStop(0,    'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.10)');
  grad.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

function makeRadialTexture() {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grad.addColorStop(0,    'rgba(255,255,255,0.9)');
  grad.addColorStop(0.3,  'rgba(255,255,255,0.35)');
  grad.addColorStop(0.7,  'rgba(255,255,255,0.06)');
  grad.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

/**
 * Mount holographic globe into `container` (a DOM element).
 * `overlay` is a sibling div for CSS city labels.
 * Returns a destroy() function.
 */
export function initHeroGlobe(container, overlay) {
  if (!container) return () => {};

  const W0 = container.clientWidth  || 800;
  const H0 = container.clientHeight || 600;
  let W = W0, H = H0;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const accentCol = new THREE.Color(ACCENT);

  // ─── group hierarchy ──────────────────────────────────────
  const root      = new THREE.Group(); scene.add(root);
  const tiltGroup = new THREE.Group(); root.add(tiltGroup);
  const globe     = new THREE.Group(); tiltGroup.add(globe);
  globe.rotation.y = -1.2;

  // ─── starfield ────────────────────────────────────────────
  {
    const N = 1400;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      const r     = 18 + Math.random() * 14;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.cos(phi);
      pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta) - 8;
      const c = 0.55 + Math.random() * 0.45;
      col[i*3] = c; col[i*3+1] = c; col[i*3+2] = c;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.04, sizeAttenuation: true, transparent: true,
      opacity: 0.55, vertexColors: true, depthWrite: false,
    })));
  }

  // ─── solid inner sphere ───────────────────────────────────
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.985, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0.92 }),
  ));

  // ─── orbit rings ──────────────────────────────────────────
  const orbitRingGroup = new THREE.Group();
  tiltGroup.add(orbitRingGroup);
  orbitRingGroup.rotation.x = Math.PI * 0.46;
  orbitRingGroup.rotation.z = 0.12;

  [1.32, 1.46, 1.62].forEach((r, i) => {
    const pts = [];
    for (let k = 0; k <= 256; k++) {
      const a = (k / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    orbitRingGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: accentCol, transparent: true, opacity: 0.10 - i * 0.025 }),
    ));
  });

  const orbitMarkers = [];
  [1.32, 1.46, 1.62].forEach((r, i) => {
    const count = [3, 2, 4][i];
    for (let k = 0; k < count; k++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 10, 10),
        new THREE.MeshBasicMaterial({ color: accentCol, transparent: true, opacity: 0.55 }),
      );
      orbitRingGroup.add(dot);
      orbitMarkers.push({
        mesh: dot, r, angle: (k / count) * Math.PI * 2,
        speed: (i % 2 === 0 ? 1 : -1) * (0.12 + i * 0.05),
      });
    }
  });

  // ─── wireframe icosphere ──────────────────────────────────
  globe.add(new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.0, 5)),
    new THREE.LineBasicMaterial({ color: accentCol, transparent: true, opacity: 0.18 }),
  ));
  globe.add(new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.002, 6)),
    new THREE.LineBasicMaterial({ color: accentCol, transparent: true, opacity: 0.06 }),
  ));

  // ─── latitude rings ───────────────────────────────────────
  const latMat = new THREE.LineBasicMaterial({ color: accentCol, transparent: true, opacity: 0.12 });
  [-60, -30, 0, 30, 60].forEach((latDeg) => {
    const phi = ((90 - latDeg) * Math.PI) / 180;
    const r   = Math.sin(phi);
    const y   = Math.cos(phi);
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const t = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * r * 1.003, y * 1.003, Math.sin(t) * r * 1.003));
    }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), latMat.clone());
    ring.material.opacity = latDeg === 0 ? 0.22 : 0.10;
    globe.add(ring);
  });

  // ─── scan-line shell shader ───────────────────────────────
  const scanUniforms = {
    uTime:  { value: 0 },
    uColor: { value: accentCol.clone() },
  };
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.012, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: scanUniforms,
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      vertexShader: `
        varying vec3 vObjN;
        varying vec3 vViewN;
        void main() {
          vObjN  = normal;
          vViewN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vObjN;
        varying vec3 vViewN;
        uniform float uTime;
        uniform vec3  uColor;
        void main() {
          float y       = vObjN.y;
          float bandY   = sin(uTime * 0.28) * 0.92;
          float band    = exp(-pow((y - bandY) * 9.0, 2.0));
          float facing  = max(0.0, vViewN.z);
          float fres    = pow(1.0 - facing, 1.6) * 0.20;
          float a       = band * 0.45 * facing + fres;
          gl_FragColor  = vec4(uColor, a);
        }
      `,
    }),
  ));

  // ─── atmosphere ───────────────────────────────────────────
  const fresnelVert = `
    varying vec3 vViewN;
    void main() {
      vViewN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  tiltGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: accentCol.clone() } },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: fresnelVert,
      fragmentShader: `
        varying vec3 vViewN;
        uniform vec3 uColor;
        void main() {
          float rim = pow(1.0 - max(0.0, vViewN.z), 2.8);
          gl_FragColor = vec4(uColor, rim * 0.38);
        }
      `,
    }),
  ));
  tiltGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 64, 48),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: accentCol.clone() } },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: fresnelVert,
      fragmentShader: `
        varying vec3 vViewN;
        uniform vec3 uColor;
        void main() {
          float rim = pow(1.0 - max(0.0, vViewN.z), 1.4);
          gl_FragColor = vec4(uColor, rim * 0.12);
        }
      `,
    }),
  ));

  // ─── city hotspots ────────────────────────────────────────
  const hotspotMeshes = [];
  const haloSprites   = [];
  const haloTex       = makeHaloTexture();

  HERO_CITIES.forEach((c) => {
    const pos = latLonToVec3(c.lat, c.lon, 1.012);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 16, 16),
      new THREE.MeshBasicMaterial({ color: accentCol }),
    );
    dot.position.copy(pos);
    globe.add(dot);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.position.copy(pos);
    hit.userData = { kind: 'city', data: c };
    globe.add(hit);
    hotspotMeshes.push(hit);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, color: accentCol, transparent: true,
      opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.position.copy(pos);
    halo.scale.set(0.12, 0.12, 1);
    halo.userData = { baseScale: 0.12, kind: 'cityHalo', cityId: c.id };
    globe.add(halo);
    haloSprites.push(halo);
  });

  // ─── datacenter pulses ────────────────────────────────────
  const dcRings = [];
  HERO_DATACENTERS.forEach((d) => {
    const pos = latLonToVec3(d.lat, d.lon, 1.005);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
    );
    dot.position.copy(pos);
    globe.add(dot);

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.018, 0.022, 48),
        new THREE.MeshBasicMaterial({
          color: accentCol, transparent: true, opacity: 0.0,
          side: THREE.DoubleSide, depthWrite: false,
        }),
      );
      ring.position.copy(pos);
      ring.lookAt(pos.clone().multiplyScalar(2));
      ring.userData = { phase: i / 3 };
      globe.add(ring);
      dcRings.push(ring);
    }
  });

  // ─── great-circle arcs ────────────────────────────────────
  const arcs = [];
  HERO_ROUTES.forEach((r) => {
    const fromCity = HERO_CITIES.find(c => c.id === r.from);
    const toDc     = HERO_DATACENTERS.find(d => d.id === r.to);
    if (!fromCity || !toDc) return;

    const a = latLonToVec3(fromCity.lat, fromCity.lon, 1.0);
    const b = latLonToVec3(toDc.lat, toDc.lon, 1.0);
    const points = arcPoints(a, b, 80, 0.28);

    const positions = new Float32Array(points.length * 3);
    const tAttr     = new Float32Array(points.length);
    points.forEach((p, i) => {
      positions[i*3]   = p.x;
      positions[i*3+1] = p.y;
      positions[i*3+2] = p.z;
      tAttr[i] = i / (points.length - 1);
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aT',       new THREE.BufferAttribute(tAttr, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: accentCol.clone() },
        uSeed:  { value: Math.random() },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aT;
        varying float vT;
        void main() {
          vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vT;
        uniform float uTime;
        uniform vec3  uColor;
        uniform float uSeed;
        void main() {
          float speed = 0.45;
          float head  = mod(uTime * speed + uSeed, 1.4) - 0.2;
          float tail  = 0.28;
          float d     = head - vT;
          float pulse = exp(-pow(d / tail, 2.0)) * smoothstep(-0.02, 0.08, d);
          float base  = 0.10;
          float a     = clamp(base + pulse * 0.95, 0.0, 1.0);
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
    globe.add(new THREE.Line(geom, mat));
    arcs.push(mat);
  });

  // ─── CSS city labels ──────────────────────────────────────
  const labelEls = HERO_CITIES.map((c) => {
    const el = document.createElement('div');
    el.className = 'hg-label';
    el.innerHTML = `
      <span class="hg-label-tick"></span>
      <span class="hg-label-name">${c.name.toUpperCase()}</span>
      <span class="hg-label-coord">${c.lat.toFixed(2)}° · ${c.lon.toFixed(2)}°</span>
    `;
    el.dataset.cityId = c.id;
    overlay.appendChild(el);
    return { el, city: c };
  });

  // ─── pointer / tilt ───────────────────────────────────────
  const targetTilt = { x: 0, y: 0 };
  let hoveredId = null;

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top)  / rect.height;
    const ndcX =  px * 2 - 1;
    const ndcY = -(py * 2 - 1);
    targetTilt.y = ndcX * 0.45;
    targetTilt.x = -ndcY * 0.30;
  }
  function onPointerLeave() {
    targetTilt.x = 0;
    targetTilt.y = 0;
  }
  renderer.domElement.addEventListener('pointermove',  onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  // ─── animation loop ───────────────────────────────────────
  let lastTime = performance.now();
  let t = 0;
  let raf = 0;
  let alive = true;

  function tick(timestamp) {
    if (!alive) return;
    const now = timestamp || performance.now();
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.016; // guard against long stutters
    lastTime = now;
    t += dt;

    globe.rotation.y += dt * 0.20;

    tiltGroup.rotation.x += (targetTilt.x - tiltGroup.rotation.x) * 0.06;
    tiltGroup.rotation.y += (targetTilt.y - tiltGroup.rotation.y) * 0.06;

    orbitMarkers.forEach((om) => {
      const a = om.angle + t * om.speed;
      om.mesh.position.set(Math.cos(a) * om.r, 0, Math.sin(a) * om.r);
    });

    scanUniforms.uTime.value = t;
    arcs.forEach((m) => { m.uniforms.uTime.value = t; });

    dcRings.forEach((ring) => {
      const phase = (t * 0.55 + ring.userData.phase) % 1;
      const scale = 1 + phase * 5;
      ring.scale.set(scale, scale, scale);
      ring.material.opacity = (1 - phase) * 0.5;
    });

    haloSprites.forEach((h) => {
      const cur = h.scale.x + (h.userData.baseScale - h.scale.x) * 0.12;
      h.scale.set(cur, cur, 1);
      h.material.opacity = 0.7 + Math.sin(t * 1.4 + h.position.x * 3) * 0.12;
    });

    // project city labels
    labelEls.forEach(({ el, city }) => {
      const mesh = hotspotMeshes.find(m => m.userData.data.id === city.id);
      if (!mesh) return;
      const wp = new THREE.Vector3();
      mesh.getWorldPosition(wp);
      const camDir = new THREE.Vector3().subVectors(camera.position, wp).normalize();
      const nrm    = wp.clone().normalize();
      const facing = nrm.dot(camDir);
      const visible = facing > 0.05;
      const proj   = wp.clone().project(camera);
      const x = (proj.x * 0.5 + 0.5) * W;
      const y = (-proj.y * 0.5 + 0.5) * H;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.opacity = visible ? 0.9 : 0;
    });

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // ─── resize ───────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    W = container.clientWidth;
    H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
  ro.observe(container);

  // ─── cleanup ──────────────────────────────────────────────
  return function destroy() {
    alive = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    renderer.domElement.removeEventListener('pointermove',  onPointerMove);
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
    labelEls.forEach(({ el }) => el.remove());
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
