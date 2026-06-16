// step1.jsx — "BODY SCALE" step screen for AI for All
// Recreates the user's reference screen using the C · Hologram Terminal language:
// background HeroGlobe + thin grid + custom outline icons in the accent color.
// All icons are SVG; stroke="currentColor" so they inherit the cyan/amber accent.

// ─── Icon set ────────────────────────────────────────────────────────────
// Style rules:
//   - 40×40 viewBox, 1.4 stroke
//   - Round caps + joins
//   - Two-color accent allowed via .ix-dot (filled accent dots)
//   - Add a 1-2 corner brackets to echo the instrument-panel chrome
function IconFrame({ children, size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      {/* corner brackets */}
      <path d="M3 7 V3 H7" opacity="0.55" />
      <path d="M33 3 H37 V7" opacity="0.55" />
      <path d="M37 33 V37 H33" opacity="0.55" />
      <path d="M7 37 H3 V33" opacity="0.55" />
      {children}
    </svg>
  );
}

function IconChat() {
  return (
    <IconFrame>
      <path d="M10 14 H30 V25 H20 L15 30 V25 H10 Z" />
      <circle cx="15" cy="19.5" r="1" fill="currentColor" />
      <circle cx="20" cy="19.5" r="1" fill="currentColor" />
      <circle cx="25" cy="19.5" r="1" fill="currentColor" />
    </IconFrame>
  );
}

function IconImage() {
  return (
    <IconFrame>
      <rect x="9" y="11" width="22" height="18" rx="0.5" />
      <circle cx="15" cy="17" r="1.7" />
      <path d="M12 26 L17 21 L22 25 L26 21 L29 25" />
      <circle cx="29" cy="11" r="0.8" fill="currentColor" />
    </IconFrame>
  );
}

function IconTranslate() {
  return (
    <IconFrame>
      <circle cx="20" cy="20" r="10" />
      <path d="M10 20 H30" />
      <path d="M20 10 C16 14 16 26 20 30" />
      <path d="M20 10 C24 14 24 26 20 30" />
      <circle cx="20" cy="10" r="0.9" fill="currentColor" />
      <circle cx="20" cy="30" r="0.9" fill="currentColor" />
    </IconFrame>
  );
}

function IconVideo() {
  return (
    <IconFrame>
      <rect x="8" y="13" width="24" height="14" />
      <path d="M8 16 H32" opacity="0.7" />
      <path d="M8 24 H32" opacity="0.7" />
      <circle cx="12" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="16" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="20" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="24" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="28" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="12" cy="25.5" r="0.6" fill="currentColor" />
      <circle cx="16" cy="25.5" r="0.6" fill="currentColor" />
      <circle cx="20" cy="25.5" r="0.6" fill="currentColor" />
      <circle cx="24" cy="25.5" r="0.6" fill="currentColor" />
      <circle cx="28" cy="25.5" r="0.6" fill="currentColor" />
      <path d="M18 18 L24 20 L18 22 Z" fill="currentColor" />
    </IconFrame>
  );
}

function IconPDF() {
  return (
    <IconFrame>
      <path d="M12 9 H24 L29 14 V31 H12 Z" />
      <path d="M24 9 V14 H29" />
      <path d="M15 19 H26" opacity="0.85" />
      <path d="M15 23 H26" opacity="0.85" />
      <path d="M15 27 H22" opacity="0.85" />
      <circle cx="26" cy="11" r="0.6" fill="currentColor" />
    </IconFrame>
  );
}

function IconVoice() {
  return (
    <IconFrame>
      <rect x="17" y="9" width="6" height="14" rx="3" />
      <path d="M12 19 C12 24 16 27 20 27 C24 27 28 24 28 19" />
      <path d="M20 27 V32" />
      <path d="M16 32 H24" />
      <path d="M9 16 L11 18 L9 20" opacity="0.55" />
      <path d="M31 16 L29 18 L31 20" opacity="0.55" />
    </IconFrame>
  );
}

function IconBackground() {
  return (
    <IconFrame>
      {/* checker frame */}
      <path d="M8 12 H10 V14" opacity="0.65" />
      <path d="M30 12 H32 V14" opacity="0.65" />
      <path d="M8 28 V26 H10" opacity="0.65" />
      <path d="M32 28 V26 H30" opacity="0.65" />
      {/* figure */}
      <circle cx="20" cy="15" r="3" />
      <path d="M13 28 C13 22 18 21 20 21 C22 21 27 22 27 28" />
      {/* scissor / cut line */}
      <path d="M10 32 L30 8" strokeDasharray="1.5 2" opacity="0.55" />
    </IconFrame>
  );
}

function IconCode() {
  return (
    <IconFrame>
      <path d="M15 13 L9 20 L15 27" />
      <path d="M25 13 L31 20 L25 27" />
      <path d="M22 11 L18 29" opacity="0.6" />
      <circle cx="20" cy="20" r="1.2" fill="currentColor" />
    </IconFrame>
  );
}

// ─── City landmark icons (stylized, thin-line) ───────────────────────────
function CityIconFrame({ children }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none"
      stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block' }}>
      {/* ground line */}
      <path d="M6 35 H38" opacity="0.45" />
      <circle cx="6"  cy="35" r="0.9" fill="currentColor" opacity="0.7" />
      <circle cx="38" cy="35" r="0.9" fill="currentColor" opacity="0.7" />
      {children}
    </svg>
  );
}

// Barcelona — Sagrada Família spires
function CityIconBarcelona() {
  return (
    <CityIconFrame>
      {/* four spires of varying heights with crosses on top */}
      <path d="M14 35 V20 L16.5 13 L19 20 V35" />
      <path d="M19 35 V18 L22 9  L25 18 V35" />
      <path d="M25 35 V20 L27.5 14 L30 20 V35" />
      <path d="M14 35 V24 L11.5 19 L9 24 V35" opacity="0.85" />
      {/* tiny crosses */}
      <path d="M16.5 11 V13 M15.5 12 H17.5" />
      <path d="M22 7 V9   M21 8 H23" />
      <path d="M27.5 12 V14 M26.5 13 H28.5" />
      {/* arch openings */}
      <path d="M16 30 H18" opacity="0.6" />
      <path d="M21 28 H24" opacity="0.6" />
      <path d="M26 30 H28" opacity="0.6" />
    </CityIconFrame>
  );
}

// Riyadh — Kingdom Centre (rectangular tower with keyhole notch)
function CityIconRiyadh() {
  return (
    <CityIconFrame>
      <path d="M16 35 V14 H28 V35" />
      {/* keyhole opening at top */}
      <path d="M19 14 V11 H25 V14" />
      <path d="M19 11 C19 9 25 9 25 11" />
      {/* small antenna dot */}
      <circle cx="22" cy="7" r="1" fill="currentColor" />
      <path d="M22 9 V11" />
      {/* window grid */}
      <path d="M16 19 H28" opacity="0.55" />
      <path d="M16 23 H28" opacity="0.55" />
      <path d="M16 27 H28" opacity="0.55" />
      <path d="M16 31 H28" opacity="0.55" />
      <path d="M22 14 V35" opacity="0.45" />
      {/* foreground palm */}
      <path d="M9 35 V28" opacity="0.7" />
      <path d="M9 28 C7 26 6 26 5 27" opacity="0.7" />
      <path d="M9 28 C11 26 12 26 13 27" opacity="0.7" />
      <path d="M9 28 C8 25 8 24 7 23" opacity="0.7" />
      <path d="M9 28 C10 25 10 24 11 23" opacity="0.7" />
    </CityIconFrame>
  );
}

// Singapore — Marina Bay Sands silhouette
function CityIconSingapore() {
  return (
    <CityIconFrame>
      {/* three towers */}
      <path d="M10 35 V15 H14 V35" />
      <path d="M20 35 V13 H24 V35" />
      <path d="M30 35 V15 H34 V35" />
      {/* SkyPark deck across the top */}
      <path d="M8 13 L36 11" />
      <path d="M8 13 L36 11 L36 14 L8 16 Z" opacity="0.35" />
      {/* tiny edge dots */}
      <circle cx="8"  cy="13" r="0.9" fill="currentColor" />
      <circle cx="36" cy="11" r="0.9" fill="currentColor" />
      {/* window slits */}
      <path d="M10 22 H14" opacity="0.55" />
      <path d="M10 28 H14" opacity="0.55" />
      <path d="M20 22 H24" opacity="0.55" />
      <path d="M20 28 H24" opacity="0.55" />
      <path d="M30 22 H34" opacity="0.55" />
      <path d="M30 28 H34" opacity="0.55" />
    </CityIconFrame>
  );
}

// Nairobi — KICC (cylinder tower with disc top)
function CityIconNairobi() {
  return (
    <CityIconFrame>
      {/* tower */}
      <path d="M18 35 V14" />
      <path d="M26 35 V14" />
      <path d="M18 14 C18 11 26 11 26 14" />
      {/* saucer roof */}
      <path d="M14 12 C14 8 30 8 30 12" />
      <path d="M14 12 L30 12" opacity="0.65" />
      {/* antenna */}
      <path d="M22 8 V4" />
      <circle cx="22" cy="3" r="1" fill="currentColor" />
      {/* ribs */}
      <path d="M19 17 V32" opacity="0.55" />
      <path d="M22 17 V32" opacity="0.55" />
      <path d="M25 17 V32" opacity="0.55" />
      <path d="M18 22 H26" opacity="0.45" />
      <path d="M18 28 H26" opacity="0.45" />
      {/* acacia silhouette to the side */}
      <path d="M34 35 V28" opacity="0.7" />
      <path d="M30 28 C32 24 36 24 38 28" opacity="0.7" />
      <path d="M30 28 H38" opacity="0.45" />
    </CityIconFrame>
  );
}

// ─── Operation list ──────────────────────────────────────────────────────
const OPERATIONS = [
  { id: 'chat',      name: 'Chat with AI',         provider: 'ChatGPT',          Icon: IconChat       },
  { id: 'image',     name: 'Generate Image',       provider: 'DALL·E 3',         Icon: IconImage      },
  { id: 'translate', name: 'Real-Time Translation',provider: 'Google Translate', Icon: IconTranslate  },
  { id: 'video',     name: 'Generate Video',       provider: 'Sora',             Icon: IconVideo      },
  { id: 'pdf',       name: 'Summarize a PDF',      provider: 'Claude',           Icon: IconPDF        },
  { id: 'voice',     name: 'Clone a Voice',        provider: 'ElevenLabs',       Icon: IconVoice      },
  { id: 'bg',        name: 'Remove Background',    provider: 'Adobe Express',    Icon: IconBackground },
  { id: 'code',      name: 'Code with AI',         provider: 'Copilot',          Icon: IconCode       },
];

const STEP1_CITIES = [
  { id: 'es', code: 'ES', name: 'Barcelona', Icon: CityIconBarcelona },
  { id: 'sa', code: 'SA', name: 'Riyadh',    Icon: CityIconRiyadh    },
  { id: 'sg', code: 'SG', name: 'Singapore', Icon: CityIconSingapore },
  { id: 'ke', code: 'KE', name: 'Nairobi',   Icon: CityIconNairobi   },
];

// ─── The screen ──────────────────────────────────────────────────────────
function Step1BodyScale({ tweaks }) {
  const accent = tweaks.accent || '#5BD6E2';
  const fp = (window.FONT_PAIRS || {})[tweaks.fontPair] || { display: 'Space Grotesk', mono: 'JetBrains Mono' };

  const [city, setCity] = React.useState(null);   // selected city id
  const [op,   setOp]   = React.useState(null);   // selected operation id
  const [lang, setLang] = React.useState('EN');

  const cssVars = {
    '--accent': accent,
    '--display': `'${fp.display}'`,
    '--mono': `'${fp.mono}'`,
    '--cta': '#FF7A4A',
  };

  return (
    <div className="s1" style={cssVars}>
      {/* corner brackets */}
      <span className="br tl" />
      <span className="br tr" />
      <span className="br bl" />
      <span className="br brr" />

      {/* horizontal sweeping scan line */}
      <div className="hg-scan" />

      {/* background globe */}
      <div className="s1-globe">
        <HeroGlobe accent={accent} motion={tweaks.motion} onHover={() => {}} />
      </div>
      <div className="s1-globe-veil" />

      {/* === Top zone: step chip, close, lang === */}
      <div className="s1-top">
        <div className="s1-step-chip">
          <span>STEP 1</span>
        </div>
        <button className="s1-close" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round">
            <path d="M3 3 L11 11 M11 3 L3 11" />
          </svg>
        </button>
        <div className="s1-lang">
          {['EN','CA','ES'].map((L) => (
            <button
              key={L}
              className={`s1-lang-btn ${lang === L ? 'on' : ''}`}
              onClick={() => setLang(L)}
            >{L}</button>
          ))}
        </div>
      </div>

      {/* === Headline === */}
      <div className="s1-headline">
        <h1>BODY SCALE</h1>
        <p>YOUR PROMPT, YOUR DEVICE, YOUR ENERGY</p>
      </div>

      {/* === SELECT CITY === */}
      <div className="s1-section-label city">
        <span className="s1-dot" />
        <span>SELECT CITY</span>
        <span className="s1-rule" />
        <span className="s1-section-tag">04 OPTIONS</span>
      </div>
      <div className="s1-grid s1-cities">
        {STEP1_CITIES.map((c) => (
          <button
            key={c.id}
            className={`s1-cell s1-city ${city === c.id ? 'on' : ''}`}
            onClick={() => setCity(c.id)}
          >
            <div className="s1-city-inner">
              <div className="s1-city-icon" style={{ color: accent }}><c.Icon /></div>
              <div className="s1-city-code">{c.code}</div>
              <div className="s1-city-name">{c.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* === SELECT AI OPERATION === */}
      <div className="s1-section-label ops">
        <span className="s1-dot" />
        <span>SELECT AI OPERATION</span>
        <span className="s1-rule" />
        <span className="s1-section-tag">08 OPTIONS</span>
      </div>
      <div className="s1-grid s1-ops">
        {OPERATIONS.map(({ id, name, provider, Icon }) => (
          <button
            key={id}
            className={`s1-cell s1-op ${op === id ? 'on' : ''}`}
            onClick={() => setOp(id)}
          >
            <div className="s1-op-inner">
              <div className="s1-op-icon" style={{ color: accent }}><Icon /></div>
              <div className="s1-op-name">{name}</div>
              <div className="s1-op-provider">
                <span className="s1-prov-mark" />
                {provider}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* === Calculate Energy === */}
      <div className="s1-cta-wrap">
        <button className={`s1-cta ${city && op ? 'ready' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ marginRight: 10 }}>
            <path d="M7 0 L1.5 8 H6 L4.5 14 L12 5.5 H7.5 L9.5 0 Z" />
          </svg>
          CALCULATE ENERGY
          <span className="s1-cta-arrow">→</span>
        </button>
      </div>
    </div>
  );
}

window.Step1BodyScale = Step1BodyScale;
