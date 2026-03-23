import type { TeamConfig } from '../engine/types';
import { defaultTeamConfig } from '../engine/types';

const STORAGE_KEY = 'hsr-optimizer-v1';
const PRESETS_KEY = 'hsr-optimizer-presets-v1';

export interface TeamPreset {
  id: string;
  name: string;
  createdAt: number;
  config: TeamConfig;
}

// ── Active config ─────────────────────────────────────────────────────────────

export function loadConfig(): TeamConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTeamConfig();
    const parsed = JSON.parse(raw) as TeamConfig;
    // Basic sanity check
    if (!parsed.cycleMode || !Array.isArray(parsed.members)) return defaultTeamConfig();
    return parsed;
  } catch {
    return defaultTeamConfig();
  }
}

export function saveConfig(config: TeamConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — fail silently
  }
}

// ── Presets ───────────────────────────────────────────────────────────────────

export function loadPresets(): TeamPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TeamPreset[];
  } catch {
    return [];
  }
}

export function savePresets(presets: TeamPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // fail silently
  }
}
