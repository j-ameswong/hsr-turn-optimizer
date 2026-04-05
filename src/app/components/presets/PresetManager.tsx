import { useState } from 'react';
import { X, Save, Trash2, FolderOpen } from 'lucide-react';
import type { TeamPreset } from '../../../lib/persistence/localStorage';
import type { TeamConfig } from '../../../lib/engine/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: TeamPreset[];
  currentConfig: TeamConfig;
  onSave: (name: string) => void;
  onLoad: (config: TeamConfig) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function PresetManager({ open, onOpenChange, presets, currentConfig: _config, onSave, onLoad, onDelete }: Props) {
  const [newName, setNewName] = useState('');

  if (!open) return null;

  function handleSave() {
    onSave(newName);
    setNewName('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div className="bg-hsr-surface-1 border border-border rounded-xl shadow-2xl w-96 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h3 className="text-sm font-semibold text-hsr-text">Presets</h3>
          <button onClick={() => onOpenChange(false)} className="text-hsr-text-dim hover:text-hsr-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save current */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <p className="text-mini text-hsr-text-dim mb-2">Save current configuration</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Preset name…"
              className="flex-1 text-xs bg-hsr-surface-2 border border-border rounded px-3 py-1.5 text-hsr-text placeholder:text-hsr-text-dim focus:outline-none focus:border-hsr-gold-dim"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-hsr-gold-subtle border border-hsr-gold-dim text-hsr-gold rounded hover:bg-hsr-gold hover:text-hsr-surface-0 transition-colors"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>

        {/* Preset list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {presets.length === 0 ? (
            <p className="text-center text-xs text-hsr-text-dim py-6">No saved presets yet.</p>
          ) : (
            <div className="space-y-1.5">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-hsr-surface-2 border border-border group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-hsr-text truncate">{preset.name}</div>
                    <div className="text-micro text-hsr-text-dim">
                      {preset.config.members.length} chars · {preset.config.cycleMode.toUpperCase()}
                      {' · '}{new Date(preset.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => { onLoad(preset.config); onOpenChange(false); }}
                    className="flex items-center gap-1 text-mini text-hsr-text-muted hover:text-hsr-text px-2 py-1 rounded border border-transparent hover:border-border transition-colors"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Load
                  </button>
                  <button
                    onClick={() => onDelete(preset.id)}
                    className="opacity-0 group-hover:opacity-100 text-hsr-text-dim hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
