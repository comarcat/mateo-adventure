// Endless Battle: an infinite, seeded world generated ahead of the hero and forgotten behind.
// A storm wall chases you (and speeds up), enemy waves sweep in, elites end each zone, and a major boss
// closes every 4th zone. The map is a sliding window: chunks append on the right, columns drop on the left,
// and everything is re-based (shifted) regularly so coordinates stay small and nothing leaks.
import { W, H, T } from '../config.js';
import { Level, assetsFor } from './level.js';
import { TileMap, K } from '../engine/physics.js';
import { Platform } from '../entities/platform.js';
import { Enemy } from '../entities/enemy.js';
import { EndlessGen, ZONE_TILES, ZONE_THEMES, BOSS_EVERY } from '../levels/endlessgen.js';
import { makeArena } from '../levels/arenas.js';
import { WORLDS } from '../data/worlds.js';
import { POWERS, POWER_BY_WORLD } from '../data/powers.js';
import { RNG, hashSeed } from '../engine/rng.js';
import { drawText } from '../engine/font.js';

const AHEAD = 110, REBASE_AT = 210, REBASE_BY = 100;
const ELITE_TYPES = ['charger', 'guard', 'splitter', 'spiky'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class EndlessLevel extends Level {
  constructor(game, run, opts) {
    const gen = new EndlessGen(opts.seed), first = gen.nextChunk();
    super(game, { id: 'endless', name: 'ENDLESS', world: 1, theme: 'grass', par: 0, music: 'endless', tiles: first.rows, platforms: [], texts: [], endless: true, physics: null }, run);
    this.gen = gen; this.seed = String(opts.seed);
    this.colOffset = 0; this.originPx = 0; this.dist = 0; this.zone = 0; this.bossCount = 0; this.arena = null;
    this.hazardX = this.hero.x - 280; this.waveT = 1500; this.lastDistScore = 0;
    this.bannerT = 150; this.fadeT = 0; this.prevTheme = 'grass'; this.stormGap = 999;
    this.addPlatforms(first, 0);
    this.ensureChunks();
  }

  // ------------------------------------------------------------------ world window
  addPlatforms(chunk, c0) { for (const p of chunk.platforms) this.platforms.push(new Platform({ ...p, x: p.x + c0 * T })); }

  appendChunk() {
    const ch = this.gen.nextChunk(), c0 = this.map.w;
    this.map.appendRows(ch.rows);
    this.addPlatforms(ch, c0);
    this.parseRange(c0, c0 + ch.width);
    this.springT.clear(); this.bumps.clear();
  }
  ensureChunks() {
    let guard = 0;
    while (!this.gen.paused && this.map.pxW - this.hero.x < AHEAD * T && guard++ < 6) this.appendChunk();
  }

  onSpecialMarker(ch, c, r) {
    if (ch === 'Y') { this.gateX = c * T; return; }
    if (ch === 'E' && this.gen) {                       // elite mini-boss
      const rng = new RNG(hashSeed(this.seed + ':elite:' + (c + this.colOffset)));
      const e = new Enemy(rng.pick(ELITE_TYPES), 0, 0, this);
      e.x = c * T + (T - e.w) / 2; e.y = (r + 1) * T - e.h; e.makeElite();
      this.enemies.push(e);
    }
  }

  absCol() { return this.colOffset + this.hero.x / T; }

  rebase(n) {
    const px = n * T;
    this.map.dropLeft(n); this.colOffset += n; this.originPx += px;
    const h = this.hero; h.x -= px; for (const t of h.trail) t.x -= px;
    this.camera.x -= px; this.camera.ox -= px; this.respawnAt.x -= px; this.hazardX -= px; if (this.gateX !== undefined) this.gateX -= px;
    for (const e of this.enemies) { e.x -= px; if (e.tx !== undefined) e.tx -= px; }
    for (const p of this.pickups) p.x -= px;
    for (const cp of this.checkpoints) { cp.x -= px; cp.c -= n; }
    for (const p of this.platforms) { p.x -= px; p.ox -= px; }
    this.projectiles.pool.each((p) => { p.x -= px; });
    this.particles.pool.each((p) => { p.x -= px; });
    this.popups.pool.each((p) => { p.x -= px; });
    this.enemies = this.enemies.filter((e) => e.x > -80 && !e.dead);
    this.pickups = this.pickups.filter((p) => p.x > -40 && !p.done);
    this.checkpoints = this.checkpoints.filter((cp) => cp.x > -40);
    this.platforms = this.platforms.filter((p) => p.x + p.w + p.range > -40);
    this.springT.clear(); this.bumps.clear();
    if (this.respawnAt.x < 24) this.respawnAt = this.safeSpotFrom(24);
  }
  // nearest solid, open-topped column at or right of px (keeps respawns out of pits)
  safeSpotFrom(px) {
    for (let c = Math.floor(px / T); c < this.map.w; c++) {
      for (let r = 2; r < this.map.h; r++) if (this.map.kind(c, r) === K.SOLID && this.map.kind(c, r - 1) === K.EMPTY && this.map.kind(c, r - 2) === K.EMPTY) return { x: c * T + 3, y: r * T - 14 };
    }
    return { x: 24, y: 100 };
  }

  // ------------------------------------------------------------------ per-frame
  cameraStep(hero) {
    if (this.arena) this.camera.lockAt(0, 0); else super.cameraStep(hero);
  }

  update() {
    super.update();
    const h = this.hero;
    if (this.status !== 'play') return;
    // zone + scaling
    if (!this.arena) {
      const z = Math.floor(this.absCol() / ZONE_TILES);
      if (z !== this.zone && z >= 0) this.enterZone(z);
      const d = (this.originPx + h.x) / T;
      if (d > this.dist) { const was = Math.floor(this.dist); this.dist = d; this.run.score += (Math.floor(d) - was) * 5; }
      if (!h.dead) {
        this.ensureChunks();
        if (h.x > REBASE_AT * T && this.map.w > REBASE_AT + 40) this.rebase(REBASE_BY);
        if (this.gateX !== undefined && h.x > this.gateX) this.startArena();
        if (h.grounded && !h.riding && !h.onSlope && h.x > this.respawnAt.x + 80 && this.frames % 8 === 0) this.respawnAt = { x: h.x, y: h.y };
        this.hazardTick(); this.waveTick();
      }
    } else if (this.boss && this.boss.dead && this.boss.deadT > 200) this.arenaWon();   // safety net if the orb is missed
    if (this.fadeT > 0) this.fadeT--;
    if (this.bannerT > 0) this.bannerT--;
    // forget wave enemies that flew past
    for (const e of this.enemies) if (e.wave && e.x < this.camera.x - 100) e.dead = true;
  }

  enterZone(z) {
    this.prevTheme = ZONE_THEMES[this.zone % 8]; this.zone = z;
    this.world = clamp(1 + Math.floor(z * 0.8), 1, 8);
    this.data.physics = this.gen.profile(z).physics || null;
    this.bannerT = 160; this.fadeT = 70; this.audio.sfx('checkpoint');
  }

  hazardTick() {
    const h = this.hero, df = this.difficulty.enemySpeed;
    const gap = h.x - this.hazardX; this.stormGap = gap;
    let v = Math.min(1.8, 0.5 + this.dist * 0.0007 + this.zone * 0.02) * (0.85 + (df - 0.8) * 0.5);
    if (gap > 260) v *= 1.6 + (gap - 260) / 300;                     // rubber band: never lose the pressure
    this.hazardX += v;
    if (gap < 0 && this.frames % 36 === 0) h.hurt(1, h.cx - 60, this);        // knocked forward out of the storm
    if (gap < -48 && !this.cheatInvincible) h.die(this);
  }

  waveTick() {
    if (--this.waveT > 0) return;
    const n = Math.min(6, 2 + Math.floor(this.zone * 0.8));
    for (let i = 0; i < n; i++) {
      const e = this.spawnEnemy('bat', this.camera.x + W + 24 + i * 28, 36 + ((i * 37 + this.frames) % 96));
      e.wave = true; e.dir = -1; e.speed *= 2.3;
    }
    this.audio.sfx('enemyshot');
    this.waveT = Math.max(560, 1700 - this.zone * 150);
  }

  // ------------------------------------------------------------------ major boss arena
  startArena() {
    this.gateX = undefined;
    const idx = this.bossCount, w = 1 + (idx % 8), ar = makeArena(w);
    this.arena = { idx, w, dist: this.dist };
    this.bossHpMul = 1 + 0.5 * Math.floor(idx / 8);
    const rows = ar.tiles.map((r, i) => r + '##');                    // 2 extra wall columns on the right
    this.map = new TileMap(rows);
    this.enemies = []; this.pickups = []; this.checkpoints = []; this.platforms = []; this.boss = null;
    this.projectiles.clear(); this.particles.clear(); this.popups.clear();
    this.data.boss = WORLDS[w].boss; this.data.lockCamera = true; this.data.physics = ar.physics || null;
    this.parseRange(0, this.map.w);
    const h = this.hero; h.x = this.start.x; h.y = this.start.y; h.vx = 0; h.vy = 0; h.invuln = 90; h.trail.length = 0;
    this.respawnAt = { ...this.start };
    this.camera.lockAt(0, 0);
    this.audio.music('boss'); this.bannerT = 160; this.arenaBanner = WORLDS[w].bossName;
    this.hazardX = -9999;
  }

  // boss orb replaces the campaign "level clear": it ends the arena
  collect(p) { if (p.type === 'power') { p.done = true; this.arenaWon(); return; } super.collect(p); }

  arenaWon() {
    if (!this.arena) return;
    const a = this.arena, h = this.hero, pw = POWER_BY_WORLD[a.w];
    if (pw && !h.powers.has(pw)) { h.powers.add(pw); if (!this.run.powers.includes(pw)) this.run.powers.push(pw); this.popups.add(h.cx, h.y - 20, POWERS[pw].name + '!', '#e0b8ff'); }
    h.hp = h.maxHp; if (this.run.lives < 9) this.run.lives++; this.popups.add(h.cx, h.y - 32, 'BOSS DOWN!  +1UP', '#37d46a');
    this.audio.sfx('1up');
    for (let r = 0; r <= 10; r++) for (const c of [16, 17]) this.map.set(c, r, '.');          // open the exit
    this.bossCount++; this.arena = null; this.data.lockCamera = false; this.data.boss = null; this.boss = null; this.arenaBanner = null;
    this.colOffset = this.gen.col - this.map.w; this.originPx = a.dist * T - h.x;
    this.gen.resume(); this.hazardX = h.x - 320; this.waveT = 900;
    this.audio.music('endless');
    this.ensureChunks();
  }

  onDeathDone() {
    if (this.run.lives > 0) {
      this.run.lives--; this.deadT = 0; this.combo = 0; this.projectiles.clear();
      const sp = this.arena ? this.start : this.respawnAt;
      this.hero.respawn(sp.x, sp.y);
      if (!this.arena) this.hazardX = Math.min(this.hazardX, this.hero.x - 280);
      this.camera.snap(this.hero, this.map.pxW, this.map.pxH);
    } else this.status = 'gameover';
  }

  // ------------------------------------------------------------------ drawing
  tilesetAt(c) { const z = Math.max(0, Math.floor((c + this.colOffset) / ZONE_TILES)); return assetsFor(ZONE_THEMES[z % 8]).tiles; }

  drawBackground(ctx) {
    const cam = this.camera, cur = assetsFor(ZONE_THEMES[this.zone % 8]);
    if (this.fadeT > 0) { assetsFor(this.prevTheme).bg.draw(ctx, cam.ox, this.frames * 0.2); ctx.globalAlpha = 1 - this.fadeT / 70; cur.bg.draw(ctx, cam.ox, this.frames * 0.2); ctx.globalAlpha = 1; }
    else cur.bg.draw(ctx, cam.ox, this.frames * 0.2);
  }

  drawOverlay(ctx) {
    if (this.arena) return;
    const cam = this.camera, x1 = Math.round(this.hazardX);
    if (x1 < cam.ox - 12) return;
    const x0 = cam.ox - 8, t = this.frames;
    ctx.fillStyle = 'rgba(28,10,56,0.9)'; ctx.fillRect(x0, cam.oy, Math.min(x1, cam.ox + W + 8) - x0, H);
    for (let y = cam.oy; y < cam.oy + H; y += 4) {             // jagged churning edge
      const e = Math.round(Math.sin(y * 0.13 + t * 0.12) * 5 + Math.sin(y * 0.31 - t * 0.2) * 3);
      ctx.fillStyle = 'rgba(28,10,56,0.9)'; ctx.fillRect(x1 - 2, y, 6 + e, 4);
      ctx.fillStyle = 'rgba(122,74,224,0.55)'; ctx.fillRect(x1 + 2 + e, y, 2, 4);
    }
    if (t % 47 < 4) { ctx.fillStyle = '#fff6a0'; const y = (t * 37) % H; ctx.fillRect(x1 - 18, cam.oy + y, 2, 22); ctx.fillRect(x1 - 15, cam.oy + y + 20, 2, 18); }
  }
}

// HUD extras for endless (drawn by EndlessState)
export function drawEndlessHUD(ctx, lv) {
  const W2 = W, SH = '#2a1b3d';
  drawText(ctx, Math.floor(lv.dist) + 'M', W2 / 2, 5, '#fff', 1, { align: 'center', shadow: SH });
  const gap = lv.stormGap;
  if (!lv.arena && gap < 150) {
    const a = gap < 70 ? (lv.frames % 10 < 5 ? 1 : 0.4) : 0.8;
    ctx.globalAlpha = a; drawText(ctx, '<< STORM', 6, 44, gap < 70 ? '#ff4a5a' : '#c8a0ff', 1, { shadow: SH }); ctx.globalAlpha = 1;
  }
  if (lv.bannerT > 0 && lv.status === 'play') {
    ctx.globalAlpha = Math.min(1, lv.bannerT / 30);
    if (lv.arena) { drawText(ctx, 'BOSS: ' + lv.arenaBanner, W2 / 2, 80, '#ff6a4a', 2, { align: 'center', shadow: SH }); }
    else { drawText(ctx, 'ZONE ' + (lv.zone + 1), W2 / 2, 76, '#fff', 2, { align: 'center', shadow: SH }); drawText(ctx, WORLDS[1 + (lv.zone % 8)].name, W2 / 2, 96, '#ffd84a', 1, { align: 'center', shadow: SH }); }
    ctx.globalAlpha = 1;
  }
}
