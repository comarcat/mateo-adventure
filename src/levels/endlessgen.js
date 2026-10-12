// Endless world generator: produces the world chunk by chunk from a seed (same seed = same terrain).
// Reuses the campaign SEGMENTS, so every generated section is beatable (guaranteed jump distances).
// Zones (140 tiles) cycle through the 8 world themes; harder enemies unlock each zone; an elite mini-boss ends
// each normal zone and a major boss gate closes every 4th zone.
import { RNG, hashSeed } from '../engine/rng.js';
import { LevelBuilder, Cursor } from './builder.js';
import { SEGMENTS, PROFILES, pickWeighted } from './generator.js';

export const ZONE_TILES = 140, BOSS_EVERY = 4, CHUNK_MIN = 36;
export const ZONE_THEMES = ['grass', 'desert', 'ice', 'forest', 'water', 'volcano', 'sky', 'castle'];
const GROUND_ORDER = ['e', 'k', 't', 'r', 'w', 'h', 'm'], AIR_ORDER = ['b', 'v'];

export class EndlessGen {
  constructor(seed) {
    this.seed = String(seed); this.base = hashSeed(this.seed);
    this.col = 0; this.top = 11; this.index = 0; this.first = true; this.paused = false;
    this.lastCp = 0; this.lastSupply = 0; this.lastKind = 'run';
    this.nextBossCol = ZONE_TILES * BOSS_EVERY - 14; this.nextEliteCol = ZONE_TILES - 34;
  }
  static zoneAt(col) { return Math.floor(col / ZONE_TILES); }
  static isBossZone(z) { return z % BOSS_EVERY === BOSS_EVERY - 1; }
  resume() { this.paused = false; this.top = 11; this.nextBossCol += ZONE_TILES * BOSS_EVERY; this.lastCp = this.col; this.lastSupply = this.col; }

  // Enemy pools grow every zone ("new enemy types unlocked every zone"); difficulty d rises with the zone.
  profile(zone) {
    const base = PROFILES[1 + (zone % 8)];
    return { ground: GROUND_ORDER.slice(0, Math.min(GROUND_ORDER.length, 2 + zone)), air: zone >= 3 ? AIR_ORDER : [AIR_ORDER[0]], seg: base.seg, physics: base.physics };
  }

  // -> {rows:[14 strings], width, platforms:[px, relative], startCol}
  nextChunk() {
    const startCol = this.col, zone = EndlessGen.zoneAt(startCol);
    const rng = new RNG(hashSeed(this.seed + ':' + this.index));
    const prof = this.profile(zone), d = Math.min(1, 0.04 + zone * 0.09);
    const g = { rng, prof, d, index: 1, world: 1 + (zone % 8) };
    const b = new LevelBuilder(110, 14), c = new Cursor(b, this.top, 0);
    if (this.first) { c.flat(10, [['P', 2]]); this.first = false; } else c.flat(3);
    let gate = false;
    if (startCol + 40 > this.nextBossCol) {            // boss gate: a calm run-up, then the arena
      c.flat(14, [['Y', 10], ['a', 3]]); this.paused = true; gate = true;
    } else {
      while (c.x < CHUNK_MIN) {
        const abs = startCol + c.x; let kind;
        if (abs >= this.nextEliteCol && !EndlessGen.isBossZone(EndlessGen.zoneAt(this.nextEliteCol))) { c.flat(16, [['E', 8], ['a', 2], ['o', 4], ['o', 5]]); this.nextEliteCol += ZONE_TILES; continue; }
        if (abs >= this.nextEliteCol) this.nextEliteCol += ZONE_TILES;
        if (abs - this.lastCp > 38) { kind = 'checkpoint'; this.lastCp = abs; }
        else if (abs - this.lastSupply > 30) { kind = 'supply'; this.lastSupply = abs; }
        else {
          kind = pickWeighted(rng, prof.seg);
          if (kind === this.lastKind && ['crossing', 'spring', 'blocks'].includes(kind)) kind = 'run';
          if (kind === 'crossing' && abs - this.lastCp < 8) kind = 'run';
        }
        SEGMENTS[kind](c, g); this.lastKind = kind;
      }
    }
    const width = c.x;
    const rows = b.g.map((r) => r.slice(0, width).join(''));
    this.top = c.top; this.col += width; this.index++;
    return { rows, width, platforms: b.platforms.map((p) => ({ ...p })), startCol, gate };
  }
}
