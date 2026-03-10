/**
 * EXHIBITION — Screen Controller
 * Runs on the big screen. Displays the globe visualization.
 * Listens for signals from the tablet via BroadcastChannel.
 */

import { GlobeVisualization } from '../visualization/globe.js';
import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS } from '../data/models.js';
import { SCENARIO_COMPONENTS } from './models.js';

// BroadcastChannel for tablet ↔ screen communication
const channel = new BroadcastChannel('ghost-network-exhibition');

class ScreenController {
  constructor() {
    this.globe = null;
    this.isShowingFlows = false;
    this.currentResults = null;  // Store original simulation results
    this.init();
  }

  async init() {
    // Initialize globe
    const container = document.getElementById('globe-container');
    this.globe = new GlobeVisualization(container);

    // Wait for map to load, then create markers
    this.globe.map.on('load', () => {
      this.globe.createAllLocationMarkers();
      console.log('[Screen] Globe ready, waiting for tablet…');
    });

    // Listen for messages from tablet
    channel.addEventListener('message', (e) => {
      this.handleTabletMessage(e.data);
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
        this.runVisualization(msg);
        break;

      case 'scenario-flow':
        this.runScenarioVisualization(msg);
        break;

      case 'idle':
        this.showIdle();
        break;
    }
  }

  showIdle() {
    const idle = document.getElementById('screen-idle');
    const infoBar = document.getElementById('screen-info-bar');
    const impact = document.getElementById('screen-impact');
    const legend = document.getElementById('screen-legend');
    const comparison = document.getElementById('screen-comparison');

    idle.classList.remove('hidden');
    infoBar.classList.add('hidden');
    impact.classList.add('hidden');
    legend.classList.add('hidden');
    comparison.classList.add('hidden');

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

      // Show impact metrics
      const impact = document.getElementById('screen-impact');
      document.getElementById('screen-electricity').textContent = results.electricity.withOverhead.toFixed(3);
      document.getElementById('screen-water').textContent = results.water.liters.toFixed(1);
      document.getElementById('screen-emissions').textContent = results.emissions.grams.toFixed(0);
      document.getElementById('screen-distance').textContent = Math.round(results.distance).toLocaleString();
      document.getElementById('screen-narrative').textContent = results.narrative.trim();
      impact.classList.remove('hidden');

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

      // Hide the original impact overlay, show comparison
      document.getElementById('screen-impact').classList.add('hidden');

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
