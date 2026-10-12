// Global constants. Internal resolution is 256x224 (NES/SNES-like), tiles are 16x16.
export const W = 256;
export const H = 224;
export const T = 16;
export const STEP_MS = 1000 / 60;

// Debug/cheat tools: enable with ?debug in the URL (or set localStorage 'mateo.debug' = '1').
export const DEBUG = (() => {
  try {
    return new URLSearchParams(location.search).has('debug') || localStorage.getItem('mateo.debug') === '1';
  } catch (e) { return false; }
})();
