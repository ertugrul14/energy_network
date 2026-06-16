/**
 * EXHIBITION — Screen Controller
 * Runs on the big screen. Displays the globe visualization.
 * Listens for signals from the tablet via BroadcastChannel.
 */

import { GlobeVisualization } from '../visualization/globe.js';
import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS } from '../data/models.js';
import { SCENARIO_COMPONENTS } from './models.js';
import { i18n } from '../i18n/i18n.js';
import { createBridge } from './ws-bridge.js';
import { NarrativeDirector } from './narrative.js';

// WebSocket bridge for tablet ↔ screen communication
const channel = createBridge('screen');

// Destination name → approximate coordinates for flow visualization
const DESTINATION_COORDS = {
  'Stockholm':                { lat: 59.3293, lng: 18.0686 },
  'Hamina (Finland)':         { lat: 60.5693, lng: 27.1878 },
  'Dublin (serves EMEA)':     { lat: 53.4055, lng: -6.3725 },
  'Paris (France)':           { lat: 48.8566, lng: 2.3522 },
  'Paris':                    { lat: 48.8566, lng: 2.3522 },
  'Virginia (serves N. America)': { lat: 39.0438, lng: -77.4874 },
  'The Dalles, Oregon':       { lat: 45.5946, lng: -121.1787 },
  'Columbus, Ohio':           { lat: 39.9612, lng: -82.9988 },
  'Central Ohio':             { lat: 40.0, lng: -82.9 },
  'Changhua County (Taiwan)': { lat: 24.0518, lng: 120.5161 },
  'Inzai City (Japan)':       { lat: 35.8319, lng: 140.1462 },
  'Tokyo (serves Asia Pacific)': { lat: 35.6762, lng: 139.6503 },
  'Jakarta (Indonesia)':      { lat: -6.2088, lng: 106.8456 },
  'Chennai':                  { lat: 13.0827, lng: 80.2707 },
  'Mumbai':                   { lat: 19.0760, lng: 72.8777 },
  'Pune':                     { lat: 18.5204, lng: 73.8567 },
};

// Words to colour-highlight in the narrator
const NARRATOR_HIGHLIGHTS = [
  { pattern: /(\d[\d,.]*\s*km\b)/g,          cls: 'hl-distance' },
  { pattern: /(\d[\d,.]*\s*kWh\b)/g,         cls: 'hl-electricity' },
  { pattern: /(\d[\d,.]*\s*(liters?|litres?|mL\b))/gi, cls: 'hl-water' },
  { pattern: /(\d[\d,.]*g?\s*CO[₂2])/g,      cls: 'hl-emissions' },
  { pattern: /(\d+%\s*fossil[- ]fueled?)/gi,  cls: 'hl-emissions' },
];

// Break text into an array of {char, cls|null} so the typewriter can
// colour individual characters that fall inside a highlight range.
function parseChars(text) {
  const upper = text.toUpperCase();
  // Collect all highlight ranges
  const ranges = [];
  for (const { pattern, cls } of NARRATOR_HIGHLIGHTS) {
    const p = new RegExp(pattern.source, pattern.flags);
    let m;
    while ((m = p.exec(upper)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length, cls });
    }
  }
  return Array.from(upper).map((char, i) => {
    const range = ranges.find(r => i >= r.start && i < r.end);
    return { char, cls: range ? range.cls : null };
  });
}

class ScreenController {
  constructor() {
    this.globe = null;
    this.isShowingFlows = false;
    this.currentResults = null;
    this._narratorTimers = [];
    this._scaleCycleTimer = null;
    this._showingMass = false;
    this.MASS_MULTIPLIER = 40000;
    this.narrativeDirector = null;
    this.exhibitData = null;
    this.init();
  }

  async init() {
    // Initialize globe
    const container = document.getElementById('globe-container');
    this.globe = new GlobeVisualization(container);

    // Load exhibit data for narrative director
    try {
      const res = await fetch('/exhibit_data.json');
      if (res.ok) this.exhibitData = await res.json();
    } catch (e) {
      console.warn('[Screen] Could not load exhibit_data.json:', e);
    }

    // Wait for map to load, then create markers + narrative director
    this.globe.map.on('load', () => {
      this.globe.createAllLocationMarkers();
      if (this.exhibitData) {
        this.narrativeDirector = new NarrativeDirector(this.globe, this.exhibitData);
      }
      console.log('[Screen] Globe ready, waiting for tablet…');
    });

    // Listen for messages from tablet
    channel.onMessage((msg) => {
      if (!msg.type?.startsWith('_ws:')) this.handleTabletMessage(msg);
    });

    // Language switcher
    this.bindLangSwitcher();
    i18n.applyToDOM();
  }

  bindLangSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    this._updateLangButtons();

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        this._updateLangButtons();
      });
    });
  }

  _updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === i18n.currentLang);
    });
  }

  handleTabletMessage(msg) {
    console.log('[Screen] Message from tablet:', msg.type);

    switch (msg.type) {
      case 'started':
        // Tablet was picked up — could animate something subtle
        this.showIdle();
        break;

      case 'trace-energy-flow':
        if (msg.exhibitMin && msg.exhibitMax && this.narrativeDirector) {
          this.runNarrative(msg);
        } else if (msg.exhibitMin && msg.exhibitMax) {
          this.runExhibitVisualization(msg);
        } else {
          this.runVisualization(msg);
        }
        break;

      case 'scenario-flow':
        this.runScenarioVisualization(msg);
        break;

      case 'idle':
        this.showIdle();
        break;

      case 'lang-change':
        i18n.setLang(msg.lang);
        this._updateLangButtons();
        break;
    }
  }

  runNarrative({ city, workload, exhibitMin, exhibitMax }) {
    document.getElementById('screen-idle').classList.add('hidden');
    document.getElementById('screen-info-bar').classList.add('hidden');
    document.getElementById('screen-impact').classList.add('hidden');
    document.getElementById('screen-legend').classList.add('hidden');
    document.getElementById('screen-comparison').classList.add('hidden');
    document.getElementById('screen-side-panel').classList.add('hidden');
    this.clearNarrator();
    this._stopScaleCycle();

    if (this.isShowingFlows) {
      this.globe.clearFlows();
      this.isShowingFlows = false;
    }

    const cityData = CITIES[city];
    const workloadData = WORKLOADS[workload];
    if (!cityData) return;

    this.narrativeDirector.run(cityData, workloadData, exhibitMin, exhibitMax);
  }

  showIdle() {
    const idle = document.getElementById('screen-idle');
    const infoBar = document.getElementById('screen-info-bar');
    const impact = document.getElementById('screen-impact');
    const legend = document.getElementById('screen-legend');
    const comparison = document.getElementById('screen-comparison');
    const sidePanel = document.getElementById('screen-side-panel');

    idle.classList.remove('hidden');
    infoBar.classList.add('hidden');
    impact.classList.add('hidden');
    legend.classList.add('hidden');
    comparison.classList.add('hidden');
    sidePanel.classList.add('hidden');
    this.clearNarrator();
    this._stopScaleCycle();
    if (this.narrativeDirector) this.narrativeDirector.stop();

    this.currentResults = null;

    if (this.isShowingFlows) {
      this.globe.clearFlows();
      this.isShowingFlows = false;
    }

    // Reset globe view
    this.globe.map.flyTo({
      center: [15, 30],
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      duration: 2000
    });
  }

  runVisualization({ city, workload, datacenter, hour }) {
    // Configure & run simulation
    simulationEngine.configure({ city, workload, datacenter, hour });

    try {
      const results = simulationEngine.runSimulation();
      this.currentResults = results;

      // Hide idle overlay and comparison
      document.getElementById('screen-idle').classList.add('hidden');
      document.getElementById('screen-comparison').classList.add('hidden');

      // Show info bar
      const infoBar = document.getElementById('screen-info-bar');
      document.getElementById('screen-city').textContent = results.city.name;
      document.getElementById('screen-dc').textContent = results.datacenter.name;
      document.getElementById('screen-workload').textContent = results.workload.name;
      infoBar.classList.remove('hidden');

      // Show impact metrics (legacy bottom bar — kept hidden, side panel is primary)
      document.getElementById('screen-electricity').textContent = results.electricity.withOverhead.toFixed(3);
      document.getElementById('screen-water').textContent = results.water.liters.toFixed(1);
      document.getElementById('screen-emissions').textContent = results.emissions.grams.toFixed(0);
      document.getElementById('screen-distance').textContent = Math.round(results.distance).toLocaleString();

      // Build narrative — use min/max routing data if available for this city+workload
      const routing = WORKLOADS[workload]?.cityRouting?.[city];
      const narrativeText = routing
        ? this._buildRoutingNarrative(routing, results.city.name)
        : (() => {
            const fn = i18n.t('narrative_standard');
            return typeof fn === 'function' ? fn(results.narrativeData) : results.narrative.trim();
          })();

      document.getElementById('screen-narrative').textContent = narrativeText.trim();

      // Populate & show side panel
      document.getElementById('screen-side-panel').classList.remove('hidden');
      this._startScaleCycle();

      // Animate narrative sentence by sentence at the bottom
      this.animateNarrative(narrativeText.trim());

      // Show legend
      document.getElementById('screen-legend').classList.remove('hidden');

      // Visualize flows on globe
      this.globe.visualizeFlows(results.flows);
      this.isShowingFlows = true;

      // Focus on datacenter
      this.globe.focusOnLocation(results.datacenter.coords);

    } catch (err) {
      console.error('[Screen] Visualization error:', err);
    }
  }

  runExhibitVisualization({ city, workload, exhibitMin, exhibitMax }) {
    try {
      const cityData = CITIES[city];
      const minE = exhibitMin;
      const maxE = exhibitMax;

      this.currentResults = { city: cityData, workload: WORKLOADS[workload], min: minE, max: maxE };

      document.getElementById('screen-idle').classList.add('hidden');
      document.getElementById('screen-comparison').classList.add('hidden');

      const infoBar = document.getElementById('screen-info-bar');
      document.getElementById('screen-city').textContent = cityData?.name || city;
      document.getElementById('screen-dc').textContent = `${minE.destination} – ${maxE.destination}`;
      document.getElementById('screen-workload').textContent = i18n.tMap ? i18n.tMap('workload_names', workload) : (WORKLOADS[workload]?.name || workload);
      infoBar.classList.remove('hidden');

      document.getElementById('screen-electricity').textContent = `${minE.electricity_kWh.toFixed(1)} – ${maxE.electricity_kWh.toFixed(1)}`;
      document.getElementById('screen-water').textContent = `${minE.water_L.toFixed(1)} – ${maxE.water_L.toFixed(1)}`;
      document.getElementById('screen-emissions').textContent = `${minE.co2_kg.toFixed(1)} – ${maxE.co2_kg.toFixed(1)}`;
      document.getElementById('screen-distance').textContent = `${minE.distance_km.toLocaleString()} – ${maxE.distance_km.toLocaleString()}`;

      const provider = WORKLOADS[workload]?.provider || workload;
      const co2Ratio = maxE.co2_kg > 0 && minE.co2_kg > 0 ? (maxE.co2_kg / minE.co2_kg).toFixed(0) : '?';
      const narrativeText = [
        `At minimum, this ${provider} request travels ${minE.distance_km.toLocaleString()} km to ${minE.destination} — using ${minE.electricity_kWh.toFixed(1)} kWh, releasing ${minE.co2_kg.toFixed(1)} kg CO₂, and consuming ${minE.water_L.toFixed(1)} L of water.`,
        `At maximum, the same request routes to ${maxE.destination} — ${maxE.distance_km.toLocaleString()} km away — using ${maxE.electricity_kWh.toFixed(1)} kWh, releasing ${maxE.co2_kg.toFixed(1)} kg CO₂, and consuming ${maxE.water_L.toFixed(1)} L of water.`,
        `That is ${co2Ratio}× more carbon for the identical computation — the difference is not the request, it is the electricity grid powering the server.`,
      ].join(' ');

      document.getElementById('screen-narrative').textContent = narrativeText;
      document.getElementById('screen-side-panel').classList.remove('hidden');
      this.animateNarrative(narrativeText);
      document.getElementById('screen-legend').classList.remove('hidden');

      if (cityData?.coords) {
        this.globe.focusOnLocation(cityData.coords);
      }

      // Generate flow arcs
      const flows = [];
      if (cityData?.coords) {
        const minCoords = DESTINATION_COORDS[minE.destination];
        const maxCoords = DESTINATION_COORDS[maxE.destination];

        if (minCoords) {
          flows.push({
            type: 'electricity',
            from: { lat: cityData.coords.lat, lng: cityData.coords.lng },
            to: minCoords,
            label: `Min: ${minE.destination}`,
            intensity: 0.7
          });
          flows.push({
            type: 'data',
            from: { lat: cityData.coords.lat, lng: cityData.coords.lng },
            to: minCoords,
            label: 'Request',
            intensity: 1
          });
        }
        if (maxCoords && maxE.destination !== minE.destination) {
          flows.push({
            type: 'electricity',
            from: { lat: cityData.coords.lat, lng: cityData.coords.lng },
            to: maxCoords,
            label: `Max: ${maxE.destination}`,
            intensity: 1
          });
          flows.push({
            type: 'emissions',
            from: maxCoords,
            to: { lat: maxCoords.lat + 5, lng: maxCoords.lng + 8 },
            label: 'CO₂ drift',
            intensity: 0.6
          });
        }
      }

      if (flows.length > 0) {
        this.globe.clearFlows();
        this.globe.visualizeFlows(flows);
        this.isShowingFlows = true;
      }

    } catch (err) {
      console.error('[Screen] Exhibit visualization error:', err);
    }
  }

  _buildRoutingNarrative(routing, cityName) {
    const { platform, min, max } = routing;
    const co2Ratio = (max.co2_g / min.co2_g).toFixed(0);

    return [
      `At minimum, this ${platform} request travels ${min.distance_km.toLocaleString()} km to ${min.datacenter}, ${min.country} — using ${min.kWh} kWh, releasing ${min.co2_g} g CO₂, and consuming ${min.water_mL} mL of water.`,
      `At maximum, the same request routes to ${max.datacenter}, ${max.country} — ${max.distance_km.toLocaleString()} km from ${cityName} — using ${max.kWh} kWh, releasing ${max.co2_g} g CO₂, and consuming ${max.water_mL} mL of water.`,
      `That is ${co2Ratio}× more carbon for the identical computation — the difference is not the request, it is the electricity grid powering the server.`,
      `${platform} runs on ${routing.operator}. No request fixes its own destination.`
    ].join(' ');
  }

  runScenarioVisualization({ city, workload, datacenter, hour, scenario }) {
    try {
      // If we don't have original results, run original simulation first
      if (!this.currentResults) {
        simulationEngine.configure({ city, workload, datacenter, hour });
        this.currentResults = simulationEngine.runSimulation();
      }

      const original = this.currentResults;

      // Clear existing flows and render scenario flows
      this.globe.clearFlows();
      this.globe.visualizeFlows(scenario.flows);
      this.isShowingFlows = true;

      // Hide the original impact overlay and side panel, show comparison
      document.getElementById('screen-impact').classList.add('hidden');
      document.getElementById('screen-side-panel').classList.add('hidden');
      this.clearNarrator();

      // Populate comparison panel
      const cmp = document.getElementById('screen-comparison');

      // Original values
      document.getElementById('cmp-orig-kwh').textContent = original.electricity.withOverhead.toFixed(3);
      document.getElementById('cmp-orig-water').textContent = original.water.liters.toFixed(1);
      document.getElementById('cmp-orig-co2').textContent = original.emissions.grams.toFixed(0);
      document.getElementById('cmp-orig-dist').textContent = Math.round(original.distance).toLocaleString();

      // Scenario values
      document.getElementById('cmp-scen-kwh').textContent = scenario.electricity.withOverhead.toFixed(3);
      document.getElementById('cmp-scen-water').textContent = scenario.water.liters.toFixed(1);
      document.getElementById('cmp-scen-co2').textContent = scenario.emissions.grams.toFixed(0);
      document.getElementById('cmp-scen-dist').textContent = Math.round(scenario.distance).toLocaleString();

      // Deltas
      this._setDelta('cmp-delta-kwh', original.electricity.withOverhead, scenario.electricity.withOverhead,  'kWh');
      this._setDelta('cmp-delta-water', original.water.liters, scenario.water.liters, 'L');
      this._setDelta('cmp-delta-co2', original.emissions.grams, scenario.emissions.grams, 'g');
      this._setDelta('cmp-delta-dist', original.distance, scenario.distance, 'km');

      // Components list
      const compEl = document.getElementById('comparison-components');
      compEl.innerHTML = scenario.components
        .map(id => SCENARIO_COMPONENTS[id])
        .filter(Boolean)
        .map(c => `<span class="comparison-chip">${c.icon} ${c.name}</span>`)
        .join('');

      cmp.classList.remove('hidden');

      // Focus globe on the city if local datacenter, otherwise datacenter
      if (scenario.components.includes('localDatacenter')) {
        const cityData = CITIES[city];
        if (cityData) this.globe.focusOnLocation(cityData.coords);
      }

    } catch (err) {
      console.error('[Screen] Scenario visualization error:', err);
    }
  }

  clearNarrator() {
    this._narratorTimers.forEach(t => clearTimeout(t));
    this._narratorTimers = [];
    document.getElementById('screen-narrator').innerHTML = '';
  }

  animateNarrative(text) {
    this.clearNarrator();

    const container = document.getElementById('screen-narrator');
    const sentences = text.match(/[^.!?]+[.!?—]+(?:\s|$)/g) || [text];

    const CHAR_MS    = 65;   // delay between each character
    const DISPLAY_MS = 5000; // hold time after typing finishes
    const EXIT_MS    = 600;  // matches CSS .exiting transition

    let sentenceIndex = 0;

    const showNext = () => {
      if (sentenceIndex >= sentences.length) return;

      const chars = parseChars(sentences[sentenceIndex].trim());
      sentenceIndex++;

      container.innerHTML = '';
      const el = document.createElement('div');
      el.className = 'narrator-sentence';
      container.appendChild(el);

      let i = 0;
      const typeNext = () => {
        if (i < chars.length) {
          const { char, cls } = chars[i++];
          const span = document.createElement('span');
          span.className = 'char' + (cls ? ' ' + cls : '');
          span.textContent = char;
          el.appendChild(span);
          const t = setTimeout(typeNext, CHAR_MS);
          this._narratorTimers.push(t);
        } else {
          // Typing done — hold, then exit; if more sentences follow, show them
          const exitT = setTimeout(() => {
            el.classList.add('exiting');
            // Loop back to first sentence after the last one
            if (sentenceIndex >= sentences.length) sentenceIndex = 0;
            const nextT = setTimeout(showNext, EXIT_MS);
            this._narratorTimers.push(nextT);
          }, DISPLAY_MS);
          this._narratorTimers.push(exitT);
        }
      };

      typeNext();
    };

    showNext();
  }

  _startScaleCycle() {
    this._stopScaleCycle();
    this._showingMass = false;
    this._updateScaleDisplay(false);

    this._scaleCycleTimer = setInterval(() => {
      const label = document.getElementById('sp-scale-label');
      const metrics = document.querySelector('.sp-metrics');

      label.classList.add('fading');
      metrics.classList.add('fading');

      setTimeout(() => {
        this._showingMass = !this._showingMass;
        this._updateScaleDisplay(this._showingMass);
        label.classList.remove('fading');
        metrics.classList.remove('fading');
      }, 600);
    }, 5000);
  }

  _stopScaleCycle() {
    if (this._scaleCycleTimer) {
      clearInterval(this._scaleCycleTimer);
      this._scaleCycleTimer = null;
    }
  }

  _updateScaleDisplay(mass) {
    const r = this.currentResults;
    if (!r) return;

    const label = document.getElementById('sp-scale-label');

    // Exhibit data format (min/max pre-computed)
    if (r.min && r.max) {
      const aiUsers = r.city?.aiUsers || 1;
      if (mass) {
        label.textContent = i18n.t ? i18n.t('scale_people')(aiUsers) : `${aiUsers.toLocaleString()} PEOPLE`;
        document.getElementById('sp-electricity').textContent = `${r.min.electricity_kWh.toFixed(1)} – ${r.max.electricity_kWh.toFixed(1)}`;
        document.getElementById('sp-water').textContent = `${r.min.water_L.toFixed(1)} – ${r.max.water_L.toFixed(1)}`;
        document.getElementById('sp-emissions').textContent = `${r.min.co2_kg.toFixed(1)} – ${r.max.co2_kg.toFixed(1)}`;
      } else {
        label.textContent = i18n.t ? i18n.t('scale_one_person') : '1 PERSON';
        document.getElementById('sp-electricity').textContent = `${(r.min.electricity_kWh / aiUsers).toFixed(6)} – ${(r.max.electricity_kWh / aiUsers).toFixed(6)}`;
        document.getElementById('sp-water').textContent = `${(r.min.water_L / aiUsers * 1000).toFixed(2)} – ${(r.max.water_L / aiUsers * 1000).toFixed(2)} mL`;
        document.getElementById('sp-emissions').textContent = `${(r.min.co2_kg / aiUsers * 1000).toFixed(2)} – ${(r.max.co2_kg / aiUsers * 1000).toFixed(2)} g`;
      }
      document.getElementById('sp-distance').textContent = `${r.min.distance_km.toLocaleString()} – ${r.max.distance_km.toLocaleString()}`;
      return;
    }

    // Simulation engine format
    const m = mass ? this.MASS_MULTIPLIER : 1;
    label.textContent = mass
      ? `${this.MASS_MULTIPLIER.toLocaleString()} PEOPLE`
      : '1 PERSON';

    const elec = r.electricity.withOverhead * m;
    const water = r.water.liters * m;
    const co2 = r.emissions.grams * m;
    const dist = r.distance;

    document.getElementById('sp-electricity').textContent = mass ? Math.round(elec).toLocaleString() : elec.toFixed(3);
    document.getElementById('sp-water').textContent = mass ? Math.round(water).toLocaleString() : water.toFixed(1);
    document.getElementById('sp-emissions').textContent = mass ? Math.round(co2).toLocaleString() : co2.toFixed(0);
    document.getElementById('sp-distance').textContent = Math.round(dist).toLocaleString();
  }

  _setDelta(elId, original, scenario, unit) {
    const el = document.getElementById(elId);
    const diff = scenario - original;
    const pct = original !== 0 ? (diff / original * 100) : 0;
    const sign = diff > 0 ? '+' : '';
    el.textContent = `${sign}${Math.round(pct)}%`;
    el.className = 'comparison-delta ' + (diff < 0 ? 'delta-good' : diff > 0 ? 'delta-bad' : 'delta-neutral');
  }
}

// Boot
new ScreenController();
