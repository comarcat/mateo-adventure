// Test level: exercises every movement feature AND all Stage 2 content (enemies, items, blocks, coins).
import { LevelBuilder } from './builder.js';

export function makeTestLevel() {
  const b = new LevelBuilder(150, 14);
  const TOP = 11, G = TOP - 1;       // G = row just above the ground
  b.ground(0, 149, TOP);

  b.set(2, G, 'P');
  b.text(3, 2.6, 'ARROWS/WASD MOVE');
  b.text(3, 3.8, 'Z/SPACE JUMP');

  // question blocks near the start: bump them from below
  b.block(7, 7, 'coin').block(8, 7, 'gun').block(9, 7, 'shield').block(10, 7, 'laser');
  b.text(5, 5.2, 'BUMP BLOCKS (X = SHOOT)');
  for (let x = 4; x <= 6; x++) b.set(x, G, 'o');

  // gap + planks, first enemies
  b.pit(22, 24);
  b.plank(12, 8, 5);
  for (let x = 21; x <= 25; x++) b.set(x, 8, 'o');
  b.set(14, 7, 'o'); b.set(15, 7, 'o');
  b.set(17, G, 'e'); b.set(19, G, 'e');
  b.text(15, 3, 'STOMP ENEMIES!');

  // two-tier hill with slopes
  b.set(30, G, '/'); b.set(31, G, '#'); b.set(31, G - 1, '/');
  b.fill(32, G - 1, 2, 2, '#'); b.set(34, G, '#'); b.set(34, G - 1, '\\'); b.set(35, G, '\\');
  b.text(28, 7, 'SLOPES');
  b.set(32, G - 2, 'o'); b.set(33, G - 2, 'o'); b.set(32, 6, '*');
  b.set(38, G, 'e'); b.set(40, 5, 'b');

  // spikes + plank bridge
  b.set(44, G, '^'); b.set(45, G, '^');
  b.plank(43, 7, 4); b.set(44, 6, 'o'); b.set(45, 6, 'o');
  b.text(41, 5, 'MIND THE SPIKES');
  b.set(48, G, 'k');

  // spring up to a high ledge
  b.set(52, G, 'S');
  b.plank(55, 6, 6);
  b.text(49, 4, 'SPRING + DROP THROUGH');
  for (let x = 56; x <= 59; x++) b.set(x, 5, 'o');
  b.set(60, 5, 'a');

  // checkpoint
  b.set(63, G, 'C');

  // moving platform crossing
  b.pit(66, 79);
  b.fill(72, TOP, 2, 3, '#');
  b.mover(66, 10, 2, 'x', 4, 0.6);
  b.mover(75, 10, 2, 'x', 3, 0.7, 0.5);
  b.text(65, 5, 'RIDE THE PLATFORMS');
  for (let x = 67; x <= 71; x++) b.set(x, 7, 'o');
  b.set(76, 7, 'b');

  // brick stairs
  b.fill(85, G, 1, 1, 'B'); b.fill(86, G - 1, 1, 2, 'B'); b.fill(87, G - 2, 1, 3, 'B');
  b.set(92, G, 'k'); b.set(95, G, 't'); b.set(99, G, 'e');

  // gap too wide to jump normally: hold RUSH
  b.pit(105, 109);
  b.text(97, 5, 'HOLD C/SHIFT = RUSH');
  b.text(97, 6.2, 'RUN UP, THEN JUMP!');
  for (let x = 101; x <= 113; x++) b.set(x, 8, 'o');
  b.set(107, 6, '1');

  // charger + goodies before the goal
  b.set(118, G, 'l'); b.set(116, G, 'z');
  b.set(124, G, 'r');
  b.set(130, G, 'e'); b.set(131, G, 'e');

  // goal
  b.set(138, G, 'G');

  return b.build({ id: 'test', name: 'TEST LEVEL', theme: 'grass', world: 1, par: 90 });
}
