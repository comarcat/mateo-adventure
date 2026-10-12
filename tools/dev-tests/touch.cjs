// Touch controls on an emulated phone.  node touch.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const ctx = await b.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(500);
  console.log('overlay visible:', await p.evaluate(() => game.touch.enabled));
  await p.screenshot({ path: (process.argv[2] || '.') + '/touch_title.png' });
  // tap A (confirm) on title -> mode select
  const tap = async (id, ms = 90) => { const box = await (await p.$(`#touch [data-id=${id}]`)).boundingBox(); await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); };
  await tap('jump'); await p.waitForTimeout(300); console.log('state after A:', await p.evaluate(() => game.stack.map(s => s.name).join('>')));
  // in a level: hold right via pointer events, check movement
  await p.evaluate(() => { game.run = game.newRun(); game.change('play', { level: 'test' }); });
  await p.waitForTimeout(200);
  const x0 = await p.evaluate(() => game.top.level.hero.x);
  await p.evaluate(() => { const el = document.querySelector('#touch [data-id=right]'); const r = el.getBoundingClientRect(); const ev = (t) => new PointerEvent(t, { pointerId: 7, bubbles: true, clientX: r.x + 5, clientY: r.y + 5, pointerType: 'touch' }); el.dispatchEvent(ev('pointerdown')); window.__rel = () => el.dispatchEvent(ev('pointerup')); });
  await p.waitForTimeout(700); await p.evaluate(() => window.__rel()); await p.waitForTimeout(200);
  const x1 = await p.evaluate(() => game.top.level.hero.x);
  console.log('hero moved by touch:', Math.round(x1 - x0), 'px; right still held?', await p.evaluate(() => !!game.input.touch.right));
  await p.screenshot({ path: (process.argv[2] || '.') + '/touch_play.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
