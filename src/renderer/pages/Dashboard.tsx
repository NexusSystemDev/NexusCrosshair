import { Activity, Cpu, Crosshair, Gauge, Gamepad2, Link, Power, RefreshCw, Timer, UserRoundCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { PreviewArena } from '../components/PreviewArena';
import type { AppState, SystemStats } from '../types';

type Props = {
  state: AppState;
  stats: SystemStats;
  setPage: (page: string) => void;
  toggleOverlay: (visible?: boolean) => void;
  refreshGames: () => void;
  bindActiveGame: () => void;
};

const statIcons = [Gamepad2, Power, Gauge, Cpu, Timer, UserRoundCog];

export function Dashboard({ state, stats, setPage, toggleOverlay, refreshGames, bindActiveGame }: Props) {
  const active = state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0];
  const fortniteDetected = state.activeGame === 'Fortnite' || state.detectedGames.includes('Fortnite');
  const runtime = `${Math.floor(stats.runtimeSeconds / 3600)}h ${Math.floor((stats.runtimeSeconds % 3600) / 60)}m`;
  const changed = active ? new Date(active.updatedAt).toLocaleString() : '-';
  const statsRows = [
    ['Active Game', state.activeGame ?? 'Not detected'],
    ['Overlay', state.overlayVisible ? 'Online' : 'Offline'],
    ['Overlay FPS', `${stats.overlayFps}`],
    ['CPU Usage', `${stats.cpuPercent}%`],
    ['Runtime', runtime],
    ['Profiles', String(state.profiles.length)]
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <motion.div whileHover={{ y: -3 }}>
          <PreviewArena
            settings={active.crosshair}
            title="Premium Overlay Preview"
            subtitle={`${active.name} · ${active.crosshair.type}`}
            size="dashboard"
            meta={`${state.activeGame ?? 'No game'} · ${state.overlayVisible ? 'Overlay active' : 'Overlay stopped'} · Updated ${changed}`}
          />
        </motion.div>

        <section className="glass-card rounded-3xl p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300"><Crosshair className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-black">Active Setup</h3>
              <p className="text-sm text-zinc-400">Live overlay state</p>
            </div>
          </div>
          <div className="grid gap-3">
            {fortniteDetected && (
              <div className="rounded-3xl border border-violet-400/30 bg-violet-500/15 p-4 shadow-[0_0_28px_rgba(139,92,246,.18)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">Fortnite Focus</p>
                <p className="mt-1 text-sm text-zinc-300">Fortnite detected. Auto profile switching is active when this profile is bound.</p>
              </div>
            )}
            <div className="rounded-2xl bg-[#171722] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Profile</p>
              <p className="mt-1 font-bold">{active.name}</p>
            </div>
            <div className="rounded-2xl bg-[#171722] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Game</p>
              <p className="mt-1 font-bold">{state.activeGame ?? 'Not detected'}</p>
            </div>
            <button className="nexus-button nexus-button-primary w-full" onClick={() => toggleOverlay(!state.overlayVisible)}>
              <Power className="h-4 w-4" />
              {state.overlayVisible ? 'Stop Overlay' : 'Start Overlay'}
            </button>
            <button className="nexus-button w-full" onClick={() => setPage('editor')}>Open Editor</button>
            <button className="nexus-button w-full" onClick={bindActiveGame} disabled={!state.activeGame}><Link className="h-4 w-4" />Bind Game</button>
            <button className="nexus-button w-full" onClick={refreshGames}><RefreshCw className="h-4 w-4" />Refresh Games</button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {statsRows.map(([label, value], index) => {
          const Icon = statIcons[index] ?? Activity;
          return (
            <motion.div key={label} whileHover={{ y: -4 }} className="glass-card-soft rounded-3xl p-4">
              <Icon className="mb-4 h-5 w-5 text-violet-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
              <p className="mt-2 truncate text-lg font-black">{value}</p>
            </motion.div>
          );
        })}
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black">Activity Panel</h3>
            <p className="text-sm text-zinc-400">Detected games and profile events</p>
          </div>
          <Activity className="h-5 w-5 text-violet-300" />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between rounded-2xl bg-[#171722] px-4 py-3">
            <span className="text-zinc-400">Last profile change</span>
            <span className="font-semibold">{changed}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.detectedGames.length ? state.detectedGames.map((game) => (
              <span key={game} className="rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1 text-sm text-violet-200">{game}</span>
            )) : <span className="text-sm text-zinc-500">No supported game process detected.</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
