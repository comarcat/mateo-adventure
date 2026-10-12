// Bosses: big enemies with phases. Each boss type is a definition object below; Boss owns the shared logic
// (hp, invulnerability frames, phases, weak-point rules, defeat sequence). To add a boss: add a definition,
// its art in gfx/art.js (BOSS_ART), an arena in levels/arenas.js, and a row in data/worlds.js.
//   hittable(b) - false while armoured/hidden (shots spark off)     contact(b) - false when it can't touch you
//   clip        - draw only above this y (burrowing)                  phases      - hp fractions where a new phase starts
import { W, T } from '../config.js';
import { moveXBy, moveY } from '../engine/physics.js';
import { WORLD_SCALING } from '../data/difficulty.js';
import { BOSS_ART, rageFrames } from '../gfx/art.js';
import { drawSprite } from '../gfx/sprites.js';
import { drawText } from '../engine/font.js';

const GROUND = 176;                               // arena floor line (row 11)
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const popup = (lv, b, t, c = '#ff7a3a') => lv.popups.add(b.cx, b.y - 12, t, c);
const roar = (lv, n = 4) => { lv.camera.shake(n, 20); lv.audio.sfx('bossroar'); };

// aimed arc: returns velocity that lands near (tx,ty) after `frames` with gravity g
function arcVel(sx, sy, tx, ty, g = 0.1, frames = 42) { return [(tx - sx) / frames, (ty - sy) / frames - 0.5 * g * frames]; }

// ------------------------------------------------------------------ 1. Slime King (world 1)
const SlimeKing = {
  name: 'SLIME KING', w: 30, h: 24, baseHp: 10, score: 5000, art: 'slimeking', phases: [1, 0.5, 0.25],
  init(b) { b.state = 'idle'; b.timer = 40; b.jumps = 0; },
  onPhase(b, lv, phase) {
    if (phase === 1) {   // split! mini slimes rain down
      b.invuln = 60; roar(lv);
      for (let i = 0; i < 3; i++) { const e = lv.spawnEnemy('blob', b.x + 8 + i * 22 - 20, 20 - i * 14); e.speed *= 1.5; e.vy = 0; }
      popup(lv, b, 'SPLIT!');
    } else { b.invuln = 60; roar(lv, 5); popup(lv, b, 'ENRAGED!'); }
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

// ------------------------------------------------------------------ 2. Sand Worm (world 2): burrows, erupts under you
const SandWorm = {
  name: 'SAND WORM', w: 18, h: 30, baseHp: 12, score: 6000, art: 'sandworm', phases: [1, 0.66, 0.33], clip: GROUND,
  init(b) { b.state = 'hidden'; b.timer = 70; b.y = GROUND + 6; },
  hittable: (b) => b.state === 'exposed' || b.state === 'rise',
  contact: (b) => b.state === 'rise' || b.state === 'exposed' || b.state === 'sink',
  onPhase(b, lv, phase) { roar(lv, 4); popup(lv, b, phase === 1 ? 'FASTER!' : 'ENRAGED!'); b.invuln = 30; },
  update(b, lv) {
    const h = lv.hero, p = b.phase, rise = (b.h + 8) / 14;
    switch (b.state) {
      case 'hidden':
        b.x += clamp(h.cx - b.cx, -(1.5 + p * 0.5), 1.5 + p * 0.5);
        if (lv.frames % 4 === 0) lv.particles.emit(b.cx, GROUND - 1, 2, { angle: -Math.PI / 2, spread: 1.8, speed: 0.8, color: ['#e8c26a', '#c8924a'], life: 14 });
        if (--b.timer <= 0) { b.state = 'warn'; b.timer = 38 - p * 6; }
        break;
      case 'warn':
        if (lv.frames % 2 === 0) lv.particles.emit(b.cx + rnd(-8, 8), GROUND - 1, 1, { angle: -Math.PI / 2, spread: 1.2, speed: 1.2, color: ['#fff', '#e8c26a'], life: 16 });
        b.shakeX = (b.t % 4 < 2) ? 1 : -1;
        if (--b.timer <= 0) { b.state = 'rise'; b.timer = 14; lv.audio.sfx('boom'); lv.camera.shake(4, 12); lv.particles.emit(b.cx, GROUND, 14, { angle: -Math.PI / 2, spread: 2.4, speed: 2.4, color: ['#e8c26a', '#c8924a', '#fff'], life: 24, size: 3 }); }
        break;
      case 'rise': b.y -= rise; if (--b.timer <= 0) { b.y = GROUND - b.h; b.state = 'exposed'; b.timer = 96 - p * 10; b.face = h.cx < b.cx ? -1 : 1; } break;
      case 'exposed': {
        b.face = h.cx < b.cx ? -1 : 1;
        const spit = (n) => { for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.28; const dx = h.cx - b.cx, dy = h.cy - b.cy, l = Math.hypot(dx, dy) || 1; lv.projectiles.fireEnemy(b.cx, b.y + 8, (dx / l * Math.cos(a) - dy / l * Math.sin(a)) * 1.5, (dy / l * Math.cos(a) + dx / l * Math.sin(a)) * 1.5); } lv.audio.sfx('enemyshot'); };
        if (p >= 1 && b.timer === 62) spit(p >= 2 ? 3 : 1);
        if (p >= 2 && b.timer === 34) spit(3);
        if (--b.timer <= 0) { b.state = 'sink'; b.timer = 14; }
        break;
      }
      case 'sink': b.y += rise; if (--b.timer <= 0) { b.y = GROUND + 6; b.state = 'hidden'; b.timer = 52 - p * 12; } break;
    }
  },
  frame: (b) => (b.state === 'exposed' && b.timer > 40 && b.timer < 70) || b.state === 'warn' ? 1 : 0,
};

// ------------------------------------------------------------------ 3. Mr. Frost (world 3): snowballs + icicle rain on an icy floor
const MrFrost = {
  name: 'MR. FROST', w: 26, h: 28, baseHp: 12, score: 7000, art: 'yeti', phases: [1, 0.66, 0.33],
  init(b) { b.state = 'walk'; b.timer = 80; b.face = -1; b.cool = 0; },
  onPhase(b, lv, phase) { roar(lv); popup(lv, b, phase === 1 ? 'BRRR!' : 'BLIZZARD!'); b.invuln = 40; },
  update(b, lv) {
    const h = lv.hero, p = b.phase;
    b.face = h.cx < b.cx ? -1 : 1;
    switch (b.state) {
      case 'walk': b.vx = b.face * 0.45 * b.speedMul; b.physics(lv); if (b.wall) b.vx = 0; if (--b.timer <= 0) { b.state = Math.random() < 0.5 ? 'throw' : 'slam'; b.timer = b.state === 'throw' ? 22 : 18; b.vx = 0; } break;
      case 'throw':
        b.vx = 0; b.physics(lv);
        if (--b.timer === 0) {
          const n = p >= 2 ? 3 : 1, [vx, vy] = arcVel(b.cx, b.y + 4, h.cx, h.cy, 0.1, 44);
          for (let i = 0; i < n; i++) lv.projectiles.fireArc('snowball', b.cx + b.face * 10, b.y + 4, vx + (i - (n - 1) / 2) * 0.55, vy + (i - (n - 1) / 2) * 0.4, 0.1);
          lv.audio.sfx('enemyshot'); b.state = 'walk'; b.timer = 70 - p * 14;
        }
        break;
      case 'slam':
        b.vx = 0; b.physics(lv);
        if (--b.timer === 0) { b.vy = -4.6; b.grounded = false; lv.audio.sfx('bossjump'); b.state = 'slamAir'; }
        break;
      case 'slamAir':
        b.physics(lv);
        if (b.grounded) {
          lv.camera.shake(5, 16); lv.audio.sfx('bossland'); lv.particles.emit(b.cx, b.y + b.h, 12, { angle: -Math.PI / 2, spread: 3, speed: 1.8, color: ['#fff', '#bfe8ff'], life: 20 });
          const n = 3 + p; for (let i = 0; i < n; i++) lv.projectiles.fireIcicle(clamp(h.cx + rnd(-90, 90), 16, W - 16), 30 + i * 12);
          b.state = 'walk'; b.timer = 80 - p * 14;
        }
        break;
    }
  },
  frame: (b) => (b.state === 'throw' || b.state === 'slam' || b.state === 'slamAir') ? 1 : 0,
};

// ------------------------------------------------------------------ 4. Grand Owl (world 4): flying, feathers, diving crash
const GrandOwl = {
  name: 'GRAND OWL', w: 26, h: 22, baseHp: 12, score: 8000, art: 'owlbear', phases: [1, 0.66, 0.33],
  init(b) { b.state = 'hover'; b.timer = 80; b.cycles = 0; b.y = 74; b.hx = W / 2; b.ang = 0; },
  onPhase(b, lv, phase) { roar(lv); popup(lv, b, phase === 1 ? 'HOOT!' : 'FURIOUS!'); b.invuln = 30; },
  update(b, lv) {
    const h = lv.hero, p = b.phase;
    switch (b.state) {
      case 'hover': {
        b.ang += 0.028 + p * 0.008;
        b.x = b.hx - b.w / 2 + Math.sin(b.ang) * 86; b.y = 74 + Math.sin(b.t * 0.07) * 6;
        if (--b.timer <= 0) {
          b.cycles++; const n = 3 + p * 2;
          for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.32; lv.projectiles.fireShard(b.cx, b.cy + 6, Math.cos(a) * 1.5, Math.sin(a) * 1.5); }
          lv.audio.sfx('enemyshot');
          b.timer = 84 - p * 14;
          if (b.cycles >= 2) { b.cycles = 0; b.state = 'aim'; b.timer = 26; b.tx = h.cx; b.ty = h.y; }
        }
        break;
      }
      case 'aim': b.x += (b.tx - b.cx) * 0.05; if (b.timer % 6 < 3) b.flash = 2; if (--b.timer <= 0) { b.state = 'dive'; lv.audio.sfx('dash'); b.dvx = (b.tx - b.cx), b.dvy = (GROUND - b.h - b.y); const l = Math.hypot(b.dvx, b.dvy) || 1; b.dvx = b.dvx / l * (3.4 + p * 0.5); b.dvy = b.dvy / l * (3.4 + p * 0.5); } break;
      case 'dive':
        b.x += b.dvx; b.y += b.dvy;
        if (b.y + b.h >= GROUND || b.x < 4 || b.x + b.w > W - 4) {
          b.x = clamp(b.x, 4, W - 4 - b.w); b.y = GROUND - b.h; b.state = 'crash'; b.timer = 84 - p * 8;
          lv.camera.shake(5, 18); lv.audio.sfx('bossland'); lv.particles.emit(b.cx, GROUND, 12, { angle: -Math.PI / 2, spread: 3, speed: 1.8, color: ['#d8a060', '#fff'], life: 22 });
          lv.projectiles.fireWave(b.cx - 12, GROUND - 8, -1.7); lv.projectiles.fireWave(b.cx + 12, GROUND - 8, 1.7);
        }
        break;
      case 'crash': if (--b.timer <= 0) { b.state = 'rise'; } break;
      case 'rise': b.y -= 2.2; if (b.y <= 74) { b.y = 74; b.hx = clamp(b.cx, 70, W - 70); b.ang = 0; b.state = 'hover'; b.timer = 70; } break;
    }
  },
  frame: (b) => (b.state === 'crash' ? 0 : Math.floor(b.t / 8) % 2),
};

// ------------------------------------------------------------------ 5. Kraken Kid (world 5): ink, tentacle pillars, belly-slide (floaty arena)
const KrakenKid = {
  name: 'KRAKEN KID', w: 28, h: 26, baseHp: 14, score: 9000, art: 'kraken', phases: [1, 0.66, 0.33],
  init(b) { b.state = 'idle'; b.timer = 60; b.face = -1; },
  onPhase(b, lv, phase) { roar(lv); popup(lv, b, phase === 1 ? 'BLUB BLUB!' : 'TENTACLE STORM!'); b.invuln = 40; },
  update(b, lv) {
    const h = lv.hero, p = b.phase;
    switch (b.state) {
      case 'idle':
        b.vx = 0; b.physics(lv); b.face = h.cx < b.cx ? -1 : 1;
        if (--b.timer <= 0) { const r = Math.random(); b.state = r < 0.4 ? 'ink' : (r < 0.75 ? 'tent' : 'charge'); b.timer = b.state === 'ink' ? 0 : 30; b.n = 0; }
        break;
      case 'ink':
        b.physics(lv);
        if (b.timer-- <= 0) { const [vx, vy] = arcVel(b.cx, b.y + 4, h.cx, h.cy, 0.07, 44); lv.projectiles.fireArc('ink', b.cx + b.face * 8, b.y + 4, vx, vy, 0.07); lv.audio.sfx('enemyshot'); b.timer = 24; if (++b.n >= 2 + p) { b.state = 'idle'; b.timer = 60 - p * 10; } }
        break;
      case 'tent':
        b.physics(lv);
        if (b.timer === 30) { const xs = [h.cx, h.cx - 44, h.cx + 44].slice(0, 1 + p); xs.forEach((x) => lv.projectiles.firePillar(clamp(x, 14, W - 14), GROUND, 36, 30)); lv.audio.sfx('warp'); }
        if (--b.timer <= -34) { b.state = 'idle'; b.timer = 56 - p * 10; }
        break;
      case 'charge':
        if (b.timer > 0) { b.vx = 0; b.physics(lv); if (b.timer % 6 < 3) b.flash = 2; if (--b.timer === 0) { b.timer = -52; b.face = h.cx < b.cx ? -1 : 1; lv.audio.sfx('charge'); } }
        else { b.vx = b.face * (2.1 + p * 0.3) * b.speedMul; b.physics(lv); b.timer++; if (b.wall || b.timer >= 0) { b.vx = 0; lv.camera.shake(3, 10); b.state = 'stun'; b.timer = 66; } }
        break;
      case 'stun': b.vx = 0; b.physics(lv); if (--b.timer <= 0) { b.state = 'idle'; b.timer = 40; } break;
    }
  },
  frame: (b) => (b.state === 'stun' ? 1 : Math.floor(b.t / 14) % 2),
};

// ------------------------------------------------------------------ 6. Magma Golem (world 6): armoured, only the core after a slam is vulnerable
const MagmaGolem = {
  name: 'MAGMA GOLEM', w: 30, h: 32, baseHp: 14, score: 10000, art: 'magmagolem', phases: [1, 0.66, 0.33],
  init(b) { b.state = 'walk'; b.timer = 90; b.face = -1; b.slams = 0; },
  hittable: (b) => b.state === 'vent',
  onPhase(b, lv, phase) { roar(lv, 6); popup(lv, b, phase === 1 ? 'MOLTEN!' : 'ERUPTION!'); b.invuln = 40; },
  update(b, lv) {
    const h = lv.hero, p = b.phase;
    switch (b.state) {
      case 'walk':
        b.face = h.cx < b.cx ? -1 : 1; b.vx = b.face * 0.42 * b.speedMul; b.physics(lv); if (b.wall) b.vx = 0;
        if (p >= 1 && b.timer % 70 === 0 && b.timer > 0) { const [vx, vy] = arcVel(b.cx, b.y + 6, h.cx, h.cy, 0.1, 40); lv.projectiles.fireArc('fireball', b.cx, b.y + 6, vx, vy, 0.1); lv.audio.sfx('fire'); }
        if (--b.timer <= 0) { b.state = 'crouch'; b.timer = 24; b.vx = 0; b.slams = 0; }
        break;
      case 'crouch': b.vx = 0; b.physics(lv); if (b.timer % 6 < 3) b.flash = 2; if (--b.timer <= 0) { b.vy = -4.2; b.grounded = false; b.state = 'air'; lv.audio.sfx('bossjump'); } break;
      case 'air':
        b.physics(lv);
        if (b.grounded) {
          lv.camera.shake(6, 18); lv.audio.sfx('bossland'); b.slams++;
          lv.projectiles.fireWave(b.cx - 14, GROUND - 8, -2.3 * b.speedMul); lv.projectiles.fireWave(b.cx + 14, GROUND - 8, 2.3 * b.speedMul);
          for (const w of lv.projectiles.pool.items) if (w.active && w.kind === 'wave' && w.t < 2) w.col = '#ff6a2a';
          for (let i = 0; i < 2 + p; i++) lv.projectiles.fireArc('fireball', rnd(30, W - 30), -6, 0, 0.5, 0.04);
          lv.particles.emit(b.cx, b.y + b.h, 14, { angle: -Math.PI / 2, spread: 3, speed: 2, color: ['#ff9a2e', '#ffe14a', '#fff'], life: 22, size: 3 });
          if (p >= 2 && b.slams < 2) { b.state = 'crouch'; b.timer = 16; } else { b.state = 'vent'; b.timer = 120 - p * 14; lv.audio.sfx('boom'); }
        }
        break;
      case 'vent':
        b.vx = 0; b.physics(lv); if (lv.frames % 5 === 0) lv.particles.emit(b.cx, b.y + 10, 2, { angle: -Math.PI / 2, spread: 1.2, speed: 1.2, color: ['#fff', '#ffe14a'], life: 20 });
        if (--b.timer <= 0) { b.state = 'walk'; b.timer = 100 - p * 14; }
        break;
    }
  },
  frame: (b) => (b.state === 'vent' ? 1 : 0),
};

// ------------------------------------------------------------------ 7. Storm Bird (world 7): lightning strikes, then a swooping crash-landing
const StormBird = {
  name: 'STORM BIRD', w: 30, h: 20, baseHp: 14, score: 11000, art: 'stormbird', phases: [1, 0.66, 0.33],
  init(b) { b.state = 'patrol'; b.timer = 120; b.dirx = 1; b.y = 68; b.laps = 0; },
  onPhase(b, lv, phase) { roar(lv, 5); popup(lv, b, phase === 1 ? 'THUNDER!' : 'STORM!'); b.invuln = 30; },
  update(b, lv) {
    const h = lv.hero, p = b.phase;
    switch (b.state) {
      case 'patrol':
        b.x += b.dirx * (1.3 + p * 0.3); b.y = 68 + Math.sin(b.t * 0.08) * 5;
        if (b.x < 10) { b.x = 10; b.dirx = 1; b.laps++; } if (b.x + b.w > W - 10) { b.x = W - 10 - b.w; b.dirx = -1; b.laps++; }
        if (--b.timer <= 0) { b.state = 'charge'; b.timer = 34; }
        break;
      case 'charge':
        if (b.timer % 6 < 3) b.flash = 2;
        if (--b.timer <= 0) {
          lv.audio.sfx('zap');
          const xs = [h.cx]; for (let i = 0; i < 1 + p; i++) xs.push(clamp(h.cx + (i % 2 ? 1 : -1) * (46 + i * 34), 12, W - 12));
          xs.forEach((x) => lv.projectiles.fireBolt(x, 42 - p * 6));
          b.timer = 70; b.state = 'bolting';
        }
        break;
      case 'bolting': if (--b.timer <= 0) { b.state = b.laps >= 2 ? 'swoop' : 'patrol'; b.timer = 100 - p * 14; if (b.state === 'swoop') { b.laps = 0; b.sx = b.cx; b.sy = b.y; b.sp = 0; b.tx = clamp(h.cx, 30, W - 30); lv.audio.sfx('dash'); } } break;
      case 'swoop': {            // curved dive to the ground at the hero's x
        b.sp += 0.026 + p * 0.004;
        const t = Math.min(1, b.sp);
        b.x = b.sx + (b.tx - b.sx) * t - b.w / 2; b.y = b.sy + (GROUND - b.h - b.sy) * (t * t);
        if (t >= 1) { b.state = 'perch'; b.timer = 96; lv.camera.shake(5, 16); lv.audio.sfx('bossland'); lv.particles.emit(b.cx, GROUND, 12, { angle: -Math.PI / 2, spread: 3, speed: 1.8, color: ['#ffe14a', '#fff'], life: 20 }); lv.projectiles.fireWave(b.cx - 12, GROUND - 8, -1.8); lv.projectiles.fireWave(b.cx + 12, GROUND - 8, 1.8); }
        break;
      }
      case 'perch': if (--b.timer <= 0) b.state = 'rise'; break;
      case 'rise': b.y -= 2; if (b.y <= 68) { b.state = 'patrol'; b.timer = 90; b.dirx = b.cx < W / 2 ? 1 : -1; } break;
    }
  },
  frame: (b) => (b.state === 'perch' ? 0 : Math.floor(b.t / 7) % 2),
};

// ------------------------------------------------------------------ 8. The Dark King (world 8): teleports, mixes every earlier trick
const DarkKing = {
  name: 'THE DARK KING', w: 24, h: 34, baseHp: 18, score: 20000, art: 'darkking', phases: [1, 0.75, 0.5, 0.25],
  init(b) { b.state = 'appear'; b.timer = 70; b.fired = false; b.alpha = 1; },
  hittable: (b) => b.state === 'appear' || b.state === 'cast',
  contact: (b) => b.state === 'appear' || b.state === 'cast',
  onPhase(b, lv, phase) {
    roar(lv, 6); popup(lv, b, ['', 'MY GUARDS!', 'DARKNESS!', 'FINAL FORM!'][phase], '#ff4a8a'); b.invuln = 40;
    if (phase === 1) { lv.spawnEnemy('guard', 20, 100); lv.spawnEnemy('guard', W - 34, 100); }
  },
  update(b, lv) {
    const h = lv.hero, p = b.phase, face = h.cx < b.cx ? -1 : 1; b.face = face;
    const spread = (n, sp = 1.5) => { const dx = h.cx - b.cx, dy = h.cy - b.cy, base = Math.atan2(dy, dx); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.3; lv.projectiles.fireEnemy(b.cx, b.cy, Math.cos(a) * sp * lv.difficulty.bulletSpeed, Math.sin(a) * sp * lv.difficulty.bulletSpeed); } lv.audio.sfx('enemyshot'); };
    switch (b.state) {
      case 'appear':
        b.physics(lv);
        if (!b.fired && b.timer < 46) {
          b.fired = true; spread(p >= 2 ? 5 : 3);
          if (p >= 1 && Math.random() < 0.6) lv.projectiles.firePillar(clamp(h.cx, 14, W - 14), GROUND, 34, 26);
          if (p >= 3) lv.projectiles.fireBolt(clamp(h.cx + rnd(-60, 60), 12, W - 12), 36);
        }
        if (--b.timer <= 0) { b.state = 'vanish'; b.timer = 20; lv.audio.sfx('warp'); lv.particles.emit(b.cx, b.cy, 14, { speed: 2, color: ['#7a4ae0', '#ff4a8a', '#fff'], life: 22, size: 3 }); }
        break;
      case 'vanish': b.alpha = Math.max(0, b.timer / 20); if (--b.timer <= 0) { b.state = 'away'; b.timer = 24 - p * 3; } break;
      case 'away':
        if (--b.timer <= 0) {
          let nx; do { nx = rnd(24, W - 24 - b.w); } while (Math.abs(nx + b.w / 2 - h.cx) < 56);
          b.x = nx; b.y = GROUND - b.h; b.vy = 0; b.state = 'cast'; b.timer = 18; b.fired = false; lv.audio.sfx('warp');
          lv.particles.emit(b.cx, b.cy, 14, { speed: 2, color: ['#7a4ae0', '#ff4a8a', '#fff'], life: 22, size: 3 });
        }
        break;
      case 'cast': b.alpha = 1 - Math.max(0, b.timer / 18); if (--b.timer <= 0) { b.alpha = 1; b.state = 'appear'; b.timer = 78 - p * 12; b.fired = false; } break;
    }
  },
  frame: (b) => (b.state === 'appear' && b.timer > 40 ? 1 : 0),
};

export const BOSSES = { slimeking: SlimeKing, sandworm: SandWorm, yeti: MrFrost, owlbear: GrandOwl, kraken: KrakenKid, magmagolem: MagmaGolem, stormbird: StormBird, darkking: DarkKing };

export class Boss {
  constructor(type, x, y, lv) {
    const d = this.def = BOSSES[type];
    const ws = WORLD_SCALING[Math.max(1, Math.min(8, lv.world))], df = lv.difficulty;
    this.type = type; this.isBoss = true;
    this.w = d.w; this.h = d.h; this.x = x - d.w / 2; this.y = y - d.h; this.vx = 0; this.vy = 0;
    this.maxHp = Math.max(4, Math.round(d.baseHp * df.enemyHp * (1 + (ws.hpMul - 1) * 0.25) * (lv.bossHpMul || 1))); this.hp = this.maxHp;   // bosses scale gently with world
    this.speedMul = ws.speedMul * df.enemySpeed;
    this.phase = 0; this.invuln = 0; this.flash = 0; this.dead = false; this.deadT = 0; this.active = false; this.awake = true;
    this.grounded = false; this.face = -1; this.t = 0; this.state = 'idle'; this.alpha = 1; this.shakeX = 0;
    this.clip = d.clip || null;
    this.dropT = 99999;                                   // bosses ignore one-way planks: they always stay on the floor where you can reach them
    this.grav = (lv.data.physics && lv.data.physics.grav) || 1;
    d.init(this);
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get hittable() { return !this.def.hittable || this.def.hittable(this); }
  get touchable() { return !this.dead && this.active && (!this.def.contact || this.def.contact(this)); }
  physics(lv) { this.vy = Math.min(this.vy + 0.28 * this.grav, 5); this.wall = 0; moveXBy(this, lv.map, this.vx); moveY(this, lv.map); }

  // returns true if damaged, 'blocked' if armour/burrow stops it, false if ignored
  hit(dmg, lv, src) {
    if (this.dead || !this.active || this.invuln > 0) return false;
    if (!this.hittable) {
      lv.audio.sfx('block'); lv.particles.emit(this.cx, this.cy, 5, { speed: 1.8, color: ['#fff', '#ffe14a'], life: 12 });
      return 'blocked';
    }
    this.hp -= dmg; this.invuln = 40; this.flash = 12; lv.audio.sfx('bosshit'); lv.camera.shake(3, 8);
    lv.particles.emit(this.cx, this.cy, 10, { speed: 2, color: ['#fff', '#ffd84a'], life: 18 });
    if (this.hp <= 0) { this.die(lv); return true; }
    const frac = this.hp / this.maxHp;
    const target = this.def.phases.filter((p, i) => i > 0 && frac <= p).length;
    if (target > this.phase) { this.phase = target; this.def.onPhase && this.def.onPhase(this, lv, target); }
    return true;
  }

  die(lv) {
    this.dead = true; this.deadT = 0; this.vx = 0; this.state = 'dead'; this.alpha = 1; this.clip = null;
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
      this.deadT++; this.vx = 0;
      if (this.def.fly !== false && this.y + this.h < GROUND - 1 && !this.grounded) { this.vy = Math.min(this.vy + 0.25, 4); this.y += this.vy; if (this.y + this.h >= GROUND) { this.y = GROUND - this.h; this.vy = 0; } }
      else if (this.y + this.h > GROUND) this.y = GROUND - this.h;
      if (this.deadT % 5 === 0) lv.particles.emit(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 6, { speed: 2.2, color: ['#fff', '#ffd84a', '#ff7a3a', '#a8f08a'], life: 26, size: 3 });
      if (this.deadT === 90) lv.spawnPowerOrb(this.cx - 7, GROUND - 20);
      return;
    }
    if (!this.active) { if (lv.frames > 100) { this.active = true; roar(lv, 3); } else if (this.def.fly !== false) this.physicsIdle(lv); return; }
    this.def.update(this, lv);
  }
  physicsIdle(lv) { if (this.def.name === 'SLIME KING' || this.def.name === 'MR. FROST' || this.def.name === 'KRAKEN KID' || this.def.name === 'MAGMA GOLEM') this.physics(lv); }

  draw(ctx) {
    if (this.dead && this.deadT > 80) return;
    const d = this.def;
    let frames = BOSS_ART[(this.phase >= 2 && BOSS_ART[d.art + '_rage']) ? d.art + '_rage' : d.art];
    if (this.phase >= 2 && !BOSS_ART[d.art + '_rage']) frames = rageFrames(frames);
    const spr = frames[d.frame(this) % frames.length];
    const flash = (this.flash > 0 && this.t % 4 < 2) || (this.dead && this.t % 4 < 2);
    if (this.invuln > 0 && !this.dead && this.invuln < 34 && this.t % 6 < 2 && !this.flash) return;
    const x = this.cx - spr.w / 2 + (this.shakeX || 0), y = this.y + this.h - spr.h;
    if (this.clip) { ctx.save(); ctx.beginPath(); ctx.rect(-9999, -9999, 20000, this.clip + 9999); ctx.clip(); }
    if (this.alpha < 1) ctx.globalAlpha = this.alpha;
    drawSprite(ctx, spr, x, y, this.type === 'sandworm' || this.type === 'darkking' ? 1 : (this.face > 0 ? 1 : -1) * (this.type === 'slimeking' ? 1 : 1), flash);
    ctx.globalAlpha = 1;
    if (this.clip) ctx.restore();
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
