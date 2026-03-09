/*
 * ENERGY NETWORK — Exhibition LED Controller
 *
 * Upload this sketch to your Arduino board.
 * Connect an LED to pin 9 (with a resistor).
 *
 * The web page sends a brightness value (0-255) over Serial.
 * Protocol:
 *   "0\n"   → LED off
 *   "20\n"  → level 1 - very dim  (Residential)
 *   "80\n"  → level 2 - dim       (Hospital)
 *   "160\n" → level 3 - medium    (University)
 *   "255\n" → level 4 - bright    (Airport)
 *
 * Steps:
 *   1. Open Arduino IDE and upload this sketch
 *   2. Open tablet.html in Chrome (http://localhost:3000/tablet.html)
 *   3. At City Scale step, click "CONNECT ARDUINO"
 *   4. Select the serial port of your Arduino
 *   5. Click building cards or "LIGHT UP MODEL" button
 */

int ledPin = 9;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
  Serial.setTimeout(100);
  analogWrite(ledPin, 0);
}

void loop() {
  if (Serial.available() > 0) {
    int val = Serial.parseInt();
    if (val >= 0 && val <= 255) {
      analogWrite(ledPin, val);
    }
    // Clear remaining characters (e.g. newline)
    while (Serial.available() > 0) {
      Serial.read();
    }
  }
}
