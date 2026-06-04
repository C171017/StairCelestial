/** Tunable durations for the eye audio consent intro (seconds). */
export const AUDIO_CONSENT_TIMING = {
  blackHold: 0,
  revealClosedEye: 0.32,
  closedEyeHold: 0,
  /** Lid motion begins this far into revealClosedEye (overlap = mysterious open). */
  lidOpenOverlap: 0.38,
  lidOpen: 1.18,
  openEyeHold: 0.28,
  /** After the eye is fully open, eye artwork fades out (not instant). */
  eyeVanishAfterOpen: 0.58,
  starCrossfade: 1.2,
  /** Wait for click before auto-enter (3D play control). */
  clickAwaitDuration: 5,
  /** Triangle flies to viewport dock while main scene reveals. */
  flyDuration: 1.05,
  mainRevealDuration: 1.05,
  /** Idle motion during awaitClick (radians / scale). */
  idleRotateAmplitude: 0.052,
  idleScalePulse: 0.028,
  idleMotionPeriod: 2.4,
  mainReveal: 1.05,
  overlayFade: 0.6,
  /** BGM swell during fly-away + scene reveal (seconds). */
  ambientIntroFadeIn: 3.4,
  /** BGM when re-enabling from the docked play control (seconds). */
  ambientToggleFadeIn: 2.2,
  /** BGM when muting from the docked play control (seconds). */
  ambientFadeOut: 1.5,
  /** Play tetrahedron ↔ pause cube crossfade (seconds). */
  playShapeCrossfade: 0.52,
  reducedMotionHold: 0.5,
  /** Reduced-motion shortcuts */
  reducedClickAwait: 0.35,
  reducedFlyDuration: 0.2,
  reducedMainReveal: 0.35,
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
    return t.reducedMotionHold + t.reducedMainReveal;
  }
  return (
    t.blackHold +
    t.revealClosedEye +
    t.closedEyeHold +
    t.lidOpen +
    t.openEyeHold +
    t.eyeVanishAfterOpen +
    t.clickAwaitDuration +
    Math.max(t.flyDuration, t.mainRevealDuration)
  );
}
