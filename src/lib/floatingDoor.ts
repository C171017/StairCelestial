import * as THREE from "three";
import { doorBaseWorldPoint, ribbonSurfaceHeight, type DoorSupport } from "./doorSupport";

/** A deliberate air gap, measured above the highest point of the curved
 * receiver under this door. Calculated once per placement, never bobbed. */
export const DOOR_FLOAT_CLEARANCE = 0.3;
export function floatDoorSupport(support: DoorSupport): DoorSupport {
  // Hovering frees the frame from the old across-slope seating orientation.
  // A three-quarter presentation keeps frontmost portals from reading as sticks.
  const center = new THREE.Vector2((support.base.minX + support.base.maxX) / 2, 0);
  const oldCenter = doorBaseWorldPoint(support, center);
  const positive = Math.abs(Math.cos(support.yaw + 0.55));
  const negative = Math.abs(Math.cos(support.yaw - 0.55));
  const yaw = support.yaw + (positive >= negative - 1e-10 ? 0.55 : -0.55);
  const lifted = { ...support, position: support.position.clone(), yaw };
  const newCenter = doorBaseWorldPoint(lifted, center);
  lifted.position.x += oldCenter.x - newCenter.x;
  lifted.position.z += oldCenter.z - newCenter.z;
  const position = lifted.position;
  const surface = Math.max(...support.perimeter.map(point => {
    const world = doorBaseWorldPoint(lifted, point);
    return ribbonSurfaceHeight(world.x, world.z, support.turn);
  }));
  position.y = surface - support.base.bottom * support.scale + DOOR_FLOAT_CLEARANCE * support.scale;
  return lifted;
}

/** Shared visual bounds for the finite portal pool. */
export const FLOATING_DOOR_COUNT = 15;

export function readReviewSeed() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const value = new URLSearchParams(window.location.search).get("reviewSeed");
    if (value !== null && Number.isFinite(Number(value))) return Number(value) >>> 0;
  }
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
