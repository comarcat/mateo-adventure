// Floating score/text popups (pooled).
import { Pool } from '../engine/pool.js';
import { drawText } from '../engine/font.js';

export class Popups {
  constructor() { this.pool = new Pool(24, () => ({ active: false, x: 0, y: 0, t: 0, text: '', color: '#fff' })); }
  add(x, y, text, color = '#fff') { const p = this.pool.acquire(); p.x = x; p.y = y; p.t = 0; p.text = String(text); p.color = color; }
  update() { this.pool.each((p) => { p.t++; p.y -= 0.35; if (p.t > 50) p.active = false; }); }
  draw(ctx) { this.pool.each((p) => { if (p.t < 38 || p.t % 4 < 2) drawText(ctx, p.text, p.x, p.y, p.color, 1, { align: 'center', shadow: '#2a1b3d' }); }); }
  clear() { this.pool.clear(); }
}
