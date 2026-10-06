import type { CloudDefinition } from './cloudField';

/** A horizontal world wind, shared by both cirrus depths. */
export const CIRRUS_WIND = Object.freeze({ x: 1, y: 0, z: 0.18 });

export type CloudAdvection = Readonly<{
  velocityU: number;
  velocityV: number;
  period: number;
  phaseOffset: number;
}>;

export type CloudAdvectionSample = {
  aU: number;
  aV: number;
  bU: number;
  bV: number;
  blend: number;
};

/** Project a shared wind into the immutable card's local artwork coordinates. */
export function createCloudAdvection(cloud: CloudDefinition): CloudAdvection {
  const distance = Math.hypot(cloud.x, cloud.z);
  const near = distance < 500;
  const speed = near ? 2.4 : 4;
  // Match Mesh.lookAt(0, 20, 0): local Z points toward the scene, X is
  // world-up cross Z, and Y is Z cross X. The winding never follows camera.
  const length = Math.hypot(cloud.x, cloud.y - 20, cloud.z);
  const zX = -cloud.x / length;
  const zY = (20 - cloud.y) / length;
  const zZ = -cloud.z / length;
  const horizontal = Math.hypot(zX, zZ);
  const xX = zZ / horizontal;
  const xZ = -zX / horizontal;
  const yX = zY * xZ;
  const yZ = -zY * xX;
  return {
    velocityU: (CIRRUS_WIND.x * xX + CIRRUS_WIND.z * xZ) * speed / cloud.width,
    velocityV: (CIRRUS_WIND.x * yX + CIRRUS_WIND.z * yZ) * speed / cloud.height,
    period: near ? 42 : 48,
    phaseOffset: (cloud.index * 0.3819660112501051) % 1,
  };
}

/**
 * Continuous travel with a hidden reset. The two premultiplied texture samples
 * have complementary weights, so they never stack opacity. At either reset,
 * that sample has zero weight and zero weight derivative. Writes in place.
 */
export function sampleCloudAdvection(seconds: number, flow: CloudAdvection, target: CloudAdvectionSample) {
  const cycles = (Number.isFinite(seconds) ? seconds : 0) / flow.period + flow.phaseOffset;
  const a = cycles - Math.floor(cycles);
  const b = (a + 0.5) % 1;
  const aTravel = (a - 0.5) * flow.period;
  const bTravel = (b - 0.5) * flow.period;
  target.aU = aTravel * flow.velocityU;
  target.aV = aTravel * flow.velocityV;
  target.bU = bTravel * flow.velocityU;
  target.bV = bTravel * flow.velocityV;
  // Hold one recognizable cloud sample for most of the cycle. A continual
  // sinusoidal blend can read as shape wobble even while both samples move.
  // These short handoffs occupy 16% of a cycle and never overlap a reset.
  const entering = Math.max(0, Math.min(1, (a - 0.16) / 0.08));
  const leaving = Math.max(0, Math.min(1, (a - 0.76) / 0.08));
  target.blend = entering * entering * (3 - 2 * entering)
    * (1 - leaving * leaving * (3 - 2 * leaving));
  return target;
}
