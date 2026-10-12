import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class CompleteState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.p = p; const g = this.game;
    this.menu = new Menu([
      { label: 'PLAY AGAIN', action: () => { g.run = g.newRun(); g.change('play', { level: p.level }); } },
      { label: 'TITLE', action: () => g.change('title') },
    ], { y: 150, gap: 15 });
  }
  update() { this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'LEVEL CLEAR!', W / 2, 36, '#ffd84a', 3, { align: 'center', shadow: '#000' });
    const secs = (this.p.frames / 60).toFixed(1);
    drawText(ctx, 'TIME  ' + secs + 'S', W / 2, 84, '#fff', 1, { align: 'center' });
    drawText(ctx, 'HEALTH  ' + this.p.hp + '/6', W / 2, 100, '#fff', 1, { align: 'center' });
    drawText(ctx, 'MORE LEVELS COME IN LATER STAGES', W / 2, 124, '#9ad', 1, { align: 'center' });
    this.menu.draw(ctx, this.game.frame);
  }
}
