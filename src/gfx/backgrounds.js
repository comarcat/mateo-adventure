// 16-bit parallax backgrounds, drawn procedurally: smooth gradient sky with sun/moon glow, several shaded ridge layers
// (each with its own scroll speed, trees/cacti/peaks/spires), drifting clouds and small animated details per world.
import { W, H } from '../config.js';
import { mk } from './sprites.js';
import { RNG } from '../engine/rng.js';
import { ramp, ell, px, mix, darken, lighten, vgradFast, glow, bayer, hash } from './paint.js';

const rampSafe = (c, n = 6) => ramp(c, n);

// ---------------------------------------------------------------- sky (static, full screen)
function skyImage(th, o) {
  const [c, g] = mk(W, H);
  const s = th.sky;
  vgradFast(g, 0, 0, W, H, [[0, s[0]], [0.4, s[1]], [0.72, s[2]], [1, s[3]]]);
  if (o.stars) {
    const rng = new RNG(5);
    for (let i = 0; i < 70; i++) { const x = rng.int(0, W - 1), y = rng.int(0, 120), a = 0.35 + rng.next() * 0.6; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, y, 1, 1); if (rng.chance(0.15)) g.fillRect(x - 1, y, 3, 1); }
  }
  if (o.aurora) {
    for (let band = 0; band < 3; band++) for (let x = 0; x < W; x++) {
      const y = 28 + band * 12 + Math.sin(x * 0.03 + band * 2) * 8, a = 0.10 + 0.05 * Math.sin(x * 0.07 + band);
      for (let k = 0; k < 12; k++) { g.fillStyle = `rgba(${band === 1 ? '120,255,200' : '140,200,255'},${a * (1 - k / 12)})`; g.fillRect(x, y + k, 1, 1); }
    }
  }
  if (o.sun) {
    const { x, y, r, color, halo } = o.sun;
    glow(g, x, y, r * 3.2, halo || color, 0.55);
    ell(g, x, y, r, r, rampSafe(color, 5), { outline: false, flat: 0.7, dither: 0.3 });
    if (o.moon) { ell(g, x - r * 0.3, y - r * 0.2, r * 0.18, r * 0.18, rampSafe(mix(color, '#8a8aa8', 0.5), 3), { outline: false }); ell(g, x + r * 0.35, y + r * 0.3, r * 0.14, r * 0.14, rampSafe(mix(color, '#8a8aa8', 0.5), 3), { outline: false }); }
  }
  return c;
}

// ---------------------------------------------------------------- landscape strips (tile horizontally)
function drawTree(g, kind, x, y, size, col, rng) {
  const rp = rampSafe(col, 6);
  if (kind === 'round') {
    px(g, darken('#7a5230', 0.2), x - 1, y - size * 0.4, 2, size * 0.5);
    ell(g, x, y - size * 0.7, size * 0.62, size * 0.58, rp, { outline: darken(col, 0.6), dither: 0.7 });
    ell(g, x - size * 0.35, y - size * 0.45, size * 0.38, size * 0.34, rp, { outline: false, dither: 0.7 });
    ell(g, x + size * 0.35, y - size * 0.45, size * 0.38, size * 0.34, rp, { outline: false, dither: 0.7 });
  } else if (kind === 'pine') {
    px(g, '#4a3220', x - 1, y - 3, 2, 4);
    for (let k = 0; k < 4; k++) {
      const w = size * (0.95 - k * 0.2), top = y - size * 1.1 + k * size * 0.28, h = size * 0.5;
      for (let j = 0; j < h; j++) { const hw = (w / 2) * (j / h) + 0.7; for (let i = -Math.floor(hw); i <= Math.floor(hw); i++) { const t = (i + hw) / (hw * 2); px(g, rp[t < 0.3 ? 5 : t < 0.55 ? 4 : t < 0.8 ? 2 : 0], x + i, Math.round(top + j)); } }
    }
  } else if (kind === 'cactus') {
    const cp = rampSafe(col, 6);
    for (let j = 0; j < size; j++) for (let i = -1; i <= 1; i++) px(g, cp[i < 0 ? 5 : i === 0 ? 3 : 1], x + i, y - j);
    for (const [side, h] of [[-1, size * 0.45], [1, size * 0.6]]) { for (let j = 0; j < h * 0.5; j++) px(g, cp[3], x + side * 3, y - h - j); for (let i = 0; i < 3; i++) px(g, cp[3], x + side * (i + 1), y - h + 1); }
  } else if (kind === 'spire') {                                     // castle tower silhouette with lit windows
    const sp = rampSafe(col, 6);
    for (let j = 0; j < size * 1.6; j++) for (let i = -3; i <= 3; i++) px(g, sp[i < -1 ? 3 : i < 1 ? 2 : 1], x + i, y - j);
    for (let j = 0; j < 8; j++) for (let i = -4 + Math.floor(j / 2); i <= 4 - Math.floor(j / 2); i++) px(g, sp[1], x + i, y - size * 1.6 - j);
    for (let k = 0; k < 3; k++) px(g, '#ffd060', x, y - size * 0.5 - k * 7, 1, 2);
    for (let i = -3; i <= 3; i += 2) px(g, sp[2], x + i, y - size * 1.6 - 1);
  } else if (kind === 'crystal') {
    const cp = rampSafe(col, 6);
    for (const [dx, hh] of [[-3, size * 0.7], [0, size], [3, size * 0.6]]) for (let j = 0; j < hh; j++) { const hw = Math.max(0, 2 - Math.floor(j / (hh / 2.5))); for (let i = -hw; i <= hw; i++) px(g, cp[i < 0 ? 5 : i === 0 ? 3 : 1], x + dx + i, y - j); }
  } else if (kind === 'kelp') {
    for (let j = 0; j < size; j++) { const wob = Math.round(Math.sin(j * 0.5 + x) * 1.5); px(g, rp[j % 3 === 0 ? 4 : 3], x + wob, y - j); px(g, rp[2], x + wob + 1, y - j); }
  } else if (kind === 'coral') {
    for (const dx of [-2, 0, 2]) for (let j = 0; j < size * (0.6 + 0.2 * (dx === 0)); j++) { px(g, rp[j % 4 === 0 ? 5 : 3], x + dx, y - j); px(g, rp[1], x + dx + 1, y - j); }
  } else if (kind === 'rock') {
    ell(g, x, y - size * 0.4, size * 0.7, size * 0.5, rp, { outline: darken(col, 0.6), dither: 0.5 });
  } else if (kind === 'mushroom') {
    px(g, '#e8dcc0', x - 1, y - size * 0.5, 3, size * 0.5);
    ell(g, x, y - size * 0.65, size * 0.65, size * 0.4, rp, { outline: darken(col, 0.6) });
    px(g, '#fff', x - 1, y - size * 0.8, 1, 1); px(g, '#fff', x + 2, y - size * 0.7, 1, 1);
  }
}

function ridge(th, width, o) {
  const [c, g] = mk(width, H), rng = new RNG(o.seed || 1);
  const ph = [rng.next() * 6, rng.next() * 6, rng.next() * 6, rng.next() * 6];
  const f1 = o.f1 || 2, f2 = o.f2 || 5, f3 = o.f3 || 11;
  const hgt = (x) => {
    const a = (x / width) * Math.PI * 2;
    let v = 0.55 * Math.sin(a * f1 + ph[0]) + 0.3 * Math.sin(a * f2 + ph[1]) + 0.15 * Math.sin(a * f3 + ph[2]);
    if (o.jag) v += (hash(Math.floor(x / (o.jagW || 3)), o.seed || 1, 7) - 0.5) * o.jag;
    if (o.mesa) v = Math.round(v * 3) / 3;                                               // flat-topped mesas
    return o.base - o.amp * v;
  };
  const rp = rampSafe(o.color, 6), fog = o.fog;
  for (let x = 0; x < width; x++) {
    const y = Math.round(hgt(x)), slope = hgt(x - 2) - hgt(x + 2);
    for (let yy = y; yy < H; yy++) {
      const d = yy - y, depth = Math.min(1, d / (o.fade || 70));
      let t = 1 - depth * 0.85; if (d < 4) t += slope > 0.5 ? 0.22 : slope < -0.5 ? -0.12 : 0.07;
      if (o.strata) t += (Math.floor(d / 5) % 2) * 0.1 - 0.05;
      let i = Math.floor(t * 5.4 + bayer(x, yy) * 0.8); i = Math.max(0, Math.min(5, i));
      px(g, rp[i], x, yy);
    }
    if (o.snow && y < o.base - o.amp * 0.15) { for (let k = 0; k < 6 + (o.base - y) * 0.12; k++) px(g, k < 2 ? '#ffffff' : '#d8ecff', x, y + k); }
  }
  if (fog) { for (let yy = o.base - 6; yy < H; yy++) { const a = Math.min(0.55, (yy - (o.base - 6)) / 50 * 0.55); g.fillStyle = `rgba(${fog},${a})`; g.fillRect(0, yy, width, 1); } }
  if (o.trees) {
    const t = o.trees;
    for (let i = 0; i < t.n; i++) {
      const x = Math.floor((i + 0.2 + rng.next() * 0.6) * width / t.n), y = Math.round(hgt(x)) + 2;
      drawTree(g, rng.chance(t.altChance || 0) ? t.alt : t.kind, x, y, t.size * (0.8 + rng.next() * 0.5), t.color, rng);
    }
  }
  if (o.windowsGlow) for (let k = 0; k < 20; k++) px(g, '#ffd060', Math.floor(rng.next() * width), o.base + 6 + Math.floor(rng.next() * 30));
  return c;
}

function cloudStrip(th, width, n, scale, seed) {
  const [c, g] = mk(width, H), rng = new RNG(seed);
  const hi = th.cloud, lo = th.cloudShade, rp = [darken(lo, 0.15), lo, mix(lo, hi, 0.5), hi, lighten(hi, 0.4)];
  for (let i = 0; i < n; i++) {
    const cx = Math.floor((i + rng.next() * 0.6) * width / n), cy = 18 + rng.int(0, 70), w = (22 + rng.int(0, 22)) * scale;
    for (let k = 0; k < 5; k++) {
      const ox = (k - 2) * w * 0.22, r = w * (0.2 + 0.12 * (k === 2 ? 1 : (k === 1 || k === 3) ? 0.7 : 0.2));
      ell(g, cx + ox, cy - (k === 2 ? 4 : k % 2 ? 1 : 0) * scale, r, r * 0.72, rp, { outline: false, light: [-0.2, -0.9], dither: 0.5 });
    }
    for (let x = cx - w * 0.5; x < cx + w * 0.5; x++) { g.fillStyle = 'rgba(255,255,255,0)'; }
  }
  return c;
}

// ---------------------------------------------------------------- per-world style table
const STYLE = {
  grass:   { sun: { x: 205, y: 40, r: 15, color: '#fff2b0', halo: '#fff8d0' }, far: { color: '#8ec6ea', base: 148, amp: 36, snow: false, seed: 3 }, mid: { color: '#74c88e', base: 168, amp: 20, trees: { kind: 'round', n: 12, size: 10, color: '#3f9d5a' }, seed: 9 }, near: { color: '#56b862', base: 190, amp: 14, trees: { kind: 'round', n: 9, size: 13, color: '#2f8a48', alt: 'mushroom', altChance: 0.1 }, seed: 12 }, clouds: 5, birds: true },
  desert:  { sun: { x: 190, y: 50, r: 24, color: '#fff0a0', halo: '#ffcf80' }, far: { color: '#d89a68', base: 150, amp: 30, mesa: true, strata: true, seed: 4 }, mid: { color: '#e8b46c', base: 170, amp: 18, seed: 6 }, near: { color: '#d89a58', base: 192, amp: 12, trees: { kind: 'cactus', n: 8, size: 14, color: '#3fae4a', alt: 'rock', altChance: 0.3 }, seed: 11 }, clouds: 2, dust: true },
  ice:     { aurora: true, sun: { x: 60, y: 48, r: 11, color: '#f4fbff', halo: '#cfe8ff' }, far: { color: '#b4d0ee', base: 140, amp: 46, jag: 14, jagW: 4, snow: true, seed: 5 }, mid: { color: '#d4e8f8', base: 172, amp: 18, trees: { kind: 'pine', n: 12, size: 15, color: '#3a7a98' }, seed: 8 }, near: { color: '#eaf6ff', base: 194, amp: 12, trees: { kind: 'pine', n: 8, size: 20, color: '#2a6a88' }, seed: 13 }, clouds: 3, snow: true },
  forest:  { rays: true, far: { color: '#2e7a58', base: 128, amp: 28, trees: { kind: 'pine', n: 18, size: 24, color: '#1e6a4a', alt: 'round', altChance: 0.4 }, seed: 5 }, mid: { color: '#26704c', base: 160, amp: 20, trees: { kind: 'round', n: 12, size: 24, color: '#1a5a3a' }, seed: 7 }, near: { color: '#1e6040', base: 192, amp: 14, trees: { kind: 'round', n: 8, size: 30, color: '#124a2c', alt: 'mushroom', altChance: 0.3 }, seed: 14 }, clouds: 1, fireflies: true },
  water:   { rays: true, far: { color: '#2a78b8', base: 140, amp: 30, trees: { kind: 'kelp', n: 18, size: 30, color: '#2a9a70' }, seed: 5, fog: '30,110,180' }, mid: { color: '#2468a8', base: 172, amp: 18, trees: { kind: 'coral', n: 12, size: 16, color: '#ff7a9a' }, seed: 7 }, near: { color: '#1c5898', base: 196, amp: 12, trees: { kind: 'kelp', n: 10, size: 26, color: '#3ab88a', alt: 'coral', altChance: 0.4 }, seed: 12 }, bubbles: true },
  volcano: { sun: { x: 130, y: 120, r: 30, color: '#ff8a3a', halo: '#ff5a1a' }, far: { color: '#6a2a38', base: 118, amp: 50, jag: 10, seed: 3, fog: '255,90,40' }, mid: { color: '#4a1c28', base: 160, amp: 24, jag: 6, seed: 6 }, near: { color: '#321420', base: 192, amp: 14, trees: { kind: 'rock', n: 8, size: 14, color: '#2a1018' }, seed: 11, lava: true }, clouds: 2, embers: true },
  sky:     { sun: { x: 200, y: 38, r: 14, color: '#fffbd0', halo: '#fff8c0' }, far: { color: '#d8ecff', base: 176, amp: 30, seed: 5 }, mid: { color: '#c0dcff', base: 190, amp: 18, seed: 6 }, near: { color: '#f4faff', base: 208, amp: 12, seed: 7 }, clouds: 7, birds: true },
  castle:  { stars: true, moon: true, sun: { x: 196, y: 44, r: 16, color: '#f0eaff', halo: '#a090ff' }, far: { color: '#2a2a5a', base: 138, amp: 36, jag: 12, seed: 3, trees: { kind: 'spire', n: 5, size: 20, color: '#1e1e48' } }, mid: { color: '#222250', base: 168, amp: 20, trees: { kind: 'crystal', n: 8, size: 14, color: '#6a4aa0' }, seed: 6 }, near: { color: '#181840', base: 194, amp: 12, trees: { kind: 'spire', n: 4, size: 26, color: '#10102e' }, seed: 12, windowsGlow: true }, clouds: 2 },
};

export function makeBackground(th) {
  const st = STYLE[th.name] || STYLE.grass;
  const sky = skyImage(th, st);
  const layers = [];
  if (st.clouds) layers.push({ img: cloudStrip(th, 512, st.clouds, 1.0, 7), f: 0.08, drift: 0.06 }, { img: cloudStrip(th, 384, Math.max(1, st.clouds - 2), 0.7, 13), f: 0.14, drift: 0.03, alpha: 0.85 });
  layers.push({ img: ridge(th, 512, { f1: 2, f2: 5, f3: 11, fade: 90, ...st.far }), f: 0.18 });
  layers.push({ img: ridge(th, 384, { f1: 3, f2: 6, f3: 13, fade: 70, ...st.mid }), f: 0.34 });
  layers.push({ img: ridge(th, 320, { f1: 3, f2: 7, f3: 15, fade: 50, ...st.near }), f: 0.56 });
  const rng = new RNG(99);
  const parts = Array.from({ length: 34 }, () => ({ x: rng.next(), y: rng.next(), s: 0.3 + rng.next() * 0.9, p: rng.next() * 6 }));
  const birds = Array.from({ length: 4 }, (_, i) => ({ x: rng.next(), y: 30 + rng.next() * 40, s: 0.4 + rng.next() * 0.3, p: rng.next() * 6 }));
  return {
    draw(ctx, camX, t = 0) {
      ctx.drawImage(sky, 0, 0);
      if (st.rays) {                                                      // soft light shafts from above
        for (let i = 0; i < 6; i++) { const x = ((i * 53 + 20 - camX * 0.08 + Math.sin(t * 0.01 + i) * 6) % (W + 80) + W + 80) % (W + 80) - 40; ctx.fillStyle = 'rgba(255,255,220,0.07)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 70, H); ctx.lineTo(x + 30, H); ctx.fill(); }
      }
      for (const L of layers) {
        const w = L.img.width, ox = -(((camX * L.f + t * (L.drift || 0)) % w) + w) % w;
        if (L.alpha) ctx.globalAlpha = L.alpha;
        for (let x = ox; x < W; x += w) ctx.drawImage(L.img, Math.round(x), 0);
        ctx.globalAlpha = 1;
      }
      // animated details
      if (st.stars) for (const p of parts) if (p.y < 0.55) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.04 * p.s + p.p)); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(Math.floor(p.x * W), Math.floor(p.y * 160), 1, 1); }
      if (st.snow) for (const p of parts) { const x = ((p.x * W + t * 0.2 * p.s + Math.sin(t * 0.03 + p.p) * 6 - camX * 0.2) % W + W) % W, y = ((p.y * H + t * (0.5 + p.s)) % H); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(Math.floor(x), Math.floor(y), p.s > 0.8 ? 2 : 1, p.s > 0.8 ? 2 : 1); }
      if (st.fireflies) for (const p of parts.slice(0, 18)) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.03 + p.p * 3)), x = ((p.x * W + Math.sin(t * 0.02 + p.p) * 14 - camX * 0.4) % W + W) % W, y = 80 + p.y * 110 + Math.cos(t * 0.025 + p.p) * 8; ctx.fillStyle = `rgba(230,255,120,${a * 0.35})`; ctx.fillRect(Math.floor(x) - 1, Math.floor(y) - 1, 3, 3); ctx.fillStyle = `rgba(255,255,200,${a})`; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
      if (st.bubbles) for (const p of parts) { const x = ((p.x * W + Math.sin(t * 0.04 + p.p) * 4 - camX * 0.3) % W + W) % W, y = H - ((p.y * H + t * (0.3 + p.s * 0.5)) % H); ctx.fillStyle = 'rgba(210,240,255,0.55)'; ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
      if (st.embers) for (const p of parts) { const x = ((p.x * W + Math.sin(t * 0.03 + p.p) * 10 - camX * 0.3) % W + W) % W, y = H - ((p.y * H + t * (0.4 + p.s * 0.8)) % H); ctx.fillStyle = p.s > 0.7 ? 'rgba(255,200,80,0.9)' : 'rgba(255,110,40,0.8)'; ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
      if (st.dust) for (const p of parts.slice(0, 14)) { const x = ((p.x * W + t * (0.6 + p.s) - camX * 0.5) % W + W) % W, y = 120 + p.y * 90; ctx.fillStyle = 'rgba(255,230,170,0.35)'; ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1); }
      if (st.birds) for (const b of birds) { const x = ((b.x * W + t * b.s - camX * 0.1) % (W + 20) + W + 20) % (W + 20) - 10, y = b.y + Math.sin(t * 0.03 + b.p) * 3, f = Math.floor(t / 10 + b.p * 3) % 2; ctx.fillStyle = '#3a2a58'; ctx.fillRect(Math.floor(x) - 2, Math.floor(y) + (f ? 0 : 1), 2, 1); ctx.fillRect(Math.floor(x) + 1, Math.floor(y) + (f ? 0 : 1), 2, 1); ctx.fillRect(Math.floor(x), Math.floor(y) + 1, 1, 1); }
    },
  };
}
