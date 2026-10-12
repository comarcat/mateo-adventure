// World 1: MEADOW LAND. Gentle introduction; 1-3 is the hard one; 1-4 is the Slime King arena.
import { LevelBuilder, Cursor } from './builder.js';
import { fillSegments, topUpEnemies, enemyTarget, PROFILES } from './generator.js';
import { RNG } from '../engine/rng.js';
import { levelInfo } from '../data/worlds.js';

const meta = (id, extra = {}) => { const i = levelInfo(id); return { id, name: i.name, world: i.world, theme: i.theme, par: i.par, music: 'world-grass', ...extra }; };

// After the hand-authored opening, keep going with composed segments (world 1 profile) so the level is a proper long stage.
function more(c, index, extra) {
  const g = { rng: new RNG(1001 + index * 77), prof: PROFILES[1], d: [0.0, 0.12, 0.28][index], index, world: 1 };
  fillSegments(c, g, c.x + extra);
  topUpEnemies(c.b, g, enemyTarget(1, index), 16, c.x - 24);
}

// 1-1  SUNNY MEADOW: teach moving, jumping, stomping, coins, blocks, a hill
function l11() {
  const b = new LevelBuilder(700, 14), c = new Cursor(b, 11, 0);
  c.flat(10, [['P', 2], ['o', 5], ['o', 6], ['o', 7]]);
  c.text(1, 7, 'ARROWS MOVE - Z JUMP');
  c.flat(8, [['e', 5]]).block(2, 3, 'coin').block(3, 3, 'coin').block(4, 3, 'apple');
  c.text(0, 8, 'STOMP ENEMIES FROM ABOVE');
  c.pit(2, [['o', 0, 2], ['o', 1, 3]]);
  c.flat(8, [['o', 2], ['o', 3], ['o', 4]]);
  c.hill(2, 2, [['o', 3, 3], ['o', 4, 3]]);
  c.flat(7, [['e', 1], ['e', 3]]);
  c.pit(3, [['o', 0, 2], ['o', 1, 3], ['o', 2, 2]]);
  c.flat(5);
  c.flat(10, [['C', 1], ['e', 6], ['g', 3, 0]]).block(5, 3, 'coin');
  c.text(0, 7, 'X = SHOOT');
  c.step(1).flat(8, [['e', 4], ['o', 2, 2], ['o', 3, 2], ['o', 4, 2]]);
  c.plank(1, 4, 5).coins(1, 5, 5);
  c.drop(1).flat(9, [['e', 3], ['b', 6, 4]]);
  c.pit(2);
  c.flat(8, [['e', 2], ['s', 5]]).block(3, 3, 'coin');
  c.hill(1, 3).flat(6, [['e', 2], ['o', 3], ['o', 4]]);
  c.pit(3, [['o', 1, 2]]);
  c.flat(8, [['1', 4, 3]]);
  c.hill(2, 1, [['k', 2]]);
  c.flat(6);
  more(c, 0, 230);
  c.flat(14, [['G', 11], ['o', 3], ['o', 4], ['o', 5], ['o', 6]]);
  return b.build(meta('1-1', { par: Math.round(c.x * 0.3) }));
}

// 1-2  WOBBLE HILLS: slopes, bats, springs, planks, first pod and moving platforms
function l12() {
  const b = new LevelBuilder(700, 14), c = new Cursor(b, 11, 0);
  c.flat(8, [['P', 2]]);
  c.hill(2, 2, [['e', 3], ['o', 4, 3], ['o', 5, 3]]);
  c.flat(5, [['b', 2, 4]]);
  c.hill(3, 1, [['o', 4, 4], ['o', 5, 4], ['k', 7]]);
  c.flat(4, [['e', 1]]);
  c.spikes(2, [['o', 1, 3], ['o', 2, 3], ['o', 3, 3]]);
  c.flat(5, [['e', 3]]);
  c.flat(6, [['S', 3], ['C', 0]]).plank(5, 6, 6, true).coins(5, 7, 5);
  c.text(1, 6, 'SPRING TO THE HIGH PLANK');
  c.flat(8, [['a', 2, 0], ['t', 4]]);
  c.pit(3, [['o', 0, 2], ['o', 1, 3], ['o', 2, 2]]);
  c.flat(7, [['e', 2], ['b', 5, 4]]);
  c.hill(2, 3, [['k', 2], ['o', 4, 3], ['o', 5, 3], ['o', 6, 3]]);
  c.flat(5, [['o', 2]]);
  c.crossing(14);
  c.flat(8, [['e', 3], ['t', 6]]);
  c.step(2).flat(8, [['k', 3], ['o', 1, 2], ['o', 2, 2]]);
  c.drop(2).flat(4, [['b', 2, 3]]);
  c.pit(3);
  c.flat(10, [['C', 1], ['e', 4], ['r', 8], ['o', 3]]);
  c.hill(2, 2, [['o', 3, 3], ['o', 4, 3]]);
  c.flat(8, [['e', 3], ['b', 5, 4], ['z', 6]]);
  c.pit(3);
  c.flat(6);
  more(c, 1, 300);
  c.flat(16, [['G', 12], ['o', 3], ['o', 4], ['o', 5]]);
  return b.build(meta('1-2', { par: Math.round(c.x * 0.3) }));
}

// 1-3  SPIKE CREEK: the hardest of world 1 - spikes, chargers, pods, long crossings, a hidden 1UP
function l13() {
  const b = new LevelBuilder(760, 14), c = new Cursor(b, 11, 0);
  c.flat(8, [['P', 2], ['g', 5]]);
  c.spikes(2, [['o', 1, 3], ['o', 2, 3], ['o', 3, 3]]);
  c.flat(6, [['e', 1], ['k', 3]]);
  c.pit(3, [['o', 1, 2]]);
  c.flat(7, [['r', 5]]);
  c.spikes(3, [['o', 1, 3], ['o', 2, 4], ['o', 3, 3], ['o', 4, 3]]);
  c.flat(7, [['C', 1], ['t', 3]]);
  c.crossing(14);
  c.flat(7, [['e', 2], ['e', 5]]);
  c.step(2).flat(3).spikes(2).flat(4, [['k', 2]]);
  c.plank(1, 2, 3).coins(1, 3, 3);
  c.drop(2).flat(7, [['b', 3, 3], ['b', 5, 4], ['o', 6]]);
  c.pit(3, [['o', 1, 2]]);
  c.flat(8, [['o', 2], ['r', 6]]);
  c.hill(3, 1, [['t', 8], ['o', 4, 5], ['1', 5, 5]]);
  c.text(0, 7, 'LOOK UP HIGH FOR A SECRET');
  c.flat(6, [['C', 1], ['a', 4]]);
  c.crossing(14);
  c.flat(6, [['k', 2], ['e', 4]]);
  c.spikes(2, [['o', 1, 3], ['o', 2, 3]]);
  c.flat(3);
  c.pit(3);
  c.flat(6, [['r', 3]]);
  c.pit(2).flat(3).pit(2).flat(3);
  c.flat(8, [['t', 3], ['z', 6]]);
  c.pit(3);
  c.flat(6);
  more(c, 2, 340);
  c.flat(14, [['G', 10], ['o', 2], ['o', 3], ['o', 4], ['o', 5], ['o', 6]]);
  return b.build(meta('1-3', { par: Math.round(c.x * 0.3) }));
}

// 1-4  SLIME KING arena: exactly one screen wide (no scrolling), gun + shield + food to help, boss spawns at X
function l14() {
  const b = new LevelBuilder(16, 14);
  b.ground(0, 15, 11);
  b.set(2, 10, 'P'); b.set(4, 10, 'g'); b.set(13, 10, 'X');
  b.plank(1, 8, 3); b.plank(12, 8, 3); b.plank(6, 8, 4);        // low planks: always reachable with a plain jump
  b.set(2, 7, 's'); b.set(13, 7, 'a'); b.set(7, 7, 'l'); b.set(8, 7, 'l');
  return b.build(meta('1-4', { boss: 'slimeking', power: 'doublejump', lockCamera: true, music: 'boss' }));
}

export const WORLD1 = { '1-1': l11, '1-2': l12, '1-3': l13, '1-4': l14 };
