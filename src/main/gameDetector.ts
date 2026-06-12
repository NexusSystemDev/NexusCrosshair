import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const games: Record<string, string> = {
  'FiveM.exe': 'FiveM',
  'GTA5.exe': 'GTA V',
  'cs2.exe': 'Counter-Strike 2',
  'RustClient.exe': 'Rust',
  'r5apex.exe': 'Apex Legends',
  'TslGame.exe': 'PUBG',
  'VALORANT-Win64-Shipping.exe': 'VALORANT',
  'FortniteClient-Win64-Shipping.exe': 'Fortnite',
  'FortniteClient-Win64-Shipping_EAC.exe': 'Fortnite',
  'FortniteClient-Win64-Shipping_EAC_EOS.exe': 'Fortnite',
  'FortniteClient-Win64-Shipping_BE.exe': 'Fortnite',
  'FortniteLauncher.exe': 'Fortnite',
  'FortniteBootstrapper.exe': 'Fortnite'
};

const titleAliases: Record<string, string> = {
  fortnite: 'Fortnite',
  valorant: 'VALORANT',
  'counter-strike': 'Counter-Strike 2',
  apex: 'Apex Legends',
  rust: 'Rust',
  pubg: 'PUBG',
  fivem: 'FiveM'
};

export async function detectActiveGame() {
  const detected = await detectGames();
  return detected[0] ?? null;
}

export async function detectGames() {
  if (process.platform !== 'win32') return [];
  try {
    const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH']);
    const lower = stdout.toLowerCase();
    const processMatches = Object.entries(games)
      .filter(([processName]) => lower.includes(processName.toLowerCase()))
      .map(([, gameName]) => gameName);
    const titleMatches = await detectWindowTitles();
    return [...new Set([...processMatches, ...titleMatches])];
  } catch {
    return [];
  }
}

async function detectWindowTitles() {
  try {
    const { stdout } = await execFileAsync('powershell.exe', [
      '-NoProfile',
      '-Command',
      "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object -ExpandProperty MainWindowTitle"
    ]);
    const lower = stdout.toLowerCase();
    return Object.entries(titleAliases)
      .filter(([needle]) => lower.includes(needle))
      .map(([, gameName]) => gameName);
  } catch {
    return [];
  }
}
