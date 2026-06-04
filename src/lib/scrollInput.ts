/** Wheel / swipe down → descend the spiral (negative virtual index direction). */
export const SCROLL_CLIMB_SIGN = -1;

/** Pixels of wheel/touch delta → unbounded scroll offset (0–1 scale per lap). */
export const SCROLL_SENSITIVITY = 1 / 1200;

/** Cap offset change per frame to avoid spikes on janky input. */
export const MAX_OFFSET_STEP_PER_FRAME = 0.06;

export const SCROLL_INPUT_THRESHOLD = 0.000025;

export const PORTFOLIO_SCROLL_SURFACE_ID = "portfolio-scroll-surface";

export function clampOffsetStep(value: number, max = MAX_OFFSET_STEP_PER_FRAME): number {
  return Math.max(-max, Math.min(max, value));
}

export function pixelsToOffsetDelta(deltaY: number): number {
  return SCROLL_CLIMB_SIGN * deltaY * SCROLL_SENSITIVITY;
}
