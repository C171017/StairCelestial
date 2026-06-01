/** Tunable durations for the eye audio consent intro (seconds). */
export const AUDIO_CONSENT_TIMING = {
  lidOpen: 1.0,
  isolateEye: 0.5,
  morphToPlay: 0.8,
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
    t.lidOpen +
    t.isolateEye +
    t.morphToPlay +
    t.hold +
    t.overlayFade
  );
}
