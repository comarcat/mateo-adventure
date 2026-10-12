import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class PauseState {
  constructor(game) { this.game = game; this.transparent = true; }
  enter() {
    const g = this.game;
    this.below = g.stack[g.stack.length - 1];
    this.menu = new Menu([
      { label: 'RESUME', action: () => g.pop() },
      { label: 'RESTART LEVEL', action: () => { g.pop(); const id = this.below.levelId; g.run = g.newRun(); g.change('play', { level: id }); } },
      { label: 'CONTROLS', action: () => g.push('controls') },
      { label: 'FULLSCREEN', action: () => g.gfx.toggleFullscreen() },
      { label: 'QUIT TO TITLE', action: () => g.change('title') },
    ], { y: 84, gap: 15, onBack: () => g.pop() });
  }
  update() {
    if (this.game.input.pressed('pause')) { this.game.pop(); return; }
    this.menu.update(this.game);
  }
  draw(ctx) {
    ctx.fillStyle = 'rgba(11,6,20,0.7)'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'PAUSED', W / 2, 46, '#ffd84a', 3, { align: 'center', shadow: '#2a1b3d' });
    this.menu.draw(ctx, this.game.frame);
  }
}
