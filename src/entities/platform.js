// Moving platform: a one-way slab that carries the hero. Moves back and forth along one axis.
export class Platform {
  constructor(d) {   // d in pixels: {x,y,w,axis:'x'|'y',range,speed,phase}
    this.ox = d.x; this.oy = d.y; this.x = d.x; this.y = d.y; this.w = d.w || 32; this.h = 8;
    this.axis = d.axis || 'x'; this.range = d.range || 48; this.speed = d.speed || 0.6;
    this.pos = (d.phase || 0) * this.range; this.dir = 1; this.dx = 0; this.dy = 0;
  }
  update() {
    const px = this.x, py = this.y;
    this.pos += this.dir * this.speed;
    if (this.pos > this.range) { this.pos = this.range; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    if (this.axis === 'x') this.x = this.ox + this.pos; else this.y = this.oy + this.pos;
    this.dx = this.x - px; this.dy = this.y - py;
  }
  draw(ctx, img) {
    for (let x = 0; x < this.w; x += 32) ctx.drawImage(img, Math.round(this.x + x), Math.round(this.y));
  }
}
