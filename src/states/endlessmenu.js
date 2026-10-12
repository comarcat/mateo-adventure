import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { makeBackground } from '../gfx/backgrounds.js';
import { THEMES } from '../gfx/themes.js';

const SEED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const randomSeed = () => Array.from({ length: 6 }, () => SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)]).join('');

export class EndlessMenuState {
  constructor(game) { this.game = game; }
  enter() {
    const g = this.game; this.t = 0;
    this.bg = makeBackground(THEMES.castle);
    if (!g.endlessSeed) g.endlessSeed = randomSeed();
    this.menu = new Menu([
      { label: 'START RANDOM RUN', action: () => { g.endlessSeed = randomSeed(); this.start(g.endlessSeed); } },
      { label: () => 'RUN SEED ' + g.endlessSeed, action: () => this.start(g.endlessSeed) },
      { label: 'ENTER A SEED', action: () => g.push('textentry', { title: 'ENTER SEED', subtitle: '', length: 6, charset: SEED_CHARS, initial: g.endlessSeed, onDone: (s) => { g.endlessSeed = s; g.pop(); }, onCancel: () => g.pop() }) },
      { label: 'BACK', action: () => g.change('modeselect') },
    ], { y: 104, gap: 15, onBack: () => g.change('modeselect') });
  }
  start(seed) { const g = this.game; g.run = { lives: 3, score: 0, coins: 0, powers: [...g.save.progress.powers], campaign: false, endless: true }; g.change('endless', { seed }); }
  update() { this.t++; this.menu.update(this.game); }
  draw(ctx) {
    this.bg.draw(ctx, this.t * 0.8, this.t * 0.2);
    ctx.fillStyle = 'rgba(42,27,61,0.6)'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'ENDLESS BATTLE', W / 2, 18, '#ff7a3a', 2, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'RUN AS FAR AS YOU CAN!', W / 2, 44, '#fff', 1, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'A STORM CHASES YOU. BEAT THE WAVES,', W / 2, 58, '#c8a0ff', 1, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'MINI-BOSSES, AND A BOSS EVERY 4TH ZONE.', W / 2, 69, '#c8a0ff', 1, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'SAME SEED = SAME WORLD.', W / 2, 80, '#c8a0ff', 1, { align: 'center', shadow: '#2a1b3d' });
    this.menu.draw(ctx, this.t);
    drawText(ctx, 'YOUR CAMPAIGN POWERS CARRY OVER', W / 2, 194, '#9ad', 1, { align: 'center', shadow: '#2a1b3d' });
  }
}
