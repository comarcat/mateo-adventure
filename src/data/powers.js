// Boss powers. Defeating a world's boss permanently unlocks its power.
//   kind 'ability' = always on once earned (double jump, dash...)
//   kind 'weapon'  = joins the Q/E weapon cycle with the gun and laser
//   impl           = true when the gameplay for it exists (the rest arrive in Stage 5)
export const POWERS = {
  doublejump: { name: 'DOUBLE JUMP', kind: 'ability', world: 1, impl: true,  hint: 'JUMP AGAIN IN THE AIR' },
  airdash:    { name: 'AIR DASH',    kind: 'ability', world: 2, impl: true, hint: 'RUSH IN MID-AIR' },
  iceshot:    { name: 'ICE SHOT',    kind: 'weapon',  world: 3, impl: true, hint: 'FREEZES ENEMIES' },
  wallslide:  { name: 'WALL CLIMB',  kind: 'ability', world: 4, impl: true, hint: 'SLIDE AND JUMP OFF WALLS' },
  magnet:     { name: 'COIN MAGNET', kind: 'ability', world: 5, impl: true, hint: 'PULLS COINS TO YOU' },
  fireshot:   { name: 'FIRE SHOT',   kind: 'weapon',  world: 6, impl: true, hint: 'BURNS THROUGH FOES' },
  glide:      { name: 'GLIDE',       kind: 'ability', world: 7, impl: true, hint: 'HOLD JUMP TO FLOAT' },
  groundpound:{ name: 'GROUND POUND',kind: 'ability', world: 8, impl: true, hint: 'DOWN IN AIR TO SLAM' },
};
export const POWER_BY_WORLD = Object.fromEntries(Object.entries(POWERS).map(([k, v]) => [v.world, k]));
