/**
 * EXHIBITION — Tablet Controller
 * Handles the 3-step tablet flow: Body Scale → City Scale → Planetary Scale
 * Communicates with the big screen via BroadcastChannel.
 */

import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS, ENERGY_REFERENCE } from '../data/models.js';
import { BUILDING_TYPES, NEIGHBORHOOD_POPULATION } from './models.js';
import { arduino } from './arduino.js';

// BroadcastChannel for tablet ↔ screen communication
const channel = new BroadcastChannel('ghost-network-exhibition');

class TabletController {
  constructor() {
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.selectedDatacenter = null;
    this.simulationResults = null;

    this.init();
  }

  init() {
    this.bindLanding();
    this.bindBodyScale();
    this.bindBodyResult();
    this.bindCityScale();
    this.bindPlanetaryScale();

    // Listen for LED events to update UI indicator
    window.addEventListener('arduino:light', (e) => {
      this.updateLedIndicator(e.detail.level);
    });
  }

  // ─── Navigation ────────────────────────────────────

  showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  // ─── STEP 0: Landing ──────────────────────────────

  bindLanding() {
    document.getElementById('btn-start').addEventListener('click', () => {
      this.showPage('body-scale');
      // Tell screen we've started
      channel.postMessage({ type: 'started' });
    });
  }

  // ─── STEP 1: Body Scale ───────────────────────────

  bindBodyScale() {
    const consumptionBtn = document.getElementById('btn-consumption');

    // City buttons
    document.querySelectorAll('#city-options .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#city-options .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedCity = btn.dataset.city;

        // Auto-select default datacenter
        const city = CITIES[this.selectedCity];
        if (city?.defaultDatacenter) {
          this.selectDatacenter(city.defaultDatacenter);
        }

        this.checkConsumptionReady(consumptionBtn);
      });
    });

    // Workload buttons
    document.querySelectorAll('#workload-options .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#workload-options .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedWorkload = btn.dataset.workload;
        this.checkConsumptionReady(consumptionBtn);
      });
    });

    // Datacenter buttons
    document.querySelectorAll('#dc-options .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#dc-options .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedDatacenter = btn.dataset.dc;
        this.checkConsumptionReady(consumptionBtn);
      });
    });

    // Consumption button
    consumptionBtn.addEventListener('click', () => {
      this.runBodySimulation();
    });
  }

  selectDatacenter(id) {
    document.querySelectorAll('#dc-options .opt-btn').forEach(b => b.classList.remove('active'));
    const target = document.querySelector(`#dc-options .opt-btn[data-dc="${id}"]`);
    if (target) target.classList.add('active');
    this.selectedDatacenter = id;
  }

  checkConsumptionReady(btn) {
    btn.disabled = !(this.selectedCity && this.selectedWorkload && this.selectedDatacenter);
  }

  runBodySimulation() {
    simulationEngine.configure({
      city: this.selectedCity,
      workload: this.selectedWorkload,
      datacenter: this.selectedDatacenter,
      hour: new Date().getHours()
    });

    try {
      this.simulationResults = simulationEngine.runSimulation();
      this.populateBodyResult();
      this.showPage('body-result');
    } catch (err) {
      console.error('Simulation error:', err);
    }
  }

  // ─── STEP 1b: Body Result ─────────────────────────

  populateBodyResult() {
    const results = this.simulationResults;
    const cityId = this.selectedCity;
    const aptRef = ENERGY_REFERENCE.apartment[cityId] || ENERGY_REFERENCE.apartment.default;
    const totalKwh = results.electricity.withOverhead;

    // Headline kWh
    document.getElementById('body-kwh').textContent = totalKwh.toFixed(4);

    // Apartment equivalence
    const aptHours = totalKwh / aptRef.kWhPerHour;
    const aptMinutes = Math.round(aptHours * 60);

    // Building animation
    const structure = document.getElementById('building-structure');
    const totalFloors = 8;
    const litFloors = Math.max(1, Math.min(totalFloors, Math.ceil(aptHours * totalFloors)));

    structure.innerHTML = '';
    for (let i = totalFloors; i >= 1; i--) {
      const floor = document.createElement('div');
      floor.className = 'building-floor' + (i <= litFloors ? ' lit' : '');
      // Add windows
      for (let w = 0; w < 4; w++) {
        const win = document.createElement('div');
        win.className = 'building-window' + (i <= litFloors ? ' lit' : '');
        floor.appendChild(win);
      }
      structure.appendChild(floor);
    }

    document.getElementById('building-label').textContent = aptRef.label;

    const insightEl = document.getElementById('building-insight');
    if (aptMinutes >= 60) {
      const h = Math.floor(aptMinutes / 60);
      const m = aptMinutes % 60;
      insightEl.textContent = `This could light a ${aptRef.label} for ${h} hour${h > 1 ? 's' : ''}${m > 0 ? ` ${m} min` : ''}`;
    } else if (aptMinutes > 0) {
      insightEl.textContent = `This could light a ${aptRef.label} for ${aptMinutes} minute${aptMinutes !== 1 ? 's' : ''}`;
    } else {
      insightEl.textContent = `This is barely a flicker in one ${aptRef.label}`;
    }

    // Equivalences
    const equivList = document.getElementById('equivalences');
    const equivalences = ENERGY_REFERENCE.equivalences;
    const kwhToWh = totalKwh * 1000;

    equivList.innerHTML = equivalences
      .filter(eq => kwhToWh / (eq.kWh * 1000) >= 0.01)
      .slice(0, 4)
      .map(eq => {
        const ratio = totalKwh / eq.kWh;
        const display = ratio >= 1 ? `${ratio.toFixed(1)}×` : `${(ratio * 100).toFixed(0)}% of`;
        return `<div class="equiv-item">
          <span class="equiv-value">${display}</span>
          <span class="equiv-label">${eq.label}</span>
        </div>`;
      }).join('');
  }

  bindBodyResult() {
    document.getElementById('btn-back-body').addEventListener('click', () => {
      this.showPage('body-scale');
    });

    document.getElementById('btn-to-city').addEventListener('click', () => {
      this.populateCityScale();
      this.showPage('city-scale');
    });
  }

  // ─── STEP 2: City Scale ───────────────────────────

  populateCityScale() {
    const results = this.simulationResults;
    const perSessionKwh = results.electricity.withOverhead;
    const totalKwh = perSessionKwh * NEIGHBORHOOD_POPULATION;

    document.getElementById('city-total-kwh').textContent = Math.round(totalKwh).toLocaleString();

    const workload = WORKLOADS[this.selectedWorkload];
    document.getElementById('city-desc').textContent =
      `If 40,000 people each ran one ${workload.name} session, they'd consume ${Math.round(totalKwh).toLocaleString()} kWh. Select a building to see its brightness on the physical model.`;

    // Building brightness cards
    const buildings = Object.values(BUILDING_TYPES).sort((a, b) => a.order - b.order);
    const cardsContainer = document.getElementById('building-cards');

    cardsContainer.innerHTML = buildings.map(b => `
      <div class="building-card" data-building="${b.id}" data-pwm="${b.pwm}">
        <div class="building-card-icon">${b.icon}</div>
        <div class="building-card-info">
          <h3>${b.name}</h3>
          <p class="building-card-desc">${b.description}</p>
          <div class="building-card-result">
            <span class="building-card-duration">${b.brightnessLabel}</span>
            <span class="building-card-context">Brightness ${b.pwm}/255</span>
          </div>
        </div>
        <div class="building-card-bar">
          <div class="building-card-fill" style="width: ${(b.pwm / 255) * 100}%"></div>
        </div>
      </div>
    `).join('');

    // Make building cards clickable → send brightness to Arduino
    cardsContainer.querySelectorAll('.building-card').forEach(card => {
      card.addEventListener('click', () => {
        const pwm = parseInt(card.dataset.pwm);
        cardsContainer.querySelectorAll('.building-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        arduino.sendBrightness(pwm);
      });
    });
  }

  bindCityScale() {
    // Connect Arduino button
    document.getElementById('btn-connect-arduino').addEventListener('click', async () => {
      const ok = await arduino.connect();
      if (ok) {
        document.getElementById('btn-connect-arduino').textContent = '✓ CONNECTED';
        document.getElementById('btn-connect-arduino').classList.add('connected');
      }
    });

    // Light up model button → send brightness to Arduino
    document.getElementById('btn-simulate').addEventListener('click', () => {
      const selected = document.querySelector('.building-card.selected');
      if (!selected) {
        const firstCard = document.querySelector('.building-card');
        if (firstCard) {
          firstCard.classList.add('selected');
          arduino.sendBrightness(parseInt(firstCard.dataset.pwm));
        }
      } else {
        arduino.sendBrightness(parseInt(selected.dataset.pwm));
      }
    });

    document.getElementById('btn-back-city').addEventListener('click', () => {
      arduino.turnOff();
      this.showPage('body-result');
    });

    document.getElementById('btn-to-planetary').addEventListener('click', () => {
      this.triggerPlanetary();
    });

    document.getElementById('btn-restart-city').addEventListener('click', () => {
      this.restart();
    });
  }

  restart() {
    arduino.turnOff();
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.selectedDatacenter = null;
    this.simulationResults = null;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-consumption').disabled = true;
    channel.postMessage({ type: 'idle' });
    this.showPage('landing');
  }

  updateLedIndicator(level) {
    const dot = document.getElementById('led-dot');
    const label = document.getElementById('led-label');
    if (!dot || !label) return;

    if (level > 0) {
      dot.classList.add('on');
      dot.style.setProperty('--led-brightness', `${level / 255}`);
      label.textContent = `LED ${level}/255`;
    } else {
      dot.classList.remove('on');
      label.textContent = 'LED OFF';
    }
  }

  // ─── STEP 3: Planetary Scale ──────────────────────

  triggerPlanetary() {
    const results = this.simulationResults;

    // Send simulation config to the big screen via BroadcastChannel
    channel.postMessage({
      type: 'trace-energy-flow',
      city: this.selectedCity,
      workload: this.selectedWorkload,
      datacenter: this.selectedDatacenter,
      hour: new Date().getHours()
    });

    // Populate summary on tablet
    const statsEl = document.getElementById('planetary-stats');
    statsEl.innerHTML = `
      <div class="planetary-stat">
        <span class="planetary-stat-value">${results.electricity.withOverhead.toFixed(3)}</span>
        <span class="planetary-stat-label">kWh consumed</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${results.water.liters.toFixed(1)}</span>
        <span class="planetary-stat-label">liters of water</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${results.emissions.grams.toFixed(0)}</span>
        <span class="planetary-stat-label">gCO₂ emitted</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${Math.round(results.distance).toLocaleString()}</span>
        <span class="planetary-stat-label">km displaced</span>
      </div>
    `;

    this.showPage('planetary-scale');
  }

  bindPlanetaryScale() {
    document.getElementById('btn-back-planetary').addEventListener('click', () => {
      this.showPage('city-scale');
      // Tell screen to return to idle
      channel.postMessage({ type: 'idle' });
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restart();
    });
  }
}

// Boot
new TabletController();
