export const SKY_EFFECTS_PERIOD = 116;

export type SkyEffect = {
  kind: "meteor";
  start: number;
  duration: number;
  azimuth: number;
  height: number;
  tilt: number;
  intensity: number;
};

// One clear trail every 13–17 active sunset/night seconds, independent of
// scroll. Several paths face the entrance, while others reward camera orbit.
// The clock pauses only when the atmosphere hides meteors, never at midnight.
export const SKY_EFFECTS: readonly SkyEffect[] = [
  { kind: "meteor", start: 5.0, duration: 1.8, azimuth: Math.PI + 0.12, height: 23, tilt: -0.27, intensity: 0.98 },
  { kind: "meteor", start: 18.0, duration: 2.1, azimuth: Math.PI - 0.42, height: 19, tilt: -0.35, intensity: 0.92 },
  { kind: "meteor", start: 34.0, duration: 1.7, azimuth: Math.PI * 0.52, height: 29, tilt: -0.22, intensity: 0.96 },
  { kind: "meteor", start: 47.0, duration: 2.0, azimuth: Math.PI + 0.36, height: 28, tilt: -0.31, intensity: 0.94 },
  { kind: "meteor", start: 62.0, duration: 1.9, azimuth: Math.PI - 0.20, height: 15, tilt: -0.25, intensity: 0.98 },
  { kind: "meteor", start: 75.0, duration: 2.1, azimuth: 0.1, height: 22, tilt: -0.38, intensity: 0.92 },
  { kind: "meteor", start: 89.0, duration: 1.8, azimuth: Math.PI - 0.34, height: 31, tilt: -0.29, intensity: 0.96 },
  { kind: "meteor", start: 104.0, duration: 2.0, azimuth: Math.PI * 1.49, height: 18, tilt: -0.26, intensity: 0.94 },
];

export type SkyEffectSample = { progress: number; opacity: number };

function smoothstep(low: number, high: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return x * x * (3 - 2 * x);
}

export function skyEffectsPhase(elapsed: number) {
  const phase = elapsed % SKY_EFFECTS_PERIOD;
  return phase < 0 ? phase + SKY_EFFECTS_PERIOD : phase;
}

/** Writes into a reusable sample so the render loop allocates no objects. */
export function sampleSkyEffect(effect: SkyEffect, elapsed: number, target: SkyEffectSample) {
  const progress = (skyEffectsPhase(elapsed) - effect.start) / effect.duration;
  target.progress = Math.max(0, Math.min(1, progress));
  if (progress <= 0 || progress >= 1) {
    target.opacity = 0;
  } else {
    target.opacity = effect.intensity * smoothstep(0, 0.2, progress) * (1 - smoothstep(0.57, 1, progress));
  }
  return target;
}

export function advanceSkyEffectsTime(elapsed: number, delta: number, paused: boolean, visibility = 1) {
  // Bound the first frame after a suspended browser without jumping an effect.
  // Visibility is only an enable gate: changing or reversing world time cannot
  // restart a trail, shorten the cadence, or turn one crossing into a shower.
  if (paused || !Number.isFinite(delta) || !Number.isFinite(visibility) || visibility <= 0.001) return elapsed;
  return skyEffectsPhase(elapsed + Math.max(0, Math.min(delta, 0.1)));
}
