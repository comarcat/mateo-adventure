// Pooled projectiles: hero gun bullets, hero laser (pierces), enemy seeds.
import { T } from '../config.js';
import { Pool } from '../engine/pool.js';
import { K, overlap } from '../engine/physics.js';

export const LASER_DMG = 3, GUN_DMG = 1;

export class Projectiles {
  constructor() {
    this.pool = new Pool(48, () => ({ active: false, x: 0, y: 0, w: 4, h: 3, vx: 0, vy: 0, from: 'hero', kind: 'gun', dmg: 1, pierce: false, life: 0, hits: [] }));
  }
  _fire(kind, from, x, y, vx, vy, w, h, dmg, pierce, life) {
    const p = this.pool.acquire();
    p.kind = kind; p.from = from; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.w = w; p.h = h; p.dmg = dmg; p.pierce = pierce; p.life = life; p.hits.length = 0;
  }
  fireGun(x, y, dir) { this._fire('gun', 'hero', dir > 0 ? x : x - 4, y, dir * 4.2, 0, 4, 3, GUN_DMG, false, 60); }
  fireLaser(x, y, dir) { this._fire('laser', 'hero', dir > 0 ? x : x - 24, y - 1, dir * 6.5, 0, 24, 3, LASER_DMG, true, 50); }
  fireEnemy(x, y, vx, vy) { this._fire('seed', 'enemy', x - 2, y - 2, vx, vy, 5, 5, 1, false, 200); }

  update(lv) {
    const m = lv.map, hero = lv.hero;
    this.pool.each((p) => {
      p.x += p.vx; p.y += p.vy;
      if (--p.life <= 0) { p.active = false; return; }
      const c = Math.floor((p.x + p.w / 2) / T), r = Math.floor((p.y + p.h / 2) / T);
      if (m.kind(c, r) === K.SOLID) {
        p.active = false;
        lv.particles.emit(p.x + p.w / 2, p.y + p.h / 2, 3, { speed: 0.8, color: [p.kind === 'laser' ? '#7af0ff' : '#ffd84a'], life: 10, size: 2 });
        return;
      }
      if (p.from === 'hero') {
        for (const e of lv.enemies) {
          if (e.dead || !overlap(p, e) || p.hits.includes(e)) continue;
          p.hits.push(e);
          e.hit(p.dmg, lv, 'shot');
          if (!p.pierce) { p.active = false; break; }
        }
      } else if (!hero.dead && overlap(p, { x: hero.x + 1, y: hero.y + 2, w: hero.w - 2, h: hero.h - 2 })) {
        p.active = false;
        hero.hurt(1, p.x, lv);
      }
    });
  }

  draw(ctx) {
    this.pool.each((p) => {
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.kind === 'gun') { ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y - 1, 6, 5); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x, y, 4, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y, 2, 1); }
      else if (p.kind === 'laser') {
        ctx.fillStyle = 'rgba(122,240,255,0.35)'; ctx.fillRect(x - 2, y - 2, p.w + 4, 7);
        ctx.fillStyle = '#7af0ff'; ctx.fillRect(x, y, p.w, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x, y + 1, p.w, 1);
      } else { ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 7, 5); ctx.fillRect(x, y - 1, 5, 7); ctx.fillStyle = '#ff7a3a'; ctx.fillRect(x, y, 5, 5); ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 1, y + 1, 2, 2); }
    });
  }
  clear() { this.pool.clear(); }
}
