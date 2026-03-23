import { useState } from 'react';
import { Search, X } from 'lucide-react';

const ALL_CHARACTERS = [
  { id: 'acheron', name: 'Acheron', speed: 100, element: 'Lightning', path: 'Nihility', rarity: 5 },
  { id: 'blade', name: 'Blade', speed: 100, element: 'Wind', path: 'Destruction', rarity: 5 },
  { id: 'bronya', name: 'Bronya', speed: 100, element: 'Wind', path: 'Harmony', rarity: 5 },
  { id: 'dhil', name: 'Dan Heng IL', speed: 100, element: 'Imaginary', path: 'Destruction', rarity: 5 },
  { id: 'fuxuan', name: 'Fu Xuan', speed: 100, element: 'Quantum', path: 'Preservation', rarity: 5 },
  { id: 'jingliu', name: 'Jingliu', speed: 100, element: 'Ice', path: 'Destruction', rarity: 5 },
  { id: 'kafka', name: 'Kafka', speed: 100, element: 'Lightning', path: 'Nihility', rarity: 5 },
  { id: 'luocha', name: 'Luocha', speed: 100, element: 'Imaginary', path: 'Abundance', rarity: 5 },
  { id: 'ruan-mei', name: 'Ruan Mei', speed: 100, element: 'Ice', path: 'Harmony', rarity: 5 },
  { id: 'seele', name: 'Seele', speed: 100, element: 'Quantum', path: 'Hunt', rarity: 5 },
  { id: 'silverwolf', name: 'Silver Wolf', speed: 100, element: 'Quantum', path: 'Nihility', rarity: 5 },
  { id: 'sparkle', name: 'Sparkle', speed: 100, element: 'Quantum', path: 'Harmony', rarity: 5 },
].sort((a, b) => a.name.localeCompare(b.name));

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

interface CharacterPanelProps {
  selectedCharacters: Character[];
  onAddCharacter: (character: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
}

const ITEMS_PER_PAGE = 5;

export function CharacterPanel({ selectedCharacters, onAddCharacter, onRemoveCharacter, onUpdateCharacter }: CharacterPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Fuzzy search
  const filteredCharacters = ALL_CHARACTERS.filter(char => {
    const query = searchQuery.toLowerCase();
    const name = char.name.toLowerCase();
    
    if (!query) return true;
    
    // Simple fuzzy match - check if all characters in query appear in order
    let queryIndex = 0;
    for (let i = 0; i < name.length && queryIndex < query.length; i++) {
      if (name[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === query.length;
  });

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  const paginatedCharacters = filteredCharacters.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleSelectCharacter = (char: typeof ALL_CHARACTERS[0]) => {
    if (selectedCharacters.some(c => c.id === char.id)) return;
    
    const newCharacter: Character = {
      ...char,
      danceDanceDance: false,
      eagleSet: false,
    };
    onAddCharacter(newCharacter);
  };

  // Create placeholders for empty slots
  const placeholders = Array.from({ length: 4 - selectedCharacters.length });

  return (
    <div className="border-2 border-black bg-gray-50 flex flex-col h-full overflow-hidden">
      <div className="border-b-2 border-black bg-white px-3 py-2 flex-shrink-0">
        <h2 className="font-mono font-bold text-sm">CHARACTER ROSTER</h2>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Team - Half height */}
        <div className="border-b-2 border-black bg-white flex flex-col" style={{ height: '50%' }}>
          <div className="border-b-2 border-black bg-black text-white px-2 py-1 flex-shrink-0">
            <div className="font-mono text-xs">TEAM ({selectedCharacters.length}/4)</div>
          </div>
          <div className="flex-1 p-2 grid grid-cols-2 gap-2">
            {selectedCharacters.map((char) => (
              <div key={char.id} className="border-2 border-black p-2 bg-gray-50 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold">{char.name.toUpperCase()}</span>
                  <button
                    onClick={() => onRemoveCharacter(char.id)}
                    className="hover:bg-gray-200 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-gray-600">SPD:</span>
                  <input
                    type="number"
                    value={char.speed}
                    onChange={(e) => onUpdateCharacter(char.id, { speed: parseInt(e.target.value) || 0 })}
                    className="flex-1 border border-black px-1 py-0.5 font-mono text-xs"
                  />
                </div>
                <div className="font-mono text-xs text-gray-600 mb-2">
                  {char.path} | {char.element}
                </div>
                <div className="space-y-1 mt-auto">
                  {char.path === 'Harmony' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={char.danceDanceDance}
                        onChange={(e) => onUpdateCharacter(char.id, { danceDanceDance: e.target.checked })}
                        className="cursor-pointer"
                      />
                      <span className="font-mono text-xs">DDD</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={char.eagleSet}
                      onChange={(e) => onUpdateCharacter(char.id, { eagleSet: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="font-mono text-xs">Eagle</span>
                  </label>
                </div>
              </div>
            ))}
            {placeholders.map((_, idx) => (
              <div 
                key={`placeholder-${idx}`}
                className="border-2 border-dashed border-gray-400 bg-gray-100 flex items-center justify-center"
              >
                <span className="font-mono text-xs text-gray-400">EMPTY</span>
              </div>
            ))}
          </div>
        </div>

        {/* Available Characters - Half height */}
        <div className="flex flex-col overflow-hidden" style={{ height: '50%' }}>
          <div className="border-b border-black bg-black text-white px-2 py-1 flex-shrink-0">
            <div className="font-mono text-xs">AVAILABLE</div>
          </div>
          
          {/* Search */}
          <div className="border-b border-black bg-white flex items-center px-2 py-1 flex-shrink-0">
            <Search className="w-3 h-3 mr-2" />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="flex-1 py-0.5 font-mono text-xs bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Character List - fills remaining space */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {paginatedCharacters.map(char => {
                const isSelected = selectedCharacters.some(c => c.id === char.id);
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectCharacter(char)}
                    disabled={selectedCharacters.length >= 4 || isSelected}
                    className={`w-full px-2 py-1.5 border-b border-black last:border-b-0 font-mono text-xs text-left transition-colors ${
                      isSelected 
                        ? 'bg-gray-200 cursor-not-allowed' 
                        : 'hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {char.name.toUpperCase()} - {char.path.toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-black bg-white px-2 py-1 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-2 py-0.5 border border-black font-mono text-xs disabled:opacity-50 hover:bg-black hover:text-white transition-colors"
                >
                  ◄
                </button>
                <span className="font-mono text-xs">
                  {currentPage + 1}/{totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-2 py-0.5 border border-black font-mono text-xs disabled:opacity-50 hover:bg-black hover:text-white transition-colors"
                >
                  ►
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
