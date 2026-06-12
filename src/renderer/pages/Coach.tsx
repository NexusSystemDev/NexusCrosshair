import { Brain, Check, Crosshair, ShieldCheck, Sparkles } from 'lucide-react';
import { CrosshairPreview } from '../components/CrosshairPreview';
import type { CrosshairSettings, Profile } from '../types';

type Props = {
  profile: Profile;
  draft: CrosshairSettings;
  setDraft: (settings: CrosshairSettings) => void;
  setPage: (page: string) => void;
};

type Recommendation = {
  title: string;
  detail: string;
  action: string;
  apply: (settings: CrosshairSettings) => CrosshairSettings;
};

function recommendations(settings: CrosshairSettings): Recommendation[] {
  const items: Recommendation[] = [];
  if (settings.size % 2 !== 0 || settings.thickness % 1 !== 0) {
    items.push({
      title: 'Pixel Perfect Fix',
      detail: 'Even dimensions reduce half-pixel rendering risk on high-DPI displays.',
      action: 'Fix Geometry',
      apply: (draft) => ({ ...draft, size: Math.round(draft.size / 2) * 2, thickness: Math.max(1, Math.round(draft.thickness)) })
    });
  }
  if (settings.gap > 12) {
    items.push({
      title: 'Close Combat Gap',
      detail: 'Your gap is wide. Fortnite and tracking fights usually feel cleaner with a tighter center.',
      action: 'Tighten Gap',
      apply: (draft) => ({ ...draft, gap: 7, length: Math.max(draft.length, 18) })
    });
  }
  if (settings.opacity < 0.8) {
    items.push({
      title: 'Visibility Boost',
      detail: 'Opacity below 80% can disappear on bright map areas.',
      action: 'Boost Opacity',
      apply: (draft) => ({ ...draft, opacity: 0.95, outline: true, outlineStrength: Math.max(draft.outlineStrength, 2) })
    });
  }
  if (!settings.outline && ['#ffffff', '#f8fafc', '#e4e4e7'].includes(settings.color.toLowerCase())) {
    items.push({
      title: 'White Crosshair Safety',
      detail: 'White crosshairs need outline protection on sky, concrete and bright builds.',
      action: 'Add Outline',
      apply: (draft) => ({ ...draft, outline: true, outlineColor: '#050509', outlineStrength: 2 })
    });
  }
  if (settings.glowStrength > 10) {
    items.push({
      title: 'Competitive Glow Control',
      detail: 'Strong glow looks premium, but can blur perceived edges in fast fights.',
      action: 'Reduce Glow',
      apply: (draft) => ({ ...draft, glowStrength: 7 })
    });
  }
  return items.length ? items : [{
    title: 'Pro Balanced',
    detail: 'This setup is already clean: readable center, strong contrast and stable geometry.',
    action: 'Keep Current',
    apply: (draft) => draft
  }];
}

export function Coach({ profile, draft, setDraft, setPage }: Props) {
  const items = recommendations(draft);
  const score = Math.max(62, 100 - items.filter((item) => item.action !== 'Keep Current').length * 9);

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="grid gap-5">
        <section className="glass-card rounded-3xl p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300"><Brain className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-300">Smart Crosshair Coach</p>
              <h2 className="text-3xl font-black">{profile.name}</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/[0.08] bg-[#171722] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Coach Score</p>
              <p className="mt-2 text-4xl font-black text-violet-200">{score}</p>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-[#171722] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Type</p>
              <p className="mt-2 text-xl font-black">{draft.type}</p>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-[#171722] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Mode</p>
              <p className="mt-2 text-xl font-black">Competitive</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          {items.map((item) => (
            <article key={item.title} className="glass-card-soft rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{item.detail}</p>
                </div>
                <button className="nexus-button nexus-button-primary shrink-0" onClick={() => setDraft(item.apply(draft))}><Check className="h-4 w-4" />{item.action}</button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <aside className="glass-card rounded-3xl p-5">
        <div className="mb-5 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-violet-300" />
          <h3 className="text-lg font-black">Live Result</h3>
        </div>
        <div className="mb-5 flex h-72 items-center justify-center rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(139,92,246,.16),transparent_42%),#07070A]">
          <CrosshairPreview settings={draft} />
        </div>
        <button className="nexus-button w-full" onClick={() => setPage('editor')}><Sparkles className="h-4 w-4" />Fine Tune in Editor</button>
      </aside>
    </section>
  );
}
