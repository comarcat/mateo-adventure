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
  toggleFullscreen() {
    const el = this.container;
    if (this.fullscreen) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
}
