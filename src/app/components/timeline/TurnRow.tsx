import { Zap, Plus, X } from 'lucide-react';
import type { ResolvedTurn, TeamConfig, ActionAssignment, SlotKey } from '../../../lib/engine/types';
import { ActionPicker } from './ActionPicker';
import { allCharacters } from '../../../hooks/useCharacterData';
import { characterIcon } from '../../../lib/assets';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props {
  turn: ResolvedTurn;
  index: number;
  team: TeamConfig['members'];
  onAssignAction: (slotKey: SlotKey, action: ActionAssignment | null) => void;
  onOpenCutin: (enemySlotKey: SlotKey) => void;
  onRemoveCutin: (cutinSlotKey: SlotKey) => void;
}

export function TurnRow({ turn, index, team, onAssignAction, onOpenCutin, onRemoveCutin }: Props) {
  const isEnemy = turn.actorType === 'enemy';
  const isSentinel = turn.isCycleEdge;

  const charData = !isEnemy
    ? allCharacters.find((c) => c.id === turn.actorId)
    : undefined;

  const rowClass = isSentinel
    ? 'opacity-40'
    : isEnemy
    ? 'border-l-2 border-l-turn-enemy'
    : 'border-l-2 border-l-turn-character';

  return (
    <div className={`group ${rowClass}`}>
      <div className={`flex items-center gap-2 px-3 py-2 hover:bg-hsr-surface-2 transition-colors ${isSentinel ? 'bg-transparent' : ''}`}>
        {/* Turn number */}
        <span className="text-[10px] text-hsr-text-dim w-5 text-right flex-shrink-0 font-mono">
          {index + 1}
        </span>

        {/* Actor icon */}
        <div className={`w-7 h-7 rounded flex-shrink-0 overflow-hidden ${isEnemy ? 'bg-turn-enemy/10 flex items-center justify-center' : 'bg-hsr-surface-0'}`}>
          {!isEnemy && charData ? (
            <ImageWithFallback
              src={characterIcon(charData.numericId)}
              alt={charData.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-turn-enemy/60" />
          )}
        </div>

        {/* Actor name + occurrence */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xs font-medium truncate ${isEnemy ? 'text-turn-enemy' : 'text-hsr-text'}`}>
              {turn.actorName === turn.actorId ? (charData?.name ?? turn.actorId) : turn.actorName}
            </span>
            <span className="text-[9px] text-hsr-text-dim flex-shrink-0">#{turn.occurrence}</span>
          </div>
        </div>

        {/* AV */}
        <span className="text-[10px] font-mono text-hsr-text-muted flex-shrink-0 w-14 text-right">
          {turn.av.toFixed(1)}
        </span>

        {/* Action picker (character turns only) */}
        {!isSentinel && (
          <div className="flex-shrink-0">
            {!isEnemy ? (
              <ActionPicker
                slotKey={turn.slotKey}
                current={turn.appliedAction}
                actorType="character"
                team={team}
                onChange={(action) => onAssignAction(turn.slotKey, action)}
              />
            ) : (
              <button
                onClick={() => onOpenCutin(turn.slotKey)}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-border text-hsr-text-dim hover:border-hsr-purple-dim hover:text-hsr-purple transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                Cut-in
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cut-ins on this turn */}
      {turn.cutins.length > 0 && (
        <div className="pl-8 pr-3 pb-1 space-y-0.5">
          {turn.cutins.map((cutin) => {
            const cutinChar = allCharacters.find((c) => c.id === cutin.actorId);
            return (
              <div
                key={cutin.slotKey}
                className="flex items-center gap-2 px-2 py-1 rounded bg-hsr-purple-subtle border border-hsr-purple-dim/50 group/cutin"
              >
                <div className="w-4 h-4 rounded overflow-hidden bg-hsr-surface-0 flex-shrink-0">
                  {cutinChar && (
                    <ImageWithFallback
                      src={characterIcon(cutinChar.numericId)}
                      alt={cutinChar.name}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <span className="text-[10px] text-hsr-purple flex-1">
                  {cutinChar?.name ?? cutin.actorId} — Ult cut-in
                </span>
                {cutin.eagleAdvanceApplied && (
                  <div className="flex items-center gap-0.5 text-[9px] text-hsr-gold">
                    <Zap className="w-2.5 h-2.5" />
                    -{cutin.eagleAdvanceAmount.toFixed(1)} AV
                  </div>
                )}
                <button
                  onClick={() => onRemoveCutin(cutin.slotKey)}
                  className="opacity-0 group-hover/cutin:opacity-100 transition-opacity text-hsr-text-dim hover:text-hsr-text"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
