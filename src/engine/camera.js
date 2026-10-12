import { W, H } from '../config.js';

export class Camera {
  constructor() { this.x = 0; this.y = 0; this.shakeT = 0; this.shakeMag = 0; this.ox = 0; this.oy = 0; }
  shake(mag = 3, frames = 12) { if (mag >= this.shakeMag || this.shakeT <= 0) { this.shakeMag = mag; this.shakeT = frames; } }
  snap(target, mapPxW, mapPxH) {
    this.x = this._tx(target); this.y = this._ty(target);
    this._clamp(mapPxW, mapPxH); this._apply();
  }
  _tx(t) { return t.x + t.w / 2 - W / 2 + (t.facing || 1) * 20; }
  _ty(t) { return t.y + t.h / 2 - H / 2 - 8; }
  follow(target, mapPxW, mapPxH) {
    this.x += (this._tx(target) - this.x) * 0.12;
    this.y += (this._ty(target) - this.y) * 0.1;
    this._clamp(mapPxW, mapPxH);
    this._apply();
  }
  lockAt(x, y) { this.x = x; this.y = y; this._apply(); }
  _clamp(mw, mh) {
    this.x = Math.max(0, Math.min(this.x, Math.max(0, mw - W)));
    this.y = Math.max(0, Math.min(this.y, Math.max(0, mh - H)));
  }
  _apply() {
    let sx = 0, sy = 0;
    if (this.shakeT > 0) { this.shakeT--; sx = (Math.random() * 2 - 1) * this.shakeMag; sy = (Math.random() * 2 - 1) * this.shakeMag; if (this.shakeT <= 0) this.shakeMag = 0; }
    this.ox = Math.round(this.x + sx); this.oy = Math.round(this.y + sy);
  }
}
