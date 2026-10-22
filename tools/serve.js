#!/usr/bin/env node
'use strict';
// Local development server: expose only the app and its source files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 8090);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Usage: node tools/serve.js [port]');
  process.exit(1);
}
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/' || pathname === '/index.html') pathname = '/dist/index.html';
  const allowed = /^\/dist\/(index|dev|artifact)\.html$/.test(pathname) || /^\/src\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(js|css|html)$/.test(pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!allowed || !file.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Content-Length': stat.size,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Choose another port: node tools/serve.js 8091` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`CB90 H: http://localhost:${port}\nDevelopment: http://localhost:${port}/dist/dev.html\nCtrl+C to stop.`));
