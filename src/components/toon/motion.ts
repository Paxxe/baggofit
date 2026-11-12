export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Smoothstep between two progress marks. */
export const smooth = (start: number, end: number, value: number) => {
  const amount = clamp01((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

export const easeInOut = (value: number) => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2);

/** Overshoots past 1 and settles back: cartoon "pop". */
export const backOut = (value: number) => {
  if (value <= 0) return 0;
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
};

/** Damped spring for follow-through and overshoot. */
export class Spring {
  velocity = 0;
  value: number;
  constructor(value: number) {
    this.value = value;
  }

  step(target: number, dt: number, stiffness: number, damping: number) {
    // Two half-steps keep stiff springs stable at low frame rates.
    const h = dt / 2;
    for (let i = 0; i < 2; i += 1) {
      this.velocity += (-stiffness * (this.value - target) - damping * this.velocity) * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }
}
