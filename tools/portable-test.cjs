'use strict';

// Launch the single downloadable executable itself, including its extraction
// launcher. No installed app, development server or checkout files are needed.
//   node tools/portable-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const executable = path.resolve(root, process.env.CB90_PORTABLE || `release/CB90-H-${version}-Windows-x64.exe`);
const output = path.join(root, 'shots', 'desktop-release', 'portable');
const tempBase = path.resolve(os.tmpdir());
const temporary = fs.mkdtempSync(path.join(tempBase, 'cb90-portable-smoke-'));
const userData = path.join(temporary, 'user-data');
fs.mkdirSync(output, { recursive: true });

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function bounded(promise, milliseconds = 5000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(resolve, milliseconds); })]);
  } finally {
    clearTimeout(timer);
  }
}
async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

(async () => {
  let launcher;
  let browser;
  let page;
  let closed = false;
  let launcherError;
  const errors = [];
  const externalRequests = [];
  const report = { executable, workingDirectory: temporary, checks: [] };
  try {
    assert(fs.existsSync(executable), 'Build the portable executable first');
    const port = await freePort();
    launcher = spawn(executable, [
      `--user-data-dir=${userData}`, `--remote-debugging-port=${port}`,
      '--remote-debugging-address=127.0.0.1',
      ...(process.env.CB90_SOFTWARE_GL === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
      '--disable-renderer-backgrounding', '--disable-background-timer-throttling'
    ], { cwd: temporary, windowsHide: true, stdio: 'ignore' });
    launcher.once('error', error => { launcherError = error; });
    launcher.once('close', () => { closed = true; });
    report.launcherPid = launcher.pid;
    const endpoint = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 120000;
    let ready = false;
    while (Date.now() < deadline) {
      if (launcherError) throw launcherError;
      if (closed) throw new Error(`Portable launcher exited before startup (code ${launcher.exitCode})`);
      try {
        const response = await fetch(`${endpoint}/json/version`, { signal: AbortSignal.timeout(1000) });
        if (response.ok) { ready = true; break; }
      } catch { /* The NSIS launcher is still extracting or Electron is starting. */ }
      await delay(250);
    }
    assert(ready, 'Portable executable did not expose its test debugging endpoint within 120 seconds');
    browser = await chromium.connectOverCDP(endpoint, { timeout: 120000 });
    const context = browser.contexts()[0];
    page = context.pages()[0] || await context.waitForEvent('page', { timeout: 120000 });
    page.setDefaultTimeout(120000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    context.on('request', request => {
      if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
    });
    await page.waitForFunction(() => window.CB90?.app?.frames() >= 6);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.CB90?.app?.frames() >= 12);
    report.initial = await page.evaluate(() => ({
      url: location.href, frames: CB90.app.frames(), enginesOn: CB90.app.state.enginesOn,
      farGridSize: CB90.app.modules.water.hullWaves.field.farField.size,
      errors: CB90.app.errors.slice(), shaderCount: CB90.app.renderer.info.programs.length,
      shaderFailures: CB90.app.renderer.info.programs.filter(program =>
        program.diagnostics && !program.diagnostics.runnable).map(program => program.name),
      nodeRequire: typeof window.require, nodeProcess: typeof window.process
    }));
    assert(report.initial.url.startsWith('file:'), 'Portable app must load a local document');
    assert(report.initial.url.includes('app.asar'), 'Portable app must use its extracted application archive');
    assert.equal(report.initial.farGridSize, 512, 'Portable release must contain the current extended wake');
    assert.equal(report.initial.nodeRequire, 'undefined');
    assert.equal(report.initial.nodeProcess, 'undefined');
    assert(report.initial.shaderCount > 0, 'WebGL shaders must compile');
    assert.deepEqual(report.initial.shaderFailures, []);
    assert.deepEqual(report.initial.errors, []);
    report.checks.push('standalone portable extraction and offline local application launch');
    report.checks.push('512-cell extended wake field, compiled WebGL and sandboxed renderer');
    await page.screenshot({ path: path.join(output, 'exterior.png') });

    await page.locator('.panel-tabs button[data-tab="helm"]').click();
    const engines = page.locator('label[for="toggle-engines"]');
    assert.equal(report.initial.enginesOn, true);
    await engines.click();
    await page.waitForFunction(() => !CB90.app.state.enginesOn);
    await engines.click();
    await page.waitForFunction(() => CB90.app.state.enginesOn);
    const before = await page.evaluate(() => CB90.app.frames());
    await page.waitForFunction(frames => CB90.app.frames() >= frames + 6, before);
    report.checks.push('engine controls respond and scene continues rendering');
    report.final = await page.evaluate(() => ({
      frames: CB90.app.frames(), enginesOn: CB90.app.state.enginesOn,
      errors: CB90.app.errors.slice()
    }));
    assert.deepEqual(report.final.errors, []);
    assert.deepEqual(errors, [], 'Renderer console or JavaScript errors');
    assert.deepEqual(externalRequests, [], 'Portable app must work without external resources');
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAIL';
    report.error = error.stack || String(error);
    report.rendererErrors = errors;
    report.externalRequests = externalRequests;
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) {
      // This connection belongs only to the process launched above with a
      // unique profile and debug port. Closing it cannot affect other apps.
      try {
        if (page && !page.isClosed()) await bounded(page.evaluate(() => window.close()));
      } catch { /* Closing the app can destroy the execution context first. */ }
      if (!closed) {
        try {
          const session = await bounded(browser.newBrowserCDPSession());
          if (session) await bounded(session.send('Browser.close'));
        } catch { /* A normal window close can already have ended Electron. */ }
      }
      await bounded(browser.close().catch(() => {}));
    }
    if (launcher && !closed) {
      const deadline = Date.now() + 30000;
      while (!closed && Date.now() < deadline) await delay(100);
    }
    report.launcherExitCode = launcher?.exitCode;
    report.launcherExited = closed;
    if (launcher && !closed) {
      report.status = 'FAIL';
      report.cleanupError = 'The test-owned portable launcher did not exit within 30 seconds';
      process.exitCode = 1;
    } else if (launcher) {
      report.checks.push('closing the application also exits its portable launcher');
    }
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    if (path.dirname(temporary) !== tempBase || !path.basename(temporary).startsWith('cb90-portable-smoke-')) {
      throw new Error('Unexpected temporary directory; refusing cleanup');
    }
    if (closed || !launcher) fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
