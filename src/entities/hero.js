// Mateo, the hero. Tight platformer feel: coyote time, jump buffering, variable jump height,
// acceleration/deceleration, momentum, and the RUSH speed burst (invulnerable to small enemies).
import { moveXBy, moveY } from '../engine/physics.js';
import { MATEO, drawSprite } from '../gfx/sprites.js';

export const HERO_MAX_HP = 6;

const WALK = 1.7, RUSH_SPEED = 3.4;
const GRAV = 0.23, GRAV_CUT = 0.55, MAX_FALL = 4.8, JUMP_V = 4.7;
const COYOTE = 6, BUFFER = 6;

export class Hero {
  constructor(x, y) {
    this.w = 10; this.h = 14;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.facing = 1; this.grounded = false; this.onSlope = false; this.onOneWay = false; this.wall = 0; this.dropT = 0;
    this.coyote = 0; this.jumpBuf = 0;
    this.hp = HERO_MAX_HP; this.invuln = 0; this.hurtT = 0; this.dead = false; this.deathT = 0;
    this.star = 0;                       // timed invulnerability power-up (Stage 2)
    this.meter = 100; this.rushing = false; this.rushCd = 0;
    this.riding = null; this.animT = 0; this.trail = []; this.noCut = false;
  }

  respawn(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.hp = HERO_MAX_HP; this.dead = false; this.deathT = 0;
    this.invuln = 120; this.hurtT = 0; this.meter = 100; this.rushing = false; this.rushCd = 0; this.riding = null; this.trail.length = 0;
    this.grounded = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  // Small enemies can't hurt a rushing or starred hero.
  get smashing() { return this.rushing || this.star > 0; }

  hurt(dmg, fromX, lv) {
    if (this.dead || this.invuln > 0 || this.star > 0 || lv.cheatInvincible) return false;
    this.hp -= dmg; this.invuln = 90; this.hurtT = 14; this.rushing = false;
    const dir = this.cx < fromX ? -1 : 1;
    this.vx = dir * 1.6; this.vy = -2.6; this.grounded = false; this.riding = null;
    lv.camera.shake(3, 10); lv.audio.sfx('hit');
    lv.particles.emit(this.cx, this.cy, 8, { speed: 1.6, color: ['#fff', '#ff4a5a'], life: 18 });
    if (this.hp <= 0) this.die(lv);
    return true;
  }

  die(lv) {
    if (this.dead) return;
    this.dead = true; this.deathT = 0; this.hp = 0; this.vx = 0; this.vy = -5; this.rushing = false;
    lv.camera.shake(4, 14); lv.audio.sfx('hit');
  }

  update(lv) {
    const inp = lv.input, map = lv.map;
    if (this.dead) { this.deathT++; this.vy = Math.min(this.vy + 0.25, 5); this.y += this.vy; return; }

    if (this.invuln > 0) this.invuln--;
    if (this.hurtT > 0) this.hurtT--;
    if (this.star > 0) this.star--;
    if (this.dropT > 0) this.dropT--;

    const clearing = lv.status === 'clear';
    const ctl = this.hurtT <= 0 && lv.status === 'play';
    let dir = 0;
    if (ctl) dir = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
    else if (clearing) dir = 1;

    // ---- RUSH: hold to burst forward at high speed for a limited time, then cool down.
    const wantRush = ctl && inp.down('rush');
    if (this.rushing) {
      if (!wantRush || this.meter <= 0) { this.rushing = false; this.rushCd = this.meter <= 0 ? 90 : 12; }
      else this.meter -= 0.9;
    } else {
      if (this.rushCd > 0) this.rushCd--;
      else {
        if (ctl && inp.pressed('rush') && this.meter >= 25) { this.rushing = true; lv.audio.sfx('dash'); }
        this.meter = Math.min(100, this.meter + (wantRush ? 0.3 : 0.7));
      }
    }
    if (lv.cheatInfiniteRush) this.meter = 100;

    // ---- horizontal movement with momentum
    const max = clearing ? 1.2 : (this.rushing ? RUSH_SPEED : WALK);
    const acc = this.rushing ? 0.16 : (this.grounded ? 0.13 : 0.10);
    const rdir = (this.rushing && !dir) ? this.facing : dir;
    if (this.hurtT <= 0) {
      if (rdir) {
        this.facing = rdir;
        if (this.vx * rdir < 0) this.vx += rdir * (this.grounded ? 0.3 : 0.16);          // turning around
        else if (this.vx * rdir < max) this.vx = rdir * Math.min(Math.abs(this.vx) + acc, max);
        else this.vx -= rdir * 0.05;                                                    // leftover rush momentum bleeds off
      } else {
        const f = this.grounded ? 0.12 : 0.03;
        this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f;
      }
    }

    // ---- jump: buffer + coyote time + variable height
    const jumpHeld = ctl && inp.down('jump');
    if (ctl && inp.pressed('jump')) this.jumpBuf = BUFFER; else if (this.jumpBuf > 0) this.jumpBuf--;
    if (this.grounded) this.coyote = COYOTE; else if (this.coyote > 0) this.coyote--;

    if (ctl && inp.down('down') && inp.pressed('jump') && this.onOneWay) {      // drop through thin platforms
      this.dropT = 10; this.y += 1; this.jumpBuf = 0; this.coyote = 0; this.grounded = false; this.riding = null;
    } else if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -(JUMP_V + Math.abs(this.vx) * 0.12);
      this.jumpBuf = 0; this.coyote = 0; this.grounded = false; this.riding = null;
      lv.particles.dust(this.cx, this.y + this.h);
      lv.audio.sfx('jump');
    }
    if (this.vy >= 0) this.noCut = false;
    const g = (this.vy < 0 && !jumpHeld && !this.noCut) ? GRAV_CUT : GRAV;
    this.vy = Math.min(this.vy + g, MAX_FALL);

    // ---- moving platform carry
    if (this.riding) {
      const p = this.riding;
      if (this.vy < 0 || this.x + this.w <= p.x || this.x >= p.x + p.w) this.riding = null;
      else { moveXBy(this, map, p.dx); this.y = p.y - this.h; }
    }

    // ---- integrate + collide
    const wasGrounded = this.grounded, preVy = this.vy;
    moveXBy(this, map, this.vx);
    const prevBottom = this.y + this.h;
    moveY(this, map);
    this.landOnPlatforms(lv, prevBottom);
    if (this.grounded && !wasGrounded && preVy > 1.5) { lv.particles.dust(this.cx, this.y + this.h); lv.audio.sfx('land'); }
    if (this.ceil) lv.onHeadBump(this.ceil.c, this.ceil.r);

    // ---- animation + rush afterimages
    if (this.grounded) this.animT += Math.abs(this.vx) * 0.12; else this.animT = 0;
    if (this.rushing) {
      this.trail.push({ x: this.x, y: this.y, f: this.facing, s: this.sprite() });
      if (this.trail.length > 4) this.trail.shift();
      if (this.grounded && lv.frames % 3 === 0) lv.particles.dust(this.cx - this.facing * 4, this.y + this.h, -this.facing);
    } else if (this.trail.length) this.trail.shift();
  }

  landOnPlatforms(lv, prevBottom) {
    if (this.vy < 0 || this.dropT > 0) return;
    for (const p of lv.platforms) {
      if (this.x + this.w <= p.x || this.x >= p.x + p.w) continue;
      const bottom = this.y + this.h;
      if (prevBottom <= p.y + 1.5 && bottom >= p.y - 0.001) {
        this.y = p.y - this.h; this.vy = 0; this.grounded = true; this.onOneWay = true; this.riding = p; return;
      }
    }
  }

  sprite() {
    if (this.dead || this.hurtT > 0) return MATEO.fall;
    if (!this.grounded) return this.vy < 0 ? MATEO.jump : MATEO.fall;
    if (Math.abs(this.vx) > 0.2) return MATEO.run[Math.floor(this.animT) % 4];
    return MATEO.stand;
  }

  draw(ctx, lv) {
    // rush afterimages
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.globalAlpha = 0.15 + i * 0.08;
      drawSprite(ctx, t.s, t.x - 3, t.y - 2, t.f, true);
    }
    ctx.globalAlpha = 1;
    if (this.invuln > 0 && !this.dead && this.invuln % 6 < 3 && this.star <= 0) return;   // blink when hurt
    const flash = (this.hurtT > 8) || (this.star > 0 && lv.frames % 4 < 2);
    drawSprite(ctx, this.sprite(), this.x - 3, this.y - 2, this.facing, flash);
  }
}
