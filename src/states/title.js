import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { makeBackground } from '../gfx/backgrounds.js';
import { THEMES } from '../gfx/themes.js';
import { MATEO, drawSprite } from '../gfx/sprites.js';
import { bakeTileset } from '../gfx/tiles.js';

let bg, ts;
export class TitleState {
  constructor(game) { this.game = game; }
  enter() {
    bg = bg || makeBackground(THEMES.grass); ts = ts || bakeTileset(THEMES.grass);
    this.t = 0;
    const g = this.game;
    g.audio.music('title');
    const items = [
      { label: 'START', action: () => g.change('modeselect') },
      { label: 'OPTIONS', action: () => g.push('options') },
      { label: 'CONTROLS', action: () => g.push('controls') },
      { label: 'FULLSCREEN', action: () => g.gfx.toggleFullscreen() },
    ];
    this.menu = new Menu(items, { y: 122, gap: 14 });
  }
  update() { this.t++; this.menu.update(this.game); }
  draw(ctx) {
    bg.draw(ctx, this.t * 0.6, this.t * 0.2);
    for (let x = 0; x < W; x += 16) { ctx.drawImage(ts.grass, x, H - 32); ctx.drawImage(ts.dirt, x, H - 16); }
    const bob = Math.round(Math.sin(this.t * 0.06) * 2);
    drawText(ctx, 'MATEO', W / 2, 26 + bob, '#ffd84a', 5, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'ADVENTURE', W / 2, 66 + bob, '#ff7a3a', 3, { align: 'center', shadow: '#2a1b3d' });
    const f = Math.floor(this.t / 8) % 4;
    drawSprite(ctx, MATEO.run[f], ((this.t * 1.2) % (W + 40)) - 20, H - 48, 1);
    this.menu.draw(ctx, this.t);
    drawText(ctx, 'CLASSIC CAMPAIGN - WORLD 1', W / 2, 100, '#fff', 1, { align: 'center', shadow: '#2a1b3d' });
    drawText(ctx, 'ARROWS + ENTER / GAMEPAD', W / 2, 212, '#2a1b3d', 1, { align: 'center' });
  }
}
