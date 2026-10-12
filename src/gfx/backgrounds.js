// Parallax backgrounds baked into wide repeating strips, drawn with per-layer scroll factors.
import { W, H } from '../config.js';
import { mk } from './sprites.js';
import { RNG } from '../engine/rng.js';

function hills(th, color, width, base, amp, seed) {
  const [c, g] = mk(width, H);
  const rng = new RNG(seed);
  const p1 = rng.next() * 6, p2 = rng.next() * 6;
  g.fillStyle = color;
  for (let x = 0; x < width; x++) {
    const a = (x / width) * Math.PI * 2;      // periodic -> tiles seamlessly
    const y = Math.round(base - amp * (0.6 * Math.sin(a * 2 + p1) + 0.4 * Math.sin(a * 5 + p2)));
    g.fillRect(x, y, 1, H - y);
  }
  return c;
}
function clouds(th, width, seed) {
  const [c, g] = mk(width, H);
  const rng = new RNG(seed);
  for (let i = 0; i < 6; i++) {
    const x = Math.floor((i + rng.next() * 0.6) * width / 6), y = 16 + rng.int(0, 70), w = rng.int(28, 52);
    g.fillStyle = th.cloudShade; g.fillRect(x + 2, y + 8, w - 4, 4);
    g.fillStyle = th.cloud; g.fillRect(x, y + 4, w, 6); g.fillRect(x + 6, y, w * 0.4, 6); g.fillRect(x + w * 0.45, y + 1, w * 0.3, 5);
  }
  return c;
}

export function makeBackground(th) {
  const sky = mk(1, H)[0];
  const sg = sky.getContext('2d');
  const bands = th.sky.length;
  for (let y = 0; y < H; y++) { sg.fillStyle = th.sky[Math.min(bands - 1, Math.floor(y / (H * 0.7) * bands))]; sg.fillRect(0, y, 1, 1); }
  const layers = [
    { img: clouds(th, 512, 7), f: 0.12, drift: 0.05 },
    { img: hills(th, th.hillFar, 512, 150, 26, 3), f: 0.25, drift: 0 },
    { img: hills(th, th.hillNear, 384, 178, 20, 9), f: 0.5, drift: 0 },
  ];
  return {
    draw(ctx, camX, t = 0) {
      ctx.drawImage(sky, 0, 0, 1, H, 0, 0, W, H);
      for (const L of layers) {
        const w = L.img.width;
        let ox = -(((camX * L.f + t * L.drift) % w) + w) % w;
        for (let x = ox; x < W; x += w) ctx.drawImage(L.img, Math.round(x), 0);
      }
    },
  };
}
