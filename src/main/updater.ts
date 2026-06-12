import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { UpdaterStatus } from '../renderer/types';
import { getSettings } from './storage';

let lastStatus: UpdaterStatus = {
  status: 'idle',
  detail: 'Updater is ready. Configure a release feed before checking online.'
};

const updatesEnabled = () => getSettings().onlineUpdatesEnabled;

const friendlyUpdateError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Update check failed.';
  if (message.includes('404') || message.includes('releases.atom')) {
    return 'No public GitHub release feed is available yet. Publish the repository/releases or enable your own update server before checking online.';
  }
  if (message.includes('ENOTFOUND') || message.includes('updates.nexustools.local')) {
    return 'The configured update server is not reachable yet. Upload release files or configure a real update URL.';
  }
  return message;
};

autoUpdater.on('download-progress', (progress) => {
  lastStatus = {
    ...lastStatus,
    status: 'downloading',
    detail: `Downloading update ${Math.round(progress.percent)}%...`,
    percent: Math.round(progress.percent)
  };
});

autoUpdater.on('update-downloaded', (info) => {
  lastStatus = {
    ...lastStatus,
    status: 'downloaded',
    detail: `Version ${info.version} is ready to install.`,
    version: info.version,
    percent: 100
  };
});

export function prepareAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
}

export async function downloadUpdateNow(): Promise<UpdaterStatus> {
  if (!app.isPackaged) {
    return { status: 'development', detail: 'Update downloads are only active in packaged builds.' };
  }
  if (!updatesEnabled()) {
    return { status: 'current', detail: 'Update downloads are disabled until a release feed is configured.' };
  }
  try {
    lastStatus = { ...lastStatus, status: 'downloading', detail: 'Starting update download...', percent: 0 };
    await autoUpdater.downloadUpdate();
    return lastStatus;
  } catch (error) {
    lastStatus = {
      status: 'error',
      detail: friendlyUpdateError(error)
    };
    return lastStatus;
  }
}

export function installUpdateNow(): UpdaterStatus {
  if (!app.isPackaged) {
    return { status: 'development', detail: 'Update install is only active in packaged builds.' };
  }
  if (!updatesEnabled()) {
    return { status: 'current', detail: 'Update install is disabled until a release feed is configured.' };
  }
  lastStatus = { ...lastStatus, status: 'installing', detail: 'Installing update and restarting...' };
  autoUpdater.quitAndInstall(false, true);
  return lastStatus;
}

export async function checkForUpdatesNow(): Promise<UpdaterStatus> {
  if (!app.isPackaged) {
    lastStatus = {
      status: 'development',
      detail: 'Updater is only active in the packaged desktop app.'
    };
    return lastStatus;
  }
  if (!updatesEnabled()) {
    lastStatus = {
      status: 'current',
      detail: 'Online update checks are disabled until GitHub Releases or a generic update server is configured.',
      channel: getSettings().updateChannel,
      version: app.getVersion()
    };
    return lastStatus;
  }

  try {
    const channel = getSettings().updateChannel;
    autoUpdater.channel = channel;
    lastStatus = { status: 'checking', detail: `Checking ${channel} channel...`, channel };
    const result = await autoUpdater.checkForUpdates();
    const version = result?.updateInfo?.version;
    const notes = typeof result?.updateInfo?.releaseNotes === 'string' ? result.updateInfo.releaseNotes : undefined;
    lastStatus = version && version !== app.getVersion()
      ? { status: 'available', detail: `Version ${version} is available.`, version, channel, releaseNotes: notes }
      : { status: 'current', detail: `Nexus Crosshair Pro ${app.getVersion()} is up to date.`, version: app.getVersion(), channel };
    return lastStatus;
  } catch (error) {
    lastStatus = {
      status: 'error',
      detail: friendlyUpdateError(error)
    };
    return lastStatus;
  }
}
