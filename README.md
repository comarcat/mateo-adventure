# Mateo Adventure

A 90s-style 2D platformer (Mario-style stomping, Sonic-style rush, Mega Man-style boss powers) built with
HTML5 Canvas + vanilla JavaScript ES modules. No build step, no dependencies, no external assets.

**Status: Stage 3 of 7 (classic campaign: overworld map, world 1, boss, save).** See `docs/STAGES.md` for the roadmap.

## Run it

ES modules are blocked by browsers on `file://`, so serve the folder with any static server:

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

Add `?debug` to the URL for cheats: `I` invincible, `R` infinite rush, `B` hitboxes, `L` jump to goal.

## Controls (default)

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / WASD | D-pad / left stick |
| Jump (hold = higher) | Z / Space | A / Y |
| Rush (hold) | C / Shift | B / RT |
| Shoot | X | X / LT |
| Previous / next power | Q / E | LB / RB |
| Pause | Esc / P / Enter | Start |
| Fullscreen | F | - |

Down + Jump drops through thin planks.

## Layout

```
src/engine   input, physics/collision, camera, font, pools, seeded RNG, canvas scaling
src/gfx      pixel-art sprites, procedural tiles, themes, parallax backgrounds
src/entities hero, moving platforms, particles
src/game     Game (state stack + services), Level (runtime)
src/states   title, controls, play, pause, complete, gameover
src/levels   level builder + level registry
src/ui       menu, HUD
src/save     versioned localStorage
src/audio    placeholder (Stage 4)
```

## Adding content (Stage 2)

- **Enemy:** add a row to `src/data/enemies.js` (stats, tile char), art in `src/gfx/art.js` (`ENEMY_ART`), and a behaviour case in `src/entities/enemy.js` if it needs new AI. Per-world scaling lives in `src/data/difficulty.js` (`WORLD_SCALING`).
- **Pickup:** `src/data/pickups.js` (tile char), art in `art.js` (`ITEM_ART`), effect in `Level.collect`.
- **In a level:** put the tile char in the map (`e` blob, `k` spiky, `b` bat, `t` pod, `r` charger; `o` coin, `*` star, `1` extra life, `s` shield, `g` gun, `l` laser, `a` apple, `z` pizza, `?` block with `blocks` data).

## Levels (Stage 3)

Levels are plain data (`{tiles:[strings], platforms, texts, blocks, boss, power, ...}`) built with `LevelBuilder` + `Cursor` in `src/levels/builder.js`.
`Cursor` refuses unfair pieces (pits wider than a plain jump, ledges taller than 2 tiles). Campaign levels are registered in
`src/levels/index.js` as `"<world>-<n>"` (n=4 is the boss). Names/par times/themes are in `src/data/worlds.js`.

Check every level before committing: `node tools/validate.mjs` (start/goal present, jumpable pits, no hazards or enemies at pit edges).
