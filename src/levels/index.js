// Level registry. Campaign levels are "<world>-<n>"; n=4 is the boss arena.
import { makeTestLevel } from './testLevel.js';
import { WORLD1 } from './world1.js';

const registry = { test: makeTestLevel, ...WORLD1 };
export function hasLevel(id) { return !!registry[id]; }
export function getLevel(id) {
  const f = registry[id];
  if (!f) throw new Error('Unknown level: ' + id);
  return f();
}
export function levelIds() { return Object.keys(registry); }
