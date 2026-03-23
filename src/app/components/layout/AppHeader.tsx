import { Share2, BookOpen, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { buildShareUrl } from '../../../lib/persistence/urlEncoding';
import type { TeamConfig, CycleMode } from '../../../lib/engine/types';
import type { TeamPreset } from '../../../lib/persistence/localStorage';

interface Props {
  config: TeamConfig;
  presets: TeamPreset[];
  onSetCycleMode: (mode: CycleMode) => void;
  onReset: () => void;
  onOpenPresets: () => void;
}

export function AppHeader({ config, onSetCycleMode, onReset, onOpenPresets }: Props) {
  function handleShare() {
    const url = buildShareUrl(config);
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-hsr-surface-1">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-none">
          <span className="text-xs font-medium tracking-widest uppercase text-hsr-text-muted">
            Honkai: Star Rail
          </span>
          <span className="text-base font-semibold text-hsr-gold tracking-wide">
            0-Cycle Optimizer
          </span>
        </div>
      </div>

      {/* Cycle mode toggle */}
      <div className="flex items-center gap-1 rounded-md bg-hsr-surface-2 p-1 border border-border">
        <button
          onClick={() => onSetCycleMode('moc')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            config.cycleMode === 'moc'
              ? 'bg-hsr-gold text-hsr-surface-0'
              : 'text-hsr-text-muted hover:text-hsr-text'
          }`}
        >
          MoC <span className="opacity-60">150 AV</span>
        </button>
        <button
          onClick={() => onSetCycleMode('aa')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            config.cycleMode === 'aa'
              ? 'bg-hsr-gold text-hsr-surface-0'
              : 'text-hsr-text-muted hover:text-hsr-text'
          }`}
        >
          AA <span className="opacity-60">300 AV</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          title="Reset configuration"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-hsr-text-muted hover:text-hsr-text rounded border border-transparent hover:border-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          onClick={onOpenPresets}
          title="Manage presets"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-hsr-text-muted hover:text-hsr-text rounded border border-transparent hover:border-border transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Presets</span>
        </button>
        <button
          onClick={handleShare}
          title="Share build"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-hsr-gold-subtle text-hsr-gold border border-hsr-gold-dim rounded hover:bg-hsr-gold hover:text-hsr-surface-0 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
}
