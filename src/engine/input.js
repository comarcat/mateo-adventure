// Unified input: keyboard + Gamepad API (standard mapping) -> abstract actions.
// Menus and gameplay both read the same actions, so everything works on keyboard and pad.
export const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'rush', 'next', 'prev', 'pause', 'confirm', 'back'];
// Actions that appear in the remapping screen (menu actions keep their fixed defaults).
export const REMAPPABLE = ['left', 'right', 'up', 'down', 'jump', 'shoot', 'rush', 'next', 'prev', 'pause'];

export const DEFAULT_BINDINGS = {
  kb: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['KeyZ', 'Space'], shoot: ['KeyX'], rush: ['KeyC', 'ShiftLeft', 'ShiftRight'],
    next: ['KeyE'], prev: ['KeyQ'], pause: ['Escape', 'KeyP', 'Enter'],
    confirm: ['Enter', 'Space', 'KeyZ'], back: ['Escape', 'KeyX', 'Backspace'],
  },
  // Standard gamepad mapping: 0=A/Cross 1=B/Circle 2=X/Square 3=Y/Triangle 4=LB 5=RB 6=LT 7=RT 9=Start 12-15=dpad
  pad: {
    left: [14], right: [15], up: [12], down: [13],
    jump: [0, 3], shoot: [2, 6], rush: [1, 7], next: [5], prev: [4], pause: [9],
    confirm: [0], back: [1],
  },
};

const DEADZONE = 0.3;      // radial stick deadzone
const AXIS_ON = 0.5;       // digital threshold after deadzone

export function keyLabel(code) {
  return code.replace('Key', '').replace('Arrow', '').replace('Digit', '').replace('ShiftLeft', 'L-SHIFT')
    .replace('ShiftRight', 'R-SHIFT').replace('Escape', 'ESC').replace('Space', 'SPACE').replace('Enter', 'ENTER').toUpperCase();
}

export class Input {
  constructor(bindings) {
    this.setBindings(bindings);
    this.keys = new Set();
    this.latched = new Set();     // keys pressed since last poll (so quick taps are never lost)
    this.just = new Set();        // raw keys that went down this poll step (debug hotkeys etc.)
    this.cur = {}; this.prev = {};
    this.padName = null;
    this.onToast = () => {};
    this.captureCb = null;
    const block = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Backspace']);
    addEventListener('keydown', (e) => {
      if (block.has(e.code)) e.preventDefault();
      if (this.captureCb) { e.preventDefault(); const cb = this.captureCb; this.captureCb = null; cb(e.code); return; }
      if (!e.repeat) { this.keys.add(e.code); this.latched.add(e.code); }
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('gamepadconnected', (e) => this.onToast('GAMEPAD CONNECTED: ' + e.gamepad.id.slice(0, 28)));
    addEventListener('gamepaddisconnected', () => this.onToast('GAMEPAD DISCONNECTED'));
  }

  setBindings(b) {
    const base = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    if (b && b.kb) for (const a of ACTIONS) if (Array.isArray(b.kb[a]) && b.kb[a].length) base.kb[a] = b.kb[a];
    if (b && b.pad) for (const a of ACTIONS) if (Array.isArray(b.pad[a]) && b.pad[a].length) base.pad[a] = b.pad[a];
    this.bind = base;
  }

  // Ask for the next key (or pad button) press; used by the key-remap screen.
  capture(cb) { this.captureCb = cb; }
  capturePad() {   // returns a pressed pad button index or -1
    const p = this._pad();
    if (!p) return -1;
    for (let i = 0; i < p.buttons.length; i++) if (p.buttons[i].pressed) return i;
    return -1;
  }

  _pad() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of list) if (p && p.connected) { this.padName = p.id; return p; }
    this.padName = null;
    return null;
  }

  // Called once per fixed update step.
  poll() {
    this.prev = this.cur; this.cur = {};
    this.just = this.latched; this.latched = new Set();
    const pad = this._pad();
    let ax = 0, ay = 0;
    if (pad) {
      ax = pad.axes[0] || 0; ay = pad.axes[1] || 0;
      if (Math.hypot(ax, ay) < DEADZONE) { ax = 0; ay = 0; }
    }
    for (const a of ACTIONS) {
      let d = false;
      for (const k of this.bind.kb[a]) if (this.keys.has(k) || this.just.has(k)) { d = true; break; }
      if (!d && pad) {
        for (const bi of this.bind.pad[a]) { const btn = pad.buttons[bi]; if (btn && (btn.pressed || btn.value > 0.5)) { d = true; break; } }
        if (!d) {
          if (a === 'left' && ax < -AXIS_ON) d = true;
          else if (a === 'right' && ax > AXIS_ON) d = true;
          else if (a === 'up' && ay < -AXIS_ON) d = true;
          else if (a === 'down' && ay > AXIS_ON) d = true;
        }
      }
      this.cur[a] = d;
    }
  }

  down(a) { return !!this.cur[a]; }
  pressed(a) { return !!this.cur[a] && !this.prev[a]; }
  released(a) { return !this.cur[a] && !!this.prev[a]; }
  key(code) { return this.just.has(code); }   // raw key pressed this step
}
