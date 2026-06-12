import { app, dialog } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppSettings, AppState, CrosshairSettings, Hotkeys, Profile } from '../renderer/types';

const dataFile = () => path.join(app.getPath('userData'), 'nexus-data.json');

export const defaultCrosshair: CrosshairSettings = {
  type: 'cross',
  color: '#a78bfa',
  size: 54,
  thickness: 3,
  length: 20,
  gap: 7,
  opacity: 0.95,
  outline: true,
  outlineColor: '#050509',
  outlineStrength: 2,
  shadow: true,
  shadowStrength: 2,
  glow: true,
  glowStrength: 6,
  rotation: 0,
  dotSize: 4,
  circleRadius: 18
};

const defaultSettings: AppSettings = {
  autostart: false,
  language: 'de',
  accentColor: '#8b5cf6',
  alwaysShowOverlay: false,
  overlayOnStartup: true,
  startMinimized: false,
  theme: 'dark',
  overlayOffsetX: 0,
  overlayOffsetY: 0,
  overlayDisplayId: 'cursor',
  centerTestMode: false,
  onboardingComplete: false,
  manualGameOverride: '',
  updateChannel: 'stable',
  onlineUpdatesEnabled: false,
  overlayLockMode: true,
  streamerMode: false,
  streamerCleanMode: false,
  themePreset: 'Nexus'
};

const defaultHotkeys: Hotkeys = {
  toggleOverlay: 'F6',
  nextProfile: 'F7',
  previousProfile: 'F8',
  toggleMainWindow: 'F9'
};

const makeDefaultProfile = (): Profile => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: 'Default Crosshair',
    gameName: '',
    gameProcess: '',
    tags: [],
    favorite: false,
    lastUsedAt: now,
    crosshair: defaultCrosshair,
    hotkey: 'F6',
    createdAt: now,
    updatedAt: now
  };
};

let state: AppState | null = null;

function normalizeCrosshair(crosshair: Partial<CrosshairSettings>): CrosshairSettings {
  return { ...defaultCrosshair, ...crosshair };
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    gameProcess: profile.gameProcess ?? '',
    tags: profile.tags ?? [],
    favorite: Boolean(profile.favorite),
    lastUsedAt: profile.lastUsedAt ?? profile.updatedAt,
    crosshair: normalizeCrosshair(profile.crosshair)
  };
}

function writeState(next: AppState) {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(next, null, 2), 'utf8');
  state = next;
}

export function getState(): AppState {
  if (state) return state;
  if (fs.existsSync(dataFile())) {
    const parsed = JSON.parse(fs.readFileSync(dataFile(), 'utf8')) as Partial<AppState>;
    const profiles = parsed.profiles?.length ? parsed.profiles.map(normalizeProfile) : [makeDefaultProfile()];
    state = {
      settings: { ...defaultSettings, ...parsed.settings },
      profiles,
      activeProfileId: parsed.activeProfileId ?? profiles[0]?.id ?? null,
      overlayVisible: Boolean(parsed.overlayVisible ?? defaultSettings.overlayOnStartup),
      activeGame: parsed.activeGame ?? null,
      detectedGames: parsed.detectedGames ?? [],
      hotkeys: { ...defaultHotkeys, ...parsed.hotkeys }
    };
    return state;
  }

  const profile = makeDefaultProfile();
  state = {
    settings: defaultSettings,
    profiles: [profile],
    activeProfileId: profile.id,
    overlayVisible: defaultSettings.overlayOnStartup,
    activeGame: null,
    detectedGames: [],
    hotkeys: defaultHotkeys
  };
  writeState(state);
  return state;
}

export function saveSettings(settings: AppSettings) {
  const next = { ...getState(), settings };
  app.setLoginItemSettings({ openAtLogin: settings.autostart });
  writeState(next);
  return settings;
}

export function getSettings() {
  return getState().settings;
}

export function getProfiles() {
  return getState().profiles;
}

export function saveProfile(profile: Profile) {
  const current = getState();
  const now = new Date().toISOString();
  const normalized = {
    ...profile,
    gameProcess: profile.gameProcess ?? '',
    tags: profile.tags ?? [],
    favorite: Boolean(profile.favorite),
    lastUsedAt: profile.lastUsedAt ?? now,
    crosshair: normalizeCrosshair(profile.crosshair),
    id: profile.id || crypto.randomUUID(),
    createdAt: profile.createdAt || now,
    updatedAt: now
  };
  const exists = current.profiles.some((item) => item.id === normalized.id);
  const profiles = exists
    ? current.profiles.map((item) => (item.id === normalized.id ? normalized : item))
    : [...current.profiles, normalized];
  writeState({ ...current, profiles, activeProfileId: current.activeProfileId ?? normalized.id });
  return normalized;
}

export function deleteProfile(id: string) {
  const current = getState();
  const profiles = current.profiles.filter((item) => item.id !== id);
  const activeProfileId = current.activeProfileId === id ? profiles[0]?.id ?? null : current.activeProfileId;
  writeState({ ...current, profiles, activeProfileId });
  return true;
}

export function setActiveProfile(id: string) {
  const current = getState();
  const profile = current.profiles.find((item) => item.id === id) ?? null;
  if (!profile) return null;
  const used = { ...profile, lastUsedAt: new Date().toISOString() };
  writeState({ ...current, profiles: current.profiles.map((item) => item.id === id ? used : item), activeProfileId: id });
  return used;
}

export function setOverlayVisible(overlayVisible: boolean) {
  writeState({ ...getState(), overlayVisible });
  return overlayVisible;
}

export function saveHotkeys(hotkeys: Hotkeys) {
  writeState({ ...getState(), hotkeys });
  return hotkeys;
}

export function setActiveGame(activeGame: string | null) {
  const current = getState();
  const matching = activeGame
    ? current.profiles.find((profile) => [profile.gameName, profile.gameProcess].some((value) => value?.toLowerCase() === activeGame.toLowerCase()))
    : null;
  const profiles = matching
    ? current.profiles.map((profile) => profile.id === matching.id ? { ...profile, lastUsedAt: new Date().toISOString() } : profile)
    : current.profiles;
  writeState({ ...current, profiles, activeGame, activeProfileId: matching?.id ?? current.activeProfileId });
  return matching ? profiles.find((profile) => profile.id === matching.id) ?? matching : null;
}

export function setDetectedGames(detectedGames: string[]) {
  writeState({ ...getState(), detectedGames });
  return detectedGames;
}

export async function exportProfile(id: string) {
  const profile = getState().profiles.find((item) => item.id === id);
  if (!profile) return null;
  const result = await dialog.showSaveDialog({
    title: 'Profil exportieren',
    defaultPath: `${profile.name.replace(/[\\/:*?"<>|]/g, '-')}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, JSON.stringify(profile, null, 2), 'utf8');
  return result.filePath;
}

export async function importProfile() {
  const result = await dialog.showOpenDialog({
    title: 'Profil importieren',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const profile = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8')) as Profile;
  return saveProfile({ ...profile, id: crypto.randomUUID() });
}

export async function backupData() {
  const result = await dialog.showSaveDialog({
    title: 'Backup erstellen',
    defaultPath: 'nexus-crosshair-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.copyFileSync(dataFile(), result.filePath);
  return result.filePath;
}

export async function importBackup() {
  const result = await dialog.showOpenDialog({
    title: 'Backup importieren',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const imported = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8')) as AppState;
  writeState({
    ...getState(),
    ...imported,
    settings: { ...defaultSettings, ...imported.settings },
    profiles: imported.profiles.map(normalizeProfile),
    hotkeys: { ...defaultHotkeys, ...imported.hotkeys },
    detectedGames: imported.detectedGames ?? []
  });
  return getState();
}

export function resetData() {
  state = null;
  if (fs.existsSync(dataFile())) fs.rmSync(dataFile());
  return getState();
}
