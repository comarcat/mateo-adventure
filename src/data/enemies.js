// Enemy definitions. To add an enemy: add a row here, add its art in gfx/art.js ENEMY_ART,
// and (if it needs new behaviour) a case in entities/enemy.js.
//   char    - tile character used in level data       ai      - behaviour
//   w,h     - hitbox px                               hp      - base hit points (scaled per world)
//   stomp   - can be stomped?                         small   - killed outright by Rush / star
//   score   - base points                             color   - death particle colours
export const ENEMIES = {
  blob:    { char: 'e', ai: 'walk',   w: 12, h: 11, hp: 1, speed: 0.4,  score: 100, stomp: true,  small: true,  color: ['#5fd35a', '#a8f08a', '#fff'] },
  spiky:   { char: 'k', ai: 'walk',   w: 12, h: 11, hp: 2, speed: 0.35, score: 150, stomp: false, small: true,  color: ['#e0453a', '#ffe08a', '#fff'] },
  bat:     { char: 'b', ai: 'fly',    w: 12, h: 10, hp: 1, speed: 0.7,  score: 150, stomp: true,  small: true,  color: ['#7a4ac8', '#c8b0ff', '#ffe14a'] },
  pod:     { char: 't', ai: 'shoot',  w: 12, h: 14, hp: 2, speed: 0,    score: 200, stomp: true,  small: true,  color: ['#e8453a', '#3fae4a', '#fff'] },
  guard:   { char: 'w', ai: 'walk',   w: 12, h: 14, hp: 2, speed: 0.3,  score: 200, stomp: true,  small: false, shield: true, color: ['#9aa0b8', '#d8dcec', '#fff'] },
  hopper:  { char: 'h', ai: 'hop',    w: 12, h: 12, hp: 1, speed: 0.9,  score: 150, stomp: true,  small: true,  color: ['#3fc8b0', '#a8ffe8', '#fff'] },
  splitter:{ char: 'm', ai: 'walk',   w: 14, h: 14, hp: 2, speed: 0.35, score: 200, stomp: true,  small: false, splits: 2, color: ['#d84ac8', '#ff9af0', '#fff'] },
  swooper: { char: 'v', ai: 'swoop',  w: 12, h: 10, hp: 1, speed: 0.6,  score: 200, stomp: true,  small: true,  color: ['#2a8a9a', '#7af0ff', '#fff'] },
  charger: { char: 'r', ai: 'charge', w: 14, h: 12, hp: 2, speed: 0.5,  chargeSpeed: 2.2, score: 250, stomp: true, small: false, color: ['#b8743a', '#d99a5a', '#fff'] },
};
export const ENEMY_BY_CHAR = Object.fromEntries(Object.entries(ENEMIES).map(([k, v]) => [v.char, k]));
