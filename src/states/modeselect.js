import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { makeBackground } from '../gfx/backgrounds.js';
import { THEMES } from '../gfx/themes.js';

let bg;
export class ModeSelectState {
  constructor(game) { this.game = game; }
  enter() {
    bg = bg || makeBackground(THEMES.grass); this.t = 0; this.confirmNew = false;
    const g = this.game, sv = g.save;
    const items = [];
    if (sv.hasCampaign) items.push({ label: 'CONTINUE CAMPAIGN', action: () => g.change('map', {}) });
    items.push({
      label: () => (sv.hasCampaign ? (this.confirmNew ? 'ERASE AND START? PRESS AGAIN' : 'NEW CAMPAIGN') : 'START CLASSIC CAMPAIGN'),
      action: () => {
        if (sv.hasCampaign && !this.confirmNew) { this.confirmNew = true; return; }
        sv.newCampaign(); g.change('map', { world: 1, node: 0 });
      },
    });
    items.push({ label: 'ENDLESS BATTLE', action: () => g.toast('ENDLESS MODE ARRIVES IN STAGE 6') });
    items.push({ label: 'RECORDS', action: () => g.toast('RECORDS ARRIVE IN STAGE 6') });
    if (g.debug) items.push({ label: 'DEBUG: TEST LEVEL', action: () => { g.run = g.newRun(); g.change('play', { level: 'test' }); } });
    items.push({ label: 'BACK', action: () => g.change('title') });
    this.menu = new Menu(items, { y: 78, gap: 16, onBack: () => g.change('title') });
  }
  update() { this.t++; const was = this.menu.i; this.menu.update(this.game); if (this.menu.i !== was) this.confirmNew = false; }
  draw(ctx) {
    bg.draw(ctx, this.t * 0.6, this.t * 0.2);
    ctx.fillStyle = 'rgba(42,27,61,0.55)'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'SELECT MODE', W / 2, 30, '#ffd84a', 2, { align: 'center', shadow: '#2a1b3d' });
    this.menu.draw(ctx, this.t);
  }
}
