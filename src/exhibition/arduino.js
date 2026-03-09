/**
 * EXHIBITION - Arduino Bridge (Web Serial)
 * 
 * Communicates with the Arduino LED model via Web Serial API.
 * Protocol: send a PWM brightness value (0-255) as text + newline.
 *   "0\n"   → LED off
 *   "40\n"  → dim
 *   "120\n" → medium
 *   "255\n" → full brightness
 * 
 * Requires Chrome or Edge (Web Serial API support).
 */

class ArduinoBridge {
  constructor() {
    this.connected = false;
    this.port = null;
    this.writer = null;
  }

  async connect() {
    if (!('serial' in navigator)) {
      alert('Web Serial API is not supported.\nPlease use Google Chrome or Microsoft Edge.');
      return false;
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.writer = this.port.writable.getWriter();
      this.connected = true;
      console.log('[Arduino] Connected via Web Serial');
      window.dispatchEvent(new CustomEvent('arduino:connected'));
      return true;
    } catch (err) {
      console.error('[Arduino] Connection failed:', err.message);
      return false;
    }
  }

  async sendBrightness(pwmValue) {
    const clamped = Math.max(0, Math.min(255, Math.round(pwmValue)));
    console.log(`[Arduino] Brightness: ${clamped}/255`);

    if (this.writer) {
      const data = new TextEncoder().encode(`${clamped}\n`);
      await this.writer.write(data);
    }

    window.dispatchEvent(new CustomEvent('arduino:light', { detail: { level: clamped } }));
    return clamped;
  }

  async turnOff() {
    return this.sendBrightness(0);
  }

  async disconnect() {
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    this.connected = false;
    console.log('[Arduino] Disconnected');
    window.dispatchEvent(new CustomEvent('arduino:disconnected'));
  }
}

// Singleton
export const arduino = new ArduinoBridge();
