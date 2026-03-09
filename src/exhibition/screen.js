/**
 * EXHIBITION — Screen Controller
 * Runs on the big screen. Displays the globe visualization.
 * Listens for signals from the tablet via BroadcastChannel.
 */

import { GlobeVisualization } from '../visualization/globe.js';
import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS } from '../data/models.js';

// BroadcastChannel for tablet ↔ screen communication
const channel = new BroadcastChannel('ghost-network-exhibition');

class ScreenController {
  constructor() {
    this.globe = null;
    this.isShowingFlows = false;
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

    idle.classList.remove('hidden');
    infoBar.classList.add('hidden');
    impact.classList.add('hidden');
    legend.classList.add('hidden');

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

      // Hide idle overlay
      document.getElementById('screen-idle').classList.add('hidden');

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
}

// Boot
new ScreenController();
