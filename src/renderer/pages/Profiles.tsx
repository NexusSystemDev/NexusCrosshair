import { Copy, Download, Play, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CrosshairPreview } from '../components/CrosshairPreview';
import type { Profile } from '../types';

type Props = {
  profiles: Profile[];
  activeProfileId: string | null;
  activate: (id: string) => void;
  save: (profile: Profile) => void;
  remove: (id: string) => void;
  duplicate: (profile: Profile) => void;
  exportProfile: (id: string) => void;
  importProfile: () => void;
};

export function Profiles({ profiles, activeProfileId, activate, save, remove, duplicate, exportProfile, importProfile }: Props) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => profiles
    .filter((profile) => `${profile.name} ${profile.gameName} ${profile.gameProcess ?? ''} ${profile.crosshair.type} ${(profile.tags ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite))), [profiles, query]);
  const create = () => {
    const now = new Date().toISOString();
    const base = profiles[0];
    save({ id: crypto.randomUUID(), name: 'New Profile', gameName: '', gameProcess: '', tags: [], favorite: false, lastUsedAt: now, crosshair: base.crosshair, hotkey: 'F6', createdAt: now, updatedAt: now });
  };

  return (
    <section className="grid gap-5">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-300">Profile Manager</p>
            <h2 className="text-2xl font-black">Profiles</h2>
          </div>
          <div className="flex gap-3">
            <button className="nexus-button" onClick={importProfile}>Import</button>
            <button className="nexus-button nexus-button-primary" onClick={create}><Plus className="h-4 w-4" />Create</button>
          </div>
        </div>
        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#07070A]/70 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input className="w-full bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search profiles" />
        </label>
      </div>

      {visible.length === 0 && (
        <div className="glass-card-soft rounded-3xl p-8 text-center">
          <p className="text-lg font-black">No profiles found</p>
          <p className="mt-2 text-sm text-zinc-400">Create a new profile or clear the search filter.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {visible.map((profile) => (
          <article key={profile.id} className="glass-card-soft rounded-3xl p-5">
            <div className="flex gap-4">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl border border-white/[0.08] bg-[#07070A]">
                <CrosshairPreview settings={profile.crosshair} compact />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <input className="nexus-input w-full text-lg font-black" value={profile.name} onChange={(event) => save({ ...profile, name: event.target.value })} />
                    <input className="nexus-input mt-2 w-full text-sm" value={profile.gameName} onChange={(event) => save({ ...profile, gameName: event.target.value })} aria-label="Bind game" />
                    <input className="nexus-input mt-2 w-full text-sm" value={profile.gameProcess ?? ''} onChange={(event) => save({ ...profile, gameProcess: event.target.value })} aria-label="Bind executable" placeholder="Game / EXE rule" />
                  </div>
                  <div className="grid gap-2 justify-items-end">
                    <button className={`rounded-2xl border border-white/[0.08] p-2 transition ${profile.favorite ? 'bg-violet-500/20 text-violet-200' : 'bg-[#171722] text-zinc-500'}`} onClick={() => save({ ...profile, favorite: !profile.favorite })}><Star className="h-4 w-4" /></button>
                    {profile.id === activeProfileId && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">ACTIVE</span>}
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">{profile.crosshair.type}</span>
                  <span className="rounded-full bg-[#171722] px-3 py-1 text-xs text-zinc-400">{profile.hotkey}</span>
                  {(profile.tags ?? []).map((tag) => <span key={tag} className="rounded-full bg-[#171722] px-3 py-1 text-xs text-zinc-400">{tag}</span>)}
                </div>
                <input className="nexus-input mb-3 w-full text-xs" value={(profile.tags ?? []).join(', ')} onChange={(event) => save({ ...profile, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags: ranked, dot, sniper" />
                <p className="mb-3 text-xs text-zinc-500">Last used: {profile.lastUsedAt ? new Date(profile.lastUsedAt).toLocaleString() : '-'}</p>
                <div className="grid grid-cols-5 gap-2">
                  <button className="nexus-button nexus-button-primary px-3" onClick={() => activate(profile.id)}><Play className="h-4 w-4" /></button>
                  <button className="nexus-button px-3" onClick={() => duplicate(profile)}><Copy className="h-4 w-4" /></button>
                  <button className="nexus-button px-3" onClick={() => exportProfile(profile.id)}><Download className="h-4 w-4" /></button>
                  <button className="nexus-button px-3" onClick={() => save(profile)}>Edit</button>
                  <button className="nexus-button px-3 text-red-200" onClick={() => window.confirm(`Delete profile "${profile.name}"?`) && remove(profile.id)} disabled={profiles.length < 2}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
