import { W, H } from '../config.js';

export class Camera {
  constructor() { this.look = 20; this.x = 0; this.y = 0; this.shakeT = 0; this.shakeMag = 0; this.ox = 0; this.oy = 0; }
  shake(mag = 3, frames = 12) { if (mag >= this.shakeMag || this.shakeT <= 0) { this.shakeMag = mag; this.shakeT = frames; } }
  snap(target, mapPxW, mapPxH) {
    this.look = (target.facing || 1) * 20;
    this.x = this._tx(target); this.y = this._ty(target);
    this._clamp(mapPxW, mapPxH); this._apply();
  }
  _tx(t) { return t.x + t.w / 2 - W / 2 + this.look; }
  _ty(t) { return t.y + t.h / 2 - H / 2 - 8; }
  follow(target, mapPxW, mapPxH) {
    // gentle follow: the look-ahead eases slowly (no snapping when you turn), speed is capped, and vertical motion has a dead zone
    this.look += ((target.facing || 0) * 20 - this.look) * 0.025;
    const dx = (this._tx(target) - this.x) * 0.06;
    this.x += Math.max(-3.6, Math.min(3.6, dx));
    const dy = this._ty(target) - this.y;
    if (Math.abs(dy) > 30) this.y += Math.max(-3, Math.min(3, (dy - Math.sign(dy) * 30) * 0.06));
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
