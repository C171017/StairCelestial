/**
 * Square size for the eye / play control (side length as a fraction of vmin).
 * Keep in sync with `getEyeControlSidePx` in eyeControlMetrics.ts.
 */
export const EYE_CONTROL_VMIN = 0.9;

/**
 * min(90vmin, calc(100vw - 2rem), calc(100vh - 2rem)):
 * - 90vmin → smaller filter raster (was 120vmin)
 * - 100vw - 2rem → horizontal margin
 * - 100vh - 2rem → vertical margin
 */
export const EYE_CONTROL_SIZE_CLASS =
  "size-[min(90vmin,calc(100vw-2rem),calc(100vh-2rem))] shrink-0";
