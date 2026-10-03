/** Motion is expressed in ribbon turns, independent of geometry or camera. */
export interface RibbonMotionSnapshot {
  position: number;
  velocity: number;
}

export interface RibbonMotionState extends RibbonMotionSnapshot {
  pendingInput: number;
  inputVelocity: number;
  cruiseVelocity: number;
  direction: number;
}

export const RIBBON_TURN_PIXELS = 1800;
export const RIBBON_CRUISE_SPEED = 0.025;
export const RIBBON_MAX_SPEED = 0.5;

export function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

/** The nearest copy of a repeating item, centered around the viewer. */
export function relativeCycle(value: number, period = 1): number {
  return positiveModulo(value + period / 2, period) - period / 2;
}

export function createRibbonMotion(): RibbonMotionState {
  return {
    position: 0,
    velocity: 0,
    pendingInput: 0,
    inputVelocity: 0,
    cruiseVelocity: 0,
    direction: 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function addRibbonInput(
  motion: RibbonMotionState,
  pixels: number,
  reducedMotion = false,
): void {
  if (!Number.isFinite(pixels) || Math.abs(pixels) < 0.1) return;
  motion.direction = Math.sign(pixels);
  // Prevent a long sequence of wheel events from queuing seconds of travel.
  motion.pendingInput = clamp(
    motion.pendingInput + (pixels / RIBBON_TURN_PIXELS) * (reducedMotion ? 0.6 : 1),
    -0.65,
    0.65,
  );
}

function approachVelocity(
  current: number,
  target: number,
  response: number,
  acceleration: number,
  dt: number,
): number {
  const change = (target - current) * -Math.expm1(-response * dt);
  return current + clamp(change, -acceleration * dt, acceleration * dt);
}

/**
 * A critically damped input response plus an independently eased cruise.
 * Small integration steps make the response consistent across frame rates;
 * long suspended frames are discarded instead of producing catch-up travel.
 */
export function advanceRibbonMotion(
  motion: RibbonMotionState,
  delta: number,
  { paused = false, reducedMotion = false } = {},
): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const duration = Math.min(delta, 0.1);
  const steps = Math.ceil(duration / (1 / 120));
  const dt = duration / steps;
  const maxInputSpeed = reducedMotion ? 0.22 : RIBBON_MAX_SPEED - RIBBON_CRUISE_SPEED;

  for (let i = 0; i < steps; i += 1) {
    const previousInputVelocity = motion.inputVelocity;
    const previousCruiseVelocity = motion.cruiseVelocity;
    const inputTarget = paused ? 0 : clamp(motion.pendingInput * 3, -maxInputSpeed, maxInputSpeed);
    const cruiseTarget = paused || reducedMotion ? 0 : motion.direction * RIBBON_CRUISE_SPEED;

    motion.inputVelocity = approachVelocity(
      motion.inputVelocity,
      inputTarget,
      reducedMotion ? 18 : 12,
      paused ? 1.8 : 0.9,
      dt,
    );
    motion.cruiseVelocity = approachVelocity(motion.cruiseVelocity, cruiseTarget, 3.8, 0.12, dt);

    let inputTravel = (previousInputVelocity + motion.inputVelocity) * 0.5 * dt;
    if (!paused) {
      // Prevent tiny settling overshoots from reversing the ribbon at rest.
      if (
        Math.sign(inputTravel) === Math.sign(motion.pendingInput) &&
        Math.abs(inputTravel) > Math.abs(motion.pendingInput)
      ) {
        inputTravel = motion.pendingInput;
        motion.inputVelocity = 0;
      }
      motion.pendingInput -= inputTravel;
      if (Math.abs(motion.pendingInput) < 0.000001 && Math.abs(motion.inputVelocity) < 0.00001) {
        motion.pendingInput = 0;
        motion.inputVelocity = 0;
      }
    }

    motion.position += inputTravel + (previousCruiseVelocity + motion.cruiseVelocity) * 0.5 * dt;
    motion.velocity = motion.inputVelocity + motion.cruiseVelocity;
  }
}
