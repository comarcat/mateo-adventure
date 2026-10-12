// Boss arenas: one screen wide (16 tiles), fixed camera. P = hero start, X = boss spawn.
// Pickups differ per arena so the right tool is on hand (flying bosses get planks + laser to hit them).
import { LevelBuilder } from './builder.js';
import { levelInfo, WORLDS } from '../data/worlds.js';
import { POWER_BY_WORLD } from '../data/powers.js';
import { WORLD1 } from './world1.js';

const meta = (id, extra = {}) => {
  const i = levelInfo(id), w = WORLDS[i.world];
  return { id, name: i.name, world: i.world, theme: i.theme, par: i.par, boss: w.boss, power: POWER_BY_WORLD[i.world], lockCamera: true, music: 'boss', ...extra };
};
const base = () => { const b = new LevelBuilder(16, 14); b.ground(0, 15, 11); b.set(2, 10, 'P'); return b; };

const ARENAS = {
  1() { return WORLD1['1-4'](); },
  // 2: sand worm - burrowing; plenty of floor, a few planks to dodge the eruption
  2() { const b = base(); b.set(3, 10, 'g'); b.set(13, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.set(2, 6, 's'); b.set(13, 6, 'a'); b.set(7, 10, 'l'); return b.build(meta('2-4')); },
  // 3: mr. frost - icy floor, a couple of platforms to dodge icicles
  3() { const b = base(); b.set(4, 10, 'g'); b.set(13, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.plank(6, 5, 4); b.set(2, 6, 's'); b.set(13, 6, 'a'); b.set(7, 4, 'l'); return b.build(meta('3-4', { physics: { slick: true } })); },
  // 4: grand owl - flying; higher planks to jump-shoot from
  4() { const b = base(); b.set(3, 10, 'g'); b.set(8, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.plank(6, 6, 4); b.set(2, 6, 'l'); b.set(13, 6, 'l'); b.set(13, 10, 'a'); b.set(7, 5, 's'); return b.build(meta('4-4')); },
  // 5: kraken kid - floaty low-gravity arena
  5() { const b = base(); b.set(3, 10, 'g'); b.set(13, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.plank(6, 5, 4); b.set(2, 6, 's'); b.set(13, 6, 'a'); b.set(7, 4, 'l'); return b.build(meta('5-4', { physics: { grav: 0.7, jump: 0.92 } })); },
  // 6: magma golem - big floor, pickup apples for the slam waves
  6() { const b = base(); b.set(3, 10, 'g'); b.set(13, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.set(2, 6, 's'); b.set(13, 6, 'a'); b.set(7, 10, 'l'); b.set(8, 10, 'a'); return b.build(meta('6-4')); },
  // 7: storm bird - flying; planks to reach it, lightning dodging
  7() { const b = base(); b.set(3, 10, 'g'); b.set(8, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.plank(6, 6, 4); b.set(2, 6, 'l'); b.set(13, 6, 'l'); b.set(7, 5, 's'); b.set(13, 10, 'a'); return b.build(meta('7-4')); },
  // 8: the dark king - everything, plus supplies
  8() { const b = base(); b.set(3, 10, 'g'); b.set(13, 10, 'X'); b.plank(1, 7, 3); b.plank(12, 7, 3); b.plank(6, 5, 4); b.set(2, 6, 's'); b.set(13, 6, 'a'); b.set(7, 4, 'l'); b.set(8, 4, 'a'); b.set(7, 10, 'z'); return b.build(meta('8-4')); },
};
export function makeArena(world) { return ARENAS[world](); }
