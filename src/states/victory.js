import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { POWERS } from '../data/powers.js';
import { MATEO, drawSprite } from '../gfx/sprites.js';
import { RNG } from '../engine/rng.js';

// Shown after the Dark King falls. Stage 6 adds the arcade name entry + records submission here.
export class VictoryState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.p = p; this.t = 0; const g = this.game;
    this.stars = Array.from({ length: 40 }, (_, i) => { const r = new RNG(i * 17 + 3); return { x: r.int(0, W), y: r.int(0, H), s: r.int(1, 3), c: r.pick(['#fff', '#ffd84a', '#7af0ff', '#ff9aa2']) }; });
    g.audio.music('victory', false);
    this.menu = new Menu([{ label: 'CONTINUE', action: () => g.submitScore('classic', { score: p.score, world: 8, time: p.time }, (rank) => g.change('records', { mode: 'classic', rank })) }], { y: 196, gap: 14 });
  }
  update() { this.t++; if (this.t > 60) this.menu.update(this.game); }
  draw(ctx) {
    ctx.fillStyle = '#0a0620'; ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) { if ((this.t + s.x) % 40 < 30) { ctx.fillStyle = s.c; ctx.fillRect((s.x + this.t * 0.1 * s.s) % W, s.y, s.s, s.s); } }
    const bob = Math.round(Math.sin(this.t * 0.08) * 3);
    drawText(ctx, 'VICTORY!', W / 2, 18 + bob, '#ffd84a', 4, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'THE DARK KING IS DEFEATED', W / 2, 56, '#fff', 1, { align: 'center' });
    drawText(ctx, 'MATEO SAVED THE LAND!', W / 2, 68, '#ff9a2e', 1, { align: 'center' });
    drawSprite(ctx, MATEO.run[Math.floor(this.t / 6) % 4], W / 2 - 11 + Math.sin(this.t * 0.05) * 60, 102 - MATEO.stand.h, Math.cos(this.t * 0.05) > 0 ? 1 : -1);
    drawText(ctx, 'FINAL SCORE', W / 2, 114, '#d8dcec', 1, { align: 'center' });
    drawText(ctx, String(this.p.score).padStart(7, '0'), W / 2, 126, '#ffd84a', 2, { align: 'center', shadow: '#2a1b3d' });
    const n = Object.keys(POWERS).filter((k) => this.p.powers.includes(k)).length;
    drawText(ctx, 'POWERS EARNED ' + n + '/8   COINS ' + this.p.coins, W / 2, 150, '#9ad', 1, { align: 'center' });
    drawText(ctx, 'TIME ' + Math.floor(this.p.time / 60) + ':' + String(Math.floor(this.p.time % 60)).padStart(2, '0'), W / 2, 164, '#9ad', 1, { align: 'center' });
    this.menu.draw(ctx, this.game.frame);
  }
}
