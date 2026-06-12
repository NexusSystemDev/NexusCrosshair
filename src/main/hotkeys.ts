import { BrowserWindow, globalShortcut } from 'electron';
import type { Hotkeys } from '../renderer/types';
import { getProfiles, getState, setActiveProfile, setOverlayVisible } from './storage';
import { setOverlayVisible as showOverlay, updateOverlayCrosshair } from './overlay';

export function registerHotkeys(hotkeys: Hotkeys, mainWindow: BrowserWindow, notify: () => void) {
  globalShortcut.unregisterAll();

  globalShortcut.register(hotkeys.toggleOverlay, () => {
    const visible = !getState().overlayVisible;
    setOverlayVisible(visible);
    showOverlay(visible);
    notify();
  });

  globalShortcut.register(hotkeys.toggleMainWindow, () => {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.show();
  });

  const switchProfile = (direction: 1 | -1) => {
    const state = getState();
    const profiles = getProfiles();
    const index = profiles.findIndex((profile) => profile.id === state.activeProfileId);
    const next = profiles[(index + direction + profiles.length) % profiles.length];
    if (!next) return;
    setActiveProfile(next.id);
    updateOverlayCrosshair(next.crosshair);
    notify();
  };

  globalShortcut.register(hotkeys.nextProfile, () => switchProfile(1));
  globalShortcut.register(hotkeys.previousProfile, () => switchProfile(-1));
}
