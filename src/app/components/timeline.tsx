import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { RotateCcw } from 'lucide-react';

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

interface TimelineProps {
  characters: Character[];
  turns: any[];
  setTurns: (turns: any[]) => void;
}

interface TurnRowProps {
  turn: any;
  index: number;
  isFirstTurn: boolean;
  characters: Character[];
  onUpdateTarget: (index: number, target: string) => void;
  onApplyAction: (index: number, action: any) => void;
}

function TurnRow({ turn, index, isFirstTurn, characters, onUpdateTarget, onApplyAction }: TurnRowProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'ACTION',
    drop: (item: any) => {
      onApplyAction(index, item.action);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <tr 
      ref={drop}
      className={`${isFirstTurn ? 'bg-gray-200' : 'hover:bg-gray-50'} ${isOver ? 'bg-yellow-100' : ''}`}
    >
      <td className="border border-black px-2 py-1 font-mono text-xs text-center font-bold w-16">
        {index === 0 ? '0' : index}
        {isFirstTurn && <span className="ml-1">◄</span>}
      </td>
      <td className="border border-black px-2 py-1 font-mono text-xs">
        {turn.name.toUpperCase()}
      </td>
      <td className="border border-black px-1 py-1">
        <select
          value={turn.target || 'self'}
          onChange={(e) => onUpdateTarget(index, e.target.value)}
          className="w-full font-mono text-xs bg-transparent border border-black px-1 py-0.5"
        >
          <option value="self">Self</option>
          <option value="all">All</option>
          <option value="all-except-self">All Except Self</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>{char.name}</option>
          ))}
        </select>
      </td>
      <td className="border border-black px-2 py-1 font-mono text-xs text-right w-20">
        {turn.actionValue.toFixed(1)}
      </td>
      <td className="border border-black px-2 py-1 font-mono text-xs w-32">
        {turn.appliedAction ? (
          <span className="text-xs">{turn.appliedAction}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

export function Timeline({ characters, turns, setTurns }: TimelineProps) {
  // Calculate initial turn order based on speed
  const calculateTurnOrder = () => {
    const baseAV = 10000; // Base action value
    
    // Generate first 12 turns
    const timeline = [];
    const avTracker: Record<string, number> = {};
    
    characters.forEach(char => {
      avTracker[char.id] = baseAV / char.speed;
    });
    
    for (let i = 0; i < 12; i++) {
      // Find character with lowest AV
      let minAV = Infinity;
      let nextChar = null;
      
      for (const char of characters) {
        if (avTracker[char.id] < minAV) {
          minAV = avTracker[char.id];
          nextChar = char;
        }
      }
      
      if (nextChar) {
        timeline.push({
          id: Math.random().toString(36).substr(2, 9),
          characterId: nextChar.id,
          name: nextChar.name,
          element: nextChar.element,
          actionValue: avTracker[nextChar.id],
          turnNumber: i,
          target: 'self',
          appliedAction: null,
        });
        
        // Add AV for next turn
        avTracker[nextChar.id] += baseAV / nextChar.speed;
      }
    }
    
    setTurns(timeline);
  };

  const clearTimeline = () => {
    setTurns([]);
  };

  const updateTarget = (index: number, target: string) => {
    const newTurns = [...turns];
    if (newTurns[index]) {
      newTurns[index].target = target;
    }
    setTurns(newTurns);
  };

  const applyAction = (index: number, action: any) => {
    const newTurns = [...turns];
    if (newTurns[index]) {
      newTurns[index].appliedAction = action.name;
      // You could apply action advance and speed boosts here
    }
    setTurns(newTurns);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b-2 border-black bg-white px-3 py-2 flex items-center justify-between flex-shrink-0">
        <h2 className="font-mono font-bold text-sm">TURN TIMELINE</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={calculateTurnOrder}
            className="px-3 py-1 bg-white border-2 border-black font-mono text-xs hover:bg-black hover:text-white transition-colors"
          >
            CALCULATE
          </button>
          <button
            onClick={clearTimeline}
            className="px-2 py-1 bg-white border-2 border-black hover:bg-black hover:text-white transition-colors"
            title="Clear timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-hidden flex flex-col">
        {turns.length === 0 ? (
          <div className="border-2 border-black bg-white p-8 text-center flex-shrink-0">
            <p className="font-mono text-xs text-gray-600">
              NO DATA - CLICK CALCULATE TO BEGIN
            </p>
          </div>
        ) : (
          <div className="border-2 border-black bg-white flex-1 overflow-hidden flex flex-col">
            <table className="w-full">
              <thead className="flex-shrink-0">
                <tr className="bg-black text-white">
                  <th className="border border-black px-2 py-1 font-mono text-xs text-left">TURN</th>
                  <th className="border border-black px-2 py-1 font-mono text-xs text-left">CHARACTER</th>
                  <th className="border border-black px-2 py-1 font-mono text-xs text-left">TARGET</th>
                  <th className="border border-black px-2 py-1 font-mono text-xs text-right">AV</th>
                  <th className="border border-black px-2 py-1 font-mono text-xs text-left">APPLIED ACTION</th>
                </tr>
              </thead>
            </table>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {turns.map((turn, index) => (
                    <TurnRow
                      key={turn.id}
                      turn={turn}
                      index={index}
                      isFirstTurn={index === 0}
                      characters={characters}
                      onUpdateTarget={updateTarget}
                      onApplyAction={applyAction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {turns.length > 0 && (
          <div className="mt-3 border-2 border-black bg-white px-3 py-2 flex-shrink-0">
            <div className="font-mono text-xs">
              TOTAL TURNS: {turns.length} | DRAG ACTIONS TO APPLY
            </div>
          </div>
        )}
      </div>
    </div>
  );
}