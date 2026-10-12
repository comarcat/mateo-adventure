// Mateo, the hero. Tight platformer feel: coyote time, jump buffering, variable jump height,
// acceleration/deceleration, momentum, and the RUSH speed burst (invulnerable to small enemies).
import { moveXBy, moveY, K } from '../engine/physics.js';
import { MATEO, drawSprite } from '../gfx/sprites.js';
import { SHIELD_RING } from '../gfx/art.js';
import { POWERS } from '../data/powers.js';

export const SHIELD_HITS = 8;

const WALK = 1.7, RUSH_SPEED = 3.4;
const GRAV = 0.23, GRAV_CUT = 0.55, MAX_FALL = 4.8, JUMP_V = 5.5;
const COYOTE = 6, BUFFER = 6;

export class Hero {
  constructor(x, y, maxHp = 6, powers = []) {
    this.powers = new Set(powers); this.airJumps = 1;
    this.w = 10; this.h = 14;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.facing = 1; this.grounded = false; this.onSlope = false; this.onOneWay = false; this.wall = 0; this.dropT = 0;
    this.coyote = 0; this.jumpBuf = 0;
    this.maxHp = maxHp; this.hp = maxHp; this.invuln = 0; this.hurtT = 0; this.dead = false; this.deathT = 0;
    this.star = 0;                       // timed invulnerability power-up (Stage 2)
    this.meter = 100; this.rushing = false; this.rushCd = 0;
    this.shield = 0; this.ammo = 0; this.charges = 0; this.slot = 'base'; this.shootCd = 0;
    this.riding = null; this.animT = 0; this.trail = []; this.noCut = false;
    this.airDashes = 1; this.dashT = 0; this.pounding = false; this.energy = 100; this.sliding = 0; this.wallCoyote = 0; this.wallDirMem = 0; this.noCtlX = 0; this.gliding = false;
  }

  respawn(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.hp = this.maxHp; this.dead = false;
    this.shield = 0; this.ammo = 0; this.charges = 0; this.star = 0; this.deathT = 0;
    if (!this.slotList().includes(this.slot)) this.slot = 'base';
    this.invuln = 120; this.hurtT = 0; this.meter = 100; this.rushing = false; this.rushCd = 0; this.riding = null; this.trail.length = 0;
    this.dashT = 0; this.pounding = false; this.energy = 100; this.sliding = 0; this.noCtlX = 0; this.gliding = false;
    this.grounded = false;
  }

  // ---- power slots (Mega Man style): ONE slot is active at a time, cycled with Q/E.
  //   'base' = no special power;  an ability power (double jump, air dash...) = that ability is on;
  //   'gun' / 'laser' / 'ice' / 'fire' = that weapon is selected for the shoot button.
  get weapon() { return ['gun', 'laser', 'ice', 'fire'].includes(this.slot) ? this.slot : null; }
  set weapon(v) { this.slot = v || 'base'; }
  can(id) { return this.powers.has(id) && this.slot === id; }          // is this ability currently active?
  slotList() {
    const l = ['base'];
    for (const [id, p] of Object.entries(POWERS)) if (p.kind === 'ability' && this.powers.has(id)) l.push(id);
    return l.concat(this.availableWeapons());
  }
  setSlot(slot, lv) { this.slot = slot; if (lv && lv.run) lv.run.slot = slot; }
  // pick up a new power: switch to it right away
  equip(slot, lv) { if (slot === 'iceshot') slot = 'ice'; else if (slot === 'fireshot') slot = 'fire'; this.setSlot(slot, lv); }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  // Small enemies can't hurt a rushing or starred hero.
  get smashing() { return this.rushing || this.star > 0 || this.dashT > 0 || this.pounding; }

  hurt(dmg, fromX, lv) {
    if (this.dead || this.invuln > 0 || this.star > 0 || lv.cheatInvincible) return false;
    lv.damageTaken++;
    if (this.shield > 0) {            // shield absorbs exactly SHIELD_HITS hits
      this.shield--; this.invuln = 45; this.hurtT = 6;
      this.vx = (this.cx < fromX ? -1 : 1) * 1.2; this.vy = -1.8; this.grounded = false; this.riding = null;
      lv.audio.sfx(this.shield ? 'shieldhit' : 'shieldbreak'); lv.camera.shake(this.shield ? 2 : 4, 8);
      lv.particles.emit(this.cx, this.cy, this.shield ? 5 : 16, { speed: 1.8, color: ['#cffaff', '#7af0ff', '#fff'], life: 20 });
      return true;
    }
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
    const inp = lv.input, map = lv.map, ph = lv.data.physics || {};
    if (this.dead) { this.deathT++; this.vy = Math.min(this.vy + 0.25, 5); this.y += this.vy; return; }

    if (this.invuln > 0) this.invuln--;
    if (this.hurtT > 0) this.hurtT--;
    if (this.star > 0) this.star--;
    if (this.dropT > 0) this.dropT--;
    if (this.noCtlX > 0) this.noCtlX--;
    if (this.grounded) { this.airDashes = 1; }

    const clearing = lv.status === 'clear';
    const ctl = this.hurtT <= 0 && lv.status === 'play';
    let dir = 0;
    if (ctl) dir = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
    else if (clearing) dir = 1;

    // ---- RUSH: hold to burst forward at high speed for a limited time, then cool down.
    // ---- boss power AIR DASH: a short horizontal burst in mid-air (once per jump)
    if (this.dashT > 0) { this.dashT--; if (this.dashT === 0) this.vx = this.facing * 1.8; }
    else if (ctl && this.can('airdash') && !this.grounded && this.airDashes > 0 && inp.pressed('rush')) {
      this.airDashes--; this.dashT = 14; this.vy = 0; this.pounding = false; lv.audio.sfx('dash');
      lv.particles.emit(this.cx - this.facing * 4, this.cy, 6, { angle: this.facing > 0 ? Math.PI : 0, spread: 0.7, speed: 1.6, color: ['#fff', '#7af0ff'], life: 14 });
    }
    const airDashOwned = this.can('airdash') && !this.grounded;
    const wantRush = ctl && inp.down('rush');
    if (this.rushing) {
      if (!wantRush || this.meter <= 0) { this.rushing = false; this.rushCd = this.meter <= 0 ? 90 : 12; }
      else this.meter -= 0.9;
    } else {
      if (this.rushCd > 0) this.rushCd--;
      else {
        if (ctl && inp.pressed('rush') && this.meter >= 25 && !airDashOwned) { this.rushing = true; lv.audio.sfx('dash'); }
        this.meter = Math.min(100, this.meter + (wantRush ? 0.3 : 0.7));
      }
    }
    if (lv.cheatInfiniteRush) this.meter = 100;

    // ---- horizontal movement with momentum
    const max = clearing ? 1.2 : (this.rushing ? RUSH_SPEED : WALK);
    const slick = !!ph.slick;
    const acc = this.rushing ? 0.16 : (this.grounded ? (slick ? 0.045 : 0.13) : 0.10);
    const rdir = (this.rushing && !dir) ? this.facing : dir;
    if (this.dashT > 0) { this.vx = this.facing * 3.6; }
    else if (this.hurtT <= 0 && this.noCtlX <= 0 && !this.pounding) {
      if (rdir) {
        this.facing = rdir;
        if (this.vx * rdir < 0) this.vx += rdir * (this.grounded ? (slick ? 0.09 : 0.3) : 0.16);          // turning around
        else if (this.vx * rdir < max) this.vx = rdir * Math.min(Math.abs(this.vx) + acc, max);
        else this.vx -= rdir * 0.05;                                                    // leftover rush momentum bleeds off
      } else {
        const f = this.grounded ? (slick ? 0.02 : 0.12) : 0.03;
        this.vx = Math.abs(this.vx) <= f ? 0 : this.vx - Math.sign(this.vx) * f;
      }
    }

    // ---- weapons: switch with prev/next, shoot with the shoot button
    if (this.shootCd > 0) this.shootCd--;
    if (this.energy < 100) this.energy = Math.min(100, this.energy + 0.07);
    if (ctl) {
      if (!this.slotList().includes(this.slot)) this.setSlot('base', lv);       // e.g. ammo ran out
      if (inp.pressed('next')) this.cycleSlot(1, lv);
      if (inp.pressed('prev')) this.cycleSlot(-1, lv);
      this.tryShoot(lv, inp);
    }

    // ---- jump: buffer + coyote time + variable height
    const jumpHeld = ctl && inp.down('jump');
    if (ctl && inp.pressed('jump')) this.jumpBuf = BUFFER; else if (this.jumpBuf > 0) this.jumpBuf--;
    if (this.grounded) this.coyote = COYOTE; else if (this.coyote > 0) this.coyote--;
    if (this.grounded || this.riding) this.airJumps = 1;

    if (ctl && inp.down('down') && inp.pressed('jump') && this.onOneWay) {      // drop through thin platforms
      this.dropT = 10; this.y += 1; this.jumpBuf = 0; this.coyote = 0; this.grounded = false; this.riding = null;
    } else if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -(JUMP_V * (ph.jump ?? 1) + Math.abs(this.vx) * 0.12);
      this.jumpBuf = 0; this.coyote = 0; this.grounded = false; this.riding = null;
      lv.particles.dust(this.cx, this.y + this.h);
      lv.audio.sfx('jump');
    } else if (ctl && inp.pressed('jump') && !this.grounded && this.coyote <= 0 && this.airJumps > 0 && this.can('doublejump')) {
      this.airJumps--; this.vy = -4.1; this.jumpBuf = 0; this.noCut = false;       // boss power: DOUBLE JUMP
      lv.particles.emit(this.cx, this.y + this.h, 8, { angle: Math.PI / 2, spread: 2.6, speed: 1.2, color: ['#fff', '#b06aff'], life: 16 });
      lv.audio.sfx('jump2');
    }
    if (this.vy >= 0) this.noCut = false;
    const gm = ph.grav ?? 1;
    const g = ((this.vy < 0 && !jumpHeld && !this.noCut) ? GRAV_CUT : GRAV) * gm;
    if (this.dashT > 0) this.vy = 0;
    else this.vy = Math.min(this.vy + g, MAX_FALL * (gm < 1 ? 0.7 : 1));

    // ---- boss power WALL CLIMB: slide down walls while pushing into them, jump off them
    this.sliding = 0;
    if (this.can('wallslide') && !this.grounded && this.vy > 0 && ctl) {
      const mid = Math.floor((this.y + this.h / 2) / 16);
      const left = map.kind(Math.floor((this.x - 1) / 16), mid) === K.SOLID, right = map.kind(Math.floor((this.x + this.w + 1) / 16), mid) === K.SOLID;
      const side = right ? 1 : (left ? -1 : 0);
      if (side && dir === side) { this.sliding = side; this.vy = Math.min(this.vy, 1.05); this.wallCoyote = 6; this.wallDirMem = side; this.airJumps = 1; }
    }
    if (this.wallCoyote > 0 && !this.sliding) this.wallCoyote--;
    if (this.wallCoyote > 0 && ctl && inp.pressed('jump') && !this.grounded) {
      this.vy = -4.4; this.vx = -this.wallDirMem * 2.3; this.facing = -this.wallDirMem; this.noCtlX = 9; this.wallCoyote = 0; this.sliding = 0; this.jumpBuf = 0;
      lv.particles.emit(this.cx + this.wallDirMem * 5, this.cy, 6, { angle: this.wallDirMem > 0 ? Math.PI : 0, spread: 1, speed: 1.2, color: ['#fff'], life: 12 });
      lv.audio.sfx('jump');
    }
    // ---- boss power GLIDE: hold jump while falling to float
    this.gliding = false;
    if (this.can('glide') && !this.grounded && this.vy > 0.6 && jumpHeld && !this.sliding && this.dashT <= 0 && !this.pounding) { this.vy = Math.min(this.vy, 0.7); this.gliding = true; }
    // ---- boss power GROUND POUND: press down in the air to slam
    if (this.can('groundpound') && !this.grounded && ctl && inp.pressed('down') && !this.pounding && this.dashT <= 0 && this.vy > -1) {
      this.pounding = true; this.vx = 0; this.vy = 6.2; lv.audio.sfx('dash');
    }
    if (this.pounding) { this.vy = Math.max(this.vy, 5.8); this.vx = 0; }

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
    if (this.pounding && (this.grounded || this.hurtT > 0)) { if (this.grounded) this.slam(lv); this.pounding = false; }
    if (this.grounded && !wasGrounded && preVy > 1.5) { lv.particles.dust(this.cx, this.y + this.h); lv.audio.sfx('land'); }
    if (this.ceil) lv.onHeadBump(this.ceil.c, this.ceil.r);

    // ---- animation + rush afterimages
    if (this.grounded) this.animT += Math.abs(this.vx) * 0.12; else this.animT = 0;
    if (this.rushing || this.dashT > 0) {
      this.trail.push({ x: this.x, y: this.y, f: this.facing, s: this.sprite() });
      if (this.trail.length > 4) this.trail.shift();
      if (this.grounded && lv.frames % 3 === 0) lv.particles.dust(this.cx - this.facing * 4, this.y + this.h, -this.facing);
    } else if (this.trail.length) this.trail.shift();
  }

  // ground pound landing: shockwave that wrecks nearby enemies and rattles the screen
  slam(lv) {
    lv.camera.shake(4, 12); lv.audio.sfx('pound');
    lv.particles.emit(this.cx, this.y + this.h, 14, { angle: -Math.PI / 2, spread: 3.1, speed: 2, color: ['#fff', '#ffd84a', '#c8a060'], life: 20, size: 3 });
    for (const e of lv.enemies) if (!e.dead && Math.abs(e.cx - this.cx) < 34 && Math.abs(e.cy - this.cy) < 24) { if (e.def.small) lv.killEnemy(e); else e.hit(3, lv, 'pound'); }
    if (lv.boss && !lv.boss.dead && Math.abs(lv.boss.cx - this.cx) < 40 && Math.abs(lv.boss.cy - this.cy) < 30) lv.boss.hit(2, lv, 'pound');
  }

  availableWeapons() {
    const w = [];
    if (this.ammo > 0) w.push('gun');
    if (this.charges > 0) w.push('laser');
    if (this.powers.has('iceshot')) w.push('ice');
    if (this.powers.has('fireshot')) w.push('fire');
    return w;
  }
  cycleSlot(d, lv) {
    const a = this.slotList();
    if (a.length < 2) return;
    this.setSlot(a[(Math.max(0, a.indexOf(this.slot)) + d + a.length) % a.length], lv);
    lv.audio.sfx('menu');
    const p = POWERS[this.slot];
    lv.popups.add(this.cx, this.y - 10, p ? p.name : (this.slot === 'base' ? 'NO POWER' : this.slot.toUpperCase()), '#e0b8ff');
  }
  // Aim with the arrows while shooting: Up = straight up, Up+Left/Right = diagonal, Down (in the air) = down / diagonal down.
  aim(inp) {
    const h = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
    const up = inp.down('up'), dn = inp.down('down') && !this.grounded;
    const D = 0.7071;
    if (up) return h ? [h * D, -D] : [0, -1];
    if (dn) return h ? [h * D, D] : [0, 1];
    return [this.facing, 0];
  }
  tryShoot(lv, inp) {
    const w = this.weapon;
    const fire = (kind) => { const [dx, dy] = this.aim(inp); lv.projectiles.fireHero(kind, this.cx + dx * (this.w / 2 + 3), this.cy - 1 + dy * (this.h / 2 + 3), dx, dy); };
    if (w === 'gun' && inp.down('shoot') && this.shootCd <= 0) {
      fire('gun'); this.ammo--; this.shootCd = 11; lv.audio.sfx('shoot');
    } else if (w === 'laser' && inp.pressed('shoot') && this.shootCd <= 0) {
      fire('laser'); this.charges--; this.shootCd = 22; lv.audio.sfx('laser'); lv.camera.shake(1, 4);
    } else if ((w === 'ice' || w === 'fire') && inp.down('shoot') && this.shootCd <= 0 && this.energy >= 6) {
      fire(w); this.energy -= w === 'ice' ? 6 : 9; this.shootCd = 16; lv.audio.sfx(w);
    } else if (inp.pressed('shoot') && !w) lv.audio.sfx('empty');
  }

  landOnPlatforms(lv, prevBottom) {
    if (this.vy < 0 || this.dropT > 0) return;
    for (const p of lv.platforms) {
      if (this.x + this.w <= p.x || this.x >= p.x + p.w) continue;
      const bottom = this.y + this.h;
      if (prevBottom <= p.y + 6 && bottom >= p.y - 0.001) {          // generous: if you sank a few px into the slab you are lifted onto it, not dropped through
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
    if (this.shield > 0 && !this.dead) {       // bubble fades and flickers as hits are used up
      const frac = this.shield / SHIELD_HITS;
      if (this.shield > 3 || lv.frames % (this.shield > 1 ? 6 : 3) < 2 + this.shield) {
        ctx.globalAlpha = 0.25 + 0.75 * frac;
        ctx.drawImage(SHIELD_RING, Math.round(this.cx - 12), Math.round(this.cy - 12));
        ctx.globalAlpha = 1;
      }
    }
  }
}
