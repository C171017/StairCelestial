/** C's lighting follows user ascent, independently of orbit and recycled meshes. */
export interface SceneMoodState {
  value: number;
  target: number;
  ascent: number;
  day: number;
  sunset: number;
  night: number;
  stars: number;
}

export const INITIAL_MOOD = 0.52;
export const MOOD_TRAVEL_TURNS = 5;

function smoothstep(a: number, b: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function moodForAscent(ascent: number) {
  return Math.max(0, Math.min(1, INITIAL_MOOD + ascent / MOOD_TRAVEL_TURNS));
}

export function sampleSceneMood(value = INITIAL_MOOD, ascent = 0): SceneMoodState {
  const day = 1 - smoothstep(0, 0.5, value);
  const night = smoothstep(0.5, 1, value);
  return { value, target: value, ascent, day, sunset: 1 - day - night, night, stars: smoothstep(0.5, 0.9, value) };
}

/** Navigation already eases acceleration; this removes tiny lighting steps. */
export function advanceSceneMood(state: SceneMoodState, ascent: number, delta: number) {
  if (!Number.isFinite(ascent) || !Number.isFinite(delta) || delta <= 0) return;
  // Saturate the lighting coordinate while preserving raw ascent. This avoids
  // accumulating invisible travel beyond midnight/noon: reversal responds
  // immediately even after hours of travel beyond an endpoint.
  const target = Math.max(0, Math.min(1, state.target + (ascent - state.ascent) / MOOD_TRAVEL_TURNS));
  const value = state.value + (target - state.value) * -Math.expm1(-7 * Math.min(delta, 0.1));
  Object.assign(state, sampleSceneMood(value, ascent), { target });
}
