import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Brain,
  Crosshair,
  GalleryVerticalEnd,
  Gamepad2,
  LayoutDashboard,
  Library,
  MonitorCog,
  Power,
  RadioTower,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Trophy,
  UserRoundCog
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CrosshairPreview } from './components/CrosshairPreview';
import { Onboarding } from './components/Onboarding';
import { ToastHost, type ToastItem } from './components/ToastHost';
import { Community } from './pages/Community';
import { Dashboard } from './pages/Dashboard';
import { Diagnostics } from './pages/Diagnostics';
import { Editor } from './pages/Editor';
import { Coach } from './pages/Coach';
import { Profiles } from './pages/Profiles';
import { Settings } from './pages/Settings';
import { Training } from './pages/Training';
import type { CrosshairPreset } from './data/presets';
import type { AppState, CrosshairSettings, Profile, SystemStats } from './types';

const isOverlay = new URLSearchParams(window.location.search).get('overlay') === '1';
const nexusLogo = new URL('./assets/nexus-logo-small.png', import.meta.url).href;
const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor', icon: SlidersHorizontal },
  { id: 'coach', label: 'Coach', icon: Brain },
  { id: 'training', label: 'Training', icon: Trophy },
  { id: 'profiles', label: 'Profiles', icon: UserRoundCog },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'diagnostics', label: 'Diagnostics', icon: MonitorCog },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
] as const;

function OverlayApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [liveCrosshair, setLiveCrosshair] = useState<CrosshairSettings | null>(null);

  useEffect(() => {
    document.body.classList.add('overlay-body');
    window.nexusAPI.getState().then(setState);
    const offState = window.nexusAPI.onStateChanged((next) => {
      setState(next);
      const active = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0];
      setLiveCrosshair(active.crosshair);
    });
    const offCrosshair = window.nexusAPI.onCrosshairChanged(setLiveCrosshair);
    let frames = 0;
    let last = performance.now();
    let animation = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        window.nexusAPI.reportOverlayFps(frames);
        frames = 0;
        last = now;
      }
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => {
      offState();
      offCrosshair();
      cancelAnimationFrame(animation);
    };
  }, []);

  const active = state?.profiles.find((profile) => profile.id === state.activeProfileId) ?? state?.profiles[0];
  const crosshair = liveCrosshair ?? active?.crosshair;
  if (!crosshair || !state?.overlayVisible) return null;
  return (
    <div className="pointer-events-none fixed left-0 top-0 h-screen w-screen overflow-hidden bg-transparent">
      {state.settings.centerTestMode && (
        <>
          <div className="absolute left-1/2 top-0 h-screen w-px bg-violet-400/70" />
          <div className="absolute left-0 top-1/2 h-px w-screen bg-violet-400/70" />
        </>
      )}
      <div
        className="absolute"
        style={{
          left: `calc(50vw + ${state.settings.overlayOffsetX}px)`,
          top: `calc(50vh + ${state.settings.overlayOffsetY}px)`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <CrosshairPreview settings={crosshair} />
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [stats, setStats] = useState<SystemStats>({ overlayFps: 0, ramMb: 0, cpuPercent: 0, runtimeSeconds: 0 });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [page, setPage] = useState<(typeof pages)[number]['id']>('dashboard');
  const [notifiedUpdate, setNotifiedUpdate] = useState('');
  const activeProfile = useMemo(() => state?.profiles.find((profile) => profile.id === state.activeProfileId) ?? state?.profiles[0], [state]);
  const [draft, setDraft] = useState<CrosshairSettings | null>(null);
  const [appVersion, setAppVersion] = useState<string>('0.0.0');

  const notify = (title: string, detail?: string, tone: ToastItem['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, title, detail, tone }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3600);
  };

  useEffect(() => {
    if (isOverlay) return;
    window.nexusAPI.getDiagnostics().then((info) => setAppVersion(info.appVersion));
    window.nexusAPI.getState().then((next) => {
      setState(next);
      const active = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0];
      setDraft(active.crosshair);
    });
    const statsTimer = setInterval(() => window.nexusAPI.getSystemStats().then(setStats), 1000);
    window.nexusAPI.getSystemStats().then(setStats);
    const offState = window.nexusAPI.onStateChanged((next) => {
      setState(next);
      const active = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0];
      setDraft((current) => current ?? active.crosshair);
    });
    return () => {
      clearInterval(statsTimer);
      offState();
    };
  }, []);

  useEffect(() => {
    if (draft && page === 'editor') window.nexusAPI.updateCrosshair(draft);
  }, [draft, page]);

  useEffect(() => {
    if (isOverlay || !state?.settings.onlineUpdatesEnabled) return;
    const check = async () => {
      const status = await window.nexusAPI.getUpdateStatus();
      if (status.status === 'available' && status.version && status.version !== notifiedUpdate) {
        setNotifiedUpdate(status.version);
        notify('Update available', `Version ${status.version}`, 'success');
      }
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, [state?.settings.onlineUpdatesEnabled, notifiedUpdate]);

  if (isOverlay) return <OverlayApp />;
  if (!state || !activeProfile || !draft) return <div className="flex h-full items-center justify-center bg-[#07070A] text-white">Nexus Crosshair Pro</div>;

  const persistProfile = async (profile: Profile) => {
    await window.nexusAPI.saveProfile(profile);
    setState(await window.nexusAPI.getState());
    notify('Profile saved', profile.name, 'success');
  };
  const duplicate = (profile: Profile) => {
    const now = new Date().toISOString();
    persistProfile({ ...profile, id: crypto.randomUUID(), name: `${profile.name} Copy`, createdAt: now, updatedAt: now });
  };
  const remove = async (id: string) => {
    await window.nexusAPI.deleteProfile(id);
    setState(await window.nexusAPI.getState());
    notify('Profile deleted', undefined, 'danger');
  };
  const activate = async (id: string) => {
    await window.nexusAPI.setActiveProfile(id);
    const next = await window.nexusAPI.getState();
    const active = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0];
    setState(next);
    setDraft(active.crosshair);
    notify('Profile activated', active.name, 'success');
  };
  const saveEditor = async () => {
    await window.nexusAPI.saveProfile({ ...activeProfile, crosshair: draft });
    setState(await window.nexusAPI.getState());
    notify('Crosshair saved', activeProfile.name, 'success');
  };
  const saveSettings = async (settings: AppState['settings']) => {
    await window.nexusAPI.saveSettings(settings);
    setState(await window.nexusAPI.getState());
    notify('Settings updated', undefined, 'success');
  };
  const saveHotkeys = async (hotkeys: AppState['hotkeys']) => {
    await window.nexusAPI.registerHotkeys(hotkeys);
    setState(await window.nexusAPI.getState());
    notify('Hotkeys updated', undefined, 'success');
  };
  const refreshGames = async () => {
    await window.nexusAPI.refreshGames();
    setState(await window.nexusAPI.getState());
    notify('Game detection refreshed', undefined, 'success');
  };
  const applyPreset = async (preset: CrosshairPreset) => {
    const now = new Date().toISOString();
    const profile: Profile = {
      id: crypto.randomUUID(),
      name: preset.name,
      gameName: preset.category,
      gameProcess: '',
      tags: [preset.category, preset.crosshair.type],
      favorite: false,
      lastUsedAt: now,
      crosshair: preset.crosshair,
      hotkey: state.hotkeys.toggleOverlay,
      createdAt: now,
      updatedAt: now
    };
    await window.nexusAPI.saveProfile(profile);
    await window.nexusAPI.setActiveProfile(profile.id);
    const next = await window.nexusAPI.getState();
    setState(next);
    setDraft(profile.crosshair);
    notify('Preset applied', preset.name, 'success');
  };
  const bindActiveGame = async () => {
    if (!state.activeGame) {
      notify('No active game detected', undefined, 'info');
      return;
    }
    const saved = { ...activeProfile, gameName: state.activeGame, gameProcess: state.activeGame };
    await window.nexusAPI.saveProfile(saved);
    setState(await window.nexusAPI.getState());
    notify('Game bound to profile', `${state.activeGame} -> ${activeProfile.name}`, 'success');
  };

  const pageTitle = pages.find((item) => item.id === page)?.label ?? 'Dashboard';

  const themeClass = `theme-${state.settings.themePreset.toLowerCase()}`;

  return (
    <div className={`premium-shell ${themeClass} relative flex h-full overflow-hidden text-white ${state.settings.theme === 'light' ? 'premium-shell-light' : ''}`} style={{ '--accent': state.settings.accentColor } as CSSProperties}>
      <div className="epic-bg-grid" />
      <div className="epic-bg-beam epic-bg-beam-a" />
      <div className="epic-bg-beam epic-bg-beam-b" />
      <div className="epic-bg-noise" />
      <ToastHost items={toasts} />
      {!state.settings.onboardingComplete && <Onboarding settings={state.settings} saveSettings={saveSettings} applyPreset={applyPreset} />}
      <aside className="epic-sidebar relative z-10 flex w-72 flex-col border-r border-white/[0.08] bg-[#07070A]/80 p-5 backdrop-blur-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="brand-orb flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 shadow-[0_0_28px_rgba(139,92,246,.28)]">
            <img className="relative z-10 h-10 w-10 rounded-xl object-cover" src={nexusLogo} alt="Nexus Crosshair Pro" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide">Nexus Crosshair Pro</h1>
            <p className="text-xs font-medium text-zinc-400">Version {appVersion} / {state.settings.updateChannel === 'beta' ? 'Beta' : 'Stable'}</p>
          </div>
        </div>

        <nav className="grid gap-2">
          {pages.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} className={`nav-item rounded-2xl px-4 py-3 text-left font-semibold ${active ? 'nav-item-active' : ''}`} onClick={() => setPage(item.id)}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="epic-status mt-auto rounded-3xl border border-white/[0.08] bg-[#101014] p-4 shadow-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <RadioTower className="h-4 w-4 text-emerald-300" />
            Online
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
            <span>FPS</span><span className="text-right text-white">{stats.overlayFps}</span>
            <span>CPU</span><span className="text-right text-white">{stats.cpuPercent}%</span>
            <span>RAM</span><span className="text-right text-white">{stats.ramMb} MB</span>
          </div>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="epic-topbar flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#07070A]/55 px-7 backdrop-blur-2xl">
          <div>
            <p className="text-sm font-medium text-zinc-400">Premium esports overlay control center</p>
            <h2 className="text-2xl font-black tracking-tight">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            {state.settings.streamerMode && (
              <div className="hidden rounded-2xl border border-violet-400/25 bg-violet-500/15 px-4 py-3 text-sm font-bold text-violet-200 md:block">
                Streamer Mode {state.settings.streamerCleanMode ? 'Clean' : 'On'}
              </div>
            )}
            <div className="hidden items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#101014] px-4 py-3 text-sm text-zinc-300 md:flex">
              <Gamepad2 className="h-4 w-4 text-violet-300" />
              {state.activeGame ?? 'No game detected'}
            </div>
            <button className={`nexus-button ${state.overlayVisible ? 'nexus-button-primary' : ''}`} onClick={async () => {
              await window.nexusAPI.toggleOverlay();
              const next = await window.nexusAPI.getState();
              setState(next);
              notify(next.overlayVisible ? 'Overlay enabled' : 'Overlay disabled', activeProfile.name, next.overlayVisible ? 'success' : 'info');
            }}>
              <Power className="h-4 w-4" />
              {state.overlayVisible ? 'Overlay On' : 'Overlay Off'}
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-6 overflow-auto p-7">
          <section className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
                {page === 'dashboard' && <Dashboard state={state} stats={stats} setPage={setPage} toggleOverlay={(visible) => window.nexusAPI.toggleOverlay(visible).then(() => window.nexusAPI.getState().then(setState))} refreshGames={refreshGames} bindActiveGame={bindActiveGame} />}
                {page === 'editor' && <Editor profile={activeProfile} profiles={state.profiles} draft={draft} setDraft={setDraft} save={saveEditor} reset={() => setDraft(activeProfile.crosshair)} activate={activate} />}
                {page === 'coach' && <Coach profile={activeProfile} draft={draft} setDraft={setDraft} setPage={setPage} />}
                {page === 'training' && <Training settings={draft} />}
                {page === 'profiles' && <Profiles profiles={state.profiles} activeProfileId={state.activeProfileId} activate={activate} save={persistProfile} remove={remove} duplicate={duplicate} exportProfile={async (id) => { const path = await window.nexusAPI.exportProfile(id); notify(path ? 'Profile exported' : 'Export cancelled', path ?? undefined, path ? 'success' : 'info'); }} importProfile={async () => { const profile = await window.nexusAPI.importProfile(); setState(await window.nexusAPI.getState()); notify(profile ? 'Profile imported' : 'Import cancelled', profile?.name, profile ? 'success' : 'info'); }} />}
                {page === 'library' && <Community profiles={state.profiles} activeProfile={activeProfile} saveProfile={persistProfile} activate={activate} duplicate={duplicate} applyPreset={applyPreset} exportProfile={async (id) => { const path = await window.nexusAPI.exportProfile(id); notify(path ? 'Crosshair exported' : 'Export cancelled', path ?? undefined, path ? 'success' : 'info'); }} importProfile={async () => { const profile = await window.nexusAPI.importProfile(); setState(await window.nexusAPI.getState()); notify(profile ? 'Crosshair imported' : 'Import cancelled', profile?.name, profile ? 'success' : 'info'); }} />}
                {page === 'diagnostics' && <Diagnostics notify={notify} />}
                {page === 'settings' && <Settings settings={state.settings} hotkeys={state.hotkeys} saveSettings={saveSettings} saveHotkeys={saveHotkeys} backup={async () => { const path = await window.nexusAPI.backupData(); notify(path ? 'Backup exported' : 'Backup cancelled', path ?? undefined, path ? 'success' : 'info'); }} importBackup={async () => { const next = await window.nexusAPI.importBackup(); if (next) { setState(next); const active = next.profiles.find((profile) => profile.id === next.activeProfileId) ?? next.profiles[0]; setDraft(active.crosshair); notify('Backup imported', undefined, 'success'); } else notify('Import cancelled'); }} reset={async () => { const next = await window.nexusAPI.resetData(); setState(next); setDraft(next.profiles[0].crosshair); notify('Data reset', undefined, 'danger'); }} />}
              </motion.div>
            </AnimatePresence>
          </section>

          <aside className={state.settings.streamerCleanMode ? 'hidden' : 'hidden w-80 shrink-0 xl:block'}>
            <div className="glass-card sticky top-0 rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Quick Control</p>
                  <h3 className="text-lg font-black">Overlay</h3>
                </div>
                <Activity className="h-5 w-5 text-violet-300" />
              </div>
              <div className="mb-5 flex h-44 items-center justify-center rounded-3xl border border-white/[0.08] bg-[#07070A] shadow-inner">
                <CrosshairPreview settings={draft} compact />
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-[#171722] px-4 py-3"><span className="text-zinc-400">Profile</span><span className="font-semibold">{activeProfile.name}</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-[#171722] px-4 py-3"><span className="text-zinc-400">Crosshair</span><span className="font-semibold">{draft.type}</span></div>
                <div className="flex items-center justify-between rounded-2xl bg-[#171722] px-4 py-3"><span className="text-zinc-400">Profiles</span><span className="font-semibold">{state.profiles.length}</span></div>
              </div>
              <button className="nexus-button nexus-button-primary mt-5 w-full" onClick={() => setPage('editor')}>
                <GalleryVerticalEnd className="h-4 w-4" />
                Open Editor
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
