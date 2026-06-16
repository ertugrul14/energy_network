/**
 * Animated orthographic globe for the tablet landing page.
 * World map land fill + wireframe lat/lng grid + great-circle arcs + moving particles.
 */

import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';

// Pre-process land dots once.
// Strategy: rasterize all land polygons onto an offscreen canvas in equirectangular
// projection, then sample a regular lat/lng grid and keep only points that land on land.
const LAND_DOTS = [];
{
  const land = feature(landTopo, landTopo.objects.land);
  const geoms = land.type === 'FeatureCollection'
    ? land.features.map(f => f.geometry).filter(Boolean)
    : [land.geometry].filter(Boolean);

  // Offscreen canvas: 1px ≈ 0.5° — enough resolution for 1° dot grid
  const OW = 720, OH = 360;
  const oc  = document.createElement('canvas');
  oc.width  = OW;
  oc.height = OH;
  const ox  = oc.getContext('2d');

  ox.fillStyle = 'white';
  geoms.forEach(geom => {
    const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
    polys.forEach(poly => {
      // outer ring fills land; inner rings (holes) punch through
      poly.forEach((ring, ri) => {
        ox.beginPath();
        ring.forEach(([lng, lat], i) => {
          const x = (lng + 180) / 360 * OW;
          const y = (90  - lat) / 180 * OH;
          i === 0 ? ox.moveTo(x, y) : ox.lineTo(x, y);
        });
        ox.closePath();
        if (ri === 0) { ox.fillStyle = 'white'; ox.fill(); }
        else          { ox.fillStyle = 'black'; ox.fill(); } // hole
      });
    });
  });

  const pixels = ox.getImageData(0, 0, OW, OH).data;
  const STEP   = 0.9; // degrees between dots

  for (let lat = -89; lat <= 89; lat += STEP) {
    for (let lng = -179; lng <= 179; lng += STEP) {
      const px  = Math.min(OW - 1, Math.round((lng + 180) / 360 * OW));
      const py  = Math.min(OH - 1, Math.round((90  - lat) / 180 * OH));
      if (pixels[(py * OW + px) * 4] > 128) {   // R channel: white = land
        LAND_DOTS.push({ lat, lng });
      }
    }
  }
}

const NODES = [
  // Cities (blue)
  { lat: 41.38, lng:   2.17, color: '#5ABEF0', r: 3.5 }, // 0  Barcelona
  { lat: 24.69, lng:  46.72, color: '#5ABEF0', r: 3.5 }, // 1  Riyadh
  { lat:  1.35, lng: 103.82, color: '#5ABEF0', r: 3.5 }, // 2  Singapore
  { lat: -1.29, lng:  36.82, color: '#5ABEF0', r: 3.5 }, // 3  Nairobi
  { lat:-23.55, lng: -46.63, color: '#5ABEF0', r: 3.0 }, // 4  São Paulo
  { lat:-33.87, lng: 151.21, color: '#5ABEF0', r: 3.0 }, // 5  Sydney
  { lat: 51.51, lng:  -0.13, color: '#5ABEF0', r: 3.0 }, // 6  London
  // Datacenters (amber)
  { lat: 38.90, lng: -77.03, color: '#f0b429', r: 4.5 }, // 7  Virginia
  { lat: 53.33, lng:  -6.25, color: '#f0b429', r: 4.0 }, // 8  Dublin
  { lat: 35.68, lng: 139.69, color: '#f0b429', r: 4.0 }, // 9  Tokyo
  { lat: 19.08, lng:  72.88, color: '#f0b429', r: 4.0 }, // 10 Mumbai
  // Infrastructure (purple)
  { lat: 52.36, lng:   4.90, color: '#a371f7', r: 3.5 }, // 11 Amsterdam
  { lat: 45.52, lng: -73.56, color: '#f0b429', r: 3.5 }, // 12 Montreal
  { lat: 22.39, lng: 114.10, color: '#a371f7', r: 3.5 }, // 13 Hong Kong
];

const LINKS = [
  [0, 7, 'data'],    [0, 8, 'data'],
  [1, 9, 'data'],    [1,10, 'data'],
  [2, 9, 'data'],    [2,10, 'data'],
  [3, 8, 'data'],    [3,10, 'data'],
  [4, 7, 'data'],    [5, 9, 'data'],
  [6, 8, 'data'],    [6, 7, 'data'],
  [11, 8, 'material'],[13, 9, 'material'],
  [7, 12, 'elec'],   [8, 11, 'elec'],
  [9, 13, 'elec'],   [10, 2, 'elec'],
  [7,  9, 'elec'],
];

const TYPE_COLOR = {
  data:     'rgba(90, 190, 240,',
  elec:     'rgba(240, 180,  41,',
  material: 'rgba(163, 113, 247,',
};

const ROT_SPEED = 0.00007; // radians per ms

function toRad(d) { return d * Math.PI / 180; }

/** Orthographic projection. Returns {x, y, z} — z>0 is front face. */
function ortho(lat, lng, theta, cx, cy, R) {
  const φ = toRad(lat);
  const λ = toRad(lng) - theta;
  return {
    x: cx + R * Math.cos(φ) * Math.sin(λ),
    y: cy - R * Math.sin(φ),
    z: Math.cos(φ) * Math.cos(λ),
  };
}

/** Spherical linear interpolation between two lat/lng points. */
function slerp(lat1, lng1, lat2, lng2, t) {
  const φ1 = toRad(lat1), λ1 = toRad(lng1);
  const φ2 = toRad(lat2), λ2 = toRad(lng2);
  const v1 = [Math.cos(φ1)*Math.cos(λ1), Math.sin(φ1), Math.cos(φ1)*Math.sin(λ1)];
  const v2 = [Math.cos(φ2)*Math.cos(λ2), Math.sin(φ2), Math.cos(φ2)*Math.sin(λ2)];
  const dot = Math.max(-1, Math.min(1, v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]));
  const omega = Math.acos(dot);
  let vx, vy, vz;
  if (omega < 0.001) {
    vx = v1[0] + t*(v2[0]-v1[0]);
    vy = v1[1] + t*(v2[1]-v1[1]);
    vz = v1[2] + t*(v2[2]-v1[2]);
  } else {
    const s = Math.sin(omega);
    const s1 = Math.sin((1-t)*omega)/s;
    const s2 = Math.sin(t*omega)/s;
    vx = s1*v1[0] + s2*v2[0];
    vy = s1*v1[1] + s2*v2[1];
    vz = s1*v1[2] + s2*v2[2];
  }
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, vy))) * 180/Math.PI,
    lng: Math.atan2(vz, vx) * 180/Math.PI,
  };
}

/** Stroke a sequence of {x,y,z} projected points, skipping back-face segments. */
function strokeVisible(ctx, points) {
  let open = false;
  for (const p of points) {
    if (p.z > 0) {
      if (!open) { ctx.beginPath(); ctx.moveTo(p.x, p.y); open = true; }
      else ctx.lineTo(p.x, p.y);
    } else {
      if (open) { ctx.stroke(); open = false; }
    }
  }
  if (open) ctx.stroke();
}

export function initLandingWorld(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  let animId;
  let stopped = false;
  let theta = toRad(-10);
  let lastTs = null;

  function resize() {
    const dpr = devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const particles = LINKS.flatMap(([a, b, type], li) =>
    Array.from({ length: Math.floor(Math.random()*2)+1 }, (_, i) => ({
      a, b, type,
      progress: (li * 0.13 + i * 0.35) % 1,
      speed: 0.0004 + Math.random()*0.0006,
      size:  2.5 + Math.random()*1.5,
    }))
  );

  function draw(ts) {
    if (stopped) return;
    const dt = lastTs ? Math.min(ts - lastTs, 50) : 16;
    lastTs = ts;
    theta += ROT_SPEED * dt;

    const W  = canvas.offsetWidth;
    const H  = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;
    const R  = Math.min(W * 0.42, H * 0.42);

    ctx.clearRect(0, 0, W, H);

    // ── 1. Atmosphere glow
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.18);
    atmo.addColorStop(0, 'rgba(91,214,226,0.05)');
    atmo.addColorStop(1, 'rgba(91,214,226,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
    ctx.fillStyle = atmo;
    ctx.fill();

    // ── 2. Globe disc
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(13,17,23,0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(91,214,226,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── 3. Land dots — one batched path fill for all visible dots
    ctx.beginPath();
    for (const dot of LAND_DOTS) {
      const p = ortho(dot.lat, dot.lng, theta, cx, cy, R);
      if (p.z <= 0) continue;
      ctx.moveTo(p.x + 1.3, p.y);
      ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    }
    ctx.fillStyle = 'rgba(90, 190, 240, 0.5)';
    ctx.fill();

    // ── 4. Wireframe grid (on top of land)
    ctx.lineWidth = 0.5;

    // Latitude lines every 20°
    ctx.strokeStyle = 'rgba(91,214,226,0.08)';
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts = [];
      for (let lng = -180; lng <= 180; lng += 3)
        pts.push(ortho(lat, lng, theta, cx, cy, R));
      strokeVisible(ctx, pts);
    }

    // Longitude lines every 20°
    ctx.strokeStyle = 'rgba(91,214,226,0.06)';
    for (let lng = -180; lng < 180; lng += 20) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 2)
        pts.push(ortho(lat, lng, theta, cx, cy, R));
      strokeVisible(ctx, pts);
    }

    // ── 5. Great-circle arcs
    LINKS.forEach(([a, b, type]) => {
      const na = NODES[a], nb = NODES[b];
      ctx.strokeStyle = TYPE_COLOR[type] + ' 0.25)';
      ctx.lineWidth = 0.9;
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const mid = slerp(na.lat, na.lng, nb.lat, nb.lng, i/80);
        pts.push(ortho(mid.lat, mid.lng, theta, cx, cy, R));
      }
      strokeVisible(ctx, pts);
    });

    // ── 6. Particles
    const now = Date.now();
    particles.forEach(p => {
      p.progress = (p.progress + p.speed) % 1;

      const na = NODES[p.a], nb = NODES[p.b];
      const pos  = slerp(na.lat, na.lng, nb.lat, nb.lng, p.progress);
      const proj = ortho(pos.lat, pos.lng, theta, cx, cy, R);
      if (proj.z <= 0.05) return;

      const col = TYPE_COLOR[p.type];

      const tailPos = slerp(na.lat, na.lng, nb.lat, nb.lng, Math.max(0, p.progress - 0.045));
      const tailp   = ortho(tailPos.lat, tailPos.lng, theta, cx, cy, R);
      if (tailp.z > 0) {
        ctx.beginPath();
        ctx.moveTo(tailp.x, tailp.y);
        ctx.lineTo(proj.x, proj.y);
        ctx.strokeStyle = col + ` ${(0.55 * proj.z).toFixed(2)})`;
        ctx.lineWidth = p.size * 0.85;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, p.size * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = col + ' 0.1)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = col + ` ${(0.85 * proj.z + 0.15).toFixed(2)})`;
      ctx.fill();
    });

    // ── 7. Nodes
    NODES.forEach((node, i) => {
      const proj = ortho(node.lat, node.lng, theta, cx, cy, R);
      if (proj.z <= 0.05) return;

      const pulse = 0.5 + 0.5 * Math.sin(now * 0.0016 + i * 1.4);

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, node.r + 3 + pulse * 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${_rgb(node.color)},${(pulse * 0.22 * proj.z).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = Math.min(1, 0.3 + proj.z * 0.7);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(proj.x - node.r * 0.2, proj.y - node.r * 0.2, node.r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${(0.55 * proj.z).toFixed(2)})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(draw);
  }

  animId = requestAnimationFrame(draw);

  return function destroy() {
    stopped = true;
    cancelAnimationFrame(animId);
    ro.disconnect();
  };
}

const _cache = {};
function _rgb(hex) {
  return _cache[hex] ??= `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
