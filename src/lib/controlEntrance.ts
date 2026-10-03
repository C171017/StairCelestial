/** One clock carries the eye handoff, sphere formation and sculpture entrance.
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
    elapsed, reveal: 1, travel: 1, turn: 0, sphereMorph: 1,
  };
  // Form the object at the eye's center before moving it into the scene.
  const t = clamp((elapsed - CONTROL_SHAPE_FORMED_SECONDS) / (CONTROL_ENTRANCE_SECONDS - CONTROL_SHAPE_FORMED_SECONDS));
  return {
    elapsed,
    reveal: smooth(elapsed / 0.65),
    sphereMorph: smooth((elapsed - 1.25) / (CONTROL_SHAPE_FORMED_SECONDS - 1.25)),
    travel: entranceTurnProgress(t),
    turn: entranceTurnProgress(t) * Math.PI * 2 * CONTROL_ENTRANCE_TURNS,

  };
}

export type ControlEntrance = ReturnType<typeof sampleControlEntrance>;
