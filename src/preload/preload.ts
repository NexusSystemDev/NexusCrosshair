import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, AppState, CrosshairSettings, Hotkeys, Profile } from '../renderer/types';

contextBridge.exposeInMainWorld('nexusAPI', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
  getProfiles: () => ipcRenderer.invoke('profiles:get'),
  saveProfile: (profile: Profile) => ipcRenderer.invoke('profiles:save', profile),
  deleteProfile: (id: string) => ipcRenderer.invoke('profiles:delete', id),
  setActiveProfile: (id: string) => ipcRenderer.invoke('profiles:active', id),
  toggleOverlay: (visible?: boolean) => ipcRenderer.invoke('overlay:toggle', visible),
  updateCrosshair: (settings: CrosshairSettings) => ipcRenderer.invoke('crosshair:update', settings),
  registerHotkeys: (hotkeys: Hotkeys) => ipcRenderer.invoke('hotkeys:register', hotkeys),
  getActiveGame: () => ipcRenderer.invoke('game:active'),
  exportProfile: (id: string) => ipcRenderer.invoke('profiles:export', id),
  importProfile: () => ipcRenderer.invoke('profiles:import'),
  backupData: () => ipcRenderer.invoke('data:backup'),
  importBackup: () => ipcRenderer.invoke('data:importBackup'),
  resetData: () => ipcRenderer.invoke('data:reset'),
  getState: () => ipcRenderer.invoke('state:get'),
  getSystemStats: () => ipcRenderer.invoke('system:stats'),
  reportOverlayFps: (fps: number) => ipcRenderer.invoke('overlay:fps', fps),
  refreshGames: () => ipcRenderer.invoke('game:refresh'),
  getDisplays: () => ipcRenderer.invoke('display:list'),
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  exportDiagnostics: () => ipcRenderer.invoke('diagnostics:export'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
  exportStreamerSource: () => ipcRenderer.invoke('streamer:exportSource'),
  onStateChanged: (callback: (state: AppState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AppState) => callback(state);
    ipcRenderer.on('state:changed', handler);
    return () => ipcRenderer.removeListener('state:changed', handler);
  },
  onCrosshairChanged: (callback: (settings: CrosshairSettings) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, settings: CrosshairSettings) => callback(settings);
    ipcRenderer.on('crosshair:update', handler);
    return () => ipcRenderer.removeListener('crosshair:update', handler);
  }
});
