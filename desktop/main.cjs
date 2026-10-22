'use strict';

const { app, BrowserWindow, dialog, Menu, screen, session } = require('electron');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const TITLE = 'CB90 H — Svenska skärgården';
const ENTRY = path.join(__dirname, '..', 'dist', 'index.html');
let mainWindow = null;
let quitting = false;
let fatalErrorShown = false;

app.setName(TITLE);
app.setAppUserModelId('io.github.gitterkorso.cb90h');

// The complete application is one local document. Query parameters are used by
// the archipelago generator; they must not permit access to other local files.
function isApplicationURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'file:' && path.resolve(fileURLToPath(url)) === ENTRY;
  } catch {
    return false;
  }
}

function isApplicationContents(contents) {
  return !!contents && !contents.isDestroyed() &&
    !!mainWindow && !mainWindow.isDestroyed() &&
    contents === mainWindow.webContents && isApplicationURL(contents.getURL());
}

function fatalError(detail) {
  if (quitting || fatalErrorShown) return;
  fatalErrorShown = true;
  dialog.showErrorBox(`${TITLE} kunde inte starta`,
    'Programmet kunde inte öppna 3D-vyn. Starta om programmet. Om felet återkommer, ' +
    'installera om programmet eller hämta den portabla programfilen på nytt.\n\n' + detail);
  app.quit();
}

function configureSession() {
  // An in-memory session avoids an unnecessary persistent browser profile.
  const local = session.fromPartition('cb90-offline');
  local.setPermissionCheckHandler((contents, permission, _origin, details = {}) =>
    permission === 'pointerLock' && isApplicationContents(contents) &&
    isApplicationURL(details.requestingUrl || contents.getURL()));
  local.setPermissionRequestHandler((contents, permission, callback, details = {}) => {
    // Mouse look is the only requested permission. Camera, microphone,
    // geolocation, notifications, clipboard and device access stay denied.
    callback(permission === 'pointerLock' && isApplicationContents(contents) &&
      details.isMainFrame !== false && isApplicationURL(details.requestingUrl || contents.getURL()));
  });
  local.setDevicePermissionHandler(() => false);

  // No server, CDN, external browser launch or runtime downloads are needed.
  local.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const isDocument = details.resourceType === 'mainFrame' && isApplicationURL(details.url);
    const isImage = details.url.startsWith('data:image/') &&
      (details.resourceType === 'image' || details.resourceType === 'other');
    callback({ cancel: !isDocument && !isImage });
  });

  local.on('will-download', (event, item, contents) => {
    if (!isApplicationContents(contents) || !item.getURL().startsWith('data:image/png;base64,')) {
      event.preventDefault();
      return;
    }
    const suggestedName = /^CB90H-\d{4}-\d{2}-\d{2}\.png$/.test(item.getFilename())
      ? item.getFilename() : 'CB90H.png';
    // Let Electron show the ordinary Save As dialog; never write a file until
    // the user has selected its destination (including overwrite confirmation).
    item.setSaveDialogOptions({
      title: 'Spara bild från Stridsbåt 90',
      buttonLabel: 'Spara bild',
      defaultPath: path.join(app.getPath('pictures'), suggestedName),
      filters: [{ name: 'PNG-bild', extensions: ['png'] }]
    });
    item.once('done', (_event, state) => {
      if (state === 'interrupted' && mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type: 'error', title: 'Bilden kunde inte sparas',
          message: 'Det gick inte att spara bilden.',
          detail: 'Försök igen och välj en mapp som du kan skriva till.',
          buttons: ['OK']
        }).catch(() => {});
      }
    });
  });
  return local;
}

function configureMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Program', submenu: [
      { label: 'Avsluta', accelerator: 'Alt+F4', click: () => app.quit() }
    ] },
    { label: 'Visa', submenu: [
      { label: 'Helskärm', accelerator: 'F11', click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setFullScreen(!mainWindow.isFullScreen());
      } }
    ] },
    { label: 'Hjälp', submenu: [
      { label: 'Om Stridsbåt 90', click: () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        dialog.showMessageBox(mainWindow, {
          type: 'info', title: TITLE, message: `${TITLE} · ${app.getVersion()}`,
          detail: 'CB90 H i den svenska skärgården.\n\n' +
            'Programmet fungerar utan internet. Öppna frågetecknet i 3D-vyn för kontroller och hjälp.\n\n' +
            'F11: helskärm. Alt+F4: avsluta.',
          buttons: ['OK']
        }).catch(() => {});
      } }
    ] }
  ]));
}

function createWindow(localSession) {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    title: TITLE, width: Math.min(1600, area.width), height: Math.min(1000, area.height),
    minWidth: 800, minHeight: 600, show: false, backgroundColor: '#10252e',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      session: localSession,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      spellcheck: false
    }
  });
  mainWindow = win;
  const contents = win.webContents;
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('will-navigate', (event, url) => {
    if (!isApplicationURL(event.url || url)) event.preventDefault();
  });
  contents.on('will-frame-navigate', details => {
    if (!details.isMainFrame || !isApplicationURL(details.url)) details.preventDefault();
  });
  contents.on('will-redirect', event => event.preventDefault());
  contents.on('page-title-updated', event => {
    event.preventDefault();
    win.setTitle(TITLE);
  });
  contents.on('did-fail-load', (_event, errorCode, description, _url, isMainFrame) => {
    // Aborted loads include deliberate blocked navigation, which is not a
    // startup failure. A failed application document must not leave a blank UI.
    if (isMainFrame && errorCode !== -3) fatalError(`Fel ${errorCode}: ${description}`);
  });
  contents.on('render-process-gone', (_event, details) => {
    if (quitting || details.reason === 'clean-exit' || win.isDestroyed()) return;
    dialog.showMessageBox(win, {
      type: 'error', title: '3D-vyn stannade',
      message: '3D-vyn kunde inte fortsätta.',
      detail: 'Du kan starta om vyn. Om problemet återkommer, uppdatera grafikkortets drivrutin och prova lägre detaljnivå under Kameror.',
      buttons: ['Starta om vyn', 'Avsluta'], defaultId: 0, cancelId: 1
    }).then(({ response }) => {
      if (quitting || win.isDestroyed()) return;
      if (response === 0) win.loadFile(ENTRY).catch(error => fatalError(error.message));
      else app.quit();
    }).catch(error => fatalError(error.message));
  });
  win.once('ready-to-show', () => { if (!win.isDestroyed()) win.show(); });
  win.on('closed', () => { mainWindow = null; });
  win.loadFile(ENTRY).catch(error => fatalError(error.message));
}

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => app.quit());
process.on('uncaughtException', error => fatalError(error.message));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    const localSession = configureSession();
    configureMenu();
    createWindow(localSession);
  }).catch(error => fatalError(error.message));
}
