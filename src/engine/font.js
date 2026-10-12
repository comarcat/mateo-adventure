// Embedded 5x7 bitmap font, ASCII 0x20..0x5F (lowercase is drawn as uppercase).
// Each glyph = 5 column bytes, LSB = top row.
const GLYPHS = [
  '0000000000', '00005F0000', '0007000700', '147F147F14', '242A7F2A12', '2313086462', '3649552250', '0005030000', // sp ! " # $ % & '
  '001C224100', '0041221C00', '14083E0814', '08083E0808', '0050300000', '0808080808', '0060600000', '2010080402', // ( ) * + , - . /
  '3E5149453E', '00427F4000', '4261514946', '2141454B31', '1814127F10', '2745454539', '3C4A494930', '0171090503', // 0-7
  '3649494936', '064949291E', '0036360000', '0056360000', '0814224100', '1414141414', '0041221408', '0201510906', // 8 9 : ; < = > ?
  '324979413E', '7E1111117E', '7F49494936', '3E41414122', '7F4141221C', '7F49494941', '7F09090901', '3E4149497A', // @ A B C D E F G
  '7F0808087F', '00417F4100', '2040413F01', '7F08142241', '7F40404040', '7F020C027F', '7F0408107F', '3E4141413E', // H I J K L M N O
  '7F09090906', '3E4151215E', '7F09192946', '4649494931', '01017F0101', '3F4040403F', '1F2040201F', '3F4038403F', // P Q R S T U V W
  '6314081463', '0708700807', '6151494543', '007F414100', '0204081020', '0041417F00', '0402010204', '4040404040', // X Y Z [ \ ] ^ _
];

export const CHAR_W = 6, CHAR_H = 7;
const atlasCache = new Map();

function atlasFor(color) {
  let c = atlasCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = GLYPHS.length * CHAR_W; c.height = CHAR_H;
  const g = c.getContext('2d');
  g.fillStyle = color;
  GLYPHS.forEach((hex, i) => {
    for (let col = 0; col < 5; col++) {
      const byte = parseInt(hex.substr(col * 2, 2), 16);
      for (let row = 0; row < 7; row++) if ((byte >> row) & 1) g.fillRect(i * CHAR_W + col, row, 1, 1);
    }
  });
  atlasCache.set(color, c);
  return c;
}

export function textWidth(str, scale = 1) { return str.length * CHAR_W * scale - scale; }

// opts: {shadow:'#000', align:'left'|'center'|'right'}
export function drawText(ctx, str, x, y, color = '#fff', scale = 1, opts = {}) {
  str = String(str).toUpperCase();
  if (opts.align === 'center') x -= Math.floor(textWidth(str, scale) / 2);
  else if (opts.align === 'right') x -= textWidth(str, scale);
  x = Math.round(x); y = Math.round(y);
  if (opts.shadow) paint(ctx, str, x + scale, y + scale, opts.shadow, scale);
  paint(ctx, str, x, y, color, scale);
}

function paint(ctx, str, x, y, color, scale) {
  const atlas = atlasFor(color);
  for (let i = 0; i < str.length; i++) {
    let idx = str.charCodeAt(i) - 32;
    if (idx < 0 || idx >= GLYPHS.length) idx = 31;
    ctx.drawImage(atlas, idx * CHAR_W, 0, CHAR_W, CHAR_H, x + i * CHAR_W * scale, y, CHAR_W * scale, CHAR_H * scale);
  }
}
