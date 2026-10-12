import { W } from '../config.js';
import { drawText } from '../engine/font.js';
import { ICON, drawSprite } from '../gfx/sprites.js';
import { HERO_MAX_HP } from '../entities/hero.js';

// Clean 8-bit HUD. Stage 2 adds score, coins, ammo, shield and current power.
export function drawHUD(ctx, lv) {
  const h = lv.hero;
  for (let i = 0; i < HERO_MAX_HP; i++) drawSprite(ctx, i < h.hp ? ICON.heart : ICON.heartEmpty, 6 + i * 9, 6);
  // rush meter
  const mw = 50, filled = Math.round(mw * h.meter / 100);
  drawText(ctx, 'RUSH', 6, 18, '#d8dcec', 1, { shadow: '#2a1b3d' });
  ctx.fillStyle = '#2a1b3d'; ctx.fillRect(33, 17, mw + 2, 9);
  ctx.fillStyle = h.rushing ? '#ffffff' : (h.rushCd > 0 ? '#8a8aa0' : '#ffd84a');
  ctx.fillRect(34, 18, filled, 7);
  drawText(ctx, 'LIVES X' + lv.run.lives, W - 6, 6, '#fff', 1, { align: 'right', shadow: '#2a1b3d' });
  drawText(ctx, lv.data.name, W - 6, 16, '#bdeaff', 1, { align: 'right', shadow: '#2a1b3d' });
  if (lv.game.debug) drawText(ctx, 'DEBUG I:GOD  R:RUSH  B:BOXES  L:SKIP', 6, 214, '#ff7aff', 1, { shadow: '#2a1b3d' });
}
