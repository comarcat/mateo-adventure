// A running level: tilemap + entities + hero + camera + particles. Owns the gameplay simulation.
// The PlayState wraps this with pause/transition logic; this class never touches the state machine.
import { W, H, T } from '../config.js';
import { TileMap, K, tileInRect, overlap } from '../engine/physics.js';
import { Camera } from '../engine/camera.js';
import { Particles } from '../entities/particles.js';
import { Platform } from '../entities/platform.js';
import { Hero } from '../entities/hero.js';
import { THEMES } from '../gfx/themes.js';
import { bakeTileset } from '../gfx/tiles.js';
import { makeBackground } from '../gfx/backgrounds.js';
import { drawText } from '../engine/font.js';

const assetCache = {};     // baked per theme, shared across level restarts
function assetsFor(theme) {
  if (!assetCache[theme]) {
    const th = THEMES[theme];
    assetCache[theme] = { th, tiles: bakeTileset(th), bg: makeBackground(th) };
  }
  return assetCache[theme];
}

export class Level {
  constructor(game, data, run) {
    this.game = game; this.input = game.input; this.audio = game.audio; this.run = run;
    this.data = data;
    this.assets = assetsFor(data.theme);
    this.map = new TileMap(data.tiles);
    this.camera = new Camera();
    this.particles = new Particles();
    this.platforms = (data.platforms || []).map((p) => new Platform(p));
    this.texts = data.texts || [];
    this.checkpoints = []; this.goal = null; this.start = { x: 32, y: 32 };
    this.springT = new Map();
    this.frames = 0; this.status = 'play'; this.clearT = 0; this.deadT = 0;
    this.cheatInvincible = false; this.cheatInfiniteRush = false; this.showBoxes = false;
    this.parseMarkers();
    this.hero = new Hero(this.start.x, this.start.y);
    this.respawnAt = { ...this.start };
    this.camera.snap(this.hero, this.map.pxW, this.map.pxH);
  }

  // Markers in the tile grid (P start, C checkpoint, G goal) become entities; the tile becomes empty.
  parseMarkers() {
    const m = this.map;
    for (let r = 0; r < m.h; r++) for (let c = 0; c < m.w; c++) {
      const ch = m.char(c, r);
      if (ch === 'P') { this.start = { x: c * T + 3, y: (r + 1) * T - 14 }; m.set(c, r, '.'); }
      else if (ch === 'C') { this.checkpoints.push({ x: c * T, y: (r - 1) * T, w: T, h: 2 * T, on: false, c, r }); m.set(c, r, '.'); }
      else if (ch === 'G') { this.goal = { x: c * T - T / 2, y: (r - 2) * T, w: T * 2, h: 3 * T }; m.set(c, r, '.'); }
    }
  }

  onHeadBump(c, r) { /* Stage 2: ? blocks and breakable bricks */ }

  update() {
    this.frames++;
    for (const p of this.platforms) p.update();
    const hero = this.hero;
    hero.update(this);
    this.particles.update();
    for (const [k, v] of this.springT) { if (v <= 1) this.springT.delete(k); else this.springT.set(k, v - 1); }

    if (!hero.dead && this.status !== 'gameover') {
      this.checkSprings(hero);
      this.checkHazards(hero);
      this.checkCheckpoints(hero);
      if (this.goal && this.status === 'play' && overlap(hero, this.goal)) this.clearLevel();
      if (hero.y > this.map.pxH + 24) hero.die(this);        // fell into a pit
    }
    if (hero.dead && ++this.deadT > 90) this.onDeathDone();
    if (this.status === 'clear') this.clearT++;

    this.camera.follow(hero.dead ? { ...hero, y: Math.min(hero.y, this.map.pxH - 40), facing: 0 } : hero, this.map.pxW, this.map.pxH);
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
    this.particles.emit(this.goal.x + 16, this.goal.y + 8, 20, { speed: 2, color: ['#ffd84a', '#fff', '#37d46a'], life: 40 });
  }

  onDeathDone() {
    if (this.run.lives > 0) {
      this.run.lives--; this.deadT = 0;
      this.hero.respawn(this.respawnAt.x, this.respawnAt.y);
      this.camera.snap(this.hero, this.map.pxW, this.map.pxH);
    } else this.status = 'gameover';
  }

  // ------------------------------------------------------------------ drawing
  draw(ctx) {
    const { tiles, bg } = this.assets;
    const cam = this.camera;
    bg.draw(ctx, cam.ox, this.frames * 0.2);
    ctx.save();
    ctx.translate(-cam.ox, -cam.oy);
    this.drawTiles(ctx, tiles);
    for (const t of this.texts) drawText(ctx, t.text, t.x, t.y, '#fff', 1, { shadow: '#2a1b3d' });
    for (const cp of this.checkpoints) ctx.drawImage(tiles.flag[cp.on ? 1 : 0], cp.x, cp.y);
    if (this.goal) ctx.drawImage(tiles.goal, this.goal.x, this.goal.y - 4);
    for (const p of this.platforms) p.draw(ctx, tiles.platform);
    this.hero.draw(ctx, this);
    this.particles.draw(ctx);
    if (this.showBoxes) this.drawBoxes(ctx);
    ctx.restore();
  }

  drawTiles(ctx, ts) {
    const m = this.map, cam = this.camera;
    const c0 = Math.max(0, Math.floor(cam.ox / T)), c1 = Math.min(m.w - 1, Math.floor((cam.ox + W) / T));
    const r0 = Math.max(0, Math.floor(cam.oy / T)), r1 = Math.min(m.h - 1, Math.floor((cam.oy + H) / T));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const k = m.k[r * m.w + c];
      if (!k) continue;
      let img;
      switch (k) {
        case K.SOLID: img = m.char(c, r) === 'B' ? ts.brick : (this.covered(c, r) ? ts.dirt : ts.grass); break;
        case K.ONEWAY: img = ts.oneway; break;
        case K.SPIKE: img = ts.spike; break;
        case K.SLOPE_R: img = ts.slopeR; break;
        case K.SLOPE_L: img = ts.slopeL; break;
        case K.SPRING: { const t = this.springT.get(r * m.w + c) || 0; img = ts.spring[t > 8 ? 2 : (t > 0 ? 1 : 0)]; break; }
      }
      ctx.drawImage(img, c * T, r * T);
    }
  }

  covered(c, r) { const k = this.map.kind(c, r - 1); return k === K.SOLID || k === K.SLOPE_R || k === K.SLOPE_L; }

  drawBoxes(ctx) {
    const h = this.hero;
    ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(h.x) + 0.5, Math.round(h.y) + 0.5, h.w - 1, h.h - 1);
    for (const p of this.platforms) ctx.strokeRect(Math.round(p.x) + 0.5, Math.round(p.y) + 0.5, p.w - 1, p.h - 1);
  }
}
