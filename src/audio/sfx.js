// Sound effects: tiny recipes of tones/noise, all synthesized. Each recipe is called with (synth, bus, t).
const seq = (s, bus, t, notes, step, o) => notes.forEach((f, i) => s.tone(bus, t + i * step, step * 1.15, { ...o, f0: f, f1: f }));

export const SFX = {
  jump:   (s, b, t) => s.tone(b, t, 0.13, { duty: 0.5, f0: 330, f1: 700, vol: 0.2 }),
  jump2:  (s, b, t) => { s.tone(b, t, 0.1, { duty: 0.25, f0: 520, f1: 1000, vol: 0.2 }); s.tone(b, t + 0.06, 0.08, { duty: 0.25, f0: 1000, f1: 1500, vol: 0.12 }); },
  land:   (s, b, t) => s.noise(b, t, 0.07, { filter: 'lowpass', f0: 1600, f1: 300, vol: 0.55 }),
  coin:   (s, b, t) => { s.tone(b, t, 0.06, { duty: 0.25, f0: 988, vol: 0.16 }); s.tone(b, t + 0.06, 0.22, { duty: 0.25, f0: 1319, vol: 0.16, r: 0.12 }); },
  stomp:  (s, b, t) => { s.tone(b, t, 0.09, { duty: 0.5, f0: 260, f1: 90, vol: 0.25 }); s.noise(b, t, 0.05, { f0: 3000, vol: 0.1 }); },
  enemydie: (s, b, t) => { s.noise(b, t, 0.16, { filter: 'bandpass', f0: 2500, f1: 500, vol: 0.4 }); s.tone(b, t, 0.14, { duty: 0.125, f0: 600, f1: 120, vol: 0.22 }); },
  shoot:  (s, b, t) => s.tone(b, t, 0.08, { duty: 0.125, f0: 1100, f1: 380, vol: 0.24 }),
  laser:  (s, b, t) => { s.tone(b, t, 0.28, { duty: 0.25, f0: 2200, f1: 180, vol: 0.2 }); s.tone(b, t + 0.01, 0.2, { type: 'saw', f0: 1100, f1: 90, vol: 0.07 }); },
  enemyshot: (s, b, t) => s.tone(b, t, 0.1, { duty: 0.25, f0: 520, f1: 230, vol: 0.22 }),
  charge: (s, b, t) => s.tone(b, t, 0.3, { duty: 0.5, f0: 90, f1: 320, vol: 0.14 }),
  hit:    (s, b, t) => { s.noise(b, t, 0.22, { filter: 'lowpass', f0: 3500, f1: 200, vol: 0.28 }); s.tone(b, t, 0.26, { duty: 0.5, f0: 180, f1: 50, vol: 0.28 }); },
  shieldhit: (s, b, t) => { s.tone(b, t, 0.06, { duty: 0.125, f0: 1500, vol: 0.22 }); s.tone(b, t + 0.05, 0.1, { duty: 0.125, f0: 2000, vol: 0.2 }); },
  shieldbreak: (s, b, t) => { s.noise(b, t, 0.35, { filter: 'bandpass', f0: 5000, f1: 400, vol: 0.25 }); s.tone(b, t, 0.4, { duty: 0.25, f0: 900, f1: 90, vol: 0.2 }); },
  powerup: (s, b, t) => seq(s, b, t, [523, 659, 784, 1047, 1319], 0.065, { duty: 0.25, vol: 0.16 }),
  '1up':  (s, b, t) => seq(s, b, t, [659, 784, 1319, 1047, 1175, 1568], 0.085, { duty: 0.5, vol: 0.16 }),
  eat:    (s, b, t) => seq(s, b, t, [392, 494, 587], 0.05, { duty: 0.5, vol: 0.14 }),
  dash:   (s, b, t) => { s.noise(b, t, 0.28, { filter: 'bandpass', f0: 600, f1: 5000, q: 1.5, vol: 0.6 }); s.tone(b, t, 0.2, { duty: 0.125, f0: 220, f1: 900, vol: 0.18 }); },
  spring: (s, b, t) => { s.tone(b, t, 0.2, { duty: 0.5, f0: 180, f1: 800, vol: 0.2 }); s.tone(b, t + 0.1, 0.12, { duty: 0.25, f0: 600, f1: 1200, vol: 0.1 }); },
  bump:   (s, b, t) => { s.tone(b, t, 0.08, { duty: 0.5, f0: 140, f1: 70, vol: 0.25 }); s.noise(b, t, 0.04, { filter: 'lowpass', f0: 1500, vol: 0.1 }); },
  checkpoint: (s, b, t) => seq(s, b, t, [523, 784, 1047], 0.08, { type: 'tri', vol: 0.3 }),
  clear:  (s, b, t) => { seq(s, b, t, [523, 659, 784, 1047], 0.1, { duty: 0.5, vol: 0.18 }); [523, 659, 784].forEach((f) => s.tone(b, t + 0.45, 0.5, { duty: 0.25, f0: f * 2, vol: 0.09, r: 0.2 })); },
  menu:   (s, b, t) => s.tone(b, t, 0.04, { duty: 0.5, f0: 880, vol: 0.18 }),
  select: (s, b, t) => { s.tone(b, t, 0.05, { duty: 0.5, f0: 660, vol: 0.14 }); s.tone(b, t + 0.05, 0.1, { duty: 0.5, f0: 990, vol: 0.14 }); },
  empty:  (s, b, t) => s.tone(b, t, 0.06, { duty: 0.5, f0: 120, vol: 0.22 }),
  pause:  (s, b, t) => { s.tone(b, t, 0.05, { duty: 0.5, f0: 440, vol: 0.12 }); s.tone(b, t + 0.06, 0.07, { duty: 0.5, f0: 330, vol: 0.12 }); },
  bosshit:  (s, b, t) => { s.noise(b, t, 0.18, { filter: 'lowpass', f0: 3000, f1: 300, vol: 0.28 }); s.tone(b, t, 0.22, { duty: 0.5, f0: 320, f1: 110, vol: 0.28 }); },
  bossroar: (s, b, t) => { s.noise(b, t, 0.7, { filter: 'bandpass', f0: 300, f1: 90, q: 2, vol: 0.3 }); s.tone(b, t, 0.7, { duty: 0.25, f0: 90, f1: 55, vol: 0.22, vib: 0.03 }); },
  bossjump: (s, b, t) => s.tone(b, t, 0.18, { duty: 0.5, f0: 120, f1: 330, vol: 0.22 }),
  bossland: (s, b, t) => { s.noise(b, t, 0.3, { filter: 'lowpass', f0: 1500, f1: 120, vol: 0.3 }); s.tone(b, t, 0.28, { duty: 0.5, f0: 75, f1: 40, vol: 0.28 }); },
  bossdefeat: (s, b, t) => {
    s.noise(b, t, 1.0, { filter: 'bandpass', f0: 3000, f1: 150, q: 1, vol: 0.3 });
    for (let i = 0; i < 8; i++) s.tone(b, t + i * 0.1, 0.12, { duty: 0.125, f0: 1200 - i * 120, f1: 400 - i * 30, vol: 0.14 });
    seq(s, b, t + 1.0, [523, 659, 784, 1047, 784, 1047, 1319], 0.1, { duty: 0.5, vol: 0.16 });
  },
};
