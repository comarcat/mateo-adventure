// 16-bit painting toolkit: colour ramps, lit + dithered shapes, selective outlines, glow.
// Everything is drawn procedurally (no image files). The "SNES look" comes from many more shades per material,
// light coming from the top-left, ordered dithering between shades, hue-shifted shadows/highlights and coloured outlines.
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };

// ------------------------------------------------------------------ colour maths
export const rgb = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function toHsl(c) {
  const [r, g, b] = rgb(c).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
const lerpHue = (a, b, t) => { let d = ((b - a + 540) % 360) - 180; return a + d * t; };
export const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
// shadows drift toward cool purple/blue, highlights toward warm yellow: the classic 16-bit palette trick
export function darken(c, amt) { const [h, s, l] = toHsl(c); return fromHsl(lerpHue(h, 260, amt * 0.22), Math.min(1, s * (1 + amt * 0.25)), l * (1 - amt * 0.78)); }
export function lighten(c, amt) { const [h, s, l] = toHsl(c); return fromHsl(lerpHue(h, 52, amt * 0.16), s * (1 - amt * 0.3), l + (1 - l) * amt * 0.85); }
const rampCache = new Map();
// n shades from dark to light around `base` (base sits in the middle-ish)
export function ramp(base, n = 5) {
  const key = base + n; if (rampCache.has(key)) return rampCache.get(key);
  const r = [];
  for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * 2 - 1; r.push(t < 0 ? darken(base, -t * 0.62) : lighten(base, t * 0.62)); }
  rampCache.set(key, r); return r;
}

// ------------------------------------------------------------------ primitives
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => v / 16 - 0.47));
export const bayer = (x, y) => BAYER4[y & 3][x & 3];
export const px = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

// A lit sphere/ellipse. rp = ramp dark->light. o: {light:[lx,ly], outline: colour|false, spec: true, dither: 0..1, flat: 0..1 (less contrast)}
export function ell(g, cx, cy, rx, ry, rp, o = {}) {
  const n = rp.length, L = o.light || [-0.5, -0.72], Lz = Math.sqrt(Math.max(0.05, 1 - L[0] * L[0] - L[1] * L[1]));
  const dith = o.dither === undefined ? 0.9 : o.dither, flat = o.flat || 0;
  if (o.outline !== false) {
    const oc = o.outline || darken(rp[Math.min(1, n - 1)], 0.55);
    g.fillStyle = oc;
    scan(g, cx, cy, rx + 1, ry + 1);
  }
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d2 = dx * dx + dy * dy;
    if (d2 > 1) continue;
    const nz = Math.sqrt(1 - d2), lum = dx * L[0] + dy * L[1] + nz * Lz;
    let t = Math.max(0, Math.min(1, lum * 0.5 + 0.5)); t = t * (1 - flat) + 0.55 * flat;
    let i = Math.floor(t * (n - 1) + 0.5 + bayer(x, y) * dith);
    i = Math.max(0, Math.min(n - 1, i));
    if (o.spec && lum > 0.93 && d2 < 0.5) i = n - 1;
    g.fillStyle = rp[i]; g.fillRect(x, y, 1, 1);
  }
  if (o.spec) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(Math.round(cx - rx * 0.42), Math.round(cy - ry * 0.55), Math.max(1, Math.round(rx * 0.22)), Math.max(1, Math.round(ry * 0.16))); }
}
function scan(g, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1);
  }
}
// Rectangle shaded top->bottom (or left->right) with dithered steps. rp dark->light; light end is at the top/left.
export function rect(g, x, y, w, h, rp, o = {}) {
  const n = rp.length, vertical = o.dir !== 'h', dith = o.dither === undefined ? 0.8 : o.dither;
  if (o.outline) { g.fillStyle = o.outline; g.fillRect(x - 1, y - 1, w + 2, h + 2); }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const t = 1 - (vertical ? (j + 0.5) / h : (i + 0.5) / w);
    let k = Math.floor(t * (n - 1) + 0.5 + bayer(x + i, y + j) * dith); k = Math.max(0, Math.min(n - 1, k));
    g.fillStyle = rp[k]; g.fillRect(x + i, y + j, 1, 1);
  }
  if (o.bevel) bevel(g, x, y, w, h, rp[n - 1], rp[0]);
}
export function bevel(g, x, y, w, h, hi, lo) {
  g.fillStyle = hi; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h);
  g.fillStyle = lo; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
}
// Smooth vertical gradient through colour stops [[t,colour],...] (t 0..1), optional ordered dither for banding-free look
export function vgrad(g, x, y, w, h, stops, dither = 0.6) {
  const cols = stops.map(([t, c]) => [t, rgb(c)]);
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5) / h; let a = cols[0], b = cols[cols.length - 1];
    for (let k = 0; k < cols.length - 1; k++) if (t >= cols[k][0] && t <= cols[k + 1][0]) { a = cols[k]; b = cols[k + 1]; break; }
    const u = a === b ? 0 : (t - a[0]) / (b[0] - a[0]);
    for (let i = 0; i < w; i += 1) {
      const d = bayer(x + i, y + j) * dither * 6;
      g.fillStyle = toHex(a[1][0] + (b[1][0] - a[1][0]) * u + d, a[1][1] + (b[1][1] - a[1][1]) * u + d, a[1][2] + (b[1][2] - a[1][2]) * u + d);
      g.fillRect(x + i, y + j, 1, 1);
    }
  }
}
// Cheap fast variant: horizontal bands per row (no per-pixel dither): good for big backgrounds
export function vgradFast(g, x, y, w, h, stops) {
  const cols = stops.map(([t, c]) => [t, rgb(c)]);
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5) / h; let a = cols[0], b = cols[cols.length - 1];
    for (let k = 0; k < cols.length - 1; k++) if (t >= cols[k][0] && t <= cols[k + 1][0]) { a = cols[k]; b = cols[k + 1]; break; }
    const u = a === b ? 0 : (t - a[0]) / (b[0] - a[0]);
    g.fillStyle = toHex(a[1][0] + (b[1][0] - a[1][0]) * u, a[1][1] + (b[1][1] - a[1][1]) * u, a[1][2] + (b[1][2] - a[1][2]) * u);
    g.fillRect(x, y + j, w, 1);
  }
}
// Soft radial glow (additive-looking) drawn with concentric translucent discs
export function glow(g, cx, cy, r, color, strength = 0.5) {
  const [R, G, B] = rgb(color);
  for (let i = r; i > 0; i -= 1) { const a = strength * Math.pow(1 - i / r, 1.6) * 0.5; g.fillStyle = `rgba(${R},${G},${B},${a})`; scan(g, cx, cy, i, i); }
}

// ------------------------------------------------------------------ selective outline + post effects (operate on a finished canvas)
// Adds a 1px outline around the opaque pixels, coloured as a dark version of the neighbouring fill (never flat black).
export function selout(canvas, amt = 0.58) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data;
  const src = new Uint8ClampedArray(d), out = [];
  const idx = (x, y) => (y * w + x) * 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (src[idx(x, y) + 3] > 40) continue;
    let r = 0, gg = 0, b = 0, n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = idx(nx, ny); if (src[k + 3] > 200) { r += src[k]; gg += src[k + 1]; b += src[k + 2]; n++; }
    }
    if (n) out.push([x, y, darken(toHex(r / n, gg / n, b / n), amt)]);
  }
  for (const [x, y, c] of out) { const [r, gg, b] = rgb(c); const k = idx(x, y); d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255; }
  g.putImageData(img, 0, 0);
  return canvas;
}
// Soft contact shadow ellipse under a character (drawn separately at runtime): returns a small canvas
export function shadowBlob(w = 14, h = 5, alpha = 0.32) {
  const [c, g] = mk(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2), d = dx * dx + dy * dy;
    if (d < 1) { g.fillStyle = `rgba(20,10,40,${alpha * (1 - d * 0.7)})`; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
export function tintCanvas(src, color, alpha) {
  const [c, g] = mk(src.width, src.height); g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
// tiny deterministic hash -> 0..1 (stable "random" for texture)
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (((h ^ (h >>> 16)) >>> 0) % 10000) / 10000; };

// 16-bit shading pass for hand-authored sprites: rim light on top/left edges, hue-shifted shadow on bottom/right edges,
// a soft vertical light falloff and a sparkle of dither, so flat 8-bit colour blocks read as lit, rounded forms.
export function enhance(canvas) {
  const w = canvas.width, h = canvas.height, g = canvas.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : src[(y * w + x) * 4 + 3];
  const lum = (k) => src[k] * 0.3 + src[k + 1] * 0.59 + src[k + 2] * 0.11;
  const cache = new Map();
  const shade = (r, gg, b, dir, amt) => {
    const key = (r << 16 | gg << 8 | b) + ':' + dir + ':' + amt; let v = cache.get(key);
    if (!v) { const hex = toHex(r, gg, b); v = rgb(dir > 0 ? lighten(hex, amt) : darken(hex, amt)); cache.set(key, v); }
    return v;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4; if (src[k + 3] < 200) continue;
    const L = lum(k); if (L < 48) continue;                          // keep the dark outline pixels as they are
    const dark = (xx, yy) => { const kk = (yy * w + xx) * 4; return A(xx, yy) < 200 || lum(kk) < 48; };
    let dir = 0, amt = 0;
    if (dark(x, y - 1) || dark(x - 1, y)) { dir = 1; amt = 0.3; }
    else if (dark(x, y + 1) || dark(x + 1, y)) { dir = -1; amt = 0.3; }
    else { const t = y / h - 0.45; if (t > 0 && bayer(x, y) + t > 0.28) { dir = -1; amt = 0.18; } else if (t < -0.1 && bayer(x, y) - t > 0.3) { dir = 1; amt = 0.14; } }
    if (!dir) continue;
    const c = shade(src[k], src[k + 1], src[k + 2], dir, amt); d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2];
  }
  g.putImageData(img, 0, 0);
  return canvas;
}
