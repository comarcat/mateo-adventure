// Canvas setup, pixel-perfect (integer) scaling and fullscreen.
import { W, H } from '../config.js';

export class Gfx {
  constructor(canvas, container) {
    this.canvas = canvas; this.container = container;
    this.ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = W; canvas.height = H;
    this.ctx.imageSmoothingEnabled = false;
    this.scale = 1;
    this.resize = this.resize.bind(this);
    addEventListener('resize', this.resize);
    document.addEventListener('fullscreenchange', this.resize);
    const fsBtn = document.getElementById('fs');
    if (fsBtn && !this.fullscreenSupported) fsBtn.style.display = 'none';
    this.resize();
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = this.container.clientWidth * dpr, vh = this.container.clientHeight * dpr;
    const m = Math.min(vw / W, vh / H);
    this.scale = m >= 1 ? Math.floor(m) : m;      // integer scale whenever the window is big enough
    this.canvas.style.width = (W * this.scale) / dpr + 'px';
    this.canvas.style.height = (H * this.scale) / dpr + 'px';
  }
  get fullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  get fullscreenSupported() { const el = this.container; return !!(el.requestFullscreen || el.webkitRequestFullscreen); }
  // Never throws: browsers reject the request without a user gesture, and some (iPhone Safari) have no fullscreen at all.
  toggleFullscreen() {
    if (!this.fullscreenSupported) return false;
    const el = this.container;
    try {
      const r = this.fullscreen ? (document.exitFullscreen || document.webkitExitFullscreen).call(document) : (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (r && r.catch) r.catch(() => {});
    } catch (e) { return false; }
    return true;
  }
}
