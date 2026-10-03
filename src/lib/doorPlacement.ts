/** Stable randomness: recycling a ribbon slot never reshuffles an existing door. */
function random(occurrence: number, channel: number, arrangementSeed: number) {
  let value = Math.imul(occurrence | 0, 0x45d9f3b) ^ Math.imul(channel + 1, 0x27d4eb2d) ^ Math.imul(arrangementSeed | 0, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

// Three doors per turn, with enough clearance for the largest door even on
// the compact ribbon. Independent jitter cannot shrink a gap below this.
export const MIN_DOOR_TURN_GAP = 0.28;
const DOOR_TURN_STEP = 1 / 3;
const DOOR_TURN_JITTER = DOOR_TURN_STEP - MIN_DOOR_TURN_GAP;

export function doorPlacement(occurrence: number, arrangementSeed = 0) {
  return {
    turn: occurrence * DOOR_TURN_STEP + (random(occurrence, 0, arrangementSeed) - 0.5) * DOOR_TURN_JITTER,
    lateral: (random(occurrence, 1, arrangementSeed) - 0.5) * 0.84,
    yaw: (random(occurrence, 2, arrangementSeed) - 0.5) * Math.PI * 2,
    scale: 0.72 + random(occurrence, 3, arrangementSeed) * 0.5,
  };
}

/** Stable random choices without adjacent repeats, including across pool boundaries. */
export function doorShapeIndex(occurrence: number, shapeCount: number, arrangementSeed = 0) {
  if (!Number.isInteger(shapeCount) || shapeCount < 1) {
    throw new RangeError("At least one door shape is required");
  }
  if (shapeCount === 1) return 0;
  const parity = ((occurrence % 2) + 2) % 2;
  if (shapeCount === 2) return (parity + Math.floor(random(0, 4, arrangementSeed) * 2)) % 2;

  const draw = (index: number) => Math.floor(random(index, 4, arrangementSeed) * shapeCount);
  if (parity === 0) return draw(occurrence);

  // Odd occurrences exclude both neighboring even draws. This avoids a
  // stateful history or recursive walk, so negative indices and jumps agree.
  const left = draw(occurrence - 1);
  const right = draw(occurrence + 1);
  const firstExcluded = Math.min(left, right);
  const secondExcluded = Math.max(left, right);
  let choice = Math.floor(random(occurrence, 4, arrangementSeed) * (shapeCount - (left === right ? 1 : 2)));
  if (choice >= firstExcluded) choice++;
  if (left !== right && choice >= secondExcluded) choice++;
  return choice;
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
