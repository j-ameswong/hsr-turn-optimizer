import { useState, useCallback, useEffect } from 'react';
import type { TeamConfig, TeamMember, EnemyConfig, ActionAssignment, SlotKey, CycleMode } from '../lib/engine/types';
import { loadConfig, saveConfig } from '../lib/persistence/localStorage';
import { loadInitialConfig } from '../lib/persistence/urlEncoding';

const MAX_MEMBERS = 4;

export function useTeamConfig() {
  const [config, setConfig] = useState<TeamConfig>(() =>
    loadInitialConfig(loadConfig()),
  );

  // Persist to localStorage on every change
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // ── Cycle mode ──────────────────────────────────────────────────────────────
  const setCycleMode = useCallback((mode: CycleMode) => {
    setConfig((c) => ({ ...c, cycleMode: mode }));
  }, []);

  // ── Members ─────────────────────────────────────────────────────────────────
  const addMember = useCallback((characterId: string, baseSpeed: number) => {
    setConfig((c) => {
      if (c.members.length >= MAX_MEMBERS) return c;
      if (c.members.some((m) => m.characterId === characterId)) return c;
      const newMember: TeamMember = {
        characterId,
        speed: baseSpeed,
        relics: { eagleSet: false, dddSuperimposition: 0, vonwacq: false },
      };
      return { ...c, members: [...c.members, newMember] };
    });
  }, []);

  const removeMember = useCallback((characterId: string) => {
    setConfig((c) => {
      // Also clear any assigned actions for this character
      const newActions = { ...c.assignedActions };
      for (const key of Object.keys(newActions)) {
        if (key.startsWith(`${characterId}:`) || key.includes(`:${characterId}:`)) {
          delete newActions[key];
        }
      }
      return {
        ...c,
        members: c.members.filter((m) => m.characterId !== characterId),
        assignedActions: newActions,
      };
    });
  }, []);

  const updateMemberSpeed = useCallback((characterId: string, speed: number) => {
    setConfig((c) => ({
      ...c,
      members: c.members.map((m) =>
        m.characterId === characterId ? { ...m, speed } : m,
      ),
    }));
  }, []);

  const toggleEagleSet = useCallback((characterId: string, enabled: boolean) => {
    setConfig((c) => ({
      ...c,
      members: c.members.map((m) =>
        m.characterId === characterId
          ? { ...m, relics: { ...m.relics, eagleSet: enabled } }
          : m,
      ),
    }));
  }, []);

  const setDDDSuperimposition = useCallback((characterId: string, level: number) => {
    setConfig((c) => ({
      ...c,
      members: c.members.map((m) =>
        m.characterId === characterId
          ? { ...m, relics: { ...m.relics, dddSuperimposition: level } }
          : m,
      ),
    }));
  }, []);

  const toggleVonwacq = useCallback((characterId: string, enabled: boolean) => {
    setConfig((c) => ({
      ...c,
      members: c.members.map((m) =>
        m.characterId === characterId
          ? { ...m, relics: { ...m.relics, vonwacq: enabled } }
          : m,
      ),
    }));
  }, []);

  // ── Enemies ──────────────────────────────────────────────────────────────────
  const addEnemy = useCallback((enemy: EnemyConfig) => {
    setConfig((c) => ({ ...c, enemies: [...c.enemies, enemy] }));
  }, []);

  const removeEnemy = useCallback((id: string) => {
    setConfig((c) => {
      const newActions = { ...c.assignedActions };
      for (const key of Object.keys(newActions)) {
        if (key.startsWith(`${id}:`) || key.includes(`:${id}:`)) {
          delete newActions[key];
        }
      }
      return {
        ...c,
        enemies: c.enemies.filter((e) => e.id !== id),
        assignedActions: newActions,
      };
    });
  }, []);

  const updateEnemy = useCallback((id: string, patch: Partial<EnemyConfig>) => {
    setConfig((c) => ({
      ...c,
      enemies: c.enemies.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const assignAction = useCallback((slotKey: SlotKey, action: ActionAssignment | null) => {
    setConfig((c) => {
      const newActions = { ...c.assignedActions };
      if (action === null || action.type === 'none') {
        delete newActions[slotKey];
      } else {
        newActions[slotKey] = action;
      }
      return { ...c, assignedActions: newActions };
    });
  }, []);

  const clearAllActions = useCallback(() => {
    setConfig((c) => ({ ...c, assignedActions: {} }));
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetConfig = useCallback(() => {
    setConfig({ cycleMode: 'moc', members: [], enemies: [], assignedActions: {} });
  }, []);

  const loadConfig_ = useCallback((newConfig: TeamConfig) => {
    setConfig(newConfig);
  }, []);

  return {
    config,
    // Cycle
    setCycleMode,
    // Members
    addMember,
    removeMember,
    updateMemberSpeed,
    toggleEagleSet,
    setDDDSuperimposition,
    toggleVonwacq,
    // Enemies
    addEnemy,
    removeEnemy,
    updateEnemy,
    // Actions
    assignAction,
    clearAllActions,
    // Misc
    resetConfig,
    loadConfig: loadConfig_,
  };
}

export type TeamConfigAPI = ReturnType<typeof useTeamConfig>;
