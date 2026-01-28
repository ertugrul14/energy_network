/**
 * GHOST NETWORK - Main Entry Point
 * Interactive simulation exposing AI infrastructure externalities
 */

import { GlobeVisualization } from './visualization/globe.js';
import { UIController } from './ui/controller.js';
import { simulationEngine } from './simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS } from './data/models.js';

class GhostNetworkApp {
  constructor() {
    this.globe = null;
    this.ui = null;
    this.isInitialized = false;
  }

  async init() {
    console.log('👻 GHOST NETWORK initializing...');
    console.log('Tracing the invisible infrastructure of AI');

    try {
      // Wait for DOM
      await this.waitForDOM();

      // Initialize globe visualization
      const container = document.getElementById('globe-container');
      this.globe = new GlobeVisualization(container);
      console.log('✓ Globe visualization initialized');

      // Initialize UI controller
      this.ui = new UIController(this.globe);
      console.log('✓ UI controller initialized');

      // Add keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Log available data for debugging
      this.logAvailableData();

      this.isInitialized = true;
      console.log('👻 GHOST NETWORK ready');
      console.log('—————————————————————');
      console.log('Select a city and workload to begin tracing');

    } catch (error) {
      console.error('Failed to initialize Ghost Network:', error);
      this.showFatalError(error);
    }
  }

  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // ESC - close modals
      if (e.key === 'Escape') {
        document.getElementById('info-modal').classList.add('hidden');
        document.getElementById('impact-dashboard').classList.add('hidden');
      }

      // Space - run simulation
      if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
        e.preventDefault();
        document.getElementById('run-simulation').click();
      }

      // Number keys - select layers
      if (e.key >= '1' && e.key <= '5') {
        const layers = ['all', 'electricity', 'water', 'emissions', 'materials'];
        const layer = layers[parseInt(e.key) - 1];
        const btn = document.querySelector(`.layer-btn[data-layer="${layer}"]`);
        if (btn) btn.click();
      }

      // I - toggle info modal
      if (e.key === 'i' || e.key === 'I') {
        const modal = document.getElementById('info-modal');
        modal.classList.toggle('hidden');
      }
    });
  }

  logAvailableData() {
    console.log('\nAvailable Cities:', Object.keys(CITIES).join(', '));
    console.log('Available Workloads:', Object.keys(WORKLOADS).join(', '));
    console.log('Available Datacenters:', Object.keys(DATACENTERS).join(', '));
  }

  showFatalError(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="loading-content">
          <div class="ghost-icon">⚠️</div>
          <h1>INITIALIZATION ERROR</h1>
          <p class="tagline">${error.message}</p>
          <p class="loading-text">Please refresh the page or check the console for details.</p>
        </div>
      `;
    }
  }
}

// Demo mode for showcasing
class DemoController {
  constructor(app) {
    this.app = app;
    this.demoScenarios = [
      { city: 'barcelona', workload: 'chatbot', datacenter: 'ireland', hour: 10 },
      { city: 'phoenix', workload: 'image', datacenter: 'arizona', hour: 15 },
      { city: 'lagos', workload: 'biometric', datacenter: 'singapore', hour: 8 },
      { city: 'dublin', workload: 'traffic', datacenter: 'finland', hour: 18 }
    ];
    this.currentScenario = 0;
  }

  runDemo() {
    console.log('🎬 Starting demo mode...');
    this.playScenario(this.currentScenario);
  }

  playScenario(index) {
    if (!this.app.isInitialized) return;

    const scenario = this.demoScenarios[index % this.demoScenarios.length];
    
    // Simulate button clicks
    const cityBtn = document.querySelector(`.city-btn[data-city="${scenario.city}"]`);
    const workloadBtn = document.querySelector(`.workload-btn[data-workload="${scenario.workload}"]`);
    const dcOption = document.querySelector(`input[value="${scenario.datacenter}"]`);
    const timeSlider = document.getElementById('time-slider');

    if (cityBtn) cityBtn.click();
    setTimeout(() => {
      if (workloadBtn) workloadBtn.click();
    }, 500);
    setTimeout(() => {
      if (dcOption) dcOption.checked = true;
      if (timeSlider) {
        timeSlider.value = scenario.hour;
        timeSlider.dispatchEvent(new Event('input'));
      }
    }, 1000);
    setTimeout(() => {
      document.getElementById('run-simulation').click();
    }, 1500);

    // Schedule next scenario
    this.currentScenario++;
    setTimeout(() => {
      this.playScenario(this.currentScenario);
    }, 15000);
  }
}

// Kiosk mode for exhibition display
class KioskController {
  constructor(app) {
    this.app = app;
    this.isKioskMode = false;
    this.idleTimeout = null;
    this.idleDelay = 60000; // 1 minute idle before auto-demo
  }

  enable() {
    this.isKioskMode = true;
    document.body.classList.add('kiosk-mode');
    this.startIdleTimer();
    
    // Listen for any interaction
    document.addEventListener('click', () => this.resetIdleTimer());
    document.addEventListener('mousemove', () => this.resetIdleTimer());
    document.addEventListener('touchstart', () => this.resetIdleTimer());
  }

  startIdleTimer() {
    this.idleTimeout = setTimeout(() => {
      this.onIdle();
    }, this.idleDelay);
  }

  resetIdleTimer() {
    clearTimeout(this.idleTimeout);
    this.startIdleTimer();
  }

  onIdle() {
    // Start demo mode when idle
    const demo = new DemoController(this.app);
    demo.runDemo();
  }
}

// Initialize application
const app = new GhostNetworkApp();
app.init();

// Expose for debugging and kiosk mode
window.ghostNetwork = app;
window.GhostNetworkDemo = DemoController;
window.GhostNetworkKiosk = KioskController;

// Check for kiosk mode in URL
if (window.location.search.includes('kiosk=true')) {
  const kiosk = new KioskController(app);
  setTimeout(() => kiosk.enable(), 3000);
}

// Check for demo mode in URL
if (window.location.search.includes('demo=true')) {
  const demo = new DemoController(app);
  setTimeout(() => demo.runDemo(), 4000);
}
