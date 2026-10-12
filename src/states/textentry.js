import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';

// Arcade-style text entry (initials, seeds). Up/down changes the letter, left/right moves the cursor, confirm advances
// and finishes on the last slot. Typing letters/digits on a keyboard also works; Backspace deletes.
export class TextEntryState {
  constructor(game) { this.game = game; this.captureKeys = true; }
  enter(p) {
    this.p = p; this.chars = [...p.charset]; this.len = p.length; this.t = 0;
    const init = (p.initial || '').toUpperCase().split('').filter((c) => this.chars.includes(c));
    this.text = Array.from({ length: this.len }, (_, i) => init[i] || this.chars[0]);
    this.pos = 0;
  }
  setAt(i, ch) { this.text[i] = ch; }
  finish() { this.p.onDone(this.text.join('')); }
  update() {
    this.t++;
    const inp = this.game.input; let typed = false;
    for (const code of inp.just) {
      let ch = null;
      if (/^Key[A-Z]$/.test(code)) ch = code[3]; else if (/^Digit\d$/.test(code)) ch = code[5];
      if (ch && this.chars.includes(ch)) { this.setAt(this.pos, ch); typed = true; if (this.pos < this.len - 1) this.pos++; }
      else if (code === 'Backspace') { typed = true; if (this.pos > 0) { this.pos--; } }
    }
    if (typed) return;                                        // letters like Z/X are also confirm/back keys: don't double-handle
    const i = this.chars.indexOf(this.text[this.pos]);
    if (inp.pressed('up')) { this.setAt(this.pos, this.chars[(i + 1) % this.chars.length]); this.game.audio.sfx('menu'); }
    if (inp.pressed('down')) { this.setAt(this.pos, this.chars[(i + this.chars.length - 1) % this.chars.length]); this.game.audio.sfx('menu'); }
    if (inp.pressed('right') && this.pos < this.len - 1) { this.pos++; this.game.audio.sfx('menu'); }
    if (inp.pressed('left') && this.pos > 0) { this.pos--; this.game.audio.sfx('menu'); }
    if (inp.pressed('confirm')) { this.game.audio.sfx('select'); if (this.pos < this.len - 1) this.pos++; else this.finish(); }
    else if (inp.pressed('back')) { if (this.pos > 0) this.pos--; else if (this.p.onCancel) this.p.onCancel(); }
  }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, this.p.title, W / 2, 40, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    if (this.p.subtitle) drawText(ctx, this.p.subtitle, W / 2, 66, '#fff', 2, { align: 'center', shadow: '#000' });
    const size = this.len > 4 ? 3 : 4, cw = 6 * size + 8, x0 = W / 2 - (this.len * cw) / 2 + 4;
    this.text.forEach((c, i) => {
      const x = x0 + i * cw, sel = i === this.pos;
      drawText(ctx, c, x, 108, sel ? '#ffd84a' : '#d8dcec', size, { shadow: '#000' });
      ctx.fillStyle = sel ? (this.t % 30 < 20 ? '#ffd84a' : '#8a6a10') : '#6b5a80'; ctx.fillRect(x - 2, 108 + 7 * size + 3, 6 * size, 3);
    });
    drawText(ctx, 'UP/DOWN LETTER   LEFT/RIGHT MOVE', W / 2, 168, '#9ad', 1, { align: 'center' });
    drawText(ctx, 'ENTER = OK   (YOU CAN TYPE TOO)', W / 2, 180, '#9ad', 1, { align: 'center' });
  }
}
