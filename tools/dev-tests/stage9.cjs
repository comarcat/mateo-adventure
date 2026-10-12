// Regression for: separate boss power vs regular weapon, ammo caps + carry-over, timed shield, enemy counts.  node stage9.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(async () => {
    const res = {};
    const run = (n, s) => { game.input.poll = function () { this.prev = this.cur; this.cur = s ? s() : {}; }; for (let f = 0; f < n; f++) game.update(); };
    game.run = game.newRun(); game.run.powers = ['doublejump', 'iceshot']; game.change('play', { level: 'test' });
    let L = game.top.level, h = L.hero;
    res.initial = { slots: h.slotList(), reg: h.weapon };
    // gun pickups are capped
    for (let i = 0; i < 6; i++) L.collect({ type: 'gun', x: h.x, y: h.y }); res.ammoCap = h.ammo;
    for (let i = 0; i < 6; i++) L.collect({ type: 'laser', x: h.x, y: h.y }); res.laserCap = h.charges;
    // boss power and regular weapon coexist: boss power = doublejump, shoot fires the gun
    h.setSlot('doublejump', L); res.bothActive = { boss: h.slot, weapon: h.weapon, canDJ: h.can('doublejump') };
    const a0 = h.ammo; run(3, () => ({ shoot: true })); res.gunFiredWithAbility = h.ammo < a0;
    // V switches gun <-> laser; ice replaces the regular weapon while selected
    run(2, () => ({ weapon: true })); res.afterV = h.weapon;
    h.setSlot('ice', L); res.iceSelected = h.weapon; run(2, () => ({})); h.setSlot('base', L); res.back = h.weapon;
    // carry-over to the next level
    const ammo = h.ammo, ch = h.charges; run(2, () => ({}));
    game.change('play', { level: '1-2' }); L = game.top.level; res.carry = { ammo: L.hero.ammo === ammo, charges: L.hero.charges === ch, slot: L.hero.slot };
    // timed shield expires after 15 s
    L.collect({ type: 'shield', x: L.hero.x, y: L.hero.y }); res.shieldStart = L.hero.shield; run(899, () => ({})); const mid = L.hero.shield; run(2, () => ({})); res.shield = { mid, end: L.hero.shield };
    // enemy counts per campaign level
    res.enemies = {};
    for (const id of ['1-1', '1-2', '1-3', '2-1', '4-2', '8-3']) { game.change('play', { level: id }); res.enemies[id] = game.top.level.enemies.length; }
    return res;
  });
  console.log(JSON.stringify(out, null, 1)); console.log(errs.length ? errs : 'no errors'); await b.close();
})();
