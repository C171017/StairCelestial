/**
 * Square size for the eye / play control (side length as a fraction of
 * the visible viewport).
 * Keep in sync with `getEyeControlSidePx` in eyeControlMetrics.ts.
 */
export const EYE_CONTROL_VIEWPORT_FRACTION = 0.9;
export const EYE_CONTROL_MARGIN_PX = 32;

/**
 * Runtime code sets --eye-control-side from window.visualViewport. The fallback
 * keeps the control correctly sized before the first layout effect runs.
 */
export const EYE_CONTROL_SIZE_CLASS =
  "size-[var(--eye-control-side,min(90dvw,90dvh,calc(100dvw-32px),calc(100dvh-32px)))] shrink-0";
