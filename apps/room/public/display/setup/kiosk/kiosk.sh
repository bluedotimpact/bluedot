#!/bin/bash
# Place this in /home/pi/kiosk.sh and make it executable

# Set DISPLAY if not already set
if [ -z "$DISPLAY" ]; then
  export DISPLAY=:0
fi

xset s noblank
xset s off
xset -dpms

sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

# We use firefox instead of Google Chrome because on the Pi it works with high-resolution webcams better
firefox --kiosk https://room.bluedot.org/display/auto
