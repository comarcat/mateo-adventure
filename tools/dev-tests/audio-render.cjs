// Renders every track/sfx offline and checks levels.  node audio-render.cjs <outdir>
// Needs: npm i -D playwright (+ a Chromium), and the game served at BASE (default http://localhost:8123 via: python3 -m http.server 8123)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args:['--no-sandbox'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto((process.env.BASE || 'http://localhost:8123') + '/index.html'); await p.waitForTimeout(300);
  const res = await p.evaluate(async () => {
    const { Synth } = await import('/src/audio/synth.js');
    const { Sequencer } = await import('/src/audio/sequencer.js');
    const { TRACKS } = await import('/src/audio/tracks.js');
    const { SFX } = await import('/src/audio/sfx.js');
    const SR = 22050;
    const stats = (buf) => {
      const d = buf.getChannelData(0); let peak = 0, sum = 0, clip = 0, silent = 0, zc = 0;
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += d[i] * d[i]; if (a >= 0.999) clip++; if (a < 0.0005) silent++; if (i && (d[i - 1] < 0) !== (d[i] < 0)) zc++; }
      return { peak: +peak.toFixed(2), rms: +Math.sqrt(sum / d.length).toFixed(3), clip, silentPct: +(100 * silent / d.length).toFixed(0), zcHz: Math.round(zc / 2 / (d.length / SR)) };
    };
    const out = { tracks: {}, sfx: {} };
    for (const name of Object.keys(TRACKS)) {
      const secs = 12; const ctx = new OfflineAudioContext(1, SR * secs, SR);
      const s = new Synth(ctx); s.musicBus.gain.value = 0.7 * 0.7; const q = new Sequencer(s);
      q.scheduleOffline(name, secs); const buf = await ctx.startRendering(); out.tracks[name] = stats(buf);
    }
    for (const name of Object.keys(SFX)) {
      const ctx = new OfflineAudioContext(1, SR * 2, SR); const s = new Synth(ctx); s.sfxBus.gain.value = 0.8 * 0.8;
      SFX[name](s, s.sfxBus, 0.01); const buf = await ctx.startRendering(); out.sfx[name] = stats(buf);
    }
    return out;
  });
  console.log('TRACKS (peak rms clip silent% zcHz)'); for (const [k, v] of Object.entries(res.tracks)) console.log(k.padEnd(14), JSON.stringify(v));
  console.log('SFX'); for (const [k, v] of Object.entries(res.sfx)) console.log(k.padEnd(12), JSON.stringify(v));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
