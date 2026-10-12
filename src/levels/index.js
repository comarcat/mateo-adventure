// Level registry. Campaign levels are "<world>-<n>"; n=4 is the boss arena.
//   world 1: hand-authored (world1.js)   worlds 2-8: composed from segments (generator.js) + arenas.js
import { makeTestLevel } from './testLevel.js';
import { WORLD1 } from './world1.js';
import { composeLevel } from './generator.js';
import { makeArena } from './arenas.js';

const registry = { test: makeTestLevel, ...WORLD1 };
for (let w = 2; w <= 8; w++) {
  for (let i = 0; i < 3; i++) registry[w + '-' + (i + 1)] = () => composeLevel(w, i);
  registry[w + '-4'] = () => makeArena(w);
}
export function hasLevel(id) { return !!registry[id]; }
export function getLevel(id) {
  const f = registry[id];
  if (!f) throw new Error('Unknown level: ' + id);
  return f();
}
export function levelIds() { return Object.keys(registry); }
export const campaignIds = () => Object.keys(registry).filter((k) => k !== 'test');
