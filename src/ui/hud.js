import { W } from '../config.js';
import { drawText } from '../engine/font.js';
import { ICON, drawSprite } from '../gfx/sprites.js';
import { ITEM_ART, COIN_ICON } from '../gfx/art.js';

const SH = '#2a1b3d';
const label = (ctx, t, x, y, c = '#fff', o = {}) => drawText(ctx, t, x, y, c, 1, { shadow: SH, ...o });

// Clean 8-bit HUD: hearts, rush meter, shield pips, weapon + ammo, score, coins, lives, combo.
export function drawHUD(ctx, lv) {
  const h = lv.hero, run = lv.run;
  // row 1: health + score
  for (let i = 0; i < h.maxHp; i++) drawSprite(ctx, i < h.hp ? ICON.heart : ICON.heartEmpty, 6 + i * 9, 5);
  label(ctx, String(run.score).padStart(7, '0'), W - 6, 5, '#ffd84a', { align: 'right' });

  // row 2: rush meter + coins
  const mw = 50, filled = Math.round(mw * h.meter / 100);
  label(ctx, 'RUSH', 6, 17, '#d8dcec');
  ctx.fillStyle = SH; ctx.fillRect(33, 16, mw + 2, 9);
  ctx.fillStyle = h.rushing ? '#ffffff' : (h.rushCd > 0 ? '#8a8aa0' : '#ffd84a');
  ctx.fillRect(34, 17, filled, 7);
  ctx.drawImage(COIN_ICON, W - 6 - 7 * 6 - 14, 15);
  label(ctx, 'X' + String(run.coins).padStart(2, '0'), W - 6, 17, '#fff', { align: 'right' });

  // row 3: shield pips + weapon/ammo  |  lives
  let x = 6;
  if (h.shield > 0) {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = SH; ctx.fillRect(x + i * 6, 29, 5, 7); ctx.fillStyle = i < h.shield ? '#7af0ff' : '#3a3a58'; ctx.fillRect(x + i * 6 + 1, 30, 3, 5); }
    x += 8 * 6 + 4;
  }
  if (h.weapon === 'gun') { ctx.drawImage(ITEM_ART.gun.r, x, 26); label(ctx, 'X' + String(h.ammo).padStart(2, '0'), x + 16, 29, '#ffd84a'); x += 46; }
  else if (h.weapon === 'laser') { ctx.drawImage(ITEM_ART.laser.r, x, 26); label(ctx, 'X' + String(h.charges).padStart(2, '0'), x + 16, 29, '#7af0ff'); x += 46; }
  if (h.availableWeapons().length > 1) label(ctx, 'Q/E', x, 29, '#9aa0b8');
  label(ctx, 'LIVES X' + run.lives, W - 6, 29, '#fff', { align: 'right' });
  if (h.star > 0) {
    ctx.fillStyle = SH; ctx.fillRect(6, 40, 52, 5);
    ctx.fillStyle = Math.floor(lv.frames / 4) % 2 ? '#ffd84a' : '#fff6b0'; ctx.fillRect(7, 41, Math.round(50 * h.star / 600), 3);
  }
  if (lv.combo > 1) label(ctx, 'COMBO X' + Math.min(lv.combo, 8), W / 2, 5, lv.frames % 8 < 4 ? '#ffd84a' : '#ff7a3a', { align: 'center' });

  // level intro banner
  if (lv.frames < 150 && lv.status === 'play') {
    ctx.globalAlpha = lv.frames > 110 ? (150 - lv.frames) / 40 : 1;
    drawText(ctx, lv.data.name, W / 2, 80, '#fff', 2, { align: 'center', shadow: SH });
    ctx.globalAlpha = 1;
  }
  if (lv.game.debug) label(ctx, 'DEBUG I:GOD R:RUSH B:BOXES L:SKIP', 6, 214, '#ff7aff');
}
