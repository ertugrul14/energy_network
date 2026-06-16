import { useState } from "react";

const CHANNELS = [
  { id: 1, rows: [1,2,3,4,5], gpio: "GPIO 4", building: "Building 1" },
  { id: 2, rows: [8,9,10,11,12], gpio: "GPIO 5", building: "Building 2" },
  { id: 3, rows: [15,16,17,18,19], gpio: "GPIO 6", building: "Building 3" },
  { id: 4, rows: [22,23,24,25,26], gpio: "GPIO 7", building: "Building 4" },
  { id: 5, rows: [29,30,31,32,33], gpio: "GPIO 15", building: "Building 5" },
  { id: 6, rows: [36,37,38,39,40], gpio: "GPIO 16", building: "Building 6" },
  { id: 7, rows: [43,44,45,46,47], gpio: "GPIO 17", building: "Building 7" },
  { id: 8, rows: [50,51,52,53,54], gpio: "GPIO 18", building: "Building 8" },
];

const COLS_RIGHT = ["f","g","h","i","j"];
const COLS_LEFT = ["a","b","c","d","e"];

const HOLE_SIZE = 7;
const HOLE_GAP = 12;
const RAIL_W = 14;
const MARGIN_L = 52;
const MARGIN_T = 50;
const GAP_W = 18;
const LABEL_W = 20;

function holeX(col) {
  const leftCols = ["a","b","c","d","e"];
  const rightCols = ["f","g","h","i","j"];
  const railPlusOffset = RAIL_W + 6;
  if (col === "+L") return MARGIN_L;
  if (col === "-L") return MARGIN_L + RAIL_W + 2;
  if (leftCols.includes(col)) return MARGIN_L + railPlusOffset + 8 + leftCols.indexOf(col) * HOLE_GAP;
  if (col === "+R") return MARGIN_L + railPlusOffset + 8 + 4 * HOLE_GAP + GAP_W + 4 * HOLE_GAP + 12 + RAIL_W + 2;
  if (col === "-R") return MARGIN_L + railPlusOffset + 8 + 4 * HOLE_GAP + GAP_W + 4 * HOLE_GAP + 12;
  if (rightCols.includes(col)) return MARGIN_L + railPlusOffset + 8 + 4 * HOLE_GAP + GAP_W + rightCols.indexOf(col) * HOLE_GAP;
  return 0;
}

function holeY(row) {
  return MARGIN_T + (row - 1) * HOLE_GAP;
}

const BOARD_W = holeX("+R") + RAIL_W + 20;
const BOARD_H = MARGIN_T + 60 * HOLE_GAP + 20;

function Hole({ col, row, color, label, pulse }) {
  const x = holeX(col);
  const y = holeY(row);
  const r = color ? HOLE_SIZE / 2 + 1 : HOLE_SIZE / 2 - 0.5;
  return (
    <g>
      <circle cx={x} cy={y} r={r}
        fill={color || "#1a1a1a"}
        stroke={color ? "#000" : "#333"}
        strokeWidth={color ? 0.8 : 0.3}
        opacity={color ? 1 : 0.25}
      />
      {pulse && <circle cx={x} cy={y} r={r + 3} fill="none" stroke={color} strokeWidth={1} opacity={0.4}>
        <animate attributeName="r" from={r+2} to={r+6} dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
      </circle>}
      {label && <text x={x} y={y - 7} textAnchor="middle" fontSize="6" fill={color} fontWeight="600" fontFamily="monospace">{label}</text>}
    </g>
  );
}

function Wire({ col1, row1, col2, row2, color, dashed }) {
  return <line
    x1={holeX(col1)} y1={holeY(row1)}
    x2={holeX(col2)} y2={holeY(row2)}
    stroke={color} strokeWidth={2}
    strokeDasharray={dashed ? "3 2" : "none"}
    strokeLinecap="round"
    opacity={0.8}
  />;
}

function ComponentBar({ col1, row1, col2, row2, color, label }) {
  const x1 = holeX(col1), y1 = holeY(row1);
  const x2 = holeX(col2), y2 = holeY(row2);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.85}/>
      {label && <g transform={`translate(${mx},${my - 5})`}>
        <text textAnchor="middle" fontSize="5.5" fill={color} fontWeight="700" fontFamily="monospace">{label}</text>
      </g>}
    </g>
  );
}

function Channel({ ch, active, onHover }) {
  const [r0, r1, r2, r3, r4] = ch.rows;
  const colors = {
    mosfet: "#9333ea",
    gate: "#9333ea",
    drain: "#ea580c",
    source: "#059669",
    r220: "#d97706",
    r10k: "#0891b2",
    signal: "#2563eb",
    ledNeg: "#ea580c",
    ledPos: "#dc2626",
    gnd: "#2563eb",
  };
  const o = active ? 1 : 0.2;

  return (
    <g opacity={o} onMouseEnter={() => onHover(ch.id)} onMouseLeave={() => onHover(null)} style={{cursor:"pointer"}}>
      <Hole col="f" row={r0} color={colors.gate} label="G" pulse={active}/>
      <Hole col="f" row={r1} color={colors.drain} label="D"/>
      <Hole col="f" row={r2} color={colors.source} label="S"/>

      <ComponentBar col1="g" row1={r0} col2="g" row2={r4} color={colors.r220} label="220Ω"/>
      <Hole col="g" row={r0} color={colors.r220}/>
      <Hole col="g" row={r4} color={colors.r220}/>

      <Wire col1="h" row1={r0} col2="-R" row2={r0} color={colors.r10k}/>
      <Hole col="h" row={r0} color={colors.r10k}/>
      <Hole col="-R" row={r0} color={colors.r10k}/>
      <text x={holeX("h") + 4} y={holeY(r0) - 5} fontSize="5" fill={colors.r10k} fontWeight="700" fontFamily="monospace">10kΩ</text>

      <Wire col1="h" row1={r2} col2="-R" row2={r2} color={colors.gnd}/>
      <Hole col="h" row={r2} color={colors.gnd}/>
      <Hole col="-R" row={r2} color={colors.gnd}/>
      <text x={holeX("h") + 4} y={holeY(r2) - 5} fontSize="5" fill={colors.gnd} fontWeight="600" fontFamily="monospace">S→GND</text>

      <Hole col="j" row={r4} color={colors.signal}/>
      <Hole col="j" row={r1} color={colors.ledNeg}/>
      <Hole col="+R" row={r1} color={colors.ledPos}/>

      {active && <>
        <text x={BOARD_W + 8} y={holeY(r0)} fontSize="7" fill="#9333ea" fontWeight="600" fontFamily="sans-serif" dominantBaseline="central">
          ← MOSFET (G D S)
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 10} fontSize="6.5" fill="#d97706" fontFamily="sans-serif" dominantBaseline="central">
          ← 220Ω: g{r0} to g{r4}
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 20} fontSize="6.5" fill="#0891b2" fontFamily="sans-serif" dominantBaseline="central">
          ← 10kΩ: h{r0} to GND rail
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 30} fontSize="6.5" fill="#2563eb" fontFamily="sans-serif" dominantBaseline="central">
          ← Source jumper: h{r2} to GND rail
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 40} fontSize="6.5" fill="#2563eb" fontFamily="sans-serif" dominantBaseline="central">
          ← ESP32 {ch.gpio} → j{r4}
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 50} fontSize="6.5" fill="#ea580c" fontFamily="sans-serif" dominantBaseline="central">
          ← LED white(-) → j{r1}
        </text>
        <text x={BOARD_W + 8} y={holeY(r0) + 60} fontSize="6.5" fill="#dc2626" fontFamily="sans-serif" dominantBaseline="central">
          ← LED red(+) → red(+) rail
        </text>
      </>}

      <rect x={MARGIN_L - 48} y={holeY(r0) - 4} width={44} height={HOLE_GAP * 4 + 8} rx={3}
        fill={active ? "#9333ea" : "#666"} opacity={active ? 0.15 : 0.05} stroke={active ? "#9333ea" : "#666"} strokeWidth={0.5}/>
      <text x={MARGIN_L - 46} y={holeY(r0) + 6} fontSize="6.5" fill={active ? "#9333ea" : "#888"} fontWeight="600" fontFamily="sans-serif">
        {ch.building}
      </text>
      <text x={MARGIN_L - 46} y={holeY(r0) + 16} fontSize="5.5" fill={active ? "#7c3aed" : "#999"} fontFamily="monospace">
        {ch.gpio}
      </text>
    </g>
  );
}

export default function BreadboardGuide() {
  const [hoveredCh, setHoveredCh] = useState(null);
  const [showAll, setShowAll] = useState(true);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "0.5rem 0" }}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
        <button
          onClick={() => { setShowAll(true); setHoveredCh(null); }}
          style={{
            padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--color-border-secondary)",
            background: showAll && !hoveredCh ? "var(--color-background-info)" : "var(--color-background-secondary)",
            color: "var(--color-text-primary)", fontSize: "13px", cursor: "pointer", fontWeight: 500
          }}
        >All channels</button>
        {CHANNELS.map(ch => (
          <button key={ch.id}
            onClick={() => { setShowAll(false); setHoveredCh(ch.id); }}
            style={{
              padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--color-border-secondary)",
              background: hoveredCh === ch.id ? "#9333ea22" : "var(--color-background-secondary)",
              color: hoveredCh === ch.id ? "#9333ea" : "var(--color-text-primary)",
              fontSize: "12px", cursor: "pointer", fontWeight: hoveredCh === ch.id ? 600 : 400
            }}
          >{ch.id}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <svg viewBox={`0 0 ${BOARD_W + 120} ${BOARD_H}`} width="100%" style={{ minWidth: "600px", maxHeight: "85vh" }}>
          <rect x={MARGIN_L - 4} y={MARGIN_T - 12} width={BOARD_W - MARGIN_L + 8} height={60 * HOLE_GAP + 16} rx={6} fill="#f5f1e8" stroke="#ccc" strokeWidth={0.5}/>

          <rect x={holeX("+L") - 2} y={MARGIN_T - 10} width={RAIL_W} height={60 * HOLE_GAP + 12} rx={2} fill="#dc262611" stroke="#dc2626" strokeWidth={0.3}/>
          <rect x={holeX("-L") - 2} y={MARGIN_T - 10} width={RAIL_W} height={60 * HOLE_GAP + 12} rx={2} fill="#2563eb11" stroke="#2563eb" strokeWidth={0.3}/>
          <rect x={holeX("-R") - 2} y={MARGIN_T - 10} width={RAIL_W} height={60 * HOLE_GAP + 12} rx={2} fill="#2563eb11" stroke="#2563eb" strokeWidth={0.3}/>
          <rect x={holeX("+R") - 2} y={MARGIN_T - 10} width={RAIL_W} height={60 * HOLE_GAP + 12} rx={2} fill="#dc262611" stroke="#dc2626" strokeWidth={0.3}/>

          <text x={holeX("+L")+5} y={MARGIN_T - 16} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700">+</text>
          <text x={holeX("-L")+5} y={MARGIN_T - 16} textAnchor="middle" fontSize="8" fill="#2563eb" fontWeight="700">-</text>
          <text x={holeX("-R")+5} y={MARGIN_T - 16} textAnchor="middle" fontSize="8" fill="#2563eb" fontWeight="700">-</text>
          <text x={holeX("+R")+5} y={MARGIN_T - 16} textAnchor="middle" fontSize="8" fill="#dc2626" fontWeight="700">+</text>

          {COLS_LEFT.map(c => <text key={c} x={holeX(c)} y={MARGIN_T - 16} textAnchor="middle" fontSize="6" fill="#888" fontFamily="monospace">{c}</text>)}
          {COLS_RIGHT.map(c => <text key={c} x={holeX(c)} y={MARGIN_T - 16} textAnchor="middle" fontSize="6" fill="#888" fontFamily="monospace">{c}</text>)}

          {Array.from({length: 60}, (_, i) => i + 1).map(row => (
            <g key={row}>
              <text x={holeX("a") - 8} y={holeY(row) + 2} textAnchor="end" fontSize="5" fill="#aaa" fontFamily="monospace">{row}</text>
              <text x={holeX("j") + 8} y={holeY(row) + 2} textAnchor="start" fontSize="5" fill="#aaa" fontFamily="monospace">{row}</text>
              {COLS_LEFT.map(c => <Hole key={c+row} col={c} row={row}/>)}
              {COLS_RIGHT.map(c => <Hole key={c+row} col={c} row={row}/>)}
            </g>
          ))}

          <text x={BOARD_W + 8} y={MARGIN_T - 6} fontSize="7" fill="#dc2626" fontWeight="600" fontFamily="sans-serif">
            Red(+) rail: 24V adapter (+) and all LED red(+) wires
          </text>
          <text x={BOARD_W + 8} y={MARGIN_T + 6} fontSize="7" fill="#2563eb" fontWeight="600" fontFamily="sans-serif">
            Blue(-) rail: 24V adapter (-) and ESP32 GND (common ground)
          </text>

          {CHANNELS.map(ch => (
            <Channel key={ch.id} ch={ch}
              active={showAll || hoveredCh === ch.id}
              onHover={(id) => { if (!showAll) return; setHoveredCh(id); }}
            />
          ))}

          <g opacity={0.9}>
            <rect x={MARGIN_L - 48} y={holeY(57)} width={44} height={30} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={0.5}/>
            <text x={MARGIN_L - 26} y={holeY(57) + 10} textAnchor="middle" fontSize="5.5" fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">ESP32-S3</text>
            <text x={MARGIN_L - 26} y={holeY(57) + 19} textAnchor="middle" fontSize="4.5" fill="#64748b" fontFamily="monospace">N16R8</text>
          </g>

          <g opacity={0.9}>
            <rect x={MARGIN_L - 48} y={holeY(57) + 36} width={44} height={20} rx={4} fill="#1a1a1a" stroke="#475569" strokeWidth={0.5}/>
            <text x={MARGIN_L - 26} y={holeY(57) + 49} textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="600" fontFamily="sans-serif">24V adapter</text>
          </g>
        </svg>
      </div>

      <div style={{
        marginTop: "12px", padding: "12px 14px",
        background: "var(--color-background-secondary)", borderRadius: "8px",
        fontSize: "13px", lineHeight: 1.7, color: "var(--color-text-secondary)"
      }}>
        <div style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "6px" }}>Wiring steps for each channel (same pattern, different rows):</div>
        <div><span style={{color:"#9333ea", fontWeight:600}}>1.</span> MOSFET legs into <code>f[row]</code>, <code>f[row+1]</code>, <code>f[row+2]</code> = Gate, Drain, Source</div>
        <div><span style={{color:"#d97706", fontWeight:600}}>2.</span> 220Ω resistor: <code>g[row]</code> to <code>g[row+4]</code></div>
        <div><span style={{color:"#0891b2", fontWeight:600}}>3.</span> 10kΩ resistor: <code>h[row]</code> to blue(-) GND rail</div>
        <div><span style={{color:"#2563eb", fontWeight:600}}>4.</span> Jumper wire: <code>h[row+2]</code> to blue(-) GND rail (Source to ground)</div>
        <div><span style={{color:"#2563eb", fontWeight:600}}>5.</span> ESP32 GPIO wire → <code>j[row+4]</code></div>
        <div><span style={{color:"#ea580c", fontWeight:600}}>6.</span> LED white(-) wire → <code>j[row+1]</code></div>
        <div><span style={{color:"#dc2626", fontWeight:600}}>7.</span> LED red(+) wire → red(+) rail</div>
        <div style={{marginTop:"8px", fontWeight:600, color:"var(--color-text-primary)"}}>Power (once):</div>
        <div>24V adapter (+) → red(+) rail</div>
        <div>24V adapter (-) → blue(-) rail</div>
        <div>ESP32 GND → blue(-) rail (common ground, critical)</div>
      </div>
    </div>
  );
}
