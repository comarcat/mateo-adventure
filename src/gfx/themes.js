// World themes: palettes for tiles, parallax backgrounds and the overworld map.
// Add a theme here to add a new world look. `map` colours drive the SNES-style overworld.
const base = (o) => ({
  cloud: '#ffffff', cloudShade: '#d6f0ff',
  top: '#5ed04a', topHi: '#a6f06a', topLo: '#2f9a3a',
  dirt: '#9a6034', dirtLo: '#74441f', dirtHi: '#b97a46',
  brick: '#c8553a', brickLo: '#8a3524', brickHi: '#ee8a62',
  plank: '#c98a4a', plankLo: '#8a5a2a', ...o,
});

export const THEMES = {
  grass: base({
    sky: ['#5cc8ff', '#7ad4ff', '#9adfff', '#bdeaff'], hillFar: '#8fd3a0', hillNear: '#5fbf6a',
    map: { land: '#6fcf5a', land2: '#5cb84a', path: '#f0d890', water: '#3a8ae0', decor: 'tree' },
  }),
  desert: base({
    sky: ['#ffb870', '#ffc98a', '#ffdca8', '#ffeccb'], cloudShade: '#ffe0b8', hillFar: '#e8b070', hillNear: '#d89a58',
    top: '#e8c26a', topHi: '#fff0a0', topLo: '#b88a3a', dirt: '#c8924a', dirtLo: '#9a6a30', dirtHi: '#e0b070',
    brick: '#b86a3a', brickLo: '#7a4020', brickHi: '#e09860',
    map: { land: '#f0cf80', land2: '#e0b866', path: '#a87840', water: '#4ac0d0', decor: 'cactus' },
  }),
  ice: base({
    sky: ['#9ad0ff', '#b8e0ff', '#d4eeff', '#eaf8ff'], hillFar: '#d0e8f8', hillNear: '#b0d4ee',
    top: '#e8f8ff', topHi: '#ffffff', topLo: '#9ac8e8', dirt: '#7aa8d0', dirtLo: '#5a88b0', dirtHi: '#a0c8e8',
    brick: '#7a9ad8', brickLo: '#4a68a8', brickHi: '#b0c8f8', plank: '#a8c8e8', plankLo: '#6a90b8',
    map: { land: '#e0f4ff', land2: '#c4e4f8', path: '#7aa8d0', water: '#2a60b8', decor: 'pine' },
  }),
  forest: base({
    sky: ['#3a8a6a', '#4aa07a', '#60b890', '#80d0a8'], cloudShade: '#a8e0c0', hillFar: '#2a7a50', hillNear: '#1e6a3e',
    top: '#2fa04a', topHi: '#6ad870', topLo: '#1a6a30', dirt: '#6a4428', dirtLo: '#4a2c18', dirtHi: '#8a5e38',
    map: { land: '#3a9a50', land2: '#2a8040', path: '#d8c890', water: '#2a7ab0', decor: 'tree' },
  }),
  water: base({
    sky: ['#1a5ab0', '#2070c8', '#3088d8', '#48a0e8'], cloud: '#a8e0ff', cloudShade: '#78c0f0', hillFar: '#2a7ac0', hillNear: '#1a60a8',
    top: '#58d0c0', topHi: '#a0fff0', topLo: '#2a9a90', dirt: '#c8b080', dirtLo: '#a08858', dirtHi: '#e8d0a0',
    brick: '#3a8ab8', brickLo: '#1a5a88', brickHi: '#78c0e8', plank: '#a07850', plankLo: '#70502c',
    map: { land: '#58c8c0', land2: '#40b0a8', path: '#f8e8b0', water: '#1a50a0', decor: 'coral' },
  }),
  volcano: base({
    sky: ['#4a1a2a', '#6a2a30', '#8a3a30', '#b05030'], cloud: '#8a5a58', cloudShade: '#6a4048', hillFar: '#5a2a30', hillNear: '#401c24',
    top: '#6a5a5a', topHi: '#a09090', topLo: '#3a2a2a', dirt: '#5a3a38', dirtLo: '#3a2220', dirtHi: '#7a5250',
    brick: '#a03a28', brickLo: '#601810', brickHi: '#e06a40', plank: '#7a5a48', plankLo: '#4a3428',
    map: { land: '#8a5a50', land2: '#6e463e', path: '#e8c890', water: '#e8501a', decor: 'rock' },
  }),
  sky: base({
    sky: ['#4a90f0', '#68a8f8', '#90c4ff', '#c0e0ff'], hillFar: '#e8f4ff', hillNear: '#d0e8ff',
    top: '#fff8e0', topHi: '#ffffff', topLo: '#e0c890', dirt: '#e8d0a8', dirtLo: '#c8a878', dirtHi: '#fff0d0',
    brick: '#e0a0d8', brickLo: '#a860a0', brickHi: '#ffd0f8', plank: '#ffe0a0', plankLo: '#c8a860',
    map: { land: '#d8ecff', land2: '#c0dcf8', path: '#fff0b0', water: '#7ab0f0', decor: 'puff' },
  }),
  castle: base({
    sky: ['#0a0a2a', '#14143e', '#1e1e56', '#2a2a70'], cloud: '#5a5a9a', cloudShade: '#3a3a78', hillFar: '#22224a', hillNear: '#181838',
    top: '#8a8ac0', topHi: '#c0c0f0', topLo: '#50508a', dirt: '#4a4a78', dirtLo: '#30305a', dirtHi: '#6a6a9a',
    brick: '#6a4aa0', brickLo: '#402870', brickHi: '#a080e0', plank: '#8a7ab0', plankLo: '#54487a',
    map: { land: '#3a3a70', land2: '#2c2c5c', path: '#c0b0f0', water: '#10102a', decor: 'crystal' },
  }),
};
