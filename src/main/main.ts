import { app, BrowserWindow, Menu, Tray, dialog, ipcMain, screen, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppSettings, CrosshairSettings, Hotkeys, Profile } from '../renderer/types';
import { detectActiveGame, detectGames } from './gameDetector';
import { registerHotkeys } from './hotkeys';
import { createOverlayWindow, getOverlayBounds, refreshOverlayBounds, setOverlayVisible as showOverlay, updateOverlayCrosshair } from './overlay';
import { checkForUpdatesNow, downloadUpdateNow, installUpdateNow, prepareAutoUpdater } from './updater';
import {
  backupData,
  deleteProfile,
  exportProfile,
  getProfiles,
  getSettings,
  getState,
  importProfile,
  importBackup,
  resetData,
  saveHotkeys,
  saveProfile,
  saveSettings,
  setActiveGame,
  setActiveProfile,
  setDetectedGames,
  setOverlayVisible
} from './storage';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let gameTimer: NodeJS.Timeout | null = null;
let overlayFps = 0;
let isQuitting = false;
const startedAt = Date.now();

function rendererUrl() {
  if (process.env.VITE_DEV_SERVER_URL) return process.env.VITE_DEV_SERVER_URL;
  return `file://${path.join(__dirname, '../renderer/index.html')}`;
}

function assetPath(...segments: string[]) {
  return app.isPackaged
    ? path.join(process.resourcesPath, ...segments)
    : path.join(process.cwd(), ...segments);
}

function appIconPath() {
  return assetPath('buildResources', 'icon.ico');
}

function createSplashWindow() {
  const logoFile = assetPath('buildResources', 'brand-logo.png');
  const splashLogo = fs.existsSync(logoFile)
    ? `data:image/png;base64,${fs.readFileSync(logoFile).toString('base64')}`
    : '';
  splashWindow = new BrowserWindow({
    width: 460,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    show: true,
    alwaysOnTop: true,
    icon: appIconPath(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const html = encodeURIComponent(`
    <!doctype html>
    <html>
      <body style="margin:0;background:transparent;font-family:Segoe UI,Arial,sans-serif;color:#fff;overflow:hidden;">
        <div style="width:460px;height:300px;position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:30px;background:radial-gradient(circle at 78% 12%,rgba(139,92,246,.3),transparent 34%),radial-gradient(circle at 16% 82%,rgba(34,211,238,.14),transparent 36%),linear-gradient(145deg,rgba(16,16,24,.98),rgba(7,7,10,.95));box-shadow:0 36px 110px rgba(0,0,0,.68),0 0 72px rgba(139,92,246,.32);display:flex;align-items:center;justify-content:center;flex-direction:column;">
          <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:38px 38px;animation:grid 9s linear infinite;opacity:.65;"></div>
          <div style="position:relative;width:104px;height:104px;border-radius:30px;background:rgba(139,92,246,.16);border:1px solid rgba(139,92,246,.42);display:flex;align-items:center;justify-content:center;box-shadow:0 0 44px rgba(239,68,68,.44),inset 0 1px 0 rgba(255,255,255,.14);overflow:hidden;">
            ${splashLogo ? `<img src="${splashLogo}" style="width:104px;height:104px;object-fit:cover;" />` : ''}
          </div>
          <h1 style="position:relative;margin:24px 0 5px;font-size:25px;letter-spacing:.2px;">Nexus Crosshair Pro</h1>
          <p style="position:relative;margin:0;color:#a1a1aa;font-size:13px;">Loading esports command center</p>
          <div style="margin-top:24px;width:220px;height:4px;border-radius:999px;background:#171722;overflow:hidden;">
            <div style="width:45%;height:100%;border-radius:999px;background:#8b5cf6;box-shadow:0 0 20px rgba(139,92,246,.75);animation:load 1.2s ease-in-out infinite alternate;"></div>
          </div>
        </div>
        <style>@keyframes load{from{transform:translateX(-40px)}to{transform:translateX(150px)}}@keyframes grid{to{background-position:38px 38px}}</style>
      </body>
    </html>
  `);
  splashWindow.loadURL(`data:text/html;charset=utf-8,${html}`);
  return splashWindow;
}

function broadcastState() {
  const state = getState();
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('state:changed', state));
  rebuildTray();
}

function rebuildTray() {
  if (!tray) return;
  const state = getState();
  const active = state.profiles.find((profile) => profile.id === state.activeProfileId);
  tray.setToolTip(`Nexus Crosshair Pro${active ? ` - ${active.name}` : ''}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Nexus Crosshair Pro', enabled: false },
    { type: 'separator' },
    {
      label: state.overlayVisible ? 'Overlay ausschalten' : 'Overlay einschalten',
      click: () => {
        const next = !getState().overlayVisible;
        setOverlayVisible(next);
        showOverlay(next);
        broadcastState();
        rebuildTray();
      }
    },
    {
      label: 'Hauptfenster öffnen',
      click: () => mainWindow?.show()
    },
    {
      label: 'Profil wechseln',
      submenu: state.profiles.map((profile) => ({
        label: profile.name,
        type: 'radio',
        checked: profile.id === state.activeProfileId,
        click: () => {
          const selected = setActiveProfile(profile.id);
          if (selected) updateOverlayCrosshair(selected.crosshair);
          broadcastState();
          rebuildTray();
        }
      }))
    },
    { type: 'separator' },
    { label: 'Beenden', click: () => app.quit() }
  ]));
}

function createTray() {
  tray = new Tray(appIconPath());
  tray.on('double-click', () => mainWindow?.show());
  rebuildTray();
}

function getDisplayInfo() {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((display, index) => ({
    id: display.id,
    label: `Monitor ${index + 1} (${display.bounds.width}x${display.bounds.height}, ${display.scaleFactor * 100}%)`,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor,
    primary: display.id === primaryId
  }));
}

function getDiagnostics() {
  const settings = getSettings();
  const overlayBounds = getOverlayBounds();
  const activeDisplay = overlayBounds
    ? screen.getDisplayMatching(overlayBounds)
    : null;
  return {
    appVersion: app.getVersion(),
    userDataPath: app.getPath('userData'),
    appPath: app.getAppPath(),
    overlayBounds,
    overlayVisible: getState().overlayVisible,
    activeDisplayId: activeDisplay?.id ?? null,
    displays: getDisplayInfo(),
    settings
  };
}

function safeText(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}

function streamerCrosshairSvg(settings: CrosshairSettings) {
  const size = 220;
  const center = size / 2;
  const line = settings.length * 1.4;
  const gap = settings.gap * 1.4;
  const stroke = settings.thickness;
  const radius = settings.circleRadius * 1.4;
  const color = safeText(settings.color);
  const outline = settings.outline ? safeText(settings.outlineColor) : 'transparent';
  const opacity = settings.opacity;
  const lineEl = (x1: number, y1: number, x2: number, y2: number) => `
    ${settings.shadow ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${stroke + settings.shadowStrength}" opacity=".28" stroke-linecap="square"/>` : ''}
    ${settings.glow ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${stroke + settings.glowStrength}" opacity=".16" stroke-linecap="square"/>` : ''}
    ${settings.outline ? `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${outline}" stroke-width="${stroke + settings.outlineStrength}" opacity="${opacity}" stroke-linecap="round"/>` : ''}
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${stroke}" opacity="${opacity}" stroke-linecap="round"/>`;
  const dot = `${settings.outline ? `<circle cx="${center}" cy="${center}" r="${settings.dotSize + settings.outlineStrength}" fill="${outline}" opacity="${opacity}"/>` : ''}<circle cx="${center}" cy="${center}" r="${settings.dotSize}" fill="${color}" opacity="${opacity}"/>`;
  const circle = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${settings.outline ? outline : color}" stroke-width="${settings.outline ? stroke + settings.outlineStrength : stroke}" opacity="${opacity}"/><circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" opacity="${opacity}"/>`;
  const cross = [
    lineEl(center - gap - line, center, center - gap, center),
    lineEl(center + gap, center, center + gap + line, center),
    lineEl(center, center - gap - line, center, center - gap),
    lineEl(center, center + gap, center, center + gap + line)
  ].join('');
  const body = settings.type === 'dot' ? dot
    : settings.type === 'circle' ? circle
      : settings.type === 'circle-dot' ? `${circle}${dot}`
        : settings.type === 'sniper' ? `${circle}${cross}`
          : cross;
  return `<svg width="220" height="220" viewBox="0 0 220 220" shape-rendering="crispEdges" style="transform:rotate(${settings.rotation}deg)">${body}</svg>`;
}

function streamerSourceHtml() {
  const state = getState();
  const active = state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0];
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Nexus Crosshair Pro OBS Source</title>
  <style>
    html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;color:white}
    .stage{position:fixed;inset:0;display:grid;place-items:center;background:transparent}
    .hud{position:fixed;left:24px;bottom:24px;display:${state.settings.streamerCleanMode ? 'none' : 'flex'};gap:12px;align-items:center;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(7,7,10,.48);padding:12px 14px;backdrop-filter:blur(18px);box-shadow:0 0 34px rgba(139,92,246,.25)}
    .dot{width:9px;height:9px;border-radius:99px;background:#22c55e;box-shadow:0 0 16px #22c55e}
    .meta{font-size:13px;color:#d4d4d8}.meta b{color:white}
  </style>
</head>
<body>
  <div class="stage">${streamerCrosshairSvg(active.crosshair)}</div>
  <div class="hud"><span class="dot"></span><span class="meta"><b>${safeText(active.name)}</b> / ${safeText(active.crosshair.type)} / Nexus Crosshair Pro</span></div>
</body>
</html>`;
}

async function exportStreamerSource() {
  const result = await dialog.showSaveDialog({
    title: 'OBS Browser Source exportieren',
    defaultPath: 'nexus-crosshair-obs-source.html',
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, streamerSourceHtml(), 'utf8');
  return result.filePath;
}

function activeProfileCrosshair() {
  const state = getState();
  return state.profiles.find((profile) => profile.id === state.activeProfileId)?.crosshair ?? null;
}

function createMainWindow() {
  const settings = getSettings();
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 980,
    minHeight: 650,
    title: 'Nexus Crosshair Pro',
    backgroundColor: '#09090b',
    show: false,
    icon: appIconPath(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      splashWindow?.close();
      splashWindow = null;
      if (!settings.startMinimized) mainWindow?.show();
    }, 650);
  });
  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow?.hide();
  });
  mainWindow.loadURL(rendererUrl());
  return mainWindow;
}

function wireIpc() {
  ipcMain.handle('state:get', () => getState());
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    const saved = saveSettings(settings);
    refreshOverlayBounds();
    broadcastState();
    return saved;
  });
  ipcMain.handle('profiles:get', () => getProfiles());
  ipcMain.handle('profiles:save', (_event, profile: Profile) => {
    const saved = saveProfile(profile);
    if (getState().activeProfileId === saved.id) updateOverlayCrosshair(saved.crosshair);
    broadcastState();
    return saved;
  });
  ipcMain.handle('profiles:delete', (_event, id: string) => {
    const result = deleteProfile(id);
    const next = activeProfileCrosshair();
    if (next) updateOverlayCrosshair(next);
    broadcastState();
    return result;
  });
  ipcMain.handle('profiles:active', (_event, id: string) => {
    const profile = setActiveProfile(id);
    if (profile) updateOverlayCrosshair(profile.crosshair);
    broadcastState();
    return profile;
  });
  ipcMain.handle('overlay:toggle', (_event, visible?: boolean) => {
    const next = typeof visible === 'boolean' ? visible : !getState().overlayVisible;
    setOverlayVisible(next);
    showOverlay(next);
    broadcastState();
    return next;
  });
  ipcMain.handle('crosshair:update', (_event, settings: CrosshairSettings) => {
    updateOverlayCrosshair(settings);
    return true;
  });
  ipcMain.handle('overlay:fps', (_event, fps: number) => {
    overlayFps = Math.max(0, Math.round(fps));
    return true;
  });
  ipcMain.handle('system:stats', async () => {
    const memory = await process.getProcessMemoryInfo();
    return {
      overlayFps,
      ramMb: Math.round(memory.private / 1024),
      cpuPercent: Number(process.getCPUUsage().percentCPUUsage.toFixed(1)),
      runtimeSeconds: Math.floor((Date.now() - startedAt) / 1000)
    };
  });
  ipcMain.handle('hotkeys:register', (_event, hotkeys: Hotkeys) => {
    const saved = saveHotkeys(hotkeys);
    if (mainWindow) registerHotkeys(saved, mainWindow, broadcastState);
    broadcastState();
    return saved;
  });
  ipcMain.handle('game:active', () => detectActiveGame());
  ipcMain.handle('display:list', () => getDisplayInfo());
  ipcMain.handle('diagnostics:get', () => getDiagnostics());
  ipcMain.handle('diagnostics:export', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Diagnose exportieren',
      defaultPath: 'nexus-crosshair-diagnostics.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return null;
    fs.writeFileSync(result.filePath, JSON.stringify(getDiagnostics(), null, 2), 'utf8');
    return result.filePath;
  });
  ipcMain.handle('updater:check', () => checkForUpdatesNow());
  ipcMain.handle('updater:download', () => downloadUpdateNow());
  ipcMain.handle('updater:install', () => installUpdateNow());
  ipcMain.handle('app:openDataFolder', () => shell.openPath(app.getPath('userData')));
  ipcMain.handle('streamer:exportSource', () => exportStreamerSource());
  ipcMain.handle('game:refresh', async () => {
    const games = await detectGames();
    setDetectedGames(games);
    const settings = getSettings();
    const active = settings.manualGameOverride || games[0] || null;
    const matched = setActiveGame(active);
    if (matched) updateOverlayCrosshair(matched.crosshair);
    broadcastState();
    return games;
  });
  ipcMain.handle('profiles:export', (_event, id: string) => exportProfile(id));
  ipcMain.handle('profiles:import', async () => {
    const profile = await importProfile();
    broadcastState();
    return profile;
  });
  ipcMain.handle('data:backup', () => backupData());
  ipcMain.handle('data:importBackup', async () => {
    const imported = await importBackup();
    if (imported?.activeProfileId) {
      const active = imported.profiles.find((profile) => profile.id === imported.activeProfileId);
      if (active) updateOverlayCrosshair(active.crosshair);
    }
    broadcastState();
    return imported;
  });
  ipcMain.handle('data:reset', () => {
    const state = resetData();
    updateOverlayCrosshair(state.profiles[0].crosshair);
    showOverlay(state.overlayVisible);
    broadcastState();
    return state;
  });
}

async function startGameDetection() {
  const tick = async () => {
    const games = await detectGames();
    setDetectedGames(games);
    const settings = getSettings();
    const game = settings.manualGameOverride || games[0] || null;
    const matched = setActiveGame(game);
    if (matched) updateOverlayCrosshair(matched.crosshair);
    broadcastState();
  };
  await tick();
  gameTimer = setInterval(tick, 5000);
}

app.whenReady().then(async () => {
  process.env.VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || (process.defaultApp ? 'http://localhost:5173' : '');
  app.setAppUserModelId('com.nexustools.crosshairpro');
  Menu.setApplicationMenu(null);
  createSplashWindow();
  wireIpc();
  createMainWindow();
  createTray();
  createOverlayWindow();
  const state = getState();
  const crosshair = activeProfileCrosshair();
  if (crosshair) updateOverlayCrosshair(crosshair);
  showOverlay(state.overlayVisible || state.settings.alwaysShowOverlay);
  if (mainWindow) registerHotkeys(state.hotkeys, mainWindow, broadcastState);
  prepareAutoUpdater();
  await startGameDetection();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (gameTimer) clearInterval(gameTimer);
});

app.on('will-quit', () => {
  const { globalShortcut } = require('electron') as typeof import('electron');
  globalShortcut.unregisterAll();
});
