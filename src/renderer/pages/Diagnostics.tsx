import { Download, Monitor, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DiagnosticInfo } from '../types';

export function Diagnostics({ notify }: { notify: (title: string, detail?: string, tone?: 'info' | 'success' | 'danger') => void }) {
  const [data, setData] = useState<DiagnosticInfo | null>(null);
  const refresh = () => window.nexusAPI.getDiagnostics().then(setData);

  useEffect(() => {
    refresh();
  }, []);

  const exportReport = async () => {
    const path = await window.nexusAPI.exportDiagnostics();
    notify(path ? 'Diagnostics exported' : 'Export cancelled', path ?? undefined, path ? 'success' : 'info');
  };

  if (!data) return <section className="glass-card rounded-3xl p-5">Loading diagnostics...</section>;

  const rows = [
    ['App Version', data.appVersion],
    ['User Data', data.userDataPath],
    ['App Path', data.appPath],
    ['Overlay Visible', data.overlayVisible ? 'Yes' : 'No'],
    ['Active Display ID', String(data.activeDisplayId ?? 'None')],
    ['Overlay Bounds', data.overlayBounds ? `${data.overlayBounds.x}, ${data.overlayBounds.y}, ${data.overlayBounds.width}x${data.overlayBounds.height}` : 'None'],
    ['Overlay Offset', `${data.settings.overlayOffsetX}px / ${data.settings.overlayOffsetY}px`],
    ['Overlay Display Mode', data.settings.overlayDisplayId]
  ];

  return (
    <section className="grid gap-5">
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-violet-300">Support Data</p>
            <h2 className="text-2xl font-black">Diagnostics</h2>
          </div>
          <div className="flex gap-3">
            <button className="nexus-button" onClick={refresh}><RefreshCw className="h-4 w-4" />Refresh</button>
            <button className="nexus-button nexus-button-primary" onClick={exportReport}><Download className="h-4 w-4" />Export</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <section className="glass-card-soft rounded-3xl p-5">
          <h3 className="mb-4 text-lg font-black">Runtime</h3>
          <div className="grid gap-3">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#171722] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                <p className="mt-1 break-all font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="glass-card-soft rounded-3xl p-5">
          <h3 className="mb-4 text-lg font-black">Displays</h3>
          <div className="grid gap-3">
            {data.displays.map((display) => (
              <div key={display.id} className="rounded-2xl bg-[#171722] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-violet-300" />
                  <p className="font-black">{display.label}</p>
                </div>
                <p className="text-sm text-zinc-400">ID {display.id} · Bounds {display.bounds.x}, {display.bounds.y}, {display.bounds.width}x{display.bounds.height}</p>
                {display.primary && <p className="mt-2 text-sm font-semibold text-emerald-300">Primary Display</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
