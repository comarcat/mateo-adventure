import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { Menu } from '../ui/menu.js';
import { levelIds } from '../levels/index.js';
import { POWERS } from '../data/powers.js';

// Debug / cheat menu. Only available with ?debug in the URL (or localStorage 'mateo.debug'='1'). Press F2 anywhere.
//   level select (every campaign level + test level + endless), invincibility, infinite rush, all powers, hitboxes, start lives.
export class DebugState {
  constructor(game) { this.game = game; this.transparent = true; this.captureKeys = false; }
  enter() {
    const g = this.game, c = g.cheats, ids = ['test', ...levelIds().filter((i) => i !== 'test')];
    this.ids = ids; this.sel = 1;
    const tog = (key, label) => ({ label: () => label + ' < ' + (c[key] ? 'ON' : 'OFF') + ' >', action: () => { c[key] = !c[key]; }, onLeft: () => { c[key] = !c[key]; }, onRight: () => { c[key] = !c[key]; } });
    const step = (d) => { this.sel = (this.sel + d + ids.length) % ids.length; };
    const lives = [0, 9, 99];
    this.menu = new Menu([
      { label: () => 'LEVEL  < ' + ids[this.sel] + ' >', action: () => this.launch(ids[this.sel]), onLeft: () => step(-1), onRight: () => step(1) },
      { label: 'PLAY ENDLESS (SEED DEBUG1)', action: () => { g.pop(); g.run = this.run(true); g.change('endless', { seed: 'DEBUG1' }); } },
      tog('invincible', 'INVINCIBLE'), tog('rush', 'INFINITE RUSH'), tog('powers', 'ALL POWERS'), tog('boxes', 'HITBOXES'),
      { label: () => 'START LIVES < ' + (c.lives || 3) + ' >', action: () => { c.lives = lives[(lives.indexOf(c.lives) + 1) % 3]; }, onLeft: () => { c.lives = lives[(lives.indexOf(c.lives) + 2) % 3]; }, onRight: () => { c.lives = lives[(lives.indexOf(c.lives) + 1) % 3]; } },
      { label: 'UNLOCK WHOLE CAMPAIGN', action: () => { for (const id of ids) if (id !== 'test') g.save.markCleared(id, 1000, 60); g.save.progress.powers = Object.keys(POWERS); g.save.progress.started = true; g.save.flush(); g.toast('ALL LEVELS CLEARED + POWERS'); } },
      { label: 'CLOSE', action: () => g.pop() },
    ], { y: 52, gap: 13, onBack: () => g.pop() });
  }
  run(endless) { const g = this.game, c = g.cheats; const r = g.newRun(); if (endless) r.endless = true; if (c.lives) r.lives = c.lives; return r; }
  launch(id) {
    const g = this.game; g.audio.duck(false); g.stack.length = 0;           // leave everything (debug menu + whatever was below)
    g.run = this.run(false);
    g.change('play', { level: id, campaign: false });
  }
  update() { this.menu.update(this.game); if (this.game.input.key('F2')) this.game.pop(); }
  draw(ctx) {
    ctx.fillStyle = 'rgba(11,6,20,0.88)'; ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'DEBUG MENU', W / 2, 16, '#ff7aff', 2, { align: 'center', shadow: '#000' });
    drawText(ctx, 'LEFT/RIGHT CHANGE  ENTER SELECT  F2 CLOSE', W / 2, 38, '#9ad', 1, { align: 'center' });
    this.menu.draw(ctx, this.game.frame);
  }
}
