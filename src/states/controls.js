import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { keyLabel, REMAPPABLE, DEFAULT_BINDINGS } from '../engine/input.js';

const NAMES = { left: 'MOVE LEFT', right: 'MOVE RIGHT', up: 'UP / LOOK', down: 'DOWN / DROP', jump: 'JUMP', shoot: 'SHOOT', rush: 'RUSH', next: 'NEXT POWER', prev: 'PREV POWER', pause: 'PAUSE' };
const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'SELECT', 'START', 'L3', 'R3', 'D-UP', 'D-DOWN', 'D-LEFT', 'D-RIGHT'];

// Controls: shows and REMAPS keyboard keys and gamepad buttons. Up/down = pick action, left/right = keyboard or pad column,
// confirm = rebind (then press the new key/button), ESC = cancel. Bindings are saved with the settings.
export class ControlsState {
  constructor(game) { this.game = game; this.captureKeys = true; }
  enter() {
    this.row = 0; this.col = 0; this.wait = 0; this.armed = false; this.t = 0;
    this.rows = [...REMAPPABLE, 'RESET', 'BACK'];
  }
  bindings() { return this.game.input.bind; }
  save() { const g = this.game; g.save.settings.bindings = JSON.parse(JSON.stringify(g.input.bind)); g.save.flush(); }
  reset() { const g = this.game; g.input.setBindings(null); g.save.settings.bindings = null; g.save.flush(); g.toast('CONTROLS RESET'); }

  startCapture() {
    const inp = this.game.input, action = this.rows[this.row];
    this.wait = 1; this.armed = false;
    if (this.col === 0) {
      inp.capture((code) => {
        this.wait = 0;
        if (code === 'Escape') return;
        const kb = inp.bind.kb;
        for (const a of Object.keys(kb)) if (a !== action && REMAPPABLE.includes(a)) kb[a] = kb[a].filter((k) => k !== code);   // a key can only do one thing
        for (const a of REMAPPABLE) if (!kb[a].length) kb[a] = [DEFAULT_BINDINGS.kb[a][0] === code ? 'KeyZ' : DEFAULT_BINDINGS.kb[a][0]];
        kb[action] = [code, ...kb[action].filter((k) => k !== code)].slice(0, 2);
        this.save(); this.game.audio.sfx('select');
      });
    }
  }
  update() {
    this.t++;
    const inp = this.game.input;
    if (this.wait) {
      if (this.col === 1) {                                   // gamepad: wait for all buttons released, then the next press
        const b = inp.capturePad();
        if (b < 0) this.armed = true;
        else if (this.armed) {
          const pad = inp.bind.pad, action = this.rows[this.row];
          for (const a of Object.keys(pad)) if (a !== action && REMAPPABLE.includes(a)) pad[a] = pad[a].filter((x) => x !== b);
          for (const a of REMAPPABLE) if (!pad[a].length) pad[a] = [DEFAULT_BINDINGS.pad[a][0]];
          pad[action] = [b, ...pad[action].filter((x) => x !== b)].slice(0, 2);
          this.wait = 0; this.save(); this.game.audio.sfx('select');
        }
        if (inp.key('Escape')) this.wait = 0;
      }
      return;
    }
    if (inp.pressed('up')) { this.row = (this.row + this.rows.length - 1) % this.rows.length; this.game.audio.sfx('menu'); }
    if (inp.pressed('down')) { this.row = (this.row + 1) % this.rows.length; this.game.audio.sfx('menu'); }
    if (inp.pressed('left') || inp.pressed('right')) { this.col = 1 - this.col; this.game.audio.sfx('menu'); }
    if (inp.pressed('confirm')) {
      const r = this.rows[this.row];
      if (r === 'BACK') this.game.pop();
      else if (r === 'RESET') this.reset();
      else this.startCapture();
    } else if (inp.pressed('back')) this.game.pop();
  }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'CONTROLS', W / 2, 8, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    const b = this.bindings();
    drawText(ctx, 'KEYBOARD', 112, 28, this.col === 0 ? '#ffd84a' : '#6b5a80');
    drawText(ctx, 'GAMEPAD', 192, 28, this.col === 1 ? '#ffd84a' : '#6b5a80');
    this.rows.forEach((r, i) => {
      const y = 42 + i * 12, sel = i === this.row;
      if (sel) { ctx.fillStyle = 'rgba(255,216,74,0.12)'; ctx.fillRect(4, y - 2, W - 8, 11); }
      if (r === 'RESET' || r === 'BACK') { drawText(ctx, r === 'RESET' ? 'RESET TO DEFAULTS' : 'BACK', 14, y, sel ? '#ffd84a' : '#d8dcec'); return; }
      drawText(ctx, NAMES[r], 14, y, sel ? '#ffd84a' : '#ff9a2e');
      const waiting = this.wait && sel;
      const kbTxt = waiting && this.col === 0 ? 'PRESS A KEY...' : b.kb[r].map(keyLabel).join(' ');
      const padTxt = waiting && this.col === 1 ? 'PRESS BUTTON' : b.pad[r].map((x) => PAD_NAMES[x] || 'B' + x).join(' ');
      drawText(ctx, kbTxt, 112, y, sel && this.col === 0 ? '#fff' : '#9ad');
      drawText(ctx, padTxt, 192, y, sel && this.col === 1 ? '#fff' : '#9ad');
    });
    drawText(ctx, 'STICK / D-PAD MOVE.  ENTER/A + B/ESC FOR MENUS.', W / 2, 196, '#6b5a80', 1, { align: 'center' });
    drawText(ctx, 'ENTER = CHANGE   ESC = CANCEL / BACK', W / 2, 207, '#9ad', 1, { align: 'center' });
    if (this.game.input.padName) drawText(ctx, 'PAD: ' + this.game.input.padName.slice(0, 32), W / 2, 217, '#37d46a', 1, { align: 'center' });
  }
}
