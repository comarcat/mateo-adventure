import { STEP_MS } from './config.js';
import { Game } from './game/game.js';
import { TitleState } from './states/title.js';
import { ControlsState } from './states/controls.js';
import { PlayState } from './states/play.js';
import { PauseState } from './states/pause.js';
import { CompleteState } from './states/complete.js';
import { GameOverState } from './states/gameover.js';
import { ModeSelectState } from './states/modeselect.js';
import { OptionsState } from './states/options.js';
import { MapState } from './states/map.js';
import { VictoryState } from './states/victory.js';
import { TextEntryState } from './states/textentry.js';
import { RecordsState } from './states/records.js';
import { EndlessMenuState } from './states/endlessmenu.js';
import { EndlessState } from './states/endless.js';
import { EndlessResultState } from './states/endlessresult.js';

const canvas = document.getElementById('game');
const game = new Game(canvas, document.getElementById('screen'));
game.register('title', TitleState);
game.register('controls', ControlsState);
game.register('play', PlayState);
game.register('pause', PauseState);
game.register('complete', CompleteState);
game.register('gameover', GameOverState);
game.register('modeselect', ModeSelectState);
game.register('options', OptionsState);
game.register('map', MapState);
game.register('victory', VictoryState);
game.register('textentry', TextEntryState);
game.register('records', RecordsState);
game.register('endlessmenu', EndlessMenuState);
game.register('endless', EndlessState);
game.register('endlessresult', EndlessResultState);
game.change('title');
window.game = game;      // handy for debugging in the console

document.getElementById('fs').addEventListener('click', (e) => { game.gfx.toggleFullscreen(); e.target.blur(); });

// Fixed 60 Hz timestep with an accumulator; rendering runs at display rate.
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(now - last, 100); last = now;
  let steps = 0;
  while (acc >= STEP_MS && steps < 5) { game.update(); acc -= STEP_MS; steps++; }
  if (steps === 5) acc = 0;
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Pause automatically when the tab/window loses focus.
addEventListener('blur', () => { game.autoPause(); game.audio.suspend(); });
addEventListener('focus', () => game.audio.resume());
document.addEventListener('visibilitychange', () => { if (document.hidden) { game.autoPause(); game.audio.suspend(); } else game.audio.resume(); last = performance.now(); acc = 0; });
