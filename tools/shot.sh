#!/bin/bash
# Headless screenshot of a local HTML file or URL.
#   tools/shot.sh <file-or-url[?query]> <out.png> [width] [height] [virtual_time_ms]
# The app page (dist/*.html, src/page.html) is captured through its ?shot=1 canvas export, because a WebGL
# canvas driven by requestAnimationFrame does not composite into Chrome's --screenshot in headless mode.
# Other pages fall back to --screenshot. Prints the page's #status line either way.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$1"; OUT="$2"; W="${3:-1280}"; H="${4:-800}"; T="${5:-9000}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ "$SRC" != http* && "$SRC" != file* ]]; then
  P="${SRC%%\?*}"; Q=""; [[ "$SRC" == *\?* ]] && Q="?${SRC#*\?}"
  P="$(cd "$(dirname "$P")" && pwd)/$(basename "$P")"
  SRC="file://$P$Q"
fi
# add shot=1 for app pages
CAPSRC="$SRC"
if [[ "$SRC" == *"?"* ]]; then CAPSRC="$SRC&shot=1"; else CAPSRC="$SRC?shot=1"; fi
DOM="$(mktemp -t cb90dom)"
"$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --allow-file-access-from-files --window-size="$W,$H" --virtual-time-budget="$T" --dump-dom "$CAPSRC" >"$DOM" 2>/dev/null || true
node -e '
const fs=require("fs");const d=fs.readFileSync(process.argv[1],"utf8");
const m=d.match(/data-png="data:image\/png;base64,([^"]+)"/);
if(m){ fs.writeFileSync(process.argv[2], Buffer.from(m[1],"base64")); console.log("canvas-export"); }
else { console.log("no-canvas-export"); }
const s=d.match(/<div id="status"[^>]*>([^<]*)</); if(s) console.log("status: "+s[1].slice(0,700));
else { const s2=d.match(/id="status"[^>]*>([^<]*)</); if(s2) console.log("status: "+s2[1].slice(0,700)); }
' "$DOM" "$OUT" > "$DOM.log" || true
CAP=$(head -1 "$DOM.log")
grep '^status:' "$DOM.log" || echo "status: (none)"
if [[ "$CAP" != "canvas-export" || ! -s "$OUT" ]]; then
  "$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
    --allow-file-access-from-files --window-size="$W,$H" --virtual-time-budget="$T" --screenshot="$OUT" "$SRC" >/dev/null 2>&1 || true
fi
rm -f "$DOM" "$DOM.log"
[[ -s "$OUT" ]] && echo "wrote $OUT" || { echo "FAILED: no screenshot"; exit 1; }
