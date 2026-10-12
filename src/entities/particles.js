// Pooled particle system: dust, sparks, poofs. No allocations during play.
import { Pool } from '../engine/pool.js';

export class Particles {
  constructor(size = 320) {
    this.pool = new Pool(size, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, size: 1, color: '#fff' }));
  }
  emit(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const p = this.pool.acquire();
      const a = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * (o.spread ?? 0.6) : Math.random() * Math.PI * 2;
      const sp = (o.speed ?? 1) * (0.4 + Math.random() * 0.8);
      p.x = x + (Math.random() - 0.5) * (o.rx ?? 0); p.y = y + (Math.random() - 0.5) * (o.ry ?? 0);
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      p.g = o.g ?? 0.05; p.max = p.life = (o.life ?? 24) * (0.7 + Math.random() * 0.6);
      p.size = o.size ?? 2;
      p.color = Array.isArray(o.color) ? o.color[(Math.random() * o.color.length) | 0] : (o.color ?? '#fff');
    }
  }
  dust(x, y, dir = 0) { this.emit(x, y, 4, { angle: dir ? (dir > 0 ? Math.PI : 0) : -Math.PI / 2, spread: 1.2, speed: 0.6, g: -0.005, life: 16, size: 2, color: ['#ffffff', '#d8e8f0'] }); }
  poof(x, y, colors = ['#fff', '#ffd84a', '#ff9a2e']) { this.emit(x, y, 12, { speed: 1.8, g: 0.04, life: 26, size: 3, color: colors }); }
  update() {
    this.pool.each((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.98;
      if (--p.life <= 0) p.active = false;
    });
  }
  draw(ctx) {
    this.pool.each((p) => {
      const s = Math.max(1, Math.round(p.size * (p.life / p.max)));
      ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    });
  }
  clear() { this.pool.clear(); }
}
