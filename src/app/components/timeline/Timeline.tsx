import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { TeamConfig, SimulationResult, ActionAssignment, SlotKey } from '../../../lib/engine/types';
import { TurnRow } from './TurnRow';
import { CutinSlotModal } from './CutinSlotModal';

interface Props {
  config: TeamConfig;
  simulation: SimulationResult;
  onAssignAction: (slotKey: SlotKey, action: ActionAssignment | null) => void;
}

export function Timeline({ config, simulation, onAssignAction }: Props) {
  const [cutinModal, setCutinModal] = useState<{ open: boolean; enemySlotKey: SlotKey; enemyName: string }>({
    open: false,
    enemySlotKey: '',
    enemyName: '',
  });

  const { turns, summary } = simulation;
  const cycleLimit = summary.cycleLimit;

  function handleOpenCutin(enemySlotKey: SlotKey) {
    const turn = turns.find((t) => t.slotKey === enemySlotKey);
    setCutinModal({ open: true, enemySlotKey, enemyName: turn?.actorName ?? 'Enemy' });
  }

  function handleCutinConfirm(actorId: string) {
    const cutinKey: SlotKey = `cutin:${actorId}:${cutinModal.enemySlotKey}`;
    onAssignAction(cutinKey, { type: 'cutin_ult', actorId });
  }

  function handleRemoveCutin(cutinSlotKey: SlotKey) {
    onAssignAction(cutinSlotKey, null);
  }

  // Find cut-ins already on the modal's enemy slot
  const existingCutins = turns
    .find((t) => t.slotKey === cutinModal.enemySlotKey)
    ?.cutins.map((c) => c.actorId) ?? [];

  // Find the boundary index (first sentinel turn)
  const boundaryIdx = turns.findIndex((t) => t.isCycleEdge);
  const withinCycleCount = boundaryIdx === -1 ? turns.length : boundaryIdx;

  const isEmpty = config.members.length === 0 && config.enemies.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-hsr-text tracking-wide">Timeline</h2>
          {!isEmpty && (
            <p className="text-[10px] text-hsr-text-muted">
              {withinCycleCount} turn{withinCycleCount !== 1 ? 's' : ''} within {cycleLimit} AV
            </p>
          )}
        </div>
        {/* Legend */}
        {!isEmpty && (
          <div className="flex items-center gap-3 text-[9px] text-hsr-text-dim">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-turn-character" /> Character
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-turn-enemy" /> Enemy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-turn-cutin" /> Cut-in
            </span>
          </div>
        )}
      </div>

      {/* Column headers */}
      {!isEmpty && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-hsr-surface-2 flex-shrink-0">
          <span className="text-[9px] text-hsr-text-dim w-5 text-right">#</span>
          <span className="w-7 flex-shrink-0" />
          <span className="flex-1 text-[9px] text-hsr-text-dim">Actor</span>
          <span className="text-[9px] text-hsr-text-dim w-14 text-right">AV</span>
          <span className="text-[9px] text-hsr-text-dim w-20 text-right">Action</span>
        </div>
      )}

      {/* Turn list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <AlertCircle className="w-8 h-8 text-hsr-text-dim opacity-40" />
            <div>
              <p className="text-sm font-medium text-hsr-text-muted">No team configured</p>
              <p className="text-xs text-hsr-text-dim mt-1">
                Add characters from the roster and enemies from the enemy panel to see the turn timeline.
              </p>
            </div>
          </div>
        ) : (
          turns.map((turn, i) => (
            <div key={turn.slotKey}>
              {/* Cycle boundary marker */}
              {turn.isCycleEdge && (
                <div className="flex items-center gap-2 px-3 py-1.5 my-0.5">
                  <div className="flex-1 h-px bg-turn-boundary opacity-40" />
                  <span className="text-[9px] font-medium tracking-wider text-turn-boundary uppercase px-2">
                    {cycleLimit} AV — Cycle End
                  </span>
                  <div className="flex-1 h-px bg-turn-boundary opacity-40" />
                </div>
              )}
              <TurnRow
                turn={turn}
                index={i}
                team={config.members}
                onAssignAction={onAssignAction}
                onOpenCutin={handleOpenCutin}
                onRemoveCutin={handleRemoveCutin}
              />
            </div>
          ))
        )}
      </div>

      {/* Cut-in modal */}
      <CutinSlotModal
        open={cutinModal.open}
        enemySlotKey={cutinModal.enemySlotKey}
        enemyName={cutinModal.enemyName}
        team={config.members}
        existingCutins={existingCutins}
        onConfirm={handleCutinConfirm}
        onClose={() => setCutinModal((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
