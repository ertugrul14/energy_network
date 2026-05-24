/**
 * EXHIBITION — Tablet Controller
 * Handles the 3-step tablet flow: Body Scale → City Scale → Planetary Scale
 * Communicates with the big screen via BroadcastChannel.
 */

import { simulationEngine } from '../simulation/engine.js';
import { CITIES, DATACENTERS, WORKLOADS, ENERGY_REFERENCE } from '../data/models.js';
import { BUILDING_TYPES, NEIGHBORHOOD_POPULATION, SCENARIO_COMPONENTS } from './models.js';
import { arduino } from './arduino.js';
import { i18n } from '../i18n/i18n.js';
import { initLandingWorld } from './landing-world.js';

// BroadcastChannel for tablet ↔ screen communication
const channel = new BroadcastChannel('ghost-network-exhibition');

class TabletController {
  constructor() {
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.selectedDatacenter = null;
    this.simulationResults = null;
    this.selectedScenarioComponents = new Set();
    this.onboardStepIndex = 0;

    this.init();
  }

  init() {
    this._destroyLandingWorld = initLandingWorld('landing-world-canvas');
    this.bindLanding();
    this.bindOnboarding();
    this.bindBodyScale();
    this.bindBodyResult();
    this.bindCityScale();
    this.bindPlanetaryScale();
    this.bindScenario();
    this.bindLangSwitcher();

    i18n.applyToDOM();

    window.addEventListener('arduino:light', (e) => {
      this.updateLedIndicator(e.detail.level);
    });
  }

  bindLangSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    this._updateLangButtons();

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        this._updateLangButtons();
        // Notify screen of language change
        channel.postMessage({ type: 'lang-change', lang: btn.dataset.lang });
      });
    });
  }

  _updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === i18n.currentLang);
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
      if (this._destroyLandingWorld) { this._destroyLandingWorld(); this._destroyLandingWorld = null; }
      this.showPage('onboard-purpose');
      this.animatePurposeText();
      // Stop lang button pulse
      document.getElementById('lang-switcher').classList.remove('onboarding-lang');
    });
  }

  // ─── ONBOARDING ───────────────────────────────────

  bindOnboarding() {
    document.getElementById('btn-learn-how').addEventListener('click', () => {
      this.showPage('onboard-steps');
      this.onboardStepIndex = 0;
      this.populateOnboardSteps();
      this.revealNextOnboardStep();
    });

    document.getElementById('btn-onboard-next').addEventListener('click', () => {
      this.revealNextOnboardStep();
    });
  }

  animatePurposeText() {
    const el = document.getElementById('onboard-purpose-text');
    const text = i18n.t('onboard_purpose');
    const words = text.split(' ');
    el.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(' ');

    const wordEls = el.querySelectorAll('.word');
    let i = 0;
    const interval = setInterval(() => {
      if (i < wordEls.length) {
        wordEls[i].classList.add('visible');
        i++;
      } else {
        clearInterval(interval);
        const btn = document.getElementById('btn-learn-how');
        btn.classList.remove('hidden');
        btn.classList.add('visible');
      }
    }, 80);
  }

  populateOnboardSteps() {
    const steps = [
      { icon: '🏙️', titleKey: 'onboard_step1_title', descKey: 'onboard_step1_desc' },
      { icon: '💡', titleKey: 'onboard_step3_title', descKey: 'onboard_step3_desc' },
      { icon: '🌍', titleKey: 'onboard_step4_title', descKey: 'onboard_step4_desc' },
    ];

    const container = document.getElementById('onboard-steps-container');
    container.innerHTML = steps.map((s, idx) => `
      <div class="onboard-step-box" data-step="${idx}">
        <div class="onboard-step-box-icon">${s.icon}</div>
        <div class="onboard-step-box-content">
          <div class="onboard-step-box-title" data-text="${i18n.t(s.titleKey)}"></div>
          <div class="onboard-step-box-desc" data-text="${i18n.t(s.descKey)}"></div>
        </div>
      </div>
    `).join('');
  }

  typewriteElement(el, delay = 0) {
    const text = el.dataset.text;
    el.innerHTML = '';
    const chars = [...text];
    chars.forEach((char, i) => {
      if (char === ' ') {
        el.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        span.style.animationDelay = `${delay + i * 30}ms`;
        el.appendChild(span);
      }
    });
  }

  revealNextOnboardStep() {
    const boxes = document.querySelectorAll('#onboard-steps-container .onboard-step-box');
    const totalSteps = boxes.length;

    if (this.onboardStepIndex < totalSteps) {
      const box = boxes[this.onboardStepIndex];
      box.classList.add('visible');

      const title = box.querySelector('.onboard-step-box-title');
      const desc = box.querySelector('.onboard-step-box-desc');
      this.typewriteElement(title, 200);
      const titleLen = (title.dataset.text || '').length;
      this.typewriteElement(desc, 200 + titleLen * 30 + 150);

      this.onboardStepIndex++;

      if (this.onboardStepIndex >= totalSteps) {
        const btnText = document.getElementById('btn-onboard-next-text');
        btnText.textContent = i18n.t('btn_begin');
      }
    } else {
      this.showPage('body-scale');
      channel.postMessage({ type: 'started' });
    }
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

        const city = CITIES[this.selectedCity];
        if (city?.defaultDatacenter) {
          this.selectedDatacenter = city.defaultDatacenter;
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

    // Consumption button
    consumptionBtn.addEventListener('click', () => {
      this.runBodySimulation();
    });
  }

  checkConsumptionReady(btn) {
    btn.disabled = !(this.selectedCity && this.selectedWorkload);
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
      this.prepareBodyResult();
      this.showPage('body-result');
      this.animateBodyResultSequence();
    } catch (err) {
      console.error('Simulation error:', err);
    }
  }

  // ─── STEP 1b: Body Result ─────────────────────────

  _getObjectModels() {
    return {
      'LED bulb for 1 hour': `<div class="equiv-3d-object obj-led">
        <div class="obj-face front"></div><div class="obj-face back"></div>
        <div class="obj-face left"></div><div class="obj-face right"></div>
        <div class="obj-face top"></div><div class="obj-face bottom"></div>
      </div>`,
      'smartphone full charge': `<div class="equiv-3d-object obj-phone">
        <div class="obj-face front"></div><div class="obj-face back"></div>
        <div class="obj-face left"></div><div class="obj-face right"></div>
        <div class="obj-face top"></div><div class="obj-face bottom"></div>
      </div>`,
      'laptop for 1 hour': `<div class="equiv-3d-object obj-laptop">
        <div class="obj-face base front"></div><div class="obj-face base back"></div>
        <div class="obj-face base left"></div><div class="obj-face base right"></div>
        <div class="obj-face base top"></div>
        <div class="obj-face screen front"></div><div class="obj-face screen back"></div>
      </div>`,
      'electric kettle boil': `<div class="equiv-3d-object obj-kettle">
        <div class="obj-face front"></div><div class="obj-face back"></div>
        <div class="obj-face left"></div><div class="obj-face right"></div>
        <div class="obj-face top"></div><div class="obj-face bottom"></div>
        <div class="handle"></div>
      </div>`,
      'washing machine cycle': `<div class="equiv-3d-object obj-washer">
        <div class="obj-face front"></div><div class="obj-face back"></div>
        <div class="obj-face left"></div><div class="obj-face right"></div>
        <div class="obj-face top"></div><div class="obj-face bottom"></div>
      </div>`,
      'EV driven 1 km': `<div class="equiv-3d-object obj-ev">
        <div class="obj-face body-main"></div><div class="obj-face body-back"></div>
        <div class="obj-face body-top"></div>
        <div class="obj-face cabin"></div><div class="obj-face cabin-back"></div>
        <div class="wheel fl"></div><div class="wheel fr"></div>
        <div class="wheel bl"></div><div class="wheel br"></div>
      </div>`,
      'AC unit for 1 hour': `<div class="equiv-3d-object obj-ac">
        <div class="obj-face front"></div><div class="obj-face back"></div>
        <div class="obj-face left"></div><div class="obj-face right"></div>
        <div class="obj-face top"></div><div class="obj-face bottom"></div>
      </div>`,
      'hot shower (5 min)': `<div class="equiv-3d-object obj-shower">
        <div class="pipe"></div>
        <div class="head"></div>
        <div class="drops">
          <div class="drop"></div><div class="drop"></div>
          <div class="drop"></div><div class="drop"></div>
        </div>
      </div>`
    };
  }

  _buildInsightText(aptRef, aptHours) {
    const aptMinutes = Math.round(aptHours * 60);
    const aptSeconds = Math.round(aptHours * 3600);
    if (aptMinutes >= 60) {
      const h = Math.floor(aptMinutes / 60);
      const m = aptMinutes % 60;
      return `THIS 1 OPERATION COULD POWER A ${aptRef.label.toUpperCase()} FOR ${h} HOUR${h > 1 ? 'S' : ''}${m > 0 ? ` ${m} MIN` : ''}`;
    } else if (aptMinutes > 0) {
      return `THIS 1 OPERATION COULD POWER A ${aptRef.label.toUpperCase()} FOR ${aptMinutes} MINUTE${aptMinutes !== 1 ? 'S' : ''}`;
    } else if (aptSeconds > 0) {
      return `THIS 1 OPERATION COULD POWER A ${aptRef.label.toUpperCase()} FOR ${aptSeconds} SECOND${aptSeconds !== 1 ? 'S' : ''}`;
    }
    return `THIS IS A TINY FRACTION OF 1 ${aptRef.label.toUpperCase()}`;
  }

  prepareBodyResult() {
    const results = this.simulationResults;
    const cityId = this.selectedCity;
    const aptRef = ENERGY_REFERENCE.apartment[cityId] || ENERGY_REFERENCE.apartment.default;
    const totalKwh = results.electricity.withOverhead;
    const aptHours = totalKwh / aptRef.kWhPerHour;

    // Set kWh value (hidden until animation reveals it)
    document.getElementById('body-kwh').textContent = totalKwh.toFixed(4);

    // Build insight text
    this._insightText = this._buildInsightText(aptRef, aptHours);

    // Build the 3D building
    const buildingEl = document.getElementById('hero-building');
    const totalWindows = 40;
    const litCount = Math.max(1, Math.min(totalWindows, Math.round(aptHours * totalWindows)));
    const litSet = new Set();
    while (litSet.size < litCount) litSet.add(Math.floor(Math.random() * totalWindows));

    let windowIdx = 0;
    const makeWindows = () => {
      let html = '<div class="bld-windows">';
      for (let w = 0; w < 20; w++) {
        html += `<div class="bld-win${litSet.has(windowIdx) ? ' lit' : ''}"></div>`;
        windowIdx++;
      }
      html += '</div>';
      return html;
    };

    buildingEl.innerHTML = `
      <div class="bld-face front">${makeWindows()}</div>
      <div class="bld-face back">${makeWindows()}</div>
      <div class="bld-face left"></div>
      <div class="bld-face right"></div>
      <div class="bld-face top"></div>
      <div class="bld-face bottom"></div>
    `;

    // Build equivalence cards (all start hidden)
    const equivList = document.getElementById('equivalences');
    const equivalences = ENERGY_REFERENCE.equivalences;
    const objectModels = this._getObjectModels();

    equivList.innerHTML = equivalences
      .filter(eq => totalKwh / eq.kWh >= 0.01)
      .slice(0, 4)
      .map((eq, i) => {
        const ratio = totalKwh / eq.kWh;
        const display = ratio >= 1 ? `${ratio.toFixed(1)}×` : `${(ratio * 100).toFixed(0)}%`;
        const model = objectModels[eq.label] || objectModels['LED bulb for 1 hour'];
        const extraStyle = i % 2 === 1 ? 'animation-direction: reverse;' : '';
        const modelWithStyle = model.replace('class="equiv-3d-object', `style="${extraStyle}" class="equiv-3d-object`);
        return `<div class="equiv-3d-card anim-hidden">
          <div class="equiv-3d-scene">${modelWithStyle}</div>
          <span class="equiv-3d-value">${display}</span>
          <span class="equiv-3d-label">${eq.label}</span>
        </div>`;
      }).join('');

    // Reset animation states
    document.getElementById('result-building-wrap').classList.add('anim-hidden');
    document.getElementById('result-building-wrap').classList.remove('anim-visible');
    document.getElementById('result-energy-wrap').classList.add('anim-hidden');
    document.getElementById('result-energy-wrap').classList.remove('anim-visible');
    document.getElementById('result-intro-overlay').classList.remove('visible');
    document.getElementById('result-announce').classList.remove('visible');
    document.querySelector('.result-header').classList.add('anim-hidden');
    document.querySelector('.result-header').classList.remove('anim-visible');
    document.querySelector('.body-result-nav').classList.add('anim-hidden');
    document.querySelector('.body-result-nav').classList.remove('anim-visible');

    this.populateCalcBreakdown();
  }

  animateBodyResultSequence() {
    const STEP = 2000;
    const totalKwh = this.simulationResults.electricity.withOverhead;

    // Clear any previous animation timers
    if (this._bodyAnimTimers) this._bodyAnimTimers.forEach(t => clearTimeout(t));
    this._bodyAnimTimers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); this._bodyAnimTimers.push(t); };

    const introOverlay = document.getElementById('result-intro-overlay');
    const introText = document.getElementById('result-intro-text');
    const announce = document.getElementById('result-announce');
    const announceText = document.getElementById('result-announce-text');
    const buildingWrap = document.getElementById('result-building-wrap');
    const energyWrap = document.getElementById('result-energy-wrap');
    const header = document.querySelector('.result-header');
    const nav = document.querySelector('.body-result-nav');

    let t = 0;

    // ── 1: Big centered text
    introText.textContent = `THE ENERGY USED WITH THIS SINGLE OPERATION IS ${totalKwh.toFixed(4)} KWH`;
    introOverlay.classList.add('visible');

    // ── 2: Fade intro
    t += STEP;
    later(() => {
      introOverlay.classList.remove('visible');
    }, t);

    // ── 3: Header + energy column
    t += STEP;
    later(() => {
      header.classList.remove('anim-hidden');
      header.classList.add('anim-visible');
      energyWrap.classList.remove('anim-hidden');
      energyWrap.classList.add('anim-visible');
    }, t);

    // ── 4: Building + announce text
    t += STEP;
    later(() => {
      buildingWrap.classList.remove('anim-hidden');
      buildingWrap.classList.add('anim-visible');
      announceText.textContent = this._insightText;
      announce.classList.add('visible');
    }, t);

    // ── 5–8: Equivalence models one by one
    const cards = document.querySelectorAll('#equivalences .equiv-3d-card');
    cards.forEach((card) => {
      t += STEP;
      later(() => {
        card.classList.remove('anim-hidden');
        card.classList.add('anim-visible');
      }, t);
    });

    // ── Finally: nav buttons
    t += STEP;
    later(() => {
      nav.classList.remove('anim-hidden');
      nav.classList.add('anim-visible');
    }, t);
  }

  populateCalcBreakdown() {
    const r = this.simulationResults;
    const e = r.electricity;
    const workload = WORKLOADS[this.selectedWorkload];
    const dc = DATACENTERS[this.selectedDatacenter];
    const hour = new Date().getHours();
    const hourMod = e.withOverhead / (e.baseKwh * e.pue * e.heatPenalty) || 1;

    const baseFormula = `1 × ${workload.perOperation.kwhPerOperation} kWh (${workload.perOperation.label})`;

    const breakdown = document.getElementById('calc-breakdown');
    breakdown.innerHTML = `
      <div class="calc-step">
        <div class="calc-step-label">STEP 1 — BASE ENERGY (1 OPERATION)</div>
        <div class="calc-step-formula">${baseFormula}</div>
        <div class="calc-step-result">= ${e.baseKwh.toFixed(6)} kWh</div>
      </div>
      <div class="calc-step">
        <div class="calc-step-label">STEP 2 — DATACENTER OVERHEAD (PUE)</div>
        <div class="calc-step-formula">${e.baseKwh.toFixed(6)} × ${e.pue} (PUE)</div>
        <div class="calc-step-result">= ${(e.baseKwh * e.pue).toFixed(6)} kWh</div>
        <div class="calc-step-note">COOLING, NETWORKING, AND INFRASTRUCTURE AT ${dc.name.toUpperCase()}</div>
      </div>
      <div class="calc-step">
        <div class="calc-step-label">STEP 3 — CLIMATE HEAT PENALTY</div>
        <div class="calc-step-formula">${(e.baseKwh * e.pue).toFixed(6)} × ${e.heatPenalty} (HEAT)</div>
        <div class="calc-step-result">= ${(e.baseKwh * e.pue * e.heatPenalty).toFixed(6)} kWh</div>
        <div class="calc-step-note">HOT CLIMATES NEED MORE COOLING ENERGY</div>
      </div>
      <div class="calc-step">
        <div class="calc-step-label">STEP 4 — TIME OF DAY</div>
        <div class="calc-step-formula">${(e.baseKwh * e.pue * e.heatPenalty).toFixed(6)} × ${hourMod.toFixed(3)} (HOUR ${hour})</div>
        <div class="calc-step-result">= ${e.withOverhead.toFixed(6)} kWh</div>
      </div>
      <div class="calc-step" style="border-left-color: var(--emissions);">
        <div class="calc-step-label">TOTAL FOR 1 OPERATION</div>
        <div class="calc-step-result" style="font-size: 22px;">${e.withOverhead.toFixed(4)} kWh</div>
      </div>
    `;
  }

  bindBodyResult() {
    document.getElementById('btn-back-body').addEventListener('click', () => {
      this.showPage('body-scale');
    });

    document.getElementById('btn-to-city').addEventListener('click', () => {
      this.populateCityScale();
      this.showPage('city-scale');
    });

    // Calculation popup
    const popup = document.getElementById('calc-popup');
    document.getElementById('btn-calc-info').addEventListener('click', () => {
      popup.classList.remove('hidden');
    });
    document.getElementById('calc-popup-close').addEventListener('click', () => {
      popup.classList.add('hidden');
    });
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.classList.add('hidden');
    });
  }

  // ─── STEP 2: City Scale ───────────────────────────

  populateCityScale() {
    const results = this.simulationResults;
    const city = CITIES[this.selectedCity];
    const workload = WORKLOADS[this.selectedWorkload];
    const perOperationKwh = results.electricity.withOverhead;

    // Show single operation cost
    document.getElementById('single-op-kwh').textContent = perOperationKwh.toFixed(4);

    // Neighborhood scaling: 40,000 people × 1 operation each
    const totalKwh = perOperationKwh * NEIGHBORHOOD_POPULATION;

    document.getElementById('city-total-kwh').textContent = totalKwh.toFixed(1);

    document.getElementById('city-desc').textContent =
      `IF ALL 40,000 PEOPLE IN THIS NEIGHBORHOOD EACH DO 1 "${workload.name.toUpperCase()}" — THIS IS THE TOTAL ENERGY USED.`;

    // Building duration cards — calculate how long each building could run
    const buildings = Object.values(BUILDING_TYPES).sort((a, b) => a.order - b.order);
    const cardsContainer = document.getElementById('building-cards');

    cardsContainer.innerHTML = buildings.map(b => {
      const hoursCanRun = totalKwh / b.avgPowerKw;
      const durationText = this.formatDuration(hoursCanRun);

      return `
      <div class="building-card" data-building="${b.id}" data-pwm="${b.pwm}">
        <div class="building-card-icon">${b.icon}</div>
        <div class="building-card-info">
          <h3>${b.name.toUpperCase()}</h3>
          <div class="building-card-result">
            <span class="building-card-duration">${durationText}</span>
          </div>
        </div>
        <div class="building-card-bar">
          <div class="building-card-fill" style="width: ${Math.min(100, (hoursCanRun / 24) * 100)}%"></div>
        </div>
      </div>`;
    }).join('');

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

  formatDuration(hours) {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const h = Math.round(hours % 24);
      return h > 0 ? `${days} DAY${days > 1 ? 'S' : ''} ${h} HOURS` : `${days} DAY${days > 1 ? 'S' : ''}`;
    } else if (hours >= 1) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return m > 0 ? `${h} HOUR${h > 1 ? 'S' : ''} ${m} MIN` : `${h} HOUR${h > 1 ? 'S' : ''}`;
    } else {
      const m = Math.round(hours * 60);
      return m > 0 ? `${m} MINUTES` : 'LESS THAN 1 MINUTE';
    }
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
    this.selectedScenarioComponents.clear();
    this.onboardStepIndex = 0;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-consumption').disabled = true;
    document.getElementById('lang-switcher').classList.add('onboarding-lang');
    document.getElementById('btn-learn-how').classList.add('hidden');
    document.getElementById('btn-learn-how').classList.remove('visible');
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
        <span class="planetary-stat-label">${i18n.t('stat_kwh')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${results.water.liters.toFixed(1)}</span>
        <span class="planetary-stat-label">${i18n.t('stat_water')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${results.emissions.grams.toFixed(0)}</span>
        <span class="planetary-stat-label">${i18n.t('stat_co2')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${Math.round(results.distance).toLocaleString()}</span>
        <span class="planetary-stat-label">${i18n.t('stat_distance')}</span>
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

    document.getElementById('btn-create-scenario').addEventListener('click', () => {
      this.populateScenario();
      this.showPage('scenario');
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restart();
    });
  }

  // ─── STEP 4: Scenario ─────────────────────────────

  populateScenario() {
    this.selectedScenarioComponents.clear();
    const container = document.getElementById('scenario-components');
    const components = Object.values(SCENARIO_COMPONENTS);

    container.innerHTML = components.map(c => `
      <div class="scenario-card" data-component="${c.id}">
        <div class="scenario-card-icon">${c.icon}</div>
        <div class="scenario-card-info">
          <h3>${c.name}</h3>
          <p class="scenario-card-desc">${c.description}</p>
        </div>
        <div class="scenario-card-toggle">
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.component;
        if (this.selectedScenarioComponents.has(id)) {
          this.selectedScenarioComponents.delete(id);
          card.classList.remove('active');
        } else {
          this.selectedScenarioComponents.add(id);
          card.classList.add('active');
        }
        this.updateScenarioPreview();
      });
    });

    // Reset summary
    document.getElementById('scenario-summary').classList.add('hidden');
    document.getElementById('btn-apply-scenario').disabled = true;
  }

  updateScenarioPreview() {
    const hasSelection = this.selectedScenarioComponents.size > 0;
    document.getElementById('btn-apply-scenario').disabled = !hasSelection;

    const summaryEl = document.getElementById('scenario-summary');
    const deltasEl = document.getElementById('scenario-deltas');

    if (!hasSelection) {
      summaryEl.classList.add('hidden');
      return;
    }

    summaryEl.classList.remove('hidden');
    const scenario = this.calculateScenario();

    const original = this.simulationResults;
    const dKwh = ((scenario.electricity.withOverhead - original.electricity.withOverhead) / original.electricity.withOverhead * 100);
    const dWater = ((scenario.water.liters - original.water.liters) / original.water.liters * 100);
    const dCO2 = ((scenario.emissions.grams - original.emissions.grams) / original.emissions.grams * 100);
    const dDist = ((scenario.distance - original.distance) / original.distance * 100);

    const formatDelta = (val) => {
      const sign = val > 0 ? '+' : '';
      return `${sign}${Math.round(val)}%`;
    };
    const deltaClass = (val) => val < 0 ? 'delta-good' : val > 0 ? 'delta-bad' : 'delta-neutral';

    deltasEl.innerHTML = `
      <div class="scenario-delta ${deltaClass(dKwh)}">
        <span class="delta-icon">⚡</span>
        <span class="delta-value">${formatDelta(dKwh)}</span>
        <span class="delta-label">Energy</span>
      </div>
      <div class="scenario-delta ${deltaClass(dWater)}">
        <span class="delta-icon">💧</span>
        <span class="delta-value">${formatDelta(dWater)}</span>
        <span class="delta-label">Water</span>
      </div>
      <div class="scenario-delta ${deltaClass(dCO2)}">
        <span class="delta-icon">🌫️</span>
        <span class="delta-value">${formatDelta(dCO2)}</span>
        <span class="delta-label">CO₂</span>
      </div>
      <div class="scenario-delta ${deltaClass(dDist)}">
        <span class="delta-icon">📍</span>
        <span class="delta-value">${formatDelta(dDist)}</span>
        <span class="delta-label">Distance</span>
      </div>
    `;
  }

  calculateScenario() {
    // Build combined modifiers from selected components
    let distMultiplier = 1.0;
    let pueMultiplier = 1.0;
    let carbonOffset = 0;
    let waterMultiplier = 1.0;

    for (const id of this.selectedScenarioComponents) {
      const comp = SCENARIO_COMPONENTS[id];
      if (!comp) continue;
      const e = comp.effects;
      distMultiplier *= e.distanceMultiplier;
      pueMultiplier *= e.pueMultiplier;
      carbonOffset += e.carbonIntensityOffset;
      waterMultiplier *= e.waterMultiplier;
    }

    const original = this.simulationResults;
    const dc = original.datacenter;

    // Modified distance
    const newDistance = original.distance * distMultiplier;

    // Modified electricity: recalculate with modified PUE
    const baseKwh = original.electricity.baseKwh;
    const newPue = dc.energy.pue * pueMultiplier;
    const withPue = baseKwh * newPue;
    const withHeat = withPue * dc.climate.heatPenalty;
    const hourMod = original.electricity.withOverhead / (original.electricity.baseKwh * dc.energy.pue * dc.climate.heatPenalty);
    const newKwh = withHeat * hourMod;

    // Modified carbon intensity (clamped to minimum 20)
    const newCarbonIntensity = Math.max(20, dc.energy.carbonIntensity + carbonOffset);
    const newCO2 = newKwh * newCarbonIntensity * (original.emissions.grams / (original.electricity.withOverhead * original.emissions.baseCarbonIntensity));

    // Modified water
    const newWaterLiters = original.water.liters * waterMultiplier * pueMultiplier;

    // Generate modified flows
    const scenarioFlows = this.generateScenarioFlows(original, distMultiplier);

    return {
      distance: newDistance,
      electricity: {
        baseKwh,
        withOverhead: newKwh,
        pue: newPue,
        sources: original.electricity.sources
      },
      water: { liters: newWaterLiters },
      emissions: { grams: newCO2, baseCarbonIntensity: newCarbonIntensity },
      flows: scenarioFlows,
      components: [...this.selectedScenarioComponents]
    };
  }

  generateScenarioFlows(original, distMultiplier) {
    const flows = [];
    const hasLocalDC = this.selectedScenarioComponents.has('localDatacenter');
    const city = original.city;
    const dc = original.datacenter;

    // If local datacenter: data flow stays in city
    if (hasLocalDC) {
      // Short local data path
      flows.push({
        type: 'data',
        from: city.coords,
        to: { lat: city.coords.lat + 0.05, lng: city.coords.lng + 0.05 },
        label: 'Local Request',
        intensity: 1
      });
      // Local electricity sources (simplified)
      flows.push({
        type: 'electricity',
        from: { lat: city.coords.lat + 0.2, lng: city.coords.lng - 0.3 },
        to: { lat: city.coords.lat + 0.05, lng: city.coords.lng + 0.05 },
        label: 'Local Grid',
        intensity: 0.8
      });
    } else {
      // Same data path as original
      flows.push({
        type: 'data',
        from: city.coords,
        to: dc.coords,
        label: 'Request',
        intensity: 1
      });
      // Original electricity sources
      for (const source of original.electricity.sources) {
        flows.push({
          type: 'electricity',
          from: source.coords,
          to: dc.coords,
          label: source.name,
          intensity: 0.5
        });
      }
    }

    const dcTarget = hasLocalDC
      ? { lat: city.coords.lat + 0.05, lng: city.coords.lng + 0.05 }
      : dc.coords;

    // Added renewables show as new electricity flows
    if (this.selectedScenarioComponents.has('solarFarm')) {
      flows.push({
        type: 'electricity',
        from: { lat: dcTarget.lat - 0.5, lng: dcTarget.lng + 0.4 },
        to: dcTarget,
        label: 'Solar Farm',
        intensity: 0.7
      });
    }
    if (this.selectedScenarioComponents.has('windFarm')) {
      flows.push({
        type: 'electricity',
        from: { lat: dcTarget.lat + 0.6, lng: dcTarget.lng - 0.5 },
        to: dcTarget,
        label: 'Wind Farm',
        intensity: 0.6
      });
    }
    if (this.selectedScenarioComponents.has('nuclearPlant')) {
      flows.push({
        type: 'electricity',
        from: { lat: dcTarget.lat + 1.0, lng: dcTarget.lng + 1.0 },
        to: dcTarget,
        label: 'Nuclear Plant',
        intensity: 0.9
      });
    }

    // Water — only if original had water
    if (original.water.liters > 0) {
      const waterTarget = hasLocalDC ? dcTarget : dc.coords;
      if (this.selectedScenarioComponents.has('coolingLake')) {
        flows.push({
          type: 'water',
          from: { lat: waterTarget.lat - 0.3, lng: waterTarget.lng + 0.2 },
          to: waterTarget,
          label: 'Cooling Lake',
          intensity: 0.4
        });
      } else {
        flows.push({
          type: 'water',
          from: original.water.sourceCoords,
          to: waterTarget,
          label: original.water.source,
          intensity: 0.5
        });
      }
    }

    // Emissions — reduced if renewables added
    if (original.emissions.drift) {
      for (const dest of original.emissions.drift.destinations) {
        flows.push({
          type: 'emissions',
          from: dcTarget,
          to: dest.coords,
          label: `CO₂ drift to ${dest.name}`,
          intensity: 0.3 // Visually thinner to show reduction
        });
      }
    }

    return flows;
  }

  bindScenario() {
    document.getElementById('btn-back-scenario').addEventListener('click', () => {
      this.showPage('planetary-scale');
    });

    document.getElementById('btn-apply-scenario').addEventListener('click', () => {
      const scenario = this.calculateScenario();
      channel.postMessage({
        type: 'scenario-flow',
        city: this.selectedCity,
        workload: this.selectedWorkload,
        datacenter: this.selectedDatacenter,
        hour: new Date().getHours(),
        scenario
      });
    });
  }
}

// Boot
new TabletController();
