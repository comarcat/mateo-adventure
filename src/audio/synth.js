// Web Audio chiptune synth: pulse (with duty cycles), triangle, noise. Works on any BaseAudioContext
// (live AudioContext in the game, OfflineAudioContext in tests). No audio files anywhere.
const TAU = Math.PI * 2;

export class Synth {
  constructor(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.knee.value = 12; this.comp.ratio.value = 6; this.comp.attack.value = 0.003; this.comp.release.value = 0.15;
    this.musicBus = ctx.createGain(); this.sfxBus = ctx.createGain();
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.waves = {};
    this.noiseBuf = this._noise();
    this.active = 0;
  }

  _noise() {
    const n = this.ctx.sampleRate, b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }   // deterministic noise
    return b;
  }

  // Band-limited pulse wave for a duty cycle (0.125, 0.25, 0.5, 0.75 ...), like NES/PC-speaker pulse channels.
  pulseWave(duty) {
    const key = duty.toFixed(3);
    if (this.waves[key]) return this.waves[key];
    const N = 48, real = new Float32Array(N), imag = new Float32Array(N);
    for (let n = 1; n < N; n++) {
      real[n] = (2 * Math.sin(TAU * n * duty)) / (Math.PI * n);
      imag[n] = (2 * (1 - Math.cos(TAU * n * duty))) / (Math.PI * n);
    }
    return (this.waves[key] = this.ctx.createPeriodicWave(real, imag));
  }

  // Core voice: oscillator -> gain envelope -> bus. opts: {type:'pulse'|'tri'|'saw', duty, f0, f1, vol, a, d, s, r, vib, curve}
  tone(bus, t, dur, o) {
    const c = this.ctx, osc = c.createOscillator(), g = c.createGain();
    if (o.type === 'tri') osc.type = 'triangle'; else if (o.type === 'saw') osc.type = 'sawtooth'; else if (o.type === 'sine') osc.type = 'sine'; else osc.setPeriodicWave(this.pulseWave(o.duty ?? 0.5));
    const f0 = o.f0, f1 = o.f1 ?? o.f0;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) { if (o.curve === 'lin') osc.frequency.linearRampToValueAtTime(f1, t + dur); else osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur); }
    if (o.vib) {   // gentle vibrato after a short delay, for held lead notes
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 5.5; lg.gain.value = f0 * o.vib;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t + Math.min(0.12, dur * 0.4)); lfo.stop(t + dur + 0.05);
    }
    const vol = o.vol ?? 0.2, a = o.a ?? 0.004, d = o.d ?? 0.05, s = o.s ?? 0.7, r = o.r ?? 0.03;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(vol * s, t + a + d);
    g.gain.setValueAtTime(vol * s, Math.max(t + a + d, t + dur - r));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + r * 0.5);
    osc.connect(g); g.connect(bus);
    osc.start(t); osc.stop(t + dur + r + 0.02);
    this.active++; osc.onended = () => { this.active--; g.disconnect(); };
  }

  // Noise burst through a filter; used for drums, whooshes, explosions.
  noise(bus, t, dur, o = {}) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noiseBuf; src.loop = true;
    f.type = o.filter || 'highpass'; f.frequency.setValueAtTime(o.f0 ?? 4000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    f.Q.value = o.q ?? 0.7;
    const vol = o.vol ?? 0.15;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t, (t * 7.31) % 0.9); src.stop(t + dur + 0.02);
    this.active++; src.onended = () => { this.active--; g.disconnect(); };
  }

  kick(bus, t, vol = 0.3) { this.tone(bus, t, 0.14, { type: 'sine', f0: 160, f1: 38, vol, a: 0.001, d: 0.04, s: 0.5, r: 0.02 }); }
}

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
