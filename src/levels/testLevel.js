// Stage 1 test level: exercises every movement feature (slopes, one-ways, springs, spikes, pits,
// moving platforms, checkpoint, rush-only gap, goal).
import { LevelBuilder } from './builder.js';

export function makeTestLevel() {
  const b = new LevelBuilder(150, 14);
  const TOP = 11;
  b.ground(0, 149, TOP);

  b.set(2, TOP - 1, 'P');
  b.text(3, 5, 'ARROWS/WASD MOVE');
  b.text(3, 6.2, 'Z/SPACE JUMP');

  // gap + planks
  b.pit(22, 24);
  b.plank(12, 8, 5);

  // two-tier hill with slopes
  b.set(30, TOP - 1, '/'); b.set(31, TOP - 1, '#'); b.set(31, TOP - 2, '/');
  b.fill(32, TOP - 2, 2, 2, '#'); b.set(34, TOP - 1, '#'); b.set(34, TOP - 2, '\\'); b.set(35, TOP - 1, '\\');
  b.text(28, 7, 'SLOPES');

  // spikes + plank bridge
  b.set(44, TOP - 1, '^'); b.set(45, TOP - 1, '^');
  b.plank(43, 7, 4);
  b.text(41, 5, 'MIND THE SPIKES');

  // spring up to a high ledge
  b.set(52, TOP - 1, 'S');
  b.plank(55, 6, 6);
  b.text(49, 4, 'SPRING + DROP THROUGH');

  // checkpoint
  b.set(63, TOP - 1, 'C');

  // moving platform crossing
  b.pit(66, 79);
  b.fill(72, TOP, 2, 3, '#');
  b.mover(66, 10, 2, 'x', 4, 0.6);
  b.mover(75, 10, 2, 'x', 3, 0.7, 0.5);
  b.text(65, 5, 'RIDE THE PLATFORMS');

  // brick stairs
  b.fill(85, TOP - 1, 1, 1, 'B'); b.fill(86, TOP - 2, 1, 2, 'B'); b.fill(87, TOP - 3, 1, 3, 'B');

  // gap too wide to jump normally: hold RUSH
  b.pit(105, 109);
  b.text(97, 6, 'HOLD C/SHIFT = RUSH');
  b.text(97, 7.2, 'RUN UP, THEN JUMP!');

  // goal
  b.set(138, TOP - 1, 'G');

  return b.build({ id: 'test', name: 'TEST LEVEL', theme: 'grass', world: 1 });
}
