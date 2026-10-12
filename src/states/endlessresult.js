import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { randomSeed } from './endlessmenu.js';

const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

export class EndlessResultState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.p = p; this.t = 0; this.rank = null; const g = this.game;
    g.audio.music('gameover', false);
    this.menu = new Menu([
      { label: 'RETRY SAME SEED', action: () => this.again(p.seed) },
      { label: 'NEW RANDOM SEED', action: () => this.again(g.endlessSeed = randomSeed()) },
      { label: 'RECORDS', action: () => g.change('records', { mode: 'endless', rank: this.rank || 0 }) },
      { label: 'MENU', action: () => g.change('modeselect') },
    ], { y: 138, gap: 14 });
    g.submitScore('endless', { score: p.score, distance: p.distance, seed: p.seed }, (rank) => { this.rank = rank; });
  }
  again(seed) { const g = this.game; g.run = { lives: 3, score: 0, coins: 0, powers: [...g.save.progress.powers], campaign: false, endless: true }; g.change('endless', { seed }); }
  update() { this.t++; if (this.t > 30) this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#12081e'; ctx.fillRect(0, 0, W, H);
    const p = this.p;
    drawText(ctx, 'RUN OVER', W / 2, 12, '#ff4a5a', 3, { align: 'center', shadow: '#000' });
    const rows = [['SCORE', String(p.score).padStart(7, '0')], ['DISTANCE', p.distance + ' M'], ['ZONE REACHED', String(p.zone)], ['BOSSES BEATEN', String(p.bosses)], ['TIME', fmtTime(p.time)], ['SEED', p.seed]];
    rows.forEach(([n, v], i) => { drawText(ctx, n, 40, 44 + i * 13, '#d8dcec'); drawText(ctx, v, W - 40, 44 + i * 13, i === 0 ? '#ffd84a' : '#fff', 1, { align: 'right' }); });
    if (this.rank) drawText(ctx, 'RANK #' + this.rank + ' ON THE BOARD!', W / 2, 124, '#37d46a', 1, { align: 'center' });
    this.menu.draw(ctx, this.game.frame);
  }
}
