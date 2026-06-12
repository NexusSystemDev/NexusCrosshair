import { motion } from 'framer-motion';
import { Check, ClipboardPaste, Copy, Palette, RotateCw, Sparkles, Target, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PreviewArena } from '../components/PreviewArena';
import type { CrosshairSettings, Profile } from '../types';
import { decodeCrosshairCode, encodeCrosshairCode } from '../utils/crosshairCode';

type Props = {
  profile: Profile | undefined;
  profiles: Profile[];
  draft: CrosshairSettings;
  setDraft: (settings: CrosshairSettings) => void;
  save: () => void;
  reset: () => void;
  activate: (id: string) => void;
};

const types: CrosshairSettings['type'][] = ['dot', 'cross', 'circle', 'circle-dot', 'plus', 'x-shape', 't-shape', 'sniper', 'tactical', 'custom'];
const tabs = [
  { id: 'Shape', icon: Target },
  { id: 'Color', icon: Palette },
  { id: 'Effects', icon: Sparkles },
  { id: 'Advanced', icon: RotateCw }
] as const;

export function Editor({ profile, profiles, draft, setDraft, save, reset, activate }: Props) {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('Shape');
  const [crosshairCode, setCrosshairCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeHistory, setCodeHistory] = useState<string[]>([]);

  useEffect(() => {
    setCodeHistory(JSON.parse(localStorage.getItem('nexus-crosshair-code-history') ?? '[]'));
  }, []);

  const rememberCode = (code: string) => {
    const next = [code, ...codeHistory.filter((item) => item !== code)].slice(0, 5);
    setCodeHistory(next);
    localStorage.setItem('nexus-crosshair-code-history', JSON.stringify(next));
  };
  const patch = <K extends keyof CrosshairSettings>(key: K, value: CrosshairSettings[K]) => setDraft({ ...draft, [key]: value });
  const adaptiveMode = (mode: 'fight' | 'sniper' | 'shotgun' | 'edit') => {
    const modes = {
      fight: { type: 'cross' as const, gap: 6, length: 20, thickness: 3, dotSize: 3, circleRadius: 18, glowStrength: 6 },
      sniper: { type: 'sniper' as const, gap: 10, length: 34, thickness: 2, dotSize: 2, circleRadius: 28, glowStrength: 4 },
      shotgun: { type: 'circle-dot' as const, gap: 4, length: 12, thickness: 3, dotSize: 4, circleRadius: 18, glowStrength: 7 },
      edit: { type: 'dot' as const, gap: 0, length: 10, thickness: 2, dotSize: 3, circleRadius: 14, glowStrength: 5 }
    };
    setDraft({ ...draft, ...modes[mode] });
  };
  const slider = (label: string, key: keyof CrosshairSettings, min: number, max: number, step = 1) => (
    <label className="grid gap-2">
      <span className="flex justify-between text-sm"><span className="font-semibold text-zinc-300">{label}</span><span className="text-zinc-500">{String(draft[key])}</span></span>
      <input className="nexus-slider" type="range" min={min} max={max} step={step} value={Number(draft[key])} onChange={(event) => patch(key, Number(event.target.value) as never)} />
    </label>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_430px] gap-6">
      <PreviewArena settings={draft} title="Crosshair Test Area" subtitle={`${profile?.name ?? 'Profile'} · Live Update`} />

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">Live Control Panel</p>
            <h3 className="text-xl font-black">{profile?.name ?? 'Editor'}</h3>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">Live</span>
        </div>

        <div className="mb-5 grid grid-cols-4 gap-2 rounded-2xl border border-white/[0.08] bg-[#07070A]/70 p-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition duration-[250ms] ${tab === item.id ? 'bg-violet-600 text-white shadow-[0_0_24px_rgba(139,92,246,.35)]' : 'text-zinc-400 hover:bg-[#171722]'}`} onClick={() => setTab(item.id)}>
                <Icon className="h-4 w-4" />
                {item.id}
              </button>
            );
          })}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
          {tab === 'Shape' && (
            <>
              <label className="grid gap-2 text-sm font-semibold text-zinc-300">
                Crosshair Type
                <select className="nexus-input" value={draft.type} onChange={(event) => patch('type', event.target.value as CrosshairSettings['type'])}>
                  {types.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              {slider('Size', 'size', 20, 120)}
              {slider('Length', 'length', 4, 60)}
              {slider('Thickness', 'thickness', 1, 12)}
              {slider('Gap', 'gap', 0, 30)}
              {slider('Dot Size', 'dotSize', 1, 18)}
              {slider('Circle Radius', 'circleRadius', 4, 60)}
            </>
          )}

          {tab === 'Color' && (
            <>
              <div className="grid grid-cols-[86px_1fr] gap-3">
                <input className="h-20 w-20 rounded-3xl border border-white/[0.08] bg-[#101014] p-2" type="color" value={draft.color} onChange={(event) => patch('color', event.target.value)} />
                <label className="grid gap-2 text-sm font-semibold text-zinc-300">HEX<input className="nexus-input" value={draft.color} onChange={(event) => /^#[0-9a-fA-F]{0,6}$/.test(event.target.value) && patch('color', event.target.value)} /></label>
              </div>
              <div className="grid grid-cols-[86px_1fr] gap-3">
                <input className="h-20 w-20 rounded-3xl border border-white/[0.08] bg-[#101014] p-2" type="color" value={draft.outlineColor} onChange={(event) => patch('outlineColor', event.target.value)} />
                <label className="grid gap-2 text-sm font-semibold text-zinc-300">Outline HEX<input className="nexus-input" value={draft.outlineColor} onChange={(event) => /^#[0-9a-fA-F]{0,6}$/.test(event.target.value) && patch('outlineColor', event.target.value)} /></label>
              </div>
              {slider('Opacity', 'opacity', 0.1, 1, 0.05)}
            </>
          )}

          {tab === 'Effects' && (
            <>
              {(['outline', 'shadow', 'glow'] as const).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#171722] p-4 text-sm font-bold capitalize">
                  {key}
                  <input type="checkbox" checked={draft[key]} onChange={(event) => patch(key, event.target.checked)} />
                </label>
              ))}
              {slider('Outline Strength', 'outlineStrength', 1, 8)}
              {slider('Shadow Strength', 'shadowStrength', 1, 10)}
              {slider('Glow Strength', 'glowStrength', 1, 14)}
            </>
          )}

          {tab === 'Advanced' && (
            <>
              {slider('Rotation', 'rotation', 0, 360)}
              <label className="grid gap-2 text-sm font-semibold text-zinc-300">
                Profile Switch
                <select className="nexus-input" value={profile?.id} onChange={(event) => activate(event.target.value)}>
                  {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <div className="grid gap-3 rounded-3xl border border-white/[0.08] bg-[#07070A]/70 p-4">
                <div>
                  <h4 className="font-black">Adaptive Modes</h4>
                  <p className="text-sm text-zinc-400">Instant live profiles for common fight situations.</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button className="nexus-button px-3" onClick={() => adaptiveMode('fight')}>Fight</button>
                  <button className="nexus-button px-3" onClick={() => adaptiveMode('sniper')}>Sniper</button>
                  <button className="nexus-button px-3" onClick={() => adaptiveMode('shotgun')}>Shotgun</button>
                  <button className="nexus-button px-3" onClick={() => adaptiveMode('edit')}>Edit</button>
                </div>
              </div>
              <div className="grid gap-3 rounded-3xl border border-white/[0.08] bg-[#07070A]/70 p-4">
                <div>
                  <h4 className="font-black">Crosshair Code</h4>
                  <p className="text-sm text-zinc-400">Share or import an exact Nexus crosshair.</p>
                </div>
                <textarea className="nexus-input min-h-24 resize-none font-mono text-xs" value={crosshairCode} onChange={(event) => { setCrosshairCode(event.target.value); setCodeError(''); }} />
                {codeError && <p className="text-sm font-semibold text-red-300">{codeError}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <button className="nexus-button" onClick={async () => {
                    const code = encodeCrosshairCode(draft);
                    setCrosshairCode(code);
                    rememberCode(code);
                    await navigator.clipboard?.writeText(code).catch(() => undefined);
                  }}><Copy className="h-4 w-4" />Copy Code</button>
                  <button className="nexus-button" onClick={() => {
                    try {
                      setDraft(decodeCrosshairCode(crosshairCode));
                      rememberCode(crosshairCode.trim());
                      setCodeError('');
                    } catch {
                      setCodeError('Invalid Nexus crosshair code.');
                    }
                  }}><ClipboardPaste className="h-4 w-4" />Apply Code</button>
                </div>
                <button className="nexus-button" onClick={async () => {
                  const text = await navigator.clipboard?.readText().catch(() => '');
                  if (text) setCrosshairCode(text);
                }}><ClipboardPaste className="h-4 w-4" />Paste from Clipboard</button>
                {codeHistory.length > 0 && (
                  <div className="grid gap-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Recent Codes</p>
                    {codeHistory.map((code) => (
                      <button key={code} className="truncate rounded-2xl border border-white/[0.08] bg-[#171722] px-3 py-2 text-left font-mono text-xs text-zinc-300 hover:bg-[#20202a]" onClick={() => setCrosshairCode(code)}>
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="nexus-button nexus-button-primary" onClick={save}><Check className="h-4 w-4" />Save</button>
          <button className="nexus-button" onClick={reset}><Undo2 className="h-4 w-4" />Reset</button>
        </div>
      </section>
    </div>
  );
}
