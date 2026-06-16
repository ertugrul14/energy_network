/*
 * GHOST NETWORK — Single-LED Hardware Test
 *
 * Bench test for ONE building zone before wiring all 8.
 * No WiFi, no WebSocket — just proves the GPIO → 220Ω → MOSFET gate →
 * IRLZ44N → 24V LED → GND switching path (and the LEDC PWM the real
 * firmware uses).
 *
 * Wire the gate resistor to GPIO 4 (this is Zone 0 / Residential in the
 * final firmware, so a passing test maps straight to the real pin map).
 * If you wired a different pin, just change LED_PIN below.
 *
 * Board: ESP32-S3-DevKitC-1 N16R8
 *
 * Expected behaviour on a correct setup:
 *   1. LED blinks 5× (1s on / 1s off)  ← proves on/off switching
 *   2. LED smoothly fades up then down ← proves LEDC PWM (used by firmware)
 *   3. Repeats forever
 * The onboard serial monitor (115200) prints each phase.
 */

const uint8_t  LED_PIN        = 4;     // GPIO 4 = Zone 0 (Residential)
const int      PWM_FREQ       = 1000;  // 1 kHz — same as full firmware
const int      PWM_RESOLUTION = 8;     // 8-bit (0–255), same as firmware

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== GHOST NETWORK — Single LED Test ===");
  Serial.printf("Testing GPIO %u\n", LED_PIN);

  ledcAttach(LED_PIN, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(LED_PIN, 0);   // start OFF (matches gate pulldown)
}

void loop() {
  // ── Phase 1: hard on/off blink (tests the switching path) ──
  Serial.println("[Phase 1] Blink 5x");
  for (int i = 0; i < 5; i++) {
    ledcWrite(LED_PIN, 255);   // full on
    delay(1000);
    ledcWrite(LED_PIN, 0);     // off
    delay(1000);
  }

  // ── Phase 2: smooth fade (tests PWM dimming) ──
  Serial.println("[Phase 2] Fade up");
  for (int b = 0; b <= 255; b++) { ledcWrite(LED_PIN, b); delay(8); }
  delay(400);
  Serial.println("[Phase 2] Fade down");
  for (int b = 255; b >= 0; b--) { ledcWrite(LED_PIN, b); delay(8); }
  delay(800);
}
