/** Stable randomness: recycling a ribbon slot never reshuffles an existing door. */
function random(occurrence: number, channel: number, arrangementSeed: number) {
  let value = Math.imul(occurrence | 0, 0x45d9f3b) ^ Math.imul(channel + 1, 0x27d4eb2d) ^ Math.imul(arrangementSeed | 0, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export function doorPlacement(occurrence: number, arrangementSeed = 0) {
  return {
    // Nearly the whole slot is available, with bounded density for the pool.
    turn: occurrence / 3 + (random(occurrence, 0, arrangementSeed) - 0.5) * 0.31,
    lateral: (random(occurrence, 1, arrangementSeed) - 0.5) * 0.84,
    yaw: (random(occurrence, 2, arrangementSeed) - 0.5) * Math.PI * 2,
    scale: 0.72 + random(occurrence, 3, arrangementSeed) * 0.5,
  };
}

/** Independent draws allow repeats and clusters, without an ordered six-door loop. */
export function doorShapeIndex(occurrence: number, shapeCount: number, arrangementSeed = 0) {
  return Math.floor(random(occurrence, 4, arrangementSeed) * shapeCount);
}

/** An asymmetric scatter in screen space; narrow screens get their own packing. */
export const doorScatter = [
  { wide: [-.79, .31], narrow: [-.65, .70], depth: -.8, scale: 1.02, yaw: -.63 },
  { wide: [-.27, -.05], narrow: [.57, .51], depth: .7, scale: .87, yaw: 2.65 },
  { wide: [.22, .66], narrow: [-.39, .05], depth: -1.3, scale: .98, yaw: .91 },
  { wide: [.77, .02], narrow: [.68, -.22], depth: .1, scale: 1.08, yaw: -2.38 },
  { wide: [-.57, -.69], narrow: [-.67, -.61], depth: 1.0, scale: .92, yaw: .47 },
  { wide: [.39, -.65], narrow: [.43, -.73], depth: -.4, scale: .96, yaw: -1.12 },
] as const;
