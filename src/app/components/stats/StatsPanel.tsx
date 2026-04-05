import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TeamConfig, SimulationResult } from '../../../lib/engine/types';
import { allCharacters } from '../../../hooks/useCharacterData';

interface Props {
  config: TeamConfig;
  simulation: SimulationResult;
}

const BAR_COLORS = [
  'var(--turn-character)',
  'var(--hsr-purple)',
  'var(--hsr-gold)',
  'oklch(0.62 0.18 155)',
];

export function StatsPanel({ config, simulation }: Props) {
  const { summary } = simulation;

  const memberStats = config.members.map((m, i) => {
    const charData = allCharacters.find((c) => c.id === m.characterId);
    return {
      id: m.characterId,
      name: charData?.name ?? m.characterId,
      speed: m.speed,
      turns: summary.turnsPerActor[m.characterId] ?? 0,
      color: BAR_COLORS[i % BAR_COLORS.length],
    };
  });

  const enemyStats = config.enemies.map((e) => ({
    id: e.id,
    name: e.name || e.id,
    speed: e.speed,
    turns: summary.turnsPerActor[e.id] ?? 0,
  }));

  const avgSpeed =
    memberStats.length > 0
      ? memberStats.reduce((s, m) => s + m.speed, 0) / memberStats.length
      : 0;

  if (config.members.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-4 text-center">
        <BarChart2 className="w-6 h-6 text-hsr-text-dim opacity-30 mb-2" />
        <p className="text-xs text-hsr-text-dim">Add characters to see stats</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-hsr-text tracking-wide">Statistics</h2>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Summary stat */}
        <div className="flex items-center justify-between">
          <span className="text-mini text-hsr-text-dim uppercase tracking-wider">Avg Team SPD</span>
          <span className="text-sm font-semibold text-hsr-gold font-mono">
            {avgSpeed.toFixed(1)}
          </span>
        </div>

        {/* Turns chart */}
        {memberStats.some((m) => m.turns > 0) && (
          <div>
            <p className="text-mini text-hsr-text-dim uppercase tracking-wider mb-2">Turns within cycle</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={memberStats} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 'var(--text-micro)', fill: 'var(--hsr-text-muted)' }}
                  tickFormatter={(v: string) => v.split(' ')[0]}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 'var(--text-micro)', fill: 'var(--hsr-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip
                  cursor={{ fill: 'oklch(1 0 0 / 0.05)' }}
                  contentStyle={{
                    background: 'var(--hsr-surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: 'var(--text-mini)',
                    color: 'var(--hsr-text)',
                  }}
                  formatter={(v: number) => [v, 'Turns']}
                />
                <Bar dataKey="turns" radius={[3, 3, 0, 0]}>
                  {memberStats.map((m, i) => (
                    <Cell key={m.id} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Speed table */}
        <div>
          <p className="text-mini text-hsr-text-dim uppercase tracking-wider mb-2">Speed</p>
          <div className="space-y-1">
            {memberStats.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <span className="flex-1 text-mini text-hsr-text truncate">{m.name}</span>
                <span className="text-mini font-mono text-hsr-gold">{m.speed}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enemies */}
        {enemyStats.length > 0 && (
          <div>
            <p className="text-mini text-hsr-text-dim uppercase tracking-wider mb-2">Enemies</p>
            <div className="space-y-1">
              {enemyStats.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-turn-enemy flex-shrink-0" />
                  <span className="flex-1 text-mini text-turn-enemy truncate">{e.name}</span>
                  <span className="text-mini font-mono text-hsr-text-muted">{e.speed}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
