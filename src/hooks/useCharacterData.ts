import { useMemo } from 'react';
import type { Character } from '../data/schema';
import charactersFile from '../data/characters.json';

const allCharacters: Character[] = charactersFile.characters as Character[];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function useCharacterData() {
  return allCharacters;
}

export function useCharacterSearch(query: string): Character[] {
  const normalized = normalize(query);
  return useMemo(() => {
    if (!normalized) return allCharacters;
    return allCharacters.filter((c) => normalize(c.name).includes(normalized));
  }, [normalized]);
}

export function useCharacter(id: string): Character | undefined {
  return useMemo(() => allCharacters.find((c) => c.id === id), [id]);
}

export { allCharacters };
