import { useState } from 'react';
import { CrosshairPreview } from './CrosshairPreview';
import type { CrosshairSettings } from '../types';

type ArenaBackground = 'Dark Grid' | 'FPS Map Style' | 'Betonwand' | 'Schießstand' | 'Neon Arena';

type Props = {
  settings: CrosshairSettings;
  title?: string;
  subtitle?: string;
  size?: 'editor' | 'dashboard';
  meta?: string;
};

const backgrounds: Record<ArenaBackground, string> = {
  'Dark Grid': 'bg-[#050508]',
  'FPS Map Style': 'bg-[radial-gradient(circle_at_25%_20%,rgba(148,163,184,.24),transparent_24%),linear-gradient(135deg,#1f2937,#09090b_58%,#312e81)]',
  Betonwand: 'bg-[linear-gradient(135deg,#27272a,#52525b_46%,#18181b)]',
  Schießstand: 'bg-[linear-gradient(90deg,rgba(139,92,246,.12)_1px,transparent_1px),linear-gradient(180deg,#111827,#27272a_45%,#09090b)]',
  'Neon Arena': 'bg-[radial-gradient(circle_at_center,rgba(139,92,246,.24),transparent_38%),linear-gradient(135deg,#020617,#111827_55%,#4c1d95)]'
};

export function PreviewArena({ settings, title = 'Preview Arena', subtitle = 'Pixel Perfect SVG', size = 'editor', meta }: Props) {
  const [zoom, setZoom] = useState(1);
  const [background, setBackground] = useState<ArenaBackground>('Dark Grid');
  const arenaSize = size === 'dashboard' ? 'h-[500px] w-[500px]' : 'h-[430px] w-full';

  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-violet-300">{subtitle}</p>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select className="rounded-lg border border-white/[0.05] bg-zinc-950/80 px-3 py-2 text-sm" value={background} onChange={(event) => setBackground(event.target.value as ArenaBackground)}>
            {(Object.keys(backgrounds) as ArenaBackground[]).map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700" onClick={() => setZoom(Math.max(0.5, Number((zoom - 0.1).toFixed(1))))}>-</button>
          <button className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700" onClick={() => setZoom(Math.min(2, Number((zoom + 0.1).toFixed(1))))}>+</button>
          <span className="w-12 text-right text-sm text-zinc-500">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className={`preview-arena ${arenaSize} ${backgrounds[background]}`}>
        <div className="preview-grid" />
        <div className="preview-scanline" />
        <div className="preview-vignette" />
        <div className="preview-center-x" />
        <div className="preview-center-y" />
        <div className="preview-center-ring" />
        <div className="preview-light preview-light-left" />
        <div className="preview-light preview-light-right" />
        <div className="relative z-10 flex items-center justify-center">
          <CrosshairPreview settings={settings} zoom={zoom} />
        </div>
        <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-white/[0.05] bg-black/45 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
          {meta ?? `Size ${settings.size}px · Gap ${settings.gap}px · Line ${settings.thickness}px`}
        </div>
        <div className="absolute bottom-4 right-4 z-20 h-12 w-12 rounded border border-violet-300/70 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,.25)]" />
      </div>
    </section>
  );
}
