import { TRANSLATIONS } from './translations.js';

const SUPPORTED_LANGS = ['en', 'ca', 'es'];
const STORAGE_KEY = 'ghost-network-lang';

class I18n {
  constructor() {
    this.lang = this._detectLang();
    this._listeners = [];
  }

  _detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
    const nav = navigator.language.slice(0, 2);
    if (SUPPORTED_LANGS.includes(nav)) return nav;
    return 'en';
  }

  get currentLang() {
    return this.lang;
  }

  get supportedLangs() {
    return SUPPORTED_LANGS;
  }

  setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    this.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyToDOM();
    this._listeners.forEach(fn => fn(lang));
  }

  t(key) {
    return TRANSLATIONS[this.lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  /**
   * Look up an entry inside a map-valued translation key (e.g. workload_names,
   * building_names). Falls back to the English map, then to the id itself.
   */
  tMap(mapKey, id) {
    const map = TRANSLATIONS[this.lang]?.[mapKey];
    const enMap = TRANSLATIONS.en[mapKey];
    return map?.[id] ?? enMap?.[id] ?? id;
  }

  applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (typeof text === 'string') {
        el.textContent = text;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const text = this.t(key);
      if (typeof text === 'string') {
        el.placeholder = text;
      }
    });
  }

  onChange(fn) {
    this._listeners.push(fn);
  }
}

export const i18n = new I18n();
