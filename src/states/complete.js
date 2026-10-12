import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class CompleteState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.p = p; const g = this.game; this.t = 0;
    this.menu = new Menu([
      { label: 'PLAY AGAIN', action: () => { g.run = g.newRun(); g.change('play', { level: p.level }); } },
      { label: 'TITLE', action: () => g.change('title') },
    ], { y: 164, gap: 15 });
  }
  update() { this.t++; if (this.t > 20) this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'LEVEL CLEAR!', W / 2, 20, '#ffd84a', 3, { align: 'center', shadow: '#000' });
    const b = this.p.bonus;
    const rows = [
      ['CLEAR BONUS', b.clear], ['SPEED BONUS (' + b.secs.toFixed(1) + 'S)', b.speed], ['NO DAMAGE BONUS', b.nodmg],
    ];
    rows.forEach(([n, v], i) => {
      if (this.t < 20 + i * 18) return;
      drawText(ctx, n, 28, 64 + i * 16, '#d8dcec');
      drawText(ctx, String(v), W - 28, 64 + i * 16, v ? '#ffd84a' : '#6b5a80', 1, { align: 'right' });
    });
    if (this.t > 80) {
      drawText(ctx, 'TOTAL SCORE', 28, 124, '#fff');
      drawText(ctx, String(this.p.score).padStart(7, '0'), W - 28, 124, '#ffd84a', 1, { align: 'right' });
      drawText(ctx, 'ENEMIES ' + this.p.kills + '   COINS ' + this.p.coins, W / 2, 142, '#9ad', 1, { align: 'center' });
    }
    this.menu.draw(ctx, this.game.frame);
  }
}
