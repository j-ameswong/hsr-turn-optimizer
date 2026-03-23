# HSR 0-Cycle Optimizer — Project Guide

## What this is
A Honkai Star Rail 0-cycle planning tool. Visualizes character and enemy turn order within a cycle boundary (150 AV for Memory of Chaos, 300 AV for Anomaly Arbitration). Pure simulation — no recommendations, assumes player knowledge of AV/speed mechanics.

## Running the project
```bash
npm run dev          # start dev server
npm run build        # production build
npm test             # run engine unit tests (vitest)
npm run fetch-data   # regenerate src/data/characters.json from Mar-7th/StarRailRes API
```

## Architecture

### Core principle
`TeamConfig` (React state) → `simulateCycle(config)` (pure function, `useMemo`) → `SimulationResult` (rendered). The simulation result is **never stored in state** — always derived.

### Key files
| File | Purpose |
|---|---|
| `src/lib/engine/simulator.ts` | Core `simulateCycle()` pure function — the heart of the app |
| `src/lib/engine/heap.ts` | Min-heap with lazy deletion (generation counters) |
| `src/lib/engine/types.ts` | All shared types: `TeamConfig`, `ResolvedTurn`, `ActionAssignment`, etc. |
| `src/lib/engine/simulator.test.ts` | Unit tests — run before any engine changes |
| `src/hooks/useTeamConfig.ts` | Central mutation API — all components use this, never raw setState |
| `src/hooks/useSimulation.ts` | `useMemo(simulateCycle, [config])` wrapper |
| `src/hooks/usePresets.ts` | localStorage CRUD for named presets |
| `src/hooks/useCharacterData.ts` | Loads `characters.json`, exports search |
| `src/data/characters.json` | Generated — do not edit by hand, run `npm run fetch-data` |
| `src/data/schema.ts` | Zod schemas for character data |
| `src/lib/assets.ts` | CDN URL builders for Mar-7th/StarRailRes images |
| `src/lib/persistence/localStorage.ts` | Versioned config + preset storage |
| `src/lib/persistence/urlEncoding.ts` | Base64url encode/decode `TeamConfig` for URL sharing |
| `src/styles/theme.css` | HSR dark theme (OKLch palette, gold/purple accents) |
| `scripts/fetch-characters.ts` | Scraper: pulls from Mar-7th/StarRailRes, writes characters.json |

### Component tree
```
App
├── AppHeader          (mode toggle MoC/AA, share, presets)
├── [Desktop] 3-panel grid
│   ├── CharacterRoster    (search + team slots + speed/relic controls)
│   ├── Timeline           (turn-by-turn, action picker, cut-in modal)
│   └── EnemyPanel + StatsPanel
├── [Mobile] tab-driven single column (MobileNav)
└── PresetManager      (save/load named configs)
```

## Game mechanics implemented

### AV formula
- Base AV between turns: `10000 / speed`
- Higher speed = lower AV = acts sooner

### Cycle limits
- Memory of Chaos: **150 AV**
- Anomaly Arbitration: **300 AV**
- Timeline shows all turns within limit + one sentinel turn past it

### Ally advance
`targetAV -= advancePct × (10000 / targetCurrentSpeed)`
> **Critical:** Advance is a % of the target's **base turn duration**, not their remaining AV. This is the actual game formula.

### Eagle set (Pioneer Diver of Dead Waters 4pc)
- Grants **25% self-advance** when the wearer uses their ult **outside their own turn** (cut-in only)
- Formula: `actorAV -= 0.25 × (10000 / actorSpeed)`
- Does NOT apply on ults used on the character's own turn

### Cut-ins
- Manually inserted by the user on enemy turn slots
- Stored as `{ type: 'cutin_ult', actorId }` on the enemy's `SlotKey`
- SlotKey format: `"cutin:robin:enemy_0:2"` = Robin cuts in on enemy_0's 2nd turn

### SlotKey identity
Each turn has a deterministic string key:
- Character turn: `"robin:3"` (Robin's 3rd turn)
- Enemy turn: `"enemy_0:2"` (first enemy's 2nd turn)
- Cut-in: `"cutin:robin:enemy_0:2"`

## Data & assets

### Character data
- Source: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/`
- `characters.json` for metadata, `character_promotions.json` for base speed
- Run `npm run fetch-data` on patch day, review diff, commit

### Assets
Direct CDN links to Mar-7th/StarRailRes — no local images:
```
Character icon:    .../icon/character/{numericId}.png
Character preview: .../image/character_preview/{numericId}.png
Path icon:         .../icon/path/{InternalPathName}.png
```
Path name mapping (display → internal): `The Hunt→Rogue, Erudition→Mage, Harmony→Shaman, Nihility→Warlock, Destruction→Warrior, Preservation→Knight, Abundance→Priest, Remembrance→Memory`

## Persistence
- **localStorage**: `hsr-optimizer-v1` (active config), `hsr-optimizer-presets-v1` (named presets)
- **URL sharing**: `TeamConfig` base64url-encoded in URL hash (`#config=...`)
- **Load priority**: URL hash → localStorage → default config

## What's deferred (not yet built)
- Energy tracking / ult availability
- SPD debuffs on enemies
- Delay effects on characters
- Follow-up attacks
- DDD (Dance! Dance! Dance!) mechanic — toggle exists but no engine effect yet

## Do not break
- `simulator.test.ts` must always pass — run `npm test` after any engine changes
- `characters.json` is generated — never edit by hand
- shadcn/ui components in `src/app/components/ui/` are unchanged — do not modify
- `ImageWithFallback` handles all portrait rendering — reuse it, don't replace with plain `<img>`
