/** One clock carries the eye handoff, iris shaping and sculpture entrance.
 * Changing the interaction phase must never restart any of these motions. */
export const CONTROL_ENTRANCE_SECONDS = 9.05;
export const CONTROL_EYE_DISSOLVE_SECONDS = 0.85;
export const CONTROL_SHAPE_FORMED_SECONDS = 3.25;
export const CONTROL_ENTRANCE_TURNS = 2;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Integral of a gentle base speed plus sin² acceleration, with a soft landing.
 * It moves immediately, peaks halfway, and arrives with zero angular velocity. */
export function entranceTurnProgress(value: number) {
  const t = clamp(value);
  const accelerated = t - Math.sin(2 * Math.PI * t) / (2 * Math.PI);
  const slowStart = 2 * t - t * t;
  return 0.94 * accelerated + 0.06 * slowStart;
}

export function sampleControlEntrance(elapsed: number, reducedMotion = false) {
  if (reducedMotion) return {
    elapsed, reveal: 1, travel: 1, turn: 0, shapeMorph: 1,
  };
  // Shape, shading, and travel share a continuous clock with no sphere hold.
  const t = clamp(elapsed / CONTROL_ENTRANCE_SECONDS);
  const shapeMorph = smooth(elapsed / CONTROL_SHAPE_FORMED_SECONDS);
  return {
    elapsed,
    reveal: smooth(elapsed / CONTROL_EYE_DISSOLVE_SECONDS),
    shapeMorph,
    travel: entranceTurnProgress(t),
    turn: entranceTurnProgress(t) * Math.PI * 2 * CONTROL_ENTRANCE_TURNS
      * smooth(shapeMorph / 0.55),
  };
}

export type ControlEntrance = ReturnType<typeof sampleControlEntrance>;
