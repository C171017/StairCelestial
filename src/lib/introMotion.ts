/** Seconds to ease auto-scroll and star yaw from 0 → full speed. */
export const INTRO_SCROLL_RAMP_SECONDS = 3.2;

export function introMotionBlend(elapsedSeconds: number): number {
  const t = Math.max(0, Math.min(1, elapsedSeconds / INTRO_SCROLL_RAMP_SECONDS));
  return t * t * (3 - 2 * t);
}
