/** Linear-light colors shared by the sky, object lights, and reflections. */
export type AtmosphereColor = [number, number, number];
export interface SanctuaryAtmosphere {
  userTravel: number;
  /** Unwrapped clock angle: noon at zero, midnight at PI. */
  solarPhase: number;
  daylight: number;
  dusk: number;
  night: number;
  starVisibility: number;
  keyDirection: [number, number, number];
  skyZenith: AtmosphereColor;
  skyHorizon: AtmosphereColor;
  skyLower: AtmosphereColor;
  cloudHighlight: AtmosphereColor;
  cloudShadow: AtmosphereColor;
  cloudHaze: AtmosphereColor;
  keyColor: AtmosphereColor;
  fillColor: AtmosphereColor;
  ambientColor: AtmosphereColor;
  reflectionTint: AtmosphereColor;
  keyIntensity: number;
  fillIntensity: number;
  ambientIntensity: number;
  environmentIntensity: number;
}

// One complete clock cycle is eight user-driven ribbon turns. The finite door
// pool and automatic idle cruise have no part in this coordinate.
export const ATMOSPHERE_CYCLE_TURNS = 8;
const TAU = Math.PI * 2;
const colorKeys = ["skyZenith", "skyHorizon", "skyLower", "cloudHighlight", "cloudShadow", "cloudHaze", "keyColor", "fillColor", "ambientColor", "reflectionTint"] as const;
type ColorKey = typeof colorKeys[number];

function linear(hex: string): AtmosphereColor {
  return [1, 3, 5].map(index => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as AtmosphereColor;
}
const palettes: Record<"day" | "dusk" | "night", Record<ColorKey, AtmosphereColor>> = {
  day: {
    skyZenith: linear("#8eafda"), skyHorizon: linear("#e4e8eb"), skyLower: linear("#a5b8d0"),
    cloudHighlight: linear("#f5f5f1"), cloudShadow: linear("#8499b4"), cloudHaze: linear("#b4c6d8"),
    keyColor: linear("#fff0da"), fillColor: linear("#b9d2f0"), ambientColor: linear("#d6e1f1"), reflectionTint: linear("#f0f3fb"),
  },
  dusk: {
    skyZenith: linear("#747cae"), skyHorizon: linear("#e9b19c"), skyLower: linear("#70779c"),
    cloudHighlight: linear("#ecc5b3"), cloudShadow: linear("#626e98"), cloudHaze: linear("#a18b9d"),
    keyColor: linear("#ffba83"), fillColor: linear("#979ccf"), ambientColor: linear("#b9a8c8"), reflectionTint: linear("#cfb5c8"),
  },
  night: {
    skyZenith: linear("#101c3c"), skyHorizon: linear("#344668"), skyLower: linear("#1d2c4c"),
    cloudHighlight: linear("#8798b5"), cloudShadow: linear("#263959"), cloudHaze: linear("#3f5372"),
    keyColor: linear("#d9e4ff"), fillColor: linear("#b4bfdb"), ambientColor: linear("#c4d0e6"), reflectionTint: linear("#b8c5e1"),
  },
};
function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

/** Writes a complete snapshot without allocations in the frame loop. */
export function sampleSanctuaryAtmosphere(userTravel: number, target: SanctuaryAtmosphere) {
  if (!Number.isFinite(userTravel)) return target;
  target.userTravel = userTravel;
  target.solarPhase = userTravel / ATMOSPHERE_CYCLE_TURNS * TAU;
  // Reduce only the trigonometric input, never the unwrapped travel/clock.
  const phase = target.solarPhase % TAU;
  const elevation = Math.cos(phase);
  const night = 1 - smoothstep(-0.58, -0.08, elevation);
  const daylight = smoothstep(-0.12, 0.65, elevation) * (1 - night);
  const dusk = 1 - daylight - night;
  target.daylight = daylight;
  target.dusk = dusk;
  target.night = night;
  target.starVisibility = smoothstep(0.18, 0.88, night);
  for (const key of colorKeys) {
    for (let channel = 0; channel < 3; channel++) {
      target[key][channel] = palettes.day[key][channel] * daylight
        + palettes.dusk[key][channel] * dusk + palettes.night[key][channel] * night;
    }
  }
  // The art-directed sun/moon travels clockwise in world X/Z. A low sunset
  // casts long shadows; the night key rises again to keep porcelain readable.
  const azimuth = -0.76 + phase;
  const height = 0.4 + elevation * elevation * 0.68;
  const length = Math.hypot(1, height);
  target.keyDirection[0] = Math.sin(azimuth) / length;
  target.keyDirection[1] = height / length;
  target.keyDirection[2] = Math.cos(azimuth) / length;
  // Night's key is often behind the foreground. A luminous moon rim needs a
  // broad, neutral sky fill so ivory stays porcelain rather than charcoal.
  target.keyIntensity = 3.6 * daylight + 2.8 * dusk + 2.3 * night;
  target.fillIntensity = 0.62 * daylight + 0.46 * dusk + 0.95 * night;
  target.ambientIntensity = 0.2 * daylight + 0.17 * dusk + 0.26 * night;
  target.environmentIntensity = 0.85 * daylight + 0.68 * dusk + 0.85 * night;
  return target;
}

export function createSanctuaryAtmosphere(): SanctuaryAtmosphere {
  const target: SanctuaryAtmosphere = {
    userTravel: 0, solarPhase: 0, daylight: 1, dusk: 0, night: 0, starVisibility: 0,
    keyDirection: [0, 1, 0],
    skyZenith: [0, 0, 0], skyHorizon: [0, 0, 0], skyLower: [0, 0, 0],
    cloudHighlight: [0, 0, 0], cloudShadow: [0, 0, 0], cloudHaze: [0, 0, 0],
    keyColor: [0, 0, 0], fillColor: [0, 0, 0], ambientColor: [0, 0, 0], reflectionTint: [0, 0, 0],
    keyIntensity: 0, fillIntensity: 0, ambientIntensity: 0, environmentIntensity: 0,
  };
  return sampleSanctuaryAtmosphere(0, target);
}

/** Short reversible easing; discarded suspended time cannot jump the clock. */
export function advanceSanctuaryAtmosphere(target: SanctuaryAtmosphere, userTravel: number, delta: number, reducedMotion = false) {
  if (!Number.isFinite(delta) || delta <= 0 || !Number.isFinite(userTravel)) return target;
  const blend = reducedMotion ? 1 : -Math.expm1(-5 * Math.min(delta, 0.1));
  return sampleSanctuaryAtmosphere(target.userTravel + (userTravel - target.userTravel) * blend, target);
}
