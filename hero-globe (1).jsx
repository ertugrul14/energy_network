// hero-globe.jsx — holographic Three.js globe
// Wireframe icosphere shell + horizontal scan-line shimmer + fresnel rim,
// city hotspots, datacenter pulses, animated great-circle arcs, heat regions,
// cursor magnetism tilt, hover readout via onHover callback.

const HERO_CITIES = [
  { id: 'barcelona', name: 'Barcelona',   country: 'ES', lat:  41.39, lon:    2.16, workload: 'AI Chatbot',         intensity: 'LOW'  },
  { id: 'riyadh',    name: 'Riyadh',      country: 'SA', lat:  24.71, lon:   46.68, workload: 'Real-Time Trans.',   intensity: 'MED'  },
  { id: 'singapore', name: 'Singapore',   country: 'SG', lat:   1.35, lon:  103.82, workload: 'PDF Summarizer',     intensity: 'HIGH' },
  { id: 'nairobi',   name: 'Nairobi',     country: 'KE', lat:  -1.29, lon:   36.82, workload: 'Background Remover', intensity: 'LOW'  },
  { id: 'lagos',     name: 'Lagos',       country: 'NG', lat:   6.52, lon:    3.38, workload: 'Image Generator',    intensity: 'HIGH' },
  { id: 'saopaulo',  name: 'São Paulo',   country: 'BR', lat: -23.55, lon:  -46.63, workload: 'Traffic AI',         intensity: 'MED'  },
  { id: 'mexico',    name: 'Mexico City', country: 'MX', lat:  19.43, lon:  -99.13, workload: 'Voice Synthesis',    intensity: 'MED'  },
  { id: 'newyork',   name: 'New York',    country: 'US', lat:  40.71, lon:  -74.01, workload: 'AI Chatbot',         intensity: 'LOW'  },
  { id: 'london',    name: 'London',      country: 'GB', lat:  51.51, lon:   -0.13, workload: 'Code Assistant',     intensity: 'MED'  },
  { id: 'reykjavik', name: 'Reykjavík',   country: 'IS', lat:  64.13, lon:  -21.94, workload: 'Model Training',     intensity: 'HIGH' },
  { id: 'mumbai',    name: 'Mumbai',      country: 'IN', lat:  19.08, lon:   72.88, workload: 'Biometric Auth.',    intensity: 'HIGH' },
  { id: 'tokyo',     name: 'Tokyo',       country: 'JP', lat:  35.68, lon:  139.65, workload: 'AI Chatbot',         intensity: 'LOW'  },
  { id: 'sydney',    name: 'Sydney',      country: 'AU', lat: -33.87, lon:  151.21, workload: 'Background Remover', intensity: 'LOW'  },
  { id: 'capetown',  name: 'Cape Town',   country: 'ZA', lat: -33.92, lon:   18.42, workload: 'Real-Time Trans.',   intensity: 'MED'  },
  { id: 'istanbul',  name: 'Istanbul',    country: 'TR', lat:  41.01, lon:   28.98, workload: 'AI Chatbot',         intensity: 'LOW'  },
  { id: 'jakarta',   name: 'Jakarta',     country: 'ID', lat:  -6.21, lon:  106.85, workload: 'PDF Summarizer',     intensity: 'HIGH' },
];

const HERO_DATACENTERS = [
  { id: 'amsterdam', name: 'Amsterdam',  country: 'NL', lat: 52.37, lon:   4.90, grid: 'WIND + GAS' },
  { id: 'finland',   name: 'Helsinki',   country: 'FI', lat: 60.17, lon:  24.94, grid: 'NUCLEAR + HYDRO' },
  { id: 'singdc',    name: 'Jurong',     country: 'SG', lat:  1.33, lon: 103.71, grid: 'FOSSIL HEAVY' },
  { id: 'frankfurt', name: 'Frankfurt',  country: 'DE', lat: 50.11, lon:   8.68, grid: 'COAL + WIND' },
  { id: 'ireland',   name: 'Dublin',     country: 'IE', lat: 53.35, lon:  -6.26, grid: 'WIND + GAS' },
];

// city → datacenter routing (matches the existing app's logic)
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

// Heat / stress regions (water stress, fossil-heavy grids, etc.)
const HERO_HEAT = [
  { lat:  33.4, lon: -111.9, label: 'PHOENIX · WATER STRESSED', strength: 1.0 },
  { lat:  24.7, lon:   46.7, label: 'ARABIAN · AQUIFER DEPLETION', strength: 0.9 },
  { lat:  39.9, lon:  116.4, label: 'NORTH CHINA · COAL GRID', strength: 0.85 },
  { lat: -23.5, lon:  -46.6, label: 'BRAZIL · MIXED', strength: 0.6 },
  { lat: -34.6, lon:  -58.4, label: 'ARGENTINA · GRID STRESS', strength: 0.55 },
];

function _latLonToVec3(THREE, lat, lon, r = 1) {
  const phi   = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function _arcPoints(THREE, a, b, segments = 72, lift = 0.32) {
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

function HeroGlobe({ accent = '#F4B942', motion = true, onHover }) {
  const mountRef    = React.useRef(null);
  const overlayRef  = React.useRef(null);
  const callbackRef = React.useRef(onHover);
  React.useEffect(() => { callbackRef.current = onHover; }, [onHover]);

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE) {
      console.warn('THREE not loaded');
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;

    const W0 = mount.clientWidth  || 800;
    const H0 = mount.clientHeight || 600;
    let W = W0, H = H0;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const accentCol = new THREE.Color(accent);

    // ─── group hierarchy ────────────────────────────────────────────────
    const root      = new THREE.Group(); scene.add(root);
    const tiltGroup = new THREE.Group(); root.add(tiltGroup);
    const globe     = new THREE.Group(); tiltGroup.add(globe);
    globe.rotation.y = -1.2; // initial yaw so Europe-ish faces camera

    // ─── starfield backdrop ────────────────────────────────────────────
    {
      const N = 1400;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        // distribute in a far shell behind & around the globe
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi   = Math.acos(2 * v - 1);
        const r     = 18 + Math.random() * 14;
        pos[i*3+0] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.cos(phi);
        pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta) - 8;
        const c = 0.55 + Math.random() * 0.45;
        col[i*3+0] = c; col[i*3+1] = c; col[i*3+2] = c;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color',    new THREE.BufferAttribute(col, 3));
      const m = new THREE.PointsMaterial({
        size: 0.04,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        vertexColors: true,
        depthWrite: false,
      });
      scene.add(new THREE.Points(g, m));
    }

    // ─── solid inner sphere (occludes back hemisphere) ─────────────────
    const innerGeom = new THREE.SphereGeometry(0.985, 64, 48);
    const innerMat  = new THREE.MeshBasicMaterial({
      color: 0x05060a,
      transparent: true,
      opacity: 0.92,
    });
    globe.add(new THREE.Mesh(innerGeom, innerMat));

    // ─── outer orbit rings (concentric, slightly tilted) ───────────────
    const orbitRingGroup = new THREE.Group();
    tiltGroup.add(orbitRingGroup);
    orbitRingGroup.rotation.x = Math.PI * 0.46; // near-edge-on
    orbitRingGroup.rotation.z = 0.12;
    [1.32, 1.46, 1.62].forEach((r, i) => {
      const pts = [];
      const seg = 256;
      for (let k = 0; k <= seg; k++) {
        const a = (k / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({
        color: accentCol, transparent: true,
        opacity: 0.10 - i * 0.025,
      });
      orbitRingGroup.add(new THREE.Line(g, m));
    });

    // little marker dots circling each orbit, opposite directions per ring
    const orbitMarkers = [];
    [1.32, 1.46, 1.62].forEach((r, i) => {
      const count = [3, 2, 4][i];
      for (let k = 0; k < count; k++) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 10, 10),
          new THREE.MeshBasicMaterial({
            color: accentCol, transparent: true, opacity: 0.55,
          }),
        );
        orbitRingGroup.add(dot);
        orbitMarkers.push({
          mesh: dot, r, angle: (k / count) * Math.PI * 2,
          speed: (i % 2 === 0 ? 1 : -1) * (0.12 + i * 0.05),
        });
      }
    });

    // ─── wireframe icosphere (hex/triangle tessellation) ───────────────
    const wireGeom = new THREE.IcosahedronGeometry(1.0, 5);
    const wireFrame = new THREE.WireframeGeometry(wireGeom);
    const wireMat = new THREE.LineBasicMaterial({
      color: accentCol,
      transparent: true,
      opacity: 0.18,
    });
    globe.add(new THREE.LineSegments(wireFrame, wireMat));

    // Secondary, denser wireframe for subtle dot-grid feel
    const wireGeom2  = new THREE.IcosahedronGeometry(1.002, 6);
    const wireFrame2 = new THREE.WireframeGeometry(wireGeom2);
    const wireMat2 = new THREE.LineBasicMaterial({
      color: accentCol,
      transparent: true,
      opacity: 0.06,
    });
    globe.add(new THREE.LineSegments(wireFrame2, wireMat2));

    // ─── latitude rings (very faint, sci instrument feel) ──────────────
    const latMat = new THREE.LineBasicMaterial({ color: accentCol, transparent: true, opacity: 0.12 });
    [-60, -30, 0, 30, 60].forEach((latDeg) => {
      const phi = ((90 - latDeg) * Math.PI) / 180;
      const r   = Math.sin(phi);
      const y   = Math.cos(phi);
      const pts = [];
      const seg = 128;
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * r * 1.003, y * 1.003, Math.sin(t) * r * 1.003));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const ring = new THREE.Line(g, latMat.clone());
      ring.material.opacity = (latDeg === 0) ? 0.22 : 0.10;
      globe.add(ring);
    });

    // ─── scan-line shell shader ────────────────────────────────────────
    const scanUniforms = {
      uTime:  { value: 0 },
      uColor: { value: accentCol.clone() },
    };
    const scanMat = new THREE.ShaderMaterial({
      uniforms: scanUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
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
    });
    const scanMesh = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 64), scanMat);
    globe.add(scanMesh);

    // ─── outer fresnel atmosphere (BackSide, two layers for halo) ──────
    const fresMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: accentCol.clone() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vViewN;
        void main() {
          vViewN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vViewN;
        uniform vec3 uColor;
        void main() {
          float rim = pow(1.0 - max(0.0, vViewN.z), 2.8);
          gl_FragColor = vec4(uColor, rim * 0.38);
        }
      `,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 48), fresMat);
    tiltGroup.add(atmo);

    // outer softer halo
    const haloMat = fresMat.clone();
    haloMat.uniforms = { uColor: { value: accentCol.clone() } };
    haloMat.fragmentShader = `
      varying vec3 vViewN;
      uniform vec3 uColor;
      void main() {
        float rim = pow(1.0 - max(0.0, vViewN.z), 1.6);
        gl_FragColor = vec4(uColor, rim * 0.10);
      }
    `;
    haloMat.needsUpdate = true;
    // re-create as fresh ShaderMaterial because we mutated the source
    const haloMatOuter = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: accentCol.clone() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: fresMat.vertexShader,
      fragmentShader: `
        varying vec3 vViewN;
        uniform vec3 uColor;
        void main() {
          float rim = pow(1.0 - max(0.0, vViewN.z), 1.4);
          gl_FragColor = vec4(uColor, rim * 0.12);
        }
      `,
    });
    const atmoOuter = new THREE.Mesh(new THREE.SphereGeometry(1.22, 64, 48), haloMatOuter);
    tiltGroup.add(atmoOuter);

    // ─── city hotspots (small bright spheres + sprite halos) ───────────
    const hotspotMeshes = [];   // invisible hit-proxies (large, used for raycasting)
    const haloSprites   = [];
    const haloTex       = makeHaloTexture(THREE, '#ffffff');

    HERO_CITIES.forEach((c) => {
      const pos = _latLonToVec3(THREE, c.lat, c.lon, 1.012);

      // visible dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshBasicMaterial({ color: accentCol }),
      );
      dot.position.copy(pos);
      globe.add(dot);

      // invisible hit-proxy for raycasting — much bigger so the cursor actually catches it
      // (transparent opacity:0 instead of visible:false, because Mesh.raycast skips invisible objects)
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hit.position.copy(pos);
      hit.userData = { kind: 'city', data: c };
      globe.add(hit);
      hotspotMeshes.push(hit);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          color: accentCol,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.position.copy(pos);
      halo.scale.set(0.12, 0.12, 1);
      halo.userData = { baseScale: 0.12, kind: 'cityHalo', cityId: c.id };
      globe.add(halo);
      haloSprites.push(halo);
    });

    // ─── datacenter pulses ────────────────────────────────────────────
    const dcRings = [];
    HERO_DATACENTERS.forEach((d) => {
      const pos = _latLonToVec3(THREE, d.lat, d.lon, 1.005);

      // base dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
      );
      dot.position.copy(pos);
      dot.userData = { kind: 'dc', data: d };
      globe.add(dot);

      // pulse rings — three of them at different phases
      for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.RingGeometry(0.018, 0.022, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: accentCol,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(pos);
        // orient ring tangent to sphere
        ring.lookAt(pos.clone().multiplyScalar(2));
        ring.userData = { phase: i / 3, dc: d };
        globe.add(ring);
        dcRings.push(ring);
      }
    });

    // ─── heat regions (additive discs on surface) ─────────────────────
    const heatTex = makeRadialTexture(THREE);
    HERO_HEAT.forEach((h) => {
      const pos = _latLonToVec3(THREE, h.lat, h.lon, 1.004);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: heatTex,
        color: accentCol,
        transparent: true,
        opacity: 0.55 * h.strength,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      sprite.position.copy(pos);
      const s = 0.45 + h.strength * 0.25;
      sprite.scale.set(s, s, 1);
      globe.add(sprite);
    });

    // ─── great-circle flow arcs ───────────────────────────────────────
    const arcs = [];
    HERO_ROUTES.forEach((r) => {
      const fromCity = HERO_CITIES.find((c) => c.id === r.from);
      const toDc     = HERO_DATACENTERS.find((d) => d.id === r.to);
      if (!fromCity || !toDc) return;
      const a = _latLonToVec3(THREE, fromCity.lat, fromCity.lon, 1.0);
      const b = _latLonToVec3(THREE, toDc.lat,    toDc.lon,    1.0);
      const points = _arcPoints(THREE, a, b, 80, 0.28);

      const positions = new Float32Array(points.length * 3);
      const tAttr     = new Float32Array(points.length);
      points.forEach((p, i) => {
        positions[i*3+0] = p.x;
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
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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
            // moving comet: pulse along arc length
            float speed = 0.45;
            float head  = mod(uTime * speed + uSeed, 1.4) - 0.2;
            float tail  = 0.28;
            float d     = head - vT;
            float pulse = exp(-pow(d / tail, 2.0)) * smoothstep(-0.02, 0.08, d);
            // base trail
            float base  = 0.10;
            float a     = clamp(base + pulse * 0.95, 0.0, 1.0);
            gl_FragColor = vec4(uColor, a);
          }
        `,
      });
      const line = new THREE.Line(geom, mat);
      line.userData = { kind: 'arc' };
      globe.add(line);
      arcs.push(mat);

      // tiny dot at each endpoint that pulses
      // (city already has one; just add a sharper dc dot)
    });

    // ─── pointer / raycast ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const ndc = new THREE.Vector2();
    const targetTilt = { x: 0, y: 0 };
    let hoveredId = null;
    let hoveredScale = 1;

    function onPointerMove(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      ndc.x =  px * 2 - 1;
      ndc.y = -(py * 2 - 1);
      // cursor magnetism — tilt slowly toward pointer
      targetTilt.y = ndc.x * 0.45;
      targetTilt.x = -ndc.y * 0.30;

      // hover-test cities
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hotspotMeshes, false);
      const hitId = hits.length ? hits[0].object.userData.data.id : null;
      if (hitId !== hoveredId) {
        hoveredId = hitId;
        if (callbackRef.current) {
          const c = HERO_CITIES.find((x) => x.id === hitId);
          callbackRef.current(c ? { ...c, kind: 'city' } : null);
        }
      }
    }
    function onPointerLeave() {
      targetTilt.x = 0;
      targetTilt.y = 0;
      if (hoveredId !== null) {
        hoveredId = null;
        callbackRef.current && callbackRef.current(null);
      }
    }
    renderer.domElement.addEventListener('pointermove',  onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // ─── overlay labels for cities (CSS, projected each frame) ─────────
    const overlay = overlayRef.current;
    const labelEls = HERO_CITIES.map((c) => {
      const el = document.createElement('div');
      el.className = 'hg-label';
      el.innerHTML = `
        <span class="hg-tick"></span>
        <span class="hg-name">${c.name.toUpperCase()}</span>
        <span class="hg-coord">${c.lat.toFixed(2)}° · ${c.lon.toFixed(2)}°</span>
      `;
      el.dataset.cityId = c.id;
      overlay.appendChild(el);
      return { el, city: c };
    });

    // ─── animation loop ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf = 0;
    let alive = true;

    function tick() {
      if (!alive) return;
      // NB: getDelta() must come BEFORE getElapsedTime() — Three.js Clock's
      // getElapsedTime() internally advances oldTime, which would zero out
      // any subsequent getDelta() call.
      const dt = clock.getDelta();
      const t  = clock.getElapsedTime();

      if (motion) {
        globe.rotation.y += dt * 0.20;
      }
      // tilt
      tiltGroup.rotation.x += (targetTilt.x - tiltGroup.rotation.x) * 0.06;
      tiltGroup.rotation.y += (targetTilt.y - tiltGroup.rotation.y) * 0.06;

      // orbit markers — slide along their rings
      orbitMarkers.forEach((om) => {
        const a = om.angle + t * om.speed;
        om.mesh.position.set(Math.cos(a) * om.r, 0, Math.sin(a) * om.r);
      });

      // shader uniforms
      scanUniforms.uTime.value = t;
      arcs.forEach((m) => { m.uniforms.uTime.value = t; });

      // pulses
      dcRings.forEach((ring) => {
        const speed = 0.55;
        const phase = (t * speed + ring.userData.phase) % 1;
        const scale = 1 + phase * 5;
        ring.scale.set(scale, scale, scale);
        ring.material.opacity = (1 - phase) * 0.5;
      });

      // halo pulse (subtle breathing on hovered)
      haloSprites.forEach((h) => {
        const isHover = (h.userData.cityId === hoveredId);
        const targetScale = isHover ? 0.26 : h.userData.baseScale;
        const cur = h.scale.x + (targetScale - h.scale.x) * 0.12;
        h.scale.set(cur, cur, 1);
        h.material.opacity = isHover ? 1.0 : 0.7 + Math.sin(t * 1.4 + h.position.x * 3) * 0.12;
      });

      // project labels
      labelEls.forEach(({ el, city }) => {
        // find world position of the city mesh after rotation
        const mesh = hotspotMeshes.find((m) => m.userData.data.id === city.id);
        if (!mesh) return;
        const wp = new THREE.Vector3();
        mesh.getWorldPosition(wp);
        // determine if facing camera
        const camDir = new THREE.Vector3().subVectors(camera.position, wp).normalize();
        const nrm    = wp.clone().normalize();
        const facing = nrm.dot(camDir);
        const visible = facing > 0.05;
        const proj   = wp.clone().project(camera);
        const x = (proj.x * 0.5 + 0.5) * W;
        const y = (-proj.y * 0.5 + 0.5) * H;
        el.style.transform = `translate(${x}px, ${y}px)`;
        const isHover = (hoveredId === city.id);
        el.style.opacity = visible ? (isHover ? 1 : 0.9) : 0;
        el.classList.toggle('hg-label-hover', isHover);
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // ─── resize observer ──────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    });
    ro.observe(mount);

    // ─── cleanup ──────────────────────────────────────────────────────
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove',  onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      labelEls.forEach(({ el }) => el.remove());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [accent, motion]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <div ref={overlayRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
    </div>
  );
}

// ─── tiny canvas-texture helpers ──────────────────────────────────────
function makeHaloTexture(THREE, color) {
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

function makeRadialTexture(THREE) {
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

window.HeroGlobe = HeroGlobe;
window.HERO_CITIES = HERO_CITIES;
window.HERO_DATACENTERS = HERO_DATACENTERS;
window.HERO_ROUTES = HERO_ROUTES;
