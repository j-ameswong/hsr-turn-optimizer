/**
 * Fetches character data from Mar-7th/StarRailRes and writes to src/data/characters.json
 * Run with: npm run fetch-data
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

// Trailblazer path overrides — deduplicate gender variants, use canonical male ID
const TRAILBLAZER_MAP: Record<string, { name: string; keep: boolean }> = {
  '8001': { name: 'Trailblazer (Destruction)', keep: true },
  '8002': { name: 'Trailblazer (Destruction)', keep: false }, // duplicate of 8001
  '8003': { name: 'Trailblazer (Preservation)', keep: true },
  '8004': { name: 'Trailblazer (Preservation)', keep: false }, // duplicate of 8003
  '8005': { name: 'Trailblazer (Harmony)', keep: true },
  '8006': { name: 'Trailblazer (Harmony)', keep: false },
  '8007': { name: 'Trailblazer (Remembrance)', keep: true },
  '8008': { name: 'Trailblazer (Remembrance)', keep: false },
};

// Map internal path names to display names used in-game
const PATH_MAP: Record<string, string> = {
  Knight: 'Preservation',
  Rogue: 'The Hunt',
  Mage: 'Erudition',
  Warlock: 'Nihility',
  Warrior: 'Destruction',
  Shaman: 'Harmony',
  Priest: 'Abundance',
  Memory: 'Remembrance',
  Elation: 'Elation',
};

// Paths eligible for DDD (Dance! Dance! Dance!) light cone
const DDD_ELIGIBLE_PATHS = new Set(['Harmony']);

interface RawCharacter {
  id: string;
  name: string;
  tag: string;
  rarity: number;
  path: string;
  element: string;
  max_sp: number;
  icon: string;
  preview: string;
  portrait: string;
}

interface RawPromotion {
  values: Array<{
    hp: { base: number; step: number };
    atk: { base: number; step: number };
    def: { base: number; step: number };
    spd: { base: number; step: number };
    taunt: { base: number; step: number };
    crit_rate: { base: number; step: number };
    crit_dmg: { base: number; step: number };
  }>;
}

async function fetchJson<T>(url: string): Promise<T> {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

async function main() {
  const [rawCharacters, rawPromotions] = await Promise.all([
    fetchJson<Record<string, RawCharacter>>(`${BASE_URL}/index_new/en/characters.json`),
    fetchJson<Record<string, RawPromotion>>(`${BASE_URL}/index_new/en/character_promotions.json`),
  ]);

  const characters = [];

  for (const [id, char] of Object.entries(rawCharacters)) {
    // Handle Trailblazer variants
    const numId = parseInt(id);
    const isTrailblazer = id in TRAILBLAZER_MAP;
    if (isTrailblazer) {
      const tb = TRAILBLAZER_MAP[id];
      if (!tb.keep) continue; // skip duplicate gender variant
    }

    // Skip non-playable characters (IDs outside 1001–1999 standard range + Trailblazer)
    const isStandardPlayable = numId >= 1001 && numId < 2000;
    if (!isStandardPlayable && !isTrailblazer) continue;

    // Get base speed from promotions data (first promotion tier, spd.base)
    // Speed does not increase with ascension in HSR, so any tier gives the same base
    const promotion = rawPromotions[id];
    if (!promotion || !promotion.values.length) {
      console.warn(`  No promotion data for ${char.name} (${id}), skipping`);
      continue;
    }
    const baseSpeed = promotion.values[0].spd.base;
    if (!baseSpeed || baseSpeed === 0) {
      console.warn(`  No speed data for ${char.name} (${id}), skipping`);
      continue;
    }

    const displayPath = PATH_MAP[char.path] ?? char.path;
    const dddEligible = DDD_ELIGIBLE_PATHS.has(displayPath);
    const name = isTrailblazer ? TRAILBLAZER_MAP[id].name : char.name;

    characters.push({
      id: char.tag || id, // prefer slug (e.g. "march-7th") over numeric id
      numericId: id,       // needed for asset URL construction
      name,
      path: displayPath,
      element: char.element,
      rarity: char.rarity,
      baseSpeed: Math.round(baseSpeed * 100) / 100, // round to 2 decimal places
      dddEligible,
    });
  }

  // Sort by name for readability
  characters.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`\nProcessed ${characters.length} characters`);

  const output = {
    _meta: {
      source: 'Mar-7th/StarRailRes',
      generatedAt: new Date().toISOString(),
      characterCount: characters.length,
    },
    characters,
  };

  const outPath = join(__dirname, '../src/data/characters.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
