/** Linear-light colors shared by the sky, object lights, and reflections. */
export type AtmosphereColor = [number, number, number];
export interface SanctuaryAtmosphere {
  userTravel: number;
  /** Unwrapped clock angle: noon at zero, midnight at PI. */
  solarPhase: number;
  worldHour: number;
  daylight: number;
  dawn: number;
  sunset: number;
  dusk: number;
  night: number;
  starVisibility: number;
  meteorVisibility: number;
  sunVisibility: number;
  moonVisibility: number;
  sunDirection: [number, number, number];
  moonDirection: [number, number, number];
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

// Eight sky-travel units complete a day. Ribbon input is scaled below so a
// complete day now takes twenty user-driven ribbon turns (2.5x slower).
// The finite door pool and automatic idle cruise do not advance this clock.
export const ATMOSPHERE_CYCLE_TURNS = 8;
/** Positive ribbon travel lowers the stairs/doors (world Y = -travel * pitch),
 * advancing white -> pink sunset -> night -> golden sunrise -> white.
 * Reverse travel retraces the same clock at the same reduced rate. */
export function atmosphereTravelFromRibbon(userPosition: number) {
  return userPosition / 2.5;
}
const TAU = Math.PI * 2;
const colorKeys = ["skyZenith", "skyHorizon", "skyLower", "cloudHighlight", "cloudShadow", "cloudHaze", "keyColor", "fillColor", "ambientColor", "reflectionTint"] as const;
type ColorKey = typeof colorKeys[number];

function linear(hex: string): AtmosphereColor {
  return [1, 3, 5].map(index => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as AtmosphereColor;
}
const palettes: Record<"day" | "dawn" | "sunset" | "night", Record<ColorKey, AtmosphereColor>> = {
  day: {
    skyZenith: linear("#b1c7de"), skyHorizon: linear("#edf1f3"), skyLower: linear("#bdcedd"),
    cloudHighlight: linear("#fafaf8"), cloudShadow: linear("#9badc4"), cloudHaze: linear("#d3dfe9"),
    keyColor: linear("#f7f5ed"), fillColor: linear("#c8dcf0"), ambientColor: linear("#dce5f1"), reflectionTint: linear("#f0f3fb"),
  },
  dawn: {
    // Amber horizon / honey-lit crests, with cool slate in the unlit billows.
    skyZenith: linear("#8d9eaf"), skyHorizon: linear("#f6ac58"), skyLower: linear("#af9186"),
    cloudHighlight: linear("#ffdb9c"), cloudShadow: linear("#777b91"), cloudHaze: linear("#cfaa8c"),
    keyColor: linear("#ffd089"), fillColor: linear("#b6c6df"), ambientColor: linear("#dbc8b6"), reflectionTint: linear("#eed0a7"),
  },
  sunset: {
    // Rose-peach light over lavender-blue shadows, drawn from a coastal sunset.
    skyZenith: linear("#8586ad"), skyHorizon: linear("#efa9bc"), skyLower: linear("#a18aa7"),
    cloudHighlight: linear("#ffc3d0"), cloudShadow: linear("#77718f"), cloudHaze: linear("#c7a2bb"),
    keyColor: linear("#ffcebf"), fillColor: linear("#adb6d9"), ambientColor: linear("#cbbccd"), reflectionTint: linear("#e2bfd0"),
  },
  night: {
    skyZenith: linear("#142542"), skyHorizon: linear("#425574"), skyLower: linear("#263b59"),
    cloudHighlight: linear("#a1b5d2"), cloudShadow: linear("#2a405f"), cloudHaze: linear("#526986"),
    keyColor: linear("#d9e4ff"), fillColor: linear("#b4bfdb"), ambientColor: linear("#c4d0e6"), reflectionTint: linear("#b8c5e1"),
  },
};
function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

/** Writes a complete snapshot without allocations in the frame loop. */
export function sampleSanctuaryAtmosphere(userTravel: number, target: SanctuaryAtmosphere, celestialSpread = 1) {
  if (!Number.isFinite(userTravel)) return target;
  target.userTravel = userTravel;
  target.solarPhase = userTravel / ATMOSPHERE_CYCLE_TURNS * TAU;
  // Reduce only the trigonometric input, never the unwrapped travel/clock.
  const phase = target.solarPhase % TAU;
  target.worldHour = ((12 + userTravel / ATMOSPHERE_CYCLE_TURNS * 24) % 24 + 24) % 24;
  const elevation = Math.cos(phase);
  // Equally spaced peak moments on one continuous clock. Blend throughout
  // the entire interval: there are no full-palette holds. Cosine weights meet
  // with zero slope at each peak and give each palette equal total influence.
  const quarter = ((userTravel / (ATMOSPHERE_CYCLE_TURNS / 4)) % 4 + 4) % 4;
  const from = Math.floor(quarter), to = (from + 1) % 4;
  const blend = (1 - Math.cos((quarter - from) * Math.PI)) / 2;
  const daylight = (from === 0 ? 1 - blend : 0) + (to === 0 ? blend : 0);
  const sunset = (from === 1 ? 1 - blend : 0) + (to === 1 ? blend : 0);
  const night = (from === 2 ? 1 - blend : 0) + (to === 2 ? blend : 0);
  const dawn = (from === 3 ? 1 - blend : 0) + (to === 3 ? blend : 0);
  const dusk = dawn + sunset;
  target.daylight = daylight;
  target.dusk = dusk;
  target.dawn = dawn;
  target.sunset = sunset;
  target.night = night;
  target.starVisibility = night + 0.45 * sunset + 0.035 * dawn;
  // The updated brief includes the whole night. Dusk trails are readable
  // against pink clouds, and taper away during the approach to golden dawn.
  target.meteorVisibility = 0.78 * sunset + night;
  target.sunVisibility = smoothstep(-0.10, 0.025, elevation)
    * (1 - 0.99 * smoothstep(0.12, 0.65, elevation));
  target.moonVisibility = smoothstep(-0.04, 0.28, -elevation) * (0.4 + 0.6 * night);
  for (const key of colorKeys) {
    for (let channel = 0; channel < 3; channel++) {
      target[key][channel] = palettes.day[key][channel] * daylight
        + palettes.dawn[key][channel] * dawn + palettes.sunset[key][channel] * sunset
        + palettes.night[key][channel] * night;
    }
  }
  // Art-directed low arcs sit within the downward-looking camera's sky band.
  // They stay in world space: orbiting can naturally take either out of view.
  // Their shared azimuth lights the objects; raised key elevation avoids very
  // long fragile shadow maps. This is visual continuity, not an ephemeris.
  const spread = Math.max(0.25, Math.min(1, celestialSpread));
  const x = (Math.sin(phase) * 0.5 + elevation * 0.22) * spread;
  const y = elevation * 0.12;
  const celestialLength = Math.hypot(x, y, 1);
  target.sunDirection[0] = x / celestialLength;
  target.sunDirection[1] = y / celestialLength;
  target.sunDirection[2] = -1 / celestialLength;
  // Offset the moon's arc so midnight clears the upper ribbon in the entrance
  // view, while keeping its path and illumination world-fixed during orbit.
  const moonX = (-Math.sin(phase) * 0.5 - elevation * 0.48) * spread;
  const moonLength = Math.hypot(moonX, y, 1);
  target.moonDirection[0] = moonX / moonLength;
  target.moonDirection[1] = -y / moonLength;
  target.moonDirection[2] = -1 / moonLength;
  const moonHandover = smoothstep(-0.04, 0.35, -elevation);
  const keyX = x * (1 - moonHandover) + moonX * moonHandover;
  const height = 0.85 + elevation * elevation * 0.45;
  const length = Math.hypot(keyX, height, 1);
  target.keyDirection[0] = keyX / length;
  target.keyDirection[1] = height / length;
  target.keyDirection[2] = -1 / length;
  // Night's key is often behind the foreground. A luminous moon rim needs a
  // broad, neutral sky fill so ivory stays porcelain rather than charcoal.
  target.keyIntensity = 3.2 * daylight + 2.35 * dusk + 2.0 * night;
  target.fillIntensity = 0.62 * daylight + 0.46 * dusk + 0.95 * night;
  target.ambientIntensity = 0.2 * daylight + 0.17 * dusk + 0.26 * night;
  target.environmentIntensity = 0.85 * daylight + 0.68 * dusk + 0.85 * night;
  return target;
}

export function createSanctuaryAtmosphere(): SanctuaryAtmosphere {
  const target: SanctuaryAtmosphere = {
    userTravel: 0, solarPhase: 0, worldHour: 12, daylight: 1, dawn: 0, sunset: 0, dusk: 0, night: 0, starVisibility: 0,
    meteorVisibility: 0, sunVisibility: 0, moonVisibility: 0,
    sunDirection: [0, 1, 0], moonDirection: [0, -1, 0],
    keyDirection: [0, 1, 0],
    skyZenith: [0, 0, 0], skyHorizon: [0, 0, 0], skyLower: [0, 0, 0],
    cloudHighlight: [0, 0, 0], cloudShadow: [0, 0, 0], cloudHaze: [0, 0, 0],
    keyColor: [0, 0, 0], fillColor: [0, 0, 0], ambientColor: [0, 0, 0], reflectionTint: [0, 0, 0],
    keyIntensity: 0, fillIntensity: 0, ambientIntensity: 0, environmentIntensity: 0,
  };
  return sampleSanctuaryAtmosphere(0, target);
}

/** Short reversible easing; discarded suspended time cannot jump the clock. */
export function advanceSanctuaryAtmosphere(target: SanctuaryAtmosphere, userTravel: number, delta: number, reducedMotion = false, celestialSpread = 1) {
  if (!Number.isFinite(delta) || delta <= 0 || !Number.isFinite(userTravel)) return target;
  const blend = reducedMotion ? 1 : -Math.expm1(-5 * Math.min(delta, 0.1));
  return sampleSanctuaryAtmosphere(target.userTravel + (userTravel - target.userTravel) * blend, target, celestialSpread);
}
