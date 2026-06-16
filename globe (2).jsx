// globe.jsx — dotted constellation globe (canvas)
// Fibonacci sphere distribution, slow yaw rotation, animated great-circle flow arcs.

function hexA(hex, a) {
  if (!hex || hex.startsWith('rgb')) return hex || `rgba(255,255,255,${a})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function randomSpherePoint() {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function DottedGlobe({
  size = 720,
  accent = '#F4B942',
  dotColor = '#aab4c0',
  motion = true,
  pattern = 'uniform',
  flowCount = 5,
  // Number of points before pattern filtering. ~2400 reads dense but stays cheap.
  pointCount = 2400,
  // Optional list of "highlight" lat/lon dots that draw larger + in the accent color
  highlights = [],
  // Optional cities with name labels. [{name, lat, lon}]
  cities = [],
  fontMono = 'JetBrains Mono',
  showRings = true,
}) {
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ rotation: 0, flows: [], lastT: 0 });

  // Generate points once per pattern change
  const points = React.useMemo(() => {
    const N = pointCount;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      let keep = 1;
      if (pattern === 'equator') keep = 1 - Math.pow(Math.abs(y), 1.6) * 0.85;
      else if (pattern === 'polar') keep = 0.25 + Math.pow(Math.abs(y), 2) * 0.85;
      else if (pattern === 'sparse') keep = 0.55;
      // Add slight noise to break the perfect grid feel
      if (Math.random() > keep) continue;
      pts.push({ x, y, z });
    }
    return pts;
  }, [pattern, pointCount]);

  // Latitude rings (precomputed)
  const rings = React.useMemo(() => {
    const out = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      if (lat === 0) continue;
      const phi = (lat * Math.PI) / 180;
      out.push(phi);
    }
    return out;
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const s = stateRef.current;
    s.lastT = 0;

    let raf = 0;
    let alive = true;

    function tick(now) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - (s.lastT || now)) / 1000);
      s.lastT = now;
      if (motion) s.rotation += dt * 0.16;

      // Spawn / age flows
      if (motion) {
        while (s.flows.length < flowCount) {
          s.flows.push({
            a: randomSpherePoint(),
            b: randomSpherePoint(),
            t: -Math.random() * 1.5,
            duration: 1.8 + Math.random() * 2.2,
          });
        }
        s.flows.forEach((f) => (f.t += dt));
        s.flows = s.flows.filter((f) => f.t < f.duration + 0.6);
      }

      draw();
      raf = requestAnimationFrame(tick);
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.44;
      const rot = s.rotation;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      // Subtle atmosphere
      const atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      atm.addColorStop(0, hexA(accent, 0.07));
      atm.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Back-side rings (faint)
      if (showRings) {
        ctx.lineWidth = 0.7;
        for (const phi of rings) {
          drawLatRing(ctx, phi, cx, cy, R, cosR, sinR, dotColor, 0.06);
        }
        // Prime meridian + equator (very thin)
        drawLatRing(ctx, 0, cx, cy, R, cosR, sinR, dotColor, 0.1);
      }

      // Dots
      for (const p of points) {
        const x = p.x * cosR + p.z * sinR;
        const z = -p.x * sinR + p.z * cosR;
        const y = p.y;
        if (z < -0.08) continue;
        const sx = cx + x * R;
        const sy = cy - y * R;
        const depth = (z + 1) / 2; // 0..1
        const radius = 0.35 + depth * 0.9;
        const alpha = 0.1 + depth * 0.55;
        ctx.fillStyle = hexA(dotColor, alpha);
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight points (lat/lon in degrees)
      for (const h of highlights) {
        const phi = ((h.lat || 0) * Math.PI) / 180;
        const lam = ((h.lon || 0) * Math.PI) / 180;
        const px = Math.cos(phi) * Math.cos(lam);
        const py = Math.sin(phi);
        const pz = Math.cos(phi) * Math.sin(lam);
        const x = px * cosR + pz * sinR;
        const z = -px * sinR + pz * cosR;
        if (z < -0.05) continue;
        const sx = cx + x * R;
        const sy = cy - py * R;
        const depth = (z + 1) / 2;
        ctx.fillStyle = hexA(accent, 0.25 + depth * 0.65);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // soft halo
        ctx.fillStyle = hexA(accent, 0.18 * depth);
        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cities — bright dots + tick + name label, projected through rotation
      for (const c of cities) {
        const lat = c.lat || 0;
        const lon = c.lon || 0;
        const phi = (lat * Math.PI) / 180;
        // Note: lon needs a +90° offset relative to our point basis (z-axis = lon 0)
        const lam = ((lon - 90) * Math.PI) / 180;
        const px = Math.cos(phi) * Math.cos(lam);
        const py = Math.sin(phi);
        const pz = Math.cos(phi) * Math.sin(lam);
        const x = px * cosR + pz * sinR;
        const z = -px * sinR + pz * cosR;
        if (z < -0.02) continue;
        const sx = cx + x * R;
        const sy = cy - py * R;
        const depth = (z + 1) / 2;
        const front = Math.max(0, z);

        // halo
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
        halo.addColorStop(0, hexA(accent, 0.45 * front));
        halo.addColorStop(1, hexA(accent, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, 14, 0, Math.PI * 2);
        ctx.fill();

        // bright core
        ctx.fillStyle = hexA(accent, 0.85 + front * 0.15);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.fill();
        // outer ring
        ctx.strokeStyle = hexA(accent, 0.55 * (0.4 + front));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
        ctx.stroke();

        // pick label side based on screen quadrant — outward from center
        const right = sx >= cx;
        const lx = sx + (right ? 12 : -12);
        const ly = sy;

        // connector tick
        ctx.strokeStyle = hexA(accent, 0.4 + front * 0.4);
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(sx + (right ? 4 : -4), sy);
        ctx.lineTo(lx + (right ? 6 : -6), ly);
        ctx.stroke();

        // text
        const labelAlpha = 0.55 + front * 0.45;
        const name = (c.name || '').toUpperCase();
        const sub  = c.country || '';
        ctx.font = `500 9.5px "${fontMono}", monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = right ? 'left' : 'right';
        const tx = lx + (right ? 8 : -8);
        ctx.fillStyle = hexA(accent, labelAlpha);
        ctx.fillText(name, tx, ly - 5);
        if (sub) {
          ctx.font = `400 8px "${fontMono}", monospace`;
          ctx.fillStyle = hexA(dotColor, labelAlpha * 0.7);
          ctx.fillText(sub, tx, ly + 6);
        }
      }

      // Flow arcs
      for (const f of s.flows) {
        drawFlow(f, cx, cy, R, cosR, sinR);
      }
    }

    function drawFlow(f, cx, cy, R, cosR, sinR) {
      const a = f.a, b = f.b;
      const dot = a.x * b.x + a.y * b.y + a.z * b.z;
      const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
      if (omega < 0.25) return;
      const sinO = Math.sin(omega);
      const t01 = Math.max(0, Math.min(1, f.t / f.duration));
      const fade = f.t > f.duration ? Math.max(0, 1 - (f.t - f.duration) / 0.6) : 1;

      const steps = 56;
      const tailLen = 0.32; // fraction of arc visible as a comet tail
      const headT = t01;
      const tailT = Math.max(0, headT - tailLen);

      const pts = [];
      const N = Math.max(2, Math.floor(steps * (headT - tailT) + 4));
      for (let i = 0; i <= N; i++) {
        const tt = tailT + ((headT - tailT) * i) / N;
        const s1 = Math.sin((1 - tt) * omega) / sinO;
        const s2 = Math.sin(tt * omega) / sinO;
        let px = s1 * a.x + s2 * b.x;
        let py = s1 * a.y + s2 * b.y;
        let pz = s1 * a.z + s2 * b.z;
        const lift = 1 + Math.sin(tt * Math.PI) * 0.14;
        px *= lift; py *= lift; pz *= lift;
        const rx = px * cosR + pz * sinR;
        const rz = -px * sinR + pz * cosR;
        const sx = cx + rx * R;
        const sy = cy - py * R;
        pts.push({ x: sx, y: sy, z: rz, t: tt });
      }

      ctx.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i];
        if (p0.z < -0.15 || p1.z < -0.15) continue;
        const localFade = i / pts.length;
        const depthFade = Math.max(0.15, (p1.z + 1) / 2);
        ctx.strokeStyle = hexA(accent, localFade * 0.85 * fade * depthFade);
        ctx.lineWidth = 0.9 + localFade * 0.6;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      // Leading head
      const head = pts[pts.length - 1];
      if (head && head.z > -0.1) {
        ctx.fillStyle = hexA(accent, 0.95 * fade);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hexA(accent, 0.28 * fade);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawLatRing(ctx, phi, cx, cy, R, cosR, sinR, color, alpha) {
      const steps = 96;
      const y = Math.sin(phi);
      const r = Math.cos(phi);
      ctx.strokeStyle = hexA(color, alpha);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= steps; i++) {
        const lam = (i / steps) * Math.PI * 2;
        const px = r * Math.cos(lam);
        const pz = r * Math.sin(lam);
        const x = px * cosR + pz * sinR;
        const z = -px * sinR + pz * cosR;
        const sx = cx + x * R;
        const sy = cy - y * R;
        if (z < -0.05) { started = false; continue; }
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [points, accent, dotColor, motion, size, flowCount, showRings, rings, highlights, cities, fontMono]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

window.DottedGlobe = DottedGlobe;
