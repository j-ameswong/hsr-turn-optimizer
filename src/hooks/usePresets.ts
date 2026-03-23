import { useState, useCallback } from 'react';
import type { TeamPreset } from '../lib/persistence/localStorage';
import { loadPresets, savePresets } from '../lib/persistence/localStorage';
import type { TeamConfig } from '../lib/engine/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function usePresets() {
  const [presets, setPresets] = useState<TeamPreset[]>(() => loadPresets());

  const persist = useCallback((next: TeamPreset[]) => {
    setPresets(next);
    savePresets(next);
  }, []);

  const savePreset = useCallback(
    (name: string, config: TeamConfig) => {
      const preset: TeamPreset = {
        id: generateId(),
        name: name.trim() || 'Unnamed preset',
        createdAt: Date.now(),
        config,
      };
      persist([preset, ...presets]);
      return preset;
    },
    [presets, persist],
  );

  const deletePreset = useCallback(
    (id: string) => {
      persist(presets.filter((p) => p.id !== id));
    },
    [presets, persist],
  );

  const renamePreset = useCallback(
    (id: string, name: string) => {
      persist(presets.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [presets, persist],
  );

  return { presets, savePreset, deletePreset, renamePreset };
}
