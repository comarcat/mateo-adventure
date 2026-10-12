# Dev tests (headless-browser bots)

These scripts drive the real game in a headless Chromium with scripted input, the same way the bug pass was done.

```sh
npm i -D playwright && npx playwright install chromium     # once
python3 -m http.server 8123 &                              # serve the game
node tools/dev-tests/play-levels.cjs /tmp 1-1 4-3 8-2      # args: <screenshot dir> then ids
node tools/dev-tests/fight-bosses.cjs /tmp 1 2 3 4 5 6 7 8
node tools/dev-tests/endless-soak.cjs /tmp 60000
node tools/dev-tests/fuzz.cjs /tmp 1 2 3
```

Environment: `BASE` (default `http://localhost:8123`), `CHROMIUM` (path to a Chromium binary if Playwright's own is not installed).
Tests print JSON/lines and `no errors` when the page raised no exceptions. Run `node tools/validate.mjs` for the static level checks.
Note: pressing several keys within one 16 ms frame collapses into one press (by design), so UI tests pause ~45 ms between keys.
