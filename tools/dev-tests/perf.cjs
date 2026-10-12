// Update/draw time per frame.  node perf.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const out = {};
    const measure = (name, setup, frames = 1500) => {
      setup(); const L = game.top.level; const ups = [], drs = [];
      for (let f = 0; f < frames; f++) { const t0 = performance.now(); game.update(); const t1 = performance.now(); game.draw(); const t2 = performance.now(); ups.push(t1 - t0); drs.push(t2 - t1); }
      const stat = (a) => { a.sort((x, y) => x - y); return { avg: +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2), max: +a[a.length - 1].toFixed(1) }; };
      out[name] = { update: stat(ups), draw: stat(drs) };
    };
    const bot = () => { game.input.poll = function () { this.prev = this.cur; const L = game.top.level, h = L && L.hero; this.cur = { right: true, jump: h && (h.vy < 0 || (L.frames % 40) < 14), shoot: L && L.frames % 6 < 3 }; if (h) h.ammo = 99; }; };
    measure('level 8-3 (24 enemies)', () => { game.cheats.invincible = true; game.run = game.campaignRun(); game.change('play', { level: '8-3', campaign: true }); bot(); });
    measure('boss 8-4 dark king', () => { game.run = game.campaignRun(); game.change('play', { level: '8-4', campaign: true }); bot(); }, 1200);
    measure('endless zone 0..', () => { game.run = { lives: 3, score: 0, coins: 0, powers: [], campaign: false, endless: true }; game.change('endless', { seed: 'PERF' }); bot(); }, 4000);
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log('budget per frame at 60fps: 16.7 ms'); console.log(errs.join('\n') || 'no errors'); await b.close();
})();
