/** Wheel down → descend the spiral (negative virtual index). */
export const SCROLL_CLIMB_SIGN = -1;

/** Max tracker step per frame on normal integration (non-wrap). */
export const MAX_TRACKER_STEP = 0.06;

/** Min |Δoffset| to treat as Drei infinite teleport (not fast damp). */
export const RESET_DISCONTINUITY = 0.45;

/** Drei infinite-reset signatures (offset discontinuity). */
export const DREI_RESET_HIGH_LAST = 0.7;
export const DREI_RESET_LOW_OFFSET = 0.25;
/** Drei top-wrap leaves `offset` just below ~0; keep tight to avoid false resets. */
export const DREI_RESET_LOW_LAST = 0.12;
export const DREI_RESET_HIGH_OFFSET = 0.75;

function clampStep(value: number, max: number): number {
  return Math.max(-max, Math.min(max, value));
}

/**
 * Delta to add to the unbounded scroll tracker for one frame, given Drei
 * `scroll.offset` values before/after damping for this frame (`last`, `o`).
 */
export function computeTrackerStep(last: number, o: number): number {
  const diff = SCROLL_CLIMB_SIGN * (o - last);
  const offsetJump = Math.abs(o - last);

  const dreiForwardReset =
    offsetJump > RESET_DISCONTINUITY &&
    last > DREI_RESET_HIGH_LAST &&
    o < DREI_RESET_LOW_OFFSET;
  const dreiBackwardReset =
    offsetJump > RESET_DISCONTINUITY &&
    last < DREI_RESET_LOW_LAST &&
    o > DREI_RESET_HIGH_OFFSET;

  if (dreiForwardReset) {
    return SCROLL_CLIMB_SIGN * (1 - last + o);
  }
  if (dreiBackwardReset) {
    return SCROLL_CLIMB_SIGN * (o - 1 - last);
  }
  return clampStep(diff, MAX_TRACKER_STEP);
}
