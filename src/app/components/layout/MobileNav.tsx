import { Users, List, Swords, BarChart2 } from 'lucide-react';

export type MobileTab = 'roster' | 'timeline' | 'enemies' | 'stats';

interface Props {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'roster', label: 'Roster', Icon: Users },
  { id: 'timeline', label: 'Timeline', Icon: List },
  { id: 'enemies', label: 'Enemies', Icon: Swords },
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
];

export function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-hsr-surface-1 lg:hidden">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-mini font-medium transition-colors ${
            active === id
              ? 'text-hsr-gold'
              : 'text-hsr-text-muted hover:text-hsr-text'
          }`}
        >
          <Icon className="w-5 h-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
