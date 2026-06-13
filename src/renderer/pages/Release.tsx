import { DownloadCloud, ExternalLink, FileText, RefreshCw, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppSettings, UpdaterStatus } from '../types';

type Props = {
  settings: AppSettings;
};

const releaseFeed = 'https://github.com/NexusSystemDev/NexusCrosshair/releases.atom';
const releasesPage = 'https://github.com/NexusSystemDev/NexusCrosshair/releases';

export function Release({ settings }: Props) {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = async () => setStatus(await window.nexusAPI.getUpdateStatus());

  useEffect(() => {
    refresh();
  }, []);

  const check = async () => {
    setChecking(true);
    setStatus(await window.nexusAPI.checkForUpdates());
    setChecking(false);
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_380px] gap-6">
      <div className="grid gap-5">
        <section className="glass-card rounded-3xl p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-300">Release Center</p>
              <h2 className="text-3xl font-black">Nexus Crosshair Pro</h2>
              <p className="mt-2 text-sm text-zinc-400">Updater, version status and packaged release readiness.</p>
            </div>
            <span className="rounded-full border border-violet-400/25 bg-violet-500/15 px-4 py-2 text-sm font-bold text-violet-100">{settings.updateChannel}</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              ['Current Version', status?.version ?? '0.0.4'],
              ['Update Status', status?.status ?? 'idle'],
              ['Online Checks', settings.onlineUpdatesEnabled ? 'Enabled' : 'Disabled']
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/[0.08] bg-[#171722] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                <p className="mt-3 text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <Rocket className="h-5 w-5 text-violet-300" />
            <div>
              <h3 className="text-xl font-black">Release History</h3>
              <p className="text-sm text-zinc-400">Built milestones for the public Windows release flow.</p>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ['0.0.4', 'Release dashboard, pixel perfect safety and UX polish.'],
              ['0.0.3', 'Updater feed stability, tray update actions and release polish.'],
              ['0.0.2', 'Premium UI pass, diagnostics and packaged app fixes.'],
              ['0.0.1', 'Initial Windows installer, portable build and GitHub release pipeline.']
            ].map(([version, detail]) => (
              <div key={version} className="flex items-center justify-between gap-4 rounded-3xl border border-white/[0.08] bg-[#101014]/90 p-4">
                <div>
                  <p className="font-black">Version {version}</p>
                  <p className="text-sm text-zinc-400">{detail}</p>
                </div>
                <FileText className="h-5 w-5 text-violet-300" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="glass-card rounded-3xl p-5">
        <div className="mb-5 flex items-center gap-3">
          <DownloadCloud className="h-5 w-5 text-violet-300" />
          <div>
            <h3 className="text-xl font-black">Updater</h3>
            <p className="text-sm text-zinc-400">GitHub Releases channel.</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-3xl border border-white/[0.08] bg-[#171722] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">{status?.status ?? 'idle'}</p>
            <p className="mt-2 text-sm text-zinc-300">{status?.detail ?? 'No status loaded yet.'}</p>
            {status?.releaseNotes && <p className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-zinc-500">{status.releaseNotes}</p>}
          </div>
          <button className="nexus-button nexus-button-primary" disabled={checking} onClick={check}><DownloadCloud className="h-4 w-4" />{checking ? 'Checking...' : 'Check Updates'}</button>
          <button className="nexus-button" disabled={status?.status !== 'available'} onClick={async () => setStatus(await window.nexusAPI.downloadUpdate())}>Download</button>
          <button className="nexus-button" disabled={status?.status !== 'downloaded'} onClick={async () => setStatus(await window.nexusAPI.installUpdate())}>Install</button>
          <button className="nexus-button" onClick={refresh}><RefreshCw className="h-4 w-4" />Refresh Status</button>
          <a className="nexus-button" href={releasesPage} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open Releases</a>
          <div className="rounded-3xl border border-white/[0.08] bg-[#07070A]/70 p-4 text-xs text-zinc-500">
            <p className="mb-2 font-bold uppercase tracking-[0.18em] text-zinc-400">Feed</p>
            <p className="break-all">{releaseFeed}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
