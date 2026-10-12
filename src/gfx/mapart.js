// SNES-style overworld art: terrain, decorations, paths, level nodes. Baked once per world.
import { W, H } from '../config.js';
import { mk } from './sprites.js';
import { THEMES } from './themes.js';
import { RNG } from '../engine/rng.js';
import { mapLayout } from '../data/worlds.js';

const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const OUT = '#2a1b3d';

function ell(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
  }
}

const DECOR = {
  tree(g, x, y, th) { R(g, OUT, x + 4, y + 8, 4, 6); R(g, '#8a5a2a', x + 5, y + 8, 2, 5); ell(g, x + 6, y + 5, 6, 6, OUT); ell(g, x + 6, y + 5, 5, 5, '#2f9a3a'); R(g, '#6ad870', x + 3, y + 2, 3, 2); },
  cactus(g, x, y) { R(g, OUT, x + 4, y, 5, 14); R(g, '#3fae4a', x + 5, y + 1, 3, 12); R(g, OUT, x, y + 5, 5, 3); R(g, '#3fae4a', x + 1, y + 6, 3, 1); R(g, OUT, x + 8, y + 3, 5, 3); R(g, '#3fae4a', x + 9, y + 4, 3, 1); },
  pine(g, x, y) { for (let i = 0; i < 3; i++) { const w = 4 + i * 3; R(g, OUT, x + 6 - w / 2 - 1, y + i * 4, w + 2, 5); R(g, '#2a7a58', x + 6 - w / 2, y + i * 4 + 1, w, 3); R(g, '#fff', x + 6 - w / 2, y + i * 4 + 1, w, 1); } R(g, '#6a4428', x + 5, y + 12, 2, 3); },
  coral(g, x, y) { R(g, OUT, x + 3, y + 4, 3, 10); R(g, '#ff7a9a', x + 4, y + 5, 1, 8); R(g, OUT, x + 7, y, 3, 14); R(g, '#ff9ab0', x + 8, y + 1, 1, 12); R(g, OUT, x + 5, y + 8, 6, 2); },
  rock(g, x, y) { ell(g, x + 6, y + 9, 7, 5, OUT); ell(g, x + 6, y + 9, 6, 4, '#7a5a58'); R(g, '#a08080', x + 3, y + 7, 3, 1); R(g, '#e8501a', x + 8, y + 10, 2, 1); },
  puff(g, x, y) { ell(g, x + 6, y + 8, 7, 4, '#fff'); ell(g, x + 4, y + 6, 4, 4, '#fff'); ell(g, x + 9, y + 6, 4, 3, '#eaf4ff'); },
  crystal(g, x, y) { for (const [dx, h, c] of [[2, 10, '#a080e0'], [6, 14, '#c0a0ff'], [10, 8, '#8a6ad0']]) { R(g, OUT, x + dx - 1, y + 14 - h, 5, h); R(g, c, x + dx, y + 15 - h, 3, h - 2); R(g, '#fff', x + dx, y + 15 - h, 1, 3); } },
};

const cache = {};
export function mapBackground(world, themeName) {
  if (cache[world]) return cache[world];
  const th = THEMES[themeName], m = th.map, layout = mapLayout(world), rng = new RNG(world * 31);
  const [c, g] = mk(W, H);
  R(g, m.water, 0, 0, W, H);
  // wavy island: land fills an inset rounded area
  for (let x = 0; x < W; x++) {
    const top = 30 + Math.round(Math.sin(x * 0.07 + world) * 4), bot = H - 14 + Math.round(Math.sin(x * 0.09 + world * 2) * 4);
    const edge = x < 10 ? 10 - x : (x > W - 10 ? x - (W - 10) : 0);
    R(g, m.land, x, top + edge, 1, bot - top - edge * 2);
    R(g, '#ffffff33', x, top + edge, 1, 1);
  }
  for (let i = 0; i < 26; i++) ell(g, rng.int(14, W - 14), rng.int(50, H - 30), rng.int(8, 22), rng.int(5, 10), m.land2);
  // water sparkles
  for (let i = 0; i < 20; i++) R(g, '#ffffff55', rng.int(0, W), rng.int(0, H), 3, 1);
  // path dots
  const pts = [];
  layout.paths.forEach((p) => {
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4);
      for (let k = 0; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n; pts.push([x, y]); }
    }
  });
  pts.forEach(([x, y]) => { R(g, OUT, x - 2, y - 2, 4, 4); });
  pts.forEach(([x, y]) => { R(g, m.path, x - 1, y - 1, 2, 2); });
  // decorations away from the path
  const decor = DECOR[m.decor];
  let tries = 0, placed = 0;
  while (placed < 22 && tries++ < 400) {
    const x = rng.int(8, W - 22), y = rng.int(40, H - 40);
    if (pts.some(([px, py]) => Math.abs(px - x - 6) < 14 && Math.abs(py - y - 8) < 14)) continue;
    if (layout.nodes.some((n) => Math.abs(n.x - x - 6) < 22 && Math.abs(n.y - y - 8) < 22)) continue;
    decor(g, x, y, th); placed++;
  }
  return (cache[world] = c);
}

// Level node icons (16x16): state 'open' (red), 'cleared' (green), 'locked' (grey), boss (castle)
const nodeCache = {};
export function nodeIcon(kind) {
  if (nodeCache[kind]) return nodeCache[kind];
  const [c, g] = mk(18, 18);
  if (kind === 'boss' || kind === 'bossDone' || kind === 'bossLocked') {
    const body = kind === 'bossLocked' ? '#8a8aa0' : '#c8c8e0', roof = kind === 'bossLocked' ? '#6a6a80' : (kind === 'bossDone' ? '#37d46a' : '#e0453a');
    R(g, OUT, 2, 6, 14, 12); R(g, body, 3, 7, 12, 10); R(g, OUT, 2, 3, 4, 5); R(g, OUT, 12, 3, 4, 5); R(g, roof, 3, 4, 2, 3); R(g, roof, 13, 4, 2, 3);
    R(g, OUT, 7, 1, 4, 7); R(g, roof, 8, 2, 2, 5); R(g, OUT, 7, 11, 4, 7); R(g, '#3a2a58', 8, 12, 2, 6);
    R(g, '#fff', 4, 8, 2, 1);
  } else {
    const fill = kind === 'cleared' ? '#37d46a' : (kind === 'locked' ? '#8a8aa0' : '#e0453a'), hi = kind === 'cleared' ? '#a0ffc0' : (kind === 'locked' ? '#b0b0c8' : '#ff9a8a');
    ell(g, 9, 9, 8.5, 8.5, OUT); ell(g, 9, 9, 7, 7, fill); R(g, hi, 5, 4, 4, 2); R(g, hi, 4, 6, 2, 2);
    if (kind === 'cleared') { R(g, '#fff', 5, 9, 2, 2); R(g, '#fff', 7, 11, 2, 2); R(g, '#fff', 9, 8, 2, 4); R(g, '#fff', 11, 6, 2, 3); }
    if (kind === 'locked') { R(g, OUT, 7, 8, 5, 5); R(g, OUT, 8, 5, 3, 4); }
  }
  return (nodeCache[kind] = c);
}
