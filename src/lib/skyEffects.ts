export const SKY_EFFECTS_PERIOD = 32;

export type SkyEffect = {
  kind: "meteor" | "glint";
  start: number;
  duration: number;
  azimuth: number;
  height: number;
  tilt: number;
  intensity: number;
};

// Positions describe the environment, never the camera. The first meteor is
// visible from the entrance; later events reward looking around the orbit.
export const SKY_EFFECTS: readonly SkyEffect[] = [
  { kind: "meteor", start: 2.7, duration: 2.8, azimuth: Math.PI + 0.12, height: 27, tilt: -0.3, intensity: 0.94 },
  { kind: "meteor", start: 8.1, duration: 2.5, azimuth: Math.PI * 0.52, height: 30, tilt: -0.23, intensity: 0.85 },
  { kind: "meteor", start: 13.4, duration: 2.6, azimuth: 0.1, height: 25, tilt: -0.38, intensity: 0.9 },
  { kind: "meteor", start: 18.5, duration: 2.7, azimuth: Math.PI * 1.49, height: 31, tilt: -0.28, intensity: 0.85 },
  { kind: "meteor", start: 23.1, duration: 2.6, azimuth: Math.PI - 0.38, height: 22, tilt: -0.34, intensity: 0.9 },
  { kind: "meteor", start: 27.6, duration: 2.5, azimuth: 0.75, height: 28, tilt: -0.25, intensity: 0.85 },
  { kind: "glint", start: 6.1, duration: 3.6, azimuth: Math.PI - 0.39, height: 34, tilt: 0.15, intensity: 0.45 },
  { kind: "glint", start: 10.6, duration: 4.1, azimuth: Math.PI * 1.52, height: 17, tilt: -0.1, intensity: 0.38 },
  { kind: "glint", start: 16.8, duration: 3.8, azimuth: Math.PI * 0.37, height: 32, tilt: 0.2, intensity: 0.42 },
  { kind: "glint", start: 21.7, duration: 4.0, azimuth: Math.PI + 0.33, height: 15, tilt: -0.12, intensity: 0.4 },
  { kind: "glint", start: 26.1, duration: 3.8, azimuth: 0.25, height: 37, tilt: 0.1, intensity: 0.38 },
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
