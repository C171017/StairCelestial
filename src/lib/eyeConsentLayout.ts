/**
 * Square size for the eye / play control (~2× prior 60vmin target).
 *
 * min(120vmin, calc(100vw - 2rem), calc(100vh - 2rem)):
 * - 120vmin → 2× the earlier 60vmin goal (clamped by the other terms)
 * - 100vw - 2rem → horizontal margin
 * - 100vh - 2rem → vertical margin (no label below)
 */
export const EYE_CONTROL_SIZE_CLASS =
  "size-[min(120vmin,calc(100vw-2rem),calc(100vh-2rem))] shrink-0";
