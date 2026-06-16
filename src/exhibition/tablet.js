/**
 * EXHIBITION — Tablet Controller
 * Handles the 3-step tablet flow: Body Scale → City Scale → Planetary Scale
 * Communicates with the big screen via BroadcastChannel.
 */

import { CITIES, WORKLOADS, ENERGY_REFERENCE } from '../data/models.js';
import { BUILDING_TYPES, SCENARIO_COMPONENTS } from './models.js';
import { ledController } from './led-controller.js';
import { createBridge } from './ws-bridge.js';
import { i18n } from '../i18n/i18n.js';
import { TRANSLATIONS } from '../i18n/translations.js';
import { initHeroGlobe } from './hero-globe.js';
import * as THREE from 'three';
import worldData from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';

// WebSocket bridge for tablet ↔ screen communication (replaces BroadcastChannel)
const channel = createBridge('tablet');
ledController.attach(channel);

class TabletController {
  constructor() {
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.exhibitData = null;
    this.exhibitEntry = null;
    this.selectedScenarioComponents = new Set();
    this.onboardStepIndex = 0;

    this.init();
  }

  async init() {
    this.exhibitData = await fetch('/exhibit_data.json').then(r => r.json());

    this._destroyLandingWorld = initHeroGlobe(
      document.getElementById('landing-globe-mount'),
      document.getElementById('landing-globe-overlay'),
    );
    this.bindLanding();
    this.bindOnboarding();
    this.bindBodyScale();
    this.bindBodyResult();
    this.bindCityScale();
    this.bindPlanetaryScale();
    this.bindScenario();
    this.bindLangSwitcher();
    this._bindGlobalBack();

    i18n.applyToDOM();
    this._startSubtitleCycle();

    window.addEventListener('arduino:light', (e) => {
      this.updateLedIndicator(e.detail.level);
    });

    // Deep-link: #select opens straight on the city/AI selection page
    // (used by the diorama view, which embeds this on the model's tablet).
    if (location.hash === '#select') {
      this._stopSubtitleCycle();
      this._setGlobeMode('dim');
      document.getElementById('lang-switcher')?.classList.remove('onboarding-lang');
      this.showPage('body-scale');
    }
  }

  bindLangSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    this._updateLangButtons();

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        this._updateLangButtons();
        channel.postMessage({ type: 'lang-change', lang: btn.dataset.lang });
        if (this._subtitleTimer) {
          this._stopSubtitleCycle();
          this._startSubtitleCycle();
        }
        this._rerenderForLang();
      });
    });
  }

  _updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === i18n.currentLang);
    });
  }

  // Re-render dynamically-injected text for the active page after a language
  // switch (static [data-i18n] nodes are handled by i18n.applyToDOM()).
  _rerenderForLang() {
    const page = this.currentPage;
    if (page === 'city-scale' && this.exhibitEntry) {
      this.populateCityScale();
    } else if (page === 'scenario') {
      document.querySelectorAll('#scenario-components .scenario-card').forEach(card => {
        const id = card.dataset.component;
        const h3 = card.querySelector('h3');
        const desc = card.querySelector('.scenario-card-desc');
        if (h3) h3.textContent = i18n.tMap('scenario_names', id);
        if (desc) desc.textContent = i18n.tMap('scenario_descs', id);
      });
      if (this.selectedScenarioComponents.size > 0) this.updateScenarioPreview();
    } else if (page === 'body-result') {
      if (this._aptHours != null) {
        this._insightText = this._buildInsightText(null, this._aptHours);
        const announceText = document.getElementById('result-announce-text');
        if (announceText && announceText.innerHTML) {
          announceText.innerHTML = this._buildColoredWords(this._insightText);
          announceText.querySelectorAll('.word').forEach(w => w.classList.add('visible'));
        }
      }
      document.querySelectorAll('#equivalences .equiv-3d-label').forEach(el => {
        const key = el.dataset.eqlabel;
        if (key) el.textContent = i18n.tMap('equiv_labels', key);
      });
      this.populateCalcBreakdown();
    }
  }

  // ─── Navigation ────────────────────────────────────

  showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    this.currentPage = id;
    this._updateGlobalBack();
  }

  _pageHistory = ['landing'];

  _updateGlobalBack() {
    const btn = document.getElementById('global-back-btn');
    if (!btn) return;
    const pagesWithOwnBack = ['landing', 'body-result', 'planetary-scale', 'scenario'];
    const show = this.currentPage && !pagesWithOwnBack.includes(this.currentPage);
    btn.classList.toggle('hidden', !show);
  }

  _bindGlobalBack() {
    const btn = document.getElementById('global-back-btn');
    if (!btn) return;

    const backMap = {
      'onboard-purpose': 'landing',
      'onboard-steps': 'onboard-purpose',
      'body-scale': 'onboard-steps',
      'body-result': 'body-scale',
      'city-scale': 'body-result',
      'planetary-scale': 'city-scale',
      'scenario': 'planetary-scale',
    };

    btn.addEventListener('click', () => {
      const prev = backMap[this.currentPage];
      if (prev) {
        if (this.currentPage === 'city-scale' && this._s2AnimTimers) {
          this._s2AnimTimers.forEach(t => clearTimeout(t));
          this._s2AnimTimers = [];
          ledController.turnOff();
        }
        if (prev === 'landing') {
          this._setGlobeMode('visible');
          document.getElementById('lang-switcher').classList.add('onboarding-lang');
        }
        if (prev === 'onboard-purpose') {
          this._setGlobeMode('dim');
        }
        if (prev === 'body-scale') {
          this._setGlobeMode('dim');
        }
        this.showPage(prev);
      }
    });
  }



  // ─── STEP 0: Landing ──────────────────────────────

  _getSubtitles() {
    const lang = i18n.currentLang;
    return TRANSLATIONS[lang]?.landing_subtitles ?? TRANSLATIONS.en.landing_subtitles;
  }

  _startSubtitleCycle() {
    this._subtitleIndex = 0;
    this._showNextSubtitle();
  }

  _stopSubtitleCycle() {
    clearTimeout(this._subtitleTimer);
    this._subtitleTimer = null;
  }

  _showNextSubtitle() {
    const el = document.getElementById('landing-subtitle');
    if (!el) return;

    const phrases = this._getSubtitles();
    const text = phrases[this._subtitleIndex % phrases.length];

    el.classList.remove('reveal', 'fade-out');
    el.textContent = text;

    requestAnimationFrame(() => {
      el.classList.add('reveal');
    });

    this._subtitleTimer = setTimeout(() => {
      el.classList.add('fade-out');

      this._subtitleTimer = setTimeout(() => {
        this._subtitleIndex++;
        this._showNextSubtitle();
      }, 500);
    }, 3500);
  }

  _setGlobeMode(mode) {
    const mount = document.getElementById('landing-globe-mount');
    const overlay = document.getElementById('landing-globe-overlay');
    if (!mount) return;

    if (mode === 'hidden') {
      mount.classList.add('globe-hidden');
      overlay.classList.add('globe-hidden');
    } else if (mode === 'dim') {
      mount.classList.remove('globe-hidden');
      mount.classList.add('globe-dim');
      overlay.classList.remove('globe-hidden');
      overlay.classList.add('globe-dim');
    } else {
      mount.classList.remove('globe-dim', 'globe-hidden');
      overlay.classList.remove('globe-dim', 'globe-hidden');
    }
  }

  bindLanding() {
    document.getElementById('btn-start').addEventListener('click', () => {
      this._stopSubtitleCycle();
      this._setGlobeMode('dim');
      this.showPage('onboard-purpose');
      this.animatePurposeText();
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

  _colorClassForWord(word) {
    const w = word.toLowerCase().replace(/[^a-záàâäãéèêëíìîïóòôöõúùûüñç₂]/g, '');
    if (/^(l')?(energy|energía|energia|energètica|electricitat|electricidad|electricity|kwh)$/.test(w)) return 'word-energy';
    if (/^(l')?(water|agua|aigua)$/.test(w)) return 'word-water';
    if (/^(carbon|carbono|carboni|co₂|emissions|emisiones)$/.test(w)) return 'word-carbon';
    if (/^(ai|ia)$/.test(w)) return 'word-ai';
    if (/^[\d,.]+$/.test(word.replace(/[",]/g, ''))) return 'word-number';
    return '';
  }

  _buildColoredWords(text) {
    return text.split(' ').map(w => {
      let cls = this._colorClassForWord(w);
      if (!cls && /[""“”]/.test(w)) cls = 'word-highlight';
      return `<span class="word${cls ? ' ' + cls : ''}">${w}</span>`;
    }).join(' ');
  }

  animatePurposeText() {
    const el = document.getElementById('onboard-purpose-text');
    const text = i18n.t('onboard_purpose');
    el.innerHTML = this._buildColoredWords(text);

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
    }, 240); // 2x slower
  }

  populateOnboardSteps() {
    const stepIcons = [
      `<svg width="96" height="96" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="6" width="36" height="36" rx="2" opacity="0.3"/>
        <path d="M6 18 H42" opacity="0.4"/>
        <path d="M6 30 H42" opacity="0.4"/>
        <path d="M18 6 V42" opacity="0.4"/>
        <path d="M30 6 V42" opacity="0.4"/>
        <rect x="8" y="8" width="8" height="8" rx="1" opacity="0.25" fill="currentColor"/>
        <rect x="32" y="20" width="8" height="8" rx="1" opacity="0.25" fill="currentColor"/>
        <rect x="20" y="32" width="8" height="8" rx="1" opacity="0.25" fill="currentColor"/>
        <path d="M24 12 C24 8 28 8 28 12 C28 16 24 18 24 18 C24 18 20 16 20 12 C20 8 24 8 24 12 Z" fill="currentColor" stroke="none"/>
        <circle cx="24" cy="11.5" r="2" stroke="rgba(0,0,0,0.6)" fill="none" stroke-width="1.2"/>
      </svg>`,
      `<svg width="96" height="96" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M24 6 V14"/>
        <path d="M18 16 C18 12 30 12 30 16"/>
        <path d="M16 16 V38 H32 V16"/>
        <path d="M16 22 H32" opacity="0.5"/>
        <path d="M16 28 H32" opacity="0.5"/>
        <path d="M16 34 H32" opacity="0.5"/>
        <path d="M22 22 V38" opacity="0.4"/>
        <path d="M26 22 V38" opacity="0.4"/>
        <circle cx="24" cy="6" r="2"/>
        <path d="M19 6 L24 6" opacity="0.6"/><path d="M24 6 L29 6" opacity="0.6"/>
        <path d="M12 38 H36" opacity="0.5"/>
      </svg>`,
      `<svg width="96" height="96" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="24" cy="24" r="16"/>
        <path d="M8 24 H40"/>
        <path d="M24 8 C19 14 19 34 24 40"/>
        <path d="M24 8 C29 14 29 34 24 40"/>
        <path d="M11 15 H37" opacity="0.4"/>
        <path d="M11 33 H37" opacity="0.4"/>
        <circle cx="24" cy="8" r="1.2" fill="currentColor"/>
        <circle cx="24" cy="40" r="1.2" fill="currentColor"/>
        <path d="M34 12 L38 8" opacity="0.5"/>
        <circle cx="39" cy="7" r="1" fill="currentColor"/>
      </svg>`,
    ];

    const steps = [
      { titleKey: 'onboard_step1_title', descKey: 'onboard_step1_desc' },
      { titleKey: 'onboard_step3_title', descKey: 'onboard_step3_desc' },
      { titleKey: 'onboard_step4_title', descKey: 'onboard_step4_desc' },
    ];

    const container = document.getElementById('onboard-steps-container');
    container.innerHTML = steps.map((s, idx) => `
      <div class="onboard-step-box" data-step="${idx}">
        <div class="onboard-step-box-icon">${stepIcons[idx]}</div>
        <div class="onboard-step-box-content">
          <div class="onboard-step-box-title" data-text="${i18n.t(s.titleKey)}">${i18n.t(s.titleKey)}</div>
          <div class="onboard-step-box-desc" data-text="${i18n.t(s.descKey)}">${i18n.t(s.descKey)}</div>
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
        this.checkConsumptionReady(consumptionBtn);
        const lbl = document.getElementById('label-city');
        lbl.classList.remove('s1-flash');
        lbl.classList.add('s1-done');
      });
    });

    // Workload buttons
    document.querySelectorAll('#workload-options .opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#workload-options .opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedWorkload = btn.dataset.workload;
        this.checkConsumptionReady(consumptionBtn);
        const lbl = document.getElementById('label-workload');
        lbl.classList.remove('s1-flash');
        lbl.classList.add('s1-done');
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
    const city = CITIES[this.selectedCity];
    const exhibitCity = this.exhibitData[city.exhibitKey];
    if (!exhibitCity) { console.error('City not in exhibit data:', city.exhibitKey); return; }

    const opData = exhibitCity.operations[this.selectedWorkload];
    if (!opData) { console.error('Operation not in exhibit data:', this.selectedWorkload); return; }

    this.exhibitEntry = { city: exhibitCity, op: opData, min: opData.min, max: opData.max };

    const aiUsers = exhibitCity.aiUsers;
    const perUserKwh = opData.max.electricity_kWh / aiUsers;

    this.simulationResults = {
      electricity: { withOverhead: perUserKwh },
      perUser: { electricity_kWh: perUserKwh, co2_g: (opData.max.co2_kg / aiUsers) * 1000, water_mL: (opData.max.water_L / aiUsers) * 1000 },
    };

    this.prepareBodyResult();

    const cityName = city.name;
    const workloadName = i18n.tMap('workload_names', this.selectedWorkload);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    this._setGlobeMode('visible');
    this.showTransitionPage(cityName, workloadName, () => {
      this._setGlobeMode('dim');
      this.showPage('body-result');
      this.animateBodyResultSequence();
    });
  }

  showTransitionPage(cityName, workloadName, onComplete) {
    let overlay = document.getElementById('transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transition-overlay';
      overlay.className = 'transition-overlay';
      overlay.innerHTML = `
        <div class="transition-content">
          <p class="transition-text" id="transition-text"></p>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const text = i18n.t('transition_text')(workloadName, cityName);
    const el = document.getElementById('transition-text');
    el.innerHTML = this._buildColoredWords(text);

    overlay.classList.remove('darkened', 'revealing', 'fade-out');
    el.style.opacity = '1';
    el.style.transition = '';
    overlay.classList.add('active');

    const wordEls = el.querySelectorAll('.word');
    const wordDelay = 120;
    let i = 0;
    const interval = setInterval(() => {
      if (i < wordEls.length) {
        wordEls[i].classList.add('visible');
        i++;
      } else {
        clearInterval(interval);
      }
    }, wordDelay);

    const holdTime = wordEls.length * wordDelay + 2500;

    setTimeout(() => {
      // Fade text out first
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';

      setTimeout(() => {
        // Swap page underneath while overlay still covers
        onComplete();

        // Fade entire overlay out smoothly
        overlay.classList.add('fade-out');

        setTimeout(() => {
          overlay.classList.remove('active', 'darkened', 'revealing', 'fade-out');
          el.style.transition = '';
          el.style.opacity = '';
        }, 700);
      }, 500);
    }, holdTime);
  }

  showCityTransition(cityName, workloadName, neighborhoodKwh, aiUsers, minDest, minCO2, maxDest, maxCO2, onComplete) {
    let overlay = document.getElementById('transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transition-overlay';
      overlay.className = 'transition-overlay';
      overlay.innerHTML = `
        <div class="transition-content">
          <p class="transition-text" id="transition-text"></p>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    const el = document.getElementById('transition-text');

    const showPhase = (text, callback) => {
      const lines = text.split('\n');
      el.innerHTML = lines.map(line => {
        const coloredWords = this._buildColoredWords(line);
        return `<span class="transition-line">${coloredWords}</span>`;
      }).join('');
      el.style.transition = '';
      el.style.opacity = '1';

      const lineEls = el.querySelectorAll('.transition-line');
      let totalDelay = 0;
      const lineTimers = [];

      lineEls.forEach((lineEl, lineIdx) => {
        const words = lineEl.querySelectorAll('.word');
        const lineStart = totalDelay;
        lineTimers.push(setTimeout(() => {
          let wi = 0;
          const iv = setInterval(() => {
            if (wi < words.length) { words[wi].classList.add('visible'); wi++; }
            else clearInterval(iv);
          }, 160);
        }, lineStart));
        totalDelay += words.length * 160 + 3000;
      });

      const holdTime = totalDelay + 4500;
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease';
        el.style.opacity = '0';
        setTimeout(callback, 900);
      }, holdTime);
    };

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    overlay.classList.remove('darkened', 'revealing', 'fade-out');
    el.style.transition = '';
    el.style.opacity = '1';
    overlay.classList.add('active');

    const text1 = i18n.t('city_transition_text1')(cityName, workloadName, neighborhoodKwh, aiUsers);

    showPhase(text1, () => {
      this._showCO2MapPhase(overlay, el, minDest, minCO2, maxDest, maxCO2, () => {
        const text2 = i18n.t('city_transition_text2');
        showPhase(text2, () => {
          onComplete();
          overlay.classList.add('fade-out');
          setTimeout(() => {
            overlay.classList.remove('active', 'darkened', 'revealing', 'fade-out');
            el.style.transition = '';
            el.style.opacity = '';
          }, 700);
        });
      });
    });
  }

  // ─── CO₂ Map Phase ────────────────────────────────

  _getDestinationCoords() {
    return {
      'Stockholm': { lat: 59.33, lng: 18.07 },
      'Pune': { lat: 18.52, lng: 73.86 },
      'Hamina (Finland)': { lat: 60.57, lng: 27.19 },
      'Changhua County (Taiwan)': { lat: 24.08, lng: 120.54 },
      'Paris (France)': { lat: 48.86, lng: 2.35 },
      'Paris': { lat: 48.86, lng: 2.35 },
      'Jakarta (Indonesia)': { lat: -6.21, lng: 106.85 },
      'Dublin (serves EMEA)': { lat: 53.35, lng: -6.26 },
      'The Dalles, Oregon': { lat: 45.60, lng: -121.18 },
      'Columbus, Ohio': { lat: 39.96, lng: -82.99 },
      'Central Ohio': { lat: 40.00, lng: -82.88 },
      'Chennai': { lat: 13.08, lng: 80.27 },
      'Mumbai': { lat: 19.08, lng: 72.88 },
      'Inzai City (Japan)': { lat: 35.83, lng: 140.15 },
      'Tokyo (serves Asia Pacific)': { lat: 35.68, lng: 139.69 },
      'Virginia (serves N. America)': { lat: 39.04, lng: -77.49 },
    };
  }

  _projectToMap(lat, lng, width, height) {
    const x = ((lng + 180) / 360) * width;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = (height / 2) - (mercN * height) / (2 * Math.PI);
    return { x, y };
  }

  _buildWorldMapSVG(width, height) {
    const land = 'M2,48L3,46L5,45L7,44L9,44L11,43L13,42L14,41L15,39L14,37L13,36L12,34L11,33L10,31L9,30L8,29L7,28L6,27L5,26L4,25L3,24L2,23L1,22L1,20L2,19L3,18L4,17L5,17L7,17L8,18L10,18L11,19L13,19L14,20L15,20L16,19L17,18L18,17L20,17L21,18L23,18L24,19L25,19L27,20L28,20L29,19L30,18L32,18L33,19L34,20L36,20L37,20L38,19L39,18L40,17L41,17L42,18L43,19L44,20L45,21L46,22L47,23L48,24L49,25L50,25L51,24L52,23L53,22L54,22L55,23L56,24L57,25L58,25L59,24L60,24L61,25L62,26L63,27L64,28L64,30L63,31L62,32L61,33L62,34L63,35L64,36L65,37L66,38L67,39L68,40L69,41L70,42L71,43L72,44L73,44L74,43L75,42L76,41L77,41L78,42L79,43L80,44L81,44L82,43L83,42L84,42L85,43L86,44L87,45L88,46L89,47L90,48L91,49L92,50L93,50L94,49L95,48L96,48L97,49L98,50';
    return `
      <svg viewBox="0 0 ${width} ${height}" class="co2-map-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="pulse-glow-min" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#3fb950" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#3fb950" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="pulse-glow-max" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f85149" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#f85149" stop-opacity="0"/>
          </radialGradient>
        </defs>
      </svg>
    `;
  }

  _showCO2MapPhase(overlay, textEl, minDest, minCO2, maxDest, maxCO2, callback) {
    this._setGlobeMode('dim');
    const coords = this._getDestinationCoords();
    const minCoord = coords[minDest];
    const maxCoord = coords[maxDest];

    const cityName = CITIES[this.selectedCity]?.name || this.selectedCity;
    const opName = i18n.tMap('workload_names', this.selectedWorkload);
    const headline = i18n.t('co2_headline')(cityName, opName);
    const headlineWords = headline.split(' ').map(w => {
      const cls = this._colorClassForWord(w);
      return `<span class="word${cls ? ' ' + cls : ''}">${w}</span>`;
    }).join(' ');

    textEl.innerHTML = headlineWords;
    textEl.style.transition = '';
    textEl.style.opacity = '1';
    textEl.classList.remove('co2-text-left');

    const wordEls = textEl.querySelectorAll('.word');
    let wi = 0;
    const wordInterval = setInterval(() => {
      if (wi < wordEls.length) { wordEls[wi].classList.add('visible'); wi++; }
      else clearInterval(wordInterval);
    }, 160);

    const afterWords = wordEls.length * 160 + 2500;

    const timers = [];
    const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    later(() => {
      textEl.classList.add('co2-text-left');

      let mapWrap = document.getElementById('co2-map-wrap');
      if (!mapWrap) {
        mapWrap = document.createElement('div');
        mapWrap.id = 'co2-map-wrap';
        mapWrap.className = 'co2-map-wrap';
        overlay.querySelector('.transition-content').appendChild(mapWrap);
      }

      const mapW = 500;
      const mapH = 300;
      mapWrap.innerHTML = this._buildWorldMapSVG(mapW, mapH);
      mapWrap.classList.add('visible');

      const svg = mapWrap.querySelector('svg');
      this._drawWorldOutline(svg, mapW, mapH);

      if (minCoord) {
        const p = this._projectToMap(minCoord.lat, minCoord.lng, mapW, mapH);
        this._addMapMarker(svg, p.x, p.y, 'min', minDest);
      }

      later(() => {
        if (minCoord) {
          const marker = svg.querySelector('.map-marker-min');
          if (marker) marker.classList.add('active');
        }

        const leastLine = document.createElement('p');
        leastLine.className = 'co2-detail-line co2-least';
        leastLine.innerHTML = this._buildColoredWords(i18n.t('co2_least')(minDest, minCO2));
        textEl.parentElement.insertBefore(leastLine, textEl.nextSibling);

        const leastWords = leastLine.querySelectorAll('.word');
        let li = 0;
        const leastInterval = setInterval(() => {
          if (li < leastWords.length) { leastWords[li].classList.add('visible'); li++; }
          else clearInterval(leastInterval);
        }, 160);

        later(() => {
          if (maxCoord) {
            const p = this._projectToMap(maxCoord.lat, maxCoord.lng, mapW, mapH);
            this._addMapMarker(svg, p.x, p.y, 'max', maxDest);
            later(() => {
              const marker = svg.querySelector('.map-marker-max');
              if (marker) marker.classList.add('active');
            }, 500);
          }

          const mostLine = document.createElement('p');
          mostLine.className = 'co2-detail-line co2-most';
          mostLine.innerHTML = this._buildColoredWords(i18n.t('co2_most')(maxDest, maxCO2));
          const prevLine = textEl.parentElement.querySelector('.co2-least');
          prevLine.parentElement.insertBefore(mostLine, prevLine.nextSibling);

          const mostWords = mostLine.querySelectorAll('.word');
          let mi = 0;
          const mostInterval = setInterval(() => {
            if (mi < mostWords.length) { mostWords[mi].classList.add('visible'); mi++; }
            else clearInterval(mostInterval);
          }, 160);

          const holdTime = mostWords.length * 160 + 5000;
          later(() => {
            const content = textEl.parentElement;
            content.style.transition = 'opacity 1s ease';
            content.style.opacity = '0';

            later(() => {
              textEl.classList.remove('co2-text-left');
              mapWrap.classList.remove('visible');
              document.querySelectorAll('.co2-detail-line').forEach(l => l.remove());
              textEl.innerHTML = '';
              content.style.transition = '';
              content.style.opacity = '';
              textEl.style.opacity = '';
              textEl.style.transition = '';
              callback();
            }, 1100);
          }, holdTime);
        }, leastWords.length * 160 + 3000);
      }, 1800);
    }, afterWords);
  }

  _geoToSvgPath(coords, w, h) {
    const project = (lng, lat) => {
      const x = ((lng + 180) / 360) * w;
      const latRad = (lat * Math.PI) / 180;
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
      const y = (h / 2) - (mercN * h) / (2 * Math.PI);
      return [x, y];
    };

    return coords.map((ring, ri) => {
      return ring.map((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ') + ' Z';
    }).join(' ');
  }

  _drawWorldOutline(svg, w, h) {
    const countries = feature(worldData, worldData.objects.countries);
    countries.features.forEach(f => {
      const geomType = f.geometry.type;
      const polys = geomType === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
      polys.forEach(polygon => {
        const d = this._geoToSvgPath(polygon, w, h);
        if (!d) return;
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('class', 'continent-outline');
        svg.appendChild(el);
      });
    });
  }

  _addMapMarker(svg, x, y, type, label) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `map-marker map-marker-${type}`);

    const pulseOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulseOuter.setAttribute('cx', x);
    pulseOuter.setAttribute('cy', y);
    pulseOuter.setAttribute('r', '18');
    pulseOuter.setAttribute('fill', `url(#pulse-glow-${type})`);
    pulseOuter.setAttribute('class', 'marker-pulse');

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', '4');
    dot.setAttribute('class', `marker-dot marker-dot-${type}`);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y - 22);
    text.setAttribute('class', `marker-label marker-label-${type}`);
    text.textContent = label;

    g.appendChild(pulseOuter);
    g.appendChild(dot);
    g.appendChild(text);
    svg.appendChild(g);
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
    const labelUpper = this._apartmentLabel().toUpperCase();
    const opName = i18n.tMap('workload_names', this.selectedWorkload).toUpperCase();
    const aptMinutes = Math.round(aptHours * 60);
    const aptSeconds = Math.round(aptHours * 3600);
    const power = i18n.t('insight_power');
    if (aptMinutes >= 60) {
      const h = Math.floor(aptMinutes / 60);
      const m = aptMinutes % 60;
      const hWord = h > 1 ? i18n.t('dur_hours') : i18n.t('dur_hour');
      const duration = `${h} ${hWord}${m > 0 ? ` ${m} ${i18n.t('dur_min')}` : ''}`;
      return power(labelUpper, duration, opName);
    } else if (aptMinutes > 0) {
      const mWord = aptMinutes !== 1 ? i18n.t('dur_minutes') : i18n.t('dur_minute');
      return power(labelUpper, `${aptMinutes} ${mWord}`, opName);
    } else if (aptSeconds > 0) {
      const sWord = aptSeconds !== 1 ? i18n.t('dur_seconds') : i18n.t('dur_second');
      return power(labelUpper, `${aptSeconds} ${sWord}`, opName);
    }
    return i18n.t('insight_tiny')(labelUpper, opName);
  }

  _apartmentLabel() {
    return i18n.tMap('apartment_labels', this.selectedCity || 'default');
  }

  prepareBodyResult() {
    const cityId = this.selectedCity;
    const aptRef = ENERGY_REFERENCE.apartment[cityId] || ENERGY_REFERENCE.apartment.default;
    const totalKwh = this.simulationResults.electricity.withOverhead;
    const aptHours = totalKwh / aptRef.kWhPerHour;
    this._aptHours = aptHours;

    document.getElementById('body-kwh').textContent = totalKwh.toFixed(4);

    // Build insight text
    this._insightText = this._buildInsightText(aptRef, aptHours);

    // Build the 3D building — apartment.glb rendered via Three.js
    this._initHeroBuilding();

    // Build equivalence cards (all start hidden)
    const equivList = document.getElementById('equivalences');
    const equivalences = ENERGY_REFERENCE.equivalences;
    const objectModels = this._getObjectModels();

    equivList.innerHTML = equivalences
      .filter(eq => totalKwh / eq.kWh >= 0.01)
      .slice(0, 4)
      .map((eq, i) => {
        const ratio = totalKwh / eq.kWh;
        const hrs = ratio;
        const display = hrs >= 1 ? `${hrs.toFixed(1)} hrs` : hrs >= (1/60) ? `${(hrs * 60).toFixed(0)} min` : `${(hrs * 3600).toFixed(0)} sec`;
        const model = objectModels[eq.label] || objectModels['LED bulb for 1 hour'];
        const extraStyle = i % 2 === 1 ? 'animation-direction: reverse;' : '';
        const modelWithStyle = model.replace('class="equiv-3d-object', `style="${extraStyle}" class="equiv-3d-object`);
        return `<div class="equiv-3d-card anim-hidden">
          <div class="equiv-3d-scene">${modelWithStyle}</div>
          <span class="equiv-3d-value">${display}</span>
          <span class="equiv-3d-label" data-eqlabel="${eq.label}">${i18n.tMap('equiv_labels', eq.label)}</span>
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
    const nextBtn = document.getElementById('btn-to-city');
    if (nextBtn) { nextBtn.classList.add('anim-hidden'); nextBtn.classList.remove('anim-visible'); }

    this.populateCalcBreakdown();
  }

  _initHeroBuilding() {
    if (this._heroBuilding) return;
    const canvas = document.getElementById('hero-building-canvas');
    if (!canvas) return;
    const host = canvas.parentElement;

    canvas.style.display = 'none';

    let cssBuilding = host.querySelector('.hero-building-css');
    if (!cssBuilding) {
      cssBuilding = document.createElement('div');
      cssBuilding.className = 'hero-building-css';
      cssBuilding.innerHTML = `
        <div class="hb-rotate">
          ${this._box(60, 100, 50, 0, 0, 0, 'w')}
          ${this._box(40, 70, 35, -50, 15, 0, 'w')}
          ${this._box(30, 50, 28, 45, 25, -10, 'w')}
        </div>
      `;
      host.appendChild(cssBuilding);
    }

    this._heroBuilding = true;
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
    const nextBtn = document.getElementById('btn-to-city');

    let t = 0;

    // ── 1: Big centered text — word-by-word reveal (matches showTransition)
    const workloadName = i18n.tMap('workload_names', this.selectedWorkload).toUpperCase();

    // Set the h2 headline to the selected operation name
    const headlineEl = header.querySelector('.s1-headline h2');
    if (headlineEl) headlineEl.textContent = workloadName;

    const introStr = i18n.t('intro_energy_text')(totalKwh.toFixed(4), workloadName);
    introText.innerHTML = this._buildColoredWords(introStr);
    introOverlay.classList.add('visible');

    const introWordDelay = 120;
    const introWordEls = introText.querySelectorAll('.word');
    let iw = 0;
    const introInterval = setInterval(() => {
      if (iw < introWordEls.length) {
        introWordEls[iw].classList.add('visible');
        iw++;
      } else {
        clearInterval(introInterval);
      }
    }, introWordDelay);

    // ── 2: Fade intro after all words shown + 2.5s hold
    t = introWordEls.length * introWordDelay + 2500;
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

    // ── 4: Building + announce text (word-by-word)
    t += STEP;
    later(() => {
      buildingWrap.classList.remove('anim-hidden');
      buildingWrap.classList.add('anim-visible');
      announceText.innerHTML = this._buildColoredWords(this._insightText);
      announce.classList.add('visible');
      this._setGlobeMode('dim');

      const announceWordEls = announceText.querySelectorAll('.word');
      let aw = 0;
      const announceInterval = setInterval(() => {
        if (aw < announceWordEls.length) { announceWordEls[aw].classList.add('visible'); aw++; }
        else clearInterval(announceInterval);
      }, 120);
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

    // ── Finally: next button
    t += STEP;
    later(() => {
      if (nextBtn) { nextBtn.classList.remove('anim-hidden'); nextBtn.classList.add('anim-visible'); }
    }, t);
  }

  populateCalcBreakdown() {
    const entry = this.exhibitEntry;
    if (!entry) return;

    const perUser = this.simulationResults.perUser;
    const minE = entry.min;
    const maxE = entry.max;
    const aiUsers = entry.city.aiUsers;

    const breakdown = document.getElementById('calc-breakdown');
    breakdown.innerHTML = `
      <div class="calc-step">
        <div class="calc-step-label">${i18n.t('calc_step1_label')}</div>
        <div class="calc-step-formula">1 × ${WORKLOADS[this.selectedWorkload]?.name || this.selectedWorkload}</div>
        <div class="calc-step-result">= ${perUser.electricity_kWh.toFixed(6)} kWh</div>
      </div>
      <div class="calc-step">
        <div class="calc-step-label">BEST CASE — ${minE.destination}</div>
        <div class="calc-step-result">${(minE.electricity_kWh / aiUsers).toFixed(6)} kWh · ${((minE.co2_kg / aiUsers) * 1000).toFixed(2)} g CO₂ · ${((minE.water_L / aiUsers) * 1000).toFixed(2)} mL water</div>
      </div>
      <div class="calc-step">
        <div class="calc-step-label">WORST CASE — ${maxE.destination}</div>
        <div class="calc-step-result">${(maxE.electricity_kWh / aiUsers).toFixed(6)} kWh · ${((maxE.co2_kg / aiUsers) * 1000).toFixed(2)} g CO₂ · ${((maxE.water_L / aiUsers) * 1000).toFixed(2)} mL water</div>
      </div>
      <div class="calc-step" style="border-left-color: var(--emissions);">
        <div class="calc-step-label">${i18n.t('calc_total_label')}</div>
        <div class="calc-step-result" style="font-size: 22px;">CO₂ ranges ${((minE.co2_kg / aiUsers) * 1000).toFixed(2)} – ${((maxE.co2_kg / aiUsers) * 1000).toFixed(2)} g</div>
      </div>
    `;
  }

  bindBodyResult() {
    document.getElementById('btn-to-city').addEventListener('click', () => {
      this.populateCityScale();
      const cityName = CITIES[this.selectedCity]?.name || this.selectedCity;
      const workloadName = i18n.tMap('workload_names', this.selectedWorkload);
      const entry = this.exhibitEntry;
      const neighborhoodKwh = entry ? entry.max.electricity_kWh.toFixed(1) : '0';
      const cityAiUsers = entry ? entry.city.aiUsers : 0;
      const minDest = entry ? entry.min.destination : '';
      const minCO2 = entry ? entry.min.co2_kg.toFixed(1) : '0';
      const maxDest = entry ? entry.max.destination : '';
      const maxCO2 = entry ? entry.max.co2_kg.toFixed(1) : '0';
      this._setGlobeMode('visible');
      this.showCityTransition(cityName, workloadName, neighborhoodKwh, cityAiUsers, minDest, minCO2, maxDest, maxCO2, () => {
        this._setGlobeMode('dim');
        this.showPage('city-scale');
        this.runCityScaleAnimation();
      });
    });

    // Calculation popup
    const popup = document.getElementById('calc-popup');
    const calcInfoBtn = document.getElementById('btn-calc-info');
    if (calcInfoBtn) {
      calcInfoBtn.addEventListener('click', () => {
        popup.classList.remove('hidden');
      });
    }
    document.getElementById('calc-popup-close').addEventListener('click', () => {
      popup.classList.add('hidden');
    });
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.classList.add('hidden');
    });
  }

  // ─── STEP 2: City Scale ───────────────────────────

  _box(w, h, d, cx = 0, cy = 0, cz = 0, opts = '') {
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const wn = opts.includes('w') ? ' win' : '';
    const noT = opts.includes('t');
    const noB = opts.includes('b');
    let s = '';
    s += `<div class="bf${wn}" style="width:${w}px;height:${h}px;transform:translate3d(${cx-hw}px,${cy-hh}px,${cz}px) translateZ(${hd}px)"></div>`;
    s += `<div class="bf${wn}" style="width:${w}px;height:${h}px;transform:translate3d(${cx-hw}px,${cy-hh}px,${cz}px) rotateY(180deg) translateZ(${hd}px)"></div>`;
    s += `<div class="bf sd${wn}" style="width:${d}px;height:${h}px;transform:translate3d(${cx-hd}px,${cy-hh}px,${cz}px) rotateY(-90deg) translateZ(${hw}px)"></div>`;
    s += `<div class="bf sd${wn}" style="width:${d}px;height:${h}px;transform:translate3d(${cx-hd}px,${cy-hh}px,${cz}px) rotateY(90deg) translateZ(${hw}px)"></div>`;
    if (!noT) s += `<div class="bf tp" style="width:${w}px;height:${d}px;transform:translate3d(${cx-hw}px,${cy-hd}px,${cz}px) rotateX(90deg) translateZ(${hh}px)"></div>`;
    if (!noB) s += `<div class="bf" style="width:${w}px;height:${d}px;transform:translate3d(${cx-hw}px,${cy-hd}px,${cz}px) rotateX(-90deg) translateZ(${hh}px)"></div>`;
    return s;
  }

  _getBuildingModels() {
    const B = (w, h, d, cx, cy, cz, o) => this._box(w, h, d, cx, cy, cz, o);
    const W = (cls, inner) => `<div class="bldg-3d-scene"><div class="bldg-3d-object ${cls}">${inner}</div></div>`;

    return {
      // Two apartment towers, cleanly separated
      residential: W('obj-residential',
        B(22, 44, 18, -14, 0, 0, 'w') +
        B(18, 32, 14, 14, 6, 0, 'w')
      ),

      // Main block + perpendicular wing (grows from front face)
      hospital: W('obj-hospital',
        B(36, 24, 22, 0, 0, 0, 'w') +
        B(14, 24, 10, 0, 0, 16) +
        `<div class="cross" style="transform:translate3d(0px,-12.5px,0px) rotateX(90deg)"></div>`
      ),

      // Main wing + rear wings (no overlap) + tower stacked on top
      school: W('obj-school',
        B(44, 18, 20, 0, 2, 0, 'w') +
        B(16, 18, 14, -16, 2, -17) +
        B(16, 18, 14, 16, 2, -17) +
        B(8, 12, 8, 0, -13, 0, 'b') +
        `<div class="flag" style="height:14px;transform:translate3d(3px,-33px,3px)"></div>`
      ),

      // Open-top box with solid floor + field overlay + floodlights
      stadium: W('obj-stadium',
        B(48, 14, 32, 0, 3, 0, 't') +
        `<div class="field" style="width:34px;height:20px;transform:translate3d(-17px,-1px,0px) rotateX(90deg)"></div>` +
        `<div class="flood f1" style="height:18px;transform:translate3d(-23px,-12px,15px)"></div>` +
        `<div class="flood f2" style="height:18px;transform:translate3d(23px,-12px,15px)"></div>` +
        `<div class="flood f3" style="height:18px;transform:translate3d(-23px,-12px,-15px)"></div>` +
        `<div class="flood f4" style="height:18px;transform:translate3d(23px,-12px,-15px)"></div>`
      ),

      // Terminal + tower shaft + cab (stacked, no overlap) + runway + plane
      airport: W('obj-airport',
        B(44, 14, 18, 0, 3, 0, 'w') +
        B(6, 28, 6, 26, -4) +
        B(12, 6, 12, 26, -21, 0, 'b') +
        `<div class="rw" style="width:52px;height:10px;transform:translate3d(-26px,5px,-22px) rotateX(90deg)"></div>` +
        `<div class="plane" style="transform:translate3d(6px,9px,-20px) rotateX(90deg)"></div>`
      ),

      // Dock + containers sitting ON dock + stacked container + cranes + water
      port: W('obj-port',
        B(44, 6, 24, 0, 8) +
        B(10, 10, 8, -12, 0, 4) +
        B(10, 10, 8, 0, 0, 4) +
        B(10, 10, 8, -12, -10, 4, 'b') +
        `<div class="crane" style="height:28px;transform:translate3d(-20px,-23px,11px)"></div>` +
        `<div class="crane" style="height:24px;transform:translate3d(16px,-19px,11px)"></div>` +
        `<div class="water" style="width:44px;height:16px;transform:translate3d(-22px,3px,-20px) rotateX(90deg)"></div>`
      ),

      // Main hall + chimneys on roof + sawtooth panels
      factory: W('obj-factory',
        B(40, 18, 24, 0, 2) +
        `<div class="chimney" style="width:5px;height:16px;transform:translate3d(-10px,-23px,4px)"></div>` +
        `<div class="chimney" style="width:5px;height:12px;transform:translate3d(8px,-19px,4px)"></div>` +
        `<div class="roofpanel" style="width:12px;height:8px;transform:translate3d(-14px,-15px,-10px) rotateX(-50deg)"></div>` +
        `<div class="roofpanel" style="width:12px;height:8px;transform:translate3d(-2px,-15px,-10px) rotateX(-50deg)"></div>` +
        `<div class="roofpanel" style="width:12px;height:8px;transform:translate3d(10px,-15px,-10px) rotateX(-50deg)"></div>`
      ),

      // Tower sits on wider base (no overlap) + antenna
      officeTower: W('obj-office',
        B(18, 44, 16, 0, -6, 0, 'wb') +
        B(24, 8, 20, 0, 20) +
        `<div class="ant" style="height:14px;transform:translate3d(0px,-42px,0px)"></div>`
      ),
    };
  }

  populateCityScale() {
    const entry = this.exhibitEntry;
    if (!entry) return;

    const perOperationKwh = this.simulationResults.electricity.withOverhead;
    const totalKwh = entry.max.electricity_kWh;
    const aiUsers = entry.city.aiUsers;
    const cityName = CITIES[this.selectedCity]?.name || this.selectedCity.toUpperCase();

    document.getElementById('s2-energy-value').textContent = perOperationKwh.toFixed(4);
    document.getElementById('s2-pop-value').textContent = aiUsers.toLocaleString();
    document.getElementById('s2-pop-label').textContent =
      `${(i18n.t('s2_ai_users_in') || 'AI USERS IN')} ${cityName}`;
    document.getElementById('s2-total-value').textContent = totalKwh.toFixed(1);

    const maxBH = entry.max.buildingHours;
    const groups = entry.op.showGroups;
    const exhibitToModel = { officeTowers: 'officeTower' };

    const buildingModels = this._getBuildingModels();

    const buildComboCard = (groupKeys, label, index) => {
      const buildings = groupKeys.map(ek => {
        const modelKey = exhibitToModel[ek] || ek;
        const bt = BUILDING_TYPES[modelKey];
        const bh = maxBH[ek];
        return { exhibitKey: ek, modelKey, bt, hours: bh ? bh.elec : 0 };
      }).filter(b => b.bt);

      const sumReciprocal = buildings.reduce((sum, b) => sum + (b.hours > 0 ? 1 / b.hours : 0), 0);
      const combinedHours = sumReciprocal > 0 ? 1 / sumReciprocal : 0;

      const buildingList = buildings.map(b => {
        const model3d = buildingModels[b.modelKey] || `<span style="font-size:18px">${b.bt.icon}</span>`;
        return `<div class="combo-building s2-building-hidden">
          <div class="combo-building-model">${model3d}</div>
          <span class="combo-building-name">${i18n.tMap('building_names', b.bt.id).toUpperCase()}</span>
        </div>`;
      }).join('');

      return `
      <div class="combo-card" data-group="${index}">
        <div class="combo-card-label">${label}</div>
        <div class="combo-card-buildings combo-layout-${buildings.length}">${buildingList}</div>
        <div class="combo-card-duration">${this.formatDuration(combinedHours)}</div>
        <div class="combo-card-subtitle">${i18n.t('combo_running') || 'ALL RUNNING TOGETHER'}</div>
        <div class="combo-card-bar">
          <div class="combo-card-fill" style="width: ${Math.min(100, (combinedHours / 24) * 100)}%"></div>
        </div>
      </div>`;
    };

    const cardsContainer = document.getElementById('building-cards');
    cardsContainer.innerHTML =
      buildComboCard(groups.primary, i18n.t('combo_primary') || 'COMBINATION A', 0) +
      buildComboCard(groups.secondary, i18n.t('combo_secondary') || 'COMBINATION B', 1);

    this._bindCardSelection(cardsContainer, groups, exhibitToModel);
  }

  _bindCardSelection(cardsContainer, groups, exhibitToModel) {
    const pickBtn = document.getElementById('btn-pick-card');
    const traceBtn = document.getElementById('btn-to-planetary');

    cardsContainer.querySelectorAll('.combo-card').forEach(card => {
      card.addEventListener('click', () => {
        cardsContainer.querySelectorAll('.combo-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const groupIdx = parseInt(card.dataset.group);
        const groupKeys = groupIdx === 0 ? groups.primary : groups.secondary;
        const pwmValues = groupKeys.map(ek => {
          const modelKey = exhibitToModel[ek] || ek;
          return BUILDING_TYPES[modelKey]?.pwm || 0;
        });

        this._s2SelectedCard = true;
        if (pickBtn) pickBtn.disabled = false;
      });
    });
  }

  runCityScaleAnimation() {
    if (this._s2AnimTimers) {
      this._s2AnimTimers.forEach(t => clearTimeout(t));
    }
    this._s2AnimTimers = [];
    this._s2SelectedCard = false;

    const energyEl = document.getElementById('s2-energy');
    const popEl = document.getElementById('s2-population');
    const totalEl = document.getElementById('s2-total');
    const cardsWrap = document.getElementById('s2-cards-wrap');
    const buttonsEl = document.getElementById('s2-buttons');
    const pickBtn = document.getElementById('btn-pick-card');
    const traceBtn = document.getElementById('btn-to-planetary');

    energyEl.className = 's2-float s2-energy';
    popEl.className = 's2-float s2-population';
    totalEl.className = 's2-float s2-total';
    cardsWrap.classList.remove('s2-visible');
    buttonsEl.classList.remove('s2-visible');
    pickBtn.disabled = true;
    traceBtn.disabled = true;

    const t = (fn, ms) => { const id = setTimeout(fn, ms); this._s2AnimTimers.push(id); };

    // 1. Energy fades in centered
    t(() => {
      energyEl.classList.add('s2-show');
    }, 800);

    // 2. Energy moves to top-left
    t(() => {
      energyEl.classList.add('s2-animate');
      void energyEl.offsetWidth;
      energyEl.classList.add('s2-parked');
    }, 4500);

    // 3. Population fades in centered
    t(() => {
      popEl.classList.add('s2-show');
    }, 6200);

    // 4. Population moves to top-center
    t(() => {
      popEl.classList.add('s2-animate');
      void popEl.offsetWidth;
      popEl.classList.add('s2-parked');
    }, 9500);

    // 5. Total kWh fades in centered
    t(() => {
      totalEl.classList.add('s2-show');
    }, 11200);

    // 6. Total kWh moves to top-right
    t(() => {
      totalEl.classList.add('s2-animate');
      void totalEl.offsetWidth;
      totalEl.classList.add('s2-parked');
    }, 14800);

    // 7. Cards fade in
    t(() => {
      cardsWrap.classList.add('s2-visible');
    }, 16500);

    // 8. Buildings fade in one by one
    t(() => {
      const buildings = cardsWrap.querySelectorAll('.combo-building');
      buildings.forEach((b, i) => {
        t(() => {
          b.classList.remove('s2-building-hidden');
          b.classList.add('s2-building-visible');
        }, i * 1200);
      });

      // 9. Buttons appear after all buildings
      t(() => {
        buttonsEl.classList.add('s2-visible');
        pickBtn.disabled = false;
      }, buildings.length * 1200 + 1500);
    }, 17500);
  }

  formatDuration(hours) {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const h = Math.round(hours % 24);
      const dWord = days > 1 ? i18n.t('dur_days') : i18n.t('dur_day');
      return h > 0 ? `${days} ${dWord} ${h} ${i18n.t('dur_hours')}` : `${days} ${dWord}`;
    } else if (hours >= 1) {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      const hWord = h > 1 ? i18n.t('dur_hours') : i18n.t('dur_hour');
      return m > 0 ? `${h} ${hWord} ${m} ${i18n.t('dur_min')}` : `${h} ${hWord}`;
    } else {
      const m = Math.round(hours * 60);
      return m > 0 ? `${m} ${i18n.t('dur_minutes')}` : i18n.t('dur_less_than_min');
    }
  }

  bindCityScale() {
    // "Pick one card to light up" — sends Arduino brightness for the selected card
    document.getElementById('btn-pick-card').addEventListener('click', () => {
      const selected = document.querySelector('.combo-card.selected');
      if (selected) {
        const groupIdx = parseInt(selected.dataset.group);
        const entry = this.exhibitEntry;
        if (entry) {
          const groups = entry.op.showGroups;
          const exhibitToModel = { officeTowers: 'officeTower' };
          const groupKeys = groupIdx === 0 ? groups.primary : groups.secondary;
          const pwmValues = groupKeys.map(ek => {
            const modelKey = exhibitToModel[ek] || ek;
            return BUILDING_TYPES[modelKey]?.pwm || 0;
          });
          ledController.setBuildingGroup(groupKeys, exhibitToModel);
        }
        document.getElementById('btn-to-planetary').disabled = false;
      }
    });

    document.getElementById('btn-to-planetary').addEventListener('click', () => {
      this.triggerPlanetary();
    });
  }

  restart() {
    ledController.turnOff();
    if (this._s2AnimTimers) {
      this._s2AnimTimers.forEach(t => clearTimeout(t));
      this._s2AnimTimers = [];
    }
    this.selectedCity = null;
    this.selectedWorkload = null;
    this.exhibitEntry = null;
    this.simulationResults = null;
    this.selectedScenarioComponents.clear();
    this.onboardStepIndex = 0;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-consumption').disabled = true;
    document.querySelectorAll('.s1-section-label').forEach(el => {
      el.classList.remove('s1-done');
      el.classList.add('s1-flash');
    });
    document.getElementById('lang-switcher').classList.add('onboarding-lang');
    document.getElementById('btn-learn-how').classList.add('hidden');
    document.getElementById('btn-learn-how').classList.remove('visible');
    channel.postMessage({ type: 'idle' });
    if (!this._destroyLandingWorld) {
      this._destroyLandingWorld = initHeroGlobe(
        document.getElementById('landing-globe-mount'),
        document.getElementById('landing-globe-overlay'),
      );
    }
    this._setGlobeMode('full');
    this._startSubtitleCycle();
    this.showPage('landing');
  }

  updateLedIndicator(level) {
    const dot = document.getElementById('led-dot');
    const label = document.getElementById('led-label');
    if (!dot || !label) return;

    if (level > 0) {
      dot.classList.add('on');
      dot.style.setProperty('--led-brightness', `${level / 255}`);
      label.textContent = i18n.t('led_level')(level);
    } else {
      dot.classList.remove('on');
      label.textContent = i18n.t('led_off');
    }
  }

  // ─── STEP 3: Planetary Scale ──────────────────────

  triggerPlanetary() {
    const entry = this.exhibitEntry;
    if (!entry) return;

    const minE = entry.min;
    const maxE = entry.max;

    channel.postMessage({
      type: 'trace-energy-flow',
      city: this.selectedCity,
      workload: this.selectedWorkload,
      exhibitMin: minE,
      exhibitMax: maxE,
    });

    const statsEl = document.getElementById('planetary-stats');
    statsEl.innerHTML = `
      <div class="planetary-stat-header" style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); padding-bottom: 4px; border-bottom: 1px solid var(--border-default); margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 2px;">MIN</span>
        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 2px;">MAX</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${minE.electricity_kWh.toFixed(1)} – ${maxE.electricity_kWh.toFixed(1)}</span>
        <span class="planetary-stat-label">${i18n.t('stat_kwh')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${minE.water_L.toFixed(1)} – ${maxE.water_L.toFixed(1)}</span>
        <span class="planetary-stat-label">${i18n.t('stat_water')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${minE.co2_kg.toFixed(1)} – ${maxE.co2_kg.toFixed(1)}</span>
        <span class="planetary-stat-label">${i18n.t('stat_co2')}</span>
      </div>
      <div class="planetary-stat">
        <span class="planetary-stat-value">${minE.distance_km.toLocaleString()} – ${maxE.distance_km.toLocaleString()}</span>
        <span class="planetary-stat-label">${i18n.t('stat_distance')}</span>
      </div>
    `;

    this.showPage('planetary-scale');
  }

  bindPlanetaryScale() {
    document.getElementById('btn-back-planetary').addEventListener('click', () => {
      this.populateCityScale();
      this.showPage('city-scale');
      this.runCityScaleAnimation();
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
          <h3>${i18n.tMap('scenario_names', c.id)}</h3>
          <p class="scenario-card-desc">${i18n.tMap('scenario_descs', c.id)}</p>
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
    if (!scenario) return;

    const original = this.simulationResults;
    const origPerUser = original.perUser || {};
    const dKwh = ((scenario.electricity.withOverhead - original.electricity.withOverhead) / original.electricity.withOverhead * 100);
    const dWater = origPerUser.water_mL ? ((scenario.water.liters - origPerUser.water_mL) / origPerUser.water_mL * 100) : 0;
    const dCO2 = origPerUser.co2_g ? ((scenario.emissions.grams - origPerUser.co2_g) / origPerUser.co2_g * 100) : 0;
    const maxE = this.exhibitEntry?.max;
    const dDist = maxE ? ((scenario.distance - maxE.distance_km) / maxE.distance_km * 100) : 0;

    const formatDelta = (val) => {
      const sign = val > 0 ? '+' : '';
      return `${sign}${Math.round(val)}%`;
    };
    const deltaClass = (val) => val < 0 ? 'delta-good' : val > 0 ? 'delta-bad' : 'delta-neutral';

    deltasEl.innerHTML = `
      <div class="scenario-delta ${deltaClass(dKwh)}">
        <span class="delta-icon">⚡</span>
        <span class="delta-value">${formatDelta(dKwh)}</span>
        <span class="delta-label">${i18n.t('delta_energy')}</span>
      </div>
      <div class="scenario-delta ${deltaClass(dWater)}">
        <span class="delta-icon">💧</span>
        <span class="delta-value">${formatDelta(dWater)}</span>
        <span class="delta-label">${i18n.t('delta_water_label')}</span>
      </div>
      <div class="scenario-delta ${deltaClass(dCO2)}">
        <span class="delta-icon">🌫️</span>
        <span class="delta-value">${formatDelta(dCO2)}</span>
        <span class="delta-label">${i18n.t('delta_co2_label')}</span>
      </div>
      <div class="scenario-delta ${deltaClass(dDist)}">
        <span class="delta-icon">📍</span>
        <span class="delta-value">${formatDelta(dDist)}</span>
        <span class="delta-label">${i18n.t('delta_distance_label')}</span>
      </div>
    `;
  }

  calculateScenario() {
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

    const entry = this.exhibitEntry;
    if (!entry) return null;

    const maxE = entry.max;
    const newDistance = maxE.distance_km * distMultiplier;
    const newKwh = maxE.electricity_kWh * pueMultiplier;
    const carbonFactor = Math.max(0.1, 1.0 + carbonOffset / 300);
    const newCO2 = maxE.co2_kg * carbonFactor;
    const newWater = maxE.water_L * waterMultiplier * pueMultiplier;

    return {
      distance: newDistance,
      electricity: { withOverhead: newKwh / (entry.city.aiUsers || 1) },
      water: { liters: newWater / (entry.city.aiUsers || 1) * 1000 },
      emissions: { grams: newCO2 / (entry.city.aiUsers || 1) * 1000 },
      flows: [],
      components: [...this.selectedScenarioComponents]
    };
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
