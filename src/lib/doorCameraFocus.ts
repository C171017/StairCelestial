import * as THREE from "three";
import type { SpiralPlacement } from "./spiral";

/** Virtual stair steps scrolled away from focus before releasing zoom. */
export const SCROLL_FOCUS_RELEASE_THRESHOLD = 0.35;

/**
 * World look-at height above door root. Kept below geometric center so the
 * portal reads higher in the viewport when the camera faces it.
 */
const DOOR_LOOK_AT_HEIGHT = 0.58;

/** Framing box for the portal (meters, approximate GLB bounds). */
const DOOR_FRAME_HEIGHT = 2.6;
const DOOR_FRAME_WIDTH = 1.5;

const MIN_FOCUS_DISTANCE = 4.2;
const MAX_FOCUS_DISTANCE = 13;

export type DoorFocusTarget = {
  position: [number, number, number];
  forward: [number, number, number];
};

/** Focus target from the door root’s world transform (pooled doors). */
export function worldRootToFocusTarget(
  rootWorld: THREE.Vector3,
  worldQuaternion: THREE.Quaternion,
): DoorFocusTarget {
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(worldQuaternion);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) {
    forward.set(0, 0, 1);
  } else {
    forward.normalize();
  }

  return {
    position: [
      rootWorld.x,
      rootWorld.y + DOOR_LOOK_AT_HEIGHT,
      rootWorld.z,
    ],
    forward: [forward.x, forward.y, forward.z],
  };
}

export function placementToFocusTarget(
  placement: SpiralPlacement,
): DoorFocusTarget {
  const position: [number, number, number] = [
    placement.position[0],
    placement.position[1] + DOOR_LOOK_AT_HEIGHT,
    placement.position[2],
  ];

  const euler = new THREE.Euler(
    placement.rotation[0],
    placement.rotation[1],
    placement.rotation[2],
  );
  const forward = new THREE.Vector3(0, 0, 1).applyEuler(euler);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) {
    forward.set(0, 0, 1);
  } else {
    forward.normalize();
  }

  return {
    position,
    forward: [forward.x, forward.y, forward.z],
  };
}

/**
 * Extra downward bias on look-at (world Y). Shifts the door upward on screen;
 * stronger on portrait / small viewports where UI eats vertical space.
 */
function getViewportFrameBias(aspect: number, viewportWidth: number): number {
  let bias = 0.34;

  if (aspect < 0.85) {
    bias = 0.5;
  } else if (aspect < 1) {
    bias = 0.42;
  } else if (aspect > 1.85) {
    bias = 0.28;
  }

  if (viewportWidth < 420) {
    bias += 0.08;
  }

  return bias;
}

function getResponsiveMargin(aspect: number, viewportWidth: number): number {
  let margin = 1.32;

  if (aspect < 0.85) {
    margin = 1.48;
  } else if (aspect < 1) {
    margin = 1.4;
  } else if (aspect > 1.85) {
    margin = 1.38;
  }

  if (viewportWidth < 420) {
    margin += 0.08;
  } else if (viewportWidth > 1600) {
    margin += 0.05;
  }

  return margin;
}

/**
 * Camera pose in front of the door, framed to fit portal on any aspect ratio.
 */
export function getFocusCameraPose(
  camera: THREE.PerspectiveCamera,
  target: DoorFocusTarget,
  aspect: number,
  viewportWidth: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const lookAt = new THREE.Vector3(...target.position);
  lookAt.y -= getViewportFrameBias(aspect, viewportWidth);
  const forward = new THREE.Vector3(...target.forward).normalize();

  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const margin = getResponsiveMargin(aspect, viewportWidth);

  const distForHeight =
    (DOOR_FRAME_HEIGHT * margin) / (2 * Math.tan(fovRad / 2));
  const fovX = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
  const distForWidth =
    (DOOR_FRAME_WIDTH * margin) / (2 * Math.tan(fovX / 2));

  const distance = THREE.MathUtils.clamp(
    Math.max(distForHeight, distForWidth),
    MIN_FOCUS_DISTANCE,
    MAX_FOCUS_DISTANCE,
  );

  const position = lookAt
    .clone()
    .add(forward.multiplyScalar(distance));
  position.y -= 0.04;

  return { position, lookAt };
}
