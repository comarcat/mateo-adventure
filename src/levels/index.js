// Level registry. Stage 3+ adds the 32 campaign levels here.
import { makeTestLevel } from './testLevel.js';

const registry = { test: makeTestLevel };
export function getLevel(id) {
  const f = registry[id];
  if (!f) throw new Error('Unknown level: ' + id);
  return f();
}
export function levelIds() { return Object.keys(registry); }
