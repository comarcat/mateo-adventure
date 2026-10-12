# Mateo Adventure

A 90s-style 2D platformer (Mario-style stomping, Sonic-style rush, Mega Man-style boss powers) built with
HTML5 Canvas + vanilla JavaScript ES modules. No build step, no dependencies, no external assets.

**Status: Stage 1 of 7 (core engine).** See `docs/STAGES.md` for the roadmap.

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
