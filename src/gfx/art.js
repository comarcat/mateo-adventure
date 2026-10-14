// Procedurally drawn art for enemies, pickups and coins. Original designs, no external assets.
import { mk, fromCanvas, hasHd, hdCanvas, hdSprite, stretchCanvas } from './sprites.js';

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
function knight() {     // Clanky: a little armoured knight whose shield blocks shots from the front
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    R(g, OUT, 4 + f, 14, 3, 2); R(g, OUT, 8 - f, 14, 3, 2);
    R(g, OUT, 3, 5, 9, 10); R(g, '#9aa0b8', 4, 6, 7, 8); R(g, '#d8dcec', 4, 6, 7, 1); R(g, '#6a7088', 4, 13, 7, 1);
    R(g, OUT, 4, 0, 7, 7); R(g, '#b8bed4', 5, 1, 5, 5); R(g, '#fff', 5, 1, 2, 1);
    R(g, OUT, 6, 3, 4, 2); R(g, '#ffd84a', 8, 3, 1, 1);
    R(g, OUT, 10, 4, 6, 11); R(g, '#4a7ae0', 11, 5, 4, 9); R(g, '#8ab0ff', 11, 5, 1, 9); R(g, '#ffd84a', 12, 8, 2, 3);
    return fromCanvas(c);
  });
}
function froggy() {     // Boing: a hopping frog
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    const lift = f ? 2 : 0;
    R(g, OUT, 2, 12 - lift, 4, 4 + lift); R(g, OUT, 10, 12 - lift, 4, 4 + lift);
    blob(g, 8, 10 - lift, 6, 4, '#3fc8b0'); R(g, '#a8ffe8', 4, 7 - lift, 3, 1);
    ell(g, 4.5, 5 - lift, 2.6, 2.6, OUT); ell(g, 11.5, 5 - lift, 2.6, 2.6, OUT);
    R(g, '#fff', 3, 4 - lift, 3, 3); R(g, '#fff', 10, 4 - lift, 3, 3); R(g, OUT, 5, 5 - lift, 1, 2); R(g, OUT, 12, 5 - lift, 1, 2);
    R(g, OUT, 5, 11 - lift, 6, 1); R(g, '#ff7a8a', 6, 11 - lift, 4, 1);
    return fromCanvas(c);
  });
}
function splotch() {    // Splotch: big spotty slime that splits in two when beaten
  return [0, 1].map((f) => {
    const [c, g] = mk(16, 16);
    const ry = f ? 6 : 7;
    blob(g, 8, 16 - ry + 0.5, 7, ry, '#d84ac8');
    R(g, '#ff9af0', 3, 16 - ry * 2 + 3, 3, 2); R(g, '#a02a98', 4, 12, 3, 2); R(g, '#a02a98', 10, 10, 3, 2);
    R(g, '#fff', 4, 7 + f, 3, 3); R(g, '#fff', 9, 7 + f, 3, 3); R(g, OUT, 5, 8 + f, 2, 2); R(g, OUT, 10, 8 + f, 2, 2);
    R(g, OUT, 6, 11 + f, 4, 1);
    return fromCanvas(c);
  });
}
const BASE_ART = { blob: gloopy(), spiky: pricklit(), bat: flutter(), pod: popPod(), charger: rammo(), guard: knight(), hopper: froggy(), splitter: splotch() };

// Blend a colour over a sprite (keeps its silhouette); used for per-world enemy skins and ice.
function overlay(sprite, color, alpha) {
  const [c, g] = mk(sprite.w, sprite.h); g.drawImage(sprite.r, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return fromCanvas(c, false);
}
export const overlaySprite = overlay;
BASE_ART.swooper = BASE_ART.bat.map((f) => overlay(f, '#2a8a9a', 0.6));
export const ENEMY_ART = BASE_ART;
const SKIN = { desert: '#ff9a30', ice: '#8ad8ff', forest: '#1a7a3a', water: '#58d0c0', volcano: '#ff4a1a', sky: '#fff0a0', castle: '#8a5aff' };
const skinCache = {};
export function enemyArt(type, theme) {
  if (!SKIN[theme]) return BASE_ART[type];
  const k = type + '@' + theme;
  return skinCache[k] || (skinCache[k] = BASE_ART[type].map((f) => overlay(f, SKIN[theme], 0.3)));
}
const iceCache = new Map();
export function iceOverlay(frame) { if (!iceCache.has(frame)) iceCache.set(frame, overlay(frame, '#8ad8ff', 0.7)); return iceCache.get(frame); }

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
  ice: item((g) => {
    badge(g, '#2a6ac8');
    R(g, '#e8f8ff', 6, 2, 2, 10); R(g, '#e8f8ff', 2, 6, 10, 2); R(g, '#bfe8ff', 3, 3, 1, 1); R(g, '#bfe8ff', 10, 3, 1, 1); R(g, '#bfe8ff', 3, 10, 1, 1); R(g, '#bfe8ff', 10, 10, 1, 1);
  }),
  fire: item((g) => {
    badge(g, '#c83a1a');
    ell(g, 7, 8, 3.5, 4, '#ff9a2e'); ell(g, 7, 9, 2, 2.5, '#ffe14a'); R(g, '#ff9a2e', 6, 2, 2, 3); R(g, '#fff', 7, 10, 1, 1);
  }),
  pizza: item((g) => {
    for (let y = 2; y < 13; y++) { const hw = Math.floor((y - 1) * 0.55) + 1; R(g, OUT, 7 - hw - 1, y, hw * 2 + 2, 1); }
    for (let y = 2; y < 13; y++) { const hw = Math.floor((y - 1) * 0.55) + 1; R(g, y < 4 ? '#c8873a' : '#ffd84a', 7 - hw, y, hw * 2, 1); }
    R(g, '#e0453a', 6, 6, 2, 2); R(g, '#e0453a', 4, 9, 2, 2); R(g, '#e0453a', 8, 10, 2, 2);
  }),
};

// ------------------------------------------------------------------ DUCK coin (12x12) with spin frames
const coinBase = hasHd('coin') ? hdCanvas('coin') : (() => {
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
function tri(g, col, x, y, w, h, up = true) {       // filled triangle (point up or down) built from rows
  g.fillStyle = col;
  for (let i = 0; i < h; i++) { const rw = Math.max(1, Math.round(w * (up ? (i + 1) / h : (h - i) / h))); g.fillRect(Math.round(x + (w - rw) / 2), y + i, rw, 1); }
}
function sandWorm() {       // Sand Worm: tan segmented column with a toothy round mouth
  return [0, 1].map((f) => {
    const [c, g] = mk(36, 44);
    R(g, OUT, 9, 14, 18, 30); R(g, '#d8a050', 10, 14, 16, 30); R(g, '#f0c070', 10, 14, 4, 30);
    for (let y = 22; y < 44; y += 6) { R(g, '#a8782c', 10, y, 16, 2); R(g, OUT, 9, y, 18, 1); }
    blob(g, 18, 12, 14, 11, '#e8b868'); R(g, '#fff0b8', 8, 5, 6, 2);
    ell(g, 18, 12, f ? 8 : 5, f ? 8 : 3, OUT); ell(g, 18, 12, f ? 6.5 : 4, f ? 6.5 : 2, '#7a1020');
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, tx = 18 + Math.cos(a) * (f ? 7 : 4.5), ty = 12 + Math.sin(a) * (f ? 7 : 3); R(g, '#fff', Math.round(tx), Math.round(ty), 2, 2); }
    R(g, '#ffe14a', 6, 5, 3, 3); R(g, OUT, 7, 6, 1, 2); R(g, '#ffe14a', 27, 5, 3, 3); R(g, OUT, 28, 6, 1, 2);
    return fromCanvas(c);
  });
}
function yeti() {           // Mr. Frost: big white yeti with a blue face
  return [0, 1].map((f) => {
    const [c, g] = mk(44, 38);
    const ay = f ? 8 : 20;
    blob(g, 6, ay + 6, 5, 8, '#e8f8ff'); blob(g, 38, ay + 6, 5, 8, '#e8f8ff');
    R(g, OUT, 10, 33, 8, 5); R(g, OUT, 26, 33, 8, 5); R(g, '#8ab0d8', 11, 34, 6, 3); R(g, '#8ab0d8', 27, 34, 6, 3);
    blob(g, 22, 24, 14, 13, '#f4fcff'); R(g, '#bfe8ff', 12, 28, 20, 2);
    blob(g, 22, 11, 10, 9, '#f4fcff'); ell(g, 22, 12, 7, 6, '#7ac0f0');
    R(g, OUT, 16, 9, 5, 2); R(g, OUT, 23, 9, 5, 2); R(g, '#fff', 17, 11, 3, 2); R(g, '#fff', 24, 11, 3, 2); R(g, OUT, 18, 11, 1, 2); R(g, OUT, 25, 11, 1, 2);
    R(g, OUT, 18, 15, 8, 3); R(g, '#fff', 19, 15, 2, 2); R(g, '#fff', 23, 15, 2, 2);
    R(g, '#bfe8ff', 14, 4, 4, 3); R(g, '#bfe8ff', 27, 4, 4, 3);
    return fromCanvas(c);
  });
}
function grandOwl() {       // Grand Owl: brown owl with a big pale face and flapping wings
  return [0, 1].map((f) => {
    const [c, g] = mk(48, 32);
    const wy = f ? 12 : 2;
    for (const [x0, dir] of [[0, 1], [30, -1]]) { R(g, OUT, x0, wy, 18, 14); R(g, '#a06a38', x0 + 1, wy + 1, 16, 12); R(g, '#d8a060', x0 + 1, wy + 1, 16, 3); for (let i = 0; i < 3; i++) R(g, '#7a4a22', x0 + 3 + i * 5, wy + 6, 2, 6); }
    blob(g, 24, 19, 9, 11, '#b87a40'); ell(g, 24, 23, 5, 6, '#f0d8a0');
    R(g, OUT, 15, 3, 4, 6); R(g, OUT, 29, 3, 4, 6); R(g, '#b87a40', 16, 4, 2, 5); R(g, '#b87a40', 30, 4, 2, 5);
    ell(g, 24, 12, 9, 8, OUT); ell(g, 24, 12, 8, 7, '#fff2d0');
    ell(g, 19.5, 12, 3.6, 3.6, OUT); ell(g, 28.5, 12, 3.6, 3.6, OUT); ell(g, 19.5, 12, 2.6, 2.6, '#ffd84a'); ell(g, 28.5, 12, 2.6, 2.6, '#ffd84a');
    R(g, OUT, 19, 11, 2, 3); R(g, OUT, 28, 11, 2, 3); R(g, OUT, 16, 8, 6, 2); R(g, OUT, 27, 8, 6, 2);
    tri(g, OUT, 21, 14, 6, 5, false); tri(g, '#ff9a2e', 22, 14, 4, 3, false);
    R(g, OUT, 19, 29, 4, 3); R(g, OUT, 26, 29, 4, 3); R(g, '#ff9a2e', 20, 29, 2, 2); R(g, '#ff9a2e', 27, 29, 2, 2);
    return fromCanvas(c);
  });
}
function krakenKid() {      // Kraken Kid: purple octopus with huge eyes
  return [0, 1].map((f) => {
    const [c, g] = mk(44, 36);
    for (let i = 0; i < 5; i++) {
      const x = 5 + i * 8, wob = (i + f) % 2 ? 2 : 0;
      R(g, OUT, x, 22, 7, 14 - wob); R(g, '#9a5ae0', x + 1, 22, 5, 13 - wob); R(g, '#d0a8ff', x + 2, 28, 1, 1); R(g, '#d0a8ff', x + 4, 32 - wob, 1, 1);
    }
    blob(g, 22, 15, 15, 14, '#9a5ae0'); R(g, '#d0a8ff', 11, 5, 7, 2); R(g, '#7a3ac0', 10, 22, 24, 1);
    R(g, OUT, 10, 10, 10, 11); R(g, '#fff', 11, 11, 8, 9); R(g, OUT, 25, 10, 10, 11); R(g, '#fff', 26, 11, 8, 9);
    R(g, OUT, 14, 14, 4, 5); R(g, OUT, 29, 14, 4, 5); R(g, '#fff', 15, 14, 1, 1); R(g, '#fff', 30, 14, 1, 1);
    R(g, OUT, 10, 8, 10, 2); R(g, OUT, 25, 8, 10, 2);
    R(g, OUT, 18, 22, 10, 3); R(g, '#ff7a9a', 19, 22, 8, 1);
    return fromCanvas(c);
  });
}
function magmaGolem() {     // Magma Golem: rocky giant; frame 1 shows the glowing core (the only weak point)
  return [0, 1].map((f) => {
    const [c, g] = mk(44, 40);
    R(g, OUT, 2, 12, 10, 20); R(g, '#5a3a38', 3, 13, 8, 18); R(g, '#7a5250', 3, 13, 8, 2);
    R(g, OUT, 32, 12, 10, 20); R(g, '#5a3a38', 33, 13, 8, 18); R(g, '#7a5250', 33, 13, 8, 2);
    R(g, OUT, 10, 8, 24, 28); R(g, '#6a4442', 11, 9, 22, 26); R(g, '#8a625e', 11, 9, 22, 3);
    R(g, OUT, 10, 33, 10, 7); R(g, OUT, 24, 33, 10, 7); R(g, '#5a3a38', 11, 34, 8, 5); R(g, '#5a3a38', 25, 34, 8, 5);
    R(g, OUT, 14, 0, 16, 11); R(g, '#7a5250', 15, 1, 14, 9); R(g, '#a07a76', 15, 1, 14, 2);
    const glow = f ? '#ffe14a' : '#ff7a1a';
    R(g, glow, 17, 5, 4, 3); R(g, glow, 24, 5, 4, 3);
    for (const [x, y, w, h] of [[13, 12, 1, 7], [14, 18, 4, 1], [30, 14, 1, 8], [27, 21, 4, 1], [20, 28, 1, 5], [4, 18, 1, 8], [36, 18, 1, 8]]) R(g, f ? '#ffb02a' : '#c8420e', x, y, w, h);
    if (f) { ell(g, 22, 21, 6, 6, OUT); ell(g, 22, 21, 5, 5, '#ff9a2e'); ell(g, 22, 21, 3, 3, '#fff2a0'); }
    else { R(g, '#3a2220', 17, 18, 10, 8); R(g, '#5a3a38', 18, 19, 8, 6); }
    return fromCanvas(c);
  });
}
function stormBird() {      // Storm Bird: dark-blue thunderbird with a lightning crest
  return [0, 1].map((f) => {
    const [c, g] = mk(52, 30);
    const up = !f;
    for (const [x0, dir] of [[0, 1], [32, -1]]) {
      for (let i = 0; i < 4; i++) { const wy = up ? 2 + i * 2 : 12 + i * 2; R(g, OUT, x0 + (dir > 0 ? i * 3 : 8 - i * 3), wy, 12, 7); R(g, '#3a4ab8', x0 + 1 + (dir > 0 ? i * 3 : 8 - i * 3), wy + 1, 10, 5); R(g, '#ffe14a', x0 + 1 + (dir > 0 ? i * 3 : 8 - i * 3), wy + 1, 10, 1); }
    }
    blob(g, 26, 17, 9, 8, '#2a3a98'); R(g, '#5a6ad8', 20, 12, 5, 2);
    blob(g, 26, 8, 6, 6, '#3a4ab8');
    for (const [x, y] of [[26, 0], [28, 2], [26, 3], [28, 4]]) R(g, '#ffe14a', x, y, 3, 2);
    R(g, '#fff', 22, 6, 3, 3); R(g, '#fff', 27, 6, 3, 3); R(g, OUT, 23, 7, 2, 2); R(g, OUT, 28, 7, 2, 2); R(g, OUT, 21, 5, 5, 1); R(g, OUT, 27, 5, 5, 1);
    tri(g, OUT, 23, 10, 6, 6, false); tri(g, '#ffd84a', 24, 10, 4, 4, false);
    R(g, OUT, 22, 24, 3, 5); R(g, OUT, 28, 24, 3, 5); R(g, '#ffd84a', 23, 24, 1, 4); R(g, '#ffd84a', 29, 24, 1, 4);
    return fromCanvas(c);
  });
}
function darkKing() {       // The Dark King: hooded cloak, red eyes, golden crown. frame 1 = casting
  return [0, 1].map((f) => {
    const [c, g] = mk(40, 40);
    for (let y = 12; y < 40; y++) { const hw = 6 + Math.round((y - 12) * 0.55); R(g, OUT, 20 - hw - 1, y, hw * 2 + 2, 1); }
    for (let y = 12; y < 40; y++) { const hw = 6 + Math.round((y - 12) * 0.55); R(g, y % 9 < 2 ? '#3a1a68' : '#4a2a88', 20 - hw, y, hw * 2, 1); }
    R(g, '#7a4ae0', 20, 24, 1, 14);
    const ay = f ? 8 : 22;
    R(g, OUT, 3, ay, 7, 6); R(g, '#8a5ae8', 4, ay + 1, 5, 4); R(g, OUT, 30, ay, 7, 6); R(g, '#8a5ae8', 31, ay + 1, 5, 4);
    if (f) { ell(g, 6, 5, 3, 3, '#ff4a8a'); ell(g, 34, 5, 3, 3, '#ff4a8a'); }
    blob(g, 20, 11, 8, 9, '#2a1a58'); R(g, OUT, 14, 8, 12, 7); R(g, '#0a0620', 15, 9, 10, 5);
    R(g, '#ff2a4a', 16, 10, 3, 2); R(g, '#ff2a4a', 21, 10, 3, 2); R(g, '#fff', 16, 10, 1, 1); R(g, '#fff', 21, 10, 1, 1);
    R(g, OUT, 13, 0, 14, 5); R(g, '#ffd84a', 14, 1, 12, 3); R(g, '#fff2a0', 14, 1, 12, 1);
    for (const x of [13, 19, 25]) { R(g, OUT, x, -0, 3, 2); R(g, '#ffd84a', x + 1, 0, 1, 2); }
    R(g, '#ff2a4a', 19, 2, 2, 2);
    return fromCanvas(c);
  });
}
const rageCache = new Map();
export function rageFrames(frames) { if (!rageCache.has(frames)) rageCache.set(frames, frames.map((f) => overlay(f, '#ff2a2a', 0.38))); return rageCache.get(frames); }
export const BOSS_ART = { slimeking: slimeKingFrames(false), slimeking_rage: slimeKingFrames(true), sandworm: sandWorm(), yeti: yeti(), owlbear: grandOwl(), kraken: krakenKid(), magmagolem: magmaGolem(), stormbird: stormBird(), darkking: darkKing() };

// glowing power orb dropped by a defeated boss (14x14)
export const POWER_ORB = item((g) => {
  ell(g, 7, 7, 7, 7, OUT); ell(g, 7, 7, 6, 6, '#b06aff'); ell(g, 7, 7, 4, 4, '#e0b8ff'); R(g, '#fff', 4, 3, 3, 2);
  R(g, '#fff', 8, 8, 2, 2);
});

ITEM_ART.power = POWER_ORB;

// ====================================================================================================================
// Painted 16-bit sprites (sprites_hd.js, generated from the concept art). Each falls back to the drawn version above if missing.
// ====================================================================================================================
const withFrames = (name, ...scales) => scales.map(([sx, sy]) => fromCanvas(sx === 1 && sy === 1 ? hdCanvas(name) : stretchCanvas(hdCanvas(name), sx, sy), false));
const ENEMY_HD = {      // enemy: [hd sprite, frame-1 squash/stretch]
  blob: ['gloopy', [1.08, 0.86]], spiky: ['pricklit', [1.06, 0.92]], bat: ['flutter', [0.86, 0.8]], pod: ['poppod', [0.92, 1.1]],
  charger: ['rammo', [1.05, 0.93]], guard: ['clanky', [1.05, 0.95]], hopper: ['boing', [0.9, 1.14]], splitter: ['splotch', [1.08, 0.86]],
};
for (const [type, [name, sq]] of Object.entries(ENEMY_HD)) if (hasHd(name)) BASE_ART[type] = withFrames(name, [1, 1], sq);
if (hasHd('swoopy')) BASE_ART.swooper = withFrames('swoopy', [1, 1], [0.86, 0.8]);

const glowCore = (c) => {       // Magma Golem's weak point flares in frame 1
  const g = c.getContext('2d'), img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] > 170 && d[i + 1] > 50 && d[i + 1] < 210 && d[i + 2] < 100) { d[i] = 255; d[i + 1] = Math.min(255, d[i + 1] + 90); d[i + 2] = 120; }
  g.putImageData(img, 0, 0); return c;
};
if (hasHd('slimeking')) {
  BOSS_ART.slimeking = withFrames('slimeking', [1, 1], [1.1, 0.88], [0.9, 1.12]);
  BOSS_ART.slimeking_rage = rageFrames(BOSS_ART.slimeking);
}
const BOSS_HD = { sandworm: 'sandworm', yeti: 'yeti', owlbear: 'owl', kraken: 'kraken', stormbird: 'stormbird', darkking: 'darkking' };
for (const [id, name] of Object.entries(BOSS_HD)) if (hasHd(name)) BOSS_ART[id] = withFrames(name, [1, 1], id === 'owlbear' || id === 'stormbird' ? [1, 0.9] : [1, 1.04]);
if (hasHd('golem')) BOSS_ART.magmagolem = [fromCanvas(hdCanvas('golem'), false), fromCanvas(glowCore(hdCanvas('golem')), false)];

// in-world pickups (the HUD keeps the small drawn icons)
export const PICKUP_ART = {};
for (const [type, name] of Object.entries({ star: 'star', oneup: 'oneup', shield: 'shield', apple: 'apple', pizza: 'pizza', power: 'orb', gun: 'gun', laser: 'laser' })) if (hasHd(name)) PICKUP_ART[type] = hdSprite(name);
