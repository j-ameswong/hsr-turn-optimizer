// ─── Stored Config Types (source of truth) ───────────────────────────────────

export type CycleMode = 'moc' | 'aa';

export interface RelicConfig {
  eagleSet: boolean; // Pioneer Diver of Dead Waters 4pc: 25% advance on cut-in ult
  dddSet: boolean;   // Dance! Dance! Dance! 2pc: 15% advance to all allies on ult
}

export interface TeamMember {
  characterId: string;
  speed: number;
  relics: RelicConfig;
}

export interface EnemyConfig {
  id: string;
  name: string;
  speed: number;
}

export type ActionType = 'basic' | 'skill' | 'ult' | 'none';

export type ActionAssignment =
  | { type: 'basic' | 'skill' | 'ult' | 'none' }
  | { type: 'ally_advance'; targetId: string; advancePct: number }
  | { type: 'speed_buff'; targetId: string; speedPctDelta: number }
  | { type: 'cutin_ult'; actorId: string }
  | { type: 'custom'; advancePct: number; speedPctDelta: number; label: string };

/**
 * Deterministic key identifying a specific turn occurrence.
 * - Character turn:  "robin:3"           (Robin's 3rd turn)
 * - Enemy turn:      "enemy_0:2"         (first enemy's 2nd turn)
 * - Cut-in:          "cutin:robin:enemy_0:2" (Robin cuts in on enemy_0's 2nd turn)
 */
export type SlotKey = string;

export interface TeamConfig {
  cycleMode: CycleMode;
  members: TeamMember[];    // up to 4
  enemies: EnemyConfig[];
  assignedActions: Record<SlotKey, ActionAssignment>;
}

// ─── Engine-Internal Types (never stored in React state) ─────────────────────

export interface PendingTurn {
  actorId: string;
  actorType: 'character' | 'enemy';
  av: number;
  generation: number; // for lazy deletion — skip if stale
}

export interface ActorState {
  id: string;
  name: string;
  type: 'character' | 'enemy';
  speed: number;
  occurrence: number;    // how many turns this actor has taken
  generation: number;    // incremented when AV is updated to invalidate old heap entries
}

// ─── Simulation Output Types ──────────────────────────────────────────────────

export interface ResolvedCutin {
  slotKey: SlotKey;
  actorId: string;
  actorName: string;
  eagleAdvanceApplied: boolean;
  eagleAdvanceAmount: number; // AV reduction from Eagle set (for display)
}

export interface ResolvedTurn {
  slotKey: SlotKey;
  actorId: string;
  actorType: 'character' | 'enemy';
  actorName: string;
  av: number;
  occurrence: number;
  isWithinCycle: boolean; // av <= cycleLimit
  isCycleEdge: boolean;   // first turn beyond the cycle limit
  appliedAction: ActionAssignment | null;
  cutins: ResolvedCutin[];
}

export interface SimulationSummary {
  turnsPerActor: Record<string, number>; // actorId → turn count within cycle
  cycleLimit: number;
}

export interface SimulationResult {
  turns: ResolvedTurn[];
  summary: SimulationSummary;
}

// ─── Default Config ───────────────────────────────────────────────────────────

export function defaultTeamConfig(): TeamConfig {
  return {
    cycleMode: 'moc',
    members: [],
    enemies: [],
    assignedActions: {},
  };
}

export function cycleLimitForMode(mode: CycleMode): number {
  return mode === 'moc' ? 150 : 300;
}
