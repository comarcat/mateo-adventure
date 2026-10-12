// Versioned localStorage persistence. Every access is wrapped in try/catch (private mode, quota, disabled storage).
// NOTE: anything stored locally can be edited by the player. A global leaderboard would need
// server-side validation; see ScoreBoard in scores.js (Stage 6) for the pluggable interface.
const KEY = 'mateo-adventure';
const VERSION = 1;

const defaults = () => ({
  version: VERSION,
  settings: { master: 0.8, music: 0.7, sfx: 0.8, muted: false, difficulty: 'normal', bindings: null },
  progress: { lives: 3, cleared: {}, powers: [], world: 1 },
  scores: { classic: [], endless: [] },
});

function migrate(d) {
  // Future format changes go here: if (d.version < 2) {...; d.version = 2}
  const base = defaults();
  return {
    version: VERSION,
    settings: { ...base.settings, ...(d.settings || {}) },
    progress: { ...base.progress, ...(d.progress || {}) },
    scores: { ...base.scores, ...(d.scores || {}) },
  };
}

class SaveStore {
  constructor() { this.data = this.load(); }
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch (e) { /* corrupt or unavailable: fall back to defaults */ }
    return defaults();
  }
  flush() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); return true; } catch (e) { return false; } }
  get settings() { return this.data.settings; }
  get progress() { return this.data.progress; }
  get scores() { return this.data.scores; }
  reset() { this.data = defaults(); this.flush(); }
}
export const save = new SaveStore();
