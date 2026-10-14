#!/usr/bin/env python3
"""Turns the concept-art sheets in assets/reference/ into game sprites.

For every sprite: cut it out of the sheet (flood-fill the cream background away), area-average it down to its
in-game pixel size, quantise to a small palette, then write
  - assets/sprites/<name>.png        (editable, transparent PNG - artists can replace these)
  - src/gfx/sprites_hd.js            (the same pixels as palette-indexed strings; the game decodes them synchronously)
Run:  python3 tools/art/extract.py        (needs Pillow + numpy)
Replace a sprite: edit assets/sprites/<name>.png, then run  python3 tools/art/extract.py --from-png
"""
import sys, json, os
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
REF = os.path.join(ROOT, 'assets', 'reference')
OUT = os.path.join(ROOT, 'assets', 'sprites')
SCALE = 1.04          # sheets were shown to me at 1932px, the files are 2000px

# name -> (sheet, box in 1932px coords (x0,y0,x1,y1), target height in game px)   (width follows the aspect ratio)
CELLS = {
    # ---- hero: all poses share the neutral pose's scale
    'hero_stand':   ('hero', (90, 270, 420, 880)),
    'hero_run':     ('hero', (520, 290, 900, 880)),
    'hero_jump':    ('hero', (1000, 270, 1380, 880)),
    'hero_hurt':    ('hero', (1500, 290, 1840, 880)),
    'hero_glide':   ('hero', (80, 1040, 500, 1700)),
    'hero_djump':   ('hero', (560, 1020, 920, 1700)),
    'hero_victory': ('hero', (990, 1040, 1380, 1700)),
    # ---- enemies
    'gloopy':   ('enemies', (230, 340, 540, 620), 14),
    'pricklit': ('enemies', (800, 310, 1170, 620), 17),
    'flutter':  ('enemies', (1380, 330, 1780, 620), 15),
    'poppod':   ('enemies', (240, 800, 540, 1190), 20),
    'clanky':   ('enemies', (840, 850, 1170, 1190), 20),
    'boing':    ('enemies', (1400, 880, 1760, 1190), 16),
    'splotch':  ('enemies', (210, 1390, 560, 1700), 17),
    'swoopy':   ('enemies', (810, 1400, 1200, 1700), 16),
    'rammo':    ('enemies', (1390, 1380, 1840, 1700), 17),
    # ---- bosses
    'slimeking': ('bosses', (90, 410, 500, 870), 32),
    'sandworm':  ('bosses', (520, 400, 920, 870), 46),
    'yeti':      ('bosses', (920, 320, 1420, 880), 40),
    'owl':       ('bosses', (1370, 520, 1900, 840), 30),
    'kraken':    ('bosses', (60, 1380, 470, 1710), 30),
    'golem':     ('bosses', (460, 1180, 980, 1710), 38),
    'stormbird': ('bosses', (860, 1040, 1440, 1710), 34),
    'darkking':  ('bosses', (1390, 1060, 1880, 1710), 40),
    # ---- items
    'coin':   ('items', (220, 320, 540, 640), 12),
    'apple':  ('items', (820, 320, 1120, 640), 14),
    'pizza':  ('items', (1380, 310, 1750, 640), 14),
    'gun':    ('items', (210, 870, 560, 1130), 14),
    'laser':  ('items', (760, 860, 1190, 1130), 14),
    'shield': ('items', (1390, 830, 1740, 1160), 14),
    'star':   ('items', (210, 1360, 560, 1690), 14),
    'oneup':  ('items', (800, 1390, 1140, 1700), 14),
    'orb':    ('items', (1390, 1360, 1740, 1700), 14),
}
HERO_H = 24           # height of the neutral hero pose in game px

def flood_bg(near):
    """Background = 'near bg colour' pixels connected to the box border."""
    h, w = near.shape
    bg = np.zeros_like(near)
    bg[0, :] = near[0, :]; bg[-1, :] = near[-1, :]; bg[:, 0] = near[:, 0]; bg[:, -1] = near[:, -1]
    while True:
        n = bg.copy()
        n[1:, :] |= bg[:-1, :]; n[:-1, :] |= bg[1:, :]; n[:, 1:] |= bg[:, :-1]; n[:, :-1] |= bg[:, 1:]
        n &= near
        if (n == bg).all(): return bg
        bg = n

def dilate(m, r):
    out = m.copy()
    for _ in range(r):
        n = out.copy()
        n[1:, :] |= out[:-1, :]; n[:-1, :] |= out[1:, :]; n[:, 1:] |= out[:, :-1]; n[:, :-1] |= out[:, 1:]
        out = n
    return out

def erode(m, r):
    return ~dilate(~m, r)

def largest(m, grow=10):
    d = dilate(m, grow); h, w = d.shape
    lab = np.zeros((h, w), np.int32); best = (0, 0); k = 0
    for sy in range(h):
        for sx in range(w):
            if d[sy, sx] and not lab[sy, sx]:
                k += 1; q = deque([(sy, sx)]); lab[sy, sx] = k; cnt = 0
                while q:
                    y, x = q.popleft(); cnt += 1
                    for ny, nx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                        if 0 <= ny < h and 0 <= nx < w and d[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = k; q.append((ny, nx))
                if cnt > best[0]: best = (cnt, k)
    return m & (lab == best[1])

def cutout(img, box, thr=46, grow=5):
    x0, y0, x1, y1 = [int(round(v * SCALE)) for v in box]
    crop = np.array(img.crop((x0, y0, x1, y1))).astype(np.int32)
    edge = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(edge, axis=0)
    dist = np.sqrt(((crop - bg) ** 2).sum(axis=2))
    near = dist < thr
    fg = ~flood_bg(near)
    fg = erode(fg, 1)
    fg = largest(fg, grow)
    ys, xs = np.where(fg)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return crop[y0:y1, x0:x1].astype(np.uint8), fg[y0:y1, x0:x1]

def shrink(rgb, mask, tw, th):
    """Area-average (alpha-weighted) down to tw x th, hard alpha edge."""
    a = mask.astype(np.float32)
    pm = np.dstack([rgb[..., c] * a for c in range(3)] + [a * 255]).astype(np.uint8)
    big = Image.fromarray(pm, 'RGBA').resize((tw, th), Image.BOX)
    p = np.array(big).astype(np.float32)
    alpha = p[..., 3] / 255.0
    col = np.where(alpha[..., None] > 0, p[..., :3] / np.maximum(alpha[..., None], 1e-3), 0)
    return np.clip(col, 0, 255).astype(np.uint8), alpha > 0.5

def quantise(col, alpha, n=32):
    ys, xs = np.where(alpha)
    px = Image.fromarray(col[ys, xs].reshape(1, -1, 3), 'RGB')
    q = px.quantize(colors=n, method=Image.MEDIANCUT, dither=Image.NONE)
    pal = np.array(q.getpalette()[:n * 3]).reshape(-1, 3)
    idx = np.array(q).reshape(-1)
    out = col.copy()
    out[ys, xs] = pal[idx][:len(ys)]
    return out

def to_rgba(col, alpha):
    return np.dstack([col, (alpha * 255).astype(np.uint8)])

def main():
    os.makedirs(OUT, exist_ok=True)
    sheets = {k: Image.open(os.path.join(REF, k + '.jpg')).convert('RGB') for k in ('hero', 'enemies', 'bosses', 'items')}
    sprites = {}
    if '--from-png' in sys.argv:
        for f in sorted(os.listdir(OUT)):
            if f.endswith('.png'): sprites[f[:-4]] = np.array(Image.open(os.path.join(OUT, f)).convert('RGBA'))
    else:
        cuts = {}
        for name, spec in CELLS.items():
            cuts[name] = cutout(sheets[spec[0]], spec[1], 24 if name.startswith('hero_') or name in ('slimeking','darkking') else 34)
        hs = HERO_H / cuts['hero_stand'][0].shape[0]
        for name, spec in CELLS.items():
            rgb, mask = cuts[name]
            if name.startswith('hero_'): tw, th = max(1, round(rgb.shape[1] * hs)), max(1, round(rgb.shape[0] * hs))
            else: th = spec[2]; tw = max(1, round(rgb.shape[1] * th / rgb.shape[0]))
            col, alpha = shrink(rgb, mask, tw, th)
            sprites[name] = to_rgba(quantise(col, alpha), alpha)
            if name.startswith('hero_'):      # common 22px canvas, hat centred, so poses don't jitter when they alternate
                im = sprites[name]; hh, ww = im.shape[:2]
                top = np.where(im[:7, :, 3] > 127)[1]; cx = int(round(top.mean())) if len(top) else ww // 2
                canvas = np.zeros((hh, 22, 4), np.uint8); sx = 11 - cx
                for x in range(ww):
                    if 0 <= x + sx < 22: canvas[:, x + sx] = im[:, x]
                sprites[name] = canvas
            Image.fromarray(sprites[name], 'RGBA').save(os.path.join(OUT, name + '.png'))
    # ---- palette-indexed JS module
    CH = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    lines = ['// GENERATED by tools/art/extract.py from assets/reference/*.jpg - edit assets/sprites/*.png and re-run with --from-png.',
             '// name: [width, height, [palette hex...], [rows]]   "." = transparent']
    body = {}
    for name, im in sorted(sprites.items()):
        h, w = im.shape[:2]
        pal, rows = [], []
        for y in range(h):
            r = ''
            for x in range(w):
                if im[y, x, 3] < 128: r += '.'; continue
                c = '#%02x%02x%02x' % tuple(int(v) for v in im[y, x, :3])
                if c not in pal: pal.append(c)
                r += CH[pal.index(c)]
            rows.append(r)
        body[name] = [w, h, pal, rows]
    lines.append('export const HD = ' + json.dumps(body, separators=(',', ':')) + ';')
    with open(os.path.join(ROOT, 'src', 'gfx', 'sprites_hd.js'), 'w') as f: f.write('\n'.join(lines) + '\n')
    print('wrote', len(sprites), 'sprites;', {k: (v.shape[1], v.shape[0]) for k, v in sprites.items()})

if __name__ == '__main__':
    main()
