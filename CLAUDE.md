# Claude Notes for Ghost Network

ENERGY NETWORK is an interactive, urban-scale simulation that visualizes how AI workloads shift electricity, water, emissions, and material burdens across regions. Users select cities, workloads, and data centers to trace tradeoffs through animated flows on a globe, revealing the hidden infrastructure and externalities behind “smart” services.

## Project summary
ENERGY NETWORK is an interactive urban-scale simulation that exposes the externalities of AI infrastructure (electricity, water, emissions, materials).

## Tech stack
- Vite (ES modules)
- mapbox-gl
- GSAP

## Run commands
```bash
npm install
npm run dev
npm run build
npm run preview
```
The dev server prints the local URL. The README mentions http://localhost:3000.

## URL parameters
- demo=true to auto-cycle scenarios
- kiosk=true to enable exhibition mode with idle auto-demo

## Architecture guide
- index.html is the primary entry page
- screen.html and tablet.html are alternate entry pages
- src/main.js bootstraps the app, demo, and kiosk controllers
- src/visualization/globe.js renders the globe view
- src/ui/controller.js handles UI interactions
- src/simulation/engine.js runs the simulation logic
- src/data/models.js defines cities, workloads, and datacenters
- src/styles/*.css contains global styling

## Editing notes
- Keep ES module imports consistent
- Prefer existing animation and UI patterns
- Avoid adding heavy dependencies without discussion
