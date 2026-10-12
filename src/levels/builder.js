// Small helper for authoring/generating levels in code. Output is the same plain data format as a
// hand-written level: {id,name,theme,tiles:[strings],platforms:[...],texts:[...]}.
//
// Tile legend:  . empty   # ground (grass on top)   B brick   = one-way plank   ^ spikes
//               / \ slopes   S spring   P hero start   C checkpoint   G goal flag
import { T } from '../config.js';

export class LevelBuilder {
  constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill('.')); this.platforms = []; this.texts = []; this.blocks = {}; }
  set(x, y, ch) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = ch; return this; }
  fill(x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, ch); return this; }
  // solid ground from column x0..x1 (inclusive) with its top at row `top`
  ground(x0, x1, top) { return this.fill(x0, top, x1 - x0 + 1, this.h - top, '#'); }
  pit(x0, x1) { return this.fill(x0, 0, x1 - x0 + 1, this.h, '.'); }
  plank(x, y, w) { return this.fill(x, y, w, 1, '='); }
  // moving platform, positions in tile units
  mover(x, y, wTiles, axis, rangeTiles, speed = 0.6, phase = 0) {
    this.platforms.push({ x: x * T, y: y * T, w: wTiles * T, axis, range: rangeTiles * T, speed, phase }); return this;
  }
  // '?' block that releases `content` (coin, star, oneup, shield, gun, laser, apple, pizza) when bumped from below
  block(x, y, content = 'coin') { this.set(x, y, '?'); this.blocks[x + ',' + y] = content; return this; }
  text(x, y, text) { this.texts.push({ x: x * T, y: y * T, text }); return this; }
  // Trailing empty columns are trimmed so the map ends right after the last piece of content.
  build(meta) {
    let last = this.w - 1;
    while (last > 0 && this.g.every((row) => row[last] === '.')) last--;
    if (last < this.w - 1) this.g = this.g.map((row) => row.slice(0, last + 1));
    return { ...meta, tiles: this.g.map((r) => r.join('')), platforms: this.platforms, texts: this.texts, blocks: this.blocks };
  }
}

// ---------------------------------------------------------------------------------------------
// Cursor: authors a level left-to-right from reusable pieces. It enforces the fairness limits
// (so every level is beatable without Rush) and is reused by the endless-mode generator.
//   MAX_PIT  widest pit crossable with a plain jump      MAX_UP  tallest ledge/step a plain jump clears
export const MAX_PIT = 3, MAX_UP = 2, MAX_HILL = 3;

export class Cursor {
  constructor(b, top = 11, x = 2) { this.b = b; this.top = top; this.x = x; this.mark = x; }
  // items: [[char, dx, up], ...] relative to the start of this piece, `up` tiles above the ground surface
  _items(items) { for (const [ch, dx, up = 0] of items || []) this.b.set(this.mark + dx, this.top - 1 - up, ch); }
  flat(n, items) { this.mark = this.x; this.b.ground(this.x, this.x + n - 1, this.top); this.x += n; this._items(items); return this; }
  pit(n, items) {
    if (n > MAX_PIT) throw new Error('pit ' + n + ' too wide for a plain jump (max ' + MAX_PIT + ')');
    this.mark = this.x; this.x += n; this._items(items); return this;
  }
  // wide pit that REQUIRES a moving platform pair (or Rush): caller supplies the platforms
  chasm(n) { this.mark = this.x; this.x += n; return this; }
  step(dUp) {
    if (dUp > MAX_UP) throw new Error('step up ' + dUp + ' too tall (max ' + MAX_UP + ')');
    this.top -= dUp; return this;
  }
  drop(dDown) { this.top += dDown; return this; }
  hill(h, plateau = 2, items) {
    if (h > MAX_HILL) throw new Error('hill too tall');
    const b = this.b, t = this.top; this.mark = this.x; let x = this.x;
    for (let i = 0; i < h; i++, x++) { b.set(x, t - 1 - i, '/'); b.fill(x, t - i, 1, b.h - (t - i), '#'); }
    b.fill(x, t - h, plateau, b.h - (t - h), '#'); x += plateau;
    for (let j = 0; j < h; j++, x++) { b.set(x, t - h + j, '\\'); b.fill(x, t - h + j + 1, 1, b.h - (t - h + j + 1), '#'); }
    this.x = x; this._items(items); return this;
  }
  spikes(n, items) {
    if (n > 3) throw new Error('too many spikes in a row');
    this.flat(n + 2, items); for (let i = 0; i < n; i++) this.b.set(this.mark + 1 + i, this.top - 1, '^'); return this;
  }
  plank(dx, up, len) { this.b.plank(this.mark + dx, this.top - 1 - up, len); return this; }
  mover(dx, up, wTiles, axis, rangeTiles, speed, phase) { this.b.mover(this.mark + dx, this.top - 1 - up, wTiles, axis, rangeTiles, speed, phase); return this; }
  block(dx, up, content) { this.b.block(this.mark + dx, this.top - 1 - up, content); return this; }
  text(dx, up, s) { this.b.text(this.mark + dx, this.top - 1 - up, s); return this; }
  coins(dx, up, n) { for (let i = 0; i < n; i++) this.b.set(this.mark + dx + i, this.top - 1 - up, 'o'); return this; }
  // Two lifts over a 14-tile chasm with a 2-tile island between them. Lifts are 3 tiles wide and flush
  // with the ground, so you just WALK on when one arrives (no precision jump needed); each lift ends
  // flush with the next ledge. Layout: [lift1 0-3][gap][island 6-7][lift2 8-11 +range 3][ground 14]
  crossing(len = 14) {
    const x0 = this.x; this.chasm(len); const b = this.b, t = this.top;
    b.mover(x0, t, 3, 'x', 3, 0.6);
    b.fill(x0 + 6, t, 2, b.h - t, '#');
    b.mover(x0 + 8, t, 3, 'x', 3, 0.6, 0.5);
    for (let i = 1; i < 6; i++) b.set(x0 + i * 2, t - 3, 'o');
    return this;
  }
}
