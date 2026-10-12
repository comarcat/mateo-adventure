import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { DIFFICULTY_ORDER } from '../data/difficulty.js';

export class OptionsState {
  constructor(game) { this.game = game; this.ret = 'title'; }
  enter() {
    const g = this.game, st = g.save.settings; this.erase = false;
    const cycle = (d) => { const i = DIFFICULTY_ORDER.indexOf(st.difficulty); st.difficulty = DIFFICULTY_ORDER[(i + d + 3) % 3]; g.save.flush(); };
    this.items = [
      { label: () => 'DIFFICULTY  < ' + g.difficulty.label + ' >', action: () => cycle(1), onLeft: () => cycle(-1), onRight: () => cycle(1) },
      { label: 'CONTROLS', action: () => g.push('controls') },
      { label: () => (this.erase ? 'REALLY ERASE? PRESS AGAIN' : 'ERASE SAVE DATA'), action: () => { if (!this.erase) { this.erase = true; return; } g.save.reset(); g.input.setBindings(null); g.toast('SAVE ERASED'); this.erase = false; } },
      { label: 'BACK', action: () => g.pop() },
    ];
    this.menu = new Menu(this.items, { y: 70, gap: 16, onBack: () => g.pop() });
  }
  update() { const was = this.menu.i; this.menu.update(this.game); if (this.menu.i !== was) this.erase = false; }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'OPTIONS', W / 2, 24, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    this.menu.draw(ctx, this.game.frame);
    const d = this.game.difficulty;
    drawText(ctx, d.maxHp + ' HEARTS  ENEMY SPEED X' + d.enemySpeed, W / 2, 168, '#9ad', 1, { align: 'center' });
  }
}
