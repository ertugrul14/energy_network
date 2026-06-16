/*
 * GHOST NETWORK — ESP32-S3 Exhibition Hub
 *
 * WiFi AP + WebSocket relay + LED controller + static file server.
 * Serves tablet.html and screen.html from LittleFS.
 * Relays WebSocket messages between tablet and screen clients.
 * Drives 8 LED zones via LEDC PWM on MOSFET-switched 24V modules.
 *
 * Board: ESP32-S3-DevKitC-1 N16R8
 */

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>

// ── WiFi AP config ──────────────────────────────────────
const char* AP_SSID     = "GHOST-NETWORK";
const char* AP_PASSWORD = "energy2026";
const int   AP_CHANNEL  = 6;
const bool  AP_HIDDEN   = true;

// ── LED zone GPIO mapping (8 buildings) ─────────────────
// Each pin drives an IRLZ44N MOSFET gate → 24V LED module
const uint8_t LED_PINS[8] = {
  4,   // Zone 0: Residential
  5,   // Zone 1: Hospital
  6,   // Zone 2: School
  7,   // Zone 3: Office Tower
  15,  // Zone 4: Stadium
  16,  // Zone 5: Airport
  17,  // Zone 6: Port
  18   // Zone 7: Factory
};

const int PWM_FREQ       = 1000;   // 1 kHz
const int PWM_RESOLUTION = 8;      // 8-bit (0–255)

// ── Globals ─────────────────────────────────────────────
WebServer       server(80);
WebSocketsServer ws(81);

uint8_t ledValues[8] = {0};
uint8_t tabletClient = 255;   // WS client number for the tablet

// Track connected client roles
enum ClientRole { ROLE_UNKNOWN, ROLE_TABLET, ROLE_SCREEN };
ClientRole clientRoles[8] = { ROLE_UNKNOWN };

// ── MIME type lookup ────────────────────────────────────
String getMimeType(const String& path) {
  if (path.endsWith(".html")) return "text/html";
  if (path.endsWith(".js"))   return "application/javascript";
  if (path.endsWith(".css"))  return "text/css";
  if (path.endsWith(".json")) return "application/json";
  if (path.endsWith(".png"))  return "image/png";
  if (path.endsWith(".jpg"))  return "image/jpeg";
  if (path.endsWith(".svg"))  return "image/svg+xml";
  if (path.endsWith(".ico"))  return "image/x-icon";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".woff"))  return "font/woff";
  if (path.endsWith(".glb"))   return "model/gltf-binary";
  return "application/octet-stream";
}

// ── Serve static files from LittleFS ────────────────────
bool handleFileRequest(String path) {
  if (path == "/") path = "/index.html";

  // Try gzipped version first
  String gzPath = path + ".gz";
  if (LittleFS.exists(gzPath)) {
    File file = LittleFS.open(gzPath, "r");
    server.streamFile(file, getMimeType(path));
    file.close();
    return true;
  }

  if (LittleFS.exists(path)) {
    File file = LittleFS.open(path, "r");
    server.streamFile(file, getMimeType(path));
    file.close();
    return true;
  }

  return false;
}

// ── LED control ─────────────────────────────────────────
void setLedZone(uint8_t zone, uint8_t brightness) {
  if (zone >= 8) return;
  ledValues[zone] = brightness;
  ledcWrite(LED_PINS[zone], brightness);
}

void allLedsOff() {
  for (int i = 0; i < 8; i++) {
    setLedZone(i, 0);
  }
}

void handleLedCommand(JsonDocument& doc) {
  if (doc["zones"].is<JsonArray>()) {
    JsonArray zones = doc["zones"].as<JsonArray>();
    for (int i = 0; i < 8 && i < (int)zones.size(); i++) {
      setLedZone(i, zones[i].as<uint8_t>());
    }
  }
}

// ── WebSocket events ────────────────────────────────────
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = ws.remoteIP(num);
      Serial.printf("[WS] Client %u connected from %s\n", num, ip.toString().c_str());
      if (num < 8) clientRoles[num] = ROLE_UNKNOWN;

      // Send current LED state to new client
      JsonDocument stateDoc;
      stateDoc["type"] = "led-state";
      JsonArray zones = stateDoc["zones"].to<JsonArray>();
      for (int i = 0; i < 8; i++) zones.add(ledValues[i]);
      String stateMsg;
      serializeJson(stateDoc, stateMsg);
      ws.sendTXT(num, stateMsg);
      break;
    }

    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client %u disconnected\n", num);
      if (num < 8) clientRoles[num] = ROLE_UNKNOWN;
      break;

    case WStype_TEXT: {
      JsonDocument doc;
      DeserializationError err = deserializeJson(doc, payload, length);
      if (err) {
        Serial.printf("[WS] JSON parse error from client %u: %s\n", num, err.c_str());
        break;
      }

      const char* msgType = doc["type"];
      if (!msgType) break;

      // Client identification
      if (strcmp(msgType, "identify") == 0) {
        const char* role = doc["role"];
        if (role && num < 8) {
          if (strcmp(role, "tablet") == 0) {
            clientRoles[num] = ROLE_TABLET;
            Serial.printf("[WS] Client %u identified as TABLET\n", num);
          } else if (strcmp(role, "screen") == 0) {
            clientRoles[num] = ROLE_SCREEN;
            Serial.printf("[WS] Client %u identified as SCREEN\n", num);
          }
        }
        break;
      }

      // LED commands — process locally, don't relay
      if (strcmp(msgType, "led") == 0) {
        handleLedCommand(doc);
        // Broadcast LED state to all clients
        String ledMsg;
        serializeJson(doc, ledMsg);
        ws.broadcastTXT(ledMsg);
        break;
      }

      // All other messages: relay to all other connected clients
      for (uint8_t i = 0; i < WEBSOCKETS_SERVER_CLIENT_MAX; i++) {
        if (i != num) {
          ws.sendTXT(i, payload, length);
        }
      }
      break;
    }

    default:
      break;
  }
}

// ── Status endpoint ─────────────────────────────────────
void handleStatus() {
  JsonDocument doc;
  doc["uptime"] = millis() / 1000;
  doc["heap"] = ESP.getFreeHeap();
  doc["clients"] = ws.connectedClients();
  JsonArray leds = doc["leds"].to<JsonArray>();
  for (int i = 0; i < 8; i++) leds.add(ledValues[i]);

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

// ── Setup ───────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== GHOST NETWORK ===");

  // Init LittleFS
  if (!LittleFS.begin(true)) {
    Serial.println("[FS] LittleFS mount failed!");
  } else {
    Serial.println("[FS] LittleFS mounted");
  }

  // Init LED PWM channels
  for (int i = 0; i < 8; i++) {
    ledcAttach(LED_PINS[i], PWM_FREQ, PWM_RESOLUTION);
    ledcWrite(LED_PINS[i], 0);
  }
  Serial.println("[LED] 8 zones initialized");

  // Start WiFi AP
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASSWORD, AP_CHANNEL, AP_HIDDEN ? 1 : 0, 4);
  delay(100);
  WiFi.softAPConfig(
    IPAddress(192, 168, 4, 1),
    IPAddress(192, 168, 4, 1),
    IPAddress(255, 255, 255, 0)
  );
  Serial.printf("[WiFi] AP started: SSID=%s IP=%s\n", AP_SSID, WiFi.softAPIP().toString().c_str());

  // DNS — redirect all domains to this IP (captive portal style)
  // Not strictly needed since clients connect by IP, but helps if
  // someone types a URL instead.

  // HTTP server routes
  server.on("/status", handleStatus);
  server.onNotFound([]() {
    if (!handleFileRequest(server.uri())) {
      server.send(404, "text/plain", "Not found");
    }
  });
  server.begin();
  Serial.println("[HTTP] Server started on port 80");

  // WebSocket server
  ws.begin();
  ws.onEvent(onWebSocketEvent);
  Serial.println("[WS] Server started on port 81");

  // Watchdog timer — reboot if loop hangs for 30s
  esp_task_wdt_config_t wdtConfig = {
    .timeout_ms = 30000,
    .idle_core_mask = 0,
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdtConfig);
  esp_task_wdt_add(NULL);

  // Startup LED test — sweep each zone briefly
  for (int i = 0; i < 8; i++) {
    setLedZone(i, 80);
    delay(100);
    setLedZone(i, 0);
  }
  Serial.println("[BOOT] Ready!");
}

// ── Loop ────────────────────────────────────────────────
void loop() {
  server.handleClient();
  ws.loop();
  esp_task_wdt_reset();
}
