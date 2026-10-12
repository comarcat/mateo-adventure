import { enhance } from './paint.js';
// Sprites are authored as pixel strings + a palette and baked to canvases once at startup.
// Each baked sprite has right-facing (r) and left-facing (l) versions, plus white "hit flash" versions.

export function mk(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  return [c, g];
}

function tint(src, color) {
  const [c, g] = mk(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function flip(src) {
  const [c, g] = mk(src.width, src.height);
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}

// Wrap an already-drawn canvas into a sprite (adds flipped + flash versions).
export function fromCanvas(c, lit = true) {
  if (lit) enhance(c);
  const l = flip(c);
  return { w: c.width, h: c.height, r: c, l, rw: tint(c, '#fff'), lw: tint(l, '#fff') };
}

export function bake(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const [c, g] = mk(w, h);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error('sprite row ' + y + ' has width ' + row.length + ', expected ' + w);
    for (let x = 0; x < w; x++) { const col = pal[row[x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }
  });
  return fromCanvas(c);
}

// Draw a baked sprite. dir: 1 right, -1 left. flash: use the white version.
export function drawSprite(ctx, s, x, y, dir = 1, flash = false) {
  ctx.drawImage(flash ? (dir < 0 ? s.lw : s.rw) : (dir < 0 ? s.l : s.r), Math.round(x), Math.round(y));
}

// ---------------------------------------------------------------- Mateo, our hero
// Orange-beanie kid in a teal hoodie. 16x16, facing right.
const MATEO_PAL = {
  o: '#2a1b3d', h: '#ff9a2e', H: '#d9631b', p: '#ffffff', q: '#cfd8ff', s: '#ffd0a0', S: '#e9a572',
  t: '#2dc7b8', T: '#1a8f8c', b: '#7a4a21', w: '#ffffff', e: '#2a1b3d', m: '#b24a4a',
};
const HEAD = [
  '......oppo......',
  '.....oppqpo.....',
  '....oohhhhhoo...',
  '...ohhhhhhhhHo..',
  '..ohhhhhhhhhhHo.',
  '..oHHHHHHHHHHHo.',
  '..oSsssssssssso.',
  '..osssswessweso.',
  '..osssseesseeso.',
  '..ossssssmmssso.',
  '...oSsssssssSo..',
  '....oTtttttTTo..',
  '..osTttttttTso..',
  '...oTttttttTo...',
];
const LEGS = {
  stand: ['....oTTooTTo....', '...obbboobbbo...'],
  runA: ['...oTTo..oTTo...', '..obbbo..obbbo..'],
  runB: ['....oTTTTTTo....', '....obbbbbbo....'],
  runC: ['..oTTo...oTTo...', '.obbbo...obbbo..'],
  fall: ['..oTTo....oTTo..', '..obbo....obbo..'],
};
export const MATEO = {};
for (const [k, legs] of Object.entries(LEGS)) MATEO[k] = bake([...HEAD, ...legs], MATEO_PAL);
MATEO.run = [MATEO.runA, MATEO.runB, MATEO.runC, MATEO.runB];
MATEO.jump = MATEO.runA;

// ---------------------------------------------------------------- tiny HUD icons
export const ICON = {
  heart: bake(['.oo.oo.', 'orrorro', 'orwrrro', 'orrrrro', '.orrro.', '..oro..', '...o...'], { o: '#2a1b3d', r: '#ff4a5a', w: '#ffc2c8' }),
  heartEmpty: bake(['.oo.oo.', 'o..o..o', 'o.....o', 'o.....o', '.o...o.', '..o.o..', '...o...'], { o: '#6b5a80' }),
};
