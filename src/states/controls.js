import { W } from '../config.js';
import { drawText } from '../engine/font.js';
import { keyLabel } from '../engine/input.js';

const ROWS = [
  ['MOVE', 'left', 'ARROWS / WASD  /  D-PAD, STICK'],
  ['JUMP', 'jump', 'Z / SPACE  /  A'],
  ['RUSH', 'rush', 'C / SHIFT  /  B, RT'],
  ['SHOOT', 'shoot', 'X  /  X, LT'],
  ['POWER', 'next', 'Q / E  /  LB, RB'],
  ['PAUSE', 'pause', 'ESC / P / ENTER  /  START'],
  ['FULLSCREEN', null, 'F'],
];
export class ControlsState {
  constructor(game) { this.game = game; this.transparent = false; }
  enter() {}
  update() { if (this.game.input.pressed('back') || this.game.input.pressed('confirm')) this.game.pop(); }
  draw(ctx) {
    ctx.fillStyle = '#1b1030'; ctx.fillRect(0, 0, 256, 224);
    drawText(ctx, 'CONTROLS', W / 2, 16, '#ffd84a', 2, { align: 'center', shadow: '#000' });
    ROWS.forEach(([name, , keys], i) => {
      drawText(ctx, name, 16, 52 + i * 18, '#ff9a2e');
      drawText(ctx, keys, 16, 62 + i * 18, '#d8dcec');
    });
    drawText(ctx, 'HOLD JUMP = HIGHER.  DOWN+JUMP = DROP', W / 2, 184, '#9ad', 1, { align: 'center' });
    drawText(ctx, 'PRESS ENTER / B TO GO BACK', W / 2, 206, '#fff', 1, { align: 'center' });
  }
}
