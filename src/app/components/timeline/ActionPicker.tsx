import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { ActionAssignment, TeamConfig } from '../../../lib/engine/types';

interface Props {
  slotKey: string;
  current: ActionAssignment | null;
  actorType: 'character' | 'enemy';
  team: TeamConfig['members'];
  onChange: (action: ActionAssignment | null) => void;
}

const BASE_ACTIONS: { type: ActionAssignment['type']; label: string }[] = [
  { type: 'basic', label: 'Basic ATK' },
  { type: 'skill', label: 'Skill' },
  { type: 'ult', label: 'Ultimate' },
];

export function ActionPicker({ slotKey, current, actorType, team, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState('');
  const [advancePct, setAdvancePct] = useState('100');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function label() {
    if (!current || current.type === 'none') return null;
    if (current.type === 'basic') return 'Basic';
    if (current.type === 'skill') return 'Skill';
    if (current.type === 'ult') return 'Ult';
    if (current.type === 'ally_advance') return `+Adv → ${current.targetId}`;
    if (current.type === 'speed_buff') return `+SPD → ${current.targetId}`;
    if (current.type === 'custom') return current.label || 'Custom';
    return null;
  }

  const displayLabel = label();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-mini px-2 py-0.5 rounded border transition-colors ${
          displayLabel
            ? 'border-hsr-gold-dim bg-hsr-gold-subtle text-hsr-gold'
            : 'border-border text-hsr-text-dim hover:border-hsr-gold-dim hover:text-hsr-text'
        }`}
      >
        {displayLabel ?? 'Action'}
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 w-48 bg-hsr-surface-2 border border-border rounded-md shadow-xl overflow-hidden">
          {/* Clear */}
          {displayLabel && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-hsr-text-dim hover:text-hsr-text hover:bg-hsr-surface-3"
            >
              <X className="w-3 h-3" /> Clear action
            </button>
          )}

          {/* Standard actions (only for character turns) */}
          {actorType === 'character' && (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-micro text-hsr-text-dim uppercase tracking-wider">Actions</span>
              </div>
              {BASE_ACTIONS.map((a) => (
                <button
                  key={a.type}
                  onClick={() => { onChange({ type: a.type }); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-hsr-surface-3 transition-colors ${
                    current?.type === a.type ? 'text-hsr-gold' : 'text-hsr-text'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </>
          )}

          {/* Ally advance (only for character turns with teammates) */}
          {actorType === 'character' && team.length > 1 && (
            <>
              <div className="px-3 pt-2 pb-1 border-t border-border mt-1">
                <span className="text-micro text-hsr-text-dim uppercase tracking-wider">Ally Advance</span>
              </div>
              <div className="px-3 py-1.5 space-y-1.5">
                <select
                  value={advanceTarget}
                  onChange={(e) => setAdvanceTarget(e.target.value)}
                  className="w-full text-xs bg-hsr-surface-0 border border-border rounded px-2 py-1 text-hsr-text focus:outline-none"
                >
                  <option value="">Select target…</option>
                  {team.map((m) => (
                    <option key={m.characterId} value={m.characterId}>
                      {m.characterId.charAt(0).toUpperCase() + m.characterId.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={advancePct}
                    onChange={(e) => setAdvancePct(e.target.value)}
                    min={1}
                    max={200}
                    className="w-16 text-xs text-center bg-hsr-surface-0 border border-border rounded px-1 py-1 text-hsr-text focus:outline-none"
                  />
                  <span className="text-mini text-hsr-text-dim">%</span>
                  <button
                    disabled={!advanceTarget}
                    onClick={() => {
                      if (!advanceTarget) return;
                      onChange({
                        type: 'ally_advance',
                        targetId: advanceTarget,
                        advancePct: parseFloat(advancePct) / 100,
                      });
                      setOpen(false);
                    }}
                    className="flex-1 text-xs bg-hsr-purple-subtle border border-hsr-purple-dim text-hsr-purple rounded px-2 py-0.5 disabled:opacity-30 hover:bg-hsr-purple hover:text-hsr-surface-0 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
