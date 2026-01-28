/**
 * GHOST NETWORK - UI Controller
 * Handles user interface interactions
 */

import { gsap } from 'gsap';
import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS } from '../data/models.js';

export class UIController {
  constructor(globe) {
    this.globe = globe;
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.selectedDatacenter = 'arizona';
    this.currentHour = 14;
    this.simulationResults = null;

    this.init();
  }

  init() {
    this.bindCityButtons();
    this.bindWorkloadButtons();
    this.bindDatacenterOptions();
    this.bindLayerButtons();
    this.bindRunButton();
    this.bindTimeSlider();
    this.bindModalControls();
    this.bindDashboardControls();
    this.bindLocationPopup();
    
    // Setup globe click callback for location popups
    this.globe.setLocationClickCallback((type, id, x, y) => {
      this.showLocationPopup(type, id, x, y);
    });
    
    // Create all location markers on globe
    this.globe.createAllLocationMarkers();
    
    // Hide loading screen after initialization
    setTimeout(() => {
      this.hideLoadingScreen();
    }, 2500);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('hidden');
  }

  bindCityButtons() {
    const buttons = document.querySelectorAll('.city-btn');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update selection
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.selectedCity = btn.dataset.city;
        
        // Focus globe on city and highlight it
        const city = CITIES[this.selectedCity];
        if (city) {
          this.globe.focusOnLocation(city.coords);
          // Highlight the city boundary on the globe
          this.globe.highlightCity(this.selectedCity);
        }
        
        // Auto-select default datacenter
        if (city && city.defaultDatacenter) {
          this.selectDatacenter(city.defaultDatacenter);
        }
      });
    });
  }

  bindWorkloadButtons() {
    const buttons = document.querySelectorAll('.workload-btn');
    
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.selectedWorkload = btn.dataset.workload;
      });
    });
  }

  bindDatacenterOptions() {
    const options = document.querySelectorAll('input[name="datacenter"]');
    
    options.forEach(option => {
      option.addEventListener('change', () => {
        if (option.checked) {
          this.selectedDatacenter = option.value;
          
          // Highlight the datacenter on the globe
          this.globe.focusOnDatacenter(this.selectedDatacenter);
        }
      });
    });
  }

  selectDatacenter(id) {
    const options = document.querySelectorAll('input[name="datacenter"]');
    options.forEach(option => {
      option.checked = option.value === id;
    });
    this.selectedDatacenter = id;
    
    // Highlight the datacenter on the globe
    this.globe.highlightDatacenter(id);
  }

  bindLayerButtons() {
    const buttons = document.querySelectorAll('.layer-btn');
    const allBtn = document.querySelector('.layer-btn[data-layer="all"]');
    
    // Track active layers - start with all enabled
    this.activeLayers = {
      electricity: true,
      water: true,
      emissions: true,
      materials: true
    };
    
    // Individual layer buttons (not "all")
    const layerButtons = {
      electricity: document.querySelector('.layer-btn[data-layer="electricity"]'),
      water: document.querySelector('.layer-btn[data-layer="water"]'),
      emissions: document.querySelector('.layer-btn[data-layer="emissions"]'),
      materials: document.querySelector('.layer-btn[data-layer="materials"]')
    };
    
    // Handle "ALL FLOWS" button
    allBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('ALL FLOWS clicked');
      
      // Enable all layers
      this.activeLayers = {
        electricity: true,
        water: true,
        emissions: true,
        materials: true
      };
      
      // Update UI - ALL is active, individual buttons are not highlighted
      allBtn.classList.add('active');
      Object.values(layerButtons).forEach(btn => btn.classList.remove('active'));
      
      // Update globe
      this.globe.setAllLayersVisibility(true);
    });
    
    // Handle individual layer buttons
    Object.entries(layerButtons).forEach(([layer, btn]) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Layer clicked:', layer, 'current state:', this.activeLayers[layer]);
        
        // Toggle this layer
        this.activeLayers[layer] = !this.activeLayers[layer];
        const isNowActive = this.activeLayers[layer];
        
        console.log('New state:', isNowActive);
        
        // Update this button's visual
        if (isNowActive) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
        
        // Remove "all" active state since we're now in individual mode
        allBtn.classList.remove('active');
        
        // Update globe
        this.globe.setLayerVisibility(layer, isNowActive);
        
        // Check if all are now enabled - if so, reset to "all" mode
        const allEnabled = Object.values(this.activeLayers).every(v => v);
        if (allEnabled) {
          allBtn.classList.add('active');
          Object.values(layerButtons).forEach(b => b.classList.remove('active'));
        }
      });
    });
  }

  bindRunButton() {
    const runBtn = document.getElementById('run-simulation');
    
    runBtn.addEventListener('click', () => {
      if (!this.selectedCity || !this.selectedWorkload) {
        this.showError('Please select a city and workload');
        return;
      }
      
      this.runSimulation();
    });
  }

  bindTimeSlider() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    slider.addEventListener('input', () => {
      this.currentHour = parseInt(slider.value);
      display.textContent = `${this.currentHour.toString().padStart(2, '0')}:00`;
      
      // Re-run simulation if one is active
      if (this.simulationResults) {
        this.runSimulation();
      }
    });
  }

  bindModalControls() {
    const infoBtn = document.getElementById('info-toggle');
    const modal = document.getElementById('info-modal');
    const closeBtn = modal.querySelector('.modal-close');
    
    infoBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
    
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  bindDashboardControls() {
    const closeBtn = document.getElementById('close-dashboard');
    const dashboard = document.getElementById('impact-dashboard');
    
    closeBtn.addEventListener('click', () => {
      dashboard.classList.add('hidden');
    });
  }

  runSimulation() {
    // Configure simulation
    simulationEngine.configure({
      city: this.selectedCity,
      workload: this.selectedWorkload,
      datacenter: this.selectedDatacenter,
      hour: this.currentHour
    });

    try {
      // Run simulation
      this.simulationResults = simulationEngine.runSimulation();
      
      // Visualize flows on globe
      this.globe.visualizeFlows(this.simulationResults.flows);
      
      // Update dashboard
      this.updateDashboard(this.simulationResults);
      
      // Show dashboard
      const dashboard = document.getElementById('impact-dashboard');
      dashboard.classList.remove('hidden');
      
      // Focus on datacenter
      this.globe.focusOnLocation(this.simulationResults.datacenter.coords);
      
    } catch (error) {
      console.error('Simulation error:', error);
      this.showError('Failed to run simulation');
    }
  }

  updateDashboard(results) {
    // Update route info
    document.getElementById('route-from').textContent = results.city.name;
    document.getElementById('route-to').textContent = results.datacenter.name;
    document.getElementById('impact-workload').textContent = results.workload.name;

    // Debug log
    console.log('Simulation results:', {
      electricity: results.electricity.withOverhead,
      water: results.water.liters,
      emissions: results.emissions.grams
    });

    // Update impact values with animation
    this.animateValue('impact-electricity', results.electricity.withOverhead, 2);
    this.animateValue('impact-water', results.water.liters, 1);
    this.animateValue('impact-emissions', results.emissions.grams, 0);
    
    // Materials is qualitative
    document.getElementById('impact-materials').textContent = '—';

    // Update sources
    const elecCard = document.querySelector('.impact-card.electricity .impact-source');
    elecCard.textContent = `Grid: ${Math.round(results.electricity.fossilPercent)}% fossil`;
    
    const waterCard = document.querySelector('.impact-card.water .impact-source');
    waterCard.textContent = `Source: ${results.water.source.split('/')[0]}`;
    
    const emissionsCard = document.querySelector('.impact-card.emissions .impact-source');
    if (results.emissions.drift) {
      emissionsCard.textContent = `Drifts: ${results.emissions.drift.direction}`;
    }
    
    const materialsCard = document.querySelector('.impact-card.materials .impact-source');
    materialsCard.textContent = 'Cobalt: DRC | Silicon: China';

    // Update narrative
    document.getElementById('narrative-text').textContent = results.narrative.trim();

    // Highlight active stack layer based on workload intensity
    this.updateStackView(results);
  }

  animateValue(elementId, value, decimals = 0) {
    const element = document.getElementById(elementId);
    const start = parseFloat(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * easeOut;
      
      element.textContent = current.toFixed(decimals);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  updateStackView(results) {
    const layers = document.querySelectorAll('.stack-layer');
    
    // Remove all active states
    layers.forEach(layer => layer.classList.remove('active'));
    
    // Highlight relevant layers based on impact
    const intensity = results.workload.intensity;
    
    // Always highlight user (body)
    document.querySelector('.stack-layer[data-level="body"]').classList.add('active');
    
    // Highlight based on intensity
    if (intensity === 'continuous' || intensity === 'high') {
      document.querySelector('.stack-layer[data-level="earth"]').classList.add('active');
    }
    if (intensity === 'medium' || intensity === 'high') {
      document.querySelector('.stack-layer[data-level="cloud"]').classList.add('active');
    }
    
    document.querySelector('.stack-layer[data-level="city"]').classList.add('active');
  }

  showError(message) {
    // Simple error display - could be enhanced
    console.error(message);
    
    // Flash the run button
    const runBtn = document.getElementById('run-simulation');
    runBtn.style.background = 'linear-gradient(135deg, #ff4757, #c0392b)';
    
    setTimeout(() => {
      runBtn.style.background = '';
    }, 500);
  }

  bindLocationPopup() {
    const popup = document.getElementById('location-popup');
    const closeBtn = popup.querySelector('.popup-close');
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideLocationPopup();
    });
  }

  showLocationPopup(type, id, clickX, clickY) {
    console.log('showLocationPopup called:', type, id, 'at', clickX, clickY);
    const popup = document.getElementById('location-popup');
    const typeEl = document.getElementById('popup-type');
    const titleEl = document.getElementById('popup-title');
    const locationEl = document.getElementById('popup-location');
    const descEl = document.getElementById('popup-description');
    const statsEl = document.getElementById('popup-stats');
    
    // Position popup near click location
    const popupWidth = 320;
    const popupHeight = 400; // Approximate max height
    const padding = 20;
    
    // Calculate position, keeping popup on screen
    let left = clickX + padding;
    let top = clickY - 50;
    
    // Adjust if would go off right edge
    if (left + popupWidth > window.innerWidth - padding) {
      left = clickX - popupWidth - padding;
    }
    
    // Adjust if would go off bottom
    if (top + popupHeight > window.innerHeight - padding) {
      top = window.innerHeight - popupHeight - padding;
    }
    
    // Adjust if would go off top
    if (top < 80) {
      top = 80;
    }
    
    // Adjust if would go off left
    if (left < padding) {
      left = padding;
    }
    
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    
    let data, statsHTML;
    
    if (type === 'city') {
      data = CITIES[id];
      if (!data) return;
      
      typeEl.textContent = 'CITY';
      typeEl.className = 'popup-type';
      titleEl.textContent = data.name;
      locationEl.textContent = `${data.country} ${data.flag}`;
      descEl.textContent = data.context;
      
      statsHTML = `
        <div class="popup-stat">
          <span class="popup-stat-label">Population</span>
          <span class="popup-stat-value">${(data.population / 1000000).toFixed(1)}M</span>
        </div>
        <div class="popup-stat">
          <span class="popup-stat-label">Coordinates</span>
          <span class="popup-stat-value">${data.coords.lat.toFixed(2)}°, ${data.coords.lng.toFixed(2)}°</span>
        </div>
        <div class="popup-stat">
          <span class="popup-stat-label">Default Datacenter</span>
          <span class="popup-stat-value">${DATACENTERS[data.defaultDatacenter]?.name || data.defaultDatacenter}</span>
        </div>
      `;
    } else if (type === 'datacenter') {
      data = DATACENTERS[id];
      if (!data) return;
      
      typeEl.textContent = 'DATA CENTER';
      typeEl.className = 'popup-type datacenter';
      titleEl.textContent = data.name;
      locationEl.textContent = data.location;
      descEl.textContent = `Operated by ${data.operator}. Carbon intensity: ${data.energy.carbonIntensity} gCO₂/kWh.`;
      
      // Calculate energy mix percentages
      const gridMix = data.energy.gridMix;
      const renewable = (gridMix.solar || 0) + (gridMix.wind || 0) + (gridMix.hydro || 0) + (gridMix.biomass || 0);
      const nuclear = gridMix.nuclear || 0;
      const fossil = 1 - renewable - nuclear;
      
      // Water stress class
      const waterClass = data.water.stressLevel === 'extreme' || data.water.stressLevel === 'high' 
        ? 'warning' 
        : data.water.stressLevel === 'low' ? 'success' : '';
      
      statsHTML = `
        <div class="popup-stat">
          <span class="popup-stat-label">PUE (Efficiency)</span>
          <span class="popup-stat-value">${data.energy.pue}</span>
        </div>
        <div class="popup-stat">
          <span class="popup-stat-label">Water Stress</span>
          <span class="popup-stat-value ${waterClass}">${data.water.stressLevel.toUpperCase()}</span>
        </div>
        <div class="popup-stat">
          <span class="popup-stat-label">Water Source</span>
          <span class="popup-stat-value" style="font-size: 10px;">${data.water.source.split('/')[0].trim()}</span>
        </div>
        <div class="popup-stat">
          <span class="popup-stat-label">Avg Temperature</span>
          <span class="popup-stat-value">${data.climate.avgTemp}°C</span>
        </div>
        <div class="popup-energy-mix">
          <div class="popup-energy-mix-title">Energy Grid Mix</div>
          <div class="popup-energy-bar">
            <div class="popup-energy-segment renewable" style="width: ${renewable * 100}%"></div>
            <div class="popup-energy-segment nuclear" style="width: ${nuclear * 100}%"></div>
            <div class="popup-energy-segment fossil" style="width: ${fossil * 100}%"></div>
          </div>
          <div class="popup-energy-legend">
            <span><span class="dot renewable"></span>${Math.round(renewable * 100)}% Renewable</span>
            <span><span class="dot nuclear"></span>${Math.round(nuclear * 100)}% Nuclear</span>
            <span><span class="dot fossil"></span>${Math.round(fossil * 100)}% Fossil</span>
          </div>
        </div>
      `;
    }
    
    statsEl.innerHTML = statsHTML;
    popup.classList.remove('hidden');
  }

  hideLocationPopup() {
    const popup = document.getElementById('location-popup');
    popup.classList.add('hidden');
  }
}
