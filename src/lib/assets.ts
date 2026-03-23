/**
 * CDN URL builders for Mar-7th/StarRailRes asset repository.
 * Uses raw GitHub CDN — no local asset downloads needed.
 *
 * Repo: https://github.com/Mar-7th/StarRailRes
 */

const BASE = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master';

/**
 * Full character portrait (tall image used on character screen)
 */
export function characterPortrait(numericId: string): string {
  return `${BASE}/image/character_portrait/${numericId}.png`;
}

/**
 * Character preview image (medium, used in roster cards)
 */
export function characterPreview(numericId: string): string {
  return `${BASE}/image/character_preview/${numericId}.png`;
}

/**
 * Small character icon (used in timeline rows and team slots)
 */
export function characterIcon(numericId: string): string {
  return `${BASE}/icon/character/${numericId}.png`;
}

/**
 * Path icon (e.g. "Harmony", "Destruction")
 * The repo uses the internal path name, not the display name.
 */
const DISPLAY_TO_INTERNAL: Record<string, string> = {
  'The Hunt': 'Rogue',
  Erudition: 'Mage',
  Harmony: 'Shaman',
  Nihility: 'Warlock',
  Destruction: 'Warrior',
  Preservation: 'Knight',
  Abundance: 'Priest',
  Remembrance: 'Memory',
  Elation: 'Elation',
};

export function pathIcon(displayPath: string): string {
  const internal = DISPLAY_TO_INTERNAL[displayPath] ?? displayPath;
  return `${BASE}/icon/path/${internal}.png`;
}

/**
 * Element icon (e.g. "Fire", "Ice")
 */
export function elementIcon(element: string): string {
  return `${BASE}/icon/element/${element}.png`;
}
