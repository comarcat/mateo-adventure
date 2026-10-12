// Game: owns shared services and a stack-based state machine.
//   change(name) replaces the whole stack; push(name) overlays (pause); pop() returns.
import { DEBUG } from '../config.js';
import { Input } from '../engine/input.js';
import { Gfx } from '../engine/gfx.js';
import { Audio } from '../audio/audio.js';
import { save } from '../save/save.js';
import { DIFFICULTY } from '../data/difficulty.js';

export class Game {
  constructor(canvas, container) {
    this.gfx = new Gfx(canvas, container);
    this.ctx = this.gfx.ctx;
    this.save = save;
    this.input = new Input(save.settings.bindings);
    this.audio = new Audio(save.settings, () => save.flush());
    this.debug = DEBUG;
    this.registry = {}; this.stack = [];
    this.run = this.newRun();
    this.frame = 0;
    this.toastEl = document.getElementById('toast'); this.toastT = 0;
    this.input.onToast = (m) => this.toast(m);
  }
  get difficulty() { return DIFFICULTY[this.save.settings.difficulty] || DIFFICULTY.normal; }
  newRun() { return { lives: 3, score: 0, coins: 0, powers: [], campaign: false }; }
  // Campaign run state mirrors the saved progress; persistRun() writes it back.
  campaignRun() { const p = this.save.progress; return { lives: p.lives, score: p.score, coins: p.coins, powers: [...p.powers], campaign: true }; }
  persistRun() {
    const p = this.save.progress, r = this.run;
    p.lives = r.lives; p.score = r.score; p.coins = r.coins; p.powers = [...new Set(r.powers)]; this.save.flush();
  }

  register(name, State) { this.registry[name] = State; }
  get top() { return this.stack[this.stack.length - 1]; }
  _make(name, params) { const s = new this.registry[name](this); s.name = name; s.enter(params || {}); return s; }
  change(name, params) {
    while (this.stack.length) { const s = this.stack.pop(); s.exit && s.exit(); }
    this.stack.push(this._make(name, params));
  }
  push(name, params) { this.stack.push(this._make(name, params)); }
  pop() { const s = this.stack.pop(); s && s.exit && s.exit(); }

  update() {
    this.frame++;
    this.input.poll();
    if (this.input.key('KeyF') && this.top && !this.top.captureKeys) this.gfx.toggleFullscreen();
    if (this.input.pressed('confirm') || this.input.pressed('jump')) this.audio.unlock();   // gamepad presses count as a gesture in most browsers
    if (this.input.key('KeyM')) this.toast(this.audio.toggleMute() ? 'SOUND MUTED' : 'SOUND ON');
    if (this.top) this.top.update();
    if (this.toastT > 0 && --this.toastT === 0) this.toastEl.style.display = 'none';
  }
  draw() {
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].transparent) start--;
    for (let i = Math.max(0, start); i < this.stack.length; i++) this.stack[i].draw(this.ctx);
  }
  // Pause when the tab/window loses focus.
  autoPause() { if (this.top && this.top.pausable) this.push('pause'); }

  toast(msg) { this.toastEl.textContent = msg; this.toastEl.style.display = 'block'; this.toastT = 180; }
}
