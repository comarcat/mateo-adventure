// Small helper for authoring/generating levels in code. Output is the same plain data format as a
// hand-written level: {id,name,theme,tiles:[strings],platforms:[...],texts:[...]}.
//
// Tile legend:  . empty   # ground (grass on top)   B brick   = one-way plank   ^ spikes
//               / \ slopes   S spring   P hero start   C checkpoint   G goal flag
import { T } from '../config.js';

export class LevelBuilder {
  constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill('.')); this.platforms = []; this.texts = []; }
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
  text(x, y, text) { this.texts.push({ x: x * T, y: y * T, text }); return this; }
  build(meta) {
    return { ...meta, tiles: this.g.map((r) => r.join('')), platforms: this.platforms, texts: this.texts };
  }
}
