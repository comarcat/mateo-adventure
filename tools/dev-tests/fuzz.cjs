// Random inputs + random screen jumps for 60k frames per seed.  node fuzz.cjs <outdir> 1 2 3
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
const SEEDS = process.argv.slice(3).map(Number), FRAMES = 60000;
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  for (const seed of SEEDS) {
    const r = await p.evaluate(({ seed, FRAMES }) => {
      localStorage.clear(); game.save.reset();
      let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const pick = (a) => a[Math.floor(rnd() * a.length)];
      const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'rush', 'next', 'prev', 'pause', 'confirm', 'back'];
      const levels = ['test']; for (let w = 1; w <= 8; w++) for (let n = 1; n <= 4; n++) levels.push(w + '-' + n);
      const visited = {}; let cur = {}; let hold = 0;
      game.cheats.invincible = rnd() < 0.5; game.cheats.powers = rnd() < 0.5;
      game.input.poll = function () {
        this.prev = this.cur;
        if (--hold <= 0) { hold = 3 + Math.floor(rnd() * 25); cur = {}; for (const a of ACTIONS) if (rnd() < (a === 'pause' || a === 'back' ? 0.03 : 0.25)) cur[a] = true; if (rnd() < 0.5) cur.right = true; }
        this.cur = cur;
      };
      const jumpTo = () => {
        const r = rnd(), g = game;
        try {
          if (r < 0.35) { g.run = g.campaignRun ? g.campaignRun() : g.newRun(); g.save.newCampaign && 0; g.change('play', { level: pick(levels), campaign: rnd() < 0.5 }); }
          else if (r < 0.5) { g.run = { lives: 3, score: 0, coins: 0, powers: rnd() < 0.5 ? Object.keys({ doublejump: 1, glide: 1 }) : [], campaign: false, endless: true }; g.change('endless', { seed: 'F' + Math.floor(rnd() * 99999) }); }
          else if (r < 0.58) { g.save.progress.started = true; g.change('map', { world: 1 + Math.floor(rnd() * 8), node: Math.floor(rnd() * 4) }); }
          else if (r < 0.62) g.change('title');
          else if (r < 0.66) g.change('modeselect');
          else if (r < 0.69) g.change('records', { mode: pick(['classic', 'endless']) });
          else if (r < 0.72) g.change('gameover', { level: pick(levels), campaign: rnd() < 0.5, score: Math.floor(rnd() * 90000), world: 1 + Math.floor(rnd() * 8), time: 300 });
          else if (r < 0.75) g.change('complete', { level: pick(levels), bonus: { clear: 1000, speed: 500, nodmg: 0, total: 1500, secs: 33 }, score: 9000, kills: 3, coins: 4, campaign: false, newPower: rnd() < 0.5 ? 'glide' : null, boss: rnd() < 0.5 });
          else if (r < 0.78) g.change('victory', { score: 123456, coins: 40, powers: ['glide'], time: 3000 });
          else if (r < 0.81) g.change('endlessresult', { seed: 'ABC', score: Math.floor(rnd() * 90000), distance: 300, zone: 3, bosses: 1, time: 100, kills: 4, coins: 2 });
          else if (r < 0.84) g.change('endlessmenu');
          else if (r < 0.87) g.push('options');
          else if (r < 0.9) g.push('controls');
          else if (r < 0.93) g.push('pause');
          else if (r < 0.96) g.push('textentry', { title: 'T', subtitle: 'S', length: 3, charset: 'ABC', initial: 'AB', onDone: () => g.pop(), onCancel: () => g.pop() });
          else { g.cheats.invincible = rnd() < 0.5; g.cheats.powers = rnd() < 0.5; if (game.stack.length > 6) game.stack.length = 1; }
        } catch (e) { throw new Error('jump failed: ' + e.message + ' ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
      };
      let next = 100;
      for (let f = 0; f < FRAMES; f++) {
        game.update(); game.draw();
        const top = game.top; if (top) visited[top.name] = (visited[top.name] || 0) + 1;
        if (f === next) { jumpTo(); next = f + 150 + Math.floor(rnd() * 900); }
        if (!game.top) game.change('title');
      }
      return { seed, visited: Object.keys(visited).length, states: visited };
    }, { seed, FRAMES });
    console.log('seed', seed, 'ok; screens visited:', r.visited, JSON.stringify(r.states));
  }
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors'); await b.close();
})();
