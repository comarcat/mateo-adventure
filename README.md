# Mateo Adventure

A 90s-style 2D platformer made for kids: Mario-style stomping and overworld, Sonic-style rush, Mega Man-style bosses that
give you their power. Original characters, enemies, worlds, art and music - nothing copied.

**Version 1.0** - feature complete (all 7 build stages done). Vanilla JavaScript (ES modules) + HTML5 Canvas. **No build step, no dependencies, no audio/image files**:
all art is drawn in code and all music/sound is synthesized live with the Web Audio API.

## Play it

| How | Command |
|---|---|
| Any static server | `python3 -m http.server 8000`, then open <http://localhost:8000> |
| Double-click, no server | open **`dist/index.html`** (a prebuilt single file is included; rebuild it after code changes with `node tools/bundle.mjs`) |
| Online | GitHub Pages / itch.io (see *Deploy* below) |

Browsers (Chrome especially) refuse to load ES modules from `file://`, so opening the plain `index.html` by double-click will not work.
`dist/index.html` is one self-contained file and does work from disk.

Add `?debug` to the URL for the cheat/debug tools (see *Debug*).

## Controls

Everything is remappable in **Options -> Controls** (keyboard and gamepad, saved automatically).

| Action | Keyboard | Gamepad (standard mapping) | Touch |
|---|---|---|---|
| Move | Arrows / WASD | D-pad / left stick | on-screen pad |
| Jump (hold = higher) | Z / Space | A / Y | A |
| Rush (hold) | C / Shift | B / RT | B |
| Shoot | X | X / LT | X |
| Aim while shooting | hold Up / Down (+ Left/Right for diagonals) | D-pad / stick | on-screen D-pad |
| Previous / next power | Q / E | LB / RB | Q/E |
| Pause | Esc / P / Enter | Start | II |
| Menus: confirm / back | Enter, Space, Z / Esc, X | A / B | A / B |
| Fullscreen / mute / touch controls | F / M / T | | |

Down + Jump drops through thin planks. Touch controls appear automatically on touch devices (`T` toggles them).
Gamepads work with Xbox/PlayStation style controllers (hot-plug supported); press any button once so the browser sees the pad.

## The game

**Classic Campaign** - 8 worlds x 4 levels (level 4 is always a boss), SNES-style overworld map, checkpoints, lives, continue.
Beat a world's boss to permanently earn its power:

| World | Boss | Power |
|---|---|---|
| 1 Meadow Land | Slime King | Double Jump |
| 2 Dusty Dunes | Sand Worm | Air Dash |
| 3 Frosty Peaks | Mr. Frost | Ice Shot (freezes enemies) |
| 4 Whisper Woods | Grand Owl | Wall Climb (slide + wall jump) |
| 5 Bubble Bay | Kraken Kid | Coin Magnet |
| 6 Ember Peak | Magma Golem | Fire Shot |
| 7 Cloud City | Storm Bird | Glide |
| 8 Star Castle | The Dark King | Ground Pound |

Powers are **switchable like Mega Man weapons**: press **Q / E** (LB / RB) to cycle *Base* (no power), every ability you have earned, and the weapons you can use (gun and laser while you have ammo, Ice and Fire shots). Only the selected power is active; the HUD shows which one. Ice/Fire use a regenerating energy bar. Picking up a gun or laser equips it automatically unless an ability is selected.

**Endless Battle** - an infinite seeded world (same seed = same terrain, shareable). A storm wall chases you and speeds up, enemy waves
sweep in, new enemy types unlock every zone, an elite mini-boss ends each zone and a major boss closes every 4th zone.

**Hero kit** - run, variable jump, coyote time + jump buffering, **Rush** (hold for a burst of speed; you plow through small enemies),
stomp, slopes, springs, moving platforms. Power-ups: star (invulnerable), extra life, **shield (absorbs exactly 8 hits, fades as it breaks)**,
gun (ammo), laser (charges, pierces), food (heals). **Duck coins** (100 = extra life). Combo multiplier (x8), level/speed/no-damage bonuses.
Difficulty: Easy (8 hearts, slower enemies) / Normal (6) / Hard (4, tougher and faster).

## Saving and scores

Progress, settings, key bindings and high scores are saved in `localStorage` (versioned, wrapped in try/catch).
Top-10 tables for both modes (Classic: score/world/time; Endless: score/distance/seed) with arcade initials.

**Local scores can be edited by players** (browser devtools). The score code is behind a `ScoreBoard` interface (`src/save/scores.js`,
all methods async) so an online leaderboard can replace `LocalScoreBoard` without touching the game. A **global board must validate on
the server** (replay the seed + input log, plausibility limits, rate limiting, signed submissions) - never trust the client.

## Project layout

```
index.html            page shell        sound-test.html   audition every track and effect
src/main.js           bootstrap, fixed 60 Hz loop
src/engine/           input (keyboard/gamepad/touch), physics, camera, font, pools, seeded RNG, canvas scaling
src/gfx/              sprites, procedural tiles/art, themes, parallax, overworld art
src/data/             enemies, pickups, powers, worlds, difficulty + per-world scaling tables
src/entities/         hero, enemies, bosses, projectiles, platforms, particles, popups
src/levels/           builder (Cursor), world 1, generator (segments), arenas, endless generator
src/game/             Game (state stack + services), Level (runtime), EndlessLevel
src/states/           title, mode select, map, play, pause, complete, game over, victory, records, options, controls, debug...
src/audio/            synth, sequencer, tracks (music), sfx
src/save/             versioned save + score boards
tools/                validate.mjs (level checks), bundle.mjs (single-file build)
```

Game states: title, mode select, world map, level, pause, game over, victory, records (plus options, controls, text entry, endless screens).

## How to add things

**A level (campaign)** - levels are plain data: `{tiles:[strings], platforms, texts, blocks, boss, power, physics, music}`.
Build them with `LevelBuilder` + `Cursor` (`src/levels/builder.js`): `c.flat(8, [['e', 3]])`, `c.pit(3)`, `c.hill(2)`, `c.spikes(2)`, `c.crossing()`...
`Cursor` refuses unfair pieces (pits wider than a plain jump, ledges over 2 tiles). Register it in `src/levels/index.js`, then run
`node tools/validate.mjs`. Tile legend: `. # B = ^ / \ S` (empty, ground, brick, one-way plank, spikes, slopes, spring), `P` start,
`C` checkpoint, `G` goal, `?` block, enemy letters (`e k b t r w h m v`), pickups (`o * 1 s g l a z`).

**An enemy** - add a row to `src/data/enemies.js` (stats, tile char), art in `src/gfx/art.js` (`BASE_ART`), and a behaviour method in
`src/entities/enemy.js` if it needs new AI. World scaling lives in `src/data/difficulty.js` (`WORLD_SCALING`).

**A boss** - add a definition to `src/entities/boss.js` (`phases`, `update`, `hittable`...), art in `BOSS_ART`, an arena in `src/levels/arenas.js`
and a row in `src/data/worlds.js`.

**A power** - add it to `src/data/powers.js` and implement it in `src/entities/hero.js`.

**A pickup** - `src/data/pickups.js` + art in `ITEM_ART` + the effect in `Level.collect`.

**Music / sound** - tracks are written as notes in `src/audio/tracks.js` (a bar = 16 steps; bass, arpeggio and drums are generated from chords
and patterns); effects are small recipes in `src/audio/sfx.js`. Open `sound-test.html` to listen.

**A new world look** - add a theme to `src/gfx/themes.js` (tile colours, sky, map colours) and a row in `src/data/worlds.js`.

## Debug / cheats

Open the page with `?debug` (or `localStorage.setItem('mateo.debug','1')`). **F2** opens the debug menu: level select (every level, the test
level, endless), invincibility, infinite rush, all powers, hitboxes, start lives, unlock whole campaign. In levels: `I` invincible, `R` infinite
rush, `B` hitboxes, `L` jump to goal, `1`-`8` toggle each power, `P` all powers + ammo.

## Deploy

**GitHub Pages (automatic)** - push to `main`; `.github/workflows/pages.yml` validates the levels, builds the single-file game and deploys it.
One-time: repo **Settings -> Pages -> Source: GitHub Actions**. (To deploy without Actions, serve the repo root or `dist/` from any branch.)

**itch.io** - run `node tools/bundle.mjs`, zip the **contents of `dist/`** (just `index.html`), create a new project, kind of project **HTML**,
upload the zip, tick *This file will be played in the browser*, set the viewport to about 768x672 (or larger) and enable the *Fullscreen button*.

**Any static host** - copy the repo (or only `dist/index.html`). No server logic is required.

## Testing

- `node tools/validate.mjs` - static checks for all 33 levels (start/goal, jumpable pits, nothing dangerous at pit edges).
- Headless-browser bots were used during development to play every level and boss, soak-test Endless mode (60k frames, memory and entity
  counts stay bounded) and fuzz random input across all screens.
- Verified in Chromium only. Firefox, Safari and Edge use standard APIs (Canvas 2D, Web Audio, Gamepad, localStorage, Pointer Events) but have
  not been tested here - please report anything odd, especially audio start-up on Safari.

## Credits
All code, art and music are original to this project. Art is procedurally painted in a 16-bit style (shaded colour ramps, dithering, parallax layers); fonts: an embedded 5x7 pixel font. No external assets.
All code, art and music are original to this project. Fonts: an embedded 5x7 pixel font. No external assets.
