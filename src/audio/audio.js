// Audio facade used by the game: unlock-on-first-gesture, music + sfx buses, volumes, mute, persistence.
// Everything is synthesized with the Web Audio API (see synth.js / tracks.js / sfx.js).
import { Synth } from './synth.js';
import { Sequencer } from './sequencer.js';
import { SFX } from './sfx.js';

export class Audio {
  constructor(settings, onChange = () => {}) {
    this.settings = settings; this.onChange = onChange;
    this.ctx = null; this.synth = null; this.seq = null; this.failed = false;
    this.pending = null; this.current = null; this.last = {}; this.ducked = false;
    // Browsers only allow audio after a user gesture: unlock on the first key / click / touch.
    const unlock = () => this.unlock();
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) addEventListener(ev, unlock, { passive: true });
  }
  get enabled() { return !!this.ctx && !this.failed; }

  unlock() {
    if (this.failed) return;
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.synth = new Synth(this.ctx); this.seq = new Sequencer(this.synth);
      this.applyVolumes();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.pending) { const p = this.pending; this.pending = null; this.music(p.name, p.loop); }
    } catch (e) { this.failed = true; this.ctx = null; }
  }

  // volume 0..1 slider values are squared for a more natural loudness curve
  applyVolumes() {
    if (!this.synth) return;
    const s = this.settings, t = this.ctx.currentTime;
    const m = s.muted ? 0 : s.master * s.master;
    this.synth.master.gain.setTargetAtTime(0.9 * m, t, 0.02);
    this.synth.musicBus.gain.setTargetAtTime(s.music * s.music * (this.ducked ? 0.35 : 1), t, 0.05);
    this.synth.sfxBus.gain.setTargetAtTime(1.6 * s.sfx * s.sfx, t, 0.02);   // sfx sit on top of the music bed
  }
  setVolume(kind, v) { this.settings[kind] = Math.max(0, Math.min(1, Math.round(v * 10) / 10)); this.applyVolumes(); this.onChange(); }
  toggleMute() { this.settings.muted = !this.settings.muted; this.applyVolumes(); this.onChange(); return this.settings.muted; }
  duck(on) { this.ducked = on; this.applyVolumes(); }

  sfx(name) {
    if (!this.synth || this.ctx.state !== 'running') return;
    const fn = SFX[name]; if (!fn) return;
    const t = this.ctx.currentTime;
    if (t - (this.last[name] || 0) < 0.03) return;           // de-bounce identical sounds
    if (this.synth.active > 60) return;                        // never let sfx pile up
    this.last[name] = t;
    fn(this.synth, this.synth.sfxBus, t + 0.005);
  }

  music(name, loop = true) {
    if (this.current === name && this.seq && this.seq.cur && !this.seq.cur.ended) return;
    this.current = name;
    if (!this.seq) { this.pending = { name, loop }; return; }
    this.seq.play(name, loop);
  }
  stopMusic(fade = 0.3) { this.current = null; this.pending = null; if (this.seq) this.seq.stop(fade); }

  // pause audio when the tab is hidden
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
}
