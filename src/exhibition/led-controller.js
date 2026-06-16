/**
 * EXHIBITION — WiFi LED Controller
 *
 * Replaces arduino.js (Web Serial). Sends 8-zone LED commands
 * over WebSocket to the ESP32, which drives MOSFET-switched 24V LEDs.
 *
 * Zone mapping (matches ESP32 firmware):
 *   0: Residential  (GPIO 4)
 *   1: Hospital     (GPIO 5)
 *   2: School       (GPIO 6)
 *   3: Office Tower (GPIO 7)
 *   4: Stadium      (GPIO 15)
 *   5: Airport      (GPIO 16)
 *   6: Port         (GPIO 17)
 *   7: Factory      (GPIO 18)
 */

import { BUILDING_TYPES } from './models.js';

const ZONE_MAP = {
  residential: 0,
  hospital:    1,
  school:      2,
  officeTower: 3,
  stadium:     4,
  airport:     5,
  port:        6,
  factory:     7,
};

class LedController {
  constructor() {
    this.bridge = null;
    this.zones = new Uint8Array(8);
  }

  attach(bridge) {
    this.bridge = bridge;
    bridge.onMessage((msg) => {
      if (msg.type === 'led' || msg.type === 'led-state') {
        if (Array.isArray(msg.zones)) {
          for (let i = 0; i < 8; i++) {
            this.zones[i] = msg.zones[i] || 0;
          }
        }
      }
    });
  }

  _send() {
    if (!this.bridge) return;
    const msg = { type: 'led', zones: Array.from(this.zones) };
    this.bridge.postMessage(msg);
    window.dispatchEvent(new CustomEvent('led:update', { detail: { zones: Array.from(this.zones) } }));
  }

  setZone(zoneOrName, brightness) {
    const idx = typeof zoneOrName === 'string' ? ZONE_MAP[zoneOrName] : zoneOrName;
    if (idx === undefined || idx < 0 || idx >= 8) return;
    this.zones[idx] = Math.max(0, Math.min(255, Math.round(brightness)));
    this._send();
  }

  setZones(values) {
    for (let i = 0; i < 8 && i < values.length; i++) {
      this.zones[i] = Math.max(0, Math.min(255, Math.round(values[i])));
    }
    this._send();
  }

  setBuildingGroup(buildingKeys, exhibitToModel) {
    this.zones.fill(0);
    for (const ek of buildingKeys) {
      const modelKey = (exhibitToModel && exhibitToModel[ek]) || ek;
      const bt = BUILDING_TYPES[modelKey];
      if (bt) {
        const zone = ZONE_MAP[modelKey];
        if (zone !== undefined) {
          this.zones[zone] = bt.pwm;
        }
      }
    }
    this._send();
  }

  allOff() {
    this.zones.fill(0);
    this._send();
  }

  // Backward-compatible API (matches old arduino.sendBrightness)
  sendBrightness(pwmValue) {
    const clamped = Math.max(0, Math.min(255, Math.round(pwmValue)));
    window.dispatchEvent(new CustomEvent('arduino:light', { detail: { level: clamped } }));
    return clamped;
  }

  turnOff() {
    this.allOff();
    window.dispatchEvent(new CustomEvent('arduino:light', { detail: { level: 0 } }));
  }
}

export const ledController = new LedController();
export { ZONE_MAP };
