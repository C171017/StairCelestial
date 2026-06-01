/** Tunable durations for the eye audio consent intro (seconds). */
export const AUDIO_CONSENT_TIMING = {
  blackHold: 0.16,
  revealClosedEye: 0.22,
  closedEyeHold: 0.12,
  lidOpen: 1.05,
  openEyeHold: 0.18,
  isolateEye: 0.36,
  morphToPlay: 0.75,
  hold: 2.5,
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
    t.hold +
    t.overlayFade
  );
}
