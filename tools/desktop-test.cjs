'use strict';

// Exercise the actual desktop wrapper, including the packaged executable:
//   npm run test:desktop
//   $env:CB90_EXECUTABLE='release/win-unpacked/CB90 H.exe'; npm run test:desktop
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron } = require('playwright');

const root = path.resolve(__dirname, '..');
const executable = process.env.CB90_EXECUTABLE && path.resolve(root, process.env.CB90_EXECUTABLE);
const variant = executable ? 'packaged' : 'development';
const output = path.join(root, 'shots', 'desktop-release', variant);
const tempBase = path.resolve(os.tmpdir());
const temporary = fs.mkdtempSync(path.join(tempBase, 'cb90-desktop-smoke-'));
const userData = path.join(temporary, 'user-data');
fs.mkdirSync(output, { recursive: true });

async function until(read, message, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await read()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

(async () => {
  let application;
  const errors = [];
  const externalRequests = [];
  const report = { variant, executable: executable || 'electron .', checks: [] };
  const checked = message => { report.checks.push(message); console.log('PASS ' + message); };
  try {
    const args = [
      ...(executable ? [] : [root]),
      `--user-data-dir=${userData}`,
      ...(process.env.CB90_SOFTWARE_GL === '1' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
      '--disable-renderer-backgrounding', '--disable-background-timer-throttling'
    ];
    const launchOptions = { args, cwd: root, timeout: 120000 };
    if (executable) launchOptions.executablePath = executable;
    application = await electron.launch(launchOptions);
    const context = application.context();
    context.on('request', request => {
      if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
    });
    const page = await application.firstWindow({ timeout: 120000 });
    page.setDefaultTimeout(120000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    const desktop = await application.evaluate(({ app, BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.setContentSize(1280, 800);
      const preferences = window.webContents.getLastWebPreferences();
      return {
        userData: app.getPath('userData'), packaged: app.isPackaged,
        version: app.getVersion(), windowCount: BrowserWindow.getAllWindows().length,
        preferences: {
          nodeIntegration: preferences.nodeIntegration,
          nodeIntegrationInWorker: preferences.nodeIntegrationInWorker,
          contextIsolation: preferences.contextIsolation,
          sandbox: preferences.sandbox,
          webSecurity: preferences.webSecurity,
          webviewTag: preferences.webviewTag
        }
      };
    });
    assert.equal(path.resolve(desktop.userData).toLowerCase(), userData.toLowerCase(),
      'Smoke test must use its temporary profile');
    assert.equal(desktop.windowCount, 1);
    assert.equal(desktop.packaged, !!executable);
    assert.deepEqual(desktop.preferences, {
      nodeIntegration: false, nodeIntegrationInWorker: false, contextIsolation: true,
      sandbox: true, webSecurity: true, webviewTag: false
    });
    report.desktop = desktop;
    checked('isolated temporary profile and sandboxed renderer');

    // Reload after listeners are attached and networking is disabled so the test
    // covers the complete bundled document, including its first script execution.
    // Let loadFile settle first: firstWindow can precede the initial navigation.
    await page.waitForFunction(() => window.CB90?.app?.frames() >= 6);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.CB90?.app?.frames() >= 12);
    const initial = await page.evaluate(() => {
      const app = CB90.app;
      return {
        url: location.href, frames: app.frames(), errors: app.errors.slice(),
        nodeRequire: typeof window.require, nodeProcess: typeof window.process,
        farGridSize: app.modules.water.hullWaves.field.farField.size,
        shaderCount: app.renderer.info.programs.length,
        shaderFailures: app.renderer.info.programs.filter(program =>
          program.diagnostics && !program.diagnostics.runnable).map(program => program.name)
      };
    });
    assert(initial.url.startsWith('file:'), 'Desktop entry must be a bundled local document');
    assert.equal(initial.nodeRequire, 'undefined');
    assert.equal(initial.nodeProcess, 'undefined');
    assert.equal(initial.farGridSize, 512, 'Desktop release must include the extended wake field');
    assert(initial.shaderCount > 0);
    assert.deepEqual(initial.shaderFailures, []);
    assert.deepEqual(initial.errors, []);
    assert.deepEqual(externalRequests, [], 'Offline launch must not depend on HTTP resources');
    report.initial = initial;
    checked('offline launch, current 512-cell wake field, compiled WebGL shaders');
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    await page.screenshot({ path: path.join(output, 'exterior.png') });

    for (const mode of ['pilot', 'walk', 'exterior']) {
      const before = await page.evaluate(() => CB90.app.frames());
      await page.locator(`.mode-nav button[data-mode="${mode}"]`).click();
      await page.waitForFunction(({ mode, before }) =>
        CB90.app.state.mode === mode && CB90.app.frames() >= before + 3, { mode, before });
      assert.equal(await page.locator('#app').getAttribute('data-mode'), mode);
      if (mode === 'pilot') {
        await page.evaluate(() => window.getSelection()?.removeAllRanges());
        await page.screenshot({ path: path.join(output, 'pilot.png') });
      }
    }
    checked('pilot, walk and exterior controls');

    await page.locator('#pauseBtn').click();
    await page.waitForFunction(() => CB90.app.state.paused);
    const stopped = await page.evaluate(() => ({
      frames: CB90.app.frames(), nav: { ...CB90.app.state.nav }, hour: CB90.app.state.hour
    }));
    await page.waitForFunction(frames => CB90.app.frames() >= frames + 3, stopped.frames);
    const still = await page.evaluate(() => ({ nav: { ...CB90.app.state.nav }, hour: CB90.app.state.hour }));
    assert.deepEqual(still.nav, stopped.nav, 'Pause must stop navigation');
    assert.equal(still.hour, stopped.hour, 'Pause must stop the simulated clock');
    await page.locator('#pauseBtn').click();
    await page.waitForFunction(() => !CB90.app.state.paused);
    checked('pause and resume');

    const toggleFullscreen = () => application.evaluate(({ Menu, BrowserWindow }) => {
      const find = items => {
        for (const item of items) {
          if (item.accelerator === 'F11') return item;
          const nested = item.submenu && find(item.submenu.items);
          if (nested) return nested;
        }
      };
      const item = find(Menu.getApplicationMenu().items);
      if (!item) throw new Error('F11 fullscreen menu entry is missing');
      item.click(item, BrowserWindow.getAllWindows()[0]);
    });
    await toggleFullscreen();
    await until(() => application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isFullScreen()), 'Fullscreen did not activate');
    await toggleFullscreen();
    await until(() => application.evaluate(({ BrowserWindow }) =>
      !BrowserWindow.getAllWindows()[0].isFullScreen()), 'Fullscreen did not deactivate');
    checked('F11 fullscreen menu toggle');

    const photoPath = path.join(output, 'saved-photo.png');
    await application.evaluate(({ session }, destination) => {
      globalThis.__cb90DesktopSmokeDownload = { state: 'waiting' };
      session.fromPartition('cb90-offline').once('will-download', (_event, item) => {
        globalThis.__cb90DesktopSmokeDownload.options = item.getSaveDialogOptions();
        // Supply the test-owned path after the app configures its native dialog.
        // This exercises PNG download handling without displaying a modal dialog.
        item.setSavePath(destination);
        item.once('done', (_doneEvent, state) => {
          globalThis.__cb90DesktopSmokeDownload.state = state;
        });
      });
    }, photoPath);
    await page.locator('#photoBtn').click();
    await until(() => application.evaluate(() =>
      globalThis.__cb90DesktopSmokeDownload.state === 'completed'), 'PNG export did not complete', 30000);
    report.download = await application.evaluate(() => globalThis.__cb90DesktopSmokeDownload);
    assert.equal(report.download.options.filters[0].extensions[0], 'png');
    const photo = fs.readFileSync(photoPath);
    assert(photo.length > 10000, 'PNG export must contain the rendered scene');
    assert.equal(photo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    checked('Save image produces a valid PNG through the native download handler');

    const finalRender = await page.evaluate(() => ({
      frames: CB90.app.frames(), errors: CB90.app.errors.slice(),
      shaderFailures: CB90.app.renderer.info.programs.filter(program =>
        program.diagnostics && !program.diagnostics.runnable).map(program => program.name)
    }));
    assert.deepEqual(errors, [], 'Renderer console or JavaScript errors');
    assert.deepEqual(finalRender.errors, []);
    assert.deepEqual(finalRender.shaderFailures, []);
    assert.deepEqual(externalRequests, [], 'Simulation must remain fully offline');
    report.finalRender = finalRender;

    // Probe wrapper policies only after checking ordinary gameplay for errors.
    // Expected rejected fetches can emit Chromium console diagnostics.
    await context.setOffline(false);
    const blocked = await page.evaluate(async () => {
      try { await fetch('https://example.invalid/cb90-desktop-smoke'); return false; }
      catch { return true; }
    });
    assert(blocked, 'External requests must be denied by the desktop session');
    await page.evaluate(() => window.open('https://example.invalid/cb90-popup'));
    assert.equal(await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
    const locationBefore = page.url();
    await page.evaluate(() => { window.location.href = 'https://example.invalid/cb90-navigation'; });
    // Waiting for an animation frame allows the navigation event to be handled.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
    assert.equal(page.url(), locationBefore, 'External navigation must be denied');
    checked('external requests, popups and navigation blocked');
    report.status = 'PASS';
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.status = 'FAIL';
    report.error = error.stack || String(error);
    report.rendererErrors = errors;
    report.externalRequests = externalRequests;
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    throw error;
  } finally {
    if (application) await application.close();
    // Delete only the unique test directory created above, never an app profile.
    if (path.dirname(temporary) !== tempBase || !path.basename(temporary).startsWith('cb90-desktop-smoke-')) {
      throw new Error('Unexpected temporary directory; refusing cleanup');
    }
    fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
