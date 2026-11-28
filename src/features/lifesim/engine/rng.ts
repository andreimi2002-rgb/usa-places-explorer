/** Small seeded PRNG (mulberry32). The state is a 32-bit integer stored in the save, so lives replay identically. */
export class Rng {
  constructor(public state: number) {}
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  int(lo: number, hi: number): number {
    return Math.floor(this.range(lo, hi + 1));
  }
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]!;
  }
  weighted<T>(items: readonly T[], weight: (t: T) => number): T | null {
    const total = items.reduce((s, t) => s + Math.max(0, weight(t)), 0);
    if (total <= 0) return null;
    let r = this.next() * total;
    for (const t of items) {
      r -= Math.max(0, weight(t));
      if (r <= 0) return t;
    }
    return items[items.length - 1] ?? null;
  }
}

export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
