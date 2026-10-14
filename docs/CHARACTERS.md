# Mateo Adventure — Character Sheet (for sprite artists)

All sizes are in game pixels. The game renders at 256x224 and scales up by whole numbers, so **1 sprite pixel = 1 game pixel**.
"Canvas" is the sprite image size; "Hitbox" is the collision box (smaller than the canvas, usually 2-4 px of padding).
Sprites are drawn **facing right**; the game mirrors them for left. Please keep a transparent background and a 1 px dark outline (dark purple/navy, not pure black).
Hit flash and per-world tints are applied by code, so you only draw the neutral version.

Names in **bold** are the in-game names. Faction names are the proposed story groups used to organise the art style; they do not exist in code yet.

---

## 1. Hero

### Mateo (player)
| | |
|---|---|
| Type | Player character, human kid |
| Faction | Meadow Kids (the good guys) |
| Canvas / Hitbox | 16x16 / 10x14 (sprite is drawn 3 px left and 2 px up of the hitbox) |
| Look | Orange beanie with a white pom-pom, teal hoodie, brown shoes, big dark eyes |
| Frames now | stand (1), run (4: A-B-C-B), jump (1), fall/hurt (1) |
| Wanted extras | crouch/slide, wall-slide, glide (arms out), ground-pound, shoot pose, victory, death |
| Abilities | Run, variable-height jump, Rush (speed burst that smashes small enemies), stomp. Earned from bosses: double jump, air dash, wall climb, coin magnet, glide, ground pound, ice shot, fire shot. Regular weapons found in levels: gun and laser. |
| Power-up looks | Shield bubble (24x24 ring drawn around him), star (flashing white), hurt (blink) |

---

## 2. Regular enemies (9 types)

Every enemy is a **16x16 canvas, 2 animation frames** (idle/walk and a second pose). Each world re-tints the sprites in code (desert orange, ice blue, forest green, water teal, volcano red, sky yellow, castle purple), so draw them in neutral colours.
**Elites** are the same sprite scaled up 1.7x with 3x hit points and 5x score. They show up as mini-bosses in later levels.

| Name | Type (code id) | Hitbox | HP | Faction | Behaviour / abilities | Stompable | Look |
|---|---|---|---|---|---|---|---|
| **Gloopy** | Walker (`blob`) | 12x11 | 1 | Slime Swarm | Walks back and forth, turns at ledges. The tutorial enemy. | Yes | Happy green slime that wobbles |
| **Pricklit** | Walker (`spiky`) | 12x11 | 2 | Thorn Clan | Walks slowly. Spikes on top hurt if you jump on it. Shoot or Rush it. | **No** | Red hedgehog-ball with yellow spikes |
| **Flutterbug** | Flyer (`bat`) | 12x10 | 1 | Night Wings | Flies in a sine wave. Needs aimed shots to hit when high. | Yes | Purple bat-bug with flappy wings, yellow eyes |
| **Pop Pod** | Shooter (`pod`) | 12x14 | 2 | Thorn Clan | Rooted plant. Wakes up when you are near and spits seeds at you. | Yes | Red-headed plant with green leaves |
| **Clanky** | Armoured walker (`guard`) | 12x14 | 2 | Iron Guard | Shield blocks gun and ice shots from the front. Hit it from behind or stomp it. | Yes | Little knight with a helmet and shield |
| **Boing** | Hopper (`hopper`) | 12x12 | 1 | Pond Crew | Hops toward you in high arcs. | Yes | Teal frog |
| **Splotch** | Splitter (`splitter`) | 14x14 | 2 | Slime Swarm | When defeated it splits into two small ones. | Yes | Big spotty pink slime |
| **Swoopy** | Diver (`swooper`) | 12x10 | 1 | Night Wings | Hangs back, then swoops down at you and returns. Currently a teal recolour of Flutterbug, so a unique sprite is welcome. | Yes | Teal bat-bug |
| **Rammo** | Charger (`charger`) | 14x12 | 2 | Iron Guard | Sees you, winds up, charges fast, then is stunned for a moment. | Yes | Stubby brown bull |

---

## 3. Bosses (8)

Each world ends with a boss in a fixed arena. Beating it permanently unlocks that world's **boss power**. Hit points are the base value; they grow with world and difficulty. Most bosses show a red-tinted "rage" version in later phases, which is applied by code.

| # | Name | Canvas | Hitbox | Base HP | Phases | World / Faction | Look | Attacks and rules | Boss power it gives |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Slime King** | 40x32 | 30x24 | 10 | 3 | Meadow Land / Slime Swarm | Giant green jelly with a gold crown, 3 frames: idle, squash, stretch | Big jumps that send shockwaves along the floor. At half HP he splits into 3 mini-Gloopies. At the last phase he fires spread shots. | Double Jump |
| 2 | **Sand Worm** | 36x44 | 18x30 | 12 | 3 | Dusty Dunes / Dune Dwellers | Tan segmented column with a toothy round mouth | Burrows under the sand, warns, then erupts under you. Only hittable while it is rising or exposed. | Air Dash |
| 3 | **Mr. Frost** | 44x38 | 26x28 | 12 | 3 | Frosty Peaks / Frost Folk | Big white yeti with a blue face | Throws snowballs, slams the floor, and calls icicles down. The arena floor is slippery. | Ice Shot |
| 4 | **Grand Owl** | 48x32 | 26x22 | 12 | 3 | Whisper Woods / Night Wings | Brown owl, pale face, wide wings (2 flap frames) | Flies. Shoots feathers, then dives and crashes into the ground, where it can be hit. | Wall Climb |
| 5 | **Kraken Kid** | 44x36 | 28x26 | 14 | 3 | Bubble Bay / Deep Crew | Purple octopus with huge eyes, 2 tentacle frames | Ink clouds, tentacle pillars, belly-slide charge. The arena is floaty (low gravity). | Coin Magnet |
| 6 | **Magma Golem** | 44x40 | 30x32 | 14 | 3 | Ember Peak / Stone Brutes | Rocky giant, frame 2 shows the glowing core | Armoured. Slams and vents, and **only the core is hittable while venting**. | Fire Shot |
| 7 | **Storm Bird** | 52x30 | 30x20 | 14 | 3 | Cloud City / Night Wings | Dark-blue thunderbird, lightning crest, big wings (2 frames) | Calls lightning strikes, then swoops and crash-lands. | Glide |
| 8 | **The Dark King** | 40x40 | 24x34 | 18 | 4 | Star Castle / Shadow Court | Hooded purple cloak, red eyes, gold crown. Frame 1 = casting | Teleports, vanishes, casts. Mixes the tricks of earlier bosses. Only hittable when he appears or casts. | Ground Pound (and ends the game) |

---

## 4. Boss powers (what Mateo gains)

One boss power is active at a time (Q/E cycles). Ice and fire replace the regular weapon while selected.

| Power | From | Type | Effect |
|---|---|---|---|
| Double Jump | Slime King | Ability | Jump once more in the air |
| Air Dash | Sand Worm | Ability | Rush in mid-air |
| Ice Shot | Mr. Frost | Shot (energy bar) | Freezes enemies, who can then be stomped or shattered |
| Wall Climb | Grand Owl | Ability | Slide down walls and jump off them |
| Coin Magnet | Kraken Kid | Ability | Pulls coins toward you |
| Fire Shot | Magma Golem | Shot (energy bar) | Burns through enemies |
| Glide | Storm Bird | Ability | Hold jump to float |
| Ground Pound | The Dark King | Ability | Press down in the air to slam |

---

## 5. Items and pickups

| Name | Canvas | Effect |
|---|---|---|
| **Duck coin** | 12x12 (spin frames) | +1 coin, 100 coins = extra life |
| **Apple** / **Pizza** | 14x14 | Restore 2 / 4 hearts |
| **Gun** | 14x14 | +12 ammo (max 40, carries over) |
| **Laser** | 14x14 | +3 charges (max 8, carries over) |
| **Shield** | 14x14 | 15-second bubble: blocks all damage and kills what it touches |
| **Star** | 14x14 | 10 seconds of invulnerability, plows through small enemies |
| **1-Up** | 14x14 | Extra life |
| **Power orb** | 14x14 | Dropped by a defeated boss: grants its boss power |
| **Ice / Fire icons** | 14x14 | HUD icons for the two boss shots |

## 6. Projectiles (small, 3-8 px)

Hero: gun bullet, laser beam (fires in 8 directions), ice shard, fireball. Enemies/bosses: seed, feather, snowball, icicle, ink blob, lightning bolt, ground shockwave.

---

## 7. Faction summary

| Faction | Members | Style notes |
|---|---|---|
| Meadow Kids | Mateo | Warm orange/teal, friendly shapes |
| Slime Swarm | Gloopy, Splotch, Slime King | Round, glossy, jelly highlights |
| Thorn Clan | Pricklit, Pop Pod | Spiky, red/green, plants |
| Night Wings | Flutterbug, Swoopy, Grand Owl, Storm Bird | Wings, purple/blue, big eyes |
| Iron Guard | Clanky, Rammo | Armour, grey/brown, blocky |
| Pond Crew | Boing | Teal, hopping, bouncy |
| Dune Dwellers | Sand Worm | Tan/orange, segmented |
| Frost Folk | Mr. Frost | White/blue, fluffy |
| Deep Crew | Kraken Kid | Purple/teal, tentacles |
| Stone Brutes | Magma Golem | Dark rock with orange glow |
| Shadow Court | The Dark King | Purple/black cloaks, red eyes, gold crown |

---

## 8. Tips for delivering sprites

- One PNG per animation frame, or one sheet per character with frames in a single row (left to right), all frames the same size.
- Keep the feet at the bottom edge of the canvas and centred, so the hitbox lines up.
- Neutral colours for regular enemies (the game tints them per world).
- If you want to draw at a higher resolution for the 16-bit look, use 2x the canvas sizes above (for example Mateo 32x32) and tell me. The hitboxes stay the same and I will scale the drawing in code.

---

## 9. Current painted sprites (generated from the concept sheets)

The concept sheets are saved in `assets/reference/`. `python3 tools/art/extract.py` cuts every character out of them, shrinks it to its in-game size and writes:
- `assets/sprites/<name>.png` — one editable transparent PNG per sprite (hero poses are 22 px wide with the hat centred; enemies about 14-27 px; bosses 30-50 px; items 12-22 px),
- `src/gfx/sprites_hd.js` — the same pixels, which the game loads (no image loading, works from `file://`).

To replace a sprite with hand-drawn art: overwrite its PNG in `assets/sprites/` (same file name, bottom edge on the feet), then run `python3 tools/art/extract.py --from-png` and commit.
Extra animation frames (squash/stretch, flap, core glow, rage tint) are made by code from the single painted pose. Real extra frames can be added later.
