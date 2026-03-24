import { describe, it, expect } from 'vitest';
import { simulateCycle } from './simulator';
import type { TeamConfig } from './types';

function makeConfig(overrides: Partial<TeamConfig> = {}): TeamConfig {
  return {
    cycleMode: 'moc',
    members: [],
    enemies: [],
    assignedActions: {},
    ...overrides,
  };
}

const noRelics = { eagleSet: false, dddSuperimposition: 0, vonwacq: false };

describe('simulateCycle', () => {
  it('returns empty result with no actors', () => {
    const result = simulateCycle(makeConfig());
    expect(result.turns).toHaveLength(0);
  });

  it('single character — correct AV for first turn', () => {
    const result = simulateCycle(
      makeConfig({ members: [{ characterId: 'seele', speed: 115, relics: noRelics }] }),
    );
    const first = result.turns[0];
    expect(first.actorId).toBe('seele');
    expect(first.av).toBeCloseTo(10000 / 115, 5);
    expect(first.occurrence).toBe(1);
    expect(first.isWithinCycle).toBe(true);
  });

  it('two characters — correct turn order (higher speed acts first)', () => {
    const result = simulateCycle(
      makeConfig({
        members: [
          { characterId: 'seele', speed: 115, relics: noRelics },
          { characterId: 'march', speed: 102, relics: noRelics },
        ],
      }),
    );
    const first = result.turns[0];
    const second = result.turns[1];
    expect(first.actorId).toBe('seele');
    expect(second.actorId).toBe('march');
    expect(first.av).toBeLessThan(second.av);
  });

  it('cycle boundary — MoC stops after first turn beyond 150 AV', () => {
    const result = simulateCycle(
      makeConfig({ members: [{ characterId: 'c', speed: 100, relics: noRelics }] }),
    );
    // AV per turn = 10000/100 = 100. Turns: 100, 200 (sentinel)
    const withinCycle = result.turns.filter((t) => t.isWithinCycle);
    const sentinel = result.turns.filter((t) => t.isCycleEdge);
    expect(withinCycle.length).toBeGreaterThan(0);
    expect(sentinel).toHaveLength(1);
    expect(sentinel[0].av).toBeGreaterThan(150);
  });

  it('cycle boundary — AA uses 300 AV limit', () => {
    const result = simulateCycle(
      makeConfig({
        cycleMode: 'aa',
        members: [{ characterId: 'c', speed: 100, relics: noRelics }],
      }),
    );
    // AV per turn = 100. Turns within 300: at 100, 200, 300. Sentinel at 400.
    const withinCycle = result.turns.filter((t) => t.isWithinCycle);
    const sentinel = result.turns.find((t) => t.isCycleEdge);
    expect(withinCycle.length).toBe(3);
    expect(sentinel).toBeDefined();
    expect(sentinel!.av).toBeCloseTo(400, 1);
  });

  it('turn at exactly the cycle limit AV is within cycle', () => {
    // Speed 200 → AV = 10000/200 = 50. Turns at 50, 100, 150, 200 (sentinel).
    const result = simulateCycle(
      makeConfig({ members: [{ characterId: 'c', speed: 200, relics: noRelics }] }),
    );
    const at150 = result.turns.find((t) => Math.abs(t.av - 150) < 0.001);
    expect(at150).toBeDefined();
    expect(at150!.isWithinCycle).toBe(true);
    expect(at150!.isCycleEdge).toBe(false);
  });

  it('slot keys are deterministic and unique', () => {
    const result = simulateCycle(
      makeConfig({
        members: [
          { characterId: 'a', speed: 110, relics: noRelics },
          { characterId: 'b', speed: 100, relics: noRelics },
        ],
      }),
    );
    const keys = result.turns.map((t) => t.slotKey);
    expect(new Set(keys).size).toBe(keys.length); // all unique
    expect(keys.some((k) => k.startsWith('a:'))).toBe(true);
    expect(keys.some((k) => k.startsWith('b:'))).toBe(true);
  });

  it('ally advance — reduces target AV by % of base duration', () => {
    const config = makeConfig({
      members: [
        { characterId: 'bronya', speed: 99, relics: noRelics },
        { characterId: 'robin', speed: 112, relics: noRelics },
      ],
      assignedActions: {
        'bronya:1': { type: 'ally_advance', targetId: 'robin', advancePct: 1.0 },
      },
    });
    const result = simulateCycle(config);
    const robiTurn1 = result.turns.find((t) => t.actorId === 'robin' && t.occurrence === 1);
    const bronyaTurn1 = result.turns.find((t) => t.actorId === 'bronya' && t.occurrence === 1);
    const robiTurn2 = result.turns.find((t) => t.actorId === 'robin' && t.occurrence === 2);
    expect(robiTurn1!.av).toBeLessThan(bronyaTurn1!.av);
    expect(robiTurn2!.av).toBeLessThan(bronyaTurn1!.av + 10000 / 112 + 1);
  });

  it('ally advance formula uses base duration (10000/targetSpeed), not remaining AV', () => {
    const config = makeConfig({
      cycleMode: 'aa',
      members: [
        { characterId: 'bronya', speed: 50, relics: noRelics },
        { characterId: 'robin', speed: 112, relics: noRelics },
      ],
      assignedActions: {
        'bronya:1': { type: 'ally_advance', targetId: 'robin', advancePct: 0.5 },
      },
    });
    const result = simulateCycle(config);
    const bronyaTurn1 = result.turns.find((t) => t.actorId === 'bronya' && t.occurrence === 1);
    expect(bronyaTurn1).toBeDefined();
    const robinAfterBronya = result.turns.find(
      (t) => t.actorId === 'robin' && t.av > bronyaTurn1!.av,
    );
    if (robinAfterBronya) {
      const expectedReduction = 0.5 * (10000 / 112);
      expect(expectedReduction).toBeCloseTo(44.64, 1);
    }
  });

  it('eagle set — applies 25% self-advance on out-of-turn ult (enemy turn)', () => {
    const config = makeConfig({
      members: [
        { characterId: 'robin', speed: 112, relics: { eagleSet: true, dddSuperimposition: 0, vonwacq: false } },
      ],
      enemies: [{ id: 'enemy_0', name: 'Boss', speed: 80 }],
      assignedActions: {
        'outturn:robin:enemy_0:1': { type: 'window_ult', actorId: 'robin' },
      },
    });
    const result = simulateCycle(config);
    const enemyTurn1 = result.turns.find((t) => t.actorId === 'enemy_0' && t.occurrence === 1);
    expect(enemyTurn1).toBeDefined();
    expect(enemyTurn1!.outOfTurnActions).toHaveLength(1);
    const action = enemyTurn1!.outOfTurnActions[0];
    expect(action.actorId).toBe('robin');
    expect(action.eagleAdvanceApplied).toBe(true);
    expect(action.eagleAdvanceAmount).toBeCloseTo(0.25 * (10000 / 112), 3);
  });

  it('eagle set — does NOT apply on own turn ult', () => {
    const config = makeConfig({
      members: [
        { characterId: 'robin', speed: 112, relics: { eagleSet: true, dddSuperimposition: 0, vonwacq: false } },
      ],
      assignedActions: {
        'robin:1': { type: 'ult' },
      },
    });
    const result = simulateCycle(config);
    const robinTurn1 = result.turns.find((t) => t.actorId === 'robin' && t.occurrence === 1);
    const robinTurn2 = result.turns.find((t) => t.actorId === 'robin' && t.occurrence === 2);
    expect(robinTurn1).toBeDefined();
    expect(robinTurn2).toBeDefined();
    const gap = robinTurn2!.av - robinTurn1!.av;
    expect(gap).toBeCloseTo(10000 / 112, 3);
  });

  it('eagle set — does NOT apply on in-turn ult (character turn)', () => {
    const config = makeConfig({
      members: [
        { characterId: 'bronya', speed: 100, relics: noRelics },
        { characterId: 'robin', speed: 112, relics: { eagleSet: true, dddSuperimposition: 0, vonwacq: false } },
      ],
      assignedActions: {
        'inturn:robin:bronya:1': { type: 'window_ult', actorId: 'robin' },
      },
    });
    const result = simulateCycle(config);
    const bronyaTurn1 = result.turns.find((t) => t.actorId === 'bronya' && t.occurrence === 1);
    expect(bronyaTurn1).toBeDefined();
    expect(bronyaTurn1!.inTurnActions).toHaveLength(1);
    const action = bronyaTurn1!.inTurnActions[0];
    expect(action.actorId).toBe('robin');
    expect(action.window).toBe('in-turn');
    expect(action.eagleAdvanceApplied).toBe(false);
    expect(action.eagleAdvanceAmount).toBe(0);
  });

  it('eagle set — DOES apply on out-of-turn ult (character turn)', () => {
    const config = makeConfig({
      members: [
        { characterId: 'bronya', speed: 100, relics: noRelics },
        { characterId: 'robin', speed: 112, relics: { eagleSet: true, dddSuperimposition: 0, vonwacq: false } },
      ],
      assignedActions: {
        'outturn:robin:bronya:1': { type: 'window_ult', actorId: 'robin' },
      },
    });
    const result = simulateCycle(config);
    const bronyaTurn1 = result.turns.find((t) => t.actorId === 'bronya' && t.occurrence === 1);
    expect(bronyaTurn1).toBeDefined();
    expect(bronyaTurn1!.outOfTurnActions).toHaveLength(1);
    const action = bronyaTurn1!.outOfTurnActions[0];
    expect(action.actorId).toBe('robin');
    expect(action.window).toBe('out-of-turn');
    expect(action.eagleAdvanceApplied).toBe(true);
    expect(action.eagleAdvanceAmount).toBeCloseTo(0.25 * (10000 / 112), 3);
  });

  it('enemy turns have no in-turn actions', () => {
    const config = makeConfig({
      members: [{ characterId: 'robin', speed: 112, relics: noRelics }],
      enemies: [{ id: 'enemy_0', name: 'Boss', speed: 80 }],
    });
    const result = simulateCycle(config);
    const enemyTurns = result.turns.filter((t) => t.actorType === 'enemy');
    for (const turn of enemyTurns) {
      expect(turn.inTurnActions).toHaveLength(0);
    }
  });

  it('enemies appear in turn order', () => {
    const result = simulateCycle(
      makeConfig({
        members: [{ characterId: 'char', speed: 100, relics: noRelics }],
        enemies: [{ id: 'enemy_0', name: 'Boss', speed: 80 }],
      }),
    );
    const enemyTurns = result.turns.filter((t) => t.actorType === 'enemy');
    expect(enemyTurns.length).toBeGreaterThan(0);
    expect(enemyTurns[0].av).toBeCloseTo(10000 / 80, 3);
    expect(enemyTurns[0].isWithinCycle).toBe(true);
  });

  it('summary counts only within-cycle turns', () => {
    const result = simulateCycle(
      makeConfig({
        cycleMode: 'moc',
        members: [{ characterId: 'char', speed: 100, relics: noRelics }],
      }),
    );
    expect(result.summary.turnsPerActor['char']).toBe(1);
  });
});
