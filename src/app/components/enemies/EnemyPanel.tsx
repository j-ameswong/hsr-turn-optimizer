import { useState } from 'react';
import { Plus, X, Swords } from 'lucide-react';
import type { EnemyConfig } from '../../../lib/engine/types';

interface Props {
  enemies: EnemyConfig[];
  onAddEnemy: (enemy: EnemyConfig) => void;
  onRemoveEnemy: (id: string) => void;
  onUpdateEnemy: (id: string, patch: Partial<EnemyConfig>) => void;
}

let enemyCounter = 0;
function nextEnemyId() {
  return `enemy_${enemyCounter++}`;
}

export function EnemyPanel({ enemies, onAddEnemy, onRemoveEnemy, onUpdateEnemy }: Props) {
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpeed, setNewSpeed] = useState('');

  function handleAdd() {
    const speed = parseFloat(newSpeed);
    if (!speed || speed <= 0) return;
    onAddEnemy({
      id: nextEnemyId(),
      name: newName.trim() || 'Enemy',
      speed,
    });
    setNewName('');
    setNewSpeed('');
    setAddingNew(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setAddingNew(false);
      setNewName('');
      setNewSpeed('');
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Swords className="w-3.5 h-3.5 text-turn-enemy" />
          <h2 className="text-sm font-semibold text-hsr-text tracking-wide">Enemies</h2>
        </div>
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1 text-xs text-hsr-text-muted hover:text-hsr-text transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Enemy list */}
      <div className="px-3 py-2 space-y-1.5">
        {enemies.map((enemy) => (
          <EnemyRow
            key={enemy.id}
            enemy={enemy}
            onRemove={() => onRemoveEnemy(enemy.id)}
            onUpdate={(patch) => onUpdateEnemy(enemy.id, patch)}
          />
        ))}

        {enemies.length === 0 && !addingNew && (
          <p className="text-[10px] text-hsr-text-dim text-center py-3">
            No enemies added. Enemy turns appear in the timeline.
          </p>
        )}

        {/* New enemy form */}
        {addingNew && (
          <div className="flex items-center gap-1.5 p-2 rounded-md border border-hsr-gold-dim bg-hsr-surface-2" onKeyDown={handleKeyDown}>
            <div className="w-2 h-2 rounded-full bg-turn-enemy flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (optional)"
              className="flex-1 text-xs bg-transparent text-hsr-text placeholder:text-hsr-text-dim focus:outline-none min-w-0"
            />
            <input
              type="number"
              value={newSpeed}
              onChange={(e) => setNewSpeed(e.target.value)}
              placeholder="SPD"
              min={1}
              className="w-14 text-xs text-center bg-hsr-surface-0 border border-border rounded px-1 py-0.5 text-hsr-text focus:outline-none focus:border-hsr-gold-dim"
            />
            <button
              onClick={handleAdd}
              disabled={!newSpeed || parseFloat(newSpeed) <= 0}
              className="text-xs text-hsr-gold hover:text-hsr-text disabled:opacity-30 transition-colors px-1"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingNew(false); setNewName(''); setNewSpeed(''); }}
              className="text-hsr-text-dim hover:text-hsr-text"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EnemyRowProps {
  enemy: EnemyConfig;
  onRemove: () => void;
  onUpdate: (patch: Partial<EnemyConfig>) => void;
}

function EnemyRow({ enemy, onRemove, onUpdate }: EnemyRowProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-hsr-surface-2 border border-border group">
      <div className="w-2 h-2 rounded-full bg-turn-enemy flex-shrink-0" />
      <input
        type="text"
        value={enemy.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="flex-1 text-xs bg-transparent text-hsr-text focus:outline-none min-w-0"
      />
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-[9px] text-hsr-text-dim">SPD</span>
        <input
          type="number"
          value={enemy.speed}
          min={1}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v > 0) onUpdate({ speed: v });
          }}
          className="w-14 text-xs text-center bg-hsr-surface-0 border border-border rounded px-1 py-0.5 text-hsr-text focus:outline-none focus:border-hsr-gold-dim"
        />
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-hsr-text-dim hover:text-hsr-text transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
