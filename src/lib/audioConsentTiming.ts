/** Tunable durations for the eye audio consent intro (seconds). */
export const AUDIO_CONSENT_TIMING = {
  blackHold: 0.16,
  revealClosedEye: 0.22,
  closedEyeHold: 0.12,
  lidOpen: 1.05,
  openEyeHold: 0.32,
  isolateEye: 0.36,
  morphToPlay: 0.75,
  starCrossfade: 1.48,
  starOnlyHold: 0.44,
  mainReveal: 1.05,
  clickedStarCrossfade: 0.38,
  clickedMainReveal: 0.72,
  overlayFade: 0.6,
  reducedMotionHold: 0.5,
} as const;

export function getIntroDurationSeconds(reducedMotion: boolean): number {
  const t = AUDIO_CONSENT_TIMING;
  if (reducedMotion) {
    return t.reducedMotionHold + t.overlayFade;
  }
  return (
    t.blackHold +
    t.revealClosedEye +
    t.closedEyeHold +
    t.lidOpen +
    t.openEyeHold +
    t.isolateEye +
    t.morphToPlay +
    t.starCrossfade +
    t.starOnlyHold +
    t.mainReveal
  );
}
