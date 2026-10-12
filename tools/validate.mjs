// Static level checks: node tools/validate.mjs   (exits 1 on problems)
// Verifies every registered level: has start + goal/boss, pits are jumpable, enemies keep clear of pit
// edges, pickups are not buried in solid tiles.
import { levelIds, getLevel } from '../src/levels/index.js';
import { MAX_PIT } from '../src/levels/builder.js';

const SOLID = new Set(['#', 'B', '?', '!']);
const GROUND_ENEMY = new Set(['e', 'k', 't', 'r', 'w', 'h', 'm']);
const PICKUPS = new Set(['o', '*', '1', 's', 'g', 'l', 'a', 'z']);
let bad = 0;
const fail = (id, msg) => { bad++; console.log('  FAIL', id, msg); };

for (const id of levelIds()) {
  const d = getLevel(id), rows = d.tiles, h = rows.length, w = rows[0].length;
  const at = (c, r) => (c < 0 || c >= w || r < 0 || r >= h) ? '.' : rows[r][c];
  const count = (ch) => rows.join('').split(ch).length - 1;
  if (count('P') !== 1) fail(id, 'needs exactly one P (found ' + count('P') + ')');
  if (d.boss ? count('X') !== 1 : count('G') !== 1) fail(id, d.boss ? 'boss level needs one X' : 'needs exactly one G');
  // column floor profile: first solid row from the bottom-up run
  const floor = (c) => { for (let r = 0; r < h; r++) if (SOLID.has(at(c, r)) || at(c, r) === '/' || at(c, r) === '\\') return r; return -1; };
  let run = 0, runStart = 0;
  for (let c = 0; c <= w; c++) {
    if (c < w && floor(c) === -1) { if (!run) runStart = c; run++; }
    else {
      if (run > 0 && c > 0 && id !== 'test') {   // hazards need a clear run-up and a clear landing around every pit
        for (let k = 1; k <= 3; k++) for (let r = 0; r < h; r++) {
          if (at(runStart - k, r) === '^') fail(id, 'spikes ' + k + ' tile(s) before the pit at col ' + runStart);
          if (at(runStart + run - 1 + k, r) === '^') fail(id, 'spikes ' + k + ' tile(s) after the pit at col ' + runStart);
        }
      }
      if (run > MAX_PIT && id !== 'test') {
        const covered = (d.platforms || []).some((p) => p.x / 16 <= runStart + 1 && (p.x + p.w + p.range) / 16 >= runStart + run - 1);
        if (!covered) fail(id, 'pit of ' + run + ' tiles at col ' + runStart + ' has no moving platform');
      }
      run = 0;
    }
  }
  // Reachability + sealed-cell checks
  const isSolid = (c, r) => SOLID.has(at(c, r)) || at(c, r) === '/' || at(c, r) === '\\';
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = at(c, r);
    if (ch === '=') {                                    // one-way plank: surface must be within a plain jump (4 tiles) of the floor below, unless a spring is near
      let fr = -1; for (let k = r + 1; k < h; k++) if (isSolid(c, k)) { fr = k; break; }
      if (fr > 0 && fr - r > 4) {
        let spring = false; for (let k = Math.max(0, c - 14); k < Math.min(w, c + 14) && !spring; k++) for (let q = 0; q < h; q++) if (at(k, q) === 'S') spring = true;
        if (!spring) fail(id, 'plank at ' + c + ',' + r + ' is ' + (fr - r) + ' tiles above the floor (too high for a jump, no spring nearby)');
      }
    }
    if ('ekbtrwhmvEg1sla*zSC'.includes(ch) || ch === 'o') {      // markers must not sit in a sealed pocket of terrain
      if (isSolid(c - 1, r) && isSolid(c + 1, r) && isSolid(c, r - 1)) fail(id, "'" + ch + "' at " + c + ',' + r + ' is sealed inside terrain');
    }
  }
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = at(c, r);
    if (GROUND_ENEMY.has(ch)) {
      const clear = id === 'test' ? 2 : 6;      // generated worlds keep enemies further from pits
      for (let dc = -clear; dc <= clear; dc++) if (dc !== 0 && floor(c + dc) === -1 && at(c + dc, r + 1) === '.' && floor(c) !== -1) { fail(id, "enemy '" + ch + "' at col " + c + ' is within ' + clear + ' tiles of a pit'); break; }
    }
    if (PICKUPS.has(ch) && SOLID.has(at(c, r))) fail(id, 'pickup inside solid at ' + c + ',' + r);
  }
  console.log((bad ? '' : 'ok  ') + id.padEnd(5), w + 'x' + h);
}
process.exit(bad ? 1 : 0);
