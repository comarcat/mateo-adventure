// Pickup definitions, keyed by the tile character used in level data.
export const PICKUPS = {
  o: { type: 'coin' }, '*': { type: 'star' }, '1': { type: 'oneup' }, s: { type: 'shield' },
  g: { type: 'gun' }, l: { type: 'laser' }, a: { type: 'apple' }, z: { type: 'pizza' },
};
export const PICKUP_TYPES = { coin: 'o', star: '*', oneup: '1', shield: 's', gun: 'g', laser: 'l', apple: 'a', pizza: 'z' };
