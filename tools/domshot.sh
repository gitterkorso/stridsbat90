#!/bin/bash
# Full-page screenshot (DOM + panel). The WebGL canvas comes out black in headless; use tools/shot.sh for the 3D view.
set -e
SRC="$1"; OUT="$2"; W="${3:-1400}"; H="${4:-950}"; T="${5:-7000}"
if [[ "$SRC" != http* && "$SRC" != file* ]]; then
  P="${SRC%%\?*}"; Q=""; [[ "$SRC" == *\?* ]] && Q="?${SRC#*\?}"
  P="$(cd "$(dirname "$P")" && pwd)/$(basename "$P")"; SRC="file://$P$Q"
fi
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --use-angle=swiftshader \
  --enable-unsafe-swiftshader --hide-scrollbars --allow-file-access-from-files --window-size="$W,$H" \
  --virtual-time-budget="$T" --screenshot="$OUT" "$SRC" >/dev/null 2>&1 &
CPID=$!
( sleep 60; kill -9 $CPID 2>/dev/null ) & WPID=$!
wait $CPID 2>/dev/null || true
kill $WPID 2>/dev/null || true
[[ -s "$OUT" ]] && echo "wrote $OUT" || echo "FAILED $OUT"
