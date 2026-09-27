#!/usr/bin/env bash
# Preview one background variant on the running emulator.
#   ./bg-show.sh <source-file-in-public>
# Converts + re-versions the background, rebuilds the bundle, reinstalls the
# APK, relaunches the app and writes a screenshot to ../bg_preview_<n>.png
set -e
cd "$(dirname "$0")"

SRC="$1"
[ -n "$SRC" ] || { echo "usage: ./bg-show.sh <source-file-in-public>"; exit 1; }

node bg-use.mjs "$SRC"
npm run build  >/dev/null 2>&1
npx cap copy android >/dev/null 2>&1
( cd android && ./gradlew installDebug -q >/dev/null 2>&1 )

adb -s emulator-5554 shell am force-stop app.dhikr.counter
adb -s emulator-5554 shell monkey -p app.dhikr.counter \
  -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1

# Wait for the WebView to actually paint. A fixed sleep races the first frame
# and yields a blank white screenshot, so poll the view hierarchy until the
# counter screen's own text shows up (or give up after ~45s).
for i in $(seq 1 15); do
  sleep 3
  MSYS_NO_PATHCONV=1 adb -s emulator-5554 shell uiautomator dump >/dev/null 2>&1
  if MSYS_NO_PATHCONV=1 adb -s emulator-5554 shell cat /sdcard/window_dump.xml 2>/dev/null \
       | grep -q "Tap to count"; then
    break
  fi
done
sleep 1

N=$(ls ../bg_preview_*.png 2>/dev/null | wc -l | tr -d ' ')
N=$((N + 1))
OUT="../bg_preview_$N.png"
MSYS_NO_PATHCONV=1 adb -s emulator-5554 exec-out screencap -p > "$OUT"
echo "$SRC  ->  $OUT"
