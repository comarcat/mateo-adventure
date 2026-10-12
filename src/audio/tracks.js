// Original chiptune compositions. Notation: a bar is 16 sixteenth-steps; tokens are "NOTE:steps" (default 1),
// "-:n" is a rest. Bass and arpeggios are generated from the chord of each bar; drums from 16-char patterns.
// A "family" is one composition; worlds reuse a family with their own key, tempo and instruments (variation).

const BARS = (s) => s.trim().split(/\s*\|\s*/);

const DRUMS = {
  rock:  { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  bounce:{ k: 'x.....x.x.....x.', s: '....x.......x...', h: '..x...x...x...x.' },
  march: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' },
  drive: { k: 'x..x..x.x..x..x.', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx' },
  boss:  { k: 'x.x.x.x.x.x.x.x.', s: '....x..x....x...', h: 'x.xxx.xxx.xxx.xx' },
  soft:  { k: 'x.......x.......', s: '................', h: '..x...x...x...x.' },
  none:  { k: '................', s: '................', h: '................' },
};

const FAMILIES = {
  title: {
    bpm: 132, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G'], drums: 'rock', bass: 'pump', arp: 'up', leadDuty: 0.5,
    lead: BARS(`E5:2 G5:2 C6:4 B5:2 G5:2 E5:4 | D5:2 G5:2 B5:4 A5:2 G5:2 D5:4 | C5:2 E5:2 A5:4 G5:2 E5:2 C5:4 | A4:2 C5:2 F5:4 E5:2 D5:2 C5:4 |
      E5:2 G5:2 C6:4 D6:2 E6:2 C6:4 | D6:2 B5:2 G5:4 B5:2 D6:2 G5:4 | A5:2 C6:2 F6:4 E6:2 C6:2 A5:4 | G5:2 B5:2 D6:4 G6:6 -:2`),
  },
  map: {
    bpm: 112, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'], drums: 'bounce', bass: 'walk', arp: 'down', leadDuty: 0.25,
    lead: BARS(`A5:3 C6:1 A5:2 F5:2 G5:3 A5:1 G5:2 E5:2 | F5:3 A5:1 D6:4 C6:2 A5:2 F5:4 | D6:3 C6:1 Bb5:2 A5:2 Bb5:3 C6:1 D6:2 F6:2 | E6:4 C6:2 G5:2 C6:8 |
      A5:3 C6:1 A5:2 F5:2 G5:3 A5:1 C6:2 A5:2 | A5:2 D6:2 F6:4 E6:2 D6:2 A5:4 | Bb5:2 D6:2 F6:4 D6:2 Bb5:2 F5:4 | G5:2 C6:2 E6:4 C6:2 G5:2 C5:4`),
  },
  // world families -------------------------------------------------------------
  bright: {   // grass / sky: bouncy major run
    bpm: 140, chords: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'], drums: 'rock', bass: 'pump', arp: 'up', leadDuty: 0.5,
    lead: BARS(`B5:2 D6:2 G6:2 D6:2 B5:2 D6:2 G5:4 | B5:2 E6:2 G6:2 E6:2 B5:2 E6:2 G5:4 | C6:2 E6:2 G6:2 E6:2 C6:2 G5:2 E5:4 | D6:2 F#6:2 A6:2 F#6:2 D6:2 A5:2 F#5:4 |
      G5:2 B5:2 D6:4 C6:2 B5:2 A5:4 | G5:2 B5:2 E6:4 D6:2 B5:2 G5:4 | C6:2 E6:2 G6:4 F6:2 E6:2 C6:4 | D6:2 A5:2 F#5:2 A5:2 D6:8`),
  },
  dusty: {    // desert / volcano: exotic minor with a harmonic-minor twist
    bpm: 128, chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'A'], drums: 'drive', bass: 'pump', arp: 'up', leadDuty: 0.25,
    lead: BARS(`D5:2 E5:1 F5:1 A5:4 G5:2 F5:2 E5:4 | D5:2 E5:1 F5:1 A5:4 C#6:4 D6:4 | Bb5:2 A5:2 G5:4 F5:2 G5:2 A5:4 | A5:2 G5:2 F5:2 E5:2 C#5:4 E5:4 |
      D6:2 C6:1 Bb5:1 A5:4 G5:2 A5:2 Bb5:4 | A5:2 Bb5:1 C6:1 D6:4 E6:4 F6:4 | G6:2 F6:2 E6:2 D6:2 Bb5:4 G5:4 | A5:4 C#6:4 E6:4 A5:4`),
  },
  chill: {    // ice / water: spacious, shimmering
    bpm: 104, chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'], drums: 'soft', bass: 'half', arp: 'up', leadDuty: 0.125,
    lead: BARS(`E6:4 C6:2 A5:2 E6:4 C6:4 | F6:4 C6:2 A5:2 F6:4 A5:4 | G6:4 E6:2 C6:2 G6:4 E6:4 | D6:4 B5:2 G5:2 D6:4 B5:2 D6:2 |
      E6:2 G6:2 A6:4 G6:2 E6:2 C6:4 | F6:2 A6:2 C7:4 A6:2 F6:2 C6:4 | G6:2 E6:2 C6:4 E6:2 G6:2 C7:4 | B6:2 G6:2 D6:4 G6:2 B6:2 D7:4`),
  },
  mystic: {   // forest / castle: dark and curious
    bpm: 118, chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'D', 'B'], drums: 'march', bass: 'walk', arp: 'down', leadDuty: 0.25,
    lead: BARS(`E5:3 G5:1 B5:4 A5:2 G5:2 F#5:4 | E5:3 G5:1 C6:4 B5:2 A5:2 G5:4 | F#5:3 A5:1 D6:4 C#6:2 A5:2 F#5:4 | D#5:2 F#5:2 B5:4 A5:2 F#5:2 D#5:4 |
      B5:3 E6:1 G6:4 F#6:2 E6:2 B5:4 | C6:3 E6:1 G6:4 E6:2 C6:2 G5:4 | D6:3 F#6:1 A6:4 F#6:2 D6:2 A5:4 | B5:2 D#6:2 F#6:4 B6:8`),
  },
  boss: {
    bpm: 160, chords: ['Am', 'Am', 'F', 'E', 'Am', 'Am', 'F', 'E'], drums: 'boss', bass: 'pump', arp: 'up', leadDuty: 0.25,
    lead: BARS(`A5:1 -:1 A5:1 -:1 C6:2 A5:2 E5:2 A5:2 C6:2 E6:2 | A5:1 -:1 A5:1 -:1 B5:2 C6:2 B5:2 A5:2 G#5:4 | F5:1 -:1 F5:1 -:1 A5:2 C6:2 F6:2 E6:2 C6:2 A5:2 | E5:2 G#5:2 B5:2 E6:2 D6:2 B5:2 G#5:4 |
      A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:4 | A5:2 C6:2 E6:2 A6:2 B6:2 A6:2 G#6:4 | F6:2 A6:2 C7:2 A6:2 F6:2 C6:2 A5:4 | E6:2 D6:2 C6:2 B5:2 A5:4 E5:4`),
  },
  endless: {
    bpm: 150, chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'D'], drums: 'drive', bass: 'pump', arp: 'up', leadDuty: 0.125,
    lead: BARS(`E5:2 B5:2 E6:2 B5:2 E5:2 B5:2 E6:2 G6:2 | C6:2 E6:2 G6:2 E6:2 C6:2 E6:2 G6:2 C7:2 | B5:2 D6:2 G6:2 D6:2 B5:2 D6:2 G6:2 B6:2 | A5:2 D6:2 F#6:2 D6:2 A5:2 D6:2 F#6:2 A6:2 |
      E6:4 B5:2 G5:2 E6:4 G6:4 | G6:4 E6:2 C6:2 G6:4 C7:4 | D6:4 B5:2 G5:2 D6:4 G6:4 | F#6:4 D6:2 A5:2 F#6:2 A6:2 D7:4`),
  },
  gameover: {
    bpm: 80, chords: ['Cm', 'Ab', 'Fm', 'G'], drums: 'none', bass: 'half', arp: 'none', leadDuty: 0.5, loopable: false,
    lead: BARS(`G5:4 Eb5:4 C5:8 | Eb5:4 C5:4 Ab4:8 | F5:4 Ab5:4 C5:4 F5:4 | D5:4 B4:4 C5:8`),
  },
  victory: {
    bpm: 150, chords: ['C', 'F', 'G', 'C'], drums: 'march', bass: 'pump', arp: 'up', leadDuty: 0.5, loopable: false,
    lead: BARS(`C5:2 E5:2 G5:2 C6:2 E6:4 C6:2 E6:2 | F5:2 A5:2 C6:2 F6:2 A6:4 F6:2 A6:2 | G5:2 B5:2 D6:2 G6:2 B6:4 G6:2 B6:2 | C6:2 E6:2 G6:2 C7:2 C7:8`),
  },
};

// Named tracks. `base` picks a family; the rest override it (transpose in semitones, tempo, instruments...).
export const TRACKS = {
  title: { base: 'title' },
  map: { base: 'map' },
  boss: { base: 'boss' },
  endless: { base: 'endless' },
  gameover: { base: 'gameover' },
  victory: { base: 'victory' },
  'world-grass':  { base: 'bright' },
  'world-sky':    { base: 'bright', transpose: 2, bpm: 150, leadDuty: 0.25, drums: 'bounce', vib: 0.004 },
  'world-desert': { base: 'dusty' },
  'world-volcano':{ base: 'dusty', transpose: 5, bpm: 140, leadDuty: 0.125, drums: 'boss' },
  'world-ice':    { base: 'chill' },
  'world-water':  { base: 'chill', transpose: 3, bpm: 96, leadDuty: 0.5, vib: 0.006, drums: 'none' },
  'world-forest': { base: 'mystic' },
  'world-castle': { base: 'mystic', transpose: 5, bpm: 126, leadDuty: 0.75, drums: 'drive' },
};
export const MUSIC_BY_WORLD = [null, 'world-grass', 'world-desert', 'world-ice', 'world-forest', 'world-water', 'world-volcano', 'world-sky', 'world-castle'];

// ------------------------------------------------------------------------------------------------ parsing
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function noteToMidi(n) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  if (!m) throw new Error('bad note ' + n);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], dim: [0, 3, 6] };
function chordTones(name) {
  const m = /^([A-G])(#|b)?(m|7|dim)?$/.exec(name);
  if (!m) throw new Error('bad chord ' + name);
  const root = PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return { root, tones: QUAL[m[3] || ''] };
}

const ARP = { up: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1], down: [2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1], none: null };
// bass patterns: [step, semitone offset from root, length]
const BASS = {
  pump: [[0, 0, 2], [2, 0, 2], [4, 12, 2], [6, 0, 2], [8, 0, 2], [10, 0, 2], [12, 12, 2], [14, 7, 2]],
  walk: [[0, 0, 4], [4, 7, 4], [8, 0, 4], [12, 7, 2], [14, 5, 2]],
  half: [[0, 0, 8], [8, 7, 8]],
};

// Compile a named track into per-step event lists: {steps, stepsPerBar, bpm, loop, ev[step] = [{ch, midi, dur, ...}]}
const cache = {};
export function compileTrack(name) {
  if (cache[name]) return cache[name];
  const def = TRACKS[name]; if (!def) throw new Error('unknown track ' + name);
  const f = { ...FAMILIES[def.base], ...def };
  const tr = f.transpose || 0, bars = f.lead.length, total = bars * 16;
  const ev = Array.from({ length: total }, () => []);
  // lead
  f.lead.forEach((bar, b) => {
    let step = b * 16;
    for (const tok of bar.trim().split(/\s+/)) {
      const [n, d] = tok.split(':'), dur = Number(d || 1);
      if (n !== '-') ev[step].push({ ch: 'lead', midi: noteToMidi(n) + tr, dur });
      step += dur;
    }
  });
  // bass + arp from chords (chord list repeats to fill the bars)
  for (let b = 0; b < bars; b++) {
    const ch = chordTones(f.chords[b % f.chords.length]);
    for (const [s, off, len] of BASS[f.bass]) ev[b * 16 + s].push({ ch: 'bass', midi: 36 + ch.root + off + tr, dur: len });
    const arp = ARP[f.arp];
    if (arp) for (let s = 0; s < 16; s++) ev[b * 16 + s].push({ ch: 'arp', midi: 60 + ch.root + ch.tones[arp[s] % ch.tones.length] + (arp[s] >= ch.tones.length ? 12 : 0) + tr, dur: 1 });
    const d = DRUMS[f.drums];
    for (let s = 0; s < 16; s++) {
      const fill = b === bars - 1 && (f.drums === 'rock' || f.drums === 'drive' || f.drums === 'march') && s >= 12;
      if (d.k[s] === 'x') ev[b * 16 + s].push({ ch: 'kick' });
      if (d.s[s] === 'x' || (fill && s % 2 === 0)) ev[b * 16 + s].push({ ch: 'snare' });
      if (d.h[s] === 'x') ev[b * 16 + s].push({ ch: 'hat', soft: f.drums === 'boss' || f.drums === 'drive' });
    }
  }
  return (cache[name] = { name, steps: total, bpm: f.bpm, loop: f.loopable !== false, duty: f.leadDuty, vib: f.vib || 0.0025, ev });
}
