// Fights bosses with a shooting bot.  node fight-bosses.cjs <outdir> 1 2 3 4 5 6 7 8   (world numbers)
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const worlds = process.argv.slice(3).map(Number);
  for (const w of worlds) {
    const r = await p.evaluate((w) => {
      localStorage.clear(); game.save.newCampaign(); game.run = game.campaignRun(); game.change('play', { level: w + '-4', campaign: true });
      const L = game.top.level; L.cheatInvincible = true; const B = L.boss;
      const out = { boss: B.def.name, hp: B.maxHp, phases: [], states: new Set() };
      let f = 0;
      game.input.poll = function () {
        this.prev = this.cur; const h = L.hero;
        const dx = B.cx - h.cx, tap = f % 6 === 0;
        const onPlank = h.grounded && h.y < 150 && !B.def.flying;
        this.cur = { right: dx > 0 && (tap || dx > 120), left: dx < 0 && (tap || dx < -120), shoot: true, jump: onPlank ? (f % 4 === 0) : (f % 70) < 24, down: onPlank };
        h.ammo = 99; if (h.slot === 'base') h.weapon = 'gun';
      };
      for (f = 0; f < 9000; f++) {
        game.update(); const lv = game.top.level; if (!lv || lv !== L) break;
        out.states.add(B.state); if (B.phase !== (out.phases.length ? out.phases[out.phases.length - 1][1] : 0)) out.phases.push([f, B.phase, B.hp]);
        if (B.dead) { out.deadAt = f; break; }
      }
      out.states = [...out.states].join(','); out.hpLeft = B.hp; out.frames = f;
      return out;
    }, w);
    console.log(w + '-4', JSON.stringify(r));
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
