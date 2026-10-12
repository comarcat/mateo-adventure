// Stage 1 placeholder. Stage 4 replaces this with the Web Audio chiptune engine (same interface).
export class Audio {
  constructor() { this.enabled = false; }
  unlock() {}
  sfx(name) {}
  music(name, loop = true) {}
  stopMusic() {}
}
