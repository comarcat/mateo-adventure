// Step sequencer: schedules compiled tracks on the audio clock with a short look-ahead, so timing stays
// tight even when the main thread is busy. Four channels: lead (pulse), arp (pulse), bass (triangle), drums (noise).
import { compileTrack } from './tracks.js';
import { midiToFreq } from './synth.js';

const LOOKAHEAD = 0.15, TICK_MS = 30;

export class Sequencer {
  constructor(synth) { this.s = synth; this.cur = null; this.timer = null; this.fade = null; }

  // Starts a track (fading out whatever is playing). Returns the compiled track.
  play(name, loop = true) {
    const ctx = this.s.ctx;
    this.stop(0.25);
    const track = compileTrack(name);
    const gain = ctx.createGain(); gain.gain.value = 1; gain.connect(this.s.musicBus);
    this.cur = { name, track, gain, step: 0, time: ctx.currentTime + 0.06, stepDur: 60 / track.bpm / 4, loop: loop && track.loop, ended: false };
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
    return track;
  }

  stop(fadeSec = 0.2) {
    const c = this.cur; if (!c) return;
    clearInterval(this.timer); this.timer = null;
    const ctx = this.s.ctx, t = ctx.currentTime;
    c.gain.gain.cancelScheduledValues(t); c.gain.gain.setValueAtTime(c.gain.gain.value, t); c.gain.gain.linearRampToValueAtTime(0.0001, t + fadeSec);
    setTimeout(() => { try { c.gain.disconnect(); } catch (e) { /* already gone */ } }, fadeSec * 1000 + 100);
    this.cur = null;
  }

  tick() {
    const c = this.cur; if (!c || c.ended) return;
    const now = this.s.ctx.currentTime;
    while (c.time < now + LOOKAHEAD) {
      this.playStep(c, c.step, c.time);
      c.time += c.stepDur; c.step++;
      if (c.step >= c.track.steps) { if (c.loop) c.step = 0; else { c.ended = true; clearInterval(this.timer); this.timer = null; return; } }
    }
  }

  playStep(c, step, t) {
    const s = this.s, bus = c.gain, sd = c.stepDur;
    for (const e of c.track.ev[step]) {
      switch (e.ch) {
        case 'lead': s.tone(bus, t, e.dur * sd * 0.94, { duty: c.track.duty, f0: midiToFreq(e.midi), vol: 0.15, a: 0.006, d: 0.06, s: 0.75, vib: e.dur >= 4 ? c.track.vib : 0 }); break;
        case 'arp': s.tone(bus, t, sd * 0.8, { duty: 0.125, f0: midiToFreq(e.midi), vol: 0.05, a: 0.003, d: 0.04, s: 0.4 }); break;
        case 'bass': s.tone(bus, t, e.dur * sd * 0.92, { type: 'tri', f0: midiToFreq(e.midi), vol: 0.26, a: 0.005, d: 0.02, s: 0.9 }); break;
        case 'kick': s.kick(bus, t, 0.3); break;
        case 'snare': s.noise(bus, t, 0.11, { filter: 'bandpass', f0: 2600, q: 0.8, vol: 0.2 }); s.tone(bus, t, 0.07, { type: 'tri', f0: 200, f1: 120, vol: 0.12 }); break;
        case 'hat': s.noise(bus, t, 0.035, { filter: 'highpass', f0: 7500, vol: e.soft ? 0.05 : 0.08 }); break;
      }
    }
  }

  // Test helper: schedule `seconds` of a track in one go (for OfflineAudioContext rendering).
  scheduleOffline(name, seconds, loop = true) {
    const track = compileTrack(name), c = { track, gain: this.s.musicBus, stepDur: 60 / track.bpm / 4 };
    let t = 0.02, step = 0;
    while (t < seconds) { this.playStep(c, step, t); t += c.stepDur; step++; if (step >= track.steps) { if (loop && track.loop) step = 0; else break; } }
    return track;
  }
}
