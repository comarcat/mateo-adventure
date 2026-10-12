import { Level } from '../game/level.js';
import { getLevel } from '../levels/index.js';
import { drawHUD } from '../ui/hud.js';

export class PlayState {
  constructor(game) { this.game = game; this.pausable = true; }
  enter(p) {
    this.levelId = p.level;
    this.level = new Level(this.game, getLevel(this.levelId), this.game.run);
    this.game.audio.music && this.game.audio.music('level');
  }
  update() {
    const g = this.game, lv = this.level, inp = g.input;
    if (inp.pressed('pause')) { g.push('pause'); return; }
    if (g.debug) this.debugKeys(inp, lv);
    lv.update();
    if (lv.status === 'clear' && lv.clearT > 150) g.change('complete', { level: this.levelId, frames: lv.frames, hp: lv.hero.hp });
    else if (lv.status === 'gameover') g.change('gameover', { level: this.levelId });
  }
  debugKeys(inp, lv) {
    if (inp.key('KeyI')) { lv.cheatInvincible = !lv.cheatInvincible; this.game.toast('INVINCIBLE ' + (lv.cheatInvincible ? 'ON' : 'OFF')); }
    if (inp.key('KeyR')) { lv.cheatInfiniteRush = !lv.cheatInfiniteRush; this.game.toast('INFINITE RUSH ' + (lv.cheatInfiniteRush ? 'ON' : 'OFF')); }
    if (inp.key('KeyB')) lv.showBoxes = !lv.showBoxes;
    if (inp.key('KeyL') && lv.goal && lv.status === 'play') { lv.hero.x = lv.goal.x - 40; lv.hero.y = lv.goal.y; lv.hero.vy = 0; }
  }
  draw(ctx) {
    this.level.draw(ctx);
    drawHUD(ctx, this.level);
  }
}
