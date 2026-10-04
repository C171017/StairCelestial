import * as THREE from "three";
import type { RibbonMotionSnapshot } from "./ribbonMotion";

/** Half the previous scroll rotation; idle makes one orbit in 160 seconds. */
export const RIBBON_ORBIT_RATIO = 0.25;

export function syncRibbonOrbit(motion: RibbonMotionSnapshot, orbit: RibbonMotionSnapshot) {
  orbit.position = motion.position * RIBBON_ORBIT_RATIO;
  orbit.velocity = motion.velocity * RIBBON_ORBIT_RATIO;
}

export const ORBIT_RADIUS = 24;
export const ORBIT_HEIGHT = 2.8;

/** Wrap only the trigonometric input, never the accumulated navigation state. */
export function ribbonOrbitAngle(turns: number) {
  return -(turns % 1) * Math.PI * 2;
}

export function ribbonOrbitPosition(turns: number, target = new THREE.Vector3()) {
  const angle = ribbonOrbitAngle(turns);
  return target.set(Math.sin(angle) * ORBIT_RADIUS, ORBIT_HEIGHT, Math.cos(angle) * ORBIT_RADIUS);
}
