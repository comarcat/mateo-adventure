// Key + gamepad remapping, persistence, reset.  node remap.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.clear(); game.save.reset(); game.input.setBindings(null); game.push('controls'); });
  await p.waitForTimeout(150);
  const kb = () => p.evaluate(() => JSON.stringify({ jump: game.input.bind.kb.jump, shoot: game.input.bind.kb.shoot, stored: game.save.settings.bindings && game.save.settings.bindings.kb.jump }));
  // select JUMP row (index 4): down x4, confirm, press 'KeyK'
  for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40); }
  await p.keyboard.press('Enter'); await p.waitForTimeout(100); await p.screenshot({ path: (process.argv[2] || '.') + '/remap_wait.png' });
  await p.keyboard.press('KeyK'); await p.waitForTimeout(100); console.log('after rebind jump->K', await kb());
  // rebind SHOOT to K as well -> must steal K from jump
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40); await p.keyboard.press('Enter'); await p.waitForTimeout(100); await p.keyboard.press('KeyK'); await p.waitForTimeout(100);
  console.log('after rebind shoot->K', await kb());
  await p.screenshot({ path: (process.argv[2] || '.') + '/remap.png' });
  // actually works in-game: persist, reload, jump with K
  await p.reload(); await p.waitForTimeout(400);
  console.log('after reload', await kb());
  // pad capture: fake a gamepad
  await p.evaluate(() => { game.push('controls'); window.__pad = { id: 'Fake Pad (STANDARD GAMEPAD)', connected: true, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; navigator.getGamepads = () => [window.__pad]; });
  await p.waitForTimeout(100);
  for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40); }
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(40); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
  await p.evaluate(() => { window.__pad.buttons[5].pressed = true; }); await p.waitForTimeout(120);
  await p.evaluate(() => { window.__pad.buttons[5].pressed = false; }); await p.waitForTimeout(80);
  console.log('pad jump', await p.evaluate(() => JSON.stringify(game.input.bind.pad.jump)));
  // reset
  for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(40); }
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  console.log('after reset', await kb(), await p.evaluate(() => JSON.stringify(game.input.bind.pad.jump)));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
