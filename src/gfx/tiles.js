// Procedurally drawn tile art (no external assets). Baked per theme into small canvases.
import { T } from '../config.js';
import { mk } from './sprites.js';
import { bakeBlocks } from './art.js';

function R(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }

function dirtTile(th) {
  const [c, g] = mk(T, T);
  R(g, th.dirt, 0, 0, T, T);
  for (const [x, y] of [[2, 3], [9, 2], [5, 8], [12, 10], [3, 13], [10, 14]]) R(g, th.dirtLo, x, y, 2, 2);
  for (const [x, y] of [[6, 4], [13, 6], [1, 10], [8, 12]]) R(g, th.dirtHi, x, y, 2, 1);
  return c;
}
function grassTile(th) {
  const [c, g] = mk(T, T);
  g.drawImage(dirtTile(th), 0, 0);
  R(g, th.top, 0, 0, T, 5);
  R(g, th.topHi, 0, 0, T, 1);
  R(g, th.topLo, 0, 4, T, 1);
  for (let x = 0; x < T; x += 4) { R(g, th.top, x, 5, 2, 2); R(g, th.topLo, x, 6, 2, 1); }
  return c;
}
function brickTile(th) {
  const [c, g] = mk(T, T);
  R(g, th.brickLo, 0, 0, T, T);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 4 : 0;
    for (let x = -8 + off; x < T; x += 8) { R(g, th.brick, Math.max(0, x), row * 4, Math.min(7, x + 7) - Math.max(0, x) + 1, 3); R(g, th.brickHi, Math.max(0, x), row * 4, Math.min(7, x + 7) - Math.max(0, x) + 1, 1); }
  }
  return c;
}
function onewayTile(th) {
  const [c, g] = mk(T, T);
  R(g, th.plankLo, 0, 0, T, 5); R(g, th.plank, 0, 0, T, 4);
  R(g, '#e8b070', 0, 0, T, 1);
  R(g, th.plankLo, 4, 0, 1, 4); R(g, th.plankLo, 11, 0, 1, 4);
  R(g, th.plankLo, 2, 5, 2, 3); R(g, th.plankLo, 12, 5, 2, 3);
  return c;
}
function slopeTile(th, rising) {   // rising: true for '/' (high on the right)
  const [c, g] = mk(T, T);
  for (let x = 0; x < T; x++) {
    const u = rising ? x : T - 1 - x;           // height from bottom = u+1 pixels
    const top = T - 1 - u;
    R(g, th.dirt, x, top, 1, T - top);
    R(g, th.top, x, top, 1, 3);
    R(g, th.topHi, x, top, 1, 1);
    R(g, th.topLo, x, top + 3, 1, 1);
    if ((x + top) % 7 === 0) R(g, th.dirtLo, x, top + 6, 1, 2);
  }
  return c;
}
function spikeTile() {
  const [c, g] = mk(T, T);
  for (let i = 0; i < 2; i++) {
    const x0 = i * 8;
    for (let y = 0; y < 8; y++) {
      const half = Math.floor(y / 2);
      R(g, '#cfd6e6', x0 + 3 - half + 1, 8 + y, half * 2 + 2 - 0, 1);
    }
    R(g, '#ffffff', x0 + 4, 8, 1, 3);
    R(g, '#7a849e', x0 + 5, 12, 2, 4);
  }
  R(g, '#4a5068', 0, 15, T, 1);
  return c;
}
function springFrames() {
  const frames = [];
  for (const h of [8, 5, 11]) {     // rest, compressed, stretched
    const [c, g] = mk(T, T);
    R(g, '#4a5068', 2, 14, 12, 2);
    const top = T - 2 - h;
    for (let y = 0; y < h; y += 2) R(g, y % 4 === 0 ? '#e8e8f0' : '#9aa0b8', 4, top + 2 + y, 8, 1);
    R(g, '#ff4a5a', 1, top, 14, 3); R(g, '#ff9aa2', 1, top, 14, 1); R(g, '#b02a3a', 1, top + 2, 14, 1);
    frames.push(c);
  }
  return frames;
}
function platformImg() {
  const [c, g] = mk(32, 8);
  R(g, '#2a1b3d', 0, 0, 32, 8);
  R(g, '#7e8aa8', 1, 1, 30, 5); R(g, '#b6c2de', 1, 1, 30, 1); R(g, '#566080', 1, 5, 30, 1);
  for (let x = 4; x < 30; x += 8) R(g, '#2a1b3d', x, 3, 2, 2);
  R(g, '#566080', 2, 6, 28, 1);
  return c;
}
function flagFrames() {
  const mkFlag = (up) => {
    const [c, g] = mk(T, 32);
    R(g, '#2a1b3d', 7, 2, 3, 30); R(g, '#d8dcec', 8, 2, 1, 30);
    R(g, '#ffd84a', 6, 0, 5, 3);
    const y0 = up ? 4 : 18;
    R(g, up ? '#ff4a5a' : '#8a8aa0', 10, y0, 6, 8); R(g, up ? '#ff9aa2' : '#b0b0c0', 10, y0, 6, 1);
    R(g, up ? '#b02a3a' : '#606078', 10, y0 + 7, 6, 1);
    // little duck-ish star mark
    if (up) R(g, '#ffd84a', 12, y0 + 3, 2, 2);
    return c;
  };
  return [mkFlag(false), mkFlag(true)];
}
function goalImg() {
  const [c, g] = mk(T * 2, 48);
  R(g, '#2a1b3d', 14, 4, 4, 44); R(g, '#d8dcec', 15, 4, 2, 44);
  R(g, '#ffd84a', 12, 0, 8, 5); R(g, '#fff2a0', 12, 0, 8, 1);
  R(g, '#2a1b3d', 18, 6, 14, 12); R(g, '#37d46a', 19, 7, 12, 10); R(g, '#8affb0', 19, 7, 12, 1);
  R(g, '#fff', 23, 10, 4, 4);
  return c;
}

export function bakeTileset(th) {
  return {
    grass: grassTile(th), dirt: dirtTile(th), brick: brickTile(th), oneway: onewayTile(th),
    slopeR: slopeTile(th, true), slopeL: slopeTile(th, false), spike: spikeTile(),
    blocks: bakeBlocks(), spring: springFrames(), platform: platformImg(), flag: flagFrames(), goal: goalImg(),
  };
}
