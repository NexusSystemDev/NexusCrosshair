import type { CrosshairSettings } from '../types';

export type CrosshairPreset = {
  id: string;
  name: string;
  category: 'FPS' | 'Sniper' | 'Dot' | 'Minimal' | 'Neon';
  crosshair: CrosshairSettings;
};

const base: CrosshairSettings = {
  type: 'cross',
  color: '#8b5cf6',
  size: 54,
  thickness: 3,
  length: 20,
  gap: 7,
  opacity: 0.95,
  outline: true,
  outlineColor: '#050509',
  outlineStrength: 2,
  shadow: true,
  shadowStrength: 2,
  glow: true,
  glowStrength: 6,
  rotation: 0,
  dotSize: 4,
  circleRadius: 18
};

export const crosshairPresets: CrosshairPreset[] = [
  { id: 'preset-fps-violet', name: 'Violet Control', category: 'FPS', crosshair: { ...base, type: 'cross', gap: 6, length: 22, thickness: 3 } },
  { id: 'preset-fps-ice', name: 'Ice Entry', category: 'FPS', crosshair: { ...base, type: 'plus', color: '#ffffff', glow: false, gap: 0, length: 17, thickness: 2 } },
  { id: 'preset-fps-green', name: 'Tactical Green', category: 'FPS', crosshair: { ...base, type: 'tactical', color: '#22c55e', circleRadius: 20, dotSize: 3 } },
  { id: 'preset-sniper-ring', name: 'Sniper Ring', category: 'Sniper', crosshair: { ...base, type: 'sniper', color: '#f8fafc', circleRadius: 26, length: 32, gap: 8, glowStrength: 4 } },
  { id: 'preset-sniper-amber', name: 'Amber Scope', category: 'Sniper', crosshair: { ...base, type: 'circle-dot', color: '#f59e0b', circleRadius: 24, dotSize: 3, thickness: 2 } },
  { id: 'preset-dot-violet', name: 'Violet Dot', category: 'Dot', crosshair: { ...base, type: 'dot', color: '#a78bfa', dotSize: 4, outlineStrength: 2, shadow: false } },
  { id: 'preset-dot-white', name: 'White Micro', category: 'Dot', crosshair: { ...base, type: 'dot', color: '#ffffff', dotSize: 2, glow: false, shadow: false } },
  { id: 'preset-minimal-gap', name: 'Minimal Gap', category: 'Minimal', crosshair: { ...base, type: 'cross', color: '#ffffff', gap: 10, length: 14, thickness: 2, glow: false } },
  { id: 'preset-minimal-x', name: 'Clean X', category: 'Minimal', crosshair: { ...base, type: 'x-shape', color: '#e4e4e7', gap: 5, length: 18, thickness: 2, glow: false } },
  { id: 'preset-neon-core', name: 'Neon Core', category: 'Neon', crosshair: { ...base, type: 'custom', color: '#8b5cf6', glowStrength: 12, opacity: 1, rotation: 0 } },
  { id: 'preset-neon-cyan', name: 'Cyan Pulse', category: 'Neon', crosshair: { ...base, type: 'circle-dot', color: '#22d3ee', outlineColor: '#020617', glowStrength: 10, circleRadius: 16 } },
  { id: 'preset-neon-rose', name: 'Rose Flick', category: 'Neon', crosshair: { ...base, type: 't-shape', color: '#fb7185', gap: 6, length: 24, glowStrength: 8 } }
];
