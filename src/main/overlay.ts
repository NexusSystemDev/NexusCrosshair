import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import type { CrosshairSettings } from '../renderer/types';
import { getSettings } from './storage';

let overlayWindow: BrowserWindow | null = null;

function rendererUrl() {
  if (process.env.VITE_DEV_SERVER_URL) return `${process.env.VITE_DEV_SERVER_URL}?overlay=1`;
  return `file://${path.join(__dirname, '../renderer/index.html')}?overlay=1`;
}

export function createOverlayWindow() {
  const display = screen.getPrimaryDisplay();
  overlayWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    transparent: true,
    frame: false,
    fullscreenable: false,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setIgnoreMouseEvents(getSettings().overlayLockMode);
  overlayWindow.loadURL(rendererUrl());
  screen.on('display-metrics-changed', () => syncOverlayBounds());
  screen.on('display-added', () => syncOverlayBounds());
  return overlayWindow;
}

function syncOverlayBounds() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const settings = getSettings();
  const displays = screen.getAllDisplays();
  const selectedId = Number(settings.overlayDisplayId);
  const targetDisplay = Number.isFinite(selectedId)
    ? displays.find((display) => display.id === selectedId) ?? screen.getPrimaryDisplay()
    : screen.getDisplayNearestPoint(screen.getCursorScreenPoint()) ?? screen.getPrimaryDisplay();
  overlayWindow.setBounds(targetDisplay.bounds, false);
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setIgnoreMouseEvents(settings.overlayLockMode);
}

export function refreshOverlayBounds() {
  syncOverlayBounds();
}

export function getOverlayWindow() {
  return overlayWindow;
}

export function getOverlayBounds() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return null;
  return overlayWindow.getBounds();
}

export function setOverlayVisible(visible: boolean) {
  if (!overlayWindow || overlayWindow.isDestroyed()) createOverlayWindow();
  if (visible) {
    syncOverlayBounds();
    overlayWindow?.showInactive();
  } else {
    overlayWindow?.hide();
  }
}

export function updateOverlayCrosshair(settings: CrosshairSettings) {
  overlayWindow?.webContents.send('crosshair:update', settings);
}
