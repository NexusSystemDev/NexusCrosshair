import { Crosshair, MousePointer2, RotateCcw, Timer, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CrosshairPreview } from '../components/CrosshairPreview';
import type { CrosshairSettings } from '../types';

type Props = {
  settings: CrosshairSettings;
};

function nextTarget() {
  return {
    x: 12 + Math.random() * 76,
    y: 16 + Math.random() * 68
  };
}

export function Training({ settings }: Props) {
  const [target, setTarget] = useState(nextTarget);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const [hits, setHits] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const average = useMemo(() => hits.length ? Math.round(hits.reduce((sum, value) => sum + value, 0) / hits.length) : 0, [hits]);
  const best = hits.length ? Math.min(...hits) : 0;

  const hit = () => {
    const now = performance.now();
    setHits((items) => [...items, Math.round(now - startedAt)].slice(-30));
    setTarget(nextTarget());
    setStartedAt(now);
  };
  const reset = () => {
    setHits([]);
    setMisses(0);
    setTarget(nextTarget());
    setStartedAt(performance.now());
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
      <div className="glass-card rounded-3xl p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-300">Aim Lab Lite</p>
            <h2 className="text-3xl font-black">Training Arena</h2>
          </div>
          <button className="nexus-button" onClick={reset}><RotateCcw className="h-4 w-4" />Reset</button>
        </div>
        <div className="relative h-[560px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(139,92,246,.14),transparent_40%),linear-gradient(90deg,rgba(139,92,246,.08)_1px,transparent_1px),linear-gradient(180deg,rgba(139,92,246,.08)_1px,transparent_1px),#07070A] bg-[length:auto,48px_48px,48px_48px]" onClick={() => setMisses((value) => value + 1)}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <CrosshairPreview settings={settings} />
          </div>
          <button
            className="absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/70 bg-violet-500/30 shadow-[0_0_34px_rgba(139,92,246,.55)] transition hover:scale-110"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            onClick={(event) => { event.stopPropagation(); hit(); }}
            aria-label="Training target"
          />
          <div className="absolute bottom-4 left-4 rounded-2xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-zinc-300 backdrop-blur">Click the glowing target as fast as possible.</div>
        </div>
      </div>

      <aside className="grid gap-5">
        {[
          ['Hits', String(hits.length), Trophy],
          ['Average', average ? `${average} ms` : '-', Timer],
          ['Best', best ? `${best} ms` : '-', Crosshair],
          ['Misses', String(misses), MousePointer2]
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="glass-card-soft rounded-3xl p-5">
            <Icon className="mb-4 h-5 w-5 text-violet-300" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </aside>
    </section>
  );
}
