# ENERGY NETWORK

> **The Material Geopolitics of AI**
> 
> An interactive urban-scale simulation that exposes how AI data centers silently reorganize the flows of electricity, water, emissions, and environmental risk across territories—without public consent.

---

## 🧠 What It Is

Every time a city says "smart" or a user says "prompt," an invisible network awakens:

- A server spins in a faraway desert
- A cooling tower pulls from a depleted aquifer
- A gas plant revs to meet GPU demand
- CO₂ is dumped—elsewhere

**Ghost Network maps these displacements.**

This is not about a single prompt. This is about the material geopolitics of AI.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` to explore the simulation.

### URL Parameters

- `?demo=true` - Automatically cycle through scenarios
- `?kiosk=true` - Exhibition mode with auto-demo on idle

---

## 💻 Interface

### Input: Choose City + Workload

**Cities:**
- 🇪🇸 Barcelona - European tech hub
- 🇳🇬 Lagos - Africa's largest city, emerging digital economy
- 🇺🇸 Phoenix - Desert metropolis with water scarcity
- 🇮🇪 Dublin - Major European data center hub

**Workloads:**
- 💬 AI Chatbot (LOW intensity)
- 🎨 Image Generator (HIGH intensity)
- 🚦 Traffic AI (MEDIUM intensity)
- 👁️ Biometric Security (CONTINUOUS)

### Output: Animated Ghost Lines

The map lights up showing:
- ⚡ Where electricity is pulled from
- 💧 Where water is consumed
- 🌫️ Where emissions occur
- ⛏️ Where e-waste ends up

All via animated "ghost lines" radiating from the city outward.

---

## 🔥 Layers of Exposure

| Layer | Visual Outcome | Data Source |
|-------|---------------|-------------|
| ⚡ Electricity | Power lines animate to fossil-heavy grids | Koomey 2020 |
| 💧 Water | Arrows to aquifers, rivers → volume withdrawn | Li et al. 2025 |
| 🌫️ Emissions | Atmospheric layer darkens → CO₂ clouds drift | IEA, IPCC |
| ⛏️ Land & Labor | Pop-up showing mined cobalt, discarded servers | Siddik et al. 2021 |

---

## 🌍 The Stack in Motion

The visualization switches between perspectives:

| Layer | Description |
|-------|-------------|
| 🌍 **Earth** | Materials + emissions |
| ☁️ **Cloud** | Data centers, routing paths |
| 🏙️ **City** | Who benefits |
| 🧍 **Body** | You, the user |

**You're not optimizing. You're tracing power.**

---

## 🎮 Interactive Features

### Workload Redirection

Choose where to process your request:

- **Arizona, USA** - ☀️ Solar available | 💧 Water stressed
- **Finland** - ❄️ Cool climate | ⚡ Grid mixed
- **Singapore** - 🔥 High cooling | 🛢️ Fossil heavy
- **Ireland** - 🍃 Wind power | 💨 Emissions trade

**Result:** Users see that there is no clean option, only tradeoffs.

### Time of Day

Adjust the time slider to see how impacts change:
- Water use spikes during peak heat hours
- Carbon intensity varies with renewable availability
- Electricity demand shifts throughout the day

---

## 📊 Impact Metrics

Each simulation calculates:

- **kWh** - Electricity consumed (including PUE overhead)
- **Liters** - Water withdrawn for cooling
- **gCO₂** - Greenhouse gas emissions
- **km²** - Land use for materials extraction

---

## 📚 Theory Grounding

### Bratton's Stack
Layered governance of AI across Earth, Cloud, City, Body

### Hyperobjects (Morton)
The nonlocality and viscosity of water and CO₂—entities massively distributed in time and space

### Planetary Boundaries
Water stress, carbon overshoot—we are operating beyond safe limits

### Post-Normal Times (Funtowicz & Ravetz)
No stable solution space, only complex entanglement

---

## 🧨 What Makes It Different

✅ **Systemic** - Not just a dashboard  
✅ **Spatial** - Rooted in geography and governance  
✅ **Political** - Shows asymmetry of harm/benefit  
✅ **Architectural** - Infrastructure is central  
✅ **Interactive** - Public becomes implicated  
✅ **Unresolvable** - Exposes, doesn't solve  

---

## 🚫 What This Project Avoids

❌ Simplistic "your query costs X" calculators  
❌ Cute metaphors (e.g., "like boiling kettles")  
❌ Gamification or greenwashing  
❌ Offering solutions (this is awareness, not atonement)  

---

## 📦 Deliverables

- 🌐 Web-based interactive map with simulation backend
- 🖥️ Kiosk-ready version with scripted flows (`?kiosk=true`)
- 🧾 Panel text: "AI Runs on Ghost Infrastructure"
- 📊 Impact ranges (kWh, liters, CO₂, km² land use) per location

---

## 📖 Panel Text: AI Runs on Ghost Infrastructure

> Every smart system is connected to unsmart places.  
> Every AI decision draws water in a place you've never heard of.  
> Every promise of "green AI" hides a network of deferred costs.  
> 
> This isn't about reducing. It's about revealing.

---

## 🔧 Technical Architecture

```
ghost-network/
├── index.html              # Main HTML shell
├── package.json            # Dependencies (Three.js, GSAP)
├── vite.config.js          # Build configuration
└── src/
    ├── main.js             # Application entry point
    ├── data/
    │   └── models.js       # Cities, datacenters, workloads, materials
    ├── simulation/
    │   └── engine.js       # Impact calculation engine
    ├── visualization/
    │   └── globe.js        # Three.js 3D globe + ghost lines
    ├── ui/
    │   └── controller.js   # User interface handlers
    └── styles/
        └── main.css        # Dark, ominous interface styling
```

### Key Technologies

- **Three.js** - 3D globe rendering with custom shaders
- **GSAP** - Smooth animations and transitions
- **Vite** - Fast development and optimized builds

---

## 📚 Data Sources

| Source | Use |
|--------|-----|
| Koomey, J. (2020) | Data center energy efficiency |
| Li et al. (2025) | Water consumption of AI systems |
| Siddik et al. (2021) | Data center water footprint |
| IEA / IPCC | Global emissions data |
| WRI Aqueduct | Water stress levels |
| Patterson et al. (2022) | ML carbon footprint |
| Luccioni et al. (2023) | Image generation energy |

---

## ⚠️ Disclaimer

Ghost Network exposes asymmetry. It does not offer absolution.

There is no "green" prompt. There are only tradeoffs—and choices about who bears them.

---

## 🎓 For Exhibition

### Kiosk Setup

1. Build the project: `npm run build`
2. Serve from `dist/` folder
3. Open in fullscreen browser with `?kiosk=true`
4. Set display to not sleep

### Suggested Display

- Large touchscreen (42"+) or projection
- Dark environment to emphasize glow effects
- Accompanying panel with "AI Runs on Ghost Infrastructure" text

---

## License

MIT - But remember: the externalities have no license.

---

*👻 Ghost Network - Because every prompt has a place it displaces to.*
