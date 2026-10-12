import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { POWERS } from '../data/powers.js';
import { parseLevelId } from '../data/worlds.js';

export class CompleteState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.p = p; const g = this.game; this.t = 0;
    const items = p.campaign
      ? [{ label: 'CONTINUE', action: () => { const { world, index } = parseLevelId(p.level); if (p.level === '8-4') g.change('victory', { score: g.run.score, coins: g.run.coins, powers: [...g.run.powers], time: g.campaignTime() }); else g.change('map', { world, node: index, advance: true }); } }]
      : [{ label: 'PLAY AGAIN', action: () => { g.run = g.newRun(); g.change('play', { level: p.level }); } }, { label: 'TITLE', action: () => g.change('title') }];
    this.menu = new Menu(items, { y: 184, gap: 15 });
    g.audio.music('victory', false);
  }
  update() { this.t++; if (this.t > 20) this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, this.p.boss ? 'BOSS DEFEATED!' : 'LEVEL CLEAR!', W / 2, 16, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    const b = this.p.bonus;
    const rows = [['CLEAR BONUS', b.clear], ['SPEED BONUS (' + b.secs.toFixed(1) + 'S)', b.speed], ['NO DAMAGE BONUS', b.nodmg]];
    rows.forEach(([n, v], i) => {
      if (this.t < 20 + i * 18) return;
      drawText(ctx, n, 28, 46 + i * 14, '#d8dcec');
      drawText(ctx, String(v), W - 28, 46 + i * 14, v ? '#ffd84a' : '#6b5a80', 1, { align: 'right' });
    });
    if (this.t > 80) {
      drawText(ctx, 'TOTAL SCORE', 28, 96, '#fff');
      drawText(ctx, String(this.p.score).padStart(7, '0'), W - 28, 96, '#ffd84a', 1, { align: 'right' });
      drawText(ctx, 'ENEMIES ' + this.p.kills + '   COINS ' + this.p.coins, W / 2, 112, '#9ad', 1, { align: 'center' });
    }
    if (this.p.newPower && this.t > 110) {
      const pw = POWERS[this.p.newPower], pulse = Math.floor(this.t / 6) % 2;
      ctx.fillStyle = '#2a1b3d'; ctx.fillRect(24, 122, W - 48, 50);
      ctx.strokeStyle = pulse ? '#e0b8ff' : '#b06aff'; ctx.lineWidth = 2; ctx.strokeRect(25, 123, W - 50, 48);
      drawText(ctx, 'NEW POWER!', W / 2, 128, '#e0b8ff', 1, { align: 'center' });
      drawText(ctx, pw.name, W / 2, 140, '#fff', 2, { align: 'center', shadow: '#000' });
      drawText(ctx, pw.hint, W / 2, 158, '#9ad', 1, { align: 'center' });
    }
    this.menu.draw(ctx, this.game.frame);
  }
}
