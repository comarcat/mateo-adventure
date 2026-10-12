// Enemies share one class; behaviour is chosen by def.ai. Stats scale by world + difficulty.
import { T, W } from '../config.js';
import { K, moveXBy, moveY } from '../engine/physics.js';
import { ENEMIES } from '../data/enemies.js';
import { WORLD_SCALING } from '../data/difficulty.js';
import { ENEMY_ART } from '../gfx/art.js';
import { drawSprite } from '../gfx/sprites.js';

const GRAV = 0.2;

export class Enemy {
  constructor(type, x, y, lv) {
    const d = this.def = ENEMIES[type];
    this.type = type;
    const ws = WORLD_SCALING[Math.max(1, Math.min(8, lv.world))], df = lv.difficulty;
    this.w = d.w; this.h = d.h; this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.hp = Math.max(1, Math.round(d.hp * ws.hpMul * df.enemyHp));
    this.speed = d.speed * ws.speedMul * df.enemySpeed;
    this.chargeSpeed = (d.chargeSpeed || 0) * ws.chargeMul * df.enemySpeed;
    this.fireDelay = Math.round(110 / (ws.fireMul * df.enemySpeed));
    this.bulletSpeed = 1.3 * ws.bulletMul * df.bulletSpeed;
    this.sight = ws.sight;
    this.dir = -1; this.grounded = false; this.dead = false; this.flash = 0; this.t = Math.floor(Math.random() * 60);
    this.state = 'idle'; this.timer = 0; this.baseY = y; this.awake = false;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  hit(dmg, lv) {
    this.hp -= dmg; this.flash = 6; lv.audio.sfx('stomp');
    if (this.hp <= 0) { lv.killEnemy(this); return true; }
    lv.particles.emit(this.cx, this.cy, 4, { speed: 1.2, color: ['#fff'], life: 12 });
    return false;
  }

  update(lv) {
    // Only simulate enemies near the screen (performance + fairness).
    const cam = lv.camera;
    const near = this.x > cam.x - 64 && this.x < cam.x + W + 64;
    if (!near && !this.awake) return;
    this.awake = near;
    this.t++; if (this.flash > 0) this.flash--;
    const h = lv.hero;
    switch (this.def.ai) {
      case 'walk': this.walk(lv); break;
      case 'fly': this.fly(lv); break;
      case 'shoot': this.shoot(lv, h); break;
      case 'charge': this.charge(lv, h); break;
    }
    if (this.y > lv.map.pxH + 32) this.dead = true;
  }

  physics(lv) {
    this.vy = Math.min(this.vy + GRAV, 4);
    this.wall = 0;
    moveXBy(this, lv.map, this.vx);
    moveY(this, lv.map);
  }
  groundAhead(lv) {
    const m = lv.map;
    const fx = Math.floor((this.dir > 0 ? this.x + this.w + 2 : this.x - 2) / T);
    const fy = Math.floor((this.y + this.h + 2) / T);
    const k = m.kind(fx, fy);
    return k === K.SOLID || k === K.ONEWAY || k === K.SLOPE_R || k === K.SLOPE_L || m.kind(fx, fy - 1) === K.SLOPE_R || m.kind(fx, fy - 1) === K.SLOPE_L;
  }

  walk(lv) {
    this.vx = this.dir * this.speed;
    this.physics(lv);
    if (this.wall || (this.grounded && !this.groundAhead(lv))) { this.dir = -this.dir; this.vx = 0; }
  }

  fly(lv) {
    this.x += this.dir * this.speed;
    this.y = this.baseY + Math.sin(this.t * 0.06) * 14;
    const m = lv.map, fx = Math.floor((this.dir > 0 ? this.x + this.w : this.x) / T), fy = Math.floor(this.cy / T);
    if (m.kind(fx, fy) === K.SOLID || (this.t % 240) === 239) this.dir = -this.dir;
  }

  shoot(lv, h) {
    this.dir = h.cx < this.cx ? -1 : 1;
    this.physics(lv);
    const dist = Math.abs(h.cx - this.cx);
    if (this.state === 'idle') {
      if (dist < this.sight && Math.abs(h.cy - this.cy) < 90 && ++this.timer > this.fireDelay) { this.state = 'aim'; this.timer = 0; }
    } else if (this.state === 'aim') {
      if (++this.timer > 18) {
        const dx = h.cx - this.cx, dy = h.cy - this.cy, l = Math.hypot(dx, dy) || 1;
        lv.projectiles.fireEnemy(this.cx + this.dir * 6, this.y + 4, dx / l * this.bulletSpeed, dy / l * this.bulletSpeed);
        lv.audio.sfx('enemyshot');
        this.state = 'idle'; this.timer = 0;
      }
    }
  }

  charge(lv, h) {
    const dist = h.cx - this.cx;
    if (this.state === 'idle') {
      this.vx = this.dir * this.speed; this.physics(lv);
      if (this.wall || (this.grounded && !this.groundAhead(lv))) this.dir = -this.dir;
      if (Math.abs(dist) < this.sight && Math.abs(h.cy - this.cy) < 24 && (dist > 0) === (this.dir > 0)) { this.state = 'wind'; this.timer = 0; this.vx = 0; }
    } else if (this.state === 'wind') {
      this.vx = 0; this.physics(lv);
      if (++this.timer > 24) { this.state = 'rush'; this.timer = 0; lv.audio.sfx('charge'); }
    } else if (this.state === 'rush') {
      this.vx = this.dir * this.chargeSpeed; this.physics(lv);
      if (lv.frames % 4 === 0) lv.particles.dust(this.cx - this.dir * 6, this.y + this.h, -this.dir);
      if (this.wall || ++this.timer > 80) { this.state = 'stun'; this.timer = 0; this.vx = 0; if (this.wall) lv.camera.shake(2, 8); }
    } else {   // stun
      this.vx = 0; this.physics(lv);
      if (++this.timer > 70) { this.state = 'idle'; this.dir = -this.dir; }
    }
  }

  draw(ctx) {
    const frames = ENEMY_ART[this.type];
    let f = Math.floor(this.t / 12) % 2;
    if (this.def.ai === 'fly') f = Math.floor(this.t / 6) % 2;
    if (this.def.ai === 'shoot') f = this.state === 'aim' ? 1 : 0;
    let ox = 0;
    if (this.state === 'wind') ox = (this.t % 4 < 2) ? -1 : 1;
    const flash = this.flash > 0 || (this.state === 'wind' && this.t % 6 < 3);
    const face = this.def.ai === 'shoot' ? this.dir : this.dir;
    drawSprite(ctx, frames[f], this.x - (16 - this.w) / 2 + ox, this.y - (16 - this.h), face, flash);
    if (this.state === 'wind') { ctx.fillStyle = '#ff4a4a'; ctx.fillRect(Math.round(this.cx) - 1, Math.round(this.y) - 8, 2, 4); ctx.fillRect(Math.round(this.cx) - 1, Math.round(this.y) - 3, 2, 2); }
  }
}
