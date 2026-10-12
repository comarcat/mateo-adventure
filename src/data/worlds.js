// World definitions: names, themes, level names/par times, bosses and overworld node layout.
// Level ids are "<world>-<n>"; n=4 is always the boss. Levels live in src/levels/.
import { RNG } from '../engine/rng.js';

export const WORLDS = [
  null,
  { id: 1, name: 'MEADOW LAND',  theme: 'grass',   boss: 'slimeking',  bossName: 'SLIME KING',
    levels: [['SUNNY MEADOW', 75], ['WOBBLE HILLS', 100], ['SPIKE CREEK', 120], ['SLIME KING', 90]] },
  { id: 2, name: 'DUSTY DUNES',  theme: 'desert',  boss: 'sandworm',   bossName: 'SAND WORM',
    levels: [['HOT SANDS', 80], ['OASIS RUN', 100], ['TOMB TROUBLE', 120], ['SAND WORM', 90]] },
  { id: 3, name: 'FROSTY PEAKS', theme: 'ice',     boss: 'yeti',       bossName: 'MR. FROST',
    levels: [['SNOW DAY', 80], ['SLIPPERY SLOPE', 100], ['ICICLE ALLEY', 120], ['MR. FROST', 90]] },
  { id: 4, name: 'WHISPER WOODS',theme: 'forest',  boss: 'owlbear',    bossName: 'GRAND OWL',
    levels: [['DEEP BRANCHES', 90], ['MUSHROOM MAZE', 110], ['THORN TRAIL', 120], ['GRAND OWL', 90]] },
  { id: 5, name: 'BUBBLE BAY',   theme: 'water',   boss: 'kraken',     bossName: 'KRAKEN KID',
    levels: [['TIDE POOLS', 90], ['CORAL CAVE', 110], ['SUNKEN SHIP', 130], ['KRAKEN KID', 90]] },
  { id: 6, name: 'EMBER PEAK',   theme: 'volcano', boss: 'magmagolem', bossName: 'MAGMA GOLEM',
    levels: [['LAVA LEDGES', 90], ['FIRE FALLS', 110], ['CINDER CAVES', 130], ['MAGMA GOLEM', 90]] },
  { id: 7, name: 'CLOUD CITY',   theme: 'sky',     boss: 'stormbird',  bossName: 'STORM BIRD',
    levels: [['WINDY PERCH', 90], ['PUFF PLATFORMS', 110], ['THUNDER TOWER', 130], ['STORM BIRD', 90]] },
  { id: 8, name: 'STAR CASTLE',  theme: 'castle',  boss: 'darkking',   bossName: 'THE DARK KING',
    levels: [['MOONLIT HALLS', 100], ['GRAVITY GARDEN', 120], ['THRONE CLIMB', 140], ['THE DARK KING', 120]] },
];

export const levelId = (w, n) => w + '-' + (n + 1);
export function parseLevelId(id) { const [w, n] = id.split('-').map(Number); return { world: w, index: n - 1 }; }
export function levelInfo(id) {
  const { world, index } = parseLevelId(id);
  const w = WORLDS[world]; if (!w) return null;
  const [name, par] = w.levels[index];
  return { id, world, index, name, par, boss: index === 3, theme: w.theme };
}

// Overworld layout for a world: 4 nodes joined by winding paths (SNES style), deterministic per world.
export function mapLayout(world) {
  const rng = new RNG(world * 7919);
  const xs = [34, 94, 158, 218];
  const ys = [];
  let y = 150 + rng.int(-10, 10);
  for (let i = 0; i < 4; i++) { ys.push(y); y = Math.max(78, Math.min(176, y + (i % 2 ? rng.int(10, 34) : -rng.int(24, 50)))); }
  const nodes = xs.map((x, i) => ({ x, y: ys[i] }));
  const paths = [];
  for (let i = 0; i < 3; i++) {
    const a = nodes[i], b = nodes[i + 1];
    const pts = [{ x: a.x, y: a.y }];
    const mx = (a.x + b.x) / 2, bend = rng.int(-18, 18);
    pts.push({ x: a.x + (mx - a.x) * 0.9, y: a.y + (b.y - a.y) * 0.1 + bend });
    pts.push({ x: mx, y: (a.y + b.y) / 2 + bend });
    pts.push({ x: b.x - (b.x - mx) * 0.9, y: b.y - (b.y - a.y) * 0.1 + bend });
    pts.push({ x: b.x, y: b.y });
    paths.push(pts);
  }
  return { nodes, paths };
}
