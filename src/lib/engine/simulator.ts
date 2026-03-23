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
 *   Eagle cut-in self-advance = 0.25 * (10000 / actorSpeed)
 *   Speed buff: only changes future turn spacing, not current pending AV
 *
 * AV ties: broken alphabetically by actorId (deterministic).
 */

import { TurnHeap } from './heap';
import type {
  TeamConfig,
  ActorState,
  PendingTurn,
  ResolvedTurn,
  ResolvedCutin,
  SimulationResult,
  ActionAssignment,
  SlotKey,
} from './types';
import { cycleLimitForMode } from './types';

const MAX_ITERATIONS = 500; // safety cap

function baseAvGap(speed: number): number {
  return 10000 / speed;
}

function makeCharacterSlotKey(actorId: string, occurrence: number): SlotKey {
  return `${actorId}:${occurrence}`;
}

function makeEnemySlotKey(actorId: string, occurrence: number): SlotKey {
  return `${actorId}:${occurrence}`;
}

function makeCutinSlotKey(actorId: string, hostSlotKey: SlotKey): SlotKey {
  return `cutin:${actorId}:${hostSlotKey}`;
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
  // Track per-actor pending AV (the AV at which their next turn occurs)
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

    // Determine slot key
    const slotKey =
      state.type === 'character'
        ? makeCharacterSlotKey(state.id, occurrence)
        : makeEnemySlotKey(state.id, occurrence);

    const assignedAction: ActionAssignment | null =
      config.assignedActions[slotKey] ?? null;

    // ── Process cut-ins on this slot (enemy turns only) ─────────────────────
    const cutins: ResolvedCutin[] = [];

    if (state.type === 'enemy') {
      // Scan for all cutin assignments targeting this enemy slot
      for (const member of config.members) {
        if (!member.characterId) continue;
        const cutinKey = makeCutinSlotKey(member.characterId, slotKey);
        const cutinAction = config.assignedActions[cutinKey];
        if (!cutinAction || cutinAction.type !== 'cutin_ult') continue;

        const cutinActor = actorStates.get(member.characterId);
        if (!cutinActor) continue;

        const hasEagle = member.relics.eagleSet;
        let eagleAdvanceAmount = 0;

        if (hasEagle) {
          // Eagle set: 25% self-advance after cut-in ult
          eagleAdvanceAmount = 0.25 * baseAvGap(cutinActor.speed);
          const currentPending = pendingAV.get(member.characterId) ?? av + baseAvGap(cutinActor.speed);
          const newAV = Math.max(currentPending - eagleAdvanceAmount, av + Number.EPSILON);
          pendingAV.set(member.characterId, newAV);

          // Invalidate old heap entry via lazy deletion
          const newGen = (generationMap.get(member.characterId) ?? 0) + 1;
          generationMap.set(member.characterId, newGen);
          cutinActor.generation = newGen;
          heap.push({ actorId: member.characterId, actorType: 'character', av: newAV, generation: newGen });
        }

        cutins.push({
          slotKey: cutinKey,
          actorId: member.characterId,
          actorName: member.characterId,
          eagleAdvanceApplied: hasEagle,
          eagleAdvanceAmount,
        });
      }
    }

    // ── Apply effects of the assigned action ────────────────────────────────
    if (assignedAction) {
      if (assignedAction.type === 'ally_advance') {
        // Advance a teammate forward in the queue
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
        // Speed buff: changes future turn spacing for the target
        const targetState = actorStates.get(assignedAction.targetId);
        if (targetState) {
          targetState.speed *= (1 + assignedAction.speedPctDelta / 100);
        }
      } else if (assignedAction.type === 'custom') {
        // Custom action: advance self + optional speed delta
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

    // ── Schedule next turn for this actor ───────────────────────────────────
    const nextAV = av + baseAvGap(state.speed);
    pendingAV.set(state.id, nextAV);
    heap.push({
      actorId: state.id,
      actorType: state.type,
      av: nextAV,
      generation: generationMap.get(state.id) ?? 0,
    });

    // ── Record the resolved turn ────────────────────────────────────────────
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
      cutins,
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
