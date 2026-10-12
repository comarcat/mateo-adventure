import { EndlessLevel, drawEndlessHUD } from '../game/endless.js';
import { drawHUD } from '../ui/hud.js';
import { POWERS } from '../data/powers.js';

export class EndlessState {
  constructor(game) { this.game = game; this.pausable = true; this.endless = true; }
  enter(p) {
    this.seed = p.seed; const g = this.game;
    this.level = new EndlessLevel(g, g.run, { seed: p.seed });
    g.audio.music('endless');
  }
  get levelId() { return 'endless'; }
  update() {
    const g = this.game, lv = this.level, inp = g.input;
    if (inp.pressed('pause')) { g.push('pause'); return; }
    if (g.debug) {
      if (inp.key('KeyI')) { lv.cheatInvincible = !lv.cheatInvincible; g.toast('INVINCIBLE ' + (lv.cheatInvincible ? 'ON' : 'OFF')); }
      if (inp.key('KeyP')) { for (const id of Object.keys(POWERS)) lv.hero.powers.add(id); lv.hero.ammo = 99; g.toast('ALL POWERS'); }
      if (inp.key('KeyB')) lv.showBoxes = !lv.showBoxes;
    }
    lv.update();
    if (lv.status === 'gameover') {
      g.change('endlessresult', { seed: this.seed, score: g.run.score, distance: Math.floor(lv.dist), zone: lv.zone + 1, bosses: lv.bossCount, time: lv.frames / 60, kills: lv.kills, coins: g.run.coins });
    }
  }
  draw(ctx) { this.level.draw(ctx); drawHUD(ctx, this.level); drawEndlessHUD(ctx, this.level); }
}
