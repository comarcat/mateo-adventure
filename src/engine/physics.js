// Tile-based collision: solids, one-way platforms, 45-degree slopes, hazards.
// Bodies are plain objects {x,y,w,h,vx,vy,grounded,...}; x/y is the top-left of the hitbox.
import { T } from '../config.js';

export const K = { EMPTY: 0, SOLID: 1, ONEWAY: 2, SPIKE: 3, SLOPE_R: 4, SLOPE_L: 5, SPRING: 6 };
// '/' rises to the right (SLOPE_R), '\' rises to the left (SLOPE_L).
const CHAR_KIND = { '#': K.SOLID, 'B': K.SOLID, '?': K.SOLID, '!': K.SOLID, '=': K.ONEWAY, '^': K.SPIKE, '/': K.SLOPE_R, '\\': K.SLOPE_L, 'S': K.SPRING };

export class TileMap {
  constructor(rows) {
    this.h = rows.length;
    this.w = Math.max(...rows.map((r) => r.length));
    this.ch = rows.map((r) => r.padEnd(this.w, '.').split(''));
    this.k = new Uint8Array(this.w * this.h);
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) this.k[r * this.w + c] = CHAR_KIND[this.ch[r][c]] || 0;
  }
  set(c, r, ch) { this.ch[r][c] = ch; this.k[r * this.w + c] = CHAR_KIND[ch] || 0; }
  char(c, r) { return (c < 0 || c >= this.w || r < 0 || r >= this.h) ? '.' : this.ch[r][c]; }
  // Level edges: left/right are walls, top is open, bottom is a pit.
  kind(c, r) {
    if (c < 0 || c >= this.w) return K.SOLID;
    if (r < 0 || r >= this.h) return K.EMPTY;
    return this.k[r * this.w + c];
  }
  get pxW() { return this.w * T; }
  get pxH() { return this.h * T; }
}

// Surface y of the slope under the body's centre, or null. tol = how far above the slope we still stick to it.
function slopeSurface(b, map, tol) {
  const cx = b.x + b.w / 2, bottom = b.y + b.h;
  const c = Math.floor(cx / T), rb = Math.floor(bottom / T);
  const u = Math.max(0, Math.min(T - 0.01, cx - c * T));
  let best = null;
  for (let r = rb - 1; r <= rb + 1; r++) {
    const k = map.kind(c, r);
    if (k !== K.SLOPE_R && k !== K.SLOPE_L) continue;
    const s = r * T + (k === K.SLOPE_R ? T - u : u);
    if (s <= bottom + tol && (best === null || s < best)) best = s;
  }
  return best;
}
function slopeSnap(b, map, tol) {
  const s = slopeSurface(b, map, tol);
  if (s === null) return false;
  b.y = s - b.h;
  return true;
}

// Move horizontally by d pixels and resolve against solid tiles (with small step-up while on slopes).
export function moveXBy(b, map, d) {
  if (!d) return;
  b.x += d;
  if (b.grounded) b.onSlope = slopeSnap(b, map, 3);
  const dir = d > 0 ? 1 : -1;
  const c = Math.floor((dir > 0 ? b.x + b.w - 0.001 : b.x) / T);
  const r0 = Math.floor(b.y / T), r1 = Math.floor((b.y + b.h - 0.001) / T);
  let blockTop = Infinity;
  for (let r = r0; r <= r1; r++) if (map.kind(c, r) === K.SOLID) blockTop = Math.min(blockTop, r * T);
  if (blockTop === Infinity) return;
  if (b.onSlope && b.y + b.h - blockTop <= 8) { b.y = blockTop - b.h; return; }   // walk up onto plateau
  b.x = dir > 0 ? c * T - b.w : (c + 1) * T;
  b.vx = 0; b.wall = dir;
}

// Apply b.vy and resolve vertically. Sets grounded/onSlope/onOneWay/ceil.
export function moveY(b, map) {
  const wasG = b.grounded;
  const prevBottom = b.y + b.h;
  b.y += b.vy;
  b.grounded = false; b.onSlope = false; b.onOneWay = false; b.ceil = null;
  const c0 = Math.floor(b.x / T), c1 = Math.floor((b.x + b.w - 0.001) / T);
  if (b.vy < 0) {
    const r = Math.floor(b.y / T);
    for (let c = c0; c <= c1; c++) if (map.kind(c, r) === K.SOLID) { b.y = (r + 1) * T; b.vy = 0; b.ceil = { c, r }; break; }
    return;
  }
  const r = Math.floor((b.y + b.h) / T);
  let land = Infinity, oneway = false;
  for (let c = c0; c <= c1; c++) {
    const k = map.kind(c, r);
    if (k === K.SOLID) land = Math.min(land, r * T);
    else if (k === K.ONEWAY && !(b.dropT > 0) && prevBottom <= r * T + 0.01) { land = Math.min(land, r * T); oneway = true; }
  }
  const s = slopeSurface(b, map, wasG ? 3 : 0);
  if (s !== null && s < land) { land = s; b.onSlope = true; oneway = false; }
  if (land !== Infinity) { b.y = land - b.h; b.vy = 0; b.grounded = true; b.onOneWay = oneway; }
}

// First tile of `kind` overlapping the rectangle, as {c,r}, else null.
export function tileInRect(map, x, y, w, h, kind) {
  const c0 = Math.floor(x / T), c1 = Math.floor((x + w - 0.001) / T);
  const r0 = Math.floor(y / T), r1 = Math.floor((y + h - 0.001) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    if (c < 0 || c >= map.w || r < 0 || r >= map.h) continue;
    if (map.k[r * map.w + c] === kind) return { c, r };
  }
  return null;
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
