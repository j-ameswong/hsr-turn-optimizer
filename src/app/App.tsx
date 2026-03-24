import { useState } from 'react';
import { Toaster } from 'sonner';
import { AppHeader } from './components/layout/AppHeader';
import { MobileNav, type MobileTab } from './components/layout/MobileNav';
import { CharacterRoster } from './components/character-roster/CharacterRoster';
import { EnemyPanel } from './components/enemies/EnemyPanel';
import { Timeline } from './components/timeline/Timeline';
import { StatsPanel } from './components/stats/StatsPanel';
import { PresetManager } from './components/presets/PresetManager';
import { useTeamConfig } from '../hooks/useTeamConfig';
import { useSimulation } from '../hooks/useSimulation';
import { usePresets } from '../hooks/usePresets';

export default function App() {
  const teamConfig = useTeamConfig();
  const { config } = teamConfig;
  const simulation = useSimulation(config);

  const { presets, savePreset, deletePreset, renamePreset } = usePresets();
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('roster');

  return (
    <div className="flex flex-col h-dvh bg-hsr-surface-0 text-hsr-text overflow-hidden">
      <Toaster theme="dark" position="top-right" />

      <AppHeader
        config={config}
        presets={presets}
        onSetCycleMode={teamConfig.setCycleMode}
        onReset={teamConfig.resetConfig}
        onOpenPresets={() => setPresetsOpen(true)}
      />

      {/* ── Desktop layout: 3-panel grid ── */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr_300px] flex-1 overflow-hidden">
        {/* Left: Character roster */}
        <aside className="border-r border-border overflow-hidden flex flex-col">
          <CharacterRoster
            config={config}
            onAddMember={teamConfig.addMember}
            onRemoveMember={teamConfig.removeMember}
            onUpdateSpeed={teamConfig.updateMemberSpeed}
            onToggleEagle={teamConfig.toggleEagleSet}
            onSetDDDSuperimposition={teamConfig.setDDDSuperimposition}
            onToggleVonwacq={teamConfig.toggleVonwacq}
          />
        </aside>

        {/* Center: Timeline */}
        <main className="flex flex-col min-w-0">
          <Timeline
            config={config}
            simulation={simulation}
            onAssignAction={teamConfig.assignAction}
          />
        </main>

        {/* Right: Enemies + Stats */}
        <aside className="border-l border-border overflow-hidden flex flex-col">
          <EnemyPanel
            enemies={config.enemies}
            onAddEnemy={teamConfig.addEnemy}
            onRemoveEnemy={teamConfig.removeEnemy}
            onUpdateEnemy={teamConfig.updateEnemy}
          />
          <div className="border-t border-border flex-1 overflow-hidden">
            <StatsPanel config={config} simulation={simulation} />
          </div>
        </aside>
      </div>

      {/* ── Mobile layout: tab-driven single column ── */}
      <div className="flex lg:hidden flex-1 overflow-hidden pb-[57px]">
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'roster' && (
            <CharacterRoster
              config={config}
              onAddMember={teamConfig.addMember}
              onRemoveMember={teamConfig.removeMember}
              onUpdateSpeed={teamConfig.updateMemberSpeed}
              onToggleEagle={teamConfig.toggleEagleSet}
              onSetDDDSuperimposition={teamConfig.setDDDSuperimposition}
              onToggleVonwacq={teamConfig.toggleVonwacq}
            />
          )}
          {mobileTab === 'timeline' && (
            <Timeline
              config={config}
              simulation={simulation}
              onAssignAction={teamConfig.assignAction}
            />
          )}
          {mobileTab === 'enemies' && (
            <EnemyPanel
              enemies={config.enemies}
              onAddEnemy={teamConfig.addEnemy}
              onRemoveEnemy={teamConfig.removeEnemy}
              onUpdateEnemy={teamConfig.updateEnemy}
            />
          )}
          {mobileTab === 'stats' && (
            <StatsPanel config={config} simulation={simulation} />
          )}
        </div>
      </div>

      <MobileNav active={mobileTab} onChange={setMobileTab} />

      <PresetManager
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        presets={presets}
        currentConfig={config}
        onSave={(name) => savePreset(name, config)}
        onLoad={teamConfig.loadConfig}
        onDelete={deletePreset}
        onRename={renamePreset}
      />
    </div>
  );
}
