import type { CrosshairSettings } from '../types';

const prefix = 'NXP:';

export function encodeCrosshairCode(settings: CrosshairSettings) {
  const json = JSON.stringify(settings);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `${prefix}${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function decodeCrosshairCode(code: string): CrosshairSettings {
  const clean = code.trim();
  if (!clean.startsWith(prefix)) throw new Error('Invalid Nexus crosshair code.');
  const base64 = clean.slice(prefix.length).replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as CrosshairSettings;
}
