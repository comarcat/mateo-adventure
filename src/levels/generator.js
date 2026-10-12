// Level composer: builds a level left-to-right from reusable "segments" using the fairness-checked Cursor.
// Campaign worlds 2-8 use it with a per-world profile; endless mode uses the same segments chunk by chunk.
// Every segment guarantees: pits <= MAX_PIT, ledges <= MAX_UP, hazards/enemies keep clear of pit edges.
import { RNG } from '../engine/rng.js';
import { LevelBuilder, Cursor } from './builder.js';
import { levelInfo } from '../data/worlds.js';
import { MUSIC_BY_WORLD } from '../audio/tracks.js';

// seg = relative weights of each segment type; ground/air = enemy chars available (earlier = more common/earlier in the world)
export const PROFILES = {
  1: { ground: ['e', 'k', 't', 'r'], air: ['b'], seg: { run: 3, gap: 2, hill: 2.5, steps: 1.5, spikes: 1.5, planks: 1.5, arena: 2, blocks: 1.5, spring: 0.6, crossing: 0.3 } },
  2: { ground: ['e', 'k', 'r', 'w'], air: ['b'], seg: { run: 3, gap: 1, hill: 3, steps: 1, spikes: 3, planks: 1, arena: 3, blocks: 1, spring: 0.5, crossing: 0 } },
  3: { ground: ['e', 'h', 'w', 'k'], air: ['b'], seg: { run: 2, gap: 1.5, hill: 4, steps: 2, spikes: 3, planks: 1, arena: 2, blocks: 1, spring: 0.5, crossing: 0 }, physics: { slick: true }, noCrossing: true },   // no lifts on ice: you can't stop precisely on slippery floors
  4: { ground: ['m', 'h', 't', 'r', 'w'], air: ['b'], seg: { run: 2, gap: 1.5, hill: 2, steps: 1.5, spikes: 1.5, planks: 3.5, arena: 2, blocks: 1.5, spring: 2, crossing: 0.5 } },
  5: { ground: ['m', 't', 'w', 'h'], air: ['v', 'b'], seg: { run: 2, gap: 2.5, hill: 1.5, steps: 1.5, spikes: 1.5, planks: 3, arena: 2, blocks: 1, spring: 1, crossing: 1 }, physics: { grav: 0.7, jump: 0.92 } },
  6: { ground: ['r', 'w', 'k', 'm', 't'], air: ['v'], seg: { run: 2, gap: 3, hill: 2, steps: 1.5, spikes: 3, planks: 1.5, arena: 3, blocks: 1, spring: 0.5, crossing: 1.5 } },
  7: { ground: ['h', 'w', 't', 'm'], air: ['v', 'b'], seg: { run: 1, gap: 3, hill: 1, steps: 1, spikes: 1, planks: 4, arena: 1.5, blocks: 1, spring: 1.5, crossing: 2.5 } },
  8: { ground: ['w', 'r', 'm', 't', 'k', 'h'], air: ['v'], seg: { run: 1.5, gap: 2, hill: 1.5, steps: 2.5, spikes: 3, planks: 2, arena: 3.5, blocks: 1, spring: 1, crossing: 1.5 } },
};

export const pickWeighted = (rng, table) => {
  const e = Object.entries(table).filter(([, w]) => w > 0), total = e.reduce((a, [, w]) => a + w, 0);
  let r = rng.next() * total;
  for (const [k, w] of e) { if ((r -= w) <= 0) return k; }
  return e[e.length - 1][0];
};
const coinsArc = (n, base = 2) => Array.from({ length: n }, (_, i) => ['o', i, base + (i === 0 || i === n - 1 ? 0 : 1)]);

// g = generation context: {rng, prof, d (0..1 difficulty), index, supplyCd, flags}
function enemy(g, air = false) {
  const pool = air ? g.prof.air : g.prof.ground;
  const avail = air ? pool : pool.slice(0, Math.min(pool.length, 2 + Math.floor(g.d * (pool.length - 1) + 0.5)));   // harder types only later
  return g.rng.pick(avail);
}
function enemySlots(g, n, maxCount) {
  const out = [];
  const cnt = Math.min(maxCount, Math.floor(1.3 + g.d * 1.7 + g.rng.next()));
  for (let dx = 2; dx <= n - 5 && out.length < cnt; dx += 3) if (g.rng.next() < 0.9) out.push(dx);
  return out;
}

export const SEGMENTS = {
  run(c, g) {
    const n = g.rng.int(9, 13), items = [];
    for (const dx of enemySlots(g, n, 3)) items.push([enemy(g), dx, 0]);
    if (g.rng.chance(0.5)) for (let i = 0; i < 4; i++) items.push(['o', 1 + i, 1]);
    c.flat(n, items);
  },
  gap(c, g) {
    const n = g.rng.chance(0.4 + g.d * 0.4) ? 3 : 2;
    c.flat(3); c.pit(n, coinsArc(n)); c.flat(3);
  },
  hill(c, g) {
    const h = g.rng.int(1, Math.min(3, 1 + Math.round(g.d * 2) + 1)), plat = g.rng.int(1, 3);
    if (c.top - h < 6) return SEGMENTS.run(c, g);
    const items = [['o', h, h + 1], ['o', h + 1, h + 1]];
    if (plat >= 3 && g.rng.chance(0.5 + g.d * 0.3)) items.push([enemy(g), h + 1, h]);
    c.hill(h, plat, items);
    c.flat(2);
  },
  steps(c, g) {
    const up = c.top > 9 && (c.top >= 12 || g.rng.chance(0.55)), d = g.rng.int(1, 2);
    if (up && c.top - d >= 8) c.step(d); else if (c.top + d <= 12) c.drop(d); else if (c.top - d >= 8) c.step(d);
    const n = g.rng.int(8, 11), items = [];
    for (const dx of enemySlots(g, n, 2)) items.push([enemy(g), dx, 0]);
    c.flat(n, items);
  },
  spikes(c, g) {
    const n = g.rng.int(1, Math.min(3, 1 + Math.round(g.d * 2)));
    c.flat(2); c.spikes(n, [['o', 1, 3], ['o', 2, 3], ...(n > 1 ? [['o', 3, 3]] : [])]); c.flat(3);
  },
  planks(c, g) {
    const n = g.rng.int(10, 13), len = g.rng.int(4, 6), up = g.rng.int(1, 2), items = [];
    for (const dx of enemySlots(g, n, 2)) items.push([enemy(g), dx, 0]);
    if (g.prof.air.length && g.rng.chance(0.4 + g.d * 0.3)) items.push([enemy(g, true), 3 + len, up + 2]);
    c.flat(n, items); c.plank(2, up, len); c.coins(2, up + 1, len - 1);
  },
  arena(c, g) {
    const n = 12, items = [];
    for (const dx of [2, 5, 7]) if (g.rng.next() < 0.7 + g.d * 0.3) items.push([enemy(g), dx, 0]);
    if (!items.length) items.push([enemy(g), 4, 0]);
    c.flat(n, items);
  },
  blocks(c, g) {
    const contents = ['coin', 'coin', 'apple', g.rng.pick(['gun', 'shield', 'laser'])];
    c.flat(8); contents.forEach((ct, i) => c.block(1 + i, 3, ct));
  },
  spring(c, g) {
    const reward = g.rng.pick(['a', 's', 'l', 'o']);
    c.flat(10, [['S', 3]]); c.plank(5, 4, 5, true); c.coins(5, 5, 4); c.b.set(c.mark + 6, c.top - 1 - 5, reward === 'o' ? 'o' : reward);
  },
  crossing(c, g) { c.flat(3); c.crossing(14); c.flat(3); },
  supply(c, g) {
    const item = g.rng.pick(['g', 's', 'a', 'l', 'a']);
    c.flat(7, [[item, 3], ['o', 2], ['o', 4]]);
  },
  checkpoint(c, g) { c.flat(6, [['C', 2]]); },
};

// Guarantee a minimum number of enemies: top up on flat, hazard-free ground that is far from pits, the start and the goal.
function topUpEnemies(b, g, target, minCol, maxCol) {
  const grid = b.g, h = b.h;
  const floorRow = (c) => { for (let r = 0; r < h; r++) { const ch = grid[r][c]; if (ch === '#' || ch === 'B' || ch === '/' || ch === '\\') return ch === '#' || ch === 'B' ? r : -2; } return -1; };
  const ENEMY = new Set(['e', 'k', 'b', 't', 'r', 'w', 'h', 'm', 'v']);
  let have = 0; for (let r = 0; r < h; r++) for (let c = 0; c < b.w; c++) if (ENEMY.has(grid[r][c])) have++;
  const cols = []; for (let c = minCol; c < maxCol; c++) cols.push(c);
  for (let i = cols.length - 1; i > 0; i--) { const j = g.rng.int(0, i); [cols[i], cols[j]] = [cols[j], cols[i]]; }     // seeded shuffle
  const placed = [];
  for (const c of cols) {
    if (have >= target) break;
    if (placed.some((p) => Math.abs(p - c) < 5)) continue;
    const fr = floorRow(c); if (fr < 3) continue;
    let ok = true;
    for (let k = -5; k <= 5 && ok; k++) if (floorRow(c + k) !== fr) ok = false;                 // flat, no pits/slopes/steps nearby
    for (let k = -3; k <= 3 && ok; k++) for (let r = fr - 3; r < fr && ok; r++) if (grid[r][c + k] !== '.') ok = false;   // nothing else standing there
    if (!ok) continue;
    grid[fr - 1][c] = g.rng.pick(g.prof.ground.slice(0, Math.min(g.prof.ground.length, 2 + Math.round(g.d * (g.prof.ground.length - 1)))));
    placed.push(c); have++;
  }
}

// Target enemy count for a campaign level (rises with the world and the level number, scaled for the longer levels).
export const enemyTarget = (world, index) => Math.round((6 + world * 1.6 + index * 3) * 2.2);
export const levelLength = (world, index) => 250 + index * 95 + world * 14;

// Appends segments to a Cursor until it reaches `length` columns. Shared by composed levels and the long hand-authored world 1 levels.
export function fillSegments(c, g, length, state = { lastCp: c.x, lastSupply: c.x, lastKind: 'run' }) {
  const weights = { ...g.prof.seg }; weights.arena = (weights.arena || 0) + 1.5;
  if (g.index === 0) weights.crossing = Math.min(weights.crossing || 0, 0.4);
  if (g.index === 2) weights.crossing = (weights.crossing || 0) + 0.6;
  if (g.prof.noCrossing) weights.crossing = 0;
  while (c.x < length) {
    let kind;
    if (c.x - state.lastCp > 38) { kind = 'checkpoint'; state.lastCp = c.x; }
    else if (c.x - state.lastSupply > 34) { kind = 'supply'; state.lastSupply = c.x; }
    else {
      kind = pickWeighted(g.rng, weights);
      if (kind === state.lastKind && ['crossing', 'spring', 'blocks'].includes(kind)) kind = 'run';
      if (kind === 'crossing' && c.x - state.lastCp < 8) kind = 'run';
    }
    SEGMENTS[kind](c, g); state.lastKind = kind;
  }
  return state;
}

// Deterministic: tries a few seed offsets and keeps the first level with enough enemies (>= 75% of the target).
export function composeLevel(world, index, seedOffset = 0) {
  const target = enemyTarget(world, index);
  let best = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const d = composeOnce(world, index, seedOffset + attempt * 131);
    const n = d.tiles.join('').split('').filter((c) => 'ekbtrwhmv'.includes(c)).length;
    if (!best || n > best.n) best = { d, n };
    if (n >= target * 0.75) return d;
  }
  return best.d;
}

function composeOnce(world, index, seedOffset) {
  const info = levelInfo(world + '-' + (index + 1)), prof = PROFILES[world];
  const rng = new RNG(world * 1009 + index * 7919 + seedOffset);
  const d = Math.min(1, ((world - 2) / 6) * 0.6 + (index / 2) * 0.4);
  const g = { rng, prof, d, index, world };
  const length = levelLength(world, index);
  const b = new LevelBuilder(length + 80, 14), c = new Cursor(b, 11, 0);
  c.flat(10, [['P', 2]]);
  fillSegments(c, g, length);
  c.flat(16, [['G', 12], ['o', 3], ['o', 4], ['o', 5], ['o', 6]]);
  topUpEnemies(b, g, enemyTarget(world, index), 16, c.x - 24);
  return b.build({ id: world + '-' + (index + 1), name: info.name, world, theme: info.theme, par: Math.round(c.x * 0.3), music: MUSIC_BY_WORLD[world], physics: prof.physics });
}
