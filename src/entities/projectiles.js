// Pooled projectiles: hero shots (gun, laser, ice, fire) and enemy/boss attacks.
// Enemy attacks can have gravity (arcs), a harmless "warn" telegraph before they become dangerous,
// and fixed positions (pillars, lightning, icicles).
import { T } from '../config.js';
import { Pool } from '../engine/pool.js';
import { K, overlap } from '../engine/physics.js';

export const LASER_DMG = 3, GUN_DMG = 1;
const HERO_KINDS = { gun: 1, laser: 1, ice: 1, fire: 1 };

export class Projectiles {
  constructor() {
    this.pool = new Pool(72, () => ({ active: false, x: 0, y: 0, w: 4, h: 3, vx: 0, vy: 0, g: 0, warn: 0, from: 'hero', kind: 'gun', dmg: 1, pierce: false, pierceLeft: 0, life: 0, t: 0, hits: [] }));
  }
  _fire(kind, from, x, y, vx, vy, w, h, dmg, pierceLeft, life, g = 0, warn = 0) {
    const p = this.pool.acquire();
    p.kind = kind; p.from = from; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.w = w; p.h = h; p.dmg = dmg; p.pierceLeft = pierceLeft; p.pierce = pierceLeft > 0;
    p.life = life; p.g = g; p.warn = warn; p.t = 0; p.hits.length = 0; p.dx = Math.sign(vx); p.dy = Math.sign(vy);
    return p;
  }
  // ---- hero
  // Hero shots go in any of 8 directions: (dx,dy) is a unit-ish vector; (x,y) is the muzzle centre.
  fireHero(kind, x, y, dx, dy) {
    const diag = dx !== 0 && dy !== 0, vert = dx === 0;
    const S = { gun: [4.2, 4, 4, GUN_DMG, 0, 60], laser: [6.5, vert ? 4 : (diag ? 14 : 24), vert ? 24 : (diag ? 14 : 4), LASER_DMG, 99, 50], ice: [3.6, 6, 6, 1, 0, 70], fire: [3, 8, 8, 2, 2, 70] }[kind];
    const [sp, w, h, dmg, pierce, life] = S;
    const p = this._fire(kind, 'hero', x - w / 2, y - h / 2, dx * sp, dy * sp, w, h, dmg, pierce, life);
    p.dx = Math.sign(dx); p.dy = Math.sign(dy);
  }
  // ---- enemies / bosses
  fireWave(x, y, vx) { this._fire('wave', 'enemy', x - 5, y, vx, 0, 10, 8, 1, 0, 140); }
  fireEnemy(x, y, vx, vy) { this._fire('seed', 'enemy', x - 2, y - 2, vx, vy, 5, 5, 1, 0, 200); }
  fireArc(kind, x, y, vx, vy, g = 0.1) { this._fire(kind, 'enemy', x - 4, y - 4, vx, vy, 8, 8, 1, 0, 260, g); }        // snowball, fireball, ink
  fireShard(x, y, vx, vy) { this._fire('feather', 'enemy', x - 3, y - 3, vx, vy, 6, 6, 1, 0, 200); }
  // fixed attacks with a telegraph: pillar rises from the ground, bolt strikes the full height, icicle falls
  firePillar(x, groundY, warn = 40, life = 36) { this._fire('pillar', 'enemy', x - 7, groundY - 42, 0, 0, 14, 42, 1, 0, warn + life, 0, warn); }
  fireBolt(x, warn = 44) { this._fire('bolt', 'enemy', x - 5, 0, 0, 0, 10, 176, 1, 0, warn + 14, 0, warn); }
  fireIcicle(x, warn = 40) { this._fire('icicle', 'enemy', x - 4, -14, 0, 0, 8, 14, 1, 0, 400, 0, warn); }

  update(lv) {
    const m = lv.map, hero = lv.hero;
    this.pool.each((p) => {
      p.t++;
      if (p.warn > 0) {                                   // telegraph: harmless, not moving
        p.warn--; if (p.kind === 'icicle' && p.warn === 0) { p.vy = 0.5; p.g = 0.16; }
        return;
      }
      if (p.kind === 'icicle' || p.g) p.vy += p.g;
      p.x += p.vx; p.y += p.vy;
      if (--p.life <= 0) { p.active = false; return; }
      const fixed = p.kind === 'pillar' || p.kind === 'bolt';
      if (!fixed) {
        const c = Math.floor((p.x + p.w / 2) / T), r = Math.floor((p.kind === 'wave' ? p.y : p.y + p.h / 2) / T);
        if (m.kind(c, r) === K.SOLID) {
          p.active = false;
          const col = p.kind === 'laser' ? '#7af0ff' : p.kind === 'ice' || p.kind === 'icicle' ? '#bfe8ff' : p.kind === 'fire' || p.kind === 'fireball' ? '#ff9a2e' : '#ffd84a';
          lv.particles.emit(p.x + p.w / 2, p.y + p.h / 2, p.kind === 'icicle' ? 8 : 3, { speed: 1, color: [col, '#fff'], life: 12, size: 2 });
          return;
        }
      }
      if (p.from === 'hero') {
        if (lv.boss && !lv.boss.dead && overlap(p, lv.boss) && !p.hits.includes(lv.boss)) {
          p.hits.push(lv.boss);
          if (lv.boss.hit(p.dmg, lv, p.kind) === 'blocked') { p.active = false; return; }
          if (p.pierceLeft-- <= 0) { p.active = false; return; }
        }
        for (const e of lv.enemies) {
          if (e.dead || !overlap(p, e) || p.hits.includes(e)) continue;
          p.hits.push(e);
          // shielded enemies block gun/ice shots that hit their front; laser and fire go through
          if (e.def.shield && (p.kind === 'gun' || p.kind === 'ice') && p.vx * e.dir < 0) {
            lv.audio.sfx('block'); lv.particles.emit(p.x, p.y, 4, { speed: 1.5, color: ['#fff', '#ffe14a'], life: 10 });
            p.active = false; break;
          }
          if (p.kind === 'ice') e.freeze(240);
          e.hit(p.dmg, lv, 'shot');
          if (p.pierceLeft-- <= 0) { p.active = false; break; }
        }
      } else if (!hero.dead && overlap(p, { x: hero.x + 1, y: hero.y + 2, w: hero.w - 2, h: hero.h - 2 })) {
        if (!fixed) p.active = false;
        hero.hurt(1, p.x + p.w / 2, lv);
        if (fixed) p.hits.push('x');
      }
    });
  }

  draw(ctx) {
    this.pool.each((p) => {
      const x = Math.round(p.x), y = Math.round(p.y);
      switch (p.kind) {
        case 'gun': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y - 1, p.w + 2, p.h + 2); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y, 2, 1); break;
        case 'laser':
          if (p.dx !== 0 && p.dy !== 0) {                                   // diagonal: a staircase of squares along the beam
            for (let i = 0; i < 5; i++) { const sx = x + (p.dx > 0 ? i * 3 : p.w - 4 - i * 3 + 1), sy = y + (p.dy > 0 ? i * 3 : p.h - 4 - i * 3 + 1); ctx.fillStyle = 'rgba(122,240,255,0.4)'; ctx.fillRect(sx - 1, sy - 1, 6, 6); ctx.fillStyle = '#7af0ff'; ctx.fillRect(sx, sy, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(sx + 1, sy + 1, 2, 2); }
          } else if (p.dx === 0) { ctx.fillStyle = 'rgba(122,240,255,0.35)'; ctx.fillRect(x - 2, y, p.w + 4, p.h); ctx.fillStyle = '#7af0ff'; ctx.fillRect(x, y, p.w, p.h); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y, 1, p.h); }
          else { ctx.fillStyle = 'rgba(122,240,255,0.35)'; ctx.fillRect(x - 2, y - 2, p.w + 4, 7); ctx.fillStyle = '#7af0ff'; ctx.fillRect(x, y, p.w, 3); ctx.fillStyle = '#fff'; ctx.fillRect(x, y + 1, p.w, 1); }
          break;
        case 'ice': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 8, 6); ctx.fillRect(x, y - 1, 6, 8); ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x, y, 6, 6); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y + 1, 2, 2); break;
        case 'fire': { const f = p.t % 6 < 3; ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 10, 8); ctx.fillRect(x, y - 1, 8, 10); ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = f ? '#ffe14a' : '#ffb02a'; ctx.fillRect(x + 2, y + 2, 4, 4); break; }
        case 'wave': { const f = Math.floor(p.life / 4) % 2; ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y - 1 - f, 12, 10 + f); ctx.fillStyle = p.col || '#7be07a'; ctx.fillRect(x, y - f, 10, 8 + f); ctx.fillStyle = '#d8ffc8'; ctx.fillRect(x + 2, y + 1 - f, 4, 2); break; }
        case 'snowball': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 10, 8); ctx.fillRect(x, y - 1, 8, 10); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x + 4, y + 3, 3, 4); break;
        case 'fireball': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 10, 8); ctx.fillRect(x, y - 1, 8, 10); ctx.fillStyle = '#ff5a1a'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = '#ffe14a'; ctx.fillRect(x + 2, y + 2, 4, 4); break;
        case 'ink': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 10, 8); ctx.fillRect(x, y - 1, 8, 10); ctx.fillStyle = '#6a3aa8'; ctx.fillRect(x, y, 8, 8); ctx.fillStyle = '#b08aff'; ctx.fillRect(x + 1, y + 1, 3, 2); break;
        case 'feather': ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y - 1, 8, 8); ctx.fillStyle = '#d8a060'; ctx.fillRect(x, y, 6, 6); ctx.fillStyle = '#fff2c8'; ctx.fillRect(x + 1, y + 1, 2, 2); break;
        case 'pillar': {
          if (p.warn > 0) { ctx.fillStyle = p.warn % 8 < 4 ? 'rgba(255,90,60,0.55)' : 'rgba(255,200,60,0.4)'; ctx.fillRect(x, y + p.h - 3, p.w, 3); ctx.fillRect(x + 4, y + p.h - 8, p.w - 8, 2); }
          else { const rise = Math.min(1, p.t / 10), hh = Math.round(p.h * rise); ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y + p.h - hh - 1, p.w + 2, hh + 1); ctx.fillStyle = p.col || '#c8924a'; ctx.fillRect(x, y + p.h - hh, p.w, hh); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 2, y + p.h - hh, 3, hh); }
          break;
        }
        case 'bolt':
          if (p.warn > 0) { ctx.fillStyle = p.warn % 6 < 3 ? 'rgba(255,240,120,0.35)' : 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 3, 0, 4, 176); }
          else { ctx.fillStyle = '#fff6a0'; ctx.fillRect(x, 0, p.w, 176); ctx.fillStyle = '#fff'; ctx.fillRect(x + 3, 0, 4, 176); }
          break;
        case 'icicle':
          if (p.warn > 0) { ctx.fillStyle = p.warn % 8 < 4 ? 'rgba(138,216,255,0.7)' : 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 2, 172, p.w + 4, 3); ctx.fillRect(x + 1, 166, p.w - 2, 2); }
          else { ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, p.w + 2, p.h + 1); ctx.fillStyle = '#bfe8ff'; ctx.fillRect(x, y, p.w, p.h - 2); ctx.fillRect(x + 2, y + p.h - 2, 4, 2); ctx.fillStyle = '#fff'; ctx.fillRect(x + 1, y, 2, p.h - 3); }
          break;
        default: ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y, 7, 5); ctx.fillRect(x, y - 1, 5, 7); ctx.fillStyle = '#ff7a3a'; ctx.fillRect(x, y, 5, 5); ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + 1, y + 1, 2, 2);
      }
    });
  }
  clear() { this.pool.clear(); }
}
