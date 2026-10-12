// Regression tests for the playtest notes: jump reach, items from blocks, aim shooting, shield kills, platform landing,
// boss stays off the planks, camera speed.  node stage8.cjs <outdir>
// Needs: npm i -D playwright, game served at BASE (default http://localhost:8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const res = {};
    const fresh = (id = 'test', powers = []) => { game.cheats.invincible = false; game.run = game.newRun(); game.run.powers = powers; game.change('play', { level: id }); return game.top.level; };
    const run = (n, s, probe) => { let f = 0; game.input.poll = function () { this.prev = this.cur; this.cur = s ? s(f) : {}; }; for (f = 0; f < n; f++) { game.update(); probe && probe(f); } };
    const tp = (L, c, r) => { const h = L.hero; h.respawn(c * 16 + 3, r * 16 - 14); h.vx = 0; h.vy = 0; h.invuln = 0; };
    // 1. jump reach: apex of a full jump (px) and a minimum hop
    let L = fresh(); tp(L, 27, 11); let y0 = L.hero.y, top = y0;
    run(60, (f) => ({ jump: f > 3 && f < 40 }), () => { top = Math.min(top, L.hero.y); }); res.fullJumpPx = Math.round(y0 - top);
    L = fresh(); tp(L, 27, 11); y0 = L.hero.y; top = y0; run(60, (f) => ({ jump: f === 4 }), () => { top = Math.min(top, L.hero.y); }); res.minHopPx = Math.round(y0 - top);
    // 2. block items pop out and can be collected from the ground
    L = fresh(); tp(L, 8, 11); L.hero.x = 8 * 16 + 3; L.hero.y = 11 * 16 - 14; L.hero.grounded = true;
    run(25, (f) => ({ jump: f < 22 })); const pop = L.pickups.find((q) => q.type === 'gun');
    res.popItem = pop ? { popped: !!pop.pop } : null;
    run(160, () => ({})); const pop2 = L.pickups.find((q) => q.type === 'gun' && !q.done);
    res.popLanded = pop2 ? { grounded: !!pop2.grounded, yBelowBlock: pop2.y > 8 * 16 } : 'already collected';
    if (pop2) { const hx = L.hero; run(200, () => ({ right: pop2.x > hx.x + 4, left: pop2.x < hx.x - 4 })); }
    res.gunCollected = L.hero.ammo > 0;
    // 3. aim shooting: straight up and diagonal kill flyers
    for (const [name, keys, ex, ey] of [['up', { up: true }, 0, -60], ['diagUp', { up: true, right: true }, 34, -34]]) {
      L = fresh(); tp(L, 17, 11); const h = L.hero; h.ammo = 20; h.weapon = 'gun'; h.facing = 1; L.enemies.forEach((e) => { e.dead = true; });
      const bat = L.spawnEnemy('bat', h.x + ex, h.y + ey); bat.speed = 0; bat.baseY = bat.y; bat.dir = 1; bat.t = 0;
      const hx0 = h.x; run(14, (f) => ({ shoot: f % 3 === 0, ...keys })); res['aim_' + name] = { dead: bat.dead, heroMoved: Math.round(h.x - hx0) };
    }
    // 4. shield kills enemies and stays up
    L = fresh(); tp(L, 17, 11); L.hero.shield = 900; L.enemies.forEach((e) => { e.dead = true; }); const gloop = L.spawnEnemy('blob', L.hero.x + 24, 11 * 16 - 11); gloop.speed = 0;
    const sp = L.hero.shield; run(40, () => ({ right: true })); res.shield = { enemyDead: gloop.dead, shieldLeft: L.hero.shield, was: sp, hp: L.hero.hp };
    const gk = fresh(); tp(gk, 17, 11); gk.hero.shield = 900; gk.enemies.forEach((e) => { e.dead = true; }); const big = gk.spawnEnemy('guard', gk.hero.x + 24, 11 * 16 - 14); big.speed = 0;
    run(40, () => ({ right: true })); res.shieldKillsGuard = big.dead;
    // 5. platform: hero sunk 5px into a lift still lands on top
    L = fresh(); L.enemies.forEach((e) => { e.dead = true; }); const plat = L.platforms[0]; const h5 = L.hero; h5.respawn(plat.x + 10, plat.y - 14 + 5); h5.vy = 1; h5.grounded = false; h5.invuln = 0;
    run(10, () => ({})); res.platformLand = { onTop: Math.abs(h5.y + h5.h - plat.y) < 1.5, riding: !!h5.riding };
    // 6. boss never stands on the planks
    L = fresh('1-4'); L.cheatInvincible = true; const B = L.boss; let onPlank = 0, frames = 0;
    run(2200, () => ({ shoot: true }), (f) => { L.hero.ammo = 99; L.hero.weapon = 'gun'; if (B.grounded && !B.dead && B.y + B.h < 170) onPlank++; frames++; }); res.bossOnPlankFrames = onPlank; res.bossPhases = B.phase; res.bossHp = B.hp + '/' + B.maxHp;
    // 7. camera speed in a rush run
    L = fresh('1-1'); L.cheatInvincible = true; let maxStep = 0, last = L.camera.x, snaps = 0; L.hero.meter = 100;
    run(600, () => ({ right: true, rush: true, jump: L.frames % 60 < 20 }), () => { const d = Math.abs(L.camera.x - last); if (d > 30) snaps++; else maxStep = Math.max(maxStep, d); last = L.camera.x; }); res.cameraMaxPxPerFrame = +maxStep.toFixed(2); res.cameraRespawnSnaps = snaps;
    return res;
  });
  console.log(JSON.stringify(out, null, 1)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
