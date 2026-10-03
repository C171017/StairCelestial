/** One clock carries the eye handoff, glass dissolution and sculpture entrance.
 * Changing the interaction phase must never restart any of these motions. */
export const CONTROL_ENTRANCE_SECONDS = 7.8;
export const CONTROL_EYE_DISSOLVE_SECONDS = 1.8;
export const CONTROL_ENTRANCE_TURNS = 1.5;

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
    elapsed, reveal: 1, travel: 1, turn: 0, outerOpacity: 0,
    innerOpacity: 0, outerDissolve: 1, innerDissolve: 1,
  };
  const t = clamp(elapsed / CONTROL_ENTRANCE_SECONDS);
  const outerDissolve = smooth((elapsed - 1.05) / 3.45);
  const innerDissolve = smooth((elapsed - 1.4) / 3.65);
  return {
    elapsed,
    reveal: smooth(elapsed / 1.45),
    travel: entranceTurnProgress(t),
    turn: entranceTurnProgress(t) * Math.PI * 2 * CONTROL_ENTRANCE_TURNS,
    outerOpacity: smooth(elapsed / 0.85) * (1 - outerDissolve),
    innerOpacity: smooth((elapsed - 0.12) / 1.05) * (1 - innerDissolve),
    outerDissolve,
    innerDissolve,
  };
}

export type ControlEntrance = ReturnType<typeof sampleControlEntrance>;
