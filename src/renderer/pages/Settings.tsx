import { BadgeInfo, DatabaseBackup, DownloadCloud, EyeOff, FolderOpen, Keyboard, Palette, RadioTower, RotateCcw, Save, Shield, Target, Upload, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppSettings, DisplayInfo, Hotkeys, UpdaterStatus } from '../types';

type Props = {
  settings: AppSettings;
  hotkeys: Hotkeys;
  saveSettings: (settings: AppSettings) => void;
  saveHotkeys: (hotkeys: Hotkeys) => void;
  backup: () => void;
  importBackup: () => void;
  reset: () => void;
};

export function Settings({ settings, hotkeys, saveSettings, saveHotkeys, backup, importBackup, reset }: Props) {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [updater, setUpdater] = useState<UpdaterStatus | null>(null);
  const [streamerSource, setStreamerSource] = useState('');
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    window.nexusAPI.getDisplays().then(setDisplays);
    window.nexusAPI.getUpdateStatus().then(setUpdater);
  }, []);
  const setting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => saveSettings({ ...settings, [key]: value });
  const hotkey = <K extends keyof Hotkeys>(key: K, value: Hotkeys[K]) => saveHotkeys({ ...hotkeys, [key]: value });
  const toggles: [string, keyof AppSettings][] = [
    ['Autostart with Windows', 'autostart'],
    ['Always show overlay', 'alwaysShowOverlay'],
    ['Open overlay on start', 'overlayOnStartup'],
    ['Start minimized', 'startMinimized']
  ];

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_420px] gap-6">
      <div className="grid gap-5">
        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <Palette className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">Theme Editor</h2>
              <p className="text-sm text-zinc-400">Personalize language, accent and color mode.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Language<select className="nexus-input" value={settings.language} onChange={(event) => setting('language', event.target.value as AppSettings['language'])}><option value="de">Deutsch</option><option value="en">English</option></select></label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Theme<select className="nexus-input" value={settings.theme} onChange={(event) => setting('theme', event.target.value as AppSettings['theme'])}><option value="dark">Dark</option><option value="light">Light</option></select></label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Accent<input className="h-12 rounded-2xl border border-white/[0.08] bg-[#101014] p-2" type="color" value={settings.accentColor} onChange={(event) => setting('accentColor', event.target.value)} /></label>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              ['Nexus', '#8b5cf6'],
              ['Cyber', '#22d3ee'],
              ['Minimal', '#ffffff'],
              ['Ice', '#60a5fa']
            ].map(([name, color]) => (
              <button key={name} className={`rounded-3xl border p-4 text-left transition duration-[250ms] hover:-translate-y-1 ${settings.themePreset === name ? 'border-violet-400/50 bg-violet-500/15' : 'border-white/[0.08] bg-[#171722]'}`} onClick={() => saveSettings({ ...settings, themePreset: name as AppSettings['themePreset'], accentColor: color })}>
                <Wand2 className="mb-3 h-4 w-4" style={{ color }} />
                <p className="font-bold">{name}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <Shield className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">System Behavior</h2>
              <p className="text-sm text-zinc-400">Startup and overlay preferences.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {toggles.map(([label, key]) => (
              <label key={key} className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
                {label}
                <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setting(key, event.target.checked as never)} />
              </label>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <Shield className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">Overlay Calibration</h2>
              <p className="text-sm text-zinc-400">Monitor, DPI and exact center correction.</p>
            </div>
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">
              Overlay Monitor
              <select className="nexus-input" value={settings.overlayDisplayId} onChange={(event) => setting('overlayDisplayId', event.target.value)}>
                <option value="cursor">Monitor under cursor</option>
                {displays.map((display) => (
                  <option key={display.id} value={String(display.id)}>{display.label}{display.primary ? ' · Primary' : ''}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="flex justify-between text-sm"><span className="font-semibold text-zinc-300">X Offset</span><span className="text-zinc-500">{settings.overlayOffsetX}px</span></span>
              <input className="nexus-slider" type="range" min="-200" max="200" value={settings.overlayOffsetX} onChange={(event) => setting('overlayOffsetX', Number(event.target.value))} />
            </label>
            <label className="grid gap-2">
              <span className="flex justify-between text-sm"><span className="font-semibold text-zinc-300">Y Offset</span><span className="text-zinc-500">{settings.overlayOffsetY}px</span></span>
              <input className="nexus-slider" type="range" min="-200" max="200" value={settings.overlayOffsetY} onChange={(event) => setting('overlayOffsetY', Number(event.target.value))} />
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Center Test Mode
              <input type="checkbox" checked={settings.centerTestMode} onChange={(event) => setting('centerTestMode', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Overlay Lock Mode
              <input type="checkbox" checked={settings.overlayLockMode} onChange={(event) => setting('overlayLockMode', event.target.checked)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">
              Manual Active Game Override
              <input className="nexus-input" value={settings.manualGameOverride} placeholder="Fortnite, VALORANT, CS2..." onChange={(event) => setting('manualGameOverride', event.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button className="nexus-button" onClick={() => saveSettings({ ...settings, centerTestMode: true, overlayOffsetX: 0, overlayOffsetY: 0 })}><Target className="h-4 w-4" />Center Wizard</button>
              <button className="nexus-button" onClick={() => saveSettings({ ...settings, overlayOffsetX: 0, overlayOffsetY: 0 })}>Reset Calibration</button>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <RadioTower className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">Streamer Mode</h2>
              <p className="text-sm text-zinc-400">Clean presentation options for recording and OBS workflows.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Streamer Mode
              <input type="checkbox" checked={settings.streamerMode} onChange={(event) => setting('streamerMode', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Clean UI
              <input type="checkbox" checked={settings.streamerCleanMode} onChange={(event) => setting('streamerCleanMode', event.target.checked)} />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="nexus-button" onClick={() => saveSettings({ ...settings, streamerMode: true, streamerCleanMode: true })}><EyeOff className="h-4 w-4" />Clean Setup</button>
            <button className="nexus-button nexus-button-primary" onClick={async () => setStreamerSource(await window.nexusAPI.exportStreamerSource() ?? '')}><RadioTower className="h-4 w-4" />Export OBS</button>
          </div>
          {streamerSource && <p className="mt-3 break-all rounded-2xl border border-white/[0.08] bg-[#07070A]/70 p-3 text-xs text-zinc-400">{streamerSource}</p>}
        </section>
      </div>

      <aside className="grid gap-5">
        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <BadgeInfo className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">What's New</h2>
              <p className="text-sm text-zinc-400">Version 0.0.2 update polish.</p>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-zinc-300">
            {['In-app release notes', 'Auto update checks on app start', 'Tray update actions', 'Pinned GitHub updater feed'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.08] bg-[#171722] px-4 py-3">{item}</div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <Keyboard className="h-5 w-5 text-violet-300" />
            <h2 className="text-xl font-black">Hotkeys</h2>
          </div>
          <div className="grid gap-3">
            {[
              ['Overlay Toggle', 'toggleOverlay'],
              ['Next Profile', 'nextProfile'],
              ['Previous Profile', 'previousProfile'],
              ['Main Window', 'toggleMainWindow']
            ].map(([label, key]) => (
              <label key={key} className="grid gap-2 text-sm font-semibold text-zinc-300">
                {label}
                <input className="nexus-input" value={hotkeys[key as keyof Hotkeys]} onChange={(event) => hotkey(key as keyof Hotkeys, event.target.value)} />
              </label>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <DatabaseBackup className="h-5 w-5 text-violet-300" />
            <h2 className="text-xl font-black">Backup / Restore</h2>
          </div>
          <div className="grid gap-3">
            <button className="nexus-button nexus-button-primary" onClick={backup}><Save className="h-4 w-4" />Export Backup</button>
            <button className="nexus-button" onClick={importBackup}><Upload className="h-4 w-4" />Import Backup</button>
            <button className="nexus-button" onClick={() => window.nexusAPI.openDataFolder()}><FolderOpen className="h-4 w-4" />Open Data Folder</button>
            <button className="nexus-button text-red-200" onClick={reset}><RotateCcw className="h-4 w-4" />Reset Data</button>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <DownloadCloud className="h-5 w-5 text-violet-300" />
            <div>
              <h2 className="text-xl font-black">Updater</h2>
              <p className="text-sm text-zinc-400">Prepared for packaged releases and update channels.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Update Channel
              <select className="nexus-input" value={settings.updateChannel} onChange={(event) => setting('updateChannel', event.target.value as AppSettings['updateChannel'])}>
                <option value="stable">Stable</option>
                <option value="beta">Beta</option>
              </select>
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Online Update Checks
              <input type="checkbox" checked={settings.onlineUpdatesEnabled} onChange={(event) => setting('onlineUpdatesEnabled', event.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Auto Check on Start
              <input type="checkbox" checked={settings.autoCheckUpdates} onChange={(event) => setting('autoCheckUpdates', event.target.checked)} />
            </label>
            <div className="rounded-3xl border border-white/[0.08] bg-[#171722] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">{updater?.status ?? 'idle'}</p>
                <span className="rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-200">{settings.updateChannel}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{updater?.detail ?? 'No update check has been started in this session.'}</p>
              {updater?.version && <p className="mt-2 text-xs text-zinc-500">Version: {updater.version}</p>}
              {typeof updater?.percent === 'number' && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#07070A]">
                  <div className="h-full rounded-full bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,.55)]" style={{ width: `${updater.percent}%` }} />
                </div>
              )}
              {updater?.releaseNotes && (
                <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#07070A]/60 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Release Notes</p>
                  <p className="max-h-28 overflow-auto whitespace-pre-wrap text-xs text-zinc-400">{updater.releaseNotes}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="nexus-button nexus-button-primary px-3" disabled={checking} onClick={async () => {
                setChecking(true);
                setUpdater(await window.nexusAPI.checkForUpdates());
                setChecking(false);
              }}>
                <DownloadCloud className="h-4 w-4" />{checking ? 'Checking...' : 'Check'}
              </button>
              <button className="nexus-button px-3" disabled={updater?.status !== 'available'} onClick={async () => setUpdater(await window.nexusAPI.downloadUpdate())}>Download</button>
              <button className="nexus-button px-3" disabled={updater?.status !== 'downloaded'} onClick={async () => setUpdater(await window.nexusAPI.installUpdate())}>Install</button>
            </div>
            <button className="nexus-button" onClick={() => window.nexusAPI.getUpdateStatus().then(setUpdater)}>Refresh Status</button>
          </div>
        </section>
      </aside>
    </section>
  );
}
