/**
 * EXHIBITION — WebSocket Bridge
 *
 * Drop-in replacement for BroadcastChannel. Connects to the ESP32's
 * WebSocket server and relays messages between tablet and screen.
 * Falls back to BroadcastChannel when running on localhost (dev mode).
 */

const ESP32_IP = '192.168.4.1';
const WS_PORT = 81;

class WsBridge {
  constructor(role) {
    this.role = role; // 'tablet' or 'screen'
    this._listeners = [];
    this._ws = null;
    this._bc = null;
    this._reconnectTimer = null;
    this._reconnectDelay = 1000;

    if (this._isLocalDev()) {
      this._initBroadcastChannel();
    } else {
      this._initWebSocket();
    }
  }

  _isLocalDev() {
    const host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') === false && host !== ESP32_IP;
  }

  // ── BroadcastChannel fallback (dev mode) ──────────────
  _initBroadcastChannel() {
    this._bc = new BroadcastChannel('ghost-network-exhibition');
    this._bc.addEventListener('message', (e) => {
      this._dispatch(e.data);
    });
    console.log(`[WsBridge] Dev mode — using BroadcastChannel (role: ${this.role})`);
  }

  // ── WebSocket (production on ESP32 AP) ────────────────
  _initWebSocket() {
    const host = location.hostname || ESP32_IP;
    const url = `ws://${host}:${WS_PORT}`;
    console.log(`[WsBridge] Connecting to ${url} as ${this.role}…`);

    this._ws = new WebSocket(url);

    this._ws.onopen = () => {
      console.log('[WsBridge] Connected');
      this._reconnectDelay = 1000;
      this._ws.send(JSON.stringify({ type: 'identify', role: this.role }));
      this._dispatch({ type: '_ws:connected' });
    };

    this._ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this._dispatch(msg);
      } catch (err) {
        console.warn('[WsBridge] Bad message:', e.data);
      }
    };

    this._ws.onclose = () => {
      console.log('[WsBridge] Disconnected, reconnecting…');
      this._dispatch({ type: '_ws:disconnected' });
      this._scheduleReconnect();
    };

    this._ws.onerror = (err) => {
      console.warn('[WsBridge] Error:', err);
      this._ws.close();
    };
  }

  _scheduleReconnect() {
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = setTimeout(() => {
      this._initWebSocket();
    }, this._reconnectDelay);
    this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, 10000);
  }

  // ── Public API (matches BroadcastChannel usage) ───────

  postMessage(msg) {
    if (this._bc) {
      this._bc.postMessage(msg);
      return;
    }
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
    }
  }

  addEventListener(type, fn) {
    this._listeners.push(fn);
  }

  onMessage(fn) {
    this._listeners.push(fn);
  }

  _dispatch(data) {
    for (const fn of this._listeners) {
      fn(data);
    }
  }

  get connected() {
    if (this._bc) return true;
    return this._ws && this._ws.readyState === WebSocket.OPEN;
  }
}

export function createBridge(role) {
  return new WsBridge(role);
}
