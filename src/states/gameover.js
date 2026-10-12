import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class GameOverState {
  constructor(game) { this.game = game; }
  enter(p) {
    const g = this.game;
    g.audio.music('gameover', false);
    this.menu = new Menu([
      { label: 'CONTINUE', action: () => { g.run = p.campaign ? g.campaignRun() : g.newRun(); g.change('play', { level: p.level, campaign: p.campaign }); } },
      { label: p.campaign ? 'QUIT TO MAP' : 'QUIT TO TITLE', action: () => g.change(p.campaign ? 'map' : 'title', {}) },
    ], { y: 120, gap: 16 });
  }
  update() { this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#12081e'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'GAME OVER', W / 2, 50, '#ff4a5a', 4, { align: 'center', shadow: '#000' });
    drawText(ctx, 'CONTINUE KEEPS YOUR PROGRESS (3 LIVES, SCORE RESETS)', W / 2, 92, '#9ad', 1, { align: 'center' });
    this.menu.draw(ctx, this.game.frame);
  }
}
