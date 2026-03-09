/**
 * GHOST NETWORK - UI Controller
 * Handles user interface interactions
 */

import { gsap } from 'gsap';
import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS, ENERGY_REFERENCE } from '../data/models.js';

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
    this.bindConsumptionButton();
    this.bindTimeSlider();
    this.bindModalControls();
    this.bindDashboardControls();
    this.bindLocationPopup();
    this.bindScaleExplorer();
    
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

  bindConsumptionButton() {
    const btn = document.getElementById('run-consumption');

    btn.addEventListener('click', () => {
      if (!this.selectedCity || !this.selectedWorkload) {
        this.showError('Please select a city and workload');
        return;
      }
      this.runConsumptionMode();
    });
  }

  runConsumptionMode() {
    // Run normal simulation first to get energy data
    simulationEngine.configure({
      city: this.selectedCity,
      workload: this.selectedWorkload,
      datacenter: this.selectedDatacenter,
      hour: this.currentHour
    });

    try {
      const results = simulationEngine.runSimulation();
      this.simulationResults = results;

      // Enter consumption mode
      this.consumptionMode = true;

      const cityId = this.selectedCity;
      const aptRef = ENERGY_REFERENCE.apartment[cityId] || ENERGY_REFERENCE.apartment.default;
      const hoodSize = ENERGY_REFERENCE.neighborhoodSize[cityId] || ENERGY_REFERENCE.neighborhoodSize.default;
      const s = results.scaleBreakdown;

      // Reference building in the selected city centre – every scale pivots around this
      const refBuilding = ENERGY_REFERENCE.referenceBuilding[cityId]
        || ENERGY_REFERENCE.referenceBuilding.barcelona;
      this.consumptionRef = { lat: refBuilding.lat, lng: refBuilding.lng };
      this.consumptionRefName = refBuilding.name;

      // Get workload info for context-aware descriptions
      const workload = WORKLOADS[this.selectedWorkload];
      const workloadName = workload ? workload.name : 'AI workload';

      // Per-query/per-image/per-hour energy for multiplier calculations
      const perUnitKwh = workload?.perSession?.kwhPerQuery
        || workload?.perSession?.kwhPerImage
        || (workload?.perSession?.kwhPerHour ? workload.perSession.kwhPerHour / 60 : 0.003);
      const unitLabel = workload?.perSession?.kwhPerQuery ? 'queries'
        : workload?.perSession?.kwhPerImage ? 'images'
        : workload?.perSession?.kwhPerHour ? 'minutes of operation' : 'queries';

      // Interior scale
      const interiorKwh = s.interior.deviceWh / 1000;
      const flatMinutes = Math.round((interiorKwh / aptRef.kWhPerHour) * 60);
      const phonesCharged = Math.round(interiorKwh * 1000 / 12); // 12 Wh per phone charge

      // Building scale
      const buildingKwh = (s.building.computeWh + s.building.coolingWh) / 1000;
      const buildingMinutes = Math.round((buildingKwh / aptRef.kWhPerHour) * 60);
      const ledHours = Math.round(buildingKwh / 0.010);
      const unitsForOneApt = Math.ceil(aptRef.kWhPerHour / buildingKwh);

      // City scale
      const cityKwh = results.electricity.withOverhead;
      const cityApartments = cityKwh / aptRef.kWhPerHour;
      const unitsForNeighborhood = Math.ceil((hoodSize * aptRef.kWhPerHour) / cityKwh);
      const kettleBoils = Math.round(cityKwh / 0.1);

      // Planetary scale
      const planetaryKwh = cityKwh * 1.12;
      const planetaryApartments = planetaryKwh / aptRef.kWhPerHour;
      const evKm = (planetaryKwh / 0.15).toFixed(1);

      this.consumptionScales = {
        interior: {
          kWh: interiorKwh,
          label: `Your device draws ${s.interior.deviceWh.toFixed(1)} Wh — a faint glow in one flat.`,
          infoText: `A single ${workloadName} session draws ${s.interior.deviceWh.toFixed(1)} Wh from your device. That's ${flatMinutes > 0 ? `enough to light a ${aptRef.label} for ${flatMinutes} minute${flatMinutes !== 1 ? 's' : ''}` : 'barely a flicker in one flat'}${phonesCharged > 0 ? `, or charge ${phonesCharged} smartphone${phonesCharged !== 1 ? 's' : ''}` : ''}.`,
          infoStat: `1 session = ${s.interior.deviceWh.toFixed(1)} Wh at the desk`
        },
        building: {
          kWh: buildingKwh,
          label: `The data centre burns ${buildingKwh.toFixed(3)} kWh — compute + cooling.`,
          infoText: `The server burns ${buildingKwh.toFixed(3)} kWh per session (compute + cooling). That could keep ${ledHours} LED bulb${ledHours !== 1 ? 's' : ''} lit for an hour. You'd need ${unitsForOneApt.toLocaleString()} ${unitLabel} to power one ${aptRef.label} for an hour.`,
          infoStat: `${unitsForOneApt.toLocaleString()} ${unitLabel} = 1 ${aptRef.label} for 1 hour`
        },
        city: {
          kWh: cityKwh,
          label: `Full grid draw: ${cityKwh.toFixed(3)} kWh — transmission and heat penalty included.`,
          infoText: `With grid losses included, one session pulls ${cityKwh.toFixed(3)} kWh from the ${results.city.name} grid. ${unitsForNeighborhood.toLocaleString()} ${unitLabel} could light up this entire neighborhood (${hoodSize} apartments) for one hour.${kettleBoils > 0 ? ` That's ${kettleBoils} electric kettle boil${kettleBoils !== 1 ? 's' : ''} per session.` : ''}`,
          infoStat: `${unitsForNeighborhood.toLocaleString()} ${unitLabel} = entire neighborhood for 1 hour`
        },
        planetary: {
          kWh: planetaryKwh,
          label: `Lifecycle ≈ ${planetaryKwh.toFixed(3)} kWh — embodied energy of hardware amortised per query.`,
          infoText: `Including embodied energy (mining, manufacturing, shipping the hardware), each session costs ${planetaryKwh.toFixed(3)} kWh lifecycle. That could drive an EV ${evKm} km. At scale: 1 million daily users of ${workloadName} consume ~${(planetaryKwh * 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} kWh/day — enough to power ${Math.round(planetaryKwh * 1000000 / (aptRef.kWhPerHour * 24)).toLocaleString()} homes for a day.`,
          infoStat: `1M users/day ≈ ${Math.round(planetaryKwh * 1000000 / (aptRef.kWhPerHour * 24)).toLocaleString()} homes powered daily`
        }
      };

      // Compute apartment / neighbourhood equivalences per scale
      Object.keys(this.consumptionScales).forEach(key => {
        const sc = this.consumptionScales[key];
        sc.apartments = sc.kWh / aptRef.kWhPerHour;
        sc.neighborhoodRatio = Math.min(sc.apartments / hoodSize, 1);
        sc.neighborhoodPercent = sc.neighborhoodRatio * 100;
        sc.aptLabel = aptRef.label;
      });

      // Populate the scale explorer values and show the panel
      this.updateScaleExplorer(results);

      // Populate consumption info blocks in each scale card
      this._populateConsumptionInfo();

      // Clear flow arcs so they don't occlude buildings
      this.globe.clearFlows();

      // Hide dashboard if open
      document.getElementById('impact-dashboard').classList.add('hidden');

      // Show banner and auto-select interior scale
      this.showEnergyBanner(`Reference: ${refBuilding.name} — click a scale to explore`);

      // Auto-expand the interior card and trigger building view
      this._autoSelectScaleCard('interior');

    } catch (error) {
      console.error('Consumption mode error:', error);
      this.showError('Failed to calculate energy consumption');
    }
  }

  /** Programmatically expand a scale card and trigger its consumption view */
  _autoSelectScaleCard(scaleName) {
    const cards = document.querySelectorAll('.scale-card');
    cards.forEach(c => {
      c.classList.remove('expanded');
      const d = c.querySelector('.scale-card-detail');
      if (d) d.classList.add('hidden');
    });
    const target = document.querySelector(`.scale-card[data-scale="${scaleName}"]`);
    if (target) {
      target.classList.add('expanded');
      const detail = target.querySelector('.scale-card-detail');
      if (detail) detail.classList.remove('hidden');
    }
    this.showConsumptionForScale(scaleName);
  }

  /** Show the floating energy info banner */
  showEnergyBanner(text) {
    let banner = document.getElementById('energy-banner');
    if (!banner) return;
    banner.querySelector('.energy-banner-text').textContent = text;
    banner.classList.remove('hidden');
  }

  hideEnergyBanner() {
    const banner = document.getElementById('energy-banner');
    if (banner) banner.classList.add('hidden');
  }

  /** Populate the consumption-info blocks inside each scale card */
  _populateConsumptionInfo() {
    ['interior', 'building', 'city', 'planetary'].forEach(scale => {
      const info = document.getElementById(`consumption-info-${scale}`);
      const text = document.getElementById(`consumption-text-${scale}`);
      const stat = document.getElementById(`consumption-stat-${scale}`);
      if (!info || !this.consumptionScales[scale]) return;

      text.textContent = this.consumptionScales[scale].infoText;
      stat.textContent = this.consumptionScales[scale].infoStat;
      info.classList.remove('hidden');
    });
  }

  /** Hide the consumption-info blocks */
  _hideConsumptionInfo() {
    ['interior', 'building', 'city', 'planetary'].forEach(scale => {
      const info = document.getElementById(`consumption-info-${scale}`);
      if (info) info.classList.add('hidden');
    });
  }

  /** When a scale card is clicked in consumption mode, show buildings */
  showConsumptionForScale(scale) {
    const data = this.consumptionScales[scale];
    if (!data) return;

    // Update banner with contextual info
    let headline;
    if (scale === 'planetary') {
      headline = `${data.kWh.toFixed(3)} kWh lifecycle — ${data.infoStat}`;
    } else if (scale === 'city') {
      headline = `${data.kWh.toFixed(3)} kWh from grid — ${data.infoStat}`;
    } else if (data.apartments >= 1) {
      headline = `${data.kWh.toFixed(3)} kWh — powers ${data.apartments.toFixed(1)} ${data.aptLabel}${data.apartments >= 2 ? 's' : ''} for 1 hour`;
    } else {
      const minutes = Math.max(1, Math.round(data.apartments * 60));
      headline = `${data.kWh.toFixed(3)} kWh — powers a ${data.aptLabel} for ${minutes} min`;
    }
    this.showEnergyBanner(headline);

    // Show 3D buildings centred on the reference building, with scale-aware colouring
    this.globe.showBuildingEnergy(
      scale,
      this.consumptionRef,
      data.neighborhoodRatio
    );
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
    // Exit consumption mode if active
    if (this.consumptionMode) {
      this.consumptionMode = false;
      this.consumptionScales = null;
      this.globe.hideBuildingEnergy();
      this.hideEnergyBanner();
      this._hideConsumptionInfo();
    }

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
      
      // Hide scale explorer (it belongs to consumption mode only)
      this.hideScaleExplorer();
      
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

  bindScaleExplorer() {
    // Close button
    const closeBtn = document.getElementById('close-scale-explorer');
    closeBtn.addEventListener('click', () => {
      this.hideScaleExplorer();
    });

    // Expand/collapse cards + move globe
    const cards = document.querySelectorAll('.scale-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const detail = card.querySelector('.scale-card-detail');
        const isExpanded = card.classList.contains('expanded');
        const scale = card.dataset.scale;

        // Collapse all first
        cards.forEach(c => {
          c.classList.remove('expanded');
          const d = c.querySelector('.scale-card-detail');
          if (d) d.classList.add('hidden');
        });

        // Toggle clicked card
        if (!isExpanded) {
          card.classList.add('expanded');
          if (detail) detail.classList.remove('hidden');

          // If in consumption mode, the globe is driven by showConsumptionForScale
          if (this.consumptionMode && this.consumptionScales) {
            this.showConsumptionForScale(scale);
          } else {
            // Normal trace mode: navigate globe to the relevant location
            this.navigateGlobeToScale(scale);
          }
        }
      });
    });
  }

  /**
   * Move the globe to the appropriate view for a given scale
   */
  navigateGlobeToScale(scale) {
    if (!this.simulationResults) return;

    const city = this.simulationResults.city;
    const dc = this.simulationResults.datacenter;
    const materials = this.simulationResults.materials;

    switch (scale) {
      case 'interior':
        // Zoom close to the user's city
        this.globe.focusOnLocationWithZoom(city.coords, 1.8, 1.5);
        break;

      case 'building':
        // Zoom into the data center
        this.globe.focusOnLocationWithZoom(dc.coords, 2.0, 1.5);
        break;

      case 'city':
        // Mid-range view showing the data center region (grid, water sources)
        this.globe.focusOnLocationWithZoom(dc.coords, 2.6, 1.5);
        break;

      case 'planetary':
        // Zoom out to show the full globe supply chains
        // Focus midpoint between city and a distant material source
        const midLat = (city.coords.lat + dc.coords.lat) / 2;
        const midLng = (city.coords.lng + dc.coords.lng) / 2;
        this.globe.focusOnLocationWithZoom({ lat: midLat, lng: midLng }, 4.0, 2.0);
        break;
    }
  }

  showScaleExplorer() {
    const explorer = document.getElementById('scale-explorer');
    explorer.classList.remove('hidden');

    // Shift legend and time control up
    const legend = document.getElementById('legend');
    const timeControl = document.getElementById('time-control');
    if (legend) legend.classList.add('shifted-up');
    if (timeControl) timeControl.classList.add('shifted-up');
  }

  hideScaleExplorer() {
    const explorer = document.getElementById('scale-explorer');
    explorer.classList.add('hidden');

    // Reset legend and time control position
    const legend = document.getElementById('legend');
    const timeControl = document.getElementById('time-control');
    if (legend) legend.classList.remove('shifted-up');
    if (timeControl) timeControl.classList.remove('shifted-up');

    // Exit consumption mode
    if (this.consumptionMode) {
      this.consumptionMode = false;
      this.consumptionScales = null;
      this.globe.hideBuildingEnergy();
      this.hideEnergyBanner();
      this._hideConsumptionInfo();
    }
  }

  updateScaleExplorer(results) {
    const s = results.scaleBreakdown;

    // Interior
    document.getElementById('scale-device-kwh').textContent = s.interior.deviceWh.toFixed(1);
    document.getElementById('scale-server-kwh').textContent = s.interior.serverWh.toFixed(1);
    document.getElementById('detail-laptop-watts').textContent = `${s.interior.laptopWatts} W`;
    document.getElementById('detail-network-watts').textContent = `${s.interior.networkWatts} W`;
    document.getElementById('detail-session-duration').textContent = `${s.interior.sessionMinutes} min`;
    document.getElementById('detail-gpu-demand').textContent = s.interior.gpuDemand;

    // Building
    document.getElementById('scale-compute-kwh').textContent = s.building.computeWh.toFixed(1);
    document.getElementById('scale-cooling-kwh').textContent = s.building.coolingWh.toFixed(1);
    document.getElementById('detail-pue').textContent = s.building.pue;
    document.getElementById('detail-cooling-pct').textContent = `${s.building.coolingPercent}%`;
    document.getElementById('detail-heat-penalty').textContent = `+${s.building.heatPenalty} extra`;
    document.getElementById('detail-cooling-water').textContent = `${s.building.coolingWaterLiters} L`;

    // City
    document.getElementById('scale-grid-carbon').textContent = s.city.gridCarbonIntensity;
    document.getElementById('scale-water-stress').textContent = s.city.waterStressLevel.toUpperCase();
    document.getElementById('detail-fossil-pct').textContent = `${s.city.fossilPercent}%`;
    document.getElementById('detail-water-source').textContent = s.city.waterSource;
    document.getElementById('detail-aquifer').textContent = s.city.aquiferDepletion;
    document.getElementById('detail-local-air').textContent = s.city.localAirImpact;

    // Planetary
    document.getElementById('scale-displacement-km').textContent = s.planetary.displacementKm.toLocaleString();
    document.getElementById('scale-co2-drift').textContent = s.planetary.co2DriftDirection;
    document.getElementById('detail-materials-from').textContent = s.planetary.materialSources;
    document.getElementById('detail-ewaste-to').textContent = s.planetary.ewasteDestination;
    document.getElementById('detail-emissions-drift').textContent = `${s.planetary.emissionsDriftKm.toLocaleString()} km ${s.planetary.co2DriftDirection}`;
    document.getElementById('detail-jurisdictions').textContent = s.planetary.jurisdictions;

    // Show the panel
    this.showScaleExplorer();
  }

  hideLocationPopup() {
    const popup = document.getElementById('location-popup');
    popup.classList.add('hidden');
  }
}
