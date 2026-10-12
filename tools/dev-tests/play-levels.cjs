// Plays campaign levels with an invincible bot and reports clear/deaths.  node play-levels.cjs <outdir> 1-1 2-3 8-2
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
const ids = process.argv.slice(3);
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  for (const id of ids) {
    const r = await p.evaluate((id) => {
      window.dd = []; game.run = game.campaignRun(); game.change('play', { level: id, campaign: true });
      const L = game.top.level; L.cheatInvincible = true;
      let f = 0, stuckX = 0, stuckT = 0, deaths = 0, lastLives = L.run.lives;
      game.input.poll = function () {
        this.prev = this.cur;
        const h = L.hero, m = L.map; let jump = false, wait = false;
        if (!h.dead) {
          const dir = 1, ax = (d) => Math.floor((h.x + h.w + d) / 16), row = Math.floor((h.y + h.h - 1) / 16), below = Math.floor((h.y + h.h + 2) / 16);
          if (h.grounded) {
            // pit ahead
            const col = ax(5); let hasGround = false; for (let r = below; r < m.h; r++) { const kk = m.kind(col, r); if (kk === 1 || kk === 2 || kk === 4 || kk === 5) { hasGround = true; break; } }
            if (!hasGround && !h.riding) {
              const near = L.platforms.filter(pl => pl.x + pl.w > h.x && pl.x < h.x + 150);
              if (near.length) { const ok = near.some(pl => Math.abs(pl.y - (h.y + h.h)) < 2 && pl.x <= h.x + h.w + 3 && pl.x + pl.w > h.x + h.w); if (!ok) wait = true; }
              else jump = true;
            }
            // wall ahead
            if (m.kind(ax(3), row) === 1 || m.kind(ax(3), row - 1) === 1) jump = true;
            // spikes ahead
            if (m.kind(ax(10), row) === 3 || m.kind(ax(2), row) === 3) jump = true;
            // enemy ahead
            for (const e of L.enemies) if (!e.dead && e.awake && e.x > h.x && e.x - h.x < 44 && Math.abs(e.y - h.y) < 24) jump = true;
            if (h.riding) { const p = h.riding, edge = p.x + p.w - (h.x + h.w); if (!(p.pos >= p.range - 2 || (edge > 22 && p.dir === 1))) wait = true; }
          }
        }
        this.cur = { right: !wait, jump: jump || (h.vy < 0 && !h.grounded && !h.dead), shoot: (f % 20 < 10) };
      };
      let status = '';
      for (f = 0; f < 14000; f++) {
        game.update();
        const lv = game.top.level; if (!lv) { status = game.top.name; break; }
        if (lv.status !== 'play') { status = lv.status; break; }
        const h = lv.hero; 
        if (Math.abs(h.x - stuckX) < 1) stuckT++; else { stuckT = 0; stuckX = h.x; }
        if (stuckT > 900) { status = 'STUCK at col ' + Math.round(h.x / 16) + ' row ' + Math.round(h.y / 16); break; }
        if (lv.run.lives !== lastLives) { deaths++; lastLives = lv.run.lives; (window.dl = window.dl || []).push(Math.round(lv.respawnAt.x/16)); }
        if (h.dead && h.deathT === 1) (window.dd = window.dd || []).push(Math.round(h.x / 16) + ',' + Math.round(h.y / 16));
      }
      const lv = game.top.level;
      return { id, status, frames: f, deaths, x: lv ? Math.round(lv.hero.x / 16) : null, lives: lv ? lv.run.lives : null, mapW: lv ? lv.map.w : null, deathsAt: window.dd, tr: window.tr };
    }, id);
    console.log(JSON.stringify(r));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
