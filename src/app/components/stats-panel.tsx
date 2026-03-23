interface Character {
  id: string;
  name: string;
  speed: number;
  element: string;
  path: string;
  rarity: number;
  danceDanceDance: boolean;
  eagleSet: boolean;
}

interface StatsPanelProps {
  characters: Character[];
}

export function StatsPanel({ characters }: StatsPanelProps) {
  const avgSpeed = characters.length > 0 
    ? characters.reduce((sum, c) => sum + c.speed, 0) / characters.length 
    : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b-2 border-black bg-white px-3 py-2 flex-shrink-0">
        <h2 className="font-mono font-bold text-sm">TEAM STATISTICS</h2>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {/* Average Speed */}
        <div className="border-2 border-black bg-white p-3 flex-shrink-0">
          <div className="font-mono text-xs text-gray-600 mb-1">AVG SPEED</div>
          <div className="font-mono text-2xl font-bold">
            {avgSpeed.toFixed(1)}
          </div>
        </div>

        {/* Individual character stats */}
        {characters.length > 0 && (
          <div className="border-2 border-black bg-white flex-shrink-0">
            <table className="w-full">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-black px-2 py-1 font-mono text-xs text-left">CHAR</th>
                  <th className="border border-black px-2 py-1 font-mono text-xs text-right">SPD</th>
                </tr>
              </thead>
              <tbody>
                {characters.map(char => (
                  <tr key={char.id}>
                    <td className="border border-black px-2 py-1 font-mono text-xs">
                      {char.name.toUpperCase()}
                    </td>
                    <td className="border border-black px-2 py-1 font-mono text-xs text-right font-bold">
                      {char.speed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cycle Target */}
        <div className="border-2 border-black bg-black text-white p-3 flex-shrink-0">
          <div className="font-mono text-xs mb-1">OBJECTIVE</div>
          <div className="font-mono text-xs">
            0-CYCLE: WIN BEFORE ENEMY TURN
          </div>
        </div>
      </div>
    </div>
  );
}