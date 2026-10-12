// Double jump, menus, map, save persistence.  node campaign-flow.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  await p.evaluate(() => localStorage.clear());
  const st = () => p.evaluate(() => game.stack.map(s => s.name).join('>') + (game.top.name === 'map' ? ' w' + game.top.world + ' n' + game.top.node + (game.top.moving ? ' moving' : '') : ''));
  // 1. double jump (needs the power): give it and test in 1-1
  const dj = await p.evaluate(() => {
    game.save.newCampaign(); game.save.progress.powers = ['doublejump']; game.run = game.campaignRun(); game.run.slot = 'doublejump'; game.change('play', { level: '1-1', campaign: true });
    const L = game.top.level; let f = 0, apexes = [], lastVy = 0;
    // press jump at frame 5, release; press again at frame 30 in mid-air
    game.input.poll = function () { this.prev = this.cur; this.cur = { jump: (f >= 5 && f < 25) || (f >= 40 && f < 60) }; };
    let minY = 999, minY2 = 999, y0 = L.hero.y;
    for (f = 0; f < 100; f++) { game.update(); const y = L.hero.y; if (f < 38) minY = Math.min(minY, y); else minY2 = Math.min(minY2, y); }
    return { y0, firstApex: minY, secondApex: minY2, airJumpsLeft: L.hero.airJumps };
  });
  console.log('doublejump', JSON.stringify(dj));
  // 2. clear 1-1..1-3 by skipping: mark cleared via save; boss level via flow
  await p.evaluate(() => { for (const id of ['1-1', '1-2', '1-3']) game.save.markCleared(id, 5000, 60); game.save.progress.world = 1; game.save.progress.node = 3; game.save.flush(); game.change('map', {}); });
  await p.waitForTimeout(100); console.log('map:', await st());
  await p.screenshot({ path: SP() + '/m2.png' });
  function SP() { return process.argv[2]; }
  await p.evaluate(() => { delete game.input.poll; });
  // 3. complete boss via state flow
  await p.evaluate(() => { game.run = game.campaignRun(); game.change('play', { level: '1-4', campaign: true }); const L = game.top.level; L.hero.powers.add('doublejump'); L.newPower = 'doublejump'; L.run.powers.push('doublejump'); L.clearLevel(); for (let i = 0; i < 200; i++) game.update(); });
  console.log('after clear:', await st());
  await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(300); console.log('after continue:', await st());
  await p.screenshot({ path: SP() + '/m3.png' });
  await p.waitForTimeout(1800); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); console.log('after right:', await st());
  await p.screenshot({ path: SP() + '/m4.png' });
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  // 4. persistence: reload, Continue
  await p.reload(); await p.waitForTimeout(400);
  const saved = await p.evaluate(() => JSON.stringify({ powers: game.save.progress.powers, cleared: Object.keys(game.save.progress.cleared), started: game.save.progress.started }));
  console.log('after reload:', saved);
  await p.keyboard.press('Enter'); await p.waitForTimeout(150); await p.screenshot({ path: SP() + '/m5.png' });
  console.log('mode select:', await st());
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
