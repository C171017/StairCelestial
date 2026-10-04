export const SKY_EFFECTS_PERIOD = 120;

export type SkyEffect = {
  kind: "meteor" | "glint";
  start: number;
  duration: number;
  azimuth: number;
  height: number;
  tilt: number;
  intensity: number;
};

// Sparse world events, independent of cloud motion, scroll, and day/night.
// Lighting controls their visibility; daytime remains quiet.
export const SKY_EFFECTS: readonly SkyEffect[] = [
  { kind: "meteor", start: 12.4, duration: 2.8, azimuth: Math.PI + 0.12, height: 32, tilt: -0.3, intensity: 0.8 },
  { kind: "meteor", start: 37.6, duration: 2.5, azimuth: Math.PI * 0.52, height: 39, tilt: -0.23, intensity: 0.72 },
  { kind: "meteor", start: 61.2, duration: 2.6, azimuth: 0.1, height: 29, tilt: -0.38, intensity: 0.76 },
  { kind: "meteor", start: 85.7, duration: 2.7, azimuth: Math.PI * 1.49, height: 36, tilt: -0.28, intensity: 0.72 },
  { kind: "meteor", start: 109.3, duration: 2.6, azimuth: Math.PI - 0.38, height: 26, tilt: -0.34, intensity: 0.76 },
  { kind: "glint", start: 25.1, duration: 4.6, azimuth: Math.PI - 0.39, height: 43, tilt: 0.15, intensity: 0.24 },
  { kind: "glint", start: 74.6, duration: 4.8, azimuth: Math.PI * 1.52, height: 37, tilt: -0.1, intensity: 0.20 },
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
  } else if (effect.kind === "meteor") {
    target.opacity = effect.intensity * smoothstep(0, 0.2, progress) * (1 - smoothstep(0.57, 1, progress));
  } else {
    // A single slow breath, with zero velocity at both ends; no blinking.
    target.opacity = effect.intensity * Math.sin(progress * Math.PI) ** 2;
  }
  return target;
}

export function advanceSkyEffectsTime(elapsed: number, delta: number, paused: boolean) {
  // Bound the first frame after a suspended browser without jumping an effect.
  return paused ? elapsed : skyEffectsPhase(elapsed + Math.max(0, Math.min(delta, 0.1)));
}
