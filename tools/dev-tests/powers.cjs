// Measures every boss power.  node powers.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const out = {};
    const fresh = (powers, equip) => { game.run = game.newRun(); game.run.powers = powers; game.run.slot = equip === undefined ? powers[0] : equip; game.change('play', { level: 'test' }); const L = game.top.level; L.cheatInvincible = true; return L; };
    const run = (n, s, L, probe) => { game.input.poll = function () { this.prev = this.cur; this.cur = s ? s(f) : {}; }; var f = 0; for (f = 0; f < n; f++) { game.update(); probe && probe(L.hero, f); } };
    const tp = (L, c, r) => { const h = L.hero; h.respawn(c * 16 + 3, r * 16 - 14); h.vx = 0; h.vy = 0; h.invuln = 0; };
    // 1. air dash
    let L = fresh(['airdash']); tp(L, 10, 11); let x0, y0, dashMax = 0;
    run(40, (f) => ({ jump: f > 2 && f < 12, rush: f === 20, right: false }), L, (h, f) => { if (f === 19) { x0 = h.x; y0 = h.y; } if (f > 19 && f < 36) dashMax = Math.max(dashMax, h.x - x0); });
    out.airdash = { distance: Math.round(dashMax), dashUsedFlag: L.hero.airDashes };
    // 2. wall slide + wall jump (brick stairs at col 87, rows 8-10)
    L = fresh(['wallslide']); tp(L, 86, 4); L.hero.x = 87 * 16 - 11; L.hero.y = 5 * 16;
    let slideVy = 0, maxVy = 0, jumpedVx = null;
    run(80, (f) => ({ right: f < 50, jump: f === 50 }), L, (h, f) => { if (f > 10 && f < 48) maxVy = Math.max(maxVy, h.vy); if (f === 52) jumpedVx = h.vx; });
    out.wall = { maxFallSpeedWhileSliding: +maxVy.toFixed(2), vxAfterWallJump: jumpedVx && +jumpedVx.toFixed(2) };
    // 3. glide
    L = fresh(['glide']); tp(L, 10, 4); let gv = 0;
    run(70, () => ({ jump: true }), L, (h, f) => { if (f > 25 && !h.grounded) gv = Math.max(gv, h.vy); });
    out.glide = { maxFallSpeed: +gv.toFixed(2) };
    L = fresh([], 'base'); tp(L, 10, 4); let nv = 0; run(70, () => ({ jump: true }), L, (h, f) => { if (f > 25 && !h.grounded) nv = Math.max(nv, h.vy); }); out.noGlideFall = +nv.toFixed(2);
    // 4. ground pound kills adjacent blob
    L = fresh(['groundpound']); tp(L, 17, 5); const blob = L.enemies.find(e => e.type === 'blob'); blob.speed = 0; blob.x = L.hero.x - 2; blob.dead = false;
    L.enemies.forEach(e => { if (e !== blob) e.dead = true; });
    run(60, (f) => ({ down: f === 3 }), L); out.pound = { enemyDead: blob.dead, scoreGain: L.run.score };
    // 5. ice + fire shots
    L = fresh(['iceshot', 'fireshot']); tp(L, 17, 11); const e1 = L.enemies.find(e => e.type === 'blob' && Math.abs(e.x / 16 - 19) < 2); L.enemies.forEach(e => { if (e !== e1) e.dead = true; }); e1.speed = 0; e1.hp = 3; e1.x = L.hero.x + 60;
    L.hero.weapon = 'ice'; run(20, () => ({ shoot: true }), L); out.ice = { frozen: e1.frozen > 0, hp: e1.hp, energy: Math.round(L.hero.energy) };
    L = fresh(['iceshot', 'fireshot']); tp(L, 17, 11); const e2 = L.enemies.find(e => e.type === 'blob' && Math.abs(e.x / 16 - 19) < 2); L.enemies.forEach(e => { if (e !== e2) e.dead = true; }); e2.speed = 0; e2.hp = 3; e2.x = L.hero.x + 60;
    L.hero.weapon = 'fire'; run(20, () => ({ shoot: true }), L); out.fire = { hp: e2.hp, dead: e2.dead };
    // cycle with Q/E
    L = fresh(['iceshot', 'fireshot', 'doublejump', 'glide'], 'base'); tp(L, 10, 11); const seen = new Set(); run(80, (f) => ({ next: f % 6 === 1 }), L, (h) => seen.add(h.slot)); out.cycle = [...seen];
    // an ability that is NOT selected must do nothing
    L = fresh(['airdash', 'glide'], 'glide'); tp(L, 10, 11); let dm = 0, x1; run(40, (f) => ({ jump: f > 2 && f < 12, rush: f === 20 }), L, (h, f) => { if (f === 19) x1 = h.x; if (f > 19 && f < 36) dm = Math.max(dm, h.x - x1); }); out.airdashNotSelected = Math.round(dm);
    // 6. magnet
    L = fresh(['magnet']); tp(L, 10, 11); L.pickups.push({ type: 'coin', x: L.hero.x + 40, y: L.hero.y, w: 12, h: 12, t: 0, done: false }); const coins0 = L.run.coins; run(60, () => ({}), L); out.magnet = { collected: L.run.coins - coins0 };
    L = fresh(['magnet'], 'base'); tp(L, 10, 11); L.pickups.push({ type: 'coin', x: L.hero.x + 40, y: L.hero.y, w: 12, h: 12, t: 0, done: false }); const c1 = L.run.coins; run(60, () => ({}), L); out.noMagnet = { collected: L.run.coins - c1 };
    return out;
  });
  console.log(JSON.stringify(out, null, 1)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
