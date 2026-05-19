import type { Vector3Tuple } from "three";

export const STAIR_COUNT = 24;
export const PLATFORM_STAIR_INDICES = [5, 11, 17, 23] as const;

export const SPIRAL_RADIUS = 11;
export const STAIR_HEIGHT_STEP = 0.52;
export const STAIR_ANGLE_STEP = (Math.PI * 2) / 28;

export type RotationTuple = [number, number, number];

export type SpiralPlacement = {
  index: number;
  position: Vector3Tuple;
  rotation: RotationTuple;
};

export function getStairPlacement(index: number): SpiralPlacement {
  const angle = index * STAIR_ANGLE_STEP;
  const x = Math.cos(angle) * SPIRAL_RADIUS;
  const z = Math.sin(angle) * SPIRAL_RADIUS;
  const y = index * STAIR_HEIGHT_STEP;

  return {
    index,
    position: [x, y, z],
    rotation: [0, -angle + Math.PI / 2, 0],
  };
}

export function getPlatformPlacement(stairIndex: number): SpiralPlacement {
  const stair = getStairPlacement(stairIndex);
  const angle = stairIndex * STAIR_ANGLE_STEP;
  const outwardX = Math.cos(angle);
  const outwardZ = Math.sin(angle);

  return {
    index: stairIndex,
    position: [
      stair.position[0] + outwardX * 1.8,
      stair.position[1] + 0.08,
      stair.position[2] + outwardZ * 1.8,
    ],
    rotation: stair.rotation,
  };
}

export function getDoorPlacement(stairIndex: number): SpiralPlacement {
  const platform = getPlatformPlacement(stairIndex);
  const angle = stairIndex * STAIR_ANGLE_STEP;
  const outwardX = Math.cos(angle);
  const outwardZ = Math.sin(angle);

  return {
    index: stairIndex,
    position: [
      platform.position[0] + outwardX * 0.55,
      platform.position[1] + 0.12,
      platform.position[2] + outwardZ * 0.55,
    ],
    rotation: platform.rotation,
  };
}

export const SCENE_HEIGHT = STAIR_COUNT * STAIR_HEIGHT_STEP + 4;
