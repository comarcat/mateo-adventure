# Design review — Mateo Adventure

Reviewed against the checklists in the `awesome-gamedev-agent-skills` repo (skills read: `platformer`, `game-feel`, `level-design`, `camera-systems`, `physics-tuning`, `input-systems`, `audio-design`, `game-ui-ux`, `save-systems`, `create-game-assets`, `performance-optimization`).
Numbers below come from the code (`src/entities/hero.js`, `src/engine/camera.js`, `src/engine/input.js`, `src/audio/*`, `src/save/*`), not from a play session. Items marked *(untested)* are suggestions I have not tried in the game.

## What already matches the guidance

| Area | Status |
|---|---|
| Fixed 60 Hz timestep, simulation separate from drawing | OK (`physics-tuning`) |
| Coyote time 6 frames (0.10 s) and jump buffer 6 frames (0.10 s) | OK, inside the suggested 0.08-0.12 / 0.10-0.15 s |
| Variable jump height (extra gravity when jump is released) | OK |
| Camera: dead zone (vertical), eased look-ahead, speed cap, clamped to level, snaps on respawn | OK (`camera-systems`) |
| Input: actions not keys, radial stick dead zone (0.3), full remap UI, gamepad + touch | OK (`input-systems`) |
| Audio: master / music / SFX buses, squared volume sliders, music ducking, compressor on master | OK (`audio-design`) |
| UI: screen stack, keyboard/pad navigation in every menu, integer scaling | OK (`game-ui-ux`) |
| Pooled projectiles/particles, measured frame budget (`perf.cjs`) | OK (`performance-optimization`) |
| Save data is plain data with a `version` field, every storage access wrapped in try/catch | OK, see gaps below (`save-systems`) |
| Level validator checks reachability of every platform and item | OK (`level-design`) |

## Findings, most important first

### 1. Jump is symmetric and a little high (feel)
`GRAV = 0.23` is used for both rising and falling. Full jump = 5.5² / (2 x 0.23) = **66 px (4.1 tiles), apex after 24 frames (0.40 s)**. The skill suggests 3-4 tiles, 0.30-0.40 s, and a fall gravity 1.5-2x the rise gravity to avoid a floaty feel.
Suggestion *(untested)*: fall gravity x1.4. This shortens the jump distance, so all levels must be re-checked with the bots (`play-levels.cjs`) and `MAX_PIT` may need a small bump. Put the multiplier behind a debug toggle first.

### 2. No corner correction, no apex hang
The platformer skill lists corner correction (nudge ~4 px past a ledge you clip) as part of the core feel. The hero has none, so a jump that misses a ledge corner by 1-3 px just bonks. An apex hang (gravity x0.5 near the top) would add air control for the 1-tile ledges.
Suggestion: add corner correction first (small, safe); decide on apex hang after playtesting.

### 3. Juice is thin and one piece is unpleasant
- Screen shake uses a **new random offset every frame** (`camera.js`, `_apply`) and a constant magnitude. `game-feel` calls this "buzzing"; it should decay (trauma squared) and use smooth noise.
- **No hit-stop** on stomps, boss hits or deaths (2-4 frames of freeze sells the impact cheaply).
- **No squash and stretch** on Mateo (landing, jump start) or on pickups; dust exists already.
- **No "reduce screen shake / flashing" option.** `game-feel` and `game-ui-ux` both ask for one; the star power-up and boss flashes strobe.
Suggestion: trauma-based shake, hit-stop on stomp/boss hit, landing squash, and an options toggle.

### 4. Level pacing risk after the length/enemy increase
`level-design` asks for a sawtooth of tension and rest, one mechanic taught before it is tested, and a breather before the boss. Levels are now 40-60% longer and 55% denser in enemies, and the filler is assembled from random segments (`generator.js`), so intensity is probably flat.
Suggestions: add an explicit beat table per level (teach / combat / rest / climax with an intensity number) and have the generator insert a rest segment with a checkpoint every ~80-100 columns; keep the enemy-free run before each boss. Verify with the bots by counting damage taken per segment.

### 5. Boss powers don't gate anything
Powers are earned but no level needs them, so they feel optional (the Mega Man loop is: new power -> revisit old stages -> find what it opens). The `level-design` gating pattern fits well.
Suggestion: add 1-2 optional areas per world that need an earlier power (double-jump ledge, air-dash gap, wall-climb shaft, ground-pound floor) with a pickup or 1-up inside, and a room-graph check in `validate.mjs` that the main path never requires a power the player lacks.

### 6. Tutorial text ignores remapped controls and the input device
"ARROWS MOVE - Z JUMP" and the title hint are hard-coded. After a remap, or on a gamepad/touch, they are wrong (`input-systems`: swap prompts on device change).
Suggestion: build these strings from the active bindings and the last-used device.

### 7. Audio variety and loudness
SFX play at fixed pitch and volume every time (no random detune); stomps and coins repeat identically. Loudness was never measured; the skill suggests about -24 LUFS for desktop/speakers with true peaks under -1 dBTP.
Suggestion: +-5% random pitch on repeated SFX, then render the soundtrack with `audio-render.cjs` and measure.

### 8. Save robustness
Saves are written in place with `localStorage.setItem` and there is no backup copy, so a corrupt value falls back to a fresh save. The migration hook is a comment only. Scores in `localStorage` are editable (already documented in `scores.js`).
Suggestion: keep a `.bak` copy of the last good save, validate fields on load, and add one real migration test.

### 9. Art pipeline and consistency (`create-game-assets`)
- The sprites came from AI-generated concept sheets, then were shrunk to a pixel grid by `tools/art/extract.py`. There is **no provenance/licence note and no asset manifest** (skill step 10 and `asset-manifest.json`). Add one before sharing the game publicly.
- **Each sprite is quantised to its own palette**, so characters do not share colours with the tiles or with each other. A single shared palette (or a ramp per faction) would fix colour drift between the painted sprites and the hand-built tiles/backgrounds.
- Sprites are judged at scale in screenshots, but extra animation frames are faked (squash/stretch); Mateo's run cycle alternates two poses. Real run/flap frames are the biggest remaining art gap.
- Hero hitbox (10x14) vs sprite (22x24): the hat extends ~8 px above the hitbox, so head-bumps happen "early" visually. Worth testing in a ceiling-heavy level.

### 10. Smaller UI notes
- 5x7 font is about 7 px high at 1x; fine on desktop, small on phones. A text-size / "large HUD" option would follow the skill's accessibility guidance.
- HUD reads game state every frame (fine at this size); no change needed.

## Suggested order of work

1. Feel pass: corner correction, trauma shake with decay, hit-stop, landing squash, reduce-shake option, optional fall gravity (re-run bots).
2. Pacing pass: beat table + rest segments + checkpoints, pre-boss calm.
3. Power gating: optional areas that need earlier powers, plus the validator check.
4. Prompts from bindings; SFX pitch variation; save backup.
5. Art: shared palette, real animation frames, asset manifest with provenance.
