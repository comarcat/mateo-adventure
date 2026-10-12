// Wall slide / wall jump check.  node wall-climb.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const res = {};
    for (const power of [true, false]) {
      game.run = game.newRun(); game.run.powers = power ? ['wallslide'] : []; game.run.slot = power ? 'wallslide' : 'base'; game.change('play', { level: 'test' });
      const L = game.top.level; L.cheatInvincible = true;
      for (let r = 0; r <= 10; r++) L.map.set(95, r, '#');          // tall wall at col 95
      const h = L.hero; h.respawn(95 * 16 - 11, 2 * 16); h.invuln = 0;
      let maxVy = 0, vxJump = null, f = 0, jumped = false;
      game.input.poll = function () { this.prev = this.cur; this.cur = { right: f < 60, jump: f === 40 }; };
      for (f = 0; f < 70; f++) { game.update(); if (f > 15 && f < 39) maxVy = Math.max(maxVy, h.vy); if (f === 43) vxJump = h.vx; }
      res[power ? 'withPower' : 'without'] = { maxVyWhileAgainstWall: +maxVy.toFixed(2), vxAfterJump: vxJump === null ? null : +vxJump.toFixed(2) };
    }
    return res;
  });
  console.log(JSON.stringify(out)); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
