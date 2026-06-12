import { motion } from 'framer-motion';
import { Check, Crosshair, Gamepad2, Monitor, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { crosshairPresets, type CrosshairPreset } from '../data/presets';
import type { AppSettings, DisplayInfo } from '../types';
import { PreviewArena } from './PreviewArena';

type Props = {
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => void | Promise<void>;
  applyPreset: (preset: CrosshairPreset) => void | Promise<void>;
};

export function Onboarding({ settings, saveSettings, applyPreset }: Props) {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedPreset, setSelectedPreset] = useState(crosshairPresets[0]);
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    window.nexusAPI.getDisplays().then(setDisplays);
  }, []);

  const finish = async () => {
    await applyPreset(selectedPreset);
    saveSettings({ ...draft, onboardingComplete: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8 backdrop-blur-2xl">
      <motion.section initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="grid w-full max-w-5xl grid-cols-[360px_1fr] overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#101014]/95 shadow-[0_35px_120px_rgba(0,0,0,.7),0_0_80px_rgba(139,92,246,.28)]">
        <aside className="border-r border-white/[0.08] bg-[#07070A]/80 p-7">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/30 bg-violet-500/15 shadow-[0_0_34px_rgba(139,92,246,.35)]">
            <Crosshair className="h-8 w-8 text-violet-300" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-violet-300">First Setup</p>
          <h2 className="mt-3 text-3xl font-black">Nexus Crosshair Pro</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Configure monitor, overlay behavior and your first real crosshair profile.</p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-300">
            <div className="flex items-center gap-3"><Monitor className="h-4 w-4 text-violet-300" />Display targeting</div>
            <div className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-violet-300" />Live overlay setup</div>
            <div className="flex items-center gap-3"><Gamepad2 className="h-4 w-4 text-violet-300" />Preset starter profile</div>
          </div>
        </aside>

        <div className="grid gap-6 p-7">
          <section className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Language
              <select className="nexus-input" value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value as AppSettings['language'] })}>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-zinc-300">Overlay Monitor
              <select className="nexus-input" value={draft.overlayDisplayId} onChange={(event) => setDraft({ ...draft, overlayDisplayId: event.target.value })}>
                <option value="cursor">Monitor under cursor</option>
                {displays.map((display) => <option key={display.id} value={String(display.id)}>{display.label}</option>)}
              </select>
            </label>
          </section>

          <section className="grid grid-cols-3 gap-3">
            {crosshairPresets.slice(0, 6).map((preset) => (
              <button key={preset.id} className={`rounded-3xl border p-4 text-left transition duration-[250ms] hover:-translate-y-1 hover:bg-[#171722] ${selectedPreset.id === preset.id ? 'border-violet-400/60 bg-violet-500/15 shadow-[0_0_32px_rgba(139,92,246,.25)]' : 'border-white/[0.08] bg-[#07070A]/70'}`} onClick={() => setSelectedPreset(preset)}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">{preset.category}</p>
                <h3 className="mt-2 font-black">{preset.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{preset.crosshair.type}</p>
              </button>
            ))}
          </section>

          <div className="h-[260px] overflow-hidden rounded-3xl border border-white/[0.08]">
            <PreviewArena settings={selectedPreset.crosshair} title="Starter Preview" subtitle={selectedPreset.name} />
          </div>

          <section className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Open overlay on start
              <input type="checkbox" checked={draft.overlayOnStartup} onChange={(event) => setDraft({ ...draft, overlayOnStartup: event.target.checked })} />
            </label>
            <label className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-[#171722] p-4 font-semibold">
              Center test mode
              <input type="checkbox" checked={draft.centerTestMode} onChange={(event) => setDraft({ ...draft, centerTestMode: event.target.checked })} />
            </label>
          </section>

          <div className="flex items-center justify-between">
            <button className="nexus-button" onClick={() => saveSettings({ ...draft, onboardingComplete: true })}>Skip Setup</button>
            <button className="nexus-button nexus-button-primary px-6" onClick={finish}><Check className="h-4 w-4" />Finish Setup</button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
