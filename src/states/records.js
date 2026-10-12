import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { MODES } from '../save/scores.js';

const fmtTime = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

// Top-10 tables for both modes. Left/right switches tab. Local scores can be edited by the player; see save/scores.js.
export class RecordsState {
  constructor(game) { this.game = game; }
  enter(p) {
    this.mode = p && p.mode ? p.mode : 'classic'; this.highlight = p && p.rank ? p.rank : 0; this.t = 0;
    this.data = {}; this.load();
  }
  load() { MODES.forEach((m) => this.game.scores.top(m, 10).then((l) => { this.data[m] = l; })); }
  update() {
    this.t++;
    const inp = this.game.input;
    if (inp.pressed('left') || inp.pressed('right') || inp.pressed('next') || inp.pressed('prev')) { this.mode = this.mode === 'classic' ? 'endless' : 'classic'; this.highlight = 0; this.game.audio.sfx('menu'); }
    if (inp.pressed('back') || inp.pressed('confirm')) { if (this.game.stack.length > 1) this.game.pop(); else this.game.change('modeselect'); }
  }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'RECORDS', W / 2, 10, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    MODES.forEach((m, i) => { const sel = m === this.mode; drawText(ctx, (sel ? '< ' : '  ') + (m === 'classic' ? 'CLASSIC' : 'ENDLESS') + (sel ? ' >' : '  '), 64 + i * 128, 32, sel ? '#ffd84a' : '#6b5a80', 1, { align: 'center' }); });
    const l = this.data[this.mode];
    const head = this.mode === 'classic' ? ['#', 'NAME', 'SCORE', 'WORLD', 'TIME'] : ['#', 'NAME', 'SCORE', 'DIST', 'SEED'];
    const xs = this.mode === 'classic' ? [14, 36, 110, 168, 214] : [14, 36, 100, 150, 196];
    head.forEach((h, i) => drawText(ctx, h, xs[i], 46, '#9ad'));
    for (let i = 0; i < 10; i++) {
      const y = 60 + i * 13, e = l && l[i], hl = this.highlight === i + 1 && this.t % 30 < 20;
      const col = hl ? '#fff' : (i < 3 ? '#ffd84a' : '#d8dcec');
      drawText(ctx, String(i + 1), xs[0], y, col);
      if (!e) { drawText(ctx, '---', xs[1], y, '#4a3a60'); continue; }
      drawText(ctx, e.name, xs[1], y, col);
      drawText(ctx, String(e.score).padStart(7, '0'), xs[2], y, col);
      if (this.mode === 'classic') { drawText(ctx, String(e.world || 1), xs[3] + 10, y, col); drawText(ctx, fmtTime(e.time || 0), xs[4], y, col); }
      else { drawText(ctx, (e.distance || 0) + 'M', xs[3], y, col); drawText(ctx, e.seed || '', xs[4], y, col); }
    }
    drawText(ctx, 'LOCAL SCORES ONLY - EDITABLE BY PLAYERS.', W / 2, 192, '#6b5a80', 1, { align: 'center' });
    drawText(ctx, 'A GLOBAL BOARD NEEDS SERVER CHECKS.', W / 2, 202, '#6b5a80', 1, { align: 'center' });
    drawText(ctx, 'LEFT/RIGHT = SWITCH    ESC = BACK', W / 2, 213, '#9ad', 1, { align: 'center' });
  }
}
