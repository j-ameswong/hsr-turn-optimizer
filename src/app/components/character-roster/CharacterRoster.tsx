import { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import type { TeamConfig } from '../../../lib/engine/types';
import { allCharacters } from '../../../hooks/useCharacterData';
import type { Character } from '../../../data/schema';
import { characterIcon, characterPreview, eagleSet, dddLc, vonwacq } from '../../../lib/assets';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props {
  config: TeamConfig;
  onAddMember: (characterId: string, baseSpeed: number) => void;
  onRemoveMember: (characterId: string) => void;
  onUpdateSpeed: (characterId: string, speed: number) => void;
  onToggleEagle: (characterId: string, enabled: boolean) => void;
  onSetDDDSuperimposition: (characterId: string, level: number) => void;
  onToggleVonwacq: (characterId: string, enabled: boolean) => void;
}

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'text-orange-400',
  Ice: 'text-sky-400',
  Wind: 'text-emerald-400',
  Thunder: 'text-violet-400',
  Physical: 'text-slate-400',
  Quantum: 'text-indigo-400',
  Imaginary: 'text-yellow-400',
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function CharacterRoster({
  config,
  onAddMember,
  onRemoveMember,
  onUpdateSpeed,
  onToggleEagle,
  onSetDDDSuperimposition,
  onToggleVonwacq,
}: Props) {
  const [query, setQuery] = useState('');
  const selectedIds = new Set(config.members.map((m) => m.characterId));
  const norm = normalize(query);

  const filteredChars = norm
    ? allCharacters.filter((c) => normalize(c.name).includes(norm))
    : allCharacters;

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-hsr-text tracking-wide">Team</h2>
      </div>

      {/* Selected team */}
      <div className="px-3 py-3 flex-shrink-0 border-b border-border">
        <div className="gap-2 px-0.5 py-0.5">
          {Array.from({ length: 4 }).map((_, i) => {
            const member = config.members[i];
            if (!member) {
              return (
                <div
                  key={i}
                  className="min-h-[70px] my-2 rounded-md border border-dashed border-border flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-hsr-text-dim" />
                </div>
              );
            }
            const charData = allCharacters.find((c) => c.id === member.characterId);
            return (
              <TeamSlot
                key={member.characterId}
                member={member}
                charData={charData}
                onRemove={() => onRemoveMember(member.characterId)}
                onUpdateSpeed={(v) => onUpdateSpeed(member.characterId, v)}
                onToggleEagle={(v) => onToggleEagle(member.characterId, v)}
                onSetDDDSuperimposition={(level) => onSetDDDSuperimposition(member.characterId, level)}
                onToggleVonwacq={(v) => onToggleVonwacq(member.characterId, v)}
              />
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hsr-text-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search characters..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-hsr-surface-2 border border-border rounded text-hsr-text placeholder:text-hsr-text-dim focus:outline-none focus:border-hsr-gold-dim"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-hsr-text-dim hover:text-hsr-text"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Character grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="grid grid-cols-4 gap-1.5">
          {filteredChars.map((char) => {
            const isSelected = selectedIds.has(char.id);
            const isFull = config.members.length >= 4;
            const canAdd = !isSelected && !isFull;
            const elemColor = ELEMENT_COLORS[char.element] ?? 'text-hsr-text-muted';

            return (
              <button
                key={char.id}
                onClick={() => canAdd && onAddMember(char.id, char.baseSpeed)}
                disabled={!canAdd && !isSelected}
                title={`${char.name} · ${char.path} · Spd ${char.baseSpeed}`}
                className={`relative flex flex-col items-center gap-1 p-1.5 rounded-md border transition-all
                  ${isSelected
                    ? 'border-hsr-gold-dim bg-hsr-gold-subtle opacity-60 cursor-default'
                    : canAdd
                    ? 'border-border bg-hsr-surface-2 hover:border-hsr-gold-dim hover:bg-hsr-surface-3 cursor-pointer'
                    : 'border-border bg-hsr-surface-2 opacity-30 cursor-not-allowed'
                  }`}
              >
                <div className="w-full aspect-square rounded overflow-hidden bg-hsr-surface-0 relative">
                  <ImageWithFallback
                    src={characterIcon(char.numericId)}
                    alt={char.name}
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Rarity indicator */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${char.rarity === 5 ? 'bg-rarity-5' : 'bg-rarity-4'}`} />
                </div>
                <span className="text-[9px] text-hsr-text-muted leading-tight text-center truncate w-full">
                  {char.name.replace('Trailblazer (', 'TB (').replace(')', ')')}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${elemColor.replace('text-', 'bg-').replace('-400', '-500/40')} absolute top-1 right-1`} />
              </button>
            );
          })}
        </div>
        {filteredChars.length === 0 && (
          <p className="text-center text-xs text-hsr-text-dim py-8">No characters found</p>
        )}
      </div>
    </div>
  );
}

interface TeamSlotProps {
  member: TeamConfig['members'][0];
  charData: Character | undefined;
  onRemove: () => void;
  onUpdateSpeed: (v: number) => void;
  onToggleEagle: (v: boolean) => void;
  onSetDDDSuperimposition: (level: number) => void;
  onToggleVonwacq: (v: boolean) => void;
}

function TeamSlot({ member, charData, onRemove, onUpdateSpeed, onToggleEagle, onSetDDDSuperimposition, onToggleVonwacq }: TeamSlotProps) {
  const dddActive = member.relics.dddSuperimposition > 0;
  return (
    <div className="relative rounded-md border border-border bg-hsr-surface-2 p-0.5 my-2 flex flex-col gap-1 group">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-hsr-text-dim hover:text-hsr-text hover:bg-hsr-surface-3"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Portrait + name + equipment toggles */}
      <div className="flex items-center gap-1.5">
        <div className="w-13 h-13 rounded overflow-hidden bg-hsr-surface-0 flex-shrink-0">
          {charData ? (
            <ImageWithFallback
              src={characterPreview(charData.numericId)}
              alt={charData.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full bg-hsr-surface-1" />
          )}
        </div>
        <span className="flex-1 min-w-0 text-[10px] font-medium text-hsr-text truncate leading-tight">
          {charData?.name ?? member.characterId}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onToggleEagle(!member.relics.eagleSet)}
            title="Eagle Set (Pioneer Diver — 25% advance on cut-in ult)"
            className={`transition-opacity ${member.relics.eagleSet ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
          >
            <ImageWithFallback src={eagleSet()} alt="Eagle Set" className="w-11 h-11" />
          </button>
          <button
            onClick={() => onToggleVonwacq(!member.relics.vonwacq)}
            title="Vonwacq planar set"
            className={`transition-opacity ${member.relics.vonwacq ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
          >
            <ImageWithFallback src={vonwacq()} alt="Vonwacq" className="w-11 h-11" />
          </button>
          {charData?.dddEligible && (
            <button
              onClick={() => onSetDDDSuperimposition(dddActive ? 0 : 1)}
              title="Dance! Dance! Dance! (advance all allies on ult)"
              className={`transition-opacity ${dddActive ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
            >
              <ImageWithFallback src={dddLc()} alt="Dance! Dance! Dance!" className="w-11 h-11" />
            </button>
          )}
        </div>
      </div>

      {/* Speed input */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span className="text-[9px] text-hsr-text-dim flex-1">SPD</span>
        <input
          type="number"
          value={member.speed}
          min={1}
          max={500}
          step={0.1}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v > 0) onUpdateSpeed(v);
          }}
          className="w-16 text-xs text-center bg-hsr-surface-0 border border-border rounded px-1 py-0.5 text-hsr-text focus:outline-none focus:border-hsr-gold-dim"
        />
      </div>

      {/* DDD superimposition selector */}
      {charData?.dddEligible && dddActive && (
        <div className="flex items-center gap-1 px-0.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => onSetDDDSuperimposition(level)}
              className={`flex-1 py-0.5 rounded text-[9px] font-medium transition-colors border ${
                member.relics.dddSuperimposition === level
                  ? 'bg-hsr-purple-subtle border-hsr-purple-dim text-hsr-purple'
                  : 'border-border text-hsr-text-dim hover:border-hsr-purple-dim hover:text-hsr-text'
              }`}
            >
              S{level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
