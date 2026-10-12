// Player difficulty (Easy/Normal/Hard) and per-world enemy scaling.
export const DIFFICULTY = {
  easy:   { label: 'EASY',   maxHp: 8, enemySpeed: 0.8,  enemyHp: 1,   bulletSpeed: 0.8,  scoreMul: 0.75 },
  normal: { label: 'NORMAL', maxHp: 6, enemySpeed: 1,    enemyHp: 1,   bulletSpeed: 1,    scoreMul: 1 },
  hard:   { label: 'HARD',   maxHp: 4, enemySpeed: 1.25, enemyHp: 1.5, bulletSpeed: 1.2,  scoreMul: 1.25 },
};
export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];

// Difficulty scaling per world (index 1..8). Multipliers apply to the base values in ENEMIES.
//   hpMul    - enemy hit points        speedMul  - walk/fly speed        chargeMul - charge speed
//   fireMul  - shots per second        bulletMul - projectile speed      sight - px at which enemies notice you
export const WORLD_SCALING = [
  null,
  { hpMul: 1.0, speedMul: 1.00, chargeMul: 1.00, fireMul: 1.00, bulletMul: 1.00, sight: 110 },   // 1 grass
  { hpMul: 1.0, speedMul: 1.05, chargeMul: 1.05, fireMul: 1.10, bulletMul: 1.05, sight: 115 },   // 2 desert
  { hpMul: 1.5, speedMul: 1.10, chargeMul: 1.10, fireMul: 1.20, bulletMul: 1.10, sight: 120 },   // 3 ice
  { hpMul: 1.5, speedMul: 1.15, chargeMul: 1.15, fireMul: 1.30, bulletMul: 1.15, sight: 125 },   // 4 forest
  { hpMul: 2.0, speedMul: 1.20, chargeMul: 1.25, fireMul: 1.40, bulletMul: 1.20, sight: 130 },   // 5 underwater
  { hpMul: 2.0, speedMul: 1.30, chargeMul: 1.35, fireMul: 1.50, bulletMul: 1.30, sight: 135 },   // 6 volcano
  { hpMul: 2.5, speedMul: 1.40, chargeMul: 1.45, fireMul: 1.70, bulletMul: 1.40, sight: 140 },   // 7 sky
  { hpMul: 3.0, speedMul: 1.50, chargeMul: 1.60, fireMul: 2.00, bulletMul: 1.50, sight: 150 },   // 8 space castle
];
