// Debug menu (F2) and level select.  node debug-menu.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // without ?debug F2 must do nothing
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html'); await p.waitForTimeout(400); await p.keyboard.press('F2'); await p.waitForTimeout(100);
  console.log('no-debug F2 ->', await p.evaluate(() => game.stack.map(s => s.name).join('>')));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  await p.keyboard.press('F2'); await p.waitForTimeout(100);
  console.log('debug F2 ->', await p.evaluate(() => game.stack.map(s => s.name).join('>')));
  await p.screenshot({ path: (process.argv[2] || '.') + '/debugmenu.png' });
  // pick level 8-4 : step right until label shows it
  for (let i = 0; i < 40; i++) { const lbl = await p.evaluate(() => game.top.menu.items[0].label()); if (lbl.includes('8-4')) break; await p.keyboard.press('ArrowRight'); await p.waitForTimeout(25); }
  const key = async (k) => { await p.keyboard.press(k); await p.waitForTimeout(45); };
  await key('ArrowDown'); await key('ArrowDown'); await key('Enter');   // invincible on
  await key('ArrowUp'); await key('ArrowUp'); await key('Enter'); await p.waitForTimeout(400);
  console.log('launched ->', await p.evaluate(() => game.stack.map(s => s.name).join('>') + ' ' + (game.top.level && game.top.level.data.id) + ' god=' + (game.top.level && game.top.level.cheatInvincible)));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
