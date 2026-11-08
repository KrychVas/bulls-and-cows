import { BASE_OPTIONS } from './settings.js';
import type { GameSettings } from './types.js';

export const formatDuration = (milliseconds: number): string => {
  const safeMilliseconds = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
  const totalSeconds = Math.floor(safeMilliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatBase = (base: number): string =>
  BASE_OPTIONS.find((option) => option.base === base)?.code ?? `BASE ${base}`;

export const formatSettings = (settings: GameSettings): string =>
  `${settings.length} digits · ${formatBase(settings.base)}`;
