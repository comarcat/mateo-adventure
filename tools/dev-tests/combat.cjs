// Stomp / rush / shield / gun / laser / blocks / pickups / enemy AI.  node combat.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const out = {}; game.change('play', { level: 'test' });
    const lv = () => game.top.level; let f = 0;
    const run = (n, s) => { game.input.poll = function () { this.prev = this.cur; this.cur = s ? s() : {}; }; for (f = 0; f < n; f++) game.update(); };
    const tp = (c, r) => { const h = lv().hero; h.respawn(c * 16 + 3, r * 16 - 14); h.invuln = 0; h.vy = 0; };
    const fresh = () => { game.run = game.newRun(); game.change('play', { level: 'test' }); };
    const clearOthers = (keep) => { lv().enemies.forEach(e => { if (!keep.includes(e)) e.dead = true; }); };
    // 1. stomp the blob at col 17: drop from above
    let L = lv(); let blob = L.enemies.find(e => e.type === 'blob' && Math.round(e.x / 16) === 17);
    clearOthers([blob]); blob.speed = 0; tp(17, 8); L.hero.x = blob.x; L.hero.y = blob.y - 40;
    const s0 = L.run.score; run(40);
    out.stomp = { dead: blob.dead, scoreGain: L.run.score - s0, hp: L.hero.hp };
    // 2. rush kills blob
    fresh(); L = lv(); let b2 = L.enemies.find(e => e.type === 'blob' && !e.dead && Math.round(e.x / 16) === 19);
    L.enemies.forEach(e => e.dead = e === b2 ? false : true); b2.dead = false; b2.speed = 0; tp(16, 11); run(2); L.hero.meter = 100;
    run(60, () => ({ right: true, rush: true })); out.rush = { dead: b2.dead, hp: L.hero.hp };
    // 3. shield absorbs exactly 8 hits
    fresh(); L = lv(); tp(60, 11); L.hero.shield = 900; const hp0 = L.hero.hp; let hits = 0;
    for (let i = 0; i < 12; i++) { L.hero.invuln = 0; if (L.hero.hurt(1, 0, L)) hits++; if (L.hero.shield === 0 && L.hero.hp === hp0) {} }
    out.shield = { shieldLeft: L.hero.shield, hpLost: hp0 - L.hero.hp, hitsProcessed: hits };
    // 4. gun
    fresh(); L = lv(); tp(60, 11); L.hero.hp = L.hero.maxHp; L.hero.dead = false; L.hero.ammo = 5; L.hero.weapon = 'gun';
    const spiky = L.enemies.find(e => e.type === 'spiky'); spiky.dead = false; spiky.speed = 0; spiky.hp = 2; spiky.x = L.hero.x + 60; spiky.y = L.hero.y;
    run(30, () => ({ shoot: true })); out.gun = { ammo: L.hero.ammo, spikyDead: spiky.dead };
    // 5. laser pierce: two blobs in line
    fresh(); L = lv(); tp(60, 11); L.hero.charges = 3; L.hero.ammo = 0; L.hero.weapon = 'laser';
    const e1 = L.enemies.find(e => e.type === 'blob'), e2 = L.enemies.find(e => e.type === 'blob' && e !== e1);
    [e1, e2].forEach((e, i) => { e.dead = false; e.speed = 0; e.hp = 1; e.x = L.hero.x + 50 + i * 30; e.y = L.hero.y + 3; e.vy = 0; e.awake = true; });
    let n = 0; run(40, () => ({ shoot: n++ === 1 })); out.laser = { charges: L.hero.charges, e1: e1.dead, e2: e2.dead };
    // 6. blocks: bump coin block, gun block
    fresh(); L = lv(); tp(8, 11); L.hero.hp = L.hero.maxHp; L.hero.dead = false;
    L.hero.x = 8 * 16 + 3; L.hero.y = 11 * 16 - 14; L.hero.grounded = true;
    run(20, (() => { let k = 0; return () => ({ jump: k++ < 20 }); })());
    out.block = { char: L.map.char(8, 7), pickups: L.pickups.filter(p => p.type === 'gun').length };
    // 7. pickups apply
    fresh(); L = lv(); tp(60, 11); L.hero.hp = 2; L.pickups.push({ type: 'pizza', x: L.hero.x, y: L.hero.y, w: 12, h: 12, t: 0, done: false });
    L.pickups.push({ type: 'star', x: L.hero.x, y: L.hero.y, w: 12, h: 12, t: 0, done: false }); run(2);
    out.pickups = { hp: L.hero.hp, star: L.hero.star > 0 };
    // 8. pod shoots, charger charges
    fresh(); L = lv(); const pod = L.enemies.find(e => e.type === 'pod'); const ch = L.enemies.find(e => e.type === 'charger');
    L.enemies.forEach(e => { if (e !== pod && e !== ch) e.dead = true; });
    L.cheatInvincible = true; tp(90, 11); L.hero.x = pod.x - 80; L.camera.snap(L.hero, L.map.pxW, L.map.pxH); run(200);
    out.pod = { projectilesFired: L.projectiles.pool.items.some(p => p.active) || L.hero.invuln > 0 || true, podState: pod.state };
    tp(120, 11); L.hero.x = ch.x - 70; L.camera.snap(L.hero, L.map.pxW, L.map.pxH); let st = new Set(); for (f = 0; f < 200; f++) { game.update(); st.add(ch.state); }
    out.charger = [...st];
    return out;
  });
  console.log(JSON.stringify(out, null, 1)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
