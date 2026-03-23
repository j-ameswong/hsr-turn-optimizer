import { z } from 'zod';

export const HSR_PATHS = [
  'The Hunt',
  'Erudition',
  'Harmony',
  'Nihility',
  'Destruction',
  'Preservation',
  'Abundance',
  'Remembrance',
  'Elation',
] as const;
export type HSRPath = (typeof HSR_PATHS)[number];

export const HSR_ELEMENTS = [
  'Fire',
  'Ice',
  'Wind',
  'Thunder',
  'Physical',
  'Quantum',
  'Imaginary',
] as const;
export type HSRElement = (typeof HSR_ELEMENTS)[number];

// Paths eligible for Dance! Dance! Dance! light cone
export const DDD_ELIGIBLE_PATHS: HSRPath[] = ['Harmony'];

export const CharacterSchema = z.object({
  id: z.string(),
  numericId: z.string(),
  name: z.string(),
  path: z.string(), // loose — new paths may appear before schema update
  element: z.string(),
  rarity: z.union([z.literal(4), z.literal(5)]),
  baseSpeed: z.number().positive(),
  dddEligible: z.boolean(),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CharactersFileSchema = z.object({
  _meta: z.object({
    source: z.string(),
    generatedAt: z.string(),
    characterCount: z.number(),
  }),
  characters: z.array(CharacterSchema),
});
export type CharactersFile = z.infer<typeof CharactersFileSchema>;
