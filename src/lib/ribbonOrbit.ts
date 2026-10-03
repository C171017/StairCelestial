import * as THREE from "three";

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
