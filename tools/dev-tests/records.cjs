// Score board rules + name entry flow.  node records.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const SP = process.argv[2];
  const stack = () => p.evaluate(() => game.stack.map(s => s.name).join('>'));
  // unit: scoreboard rules
  const unit = await p.evaluate(async () => {
    localStorage.clear(); const sb = game.scores; const out = {};
    for (let i = 1; i <= 12; i++) await sb.submit('endless', { name: 'p' + i + '!!', score: i * 1000, distance: i * 10, seed: 'S' + i });
    const top = await sb.top('endless'); out.len = top.length; out.best = top[0].score; out.worst = top[9].score; out.sorted = top.every((e, i) => !i || top[i - 1].score >= e.score); out.name = top[0].name;
    out.qualLow = await sb.qualifies('endless', 500); out.qualHigh = await sb.qualifies('endless', 5000); out.qualZero = await sb.qualifies('endless', 0);
    const r = await sb.submit('classic', { name: 'zz', score: 4242, world: 99, time: -5 }); out.rank = r.rank; out.clamped = (await sb.top('classic'))[0];
    out.persisted = JSON.parse(localStorage.getItem('mateo-adventure')).scores.endless.length;
    return out;
  });
  console.log('scoreboard', JSON.stringify(unit));
  // flow: endless result qualifies -> type name -> records
  await p.evaluate(() => { localStorage.clear(); game.change('endlessresult', { seed: 'ABC123', score: 54321, distance: 321, zone: 3, bosses: 0, time: 125, kills: 9, coins: 12 }); });
  await p.waitForTimeout(300); console.log('1', await stack());
  await p.keyboard.type('mat'); await p.waitForTimeout(150); await p.screenshot({ path: SP + '/r_entry.png' });
  await p.keyboard.press('Enter'); await p.waitForTimeout(300); console.log('2', await stack());
  await p.waitForTimeout(600); await p.screenshot({ path: SP + '/r_result.png' });
  console.log('stored', await p.evaluate(() => JSON.stringify(game.save.scores.endless)));
  await p.evaluate(() => game.change('records', { mode: 'endless', rank: 1 })); await p.waitForTimeout(200); await p.screenshot({ path: SP + '/r_records.png' });
  // classic via game over flow
  await p.evaluate(() => { game.change('gameover', { level: '1-1', campaign: true, score: 7700, world: 3, time: 400 }); });
  await p.waitForTimeout(300); console.log('3', await stack());
  await p.keyboard.type('abc'); await p.waitForTimeout(150); await p.keyboard.press('Enter'); await p.waitForTimeout(400); console.log('4', await stack());
  console.log('classic', await p.evaluate(() => JSON.stringify(game.save.scores.classic)));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
