// Vertical text menu navigated by keyboard or gamepad (up/down/confirm/back).
import { drawText } from '../engine/font.js';
import { W } from '../config.js';

export class Menu {
  constructor(items, opts = {}) {
    this.items = items; this.i = 0; this.y = opts.y ?? 120; this.gap = opts.gap ?? 14; this.scale = opts.scale ?? 1;
    this.onBack = opts.onBack || null;
  }
  update(game) {
    const inp = game.input;
    if (inp.pressed('up')) { this.i = (this.i + this.items.length - 1) % this.items.length; game.audio.sfx('menu'); }
    if (inp.pressed('down')) { this.i = (this.i + 1) % this.items.length; game.audio.sfx('menu'); }
    const it = this.items[this.i];
    if (it.onLeft && inp.pressed('left')) it.onLeft();
    if (it.onRight && inp.pressed('right')) it.onRight();
    if (inp.pressed('confirm')) { game.audio.sfx('select'); it.action && it.action(); }
    else if (inp.pressed('back') && this.onBack) this.onBack();
  }
  draw(ctx, t = 0) {
    this.items.forEach((it, idx) => {
      const sel = idx === this.i;
      const label = typeof it.label === 'function' ? it.label() : it.label;
      const y = this.y + idx * this.gap;
      drawText(ctx, label, W / 2, y, sel ? '#ffd84a' : '#d8dcec', this.scale, { align: 'center', shadow: '#2a1b3d' });
      if (sel) {
        const x = Math.round(Math.sin(t * 0.15) * 1.5);
        drawText(ctx, '>', W / 2 - (label.length * 3 * this.scale + 10) + x, y, '#ffd84a', this.scale, { shadow: '#2a1b3d' });
      }
    });
  }
}
