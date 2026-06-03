/** Tunable durations for the eye audio consent intro (seconds). */
export const AUDIO_CONSENT_TIMING = {
  blackHold: 0,
  revealClosedEye: 0.32,
  closedEyeHold: 0,
  /** Lid motion begins this far into revealClosedEye (overlap = mysterious open). */
  lidOpenOverlap: 0.38,
  lidOpen: 1.18,
  openEyeHold: 0.22,
  isolateEye: 0.36,
  morphToPlay: 0.75,
  starCrossfade: 1.2,
  /** Play phase: crossfade control out while stairs/doors fade in. */
  playSceneCrossfade: 5.75,
  /** Fade iris, lids, and sclera while the play control is shown. */
  playEyeFade: 4.2,
  mainReveal: 1.05,
  /** Tap during play phase: finish the scene crossfade. */
  clickedSceneCrossfade: 0.82,
  overlayFade: 0.6,
  reducedMotionHold: 0.5,
} as const;

export function getLidOpenStart(t: typeof AUDIO_CONSENT_TIMING = AUDIO_CONSENT_TIMING) {
  return t.blackHold + t.revealClosedEye * t.lidOpenOverlap;
}

export function getStarRevealStart(
  t: typeof AUDIO_CONSENT_TIMING = AUDIO_CONSENT_TIMING,
) {
  return getLidOpenStart(t) + t.lidOpen;
}

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
    t.playSceneCrossfade
  );
}
