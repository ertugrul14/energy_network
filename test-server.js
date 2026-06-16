/**
 * GHOST NETWORK — Local WebSocket Test Server
 *
 * Mimics the ESP32's WebSocket relay for local browser testing.
 * Run: node test-server.js
 * Then open tablet.html and screen.html in separate browser tabs.
 *
 * This server:
 * - Relays messages between tablet and screen clients
 * - Handles LED commands (logs them to console)
 * - Sends LED state to new clients
 */

import { WebSocketServer } from 'ws';

const PORT = 81;
const wss = new WebSocketServer({ port: PORT });

const ledState = new Uint8Array(8);
const clients = new Map(); // ws → { role: string }

wss.on('connection', (ws) => {
  clients.set(ws, { role: 'unknown' });
  console.log(`[+] Client connected (${wss.clients.size} total)`);

  // Send current LED state
  ws.send(JSON.stringify({ type: 'led-state', zones: Array.from(ledState) }));

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    // Client identification
    if (msg.type === 'identify') {
      clients.get(ws).role = msg.role || 'unknown';
      console.log(`[ID] Client identified as: ${msg.role}`);
      return;
    }

    // LED command — process + broadcast
    if (msg.type === 'led') {
      if (Array.isArray(msg.zones)) {
        const names = ['Residential', 'Hospital', 'School', 'Office', 'Stadium', 'Airport', 'Port', 'Factory'];
        for (let i = 0; i < 8 && i < msg.zones.length; i++) {
          ledState[i] = msg.zones[i];
        }
        const active = [];
        for (let i = 0; i < 8; i++) {
          if (ledState[i] > 0) active.push(`${names[i]}:${ledState[i]}`);
        }
        console.log(`[LED] ${active.length ? active.join(', ') : 'All OFF'}`);
      }
      // Broadcast to all
      const ledMsg = JSON.stringify(msg);
      for (const client of wss.clients) {
        if (client.readyState === 1) client.send(ledMsg);
      }
      return;
    }

    // Relay to all other clients
    console.log(`[MSG] ${clients.get(ws).role} → ${msg.type}`);
    const relay = data.toString();
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(relay);
      }
    }
  });

  ws.on('close', () => {
    const info = clients.get(ws);
    clients.delete(ws);
    console.log(`[-] ${info.role} disconnected (${wss.clients.size} remaining)`);
  });
});

console.log(`\n  GHOST NETWORK — Test WebSocket Server`);
console.log(`  ──────────────────────────────────────`);
console.log(`  WebSocket: ws://localhost:${PORT}`);
console.log(`  \n  Now run "npm run dev" and open:`);
console.log(`    tablet.html  in one tab`);
console.log(`    screen.html  in another tab`);
console.log(`  \n  Messages between them will relay through here.\n`);
