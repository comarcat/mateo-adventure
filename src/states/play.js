import { Level } from '../game/level.js';
import { getLevel } from '../levels/index.js';
import { drawHUD } from '../ui/hud.js';
import { POWERS } from '../data/powers.js';

export class PlayState {
  constructor(game) { this.game = game; this.pausable = true; }
  enter(p) {
    this.levelId = p.level; this.campaign = !!p.campaign;
    this.level = new Level(this.game, getLevel(this.levelId), this.game.run);
    this.game.audio.music(this.level.data.music || 'world-grass');
  }
  update() {
    const g = this.game, lv = this.level, inp = g.input;
    if (inp.pressed('pause')) { g.push('pause'); return; }
    if (g.debug) this.debugKeys(inp, lv);
    lv.update();
    if (lv.status === 'clear' && lv.clearT > 150) this.finish(lv);
    else if (lv.status === 'gameover') {
      if (this.campaign) { const p = g.save.progress; p.lives = 3; p.score = 0; g.save.flush(); }
      g.change('gameover', { level: this.levelId, campaign: this.campaign });
    }
  }
  finish(lv) {
    const g = this.game, b = lv.bonuses();
    g.run.score += b.total;
    const p = { level: this.levelId, bonus: b, score: g.run.score, kills: lv.kills, coins: g.run.coins, campaign: this.campaign, newPower: lv.newPower, boss: !!lv.data.boss };
    if (this.campaign) {
      g.save.progress.time = (g.save.progress.time || 0) + b.secs;
      g.save.markCleared(this.levelId, lv.levelScore + b.total, b.secs);
      g.persistRun();
    }
    g.change('complete', p);
  }
  debugKeys(inp, lv) {
    if (inp.key('KeyI')) { lv.cheatInvincible = !lv.cheatInvincible; this.game.toast('INVINCIBLE ' + (lv.cheatInvincible ? 'ON' : 'OFF')); }
    if (inp.key('KeyR')) { lv.cheatInfiniteRush = !lv.cheatInfiniteRush; this.game.toast('INFINITE RUSH ' + (lv.cheatInfiniteRush ? 'ON' : 'OFF')); }
    if (inp.key('KeyB')) lv.showBoxes = !lv.showBoxes;
    const ids = Object.keys(POWERS);
    for (let i = 0; i < 8; i++) if (inp.key('Digit' + (i + 1))) { const id = ids[i]; const on = lv.hero.powers.has(id); on ? lv.hero.powers.delete(id) : lv.hero.powers.add(id); this.game.toast(POWERS[id].name + (on ? ' OFF' : ' ON')); }
    if (inp.key('KeyP')) { for (const id of ids) lv.hero.powers.add(id); lv.hero.ammo = 99; lv.hero.charges = 20; this.game.toast('ALL POWERS + AMMO'); }
    if (inp.key('KeyL') && lv.goal && lv.status === 'play') { lv.hero.x = lv.goal.x - 40; lv.hero.y = lv.goal.y; lv.hero.vy = 0; }
  }
  draw(ctx) {
    this.level.draw(ctx);
    drawHUD(ctx, this.level);
  }
}
