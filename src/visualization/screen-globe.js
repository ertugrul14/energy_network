/**
 * SCREEN GLOBE — Three.js replacement for the Mapbox GlobeVisualization.
 *
 * Provides the same API surface that screen.js and narrative.js expect:
 *   - focusOnLocation({lat, lng})
 *   - clearFlows()
 *   - visualizeFlows(flows)
 *   - createAllLocationMarkers()
 *   - map.flyTo({center, zoom, pitch, bearing, duration})  (compat shim)
 *
 * Built on top of the hero-globe holographic style.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { CITIES } from '../data/models.js';
import worldData from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';

const FLOW_COLORS = {
  electricity: new THREE.Color('#f0b429'),
  water:       new THREE.Color('#58a6ff'),
  emissions:   new THREE.Color('#f85149'),
  materials:   new THREE.Color('#a371f7'),
  data:        new THREE.Color('#58a6ff'),
};

const ACCENT = new THREE.Color('#5ABEF0');

function latLngToVec3(lat, lng, r = 1) {
  const phi   = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function arcPoints(a, b, segments = 80, lift = 0.28) {
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

export class ScreenGlobe {
  constructor(container) {
    this.container = container;
    this.flowObjects = [];
    this._time = 0;
    this._flowMaterials = [];

    this._initScene();
    this._initGlobe();
    this._initStarfield();
    this._initAtmosphere();
    this._initLocations();
    this._initMapCompat();
    this._startLoop();
  }

  _initScene() {
    const W = this.container.clientWidth || 1920;
    const H = this.container.clientHeight || 1080;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
    this.camera.position.set(0, 0, 5.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x0d1117, 1);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';

    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.globe = new THREE.Group();
    this.root.add(this.globe);
    this.globe.rotation.y = -0.6;

    const ro = new ResizeObserver(() => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    ro.observe(this.container);
  }

  _initGlobe() {
    // Solid inner sphere (dark ocean)
    this.globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.985, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x05060a }),
    ));

    // Land-mass texture sphere (canvas-painted equirectangular)
    this._landTexture = this._buildLandTexture();
    this.globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.001, 96, 64),
      new THREE.MeshBasicMaterial({
        map: this._landTexture,
        transparent: true,
        depthWrite: false,
      }),
    ));

    // Country border outlines (3D lines on sphere)
    this._drawCountryOutlines();

    // Scan-line shader
    this._scanUniforms = { uTime: { value: 0 }, uColor: { value: ACCENT.clone() } };
    this.globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: this._scanUniforms,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec3 vObjN, vViewN;
          void main() {
            vObjN = normal;
            vViewN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vObjN, vViewN;
          uniform float uTime;
          uniform vec3 uColor;
          void main() {
            float y = vObjN.y;
            float bandY = sin(uTime * 0.28) * 0.92;
            float band = exp(-pow((y - bandY) * 9.0, 2.0));
            float facing = max(0.0, vViewN.z);
            float fres = pow(1.0 - facing, 1.6) * 0.20;
            float a = band * 0.45 * facing + fres;
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    ));
  }

  _buildLandTexture() {
    const W = 4096, H = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, W, H);

    const countries = feature(worldData, worldData.objects.countries);

    const lngToX = (lng) => ((lng + 180) / 360) * W;
    const latToY = (lat) => ((90 - lat) / 180) * H;

    // Fill landmasses
    ctx.fillStyle = 'rgba(88, 166, 255, 0.10)';
    ctx.strokeStyle = 'rgba(90, 190, 240, 0.45)';
    ctx.lineWidth = 1.2;

    for (const feat of countries.features) {
      const polys = feat.geometry.type === 'MultiPolygon'
        ? feat.geometry.coordinates
        : [feat.geometry.coordinates];

      for (const polygon of polys) {
        ctx.beginPath();
        for (let ri = 0; ri < polygon.length; ri++) {
          const ring = polygon[ri];
          for (let i = 0; i < ring.length; i++) {
            const x = lngToX(ring[i][0]);
            const y = latToY(ring[i][1]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 4;
    return tex;
  }

  _drawCountryOutlines() {
    const countries = feature(worldData, worldData.objects.countries);
    const outlineMat = new THREE.LineBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0.40,
    });

    for (const feat of countries.features) {
      const polys = feat.geometry.type === 'MultiPolygon'
        ? feat.geometry.coordinates
        : [feat.geometry.coordinates];

      for (const polygon of polys) {
        for (const ring of polygon) {
          if (ring.length < 4) continue;
          const pts = [];
          for (const [lng, lat] of ring) {
            pts.push(latLngToVec3(lat, lng, 1.003));
          }
          this.globe.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            outlineMat,
          ));
        }
      }
    }
  }

  _initStarfield() {
    const N = 2000;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 18 + Math.random() * 14;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.cos(phi);
      pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      const c = 0.55 + Math.random() * 0.45;
      col[i*3] = c; col[i*3+1] = c; col[i*3+2] = c;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.04, sizeAttenuation: true, transparent: true,
      opacity: 0.5, vertexColors: true, depthWrite: false,
    })));
  }

  _initAtmosphere() {
    const fresnelVert = `
      varying vec3 vViewN;
      void main() {
        vViewN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    this.root.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: ACCENT.clone() } },
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
    this.root.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 64, 48),
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: ACCENT.clone() } },
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
  }

  _initLocations() {
    this._haloTex = makeHaloTexture();
    this._cityDots = [];
    this._dcRings = [];
    this._cityLabels = [];

    // Create a CSS overlay container for city labels
    this._labelContainer = document.createElement('div');
    this._labelContainer.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;';
    this.container.style.position = 'relative';
    this.container.appendChild(this._labelContainer);
  }

  // ── Public API (compatible with Mapbox GlobeVisualization) ──────

  createAllLocationMarkers() {
    for (const [, city] of Object.entries(CITIES)) {
      if (!city.coords) continue;
      const pos = latLngToVec3(city.coords.lat, city.coords.lng, 1.012);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshBasicMaterial({ color: ACCENT }),
      );
      dot.position.copy(pos);
      this.globe.add(dot);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._haloTex, color: ACCENT, transparent: true,
        opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      halo.position.copy(pos);
      halo.scale.set(0.10, 0.10, 1);
      this.globe.add(halo);

      this._cityDots.push({ dot, halo, city });

      // CSS label
      const el = document.createElement('div');
      el.textContent = city.name;
      el.style.cssText =
        'position:absolute;color:#c8e6ff;font-family:"Space Grotesk",sans-serif;' +
        'font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;' +
        'white-space:nowrap;text-shadow:0 0 6px rgba(90,190,240,0.7),0 1px 2px rgba(0,0,0,0.8);' +
        'transform:translate(-50%,-150%);opacity:0;transition:opacity 0.3s;';
      this._labelContainer.appendChild(el);
      this._cityLabels.push({ el, pos3d: pos.clone(), city });
    }
  }

  focusOnLocation(coords) {
    if (!coords) return;
    const target = latLngToVec3(coords.lat, coords.lng, 1);
    const targetAngleY = Math.atan2(-target.x, -target.z);
    const targetAngleX = Math.asin(target.y);

    gsap.to(this.globe.rotation, {
      y: targetAngleY,
      x: -targetAngleX * 0.3,
      duration: 2,
      ease: 'power2.inOut',
    });
  }

  clearFlows() {
    for (const obj of this.flowObjects) {
      this.globe.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
    this.flowObjects = [];
    this._flowMaterials = [];
  }

  visualizeFlows(flows) {
    for (const flow of flows) {
      if (!flow.from || !flow.to) continue;

      const a = latLngToVec3(flow.from.lat, flow.from.lng, 1.0);
      const b = latLngToVec3(flow.to.lat, flow.to.lng, 1.0);
      const color = FLOW_COLORS[flow.type] || ACCENT;

      const points = arcPoints(a, b, 80, 0.28);
      const positions = new Float32Array(points.length * 3);
      const tAttr = new Float32Array(points.length);
      points.forEach((p, i) => {
        positions[i*3]   = p.x;
        positions[i*3+1] = p.y;
        positions[i*3+2] = p.z;
        tAttr[i] = i / (points.length - 1);
      });

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('aT', new THREE.BufferAttribute(tAttr, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:  { value: this._time },
          uColor: { value: color.clone() },
          uSeed:  { value: Math.random() },
        },
        transparent: true, depthWrite: false,
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
          uniform vec3 uColor;
          uniform float uSeed;
          void main() {
            float speed = 0.35;
            float head = mod(uTime * speed + uSeed, 1.4) - 0.2;
            float tail = 0.28;
            float d = head - vT;
            float pulse = exp(-pow(d / tail, 2.0)) * smoothstep(-0.02, 0.08, d);
            float base = 0.15;
            float a = clamp(base + pulse * 0.85, 0.0, 1.0);
            gl_FragColor = vec4(uColor, a);
          }
        `,
      });

      const line = new THREE.Line(geom, mat);
      this.globe.add(line);
      this.flowObjects.push(line);
      this._flowMaterials.push(mat);

      // Endpoint pulse at destination
      const destPos = latLngToVec3(flow.to.lat, flow.to.lng, 1.008);
      const pulseDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }),
      );
      pulseDot.position.copy(destPos);
      this.globe.add(pulseDot);
      this.flowObjects.push(pulseDot);

      // Origin pulse
      const originPos = latLngToVec3(flow.from.lat, flow.from.lng, 1.008);
      const originDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 12, 12),
        new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.8 }),
      );
      originDot.position.copy(originPos);
      this.globe.add(originDot);
      this.flowObjects.push(originDot);
    }
  }

  // ── Mapbox compatibility shim ──────────────────────────
  // narrative.js calls this.globe.map.flyTo({center:[lng,lat], zoom, ...})
  // We translate that into globe rotation + camera zoom.

  _initMapCompat() {
    const self = this;
    this.map = {
      flyTo({ center, zoom, pitch, bearing, duration }) {
        if (center) {
          const [lng, lat] = center;
          self.focusOnLocation({ lat, lng });
        }
        if (zoom !== undefined) {
          const dist = THREE.MathUtils.mapLinear(zoom, 1, 6, 5.8, 3.2);
          gsap.to(self.camera.position, {
            z: dist,
            duration: (duration || 2000) / 1000,
            ease: 'power2.inOut',
          });
        }
      },
      on(event, fn) {
        if (event === 'load') {
          setTimeout(fn, 100);
        }
      },
    };
  }

  // ── Animation loop ─────────────────────────────────────

  _updateCityLabels() {
    const W = this.renderer.domElement.clientWidth;
    const H = this.renderer.domElement.clientHeight;
    const camWorldPos = new THREE.Vector3();
    this.camera.getWorldPosition(camWorldPos);

    for (const { el, pos3d } of this._cityLabels) {
      // Get world position of the dot (globe may have rotated)
      const worldPos = pos3d.clone().applyMatrix4(this.globe.matrixWorld);

      // Check if city faces the camera (dot product with camera direction)
      const toCamera = camWorldPos.clone().sub(worldPos).normalize();
      const surfaceNormal = worldPos.clone().normalize();
      const facing = surfaceNormal.dot(toCamera);

      if (facing < 0.15) {
        el.style.opacity = '0';
        continue;
      }

      // Project to screen
      const projected = worldPos.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * W;
      const y = (-projected.y * 0.5 + 0.5) * H;

      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.opacity = String(Math.min(1, (facing - 0.15) * 2.5));
    }
  }

  _startLoop() {
    let last = performance.now();
    const tick = (now) => {
      let dt = (now - last) / 1000;
      if (dt > 0.1) dt = 0.016;
      last = now;
      this._time += dt;

      this.globe.rotation.y += dt * 0.06;

      this._scanUniforms.uTime.value = this._time;

      for (const mat of this._flowMaterials) {
        mat.uniforms.uTime.value = this._time;
      }

      this.renderer.render(this.scene, this.camera);
      this._updateCityLabels();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
