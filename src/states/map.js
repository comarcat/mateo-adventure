// SNES-style overworld: the hero walks along paths between level nodes. Cleared levels turn green.
import { W, H } from '../config.js';
import { drawText } from '../engine/font.js';
import { WORLDS, mapLayout, levelId, levelInfo } from '../data/worlds.js';
import { POWERS } from '../data/powers.js';
import { mapBackground, nodeIcon } from '../gfx/mapart.js';
import { MATEO, drawSprite } from '../gfx/sprites.js';
import { COIN_ICON } from '../gfx/art.js';
import { hasLevel } from '../levels/index.js';

const SH = '#2a1b3d';
const label = (ctx, t, x, y, c = '#fff', o = {}) => drawText(ctx, t, x, y, c, 1, { shadow: SH, ...o });

export class MapState {
  constructor(game) { this.game = game; }
  enter(p) {
    const g = this.game, pr = g.save.progress;
    this.world = p.world || pr.world || 1;
    this.node = p.node !== undefined ? p.node : (pr.node || 0);
    this.moving = null; this.t = 0; this.banner = 0;
    this.setWorld(this.world, this.node);
    if (p.advance && this.node < 3) this.startMove(this.node, this.node + 1);
    else if (p.advance && this.node === 3) this.banner = 200;
    g.audio.music('map');
  }
  setWorld(w, node) {
    this.world = w; this.node = node;
    this.info = WORLDS[w]; this.layout = mapLayout(w); this.bg = mapBackground(w, this.info.theme);
    this.pos = { ...this.layout.nodes[node] };
    this.game.save.progress.world = w; this.game.save.progress.node = node;
  }
  id(i) { return levelId(this.world, i); }
  cleared(i) { return this.game.save.isCleared(this.id(i)); }
  unlocked(i) {
    if (i === 0) return this.world === 1 || this.game.save.isCleared(levelId(this.world - 1, 3));
    return this.cleared(i - 1);
  }
  worldUnlocked(w) { return w === 1 || this.game.save.isCleared(levelId(w - 1, 3)); }

  startMove(a, b) {
    let pts;
    if (b > a) pts = this.layout.paths[a].map((p) => ({ ...p }));
    else pts = this.layout.paths[b].map((p) => ({ ...p })).reverse();
    this.moving = { pts, seg: 0, from: a, to: b };
    this.game.audio.sfx('menu');
  }
  gotoWorld(w, node) {
    if (w < 1 || w > 8 || !this.worldUnlocked(w)) { this.game.toast(w > 8 ? 'THAT IS THE LAST WORLD' : 'CLEAR THE BOSS TO UNLOCK'); return; }
    this.setWorld(w, node); this.game.audio.sfx('select'); this.banner = 90;
  }

  update() {
    this.t++; if (this.banner > 0) this.banner--;
    const g = this.game, inp = g.input;
    if (this.moving) {
      const m = this.moving; let step = 1.8;
      while (step > 0 && m.seg < m.pts.length - 1) {
        const a = m.pts[m.seg], b = m.pts[m.seg + 1], d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const px = this.pos.x, py = this.pos.y, left = Math.hypot(b.x - px, b.y - py);
        if (left <= step) { this.pos = { x: b.x, y: b.y }; step -= left; m.seg++; }
        else { this.pos = { x: px + (b.x - px) / left * step, y: py + (b.y - py) / left * step }; step = 0; }
      }
      if (m.seg >= m.pts.length - 1) { this.node = m.to; this.moving = null; g.save.progress.node = this.node; g.save.flush(); }
      return;
    }
    if (inp.pressed('right') || inp.pressed('down')) {
      if (this.node < 3) { if (this.unlocked(this.node + 1)) this.startMove(this.node, this.node + 1); else g.toast('CLEAR THIS LEVEL FIRST'); }
      else this.gotoWorld(this.world + 1, 0);
    } else if (inp.pressed('left') || inp.pressed('up')) {
      if (this.node > 0) this.startMove(this.node, this.node - 1);
      else if (this.world > 1) this.gotoWorld(this.world - 1, 3);
    } else if (inp.pressed('next')) this.gotoWorld(this.world + 1, 0);
    else if (inp.pressed('prev')) this.gotoWorld(this.world - 1, 0);
    else if (inp.pressed('confirm') || inp.pressed('jump')) {
      const id = this.id(this.node);
      if (!this.unlocked(this.node)) g.toast('LOCKED');
      else if (!hasLevel(id)) g.toast('THIS LEVEL ARRIVES IN A LATER STAGE');
      else { g.save.progress.node = this.node; g.save.flush(); g.run = g.campaignRun(); g.change('play', { level: id, campaign: true }); }
    } else if (inp.pressed('back')) g.change('modeselect');
    else if (inp.pressed('pause')) g.push('pause', { fromMap: true });
  }

  draw(ctx) {
    ctx.drawImage(this.bg, 0, 0);
    // nodes
    this.layout.nodes.forEach((n, i) => {
      const boss = i === 3, cl = this.cleared(i), lk = !this.unlocked(i);
      const kind = boss ? (cl ? 'bossDone' : (lk ? 'bossLocked' : 'boss')) : (cl ? 'cleared' : (lk ? 'locked' : 'open'));
      const bob = (!cl && !lk && i === this.node && !this.moving) ? Math.round(Math.sin(this.t * 0.15)) : 0;
      ctx.drawImage(nodeIcon(kind), n.x - 9, n.y - 9 + bob);
      if (!boss) label(ctx, String(i + 1), n.x, n.y + 11, '#fff', { align: 'center' });
    });
    // hero
    const f = this.moving ? MATEO.run[Math.floor(this.t / 6) % 4] : MATEO.stand;
    const dir = this.moving && this.moving.pts[Math.min(this.moving.seg + 1, this.moving.pts.length - 1)].x < this.pos.x ? -1 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(this.pos.x) - 5, Math.round(this.pos.y) + 4, 10, 3);
    drawSprite(ctx, f, this.pos.x - f.w / 2, this.pos.y + 1 - f.h + (this.moving ? 0 : Math.round(Math.sin(this.t * 0.1) * 0.6)), dir);
    this.drawHud(ctx);
  }

  drawHud(ctx) {
    const g = this.game, run = g.run.campaign ? g.run : g.campaignRun();
    ctx.fillStyle = 'rgba(42,27,61,0.88)'; ctx.fillRect(0, 0, W, 24); ctx.fillRect(0, H - 30, W, 30);
    label(ctx, 'WORLD ' + this.world + ' - ' + this.info.name, 6, 4, '#ffd84a');
    label(ctx, String(run.score).padStart(7, '0'), W - 6, 4, '#ffd84a', { align: 'right' });
    label(ctx, 'LIVES X' + run.lives, 6, 14, '#fff');
    ctx.drawImage(COIN_ICON, W - 50, 12); label(ctx, 'X' + String(run.coins).padStart(2, '0'), W - 6, 14, '#fff', { align: 'right' });
    const i = this.node, id = this.id(i), info = levelInfo(id);
    const best = g.save.progress.cleared[id];
    label(ctx, id + '  ' + info.name, 6, H - 26, this.unlocked(i) ? '#fff' : '#8a8aa0');
    label(ctx, !this.unlocked(i) ? 'LOCKED' : (best ? 'BEST ' + best.score + '  ' + best.time.toFixed(0) + 'S' : (info.boss ? 'BOSS: ' + this.info.bossName : 'NEW!')), 6, H - 15, best ? '#37d46a' : '#9ad');
    // earned powers
    const owned = run.powers; let x = W - 6;
    owned.slice().reverse().forEach((pid) => { label(ctx, POWERS[pid].name, x, H - 26, '#e0b8ff', { align: 'right' }); x -= 0; });
    if (!owned.length) label(ctx, 'NO POWERS YET', W - 6, H - 26, '#6b5a80', { align: 'right' });
    label(ctx, 'ENTER=PLAY  ESC=MENU', W - 6, H - 15, '#9aa0b8', { align: 'right' });
    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 30);
      const cleared = this.node === 3 && this.cleared(3);
      drawText(ctx, cleared ? 'WORLD CLEARED!' : 'WORLD ' + this.world, W / 2, 56, '#fff', 2, { align: 'center', shadow: SH });
      if (!cleared) drawText(ctx, this.info.name, W / 2, 76, '#ffd84a', 1, { align: 'center', shadow: SH });
      else drawText(ctx, 'PRESS RIGHT FOR THE NEXT WORLD', W / 2, 76, '#9ad', 1, { align: 'center', shadow: SH });
      ctx.globalAlpha = 1;
    }
  }
}
