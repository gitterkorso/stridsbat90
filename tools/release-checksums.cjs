'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const names = [`CB90-H-${version}-Windows-x64.exe`, `CB90-H-${version}-Windows-x64-Setup.exe`];
const lines = names.map(name => {
  const file = path.join(root, 'release', name);
  if (!fs.existsSync(file)) throw Error('Release artifact missing: ' + name);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  console.log(name + ' (' + (fs.statSync(file).size / 1048576).toFixed(1) + ' MB)');
  return `${hash}  ${name}`;
});
fs.writeFileSync(path.join(root, 'release', 'SHA256SUMS.txt'), lines.join('\n') + '\n');
console.log('Wrote release/SHA256SUMS.txt');
