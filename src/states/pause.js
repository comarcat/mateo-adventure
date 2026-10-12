import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';

export class PauseState {
  constructor(game) { this.game = game; this.transparent = true; }
  exit() { this.game.audio.duck(false); }
  enter(p) {
    const g = this.game;
    g.audio.duck(true); g.audio.sfx('pause');
    this.below = g.stack[g.stack.length - 1];
    const camp = this.below.campaign || (p && p.fromMap);
    const all = [
      { label: 'RESUME', action: () => g.pop() },
      { label: 'RESTART LEVEL', action: () => {
        g.pop();
        if (this.below.endless) { const seed = this.below.seed; g.run = { lives: 3, score: 0, coins: 0, powers: [...g.save.progress.powers], campaign: false, endless: true }; g.change('endless', { seed }); return; }
        const id = this.below.levelId, camp = this.below.campaign; g.run = camp ? g.campaignRun() : g.newRun(); g.change('play', { level: id, campaign: camp });
      } },
      { label: 'OPTIONS', action: () => g.push('options') },
      { label: 'CONTROLS', action: () => g.push('controls') },
      { label: 'FULLSCREEN', action: () => g.gfx.toggleFullscreen() },
      { label: 'QUIT TO MAP', action: () => g.change('map', {}) },
      { label: 'QUIT TO TITLE', action: () => g.change('title') },
    ];
    const items = all.filter((it) => {
      if (p && p.fromMap) return ['RESUME', 'OPTIONS', 'CONTROLS', 'FULLSCREEN', 'QUIT TO TITLE'].includes(it.label);
      if (it.label === 'QUIT TO MAP') return !!this.below.campaign;
      if (it.label === 'RESTART LEVEL') return !!(this.below.levelId || this.below.endless);
      return true;
    });
    this.menu = new Menu(items, { y: 78, gap: 14, onBack: () => g.pop() });
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
