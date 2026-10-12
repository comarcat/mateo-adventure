// Score boards behind one interface, so an online leaderboard can be plugged in without touching the game.
// Every method is async (returns a Promise) even for the local board, so callers never assume instant results.
//
//   mode 'classic': {name, score, world, time, date}        mode 'endless': {name, score, distance, seed, date}
//
// IMPORTANT: LocalScoreBoard stores scores in the browser's localStorage, so a player can edit them (devtools).
// A real global leaderboard must validate on the SERVER (replay/seed + input log, plausibility limits, rate limits,
// signed submissions) - the client can never be trusted. RemoteScoreBoard below is only a sketch of the wire format.
const MAX = 10;
export const MODES = ['classic', 'endless'];

export const cleanName = (n) => String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'AAA';
const num = (v, max = 1e9) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

export class ScoreBoard {
  async top(mode, n = MAX) { throw new Error('not implemented'); }
  async qualifies(mode, score) { throw new Error('not implemented'); }
  async submit(mode, entry) { throw new Error('not implemented'); }     // resolves {rank (1-based or 0), entries}
}

export class LocalScoreBoard extends ScoreBoard {
  constructor(save) { super(); this.save = save; }
  _list(mode) { const l = this.save.scores[mode]; return Array.isArray(l) ? l : (this.save.scores[mode] = []); }
  async top(mode, n = MAX) { return this._list(mode).slice(0, n); }
  async qualifies(mode, score) {
    const l = this._list(mode); score = num(score);
    return score > 0 && (l.length < MAX || score > l[l.length - 1].score);
  }
  async submit(mode, entry) {
    const e = { name: cleanName(entry.name), score: num(entry.score), date: Date.now() };
    if (mode === 'classic') { e.world = num(entry.world, 8); e.time = num(entry.time, 1e7); }
    else { e.distance = num(entry.distance); e.seed = String(entry.seed || '').slice(0, 12); }
    const l = this._list(mode);
    l.push(e); l.sort((a, b) => b.score - a.score);
    l.length = Math.min(l.length, MAX);
    this.save.flush();
    return { rank: l.indexOf(e) + 1, entries: l.slice() };
  }
}

// Sketch of a server-backed board (not used by default). Expected API:
//   GET  {base}/scores?mode=endless&limit=10        -> [{name,score,...}]
//   POST {base}/scores {mode, entry, proof}         -> {rank}      (server re-simulates/validates `proof`)
export class RemoteScoreBoard extends ScoreBoard {
  constructor(baseUrl) { super(); this.base = baseUrl; }
  async top(mode, n = MAX) { const r = await fetch(`${this.base}/scores?mode=${mode}&limit=${n}`); return r.ok ? r.json() : []; }
  async qualifies(mode, score) { return score > 0; }
  async submit(mode, entry, proof = null) {
    const r = await fetch(`${this.base}/scores`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, entry, proof }) });
    return r.ok ? r.json() : { rank: 0, entries: [] };
  }
}
