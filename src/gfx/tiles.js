// 16-bit tile art (procedural). Each tile uses 5-shade ramps, dithering, bevels and ambient occlusion.
// Baked once per theme into small canvases. Variants (3 each for grass/dirt) break up repetition.
import { T } from '../config.js';
import { mk } from './sprites.js';
import { ramp, rect, ell, px, darken, lighten, mix, hash, bayer, vgrad, bevel } from './paint.js';

const OUT = '#241636';

// ------------------------------------------------------------------ dirt / grass
function dirtBase(g, th, v) {
  const rp = ramp(th.dirt, 5);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    // blocky value noise (2x2) so it reads as soil texture, plus a gentle vertical light falloff
    const n = hash(Math.floor(x / 2) + v * 7, Math.floor(y / 2) + v * 3, 11), t = 0.52 - y * 0.012 + (n - 0.5) * 0.7;
    const i = Math.max(0, Math.min(4, Math.floor(t * 5 + bayer(x, y) * 0.8)));
    px(g, rp[i], x, y);
  }
  // pebbles
  for (let k = 0; k < 3; k++) {
    const cx = 2 + Math.floor(hash(k, v, 5) * 12), cy = 7 + Math.floor(hash(k, v, 6) * 8), r = 1 + (k % 2) * 0.6;
    ell(g, cx, cy, r + 0.6, r, ramp(mix(th.dirt, '#9a9aa8', 0.55), 4), { outline: darken(th.dirt, 0.5), dither: 0.3 });
  }
  // little cracks / roots
  const dark = darken(th.dirt, 0.55);
  for (let k = 0; k < 2; k++) { const x0 = Math.floor(hash(k, v, 8) * 12) + 2, y0 = 8 + Math.floor(hash(k, v, 9) * 6); px(g, dark, x0, y0); px(g, dark, x0 + 1, y0 + 1); px(g, dark, x0 + 1, y0 + 2); }
}
function dirtTile(th, v = 0) { const [c, g] = mk(T, T); dirtBase(g, th, v); return c; }

function grassTile(th, v = 0) {
  const [c, g] = mk(T, T);
  dirtBase(g, th, v);
  const gr = ramp(th.top, 6);
  // grass cap with a scalloped fringe that drips into the soil
  for (let x = 0; x < T; x++) {
    const drip = 5 + Math.floor(hash(x, v, 21) * 3);        // 5..7 rows of grass in this column
    for (let y = 0; y < drip; y++) {
      const t = 1 - y / drip;                                 // light at the top
      const i = Math.max(0, Math.min(5, Math.floor(t * 5.4 + bayer(x, y) * 0.7)));
      px(g, gr[i], x, y);
    }
    px(g, gr[0], x, drip);                                    // dark fringe line
    px(g, darken(th.dirt, 0.45), x, drip + 1);                // ambient occlusion in the soil just under the grass
    if (hash(x, v, 23) > 0.7) px(g, gr[1], x, drip - 1);
  }
  px(g, gr[5], 0, 0, T, 1);                                   // sunlit top edge
  // a few lighter blades on the cap
  for (let k = 0; k < 4; k++) px(g, gr[4], Math.floor(hash(k, v, 31) * 16), 1 + Math.floor(hash(k, v, 32) * 2), 1, 2);
  return c;
}
// tufts: drawn 3px ABOVE a grass tile so the skyline of the ground is irregular instead of a ruler-straight line
function tuftOverlay(th, v) {
  const [c, g] = mk(T, 4), gr = ramp(th.top, 6);
  for (let x = 0; x < T; x++) {
    const h = Math.floor(hash(x, v, 41) * 4);                // 0..3 px tall blade
    for (let y = 0; y < h; y++) px(g, y === h - 1 ? gr[5] : gr[3], x, 3 - y);
    if (hash(x, v, 43) > 0.93 && h > 1) px(g, th.flower || '#ffe14a', x, 3 - h);        // the odd flower
  }
  return c;
}

// ------------------------------------------------------------------ brick / planks / spikes / spring
function brickTile(th) {
  const [c, g] = mk(T, T), rp = ramp(th.brick, 6);
  px(g, darken(th.brick, 0.62), 0, 0, T, T);                  // mortar
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 4 : 0;
    for (let bx = -8 + off; bx < T; bx += 8) {
      const x0 = Math.max(0, bx), x1 = Math.min(T, bx + 7), w = x1 - x0, y0 = row * 4;
      if (w <= 0) continue;
      rect(g, x0, y0, w, 3, [rp[1], rp[2], rp[3], rp[4]], { dither: 0.5 });
      px(g, rp[5], x0, y0, w, 1);                             // highlight on top of each brick
      px(g, rp[0], x0, y0 + 2, w, 1);                         // shade on the bottom
      if (hash(bx, row, 3) > 0.6) px(g, rp[0], x0 + 2, y0 + 1);       // chips
    }
  }
  bevel(g, 0, 0, T, T, rp[5], darken(th.brick, 0.7));
  return c;
}
function onewayTile(th) {
  const [c, g] = mk(T, T), rp = ramp(th.plank, 6);
  rect(g, 0, 0, T, 6, [rp[1], rp[2], rp[3], rp[4]], { dither: 0.3, outline: null });
  px(g, rp[5], 0, 0, T, 1); px(g, rp[0], 0, 5, T, 1);
  for (const x of [3, 8, 13]) { px(g, rp[1], x, 1, 1, 4); }                 // grain
  px(g, rp[0], 0, 0, 1, 6); px(g, rp[0], T - 1, 0, 1, 6);                   // plank seams
  px(g, '#e8e0d0', 2, 2); px(g, '#e8e0d0', 13, 2);                          // nails
  for (let x = 0; x < T; x++) { px(g, 'rgba(36,22,54,0.35)', x, 6); px(g, 'rgba(36,22,54,0.18)', x, 7); }   // soft drop shadow underneath
  px(g, rp[0], 2, 6, 2, 4); px(g, rp[0], 12, 6, 2, 4);                      // supports
  return c;
}
function spikeTile() {
  const [c, g] = mk(T, T), rp = ramp('#aab4cf', 6);
  rect(g, 0, 13, T, 3, [rp[0], rp[1], rp[2]], { dither: 0.2 });
  px(g, rp[3], 0, 13, T, 1);
  for (const x0 of [0, 8]) {
    for (let y = 0; y < 10; y++) {
      const half = Math.max(0.5, (y + 1) * 0.42), cx = x0 + 4;
      for (let x = Math.floor(cx - half); x < Math.ceil(cx + half); x++) {
        const t = (x - (cx - half)) / (half * 2);                         // left lit, right shadow
        const i = t < 0.25 ? 5 : t < 0.5 ? 4 : t < 0.78 ? 2 : 0;
        px(g, rp[i], x, 3 + y);
      }
    }
    px(g, '#fff', x0 + 3, 3); px(g, '#fff', x0 + 3, 4);
    px(g, OUT, x0 + 4, 2);
  }
  return c;
}
function springFrames() {
  const frames = [];
  for (const h of [8, 5, 11]) {
    const [c, g] = mk(T, T), top = T - 3 - h, metal = ramp('#b8c0d8', 6), red = ramp('#ff4a5a', 6);
    rect(g, 2, 13, 12, 3, [metal[0], metal[1], metal[2]], { dither: 0.2 }); px(g, metal[4], 2, 13, 12, 1);
    for (let y = 0; y < h; y += 2) { rect(g, 4, top + 3 + y, 8, 1, [metal[1], metal[3], metal[5]], { dir: 'h', dither: 0 }); px(g, metal[0], 4, top + 4 + y, 8, 1); }
    rect(g, 1, top, 14, 4, [red[1], red[3], red[4], red[5]], { dither: 0.3 }); px(g, red[5], 2, top, 12, 1); px(g, red[0], 1, top + 3, 14, 1);
    px(g, '#fff', 3, top + 1, 3, 1);
    frames.push(c);
  }
  return frames;
}

// ------------------------------------------------------------------ slopes
function slopeTile(th, rising, v = 0) {
  const [c, g] = mk(T, T), gr = ramp(th.top, 6), dirt = ramp(th.dirt, 5);
  for (let x = 0; x < T; x++) {
    const u = rising ? x : T - 1 - x, top = T - 1 - u;                         // surface y at this column
    for (let y = top; y < T; y++) {
      const d = y - top;
      if (d < 4) { const i = Math.max(0, Math.min(5, Math.floor((1 - d / 4) * 5.4 + bayer(x, y) * 0.6))); px(g, gr[i], x, y); }
      else if (d === 4) px(g, gr[0], x, y);
      else if (d === 5) px(g, darken(th.dirt, 0.45), x, y);
      else { const n = hash(Math.floor(x / 2), Math.floor(y / 2), 17 + v); px(g, dirt[Math.max(0, Math.min(4, Math.floor(1.4 + n * 2.4 + bayer(x, y) * 0.8)))], x, y); }
    }
    px(g, gr[5], x, top);
  }
  return c;
}

// ------------------------------------------------------------------ question blocks (with a moving shine) + used block
export function bakeBlocks() {
  const gold = ramp('#ffb82a', 7), stone = ramp('#9a8a78', 6);
  const q = [];
  for (let f = 0; f < 6; f++) {
    const [c, g] = mk(T, T);
    px(g, '#5a2a0a', 0, 0, T, T);
    rect(g, 1, 1, 14, 14, [gold[1], gold[2], gold[3], gold[4], gold[5]], { dither: 0.4 });
    bevel(g, 1, 1, 14, 14, gold[6], gold[0]);
    for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) { px(g, gold[0], x, y, 2, 2); px(g, gold[6], x, y); }       // rivets
    // '?' glyph with outline and highlight
    const glyph = [[5, 3, 6, 2], [9, 4, 2, 3], [7, 6, 3, 2], [7, 9, 2, 2]];
    for (const [x, y, w, h] of glyph) px(g, '#6a2a08', x - 1, y - 1, w + 2, h + 2);
    for (const [x, y, w, h] of glyph) px(g, '#fff4c8', x, y, w, h);
    px(g, '#ffffff', 5, 3, 3, 1); px(g, '#ffd060', 7, 9, 2, 1);
    // shine sweeping across the face
    const sx = f * 4 - 4;
    for (let y = 1; y < 15; y++) { const x = sx + (15 - y) * 0.7 | 0; if (x >= 2 && x < 14) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, 2, 1); } }
    q.push(c);
  }
  const [u, ug] = mk(T, T);
  px(ug, '#3a2c28', 0, 0, T, T);
  rect(ug, 1, 1, 14, 14, [stone[1], stone[2], stone[3]], { dither: 0.5 });
  bevel(ug, 1, 1, 14, 14, stone[4], stone[0]);
  for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) px(ug, stone[0], x, y, 2, 2);
  px(ug, stone[1], 6, 6, 4, 4);
  return { q, used: u };
}

// ------------------------------------------------------------------ flag, goal, platform
function flagFrames() {
  const frames = [];
  for (const [state, f] of [['off', 0], ['on', 0], ['on', 1], ['on', 2]]) {
    const [c, g] = mk(T, 32), pole = ramp('#d8dcec', 5);
    rect(g, 7, 3, 3, 29, [pole[1], pole[3], pole[4]], { dir: 'h', dither: 0, outline: OUT });
    ell(g, 8.5, 3, 3, 3, ramp('#ffd84a', 5), { spec: true });
    const y0 = state === 'on' ? 5 : 19, rp = ramp(state === 'on' ? '#ff4a5a' : '#8a8aa0', 6);
    for (let x = 0; x < 6; x++) {                                                    // cloth with a travelling wave
      const wave = state === 'on' ? Math.round(Math.sin((x + f * 2) * 1.2) * 1.2) : 0;
      rect(g, 10 + x, y0 + wave + Math.floor(x * 0.3), 1, 8 - Math.floor(x * 0.5), [rp[1], rp[3], rp[4], rp[5]], { dither: 0 });
    }
    if (state === 'on') px(g, '#ffd84a', 12, y0 + 3, 2, 2);
    frames.push(c);
  }
  return frames;
}
function goalFrames() {
  const frames = [];
  for (let f = 0; f < 3; f++) {
    const [c, g] = mk(T * 2, 48), pole = ramp('#e8ecf8', 5), gr = ramp('#37d46a', 6);
    rect(g, 14, 6, 4, 42, [pole[1], pole[3], pole[4]], { dir: 'h', dither: 0, outline: OUT });
    ell(g, 16, 5, 4.5, 4.5, ramp('#ffd84a', 6), { spec: true });
    for (let x = 0; x < 14; x++) {
      const wave = Math.round(Math.sin((x * 0.55) + f * 1.3) * 1.6);
      rect(g, 18 + x, 8 + wave + Math.floor(x * 0.15), 1, 11 - Math.floor(x * 0.35), [gr[1], gr[3], gr[4], gr[5]], { dither: 0 });
    }
    px(g, '#fff', 22, 12, 4, 4); px(g, gr[2], 23, 13, 2, 2);
    frames.push(c);
  }
  return frames;
}

export function bakeTileset(th) {
  const grassV = [0, 1, 2].map((v) => grassTile(th, v));
  return {
    grass: grassV[0], grassV, dirtV: [0, 1, 2].map((v) => dirtTile(th, v)), tufts: [0, 1, 2].map((v) => tuftOverlay(th, v)),
    dirt: dirtTile(th, 0), brick: brickTile(th), oneway: onewayTile(th),
    slopeR: slopeTile(th, true), slopeL: slopeTile(th, false), spike: spikeTile(),
    blocks: bakeBlocks(), spring: springFrames(), flag: flagFrames(), goal: goalFrames(),
  };
}
