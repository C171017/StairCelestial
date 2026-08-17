import type { Vector3Tuple } from "three";
import { projects, type Project } from "./projects";

/** One full helix turn in XZ; matches STAIR_ANGLE_STEP = 2π / LOOP_LENGTH */
export const LOOP_LENGTH = 28;

/** Centered Drei scroll offset at load — symmetric runway up and down. */
export const SCROLL_START_OFFSET = 0.5;

/** Virtual stair steps per one full scroll offset range (0→1). */
export const CLIMB_SCALE = LOOP_LENGTH;

/** Wide enough for tall/narrow frustums so edge stairs do not recycle onscreen. */
export const STAIR_POOL_SIZE = 112;
export const DOOR_POOL_SIZE = 20;

/** Half-width (in virtual steps) when gathering door candidates for slots. */
export const DOOR_POOL_SEARCH_RADIUS = 84;

/** Minimum spacing between door landings as the project set grows */
export const MIN_DOOR_STEP = 6;

export const SPIRAL_RADIUS = 11;
export const STAIR_HEIGHT_STEP = 0.52;
export const STAIR_ANGLE_STEP = (Math.PI * 2) / LOOP_LENGTH;

/** Unscaled mesh sizes from GLB bounds (X tangent, Y thickness, Z radial). */
const STAIR_MESH_SIZE = { x: 2.55, y: 0.26, z: 1.58 };

/** Local Y of stair_segment.glb top surface. */
const STAIR_MESH_TOP_Y = STAIR_MESH_SIZE.y / 2;
/** Local Y of project_door_portal.glb bottom (from mesh bounds). */
const DOOR_MESH_BOTTOM_Y = -1.46;
/** Raise door root so mesh bottom sits on the stair-sized pad (+ small gap). */
export const DOOR_Y_OFFSET_ABOVE_PLATFORM =
  STAIR_MESH_TOP_Y - DOOR_MESH_BOTTOM_Y + 0.02;

/** Same-size landing, nudged slightly outward so the door has a small pad. */
export const PLATFORM_OUTWARD_OFFSET = 0.32;
/** Keep the landing flush with the stair tread. */
export const PLATFORM_Y_OFFSET = 0;

/** Door centered on the pad. */
export const DOOR_OUTWARD_FROM_PLATFORM = 0;

/** Fixed orbit radius — camera stays this far from the central axis at all times */
export const CAMERA_ORBIT_RADIUS = SPIRAL_RADIUS + 14;

/** Vertical offset of camera above the current stair index */
export const CAMERA_Y_OFFSET = 3;

/** Look-at point on the central axis (void), slightly below camera height */
export const CAMERA_LOOK_AT_Y_OFFSET = 1.2;

/** @deprecated Static scene only — pool uses unbounded virtual indices */
export const STAIR_COUNT = 24;

/** @deprecated Use isDoorStairIndex + pool instead */
export const PLATFORM_STAIR_INDICES = [5, 11, 17, 23] as const;

export type RotationTuple = [number, number, number];

export type SpiralPlacement = {
  index: number;
  position: Vector3Tuple;
  rotation: RotationTuple;
};

export function getDoorStep(projectCount: number = projects.length): number {
  const count = Math.max(1, projectCount);
  return Math.max(MIN_DOOR_STEP, Math.floor(LOOP_LENGTH / count));
}

export function isDoorStairIndex(
  virtualIndex: number,
  doorStep: number = getDoorStep(),
): boolean {
  const mod = ((virtualIndex % doorStep) + doorStep) % doorStep;
  return mod === 0;
}

export function getDoorSlotIndex(
  virtualIndex: number,
  doorStep: number = getDoorStep(),
): number {
  const projectCount = Math.max(1, projects.length);
  const slot = Math.floor(virtualIndex / doorStep);
  return ((slot % projectCount) + projectCount) % projectCount;
}

/** Project for a pooled door at a virtual stair index (repeating set). */
export function getProjectForStairIndex(
  virtualIndex: number,
): Project | undefined {
  if (projects.length === 0) return undefined;
  const doorStep = getDoorStep();
  if (!isDoorStairIndex(virtualIndex, doorStep)) return undefined;
  const slot = getDoorSlotIndex(virtualIndex, doorStep);
  return projects[slot];
}

/** Smooth orbit angle for camera (unbounded; no lap snap). */
export function getContinuousOrbitAngle(virtualIndex: number): number {
  return virtualIndex * STAIR_ANGLE_STEP;
}

export function getStairPlacement(virtualIndex: number): SpiralPlacement {
  const loopIndex =
    ((virtualIndex % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
  const angle = loopIndex * STAIR_ANGLE_STEP;
  const x = Math.cos(angle) * SPIRAL_RADIUS;
  const z = Math.sin(angle) * SPIRAL_RADIUS;
  const y = virtualIndex * STAIR_HEIGHT_STEP;

  return {
    index: virtualIndex,
    position: [x, y, z],
    rotation: [0, -angle + Math.PI / 2, 0],
  };
}

export function getPlatformPlacement(stairIndex: number): SpiralPlacement {
  const stair = getStairPlacement(stairIndex);
  const loopIndex =
    ((stairIndex % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
  const angle = loopIndex * STAIR_ANGLE_STEP;
  const outwardX = Math.cos(angle);
  const outwardZ = Math.sin(angle);

  return {
    index: stairIndex,
    position: [
      stair.position[0] + outwardX * PLATFORM_OUTWARD_OFFSET,
      stair.position[1] + PLATFORM_Y_OFFSET,
      stair.position[2] + outwardZ * PLATFORM_OUTWARD_OFFSET,
    ],
    rotation: stair.rotation,
  };
}

export function getDoorPlacement(stairIndex: number): SpiralPlacement {
  const platform = getPlatformPlacement(stairIndex);
  const loopIndex =
    ((stairIndex % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
  const angle = loopIndex * STAIR_ANGLE_STEP;
  const outwardX = Math.cos(angle);
  const outwardZ = Math.sin(angle);

  return {
    index: stairIndex,
    position: [
      platform.position[0] + outwardX * DOOR_OUTWARD_FROM_PLATFORM,
      platform.position[1] + DOOR_Y_OFFSET_ABOVE_PLATFORM,
      platform.position[2] + outwardZ * DOOR_OUTWARD_FROM_PLATFORM,
    ],
    rotation: platform.rotation,
  };
}

export const LOOP_HEIGHT = LOOP_LENGTH * STAIR_HEIGHT_STEP;

/** @deprecated Scroll is delta-driven; kept for reference */
export const SCENE_HEIGHT = STAIR_COUNT * STAIR_HEIGHT_STEP + 4;
