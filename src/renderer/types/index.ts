export type CrosshairType =
  | 'dot'
  | 'cross'
  | 'circle'
  | 'circle-dot'
  | 'plus'
  | 'x-shape'
  | 't-shape'
  | 'sniper'
  | 'tactical'
  | 'custom';

export type CrosshairSettings = {
  type: CrosshairType;
  color: string;
  size: number;
  thickness: number;
  length: number;
  gap: number;
  opacity: number;
  outline: boolean;
  outlineColor: string;
  outlineStrength: number;
  shadow: boolean;
  shadowStrength: number;
  glow: boolean;
  glowStrength: number;
  rotation: number;
  dotSize: number;
  circleRadius: number;
};

export type Profile = {
  id: string;
  name: string;
  gameName: string;
  gameProcess?: string;
  tags?: string[];
  favorite?: boolean;
  lastUsedAt?: string;
  crosshair: CrosshairSettings;
  hotkey: string;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  autostart: boolean;
  language: 'de' | 'en';
  accentColor: string;
  alwaysShowOverlay: boolean;
  overlayOnStartup: boolean;
  startMinimized: boolean;
  theme: 'dark' | 'light';
  overlayOffsetX: number;
  overlayOffsetY: number;
  overlayDisplayId: string;
  centerTestMode: boolean;
  onboardingComplete: boolean;
  manualGameOverride: string;
  updateChannel: 'stable' | 'beta';
  onlineUpdatesEnabled: boolean;
  overlayLockMode: boolean;
  streamerMode: boolean;
  streamerCleanMode: boolean;
  themePreset: 'Nexus' | 'Cyber' | 'Minimal' | 'Ice';
};

export type Hotkeys = {
  toggleOverlay: string;
  nextProfile: string;
  previousProfile: string;
  toggleMainWindow: string;
};

export type AppState = {
  settings: AppSettings;
  profiles: Profile[];
  activeProfileId: string | null;
  overlayVisible: boolean;
  activeGame: string | null;
  detectedGames: string[];
  hotkeys: Hotkeys;
};

export type SystemStats = {
  overlayFps: number;
  ramMb: number;
  cpuPercent: number;
  runtimeSeconds: number;
};

export type DisplayInfo = {
  id: number;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  primary: boolean;
 };

export type DiagnosticInfo = {
  appVersion: string;
  userDataPath: string;
  appPath: string;
  overlayBounds: { x: number; y: number; width: number; height: number } | null;
  overlayVisible: boolean;
  activeDisplayId: number | null;
  displays: DisplayInfo[];
  settings: AppSettings;
};

export type UpdaterStatus = {
  status: 'idle' | 'checking' | 'current' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'development' | 'error';
  detail: string;
  version?: string;
  channel?: 'stable' | 'beta';
  releaseNotes?: string;
  percent?: number;
};

export type NexusAPI = {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<AppSettings>;
  getProfiles: () => Promise<Profile[]>;
  saveProfile: (profile: Profile) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<boolean>;
  setActiveProfile: (id: string) => Promise<Profile | null>;
  toggleOverlay: (visible?: boolean) => Promise<boolean>;
  updateCrosshair: (settings: CrosshairSettings) => Promise<boolean>;
  registerHotkeys: (hotkeys: Hotkeys) => Promise<Hotkeys>;
  getActiveGame: () => Promise<string | null>;
  exportProfile: (id: string) => Promise<string | null>;
  importProfile: () => Promise<Profile | null>;
  backupData: () => Promise<string | null>;
  importBackup: () => Promise<AppState | null>;
  resetData: () => Promise<AppState>;
  getState: () => Promise<AppState>;
  getSystemStats: () => Promise<SystemStats>;
  reportOverlayFps: (fps: number) => Promise<boolean>;
  refreshGames: () => Promise<string[]>;
  getDisplays: () => Promise<DisplayInfo[]>;
  getDiagnostics: () => Promise<DiagnosticInfo>;
  exportDiagnostics: () => Promise<string | null>;
  checkForUpdates: () => Promise<UpdaterStatus>;
  downloadUpdate: () => Promise<UpdaterStatus>;
  installUpdate: () => Promise<UpdaterStatus>;
  openDataFolder: () => Promise<string>;
  exportStreamerSource: () => Promise<string | null>;
  onStateChanged: (callback: (state: AppState) => void) => () => void;
  onCrosshairChanged: (callback: (settings: CrosshairSettings) => void) => () => void;
};

declare global {
  interface Window {
    nexusAPI: NexusAPI;
  }
}
