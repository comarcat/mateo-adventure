// Moving platform ("lift"): a one-way slab that carries the hero. Moves back and forth along one axis.
// The drawn slab matches the hitbox exactly: the bright line on top IS the surface you stand on.
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
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y), w = this.w;
    ctx.fillStyle = '#2a1b3d'; ctx.fillRect(x, y, w, 11);                       // outline
    ctx.fillStyle = '#7e8aa8'; ctx.fillRect(x + 1, y + 2, w - 2, 7);             // body
    ctx.fillStyle = '#566080'; ctx.fillRect(x + 1, y + 7, w - 2, 2);             // underside shade
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(x, y, w, 1);                          // SURFACE: bright, exactly at the hitbox top
    ctx.fillStyle = '#f4f8ff'; ctx.fillRect(x + 1, y + 1, w - 2, 2);
    ctx.fillStyle = '#2a1b3d'; for (let i = 8; i < w - 4; i += 8) ctx.fillRect(x + i, y + 4, 2, 2);   // rivets
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 1, y + 2, 2, 7); ctx.fillRect(x + w - 3, y + 2, 2, 7);  // end caps
  }
}
