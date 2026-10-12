// Bosses: big enemies with phases. Each boss type is a pattern object below; Boss owns shared logic
// (hp, invulnerability frames, phases, defeat sequence). Add a boss by adding a pattern + art + arena.
import { W, T } from '../config.js';
import { moveXBy, moveY } from '../engine/physics.js';
import { WORLD_SCALING } from '../data/difficulty.js';
import { BOSS_ART } from '../gfx/art.js';
import { drawSprite } from '../gfx/sprites.js';
import { drawText } from '../engine/font.js';

// ------------------------------------------------------------------ Slime King (world 1)
const SlimeKing = {
  name: 'SLIME KING', w: 30, h: 24, baseHp: 10, score: 5000, art: 'slimeking',
  // phases switch by remaining hp fraction
  phases: [1, 0.5, 0.25],
  init(b) { b.state = 'idle'; b.timer = 40; b.jumps = 0; },
  onPhase(b, lv, phase) {
    if (phase === 1) {   // split! mini slimes rain down
      b.invuln = 60; lv.camera.shake(4, 20); lv.audio.sfx('bossroar');
      for (let i = 0; i < 3; i++) { const e = lv.spawnEnemy('blob', b.x + 8 + i * 22 - 20, 20 - i * 14); e.speed *= 1.5; e.vy = 0; }
      b.popups = 'SPLIT!';
    } else if (phase === 2) { b.invuln = 60; lv.camera.shake(5, 24); lv.audio.sfx('bossroar'); b.popups = 'ENRAGED!'; }
    if (b.popups) lv.popups.add(b.cx, b.y - 12, b.popups, '#ff7a3a');
  },
  update(b, lv) {
    const h = lv.hero, rage = b.phase;
    const wave = (dir) => lv.projectiles.fireWave(b.cx + dir * 14, b.y + b.h - 8, dir * (1.5 + rage * 0.5) * b.speedMul);
    switch (b.state) {
      case 'idle':
        b.vx = 0; b.physics(lv);
        if (--b.timer <= 0) { b.state = 'crouch'; b.timer = 22 - rage * 4; b.face = h.cx < b.cx ? -1 : 1; }
        break;
      case 'crouch': b.vx = 0; b.physics(lv); if (--b.timer <= 0) { b.state = 'air'; b.vy = -(5.2 + rage * 0.6); b.vx = b.face * Math.min(2.2, Math.abs(h.cx - b.cx) / 38 + 0.8) * b.speedMul; b.grounded = false; lv.audio.sfx('bossjump'); } break;
      case 'air':
        b.physics(lv);
        if (b.grounded) {
          lv.camera.shake(4, 12); lv.audio.sfx('bossland'); b.jumps++;
          wave(-1); wave(1);
          lv.particles.emit(b.cx, b.y + b.h, 10, { angle: -Math.PI / 2, spread: 3, speed: 1.6, color: ['#a8f08a', '#fff'], life: 18 });
          if (rage >= 2 && b.jumps % 2 === 0) for (const a of [-0.35, 0, 0.35]) lv.projectiles.fireEnemy(b.cx, b.y + 6, Math.cos(-Math.PI / 2 + a) * 1.4, Math.sin(-Math.PI / 2 + a) * 1.4);
          b.state = 'idle'; b.timer = Math.max(14, 60 - rage * 16);
        }
        break;
    }
    if (b.wall) b.vx = 0;
  },
  frame(b) { return b.state === 'crouch' ? 1 : (b.state === 'air' && b.vy < 0 ? 2 : (b.state === 'air' ? 1 : 0)); },
};

export const BOSSES = { slimeking: SlimeKing };

export class Boss {
  constructor(type, x, y, lv) {
    const d = this.def = BOSSES[type];
    const ws = WORLD_SCALING[Math.max(1, Math.min(8, lv.world))], df = lv.difficulty;
    this.type = type; this.isBoss = true;
    this.w = d.w; this.h = d.h; this.x = x - d.w / 2; this.y = y - d.h; this.vx = 0; this.vy = 0;
    this.maxHp = Math.max(4, Math.round(d.baseHp * ws.hpMul * df.enemyHp)); this.hp = this.maxHp;
    this.speedMul = ws.speedMul * df.enemySpeed;
    this.phase = 0; this.invuln = 0; this.flash = 0; this.dead = false; this.deadT = 0; this.active = false; this.awake = true;
    this.grounded = false; this.face = -1; this.t = 0; this.state = 'idle';
    d.init(this);
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  physics(lv) { this.vy = Math.min(this.vy + 0.28, 5); this.wall = 0; moveXBy(this, lv.map, this.vx); moveY(this, lv.map); }

  hit(dmg, lv) {
    if (this.dead || !this.active || this.invuln > 0) return false;
    this.hp -= dmg; this.invuln = 40; this.flash = 12; lv.audio.sfx('bosshit'); lv.camera.shake(3, 8);
    lv.particles.emit(this.cx, this.cy, 10, { speed: 2, color: this.def.art === 'slimeking' ? ['#fff', '#a8f08a'] : ['#fff'], life: 18 });
    if (this.hp <= 0) { this.die(lv); return true; }
    const frac = this.hp / this.maxHp;
    const target = this.def.phases.filter((p, i) => i > 0 && frac <= p).length;
    if (target > this.phase) { this.phase = target; this.def.onPhase(this, lv, target); }
    return true;
  }

  die(lv) {
    this.dead = true; this.deadT = 0; this.vx = 0;
    lv.audio.sfx('bossdefeat'); lv.camera.shake(6, 60);
    for (const e of lv.enemies) if (!e.dead) lv.killEnemy(e, true);
    lv.projectiles.clear();
    lv.addScore(this.def.score, this.cx, this.y - 10);
  }

  update(lv) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.invuln > 0) this.invuln--;
    if (this.dead) {
      this.deadT++; this.vx = 0; this.physics(lv);
      if (this.deadT % 5 === 0) lv.particles.emit(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 6, { speed: 2.2, color: ['#fff', '#ffd84a', '#ff7a3a', '#a8f08a'], life: 26, size: 3 });
      if (this.deadT === 90) { lv.spawnPowerOrb(this.cx - 7, this.y); }
      return;
    }
    if (!this.active) { if (lv.frames > 100) { this.active = true; lv.audio.sfx('bossroar'); lv.camera.shake(3, 14); } this.physics(lv); return; }
    this.def.update(this, lv);
  }

  draw(ctx) {
    if (this.dead && this.deadT > 80) return;
    const frames = BOSS_ART[this.phase >= 2 ? this.def.art + '_rage' : this.def.art];
    const f = frames[this.def.frame(this)];
    const flash = this.flash > 0 && this.t % 4 < 2 || (this.dead && this.t % 4 < 2);
    const blink = this.invuln > 0 && !this.dead && this.t % 6 < 2;
    if (blink) return;
    const sh = 32 - this.h;
    drawSprite(ctx, f, this.x - (40 - this.w) / 2, this.y - sh, 1, flash);
  }
}

// HUD helper: boss health bar
export function drawBossBar(ctx, boss) {
  const w = 120, x = (W - w) / 2, y = 38;
  drawText(ctx, boss.def.name, W / 2, y - 9, '#fff', 1, { align: 'center', shadow: '#2a1b3d' });
  ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x - 1, y - 1, w + 2, 8);
  ctx.fillStyle = '#5a1a2a'; ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = boss.phase >= 2 ? '#ff4a3a' : '#ff9a2e'; ctx.fillRect(x, y, Math.max(0, Math.round(w * boss.hp / boss.maxHp)), 6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, Math.max(0, Math.round(w * boss.hp / boss.maxHp)), 1);
}
