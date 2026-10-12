// Procedurally drawn art for enemies, pickups and coins. Original designs, no external assets.
import { mk, fromCanvas } from './sprites.js';

const OUT = '#2a1b3d';
const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function ell(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
  }
}
function blob(g, cx, cy, rx, ry, fill, line = OUT) { ell(g, cx, cy, rx + 1, ry + 1, line); ell(g, cx, cy, rx, ry, fill); }

// ------------------------------------------------------------------ enemies (16x16, facing right)
function gloopy() {   // Gloopy: a happy green slime that wobbles
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    const ry = f ? 5.5 : 6.5, rx = f ? 7 : 6;
    blob(g, 8, 16 - ry + 0.5, rx, ry, '#5fd35a');
    R(g, '#a8f08a', 4, 16 - ry * 2 + 3, 3, 1);
    R(g, '#2f9a3a', 3, 14, 10, 1);
    R(g, '#fff', 4, 8 + f, 3, 3); R(g, '#fff', 9, 8 + f, 3, 3);
    R(g, OUT, 5, 9 + f, 2, 2); R(g, OUT, 10, 9 + f, 2, 2);
    R(g, OUT, 7, 12 + f, 3, 1);
    return fromCanvas(c);
  });
}
function pricklit() {   // Pricklit: spiky red hedgehog-ball, never stomp it
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    for (const x of [2, 5, 8, 11]) {     // spikes
      for (let i = 0; i < 5; i++) R(g, i < 1 ? '#fff4c8' : '#ffe08a', x + 1 + (i ? 0 : 1), 2 + 4 - i, Math.max(1, 3 - i), 1);
      R(g, OUT, x, 5, 1, 1);
    }
    blob(g, 8, 11.5, 6.5, 4.5, '#e0453a');
    R(g, '#ff8a70', 4, 8, 3, 1);
    R(g, '#fff', 8, 9, 3, 3); R(g, OUT, 9, 10, 2, 2); R(g, OUT, 7, 8, 5, 1);
    R(g, OUT, 3 + f * 2, 15, 3, 1); R(g, OUT, 10 - f * 2, 15, 3, 1);
    return fromCanvas(c);
  });
}
function flutter() {    // Flutterbug: a purple bat-bug with flappy wings
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    const wy = f ? 8 : 2;
    for (const [x0, dir] of [[0, 1], [10, -1]]) {
      R(g, OUT, x0, wy, 6, 6); R(g, '#a07af0', x0 + 1, wy + 1, 4, 4);
      if (f) R(g, '#c8b0ff', x0 + 1, wy + 1, 4, 1); else R(g, '#c8b0ff', x0 + 1, wy + 3, 4, 1);
    }
    blob(g, 8, 9, 4, 4, '#7a4ac8');
    R(g, '#ffe14a', 5, 8, 2, 2); R(g, '#ffe14a', 9, 8, 2, 2); R(g, OUT, 6, 9, 1, 1); R(g, OUT, 10, 9, 1, 1);
    R(g, '#fff', 7, 12, 1, 1); R(g, '#fff', 9, 12, 1, 1);
    return fromCanvas(c);
  });
}
function popPod() {     // Pop Pod: plant that spits seeds
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    R(g, OUT, 6, 8, 5, 8); R(g, '#3fae4a', 7, 8, 3, 8); R(g, '#7be07a', 7, 8, 1, 8);
    R(g, OUT, 2, 11, 5, 3); R(g, '#3fae4a', 3, 12, 3, 1);
    R(g, OUT, 10, 11, 5, 3); R(g, '#3fae4a', 11, 12, 3, 1);
    blob(g, 7, 5, 5.5, 4.5, '#e8453a');
    R(g, '#fff', 3, 3, 2, 2); R(g, '#fff', 6, 1, 2, 2);
    if (f) { R(g, OUT, 10, 2, 5, 6); R(g, '#7a1020', 11, 3, 4, 4); } else { R(g, OUT, 11, 4, 4, 3); R(g, '#7a1020', 12, 5, 3, 1); }
    R(g, '#fff', 9, 3, 2, 2); R(g, OUT, 10, 4, 1, 1);
    return fromCanvas(c);
  });
}
function rammo() {      // Rammo: a stubby brown bull-critter that charges
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    R(g, OUT, 3 + f, 13, 3, 3); R(g, OUT, 10 - f, 13, 3, 3);
    blob(g, 7, 9, 6, 4.5, '#b8743a');
    R(g, '#d99a5a', 3, 6, 4, 1);
    blob(g, 12, 8, 3.5, 3.5, '#d08a48');
    R(g, '#fff', 12, 4, 2, 4 - 2); R(g, '#fff', 14, 2, 1, 3); R(g, '#fff', 11, 3, 1, 2);
    R(g, '#fff', 11, 7, 2, 2); R(g, OUT, 12, 8, 1, 1);
    R(g, '#ff9aa2', 14, 9, 2, 2);
    return fromCanvas(c);
  });
}
export const ENEMY_ART = { blob: gloopy(), spiky: pricklit(), bat: flutter(), pod: popPod(), charger: rammo() };

// ------------------------------------------------------------------ items
function badge(g, fill, line = OUT) { ell(g, 7, 7, 7, 7, line); ell(g, 7, 7, 6, 6, fill); R(g, 'rgba(255,255,255,0.45)', 3, 2, 4, 1); }
function item(fn, size = 14) { const [c, g] = mk(size, size); fn(g); return fromCanvas(c); }

export const ITEM_ART = {
  star: item((g) => {
    const rows = ['.....oo.....', '.....yy.....', '....oyyo....', 'ooooyyyyoooo', 'oyyyywwyyyyo', '.oyyyyyyyyo.', '..oyyyyyyo..', '..oyyyyyyo..', '.oyyyooyyyo.', '.oyyo..oyyo.', '.oyo....oyo.', '..o......o..'];
    const pal = { o: OUT, y: '#ffd84a', w: '#fff6b0' };
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) R(g, pal[ch], x + 1, y + 1, 1, 1); }));
  }),
  oneup: item((g) => {
    badge(g, '#37d46a');
    R(g, OUT, 4, 3, 6, 3); R(g, '#ff9a2e', 5, 3, 4, 2); R(g, '#fff', 6, 1, 2, 2);
    R(g, '#ffd0a0', 4, 6, 6, 4); R(g, OUT, 5, 7, 1, 2); R(g, OUT, 8, 7, 1, 2);
  }),
  shield: item((g) => {
    badge(g, '#4a9aff');
    for (let y = 2; y < 12; y++) { const hw = y < 7 ? 3 : Math.max(0, 3 - (y - 6)); R(g, '#eaf4ff', 7 - hw, y, hw * 2, 1); }
    R(g, '#4a9aff', 6, 4, 2, 5); R(g, '#4a9aff', 4, 5, 6, 2);
  }),
  gun: item((g) => {
    badge(g, '#7a7f98');
    R(g, OUT, 2, 4, 10, 4); R(g, '#ffd84a', 3, 5, 8, 2); R(g, OUT, 3, 7, 4, 4); R(g, '#e8a020', 4, 8, 2, 2); R(g, '#fff', 11, 5, 2, 2);
  }),
  laser: item((g) => {
    badge(g, '#2a2e6a');
    R(g, '#7af0ff', 2, 6, 10, 2); R(g, '#fff', 3, 6, 8, 1); R(g, '#7af0ff', 2, 3, 3, 1); R(g, '#7af0ff', 9, 10, 3, 1); R(g, '#7af0ff', 5, 4, 1, 2); R(g, '#7af0ff', 8, 8, 1, 2);
  }),
  apple: item((g) => {
    blob(g, 7, 8, 5, 4.5, '#ff4a4a'); R(g, '#ffa0a0', 4, 5, 2, 2);
    R(g, OUT, 7, 1, 1, 3); R(g, '#3fae4a', 8, 1, 3, 2);
  }),
  pizza: item((g) => {
    for (let y = 2; y < 13; y++) { const hw = Math.floor((y - 1) * 0.55) + 1; R(g, OUT, 7 - hw - 1, y, hw * 2 + 2, 1); }
    for (let y = 2; y < 13; y++) { const hw = Math.floor((y - 1) * 0.55) + 1; R(g, y < 4 ? '#c8873a' : '#ffd84a', 7 - hw, y, hw * 2, 1); }
    R(g, '#e0453a', 6, 6, 2, 2); R(g, '#e0453a', 4, 9, 2, 2); R(g, '#e0453a', 8, 10, 2, 2);
  }),
};

// ------------------------------------------------------------------ DUCK coin (12x12) with spin frames
const coinBase = (() => {
  const [c, g] = mk(12, 12);
  ell(g, 6, 6, 6, 6, OUT); ell(g, 6, 6, 5, 5, '#ffcf2a'); ell(g, 6, 6, 3.6, 3.6, '#f0a818');
  R(g, '#fff2a0', 2, 3, 1, 3);
  // duck emblem (white duck, orange beak)
  R(g, '#fff', 5, 3, 3, 3); R(g, '#fff', 3, 6, 6, 2); R(g, '#fff', 2, 6, 1, 1);
  R(g, OUT, 6, 4, 1, 1); R(g, '#ff7a1a', 8, 5, 2, 1); R(g, '#d8c070', 4, 7, 3, 1);
  return c;
})();
const SPIN = [12, 9, 5, 2, 5, 9];
export function drawCoin(ctx, x, y, t) {
  const w = SPIN[Math.floor(t / 6) % SPIN.length];
  ctx.drawImage(coinBase, 0, 0, 12, 12, Math.round(x + (12 - w) / 2), Math.round(y), w, 12);
}
export const COIN_ICON = coinBase;

// ------------------------------------------------------------------ shield bubble ring (24x24)
export const SHIELD_RING = (() => {
  const [c, g] = mk(24, 24);
  g.fillStyle = 'rgba(122,240,255,0.25)'; ell(g, 12, 12, 11, 11, 'rgba(122,240,255,0.28)');
  for (let a = 0; a < 360; a += 3) { const r = a * Math.PI / 180; R(g, '#cffaff', Math.round(12 + Math.cos(r) * 11), Math.round(12 + Math.sin(r) * 11), 1, 1); }
  R(g, '#fff', 5, 5, 3, 1); R(g, '#fff', 4, 6, 1, 2);
  return c;
})();

// ------------------------------------------------------------------ question blocks
export function bakeBlocks() {
  const mkBlock = (used) => {
    const [c, g] = mk(16, 16);
    R(g, OUT, 0, 0, 16, 16); R(g, used ? '#8a7a68' : '#ffb82a', 1, 1, 14, 14);
    R(g, used ? '#a89a88' : '#ffe27a', 1, 1, 14, 1); R(g, used ? '#6e6050' : '#c87a10', 1, 14, 14, 1);
    for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) R(g, used ? '#6e6050' : '#8a4a10', x, y, 2, 2);
    if (!used) {
      R(g, OUT, 5, 3, 6, 2); R(g, OUT, 9, 4, 2, 3); R(g, OUT, 7, 6, 3, 2); R(g, OUT, 7, 9, 2, 2);
      R(g, '#fff', 5, 3, 5, 1); R(g, '#fff', 7, 9, 2, 1);
    }
    return c;
  };
  return { q: mkBlock(false), used: mkBlock(true) };
}

// ------------------------------------------------------------------ bosses
// Slime King: 40x32 jelly with a gold crown. frames: 0 idle, 1 squash, 2 stretch. `rage` = angry red recolour.
function slimeKingFrames(rage) {
  const body = rage ? '#e05a4a' : '#5fd35a', hi = rage ? '#ff9a8a' : '#a8f08a', lo = rage ? '#a02a2a' : '#2f9a3a';
  return [[15, 15.5], [11, 17.5], [19, 13.5]].map(([ry, rx], f) => {
    const [c, g] = mk(40, 32);
    const squash = f === 1, stretch = f === 2;
    const rY = squash ? 10 : stretch ? 16 : 13, rX = squash ? 19 : stretch ? 14 : 17;
    const cy = 32 - rY + 1;
    blob(g, 20, cy, rX, rY, body);
    R(g, hi, 20 - rX + 4, cy - rY + 4, 6, 2); R(g, hi, 20 - rX + 4, cy - rY + 6, 2, 3);
    R(g, lo, 20 - rX + 3, 30, rX * 2 - 4, 1);
    // eyes
    const ey = cy - 4;
    R(g, '#fff', 11, ey, 7, 7); R(g, '#fff', 22, ey, 7, 7);
    R(g, OUT, 14, ey + 2, 3, 4); R(g, OUT, 25, ey + 2, 3, 4);
    R(g, OUT, 10, ey - 2 + (rage ? 2 : 0), 8, 2); R(g, OUT, 22, ey - 2 + (rage ? 2 : 0), 8, 2);
    // mouth
    R(g, OUT, 14, ey + 10, 12, squash ? 4 : 3); R(g, '#7a1020', 15, ey + 11, 10, squash ? 2 : 1);
    if (squash || rage) { R(g, '#fff', 16, ey + 10, 2, 1); R(g, '#fff', 22, ey + 10, 2, 1); }
    // crown
    const cyc = cy - rY - 3;
    R(g, OUT, 11, cyc + 2, 18, 6); R(g, '#ffd84a', 12, cyc + 3, 16, 4); R(g, '#fff2a0', 12, cyc + 3, 16, 1);
    for (const x of [11, 19, 27]) { R(g, OUT, x, cyc - 2, 3, 5); R(g, '#ffd84a', x + 1, cyc - 1, 1, 4); }
    R(g, '#e0453a', 19, cyc + 4, 2, 2);
    return fromCanvas(c);
  });
}
export const BOSS_ART = { slimeking: slimeKingFrames(false), slimeking_rage: slimeKingFrames(true) };

// glowing power orb dropped by a defeated boss (14x14)
export const POWER_ORB = item((g) => {
  ell(g, 7, 7, 7, 7, OUT); ell(g, 7, 7, 6, 6, '#b06aff'); ell(g, 7, 7, 4, 4, '#e0b8ff'); R(g, '#fff', 4, 3, 3, 2);
  R(g, '#fff', 8, 8, 2, 2);
});

ITEM_ART.power = POWER_ORB;
