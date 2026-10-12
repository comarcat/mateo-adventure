// Final boss -> orb -> complete -> victory.  node ending.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    localStorage.clear(); game.save.newCampaign();
    for (let w = 1; w <= 8; w++) for (let n = 1; n <= (w === 8 ? 3 : 4); n++) game.save.markCleared(w + '-' + n, 3000, 60);
    game.save.progress.powers = ['doublejump','airdash','iceshot','wallslide','magnet','fireshot','glide']; game.save.progress.world = 8; game.save.progress.node = 3; game.save.flush();
    game.run = game.campaignRun(); game.change('play', { level: '8-4', campaign: true });
    const L = game.top.level; L.cheatInvincible = true; const B = L.boss; let f = 0, log = {};
    game.input.poll = function () { this.prev = this.cur; const h = L.hero, dx = B.cx - h.cx, tap = f % 6 === 0; const plank = h.grounded && h.y < 150;
      let c = { right: dx > 0 && (tap || dx > 120), left: dx < 0 && (tap || dx < -120), shoot: true, jump: plank ? f % 4 === 0 : (f % 70) < 24, down: plank }; 
      const orb = L.pickups.find(q => q.type === 'power' && !q.done); if (orb) { c = { right: orb.x > h.x + 4, left: orb.x < h.x - 4, jump: orb.y < h.y - 10 && f % 30 < 12 }; }
      this.cur = c; h.ammo = 99; };
    for (f = 0; f < 12000; f++) { game.update(); if (game.top.name !== 'play') break; }
    log.afterFight = game.stack.map(s => s.name).join('>'); log.frames = f;
    return log;
  });
  console.log(JSON.stringify(r));
  await p.evaluate(() => { delete game.input.poll; });
  await p.waitForTimeout(700); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  console.log('after continue:', await p.evaluate(() => game.stack.map(s => s.name).join('>')));
  await p.waitForTimeout(1200); await p.screenshot({ path: (process.argv[2] || '.') + '/s5_end.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
