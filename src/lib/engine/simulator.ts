/**
 * Core AV simulation engine.
 *
 * simulateCycle(config) → SimulationResult
 *
 * This is a pure function. Given a TeamConfig it deterministically computes
 * the full turn order for the cycle. React state should never store the result —
 * always derive it via useMemo.
 *
 * Key formulas:
 *   Base AV between turns = 10000 / speed
 *   Ally advance reduction = advancePct * (10000 / targetCurrentSpeed)
 *   Eagle self-advance (out-of-turn only) = 0.25 * (10000 / actorSpeed)
 *   Speed buff: only changes future turn spacing, not current pending AV
 *
 * Turn windows:
 *   In-turn window  (character turns only): fires after main action, before next turn is
 *                   scheduled. Eagle does NOT apply. DDD advances others but not acting char.
 *   Out-of-turn window (all turns): fires after next turn is scheduled. Eagle DOES apply.
 *                   DDD advances everyone including the just-acted character.
 *
 * AV ties: broken alphabetically by actorId (deterministic).
 */

import { TurnHeap } from './heap';
import type {
  TeamConfig,
  ActorState,
  PendingTurn,
  ResolvedTurn,
  ResolvedWindowAction,
  SimulationResult,
  ActionAssignment,
  SlotKey,
} from './types';
import { cycleLimitForMode } from './types';

const MAX_ITERATIONS = 500; // safety cap

function baseAvGap(speed: number): number {
  return 10000 / speed;
}

function makeSlotKey(actorId: string, occurrence: number): SlotKey {
  return `${actorId}:${occurrence}`;
}

function makeInTurnSlotKey(actorId: string, hostSlotKey: SlotKey): SlotKey {
  return `inturn:${actorId}:${hostSlotKey}`;
}

function makeOutOfTurnSlotKey(actorId: string, hostSlotKey: SlotKey): SlotKey {
  return `outturn:${actorId}:${hostSlotKey}`;
}

/**
 * Process one action window (in-turn or out-of-turn) for a given host turn.
 *
 * Scans config.members in order (user-defined ordering is preserved via member list order).
 * Eagle only applies in the out-of-turn window.
 */
function processWindowActions(
  windowType: 'in-turn' | 'out-of-turn',
  hostSlotKey: SlotKey,
  hostAv: number,
  config: TeamConfig,
  actorStates: Map<string, ActorState>,
  pendingAV: Map<string, number>,
  generationMap: Map<string, number>,
  heap: TurnHeap,
): ResolvedWindowAction[] {
  const applyEagle = windowType === 'out-of-turn';
  const makeKey = windowType === 'in-turn' ? makeInTurnSlotKey : makeOutOfTurnSlotKey;
  const actions: ResolvedWindowAction[] = [];

  for (const member of config.members) {
    if (!member.characterId) continue;
    const windowKey = makeKey(member.characterId, hostSlotKey);
    const assignment = config.assignedActions[windowKey];
    if (!assignment || assignment.type !== 'window_ult') continue;

    const actor = actorStates.get(member.characterId);
    if (!actor) continue;

    let eagleAdvanceApplied = false;
    let eagleAdvanceAmount = 0;

    if (applyEagle && member.relics.eagleSet) {
      eagleAdvanceAmount = 0.25 * baseAvGap(actor.speed);
      const currentPending = pendingAV.get(member.characterId) ?? hostAv + baseAvGap(actor.speed);
      const newAV = Math.max(currentPending - eagleAdvanceAmount, hostAv + Number.EPSILON);
      pendingAV.set(member.characterId, newAV);

      const newGen = (generationMap.get(member.characterId) ?? 0) + 1;
      generationMap.set(member.characterId, newGen);
      actor.generation = newGen;
      heap.push({ actorId: member.characterId, actorType: 'character', av: newAV, generation: newGen });
      eagleAdvanceApplied = true;
    }

    actions.push({
      slotKey: windowKey,
      actorId: member.characterId,
      actorName: member.characterId,
      window: windowType,
      eagleAdvanceApplied,
      eagleAdvanceAmount,
    });
  }

  return actions;
}

export function simulateCycle(config: TeamConfig): SimulationResult {
  const cycleLimit = cycleLimitForMode(config.cycleMode);

  // ── Build actor states ──────────────────────────────────────────────────────
  const actorStates = new Map<string, ActorState>();
  const generationMap = new Map<string, number>(); // actorId → current generation

  for (const member of config.members) {
    if (!member.characterId || member.speed <= 0) continue;
    actorStates.set(member.characterId, {
      id: member.characterId,
      name: member.characterId, // name will be resolved by UI layer
      type: 'character',
      speed: member.speed,
      occurrence: 0,
      generation: 0,
    });
    generationMap.set(member.characterId, 0);
  }

  for (const enemy of config.enemies) {
    if (!enemy.id || enemy.speed <= 0) continue;
    actorStates.set(enemy.id, {
      id: enemy.id,
      name: enemy.name || enemy.id,
      type: 'enemy',
      speed: enemy.speed,
      occurrence: 0,
      generation: 0,
    });
    generationMap.set(enemy.id, 0);
  }

  if (actorStates.size === 0) {
    return { turns: [], summary: { turnsPerActor: {}, cycleLimit } };
  }

  // ── Seed the heap ───────────────────────────────────────────────────────────
  const pendingAV = new Map<string, number>();
  const heap = new TurnHeap();

  for (const [id, state] of actorStates) {
    const av = baseAvGap(state.speed);
    pendingAV.set(id, av);
    heap.push({ actorId: id, actorType: state.type, av, generation: 0 });
  }

  // ── Simulation loop ─────────────────────────────────────────────────────────
  const resolvedTurns: ResolvedTurn[] = [];
  let sentinelRecorded = false;
  let iterations = 0;

  while (!sentinelRecorded && iterations < MAX_ITERATIONS) {
    iterations++;

    const pending = heap.pop(generationMap);
    if (!pending) break;

    const state = actorStates.get(pending.actorId);
    if (!state) continue;

    state.occurrence++;
    const occurrence = state.occurrence;
    const av = pending.av;

    const isWithinCycle = av <= cycleLimit;
    const isCycleEdge = !isWithinCycle;

    const slotKey = makeSlotKey(state.id, occurrence);
    const assignedAction: ActionAssignment | null = config.assignedActions[slotKey] ?? null;

    // ── 1. Apply main action effects ─────────────────────────────────────────
    if (assignedAction) {
      if (assignedAction.type === 'ally_advance') {
        const targetState = actorStates.get(assignedAction.targetId);
        if (targetState) {
          const reduction = assignedAction.advancePct * baseAvGap(targetState.speed);
          const currentPending = pendingAV.get(assignedAction.targetId) ?? av + baseAvGap(targetState.speed);
          const newAV = Math.max(currentPending - reduction, av + Number.EPSILON);
          pendingAV.set(assignedAction.targetId, newAV);

          const newGen = (generationMap.get(assignedAction.targetId) ?? 0) + 1;
          generationMap.set(assignedAction.targetId, newGen);
          targetState.generation = newGen;
          heap.push({ actorId: assignedAction.targetId, actorType: targetState.type, av: newAV, generation: newGen });
        }
      } else if (assignedAction.type === 'speed_buff') {
        const targetState = actorStates.get(assignedAction.targetId);
        if (targetState) {
          targetState.speed *= (1 + assignedAction.speedPctDelta / 100);
        }
      } else if (assignedAction.type === 'custom') {
        if (assignedAction.advancePct > 0) {
          const reduction = assignedAction.advancePct * baseAvGap(state.speed);
          const currentPending = pendingAV.get(state.id) ?? av + baseAvGap(state.speed);
          const newAV = Math.max(currentPending - reduction, av + Number.EPSILON);
          pendingAV.set(state.id, newAV);

          const newGen = (generationMap.get(state.id) ?? 0) + 1;
          generationMap.set(state.id, newGen);
          state.generation = newGen;
          heap.push({ actorId: state.id, actorType: state.type, av: newAV, generation: newGen });
        }
        if (assignedAction.speedPctDelta !== 0) {
          state.speed *= (1 + assignedAction.speedPctDelta / 100);
        }
      }
    }

    // ── 2. In-turn window (character turns only) ─────────────────────────────
    // Fires after main action, before next turn is scheduled.
    // Eagle does NOT apply here.
    const inTurnActions: ResolvedWindowAction[] =
      state.type === 'character'
        ? processWindowActions('in-turn', slotKey, av, config, actorStates, pendingAV, generationMap, heap)
        : [];

    // ── 3. Schedule next turn for this actor ─────────────────────────────────
    const nextAV = av + baseAvGap(state.speed);
    pendingAV.set(state.id, nextAV);
    heap.push({
      actorId: state.id,
      actorType: state.type,
      av: nextAV,
      generation: generationMap.get(state.id) ?? 0,
    });

    // ── 4. Out-of-turn window (all turns) ────────────────────────────────────
    // Fires after next turn is scheduled, so Eagle advances affect the real pending AV.
    const outOfTurnActions = processWindowActions(
      'out-of-turn', slotKey, av, config, actorStates, pendingAV, generationMap, heap,
    );

    // ── 5. Record the resolved turn ──────────────────────────────────────────
    resolvedTurns.push({
      slotKey,
      actorId: state.id,
      actorType: state.type,
      actorName: state.name,
      av,
      occurrence,
      isWithinCycle,
      isCycleEdge,
      appliedAction: assignedAction,
      inTurnActions,
      outOfTurnActions,
    });

    if (isCycleEdge) {
      sentinelRecorded = true;
    }
  }

  // ── Build summary ───────────────────────────────────────────────────────────
  const turnsPerActor: Record<string, number> = {};
  for (const turn of resolvedTurns) {
    if (turn.isWithinCycle) {
      turnsPerActor[turn.actorId] = (turnsPerActor[turn.actorId] ?? 0) + 1;
    }
  }

  return {
    turns: resolvedTurns,
    summary: { turnsPerActor, cycleLimit },
  };
}
