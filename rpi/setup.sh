#!/bin/bash
# GHOST NETWORK — Raspberry Pi 5 Kiosk Setup
#
# Run this script once on the Pi to configure it as a kiosk display.
# Assumes Raspberry Pi OS with Desktop (64-bit).
#
# Usage: sudo bash setup.sh

set -e

echo "=== GHOST NETWORK — Pi Kiosk Setup ==="

# 1. Configure WiFi to connect to ESP32 AP
echo "[WiFi] Configuring connection to ESP32 AP..."
cat > /etc/NetworkManager/system-connections/ghost-network.nmconnection << 'WIFI'
[connection]
id=ghost-network
type=wifi
autoconnect=true
autoconnect-priority=100

[wifi]
mode=infrastructure
ssid=GHOST-NETWORK
hidden=true

[wifi-security]
key-mgmt=wpa-psk
psk=energy2026

[ipv4]
method=auto

[ipv6]
method=disabled
WIFI
chmod 600 /etc/NetworkManager/system-connections/ghost-network.nmconnection

# 2. Install unclutter (hides mouse cursor)
apt-get update -qq && apt-get install -y -qq unclutter xdotool

# 3. Create the kiosk launcher script
cat > /home/pi/kiosk.sh << 'KIOSK'
#!/bin/bash
# Wait for network connection to ESP32
echo "Waiting for ESP32 network..."
for i in $(seq 1 60); do
  if ping -c 1 -W 2 192.168.4.1 >/dev/null 2>&1; then
    echo "ESP32 reachable!"
    break
  fi
  sleep 2
done

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide cursor
unclutter -idle 0.5 -root &

# Clear Chromium crash flags
CHROMIUM_DIR="/home/pi/.config/chromium/Default"
mkdir -p "$CHROMIUM_DIR"
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_DIR/Preferences" 2>/dev/null || true

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-component-update \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --no-first-run \
  --start-fullscreen \
  --incognito \
  "http://192.168.4.1/screen.html?kiosk=true"
KIOSK
chmod +x /home/pi/kiosk.sh

# 4. Create systemd service for auto-start
cat > /etc/systemd/system/ghost-kiosk.service << 'SERVICE'
[Unit]
Description=Ghost Network Kiosk Display
After=graphical-session.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
ExecStart=/home/pi/kiosk.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical-session.target
SERVICE

# 5. Create a watchdog that reboots if network drops for > 5 min
cat > /home/pi/watchdog.sh << 'WATCHDOG'
#!/bin/bash
FAIL_COUNT=0
MAX_FAILS=15  # 15 × 20s = 5 minutes

while true; do
  if ping -c 1 -W 5 192.168.4.1 >/dev/null 2>&1; then
    FAIL_COUNT=0
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "Network check failed ($FAIL_COUNT/$MAX_FAILS)"
    if [ $FAIL_COUNT -ge $MAX_FAILS ]; then
      echo "Network down too long, rebooting..."
      sudo reboot
    fi
  fi
  sleep 20
done
WATCHDOG
chmod +x /home/pi/watchdog.sh

cat > /etc/systemd/system/ghost-watchdog.service << 'WSERVICE'
[Unit]
Description=Ghost Network Watchdog
After=network.target

[Service]
Type=simple
ExecStart=/home/pi/watchdog.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
WSERVICE

# 6. Enable services
systemctl daemon-reload
systemctl enable ghost-kiosk.service
systemctl enable ghost-watchdog.service

# 7. Disable screen blanking in boot config
if ! grep -q "consoleblank=0" /boot/firmware/cmdline.txt; then
  sed -i 's/$/ consoleblank=0/' /boot/firmware/cmdline.txt
fi

# 8. Set timezone (adjust if needed)
timedatectl set-timezone Europe/Madrid

echo ""
echo "=== Setup complete! ==="
echo "Reboot the Pi to start the kiosk."
echo "  sudo reboot"
echo ""
echo "The Pi will:"
echo "  1. Connect to GHOST-NETWORK WiFi"
echo "  2. Open screen.html in fullscreen Chromium"
echo "  3. Auto-restart if Chromium crashes"
echo "  4. Reboot if network is down for 5+ minutes"
