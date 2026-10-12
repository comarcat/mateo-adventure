// Fixed-size object pool: no allocations during play (bullets, particles).
export class Pool {
  constructor(size, factory) {
    this.items = Array.from({ length: size }, factory);
    this.cursor = 0;
  }
  // Returns a free item, or recycles the oldest one if the pool is exhausted.
  acquire() {
    const n = this.items.length;
    for (let i = 0; i < n; i++) {
      const it = this.items[(this.cursor + i) % n];
      if (!it.active) { this.cursor = (this.cursor + i + 1) % n; it.active = true; return it; }
    }
    const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % n; it.active = true; return it;
  }
  each(fn) { for (const it of this.items) if (it.active) fn(it); }
  clear() { for (const it of this.items) it.active = false; }
}
