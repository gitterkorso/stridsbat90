#!/usr/bin/env node
// Build: inlines local <script src> files from src/page.html into
//   dist/artifact.html  (fragment for the Artifact tool: no <html>/<head>/<body>)
//   dist/index.html     (full standalone document, same inlined content)
//   dist/dev.html       (full document referencing ../src/*.js live, for local dev)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src'), DIST = path.join(ROOT, 'dist');
fs.mkdirSync(DIST, { recursive: true });
const page = fs.readFileSync(path.join(SRC, 'page.html'), 'utf8');
const licenseNotice = '<!--\n' + [
  fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8'),
  'Three.js r128 and OrbitControls:\n' + fs.readFileSync(path.join(SRC, 'vendor/LICENSE.threejs'), 'utf8')
].join('\n\n').replace(/-->/g, '-- >') + '\n-->\n';
const re = /<script\s+src="([^"]+)"\s*><\/script>/g;
let missing = [];
const inlined = page.replace(re, (m, src) => {
  if (/^https?:\/\//.test(src)) return m;
  const f = path.join(SRC, src);
  if (!fs.existsSync(f)) { missing.push(src); return `<!-- missing ${src} -->`; }
  const code = fs.readFileSync(f, 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script>\n/* ---- ${src} ---- */\n${code}\n</script>`;
});
const dev = page.replace(re, (m, src) => /^https?:\/\//.test(src) ? m : `<script src="../src/${src}"></script>`);
const skeleton = (body) => `<!doctype html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<style>body{margin:0;font:14px system-ui,sans-serif;color-scheme:light}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
fs.writeFileSync(path.join(DIST, 'artifact.html'), licenseNotice + inlined);
fs.writeFileSync(path.join(DIST, 'index.html'), skeleton(licenseNotice + inlined));
fs.writeFileSync(path.join(DIST, 'dev.html'), skeleton(licenseNotice + dev));
const size = fs.statSync(path.join(DIST, 'artifact.html')).size;
console.log(`built dist/artifact.html (${(size/1024).toFixed(1)} kB), dist/index.html, dist/dev.html`);
if (missing.length) { console.log('MISSING:', missing.join(', ')); process.exit(1); }
