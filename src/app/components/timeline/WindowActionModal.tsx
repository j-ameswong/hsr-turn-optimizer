import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import type { TeamConfig, SlotKey } from '../../../lib/engine/types';
import { allCharacters } from '../../../hooks/useCharacterData';
import { characterIcon } from '../../../lib/assets';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props {
  open: boolean;
  hostSlotKey: SlotKey;
  hostActorName: string;
  window: 'in-turn' | 'out-of-turn';
  team: TeamConfig['members'];
  existingActions: string[]; // characterIds already assigned to this window slot
  onConfirm: (actorId: string) => void;
  onClose: () => void;
}

export function WindowActionModal({ open, hostSlotKey: _key, hostActorName, window: actionWindow, team, existingActions, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<string>('');

  if (!open) return null;

  const isOutOfTurn = actionWindow === 'out-of-turn';
  const title = isOutOfTurn ? 'Out-of-turn Action' : 'In-turn Action';
  const subtitle = isOutOfTurn ? `After ${hostActorName}'s turn` : `During ${hostActorName}'s turn`;

  function handleConfirm() {
    if (!selected) return;
    onConfirm(selected);
    setSelected('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-hsr-surface-1 border border-border rounded-xl shadow-2xl w-80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-hsr-text">{title}</h3>
            <p className="text-[10px] text-hsr-text-muted">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-hsr-text-dim hover:text-hsr-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Team list */}
        <div className="p-3 space-y-1.5">
          {team.map((member) => {
            const charData = allCharacters.find((c) => c.id === member.characterId);
            const alreadyAssigned = existingActions.includes(member.characterId);
            const isSelected = selected === member.characterId;

            return (
              <button
                key={member.characterId}
                disabled={alreadyAssigned}
                onClick={() => setSelected(member.characterId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left ${
                  alreadyAssigned
                    ? 'opacity-40 cursor-not-allowed border-border'
                    : isSelected
                    ? 'border-hsr-purple-dim bg-hsr-purple-subtle'
                    : 'border-border bg-hsr-surface-2 hover:border-hsr-purple-dim hover:bg-hsr-surface-3'
                }`}
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-hsr-surface-0 flex-shrink-0">
                  {charData && (
                    <ImageWithFallback
                      src={characterIcon(charData.numericId)}
                      alt={charData.name}
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-hsr-text truncate">
                    {charData?.name ?? member.characterId}
                  </div>
                  <div className="text-[9px] text-hsr-text-muted">
                    {alreadyAssigned ? 'Already assigned' : `SPD ${member.speed}`}
                  </div>
                </div>
                {isOutOfTurn && member.relics.eagleSet && (
                  <div title="Eagle Set — will gain 25% advance" className="flex items-center gap-0.5 text-[9px] text-hsr-gold">
                    <Zap className="w-2.5 h-2.5" />
                    Eagle
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Eagle set note (out-of-turn only) */}
        {isOutOfTurn && selected && team.find((m) => m.characterId === selected)?.relics.eagleSet && (
          <div className="mx-3 mb-2 px-2.5 py-2 rounded-md bg-hsr-gold-subtle border border-hsr-gold-dim">
            <div className="flex items-center gap-1.5 text-[10px] text-hsr-gold">
              <Zap className="w-3 h-3" />
              Eagle Set active — 25% action advance will be applied after this action.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs text-hsr-text-muted border border-border rounded-lg hover:text-hsr-text hover:border-hsr-text-dim transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 py-2 text-xs font-medium bg-hsr-purple-subtle border border-hsr-purple-dim text-hsr-purple rounded-lg disabled:opacity-30 hover:bg-hsr-purple hover:text-white transition-colors"
          >
            Add Action
          </button>
        </div>
      </div>
    </div>
  );
}
