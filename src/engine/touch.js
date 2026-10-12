// Optional on-screen controls for phones/tablets. Shown automatically on touch devices (or after the first touch),
// can be toggled with the T key. Buttons feed the same abstract actions as keyboard/gamepad (Input.touch).
const LAYOUT = [
  // id, label, actions pressed, css position, size
  ['left',  '◀', ['left'],  'left:10px;bottom:62px', 56],
  ['right', '▶', ['right'], 'left:134px;bottom:62px', 56],
  ['up',    '▲', ['up'],    'left:72px;bottom:118px', 52],
  ['down',  '▼', ['down'],  'left:72px;bottom:6px', 52],
  ['jump',  'A',      ['jump', 'confirm'], 'right:14px;bottom:60px', 62],
  ['rush',  'B',      ['rush', 'back'],    'right:88px;bottom:30px', 52],
  ['shoot', 'X',      ['shoot'],           'right:88px;bottom:96px', 52],
  ['next',  'Q/E',    ['next'],  'right:14px;bottom:130px', 40],
  ['pause', 'II',     ['pause'], 'right:14px;top:8px', 38],
];

export class TouchControls {
  constructor(container, input) {
    this.input = input; this.root = document.createElement('div'); this.root.id = 'touch';
    this.root.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;display:none;user-select:none;-webkit-user-select:none;touch-action:none';
    this.pointers = new Map();               // pointerId -> button id
    for (const [id, label, actions, pos, size] of LAYOUT) {
      const b = document.createElement('div');
      b.textContent = label; b.dataset.id = id;
      b.style.cssText = `position:absolute;${pos};width:${size}px;height:${size}px;border-radius:${id === 'jump' || id === 'rush' || id === 'shoot' ? '50%' : '14px'};` +
        'background:rgba(42,27,61,0.55);border:3px solid rgba(255,216,74,0.7);color:#ffd84a;font:bold 15px monospace;display:flex;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;';
      const down = (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointers */ } this.pointers.set(e.pointerId, id); this.set(actions, true); b.style.background = 'rgba(255,216,74,0.55)'; this.input.audioUnlock && this.input.audioUnlock(); };
      const up = (e) => { if (!this.pointers.has(e.pointerId)) return; this.pointers.delete(e.pointerId); if (![...this.pointers.values()].includes(id)) { this.set(actions, false); b.style.background = 'rgba(42,27,61,0.55)'; } };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      this.root.appendChild(b);
    }
    container.appendChild(this.root);
    this.enabled = false;
    const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (coarse) this.show(true);
    addEventListener('touchstart', () => { if (!this.enabled) this.show(true); }, { passive: true, once: true });
  }
  set(actions, on) { for (const a of actions) { this.input.touch[a] = on; if (on) this.input.touchLatch.add(a); } }
  show(on) {
    this.enabled = on; this.root.style.display = on ? 'block' : 'none';
    const fs = document.getElementById('fs');
    if (fs) { fs.style.top = on ? '8px' : 'auto'; fs.style.bottom = on ? 'auto' : '8px'; fs.style.left = on ? '8px' : 'auto'; fs.style.right = on ? 'auto' : '8px'; } if (!on) { for (const k of Object.keys(this.input.touch)) this.input.touch[k] = false; } }
  toggle() { this.show(!this.enabled); return this.enabled; }
}
