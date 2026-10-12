import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class GameOverState {
  constructor(game) { this.game = game; }
  enter(p) {
    const g = this.game;
    this.menu = new Menu([
      { label: 'CONTINUE', action: () => { g.run = g.newRun(); g.change('play', { level: p.level }); } },
      { label: 'QUIT TO TITLE', action: () => g.change('title') },
    ], { y: 120, gap: 16 });
  }
  update() { this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#12081e'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'GAME OVER', W / 2, 50, '#ff4a5a', 4, { align: 'center', shadow: '#000' });
    this.menu.draw(ctx, this.game.frame);
  }
}
