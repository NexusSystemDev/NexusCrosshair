import { Copy, Download, Flame, Heart, Search, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CrosshairPreview } from '../components/CrosshairPreview';
import { crosshairPresets, type CrosshairPreset } from '../data/presets';
import type { Profile } from '../types';

type Props = {
  profiles: Profile[];
  activeProfile: Profile;
  saveProfile: (profile: Profile) => void;
  activate: (id: string) => void;
  duplicate: (profile: Profile) => void;
  applyPreset?: (preset: CrosshairPreset) => void;
  exportProfile: (id: string) => void;
  importProfile: () => void;
};

export function Community({ profiles, activeProfile, saveProfile, activate, duplicate, applyPreset, exportProfile, importProfile }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('nexus-favorites') ?? '[]') as string[]);
  const libraryItems = useMemo(() => [
    ...crosshairPresets.map((preset) => ({ source: 'preset' as const, id: preset.id, name: preset.name, category: preset.category, crosshair: preset.crosshair, preset })),
    ...profiles.map((profile) => ({ source: 'profile' as const, id: profile.id, name: profile.name, category: profile.gameName || profile.crosshair.type, crosshair: profile.crosshair, profile }))
  ], [profiles]);
  const categories = ['All', 'Favorites', 'Competitive', 'Minimal', 'Sniper', ...Array.from(new Set(libraryItems.map((item) => item.category)))];
  const visible = useMemo(() => libraryItems.filter((item) => {
    const matchesQuery = `${item.name} ${item.category} ${item.crosshair.type}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'All'
      || (category === 'Favorites' ? favorites.includes(item.id) : item.category === category)
      || (category === 'Competitive' && ['FPS', 'Neon'].includes(item.category))
      || (category === 'Minimal' && ['Minimal', 'Dot'].includes(item.category))
      || (category === 'Sniper' && item.category === 'Sniper');
    return matchesQuery && matchesCategory;
  }), [libraryItems, query, category, favorites]);
  const featured = visible[0] ?? libraryItems[0];
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('nexus-favorites', JSON.stringify(next));
  };
  const saveCurrent = () => {
    const now = new Date().toISOString();
    saveProfile({ ...activeProfile, id: crypto.randomUUID(), name: `${activeProfile.name} Library`, createdAt: now, updatedAt: now });
  };

  return (
    <section className="grid gap-5">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-300">Crosshair Gallery</p>
            <h2 className="text-2xl font-black">Library</h2>
          </div>
          <div className="flex gap-3">
            <button className="nexus-button" onClick={importProfile}><Upload className="h-4 w-4" />Import</button>
            <button className="nexus-button nexus-button-primary" onClick={saveCurrent}>Save Current</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_220px] gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#07070A]/70 px-4 py-3">
            <Search className="h-4 w-4 text-zinc-500" />
            <input className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search library" />
          </label>
          <button className="nexus-button nexus-button-primary" onClick={() => setCategory('Favorites')}><Heart className="h-4 w-4" />Favorites</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button key={item} className={`rounded-2xl px-4 py-2 text-sm font-bold transition duration-[250ms] ${category === item ? 'bg-violet-600 text-white shadow-[0_0_24px_rgba(139,92,246,.35)]' : 'border border-white/[0.08] bg-[#171722] text-zinc-400 hover:bg-[#20202a]'}`} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {featured && (
        <section className="glass-card grid grid-cols-[360px_1fr] gap-6 rounded-3xl p-5">
          <div className="flex h-64 items-center justify-center rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.18),transparent_45%),#07070A]">
            <CrosshairPreview settings={featured.crosshair} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-2 text-violet-300">
              <Flame className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-[0.22em]">Featured Crosshair</span>
            </div>
            <h3 className="text-3xl font-black">{featured.name}</h3>
            <p className="mt-2 text-zinc-400">{featured.category} / {featured.crosshair.type} / {featured.source === 'preset' ? 'Built-in Preset' : 'Your Profile'}</p>
            <div className="mt-6 flex gap-3">
              <button className="nexus-button nexus-button-primary" onClick={() => featured.source === 'preset' ? applyPreset?.(featured.preset) : activate(featured.profile.id)}>Apply Featured</button>
              <button className="nexus-button" onClick={() => toggleFavorite(featured.id)}><Heart className="h-4 w-4" />Favorite</button>
            </div>
          </div>
        </section>
      )}

      {visible.length === 0 && (
        <div className="glass-card-soft rounded-3xl p-10 text-center">
          <p className="text-lg font-black">No crosshairs found</p>
          <p className="mt-2 text-sm text-zinc-400">Try another search term or category.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {visible.map((item) => (
          <article key={item.id} className="glass-card-soft group rounded-3xl p-4 transition duration-[250ms] hover:-translate-y-1 hover:border-violet-400/25 hover:shadow-[0_18px_60px_rgba(139,92,246,.16)]">
            <div className="mb-4 flex h-52 items-center justify-center rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_center,rgba(139,92,246,.13),transparent_42%),#07070A]">
              <CrosshairPreview settings={item.crosshair} compact />
            </div>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{item.name}</h3>
                <p className="text-sm text-zinc-400">{item.category} · {item.source === 'preset' ? 'Built-in Preset' : 'Profile'}</p>
              </div>
              <button className={`rounded-2xl p-2 ${favorites.includes(item.id) ? 'bg-violet-600 text-white' : 'bg-[#171722] text-zinc-400'}`} onClick={() => toggleFavorite(item.id)}>
                <Heart className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="nexus-button nexus-button-primary px-3" onClick={() => item.source === 'preset' ? applyPreset?.(item.preset) : activate(item.profile.id)}>Apply</button>
              <button className="nexus-button px-3" onClick={() => item.source === 'preset' ? applyPreset?.(item.preset) : duplicate(item.profile)}><Copy className="h-4 w-4" /></button>
              <button className="nexus-button px-3" onClick={() => item.source === 'profile' && exportProfile(item.profile.id)} disabled={item.source === 'preset'}><Download className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
