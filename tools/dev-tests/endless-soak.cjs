// Soak-tests Endless mode (memory, entities, zones, bosses).  node endless-soak.cjs <outdir> [frames] [boss]
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
const FRAMES = Number(process.argv[3] || 20000), EARLYBOSS = process.argv[4] === 'boss';
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox', '--enable-precise-memory-info'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const r = await p.evaluate(({ FRAMES, EARLYBOSS }) => {
    localStorage.clear();
    game.run = { lives: 3, score: 0, coins: 0, powers: [], campaign: false, endless: true }; game.change('endless', { seed: 'SOAK01' });
    const L = game.top.level; L.cheatInvincible = true;
    if (EARLYBOSS) L.gen.nextBossCol = 120;
    let f = 0; const log = [], ev = { zones: new Set(), arenas: 0, arenaWon: 0, maxEnemies: 0, maxPickups: 0, maxMapW: 0, maxPlat: 0, deaths: 0 };
    let lastLives = L.run.lives, wasArena = false;
    game.input.poll = function () {
      this.prev = this.cur; const h = L.hero, m = L.map; let jump = false, wait = false;
      if (!h.dead) {
        const ax = (d) => Math.floor((h.x + h.w + d) / 16), row = Math.floor((h.y + h.h - 1) / 16), below = Math.floor((h.y + h.h + 2) / 16);
        if (L.arena) {
          const B = L.boss, orb = L.pickups.find(q => q.type === 'power' && !q.done);
          if (orb) this.cur = { right: orb.x > h.x + 4, left: orb.x < h.x - 4, jump: orb.y < h.y - 10 && f % 30 < 12 };
          else if (B) { const dx = B.cx - h.cx, tap = f % 6 === 0; this.cur = { right: dx > 0 && (tap || dx > 120), left: dx < 0 && (tap || dx < -120), shoot: f % 2 === 0, jump: h.grounded && h.y < 150 ? f % 4 === 0 : (f % 70) < 24, down: h.grounded && h.y < 150 }; }
          else this.cur = { right: true };
          h.ammo = 99; return;
        }
        if (h.grounded) {
          const col = ax(5); let hasGround = false; for (let r = below; r < m.h; r++) { const kk = m.kind(col, r); if (kk === 1 || kk === 2 || kk === 4 || kk === 5) { hasGround = true; break; } }
          if (!hasGround && !h.riding) {
            const near = L.platforms.filter(pl => pl.x + pl.w > h.x && pl.x < h.x + 150);
            if (near.length) { const ok = near.some(pl => Math.abs(pl.y - (h.y + h.h)) < 2 && pl.x <= h.x + h.w + 3 && pl.x + pl.w > h.x + h.w); if (!ok) wait = true; } else jump = true;
          }
          if (m.kind(ax(3), row) === 1 || m.kind(ax(3), row - 1) === 1) jump = true;
          if (m.kind(ax(10), row) === 3 || m.kind(ax(2), row) === 3) jump = true;
          for (const e of L.enemies) if (!e.dead && e.awake && e.x > h.x && e.x - h.x < 44 && Math.abs(e.y - h.y) < 24) jump = true;
          if (h.riding) { const pl = h.riding, edge = pl.x + pl.w - (h.x + h.w); if (!(pl.pos >= pl.range - 2 || (edge > 22 && pl.dir === 1))) wait = true; }
        }
      }
      this.cur = { right: !wait, jump: jump || (h.vy < 0 && !h.grounded && !h.dead), shoot: f % 20 < 10 };
    };
    for (f = 0; f < FRAMES; f++) {
      game.update(); const lv = game.top.level; if (!lv || lv !== L) { ev.ended = game.top.name; break; }
      ev.zones.add(L.zone); ev.maxEnemies = Math.max(ev.maxEnemies, L.enemies.length); ev.maxPickups = Math.max(ev.maxPickups, L.pickups.length); ev.maxMapW = Math.max(ev.maxMapW, L.map.w); ev.maxPlat = Math.max(ev.maxPlat, L.platforms.length);
      if (L.arena && !wasArena) ev.arenas++; if (!L.arena && wasArena) ev.arenaWon++; wasArena = !!L.arena;
      if (L.run.lives !== lastLives) { ev.deaths++; lastLives = L.run.lives; }
      if (L.arena && f % 300 === 0 && (window.al = window.al || []).length < 14) window.al.push(f + ' boss ' + (L.boss ? [L.boss.x.toFixed(0), L.boss.y.toFixed(0), L.boss.state, L.boss.hp, L.boss.active, L.boss.dead].join(',') : 'none') + ' hero ' + [L.hero.x.toFixed(0), L.hero.y.toFixed(0), L.hero.hp, L.hero.dead, L.hero.weapon, L.hero.ammo].join(',') + ' orb ' + L.pickups.filter(q => q.type === 'power').length);
      if (f % 4000 === 0) log.push({ f, dist: Math.floor(L.dist), zone: L.zone, mapW: L.map.w, enemies: L.enemies.length, platforms: L.platforms.length, particles: L.particles.pool.items.filter(q => q.active).length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, storm: Math.round(L.stormGap), score: L.run.score });
    }
    return { al: window.al, log, ev: { ...ev, zones: [...ev.zones] }, frames: f, dist: Math.floor(L.dist), lives: L.run.lives, status: L.status, bossCount: L.bossCount, powers: [...L.hero.powers] };
  }, { FRAMES, EARLYBOSS });
  (r.al || []).forEach(l => console.log(l)); r.log.forEach(l => console.log(JSON.stringify(l))); console.log(JSON.stringify({ ev: r.ev, frames: r.frames, dist: r.dist, lives: r.lives, status: r.status, bosses: r.bossCount, powers: r.powers }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
