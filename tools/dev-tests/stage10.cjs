// Feel pass: corner correction, ledge assist, decaying shake, hit-stop, squash/stretch, fall-gravity multiplier.  node stage10.cjs
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 768, height: 672 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html?debug'); await p.waitForTimeout(400);
  const out = await p.evaluate(() => {
    const res = {};
    const fresh = (fall) => { game.cheats.invincible = true; game.cheats.fall = fall; game.run = game.newRun(); game.change('play', { level: 'test' }); const L = game.top.level; L.enemies.forEach((e) => { e.dead = true; }); return L; };
    const run = (n, s, probe) => { let f = 0; game.input.poll = function () { this.prev = this.cur; this.cur = s ? s(f) : {}; }; for (f = 0; f < n; f++) { game.update(); probe && probe(f); } };
    // 1. corner correction: jump up under the left edge of the block row (cols 7-10, bottom y=128), overlapping it by 3px
    for (const assist of [false, true]) {
      const L = fresh(1), h = L.hero; h.assist = assist; h.respawn(105, 176 - 14); h.vx = 0; h.vy = 0; h.invuln = 0; let top = h.y;
      run(50, (f) => ({ jump: f > 2 && f < 40 }), () => { top = Math.min(top, h.y); });
      res['corner_' + (assist ? 'on' : 'off')] = { topY: Math.round(top), x: Math.round(h.x), reachedAboveBlock: top < 112 };
    }
    // 2. ledge assist: airborne, feet 3px below a block top, pushing into it
    for (const assist of [false, true]) {
      const L = fresh(1), h = L.hero; h.assist = assist; h.respawn(102, 112 + 2 - 14); h.vx = 0; h.vy = 0.1; h.grounded = false; h.invuln = 0;
      run(40, () => ({ right: true }));
      res['ledge_' + (assist ? 'on' : 'off')] = { standingOnBlock: Math.abs(h.y + h.h - 112) < 1.5 && h.grounded };
    }
    // 3. hit-stop freezes the simulation, and is skipped with reduce-fx
    let L = fresh(1); L.reduceFx = false; let f0 = L.frames; L.hitStop(5); run(8); res.hitStop = { framesAdvanced: L.frames - f0 };
    L = fresh(1); L.reduceFx = true; f0 = L.frames; L.hitStop(5); run(8); res.hitStopReduced = { framesAdvanced: L.frames - f0 };
    // 4. shake is smooth + decays; reduce-fx scales it
    L = fresh(1); const cam = L.camera; cam.shake(6, 20); const offs = []; for (let i = 0; i < 24; i++) { cam._apply(); offs.push(cam.ox - Math.round(cam.x)); }
    res.shake = { peak: Math.max(...offs.map(Math.abs)), last3: offs.slice(-3), maxStep: Math.max(...offs.slice(1).map((v, i) => Math.abs(v - offs[i]))) };
    cam.fx = 0.3; cam.shake(6, 20); cam._apply(); res.shakeReducedAmp = +cam.shakeMag.toFixed(2);
    // 5. squash on landing, stretch on take-off
    L = fresh(1); const h = L.hero; h.respawn(60, 176 - 14); let maxSq = 0, maxSt = 0;
    run(70, (f) => ({ jump: f > 2 && f < 30 }), () => { maxSq = Math.max(maxSq, h.squashT); maxSt = Math.max(maxSt, h.stretchT); });
    res.squashStretch = { squash: maxSq, stretch: maxSt };
    // 6. fall gravity multiplier: full jump airtime and apex
    res.fall = {};
    for (const m of [1, 1.2, 1.4]) { const L2 = fresh(m), h2 = L2.hero; h2.respawn(1300, 176 - 14); h2.vx = 0; let n = 0, top2 = h2.y, y0 = h2.y, left = false;
      run(120, (f) => ({ jump: f > 2 && f < 40, right: f > 2 && f < 80 }), (f) => { top2 = Math.min(top2, h2.y); if (!h2.grounded) { n++; left = true; } }); res.fall['x' + m] = { airFrames: n, apexPx: Math.round(y0 - top2), distPx: Math.round(h2.x - 1300) }; }
    return res;
  });
  console.log(JSON.stringify(out)); console.log(errs.length ? errs : 'no errors'); await b.close();
})();
