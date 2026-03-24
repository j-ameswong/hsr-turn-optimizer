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
const DISPLAY_TO_PATH_NAME: Record<string, string> = {
  'The Hunt': 'Hunt',
};

export function pathIcon(displayPath: string): string {
  const name = DISPLAY_TO_PATH_NAME[displayPath] ?? displayPath;
  return `${BASE}/icon/path/${name}.png`;
}

/**
 * Element icon (e.g. "Fire", "Ice")
 */
export function elementIcon(element: string): string {
  return `${BASE}/icon/element/${element}.png`;
}

/**
 * Eagle Set
 */
export function eagleSet(): string {
  return `${BASE}/icon/relic/110.png`;
}

/**
 * Dance Dance Dance LC
 */
export function dddLc(): string {
  return `${BASE}/icon/light_cone/21018.png`;
}

/**
 * Vonwacq Planar Set
 */
export function vonwacq(): string {
  return `${BASE}/icon/relic/308.png`;
}
