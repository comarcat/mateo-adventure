// A running level: tilemap + entities + hero + camera + particles. Owns the gameplay simulation.
// The PlayState wraps this with pause/transition logic; this class never touches the state machine.
import { W, H, T } from '../config.js';
import { TileMap, K, tileInRect, overlap } from '../engine/physics.js';
import { Camera } from '../engine/camera.js';
import { Particles } from '../entities/particles.js';
import { Platform } from '../entities/platform.js';
import { Hero } from '../entities/hero.js';
import { Enemy } from '../entities/enemy.js';
import { Boss, drawBossBar } from '../entities/boss.js';
import { Projectiles } from '../entities/projectiles.js';
import { Popups } from '../entities/popups.js';
import { THEMES } from '../gfx/themes.js';
import { bakeTileset } from '../gfx/tiles.js';
import { makeBackground } from '../gfx/backgrounds.js';
import { ITEM_ART, drawCoin } from '../gfx/art.js';
import { drawSprite } from '../gfx/sprites.js';
import { drawText } from '../engine/font.js';
import { ENEMY_BY_CHAR } from '../data/enemies.js';
import { PICKUPS, PICKUP_TYPES } from '../data/pickups.js';

const assetCache = {};     // baked per theme, shared across level restarts
export function assetsFor(theme) {
  if (!assetCache[theme]) {
    const th = THEMES[theme];
    assetCache[theme] = { th, tiles: bakeTileset(th), bg: makeBackground(th) };
  }
  return assetCache[theme];
}

const COMBO_FRAMES = 150;
const data_boss = (lv) => !!lv.data.boss;

export class Level {
  constructor(game, data, run) {
    this.game = game; this.input = game.input; this.audio = game.audio; this.run = run;
    this.difficulty = game.difficulty;
    this.data = data; this.world = data.world || 1;
    this.assets = assetsFor(data.theme);
    this.map = new TileMap(data.tiles);
    this.camera = new Camera();
    this.particles = new Particles();
    this.projectiles = new Projectiles();
    this.popups = new Popups();
    this.platforms = (data.platforms || []).map((p) => new Platform(p));
    this.texts = data.texts || [];
    this.checkpoints = []; this.goal = null; this.start = { x: 32, y: 32 };
    this.enemies = []; this.pickups = []; this.boss = null; this.newPower = null; this.bumps = new Map(); this.springT = new Map();
    this.frames = 0; this.status = 'play'; this.clearT = 0; this.deadT = 0;
    this.combo = 0; this.comboT = 0; this.damageTaken = 0; this.levelScore = 0; this.kills = 0;
    this.cheatInvincible = false; this.cheatInfiniteRush = false; this.showBoxes = false;
    this.parseMarkers();
    this.hero = new Hero(this.start.x, this.start.y, this.difficulty.maxHp, run.powers || []);
    this.respawnAt = { ...this.start };
    this.camera.snap(this.hero, this.map.pxW, this.map.pxH);
  }

  // Markers in the tile grid become entities and the tile becomes empty:
  //   P start, C checkpoint, G goal, enemy chars (see data/enemies.js), pickup chars (see data/pickups.js)
  parseMarkers() { this.parseRange(0, this.map.w); }

  // Scans columns [c0,c1) for marker characters and turns them into entities (tile becomes empty).
  parseRange(c0, c1) {
    const m = this.map;
    for (let r = 0; r < m.h; r++) for (let c = c0; c < c1; c++) {
      const ch = m.char(c, r);
      if (ch === '.') continue;
      if (ch === 'P') { this.start = { x: c * T + 3, y: (r + 1) * T - 14 }; m.set(c, r, '.'); }
      else if (ch === 'C') { this.checkpoints.push({ x: c * T, y: (r - 1) * T, w: T, h: 2 * T, on: false, c, r }); m.set(c, r, '.'); }
      else if (ch === 'G') { this.goal = { x: c * T - T / 2, y: (r - 2) * T, w: T * 2, h: 3 * T }; m.set(c, r, '.'); }
      else if (ch === 'X' && this.data.boss) { this.boss = new Boss(this.data.boss, c * T + 8, (r + 1) * T, this); m.set(c, r, '.'); }
      else if (ENEMY_BY_CHAR[ch]) {
        const e = new Enemy(ENEMY_BY_CHAR[ch], 0, 0, this);
        e.x = c * T + (T - e.w) / 2;
        e.y = e.def.ai === 'fly' || e.def.ai === 'swoop' ? r * T + 3 : (r + 1) * T - e.h; e.baseY = e.y;
        this.enemies.push(e); m.set(c, r, '.');
      } else if (PICKUPS[ch]) { this.addPickup(PICKUPS[ch].type, c * T + 2, r * T + 2); m.set(c, r, '.'); }
      else if (ch === 'E' || ch === 'Y') { this.onSpecialMarker(ch, c, r); m.set(c, r, '.'); }
    }
  }
  onSpecialMarker(ch, c, r) { /* endless mode: E = elite spawn, Y = boss gate */ }

  spawnEnemy(type, x, y) {
    const e = new Enemy(type, x, y, this); e.awake = true; e.baseY = y; this.enemies.push(e); return e;
  }
  spawnPowerOrb(x, y) { this.addPickup('power', x, y); this.audio.sfx('powerup'); this.particles.emit(x + 7, y + 7, 16, { speed: 2, color: ['#e0b8ff', '#fff'], life: 30 }); }

  addPickup(type, x, y) { this.pickups.push({ type, x, y, w: 12, h: 12, t: Math.floor(Math.random() * 60), done: false }); }

  // ------------------------------------------------------------------ scoring
  addScore(base, x, y, useCombo = false) {
    let pts = base;
    if (useCombo) { this.combo++; this.comboT = COMBO_FRAMES; pts = base * Math.min(this.combo, 8); }
    pts = Math.round(pts * this.difficulty.scoreMul);
    this.run.score += pts; this.levelScore += pts;
    this.popups.add(x, y, useCombo && this.combo > 1 ? pts + ' X' + Math.min(this.combo, 8) : pts, useCombo && this.combo > 1 ? '#ffd84a' : '#fff');
  }

  killEnemy(e, silent = false) {
    if (e.dead) return;
    e.dead = true; this.kills++;
    this.particles.emit(e.cx, e.cy, 14, { speed: 1.9, g: 0.05, life: 28, size: 3, color: e.def.color });
    this.audio.sfx('enemydie');
    if (e.def.splits && !silent) for (let i = 0; i < e.def.splits; i++) { const m = this.spawnEnemy('blob', e.x + i * 6 - 2, e.y); m.dir = i ? 1 : -1; m.vy = -2.4; m.speed *= 1.3; }
    if (!silent) this.addScore(e.score || e.def.score, e.cx, e.y - 4, true);
  }

  onHeadBump(c, r) {
    const ch = this.map.char(c, r);
    if (ch !== '?') return;
    this.map.set(c, r, '!'); this.bumps.set(c + ',' + r, 8);
    this.audio.sfx('bump');
    const content = (this.data.blocks && this.data.blocks[c + ',' + r]) || 'coin';
    if (content === 'coin') { this.collectCoin(c * T + 2, (r - 1) * T, true); }
    else this.addPickup(content, c * T + 2, (r - 1) * T - 2);
    // anything standing on the block gets knocked
    for (const e of this.enemies) if (!e.dead && Math.abs(e.cx - (c * T + 8)) < 10 && Math.abs(e.y + e.h - r * T) < 3) this.killEnemy(e);
  }

  collectCoin(x, y, pop = false) {
    this.run.coins++; this.audio.sfx('coin');
    this.addScore(10, x + 6, y - 2);
    if (pop) this.particles.emit(x + 6, y, 6, { angle: -Math.PI / 2, spread: 0.8, speed: 2, color: ['#ffcf2a', '#fff'], life: 18 });
    if (this.run.coins >= 100) { this.run.coins -= 100; this.giveLife(x, y); }
  }
  giveLife(x, y) { if (this.run.lives < 9) this.run.lives++; this.audio.sfx('1up'); this.popups.add(x, y - 8, '1UP', '#37d46a'); }

  collect(p) {
    const h = this.hero, cx = p.x + 6, cy = p.y;
    switch (p.type) {
      case 'coin': this.collectCoin(p.x, p.y); break;
      case 'star': h.star = 600; this.audio.sfx('powerup'); this.addScore(500, cx, cy); break;
      case 'oneup': this.giveLife(cx, cy); this.addScore(1000, cx, cy - 8); break;
      case 'shield': h.shield = 8; this.audio.sfx('powerup'); this.addScore(300, cx, cy); break;
      case 'gun': h.ammo = Math.min(99, h.ammo + 20); h.weapon = 'gun'; this.audio.sfx('powerup'); this.addScore(200, cx, cy); break;
      case 'laser': h.charges = Math.min(20, h.charges + 5); h.weapon = 'laser'; this.audio.sfx('powerup'); this.addScore(200, cx, cy); break;
      case 'power': { const id = this.data.power; h.powers.add(id); this.newPower = id; if (this.run.powers && !this.run.powers.includes(id)) this.run.powers.push(id); this.audio.sfx('powerup'); this.addScore(1000, cx, cy); this.clearLevel(); break; }
      case 'apple': h.hp = Math.min(h.maxHp, h.hp + 2); this.audio.sfx('eat'); this.addScore(100, cx, cy); this.popups.add(cx, cy - 8, '+2 HP', '#ff7a7a'); break;
      case 'pizza': h.hp = Math.min(h.maxHp, h.hp + 4); this.audio.sfx('eat'); this.addScore(100, cx, cy); this.popups.add(cx, cy - 8, '+4 HP', '#ff7a7a'); break;
    }
    if (p.type !== 'coin') this.particles.emit(cx, p.y + 6, 10, { speed: 1.6, color: ['#fff', '#ffd84a'], life: 22 });
    p.done = true;
  }

  // ------------------------------------------------------------------ simulation
  update() {
    this.frames++;
    for (const p of this.platforms) p.update();
    const hero = this.hero;
    hero.update(this);
    this.cameraStep(hero);
    if (this.boss) this.boss.update(this);

    for (const e of this.enemies) e.update(this);
    this.projectiles.update(this);
    this.particles.update(); this.popups.update();
    for (const [k, v] of this.springT) { if (v <= 1) this.springT.delete(k); else this.springT.set(k, v - 1); }
    for (const [k, v] of this.bumps) { if (v <= 1) this.bumps.delete(k); else this.bumps.set(k, v - 1); }
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;

    if (!hero.dead && this.status !== 'gameover') {
      this.checkSprings(hero);
      this.checkHazards(hero);
      this.checkCheckpoints(hero);
      this.checkEnemies(hero);
      if (this.boss && !this.boss.dead && this.boss.active) this.checkBoss(hero);
      this.checkPickups(hero);
      if (this.goal && this.status === 'play' && overlap(hero, this.goal)) this.clearLevel();
      if (hero.y > this.map.pxH + 24) hero.die(this);        // fell into a pit
    }
    // compact dead entities in place (no per-frame allocation)
    if (this.frames % 30 === 0) {
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.pickups = this.pickups.filter((p) => !p.done);
    }
    if (hero.dead && ++this.deadT > 90) this.onDeathDone();
    if (this.status === 'clear') this.clearT++;
  }

  cameraStep(hero) {
    if (this.data.lockCamera) this.camera.lockAt(Math.max(0, (this.map.pxW - W) / 2), Math.max(0, this.map.pxH - H));
    else this.camera.follow(hero.dead ? { ...hero, y: Math.min(hero.y, this.map.pxH - 40), facing: 0 } : hero, this.map.pxW, this.map.pxH);
  }

  checkEnemies(h) {
    for (const e of this.enemies) {
      if (e.dead || !e.awake) continue;
      if (!overlap({ x: h.x + 1, y: h.y + 1, w: h.w - 2, h: h.h - 1 }, e)) continue;
      if (e.frozen > 0 && !h.smashing) { if (h.vy > 0.3 && (h.y + h.h) - e.y <= 10) { e.hit(2, this); h.vy = -3.6; h.noCut = true; } continue; }
      const stomping = h.vy > 0.3 && (h.y + h.h) - e.y <= 10 && !h.rushing;
      if (h.smashing && (e.def.small || h.star > 0)) {            // rush / star plows through small enemies
        this.killEnemy(e);
        this.particles.emit(e.cx, e.cy, 6, { angle: h.facing > 0 ? 0 : Math.PI, spread: 0.8, speed: 3, color: ['#fff', '#ffd84a'], life: 14 });
      } else if (h.rushing) {                                       // rush bashes bigger enemies, then stops
        e.hit(2, this); h.rushing = false; h.rushCd = 30; h.vx = -h.facing * 1.8; h.vy = -2;
        this.camera.shake(2, 6);
      } else if (stomping && e.def.stomp) {
        e.hit(h.pounding ? 3 : 1, this);
        h.vy = this.input.down('jump') ? -5.2 : -3.6; h.noCut = true; h.grounded = false; h.airJumps = 1;
        h.invuln = Math.max(h.invuln, 6);
        this.particles.emit(h.cx, h.y + h.h, 5, { angle: -Math.PI / 2, spread: 2.2, speed: 1.3, color: ['#fff'], life: 12 });
      } else {
        h.hurt(1, e.cx, this);
      }
    }
  }

  checkBoss(h) {
    const b = this.boss;
    if (!b.touchable) return;
    if (!overlap({ x: h.x + 1, y: h.y + 1, w: h.w - 2, h: h.h - 1 }, b)) return;
    const stomping = h.vy > 0.3 && (h.y + h.h) - b.y <= 12 && !h.rushing && h.dashT <= 0;
    if (stomping) {
      b.hit(h.pounding ? 3 : 1, this, 'stomp');
      h.vy = this.input.down('jump') ? -5.4 : -4; h.noCut = true; h.grounded = false; h.airJumps = 1; h.invuln = Math.max(h.invuln, 8); h.pounding = false;
    } else if (h.rushing || h.dashT > 0) {
      b.hit(2, this, 'rush'); h.rushing = false; h.dashT = 0; h.rushCd = 30; h.vx = -h.facing * 2.2; h.vy = -2.4;
    } else h.hurt(1, b.cx, this);
  }

  checkPickups(h) {
    for (const p of this.pickups) {
      if (p.done) continue;
      if (this.hero.star > 0 && p.type === 'coin') { /* magnet-ish flair could go here */ }
      if (p.type === 'coin' && h.powers.has('magnet')) {       // boss power: COIN MAGNET
        const dx = h.cx - (p.x + 6), dy = h.cy - (p.y + 6), d = Math.hypot(dx, dy);
        if (d < 64 && d > 1) { p.x += dx / d * 2.8; p.y += dy / d * 2.8; }
      }
      if (overlap(h, { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: p.h + 2 })) this.collect(p);
    }
  }

  checkSprings(h) {
    const cx = h.cx, bottom = h.y + h.h;
    const c = Math.floor(cx / T), r = Math.floor((bottom - 1) / T);
    if (this.map.kind(c, r) === K.SPRING && bottom - r * T >= 8 && h.vy >= 0) {
      h.vy = -(this.input.down('jump') ? 7.7 : 6.8); h.noCut = true; h.grounded = false; h.riding = null; h.coyote = 0;
      this.springT.set(r * this.map.w + c, 14);
      this.audio.sfx('spring');
      this.particles.emit(cx, bottom, 6, { angle: -Math.PI / 2, spread: 1.4, speed: 1.2, life: 16, color: ['#fff', '#ff9aa2'] });
    }
  }

  checkHazards(h) {
    const hit = tileInRect(this.map, h.x + 1, h.y + 3, h.w - 2, h.h - 3, K.SPIKE);
    if (hit) {
      const sx = hit.c * T + 2, sy = hit.r * T + 8;
      if (overlap({ x: h.x + 1, y: h.y + 3, w: h.w - 2, h: h.h - 3 }, { x: sx, y: sy, w: 12, h: 8 })) h.hurt(1, hit.c * T + 8, this);
    }
  }

  checkCheckpoints(h) {
    for (const cp of this.checkpoints) {
      if (!cp.on && overlap(h, cp)) {
        cp.on = true; this.respawnAt = { x: cp.x + 3, y: cp.y + 2 * T - 14 };
        this.audio.sfx('checkpoint');
        this.particles.emit(cp.x + 8, cp.y + 8, 10, { speed: 1.4, color: ['#ffd84a', '#fff'], life: 24 });
      }
    }
  }

  clearLevel() {
    this.status = 'clear'; this.clearT = 0;
    this.audio.sfx('clear');
    const gx = this.goal ? this.goal.x + 16 : this.hero.cx, gy = this.goal ? this.goal.y + 8 : this.hero.y;
    this.particles.emit(gx, gy, 20, { speed: 2, color: ['#ffd84a', '#fff', '#37d46a'], life: 40 });
  }

  onDeathDone() {
    if (this.run.lives > 0) {
      this.run.lives--; this.deadT = 0; this.combo = 0;
      this.projectiles.clear();
      this.hero.respawn(this.respawnAt.x, this.respawnAt.y);
      this.camera.snap(this.hero, this.map.pxW, this.map.pxH);
    } else this.status = 'gameover';
  }

  // End-of-level bonuses: completion, speed (vs par time) and no-damage.
  bonuses() {
    const secs = this.frames / 60, par = this.data.par || 90;
    const df = this.difficulty.scoreMul;
    const speed = Math.round(Math.max(0, Math.min(2000, (par - secs) * 40)) * df);
    const clear = Math.round(1000 * df), nodmg = this.damageTaken === 0 ? Math.round(2000 * df) : 0;
    return { clear, speed, nodmg, total: clear + speed + nodmg, secs };
  }

  // ------------------------------------------------------------------ drawing
  draw(ctx) {
    const { tiles, bg } = this.assets;
    const cam = this.camera;
    this.drawBackground(ctx);
    ctx.save();
    ctx.translate(-cam.ox, -cam.oy);
    this.drawTiles(ctx, tiles);
    for (const t of this.texts) drawText(ctx, t.text, t.x, t.y, '#fff', 1, { shadow: '#2a1b3d' });
    for (const cp of this.checkpoints) ctx.drawImage(tiles.flag[cp.on ? 1 : 0], cp.x, cp.y);
    if (this.goal) ctx.drawImage(tiles.goal, this.goal.x, this.goal.y - 4);
    for (const p of this.platforms) p.draw(ctx, tiles.platform);
    this.drawPickups(ctx);
    for (const e of this.enemies) if (!e.dead && e.x > cam.ox - 20 && e.x < cam.ox + W + 20) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    this.hero.draw(ctx, this);
    this.projectiles.draw(ctx);
    this.drawOverlay(ctx);
    this.particles.draw(ctx);
    this.popups.draw(ctx);
    if (this.showBoxes) this.drawBoxes(ctx);
    ctx.restore();
  }

  drawBackground(ctx) { this.assets.bg.draw(ctx, this.camera.ox, this.frames * 0.2); }
  drawOverlay(ctx) { /* endless: the chasing storm */ }

  drawPickups(ctx) {
    const cam = this.camera;
    for (const p of this.pickups) {
      if (p.done || p.x < cam.ox - 16 || p.x > cam.ox + W + 16) continue;
      p.t++;
      if (p.type === 'coin') { drawCoin(ctx, p.x, p.y, p.t); continue; }
      const bob = Math.round(Math.sin(p.t * 0.1) * 1.5);
      const art = ITEM_ART[p.type];
      if (p.type === 'star' && p.t % 8 < 4) ctx.globalAlpha = 0.8;
      ctx.drawImage(art.r, p.x - 1, p.y - 1 + bob);
      ctx.globalAlpha = 1;
    }
  }

  tilesetAt(c) { return this.assets.tiles; }

  drawTiles(ctx, ts0) {
    const m = this.map, cam = this.camera;
    const c0 = Math.max(0, Math.floor(cam.ox / T)), c1 = Math.min(m.w - 1, Math.floor((cam.ox + W) / T));
    const r0 = Math.max(0, Math.floor(cam.oy / T)), r1 = Math.min(m.h - 1, Math.floor((cam.oy + H) / T));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const k = m.k[r * m.w + c];
      if (!k) continue;
      const ts = this.tilesetAt(c);
      let img, dy = 0;
      switch (k) {
        case K.SOLID: {
          const ch = m.char(c, r);
          if (ch === 'B') img = ts.brick;
          else if (ch === '?') img = ts.blocks.q;
          else if (ch === '!') { img = ts.blocks.used; dy = -(this.bumps.get(c + ',' + r) || 0) * 0.5; }
          else img = this.covered(c, r) ? ts.dirt : ts.grass;
          break;
        }
        case K.ONEWAY: img = ts.oneway; break;
        case K.SPIKE: img = ts.spike; break;
        case K.SLOPE_R: img = ts.slopeR; break;
        case K.SLOPE_L: img = ts.slopeL; break;
        case K.SPRING: { const t = this.springT.get(r * m.w + c) || 0; img = ts.spring[t > 8 ? 2 : (t > 0 ? 1 : 0)]; break; }
      }
      ctx.drawImage(img, c * T, r * T + dy);
    }
  }

  covered(c, r) { const k = this.map.kind(c, r - 1); return k === K.SOLID || k === K.SLOPE_R || k === K.SLOPE_L; }

  drawBoxes(ctx) {
    const h = this.hero;
    ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(h.x) + 0.5, Math.round(h.y) + 0.5, h.w - 1, h.h - 1);
    for (const p of this.platforms) ctx.strokeRect(Math.round(p.x) + 0.5, Math.round(p.y) + 0.5, p.w - 1, p.h - 1);
    ctx.strokeStyle = '#ff4040';
    for (const e of this.enemies) if (!e.dead) ctx.strokeRect(Math.round(e.x) + 0.5, Math.round(e.y) + 0.5, e.w - 1, e.h - 1);
  }
}
