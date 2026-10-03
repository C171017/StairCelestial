import { Mesh } from "three";

const disabledRaycast: Mesh["raycast"] = () => {};

/** Fiber ignores undefined props, so restoring interactivity needs the real method. */
export function interactiveMeshRaycast(enabled: boolean): Mesh["raycast"] {
  return enabled ? Mesh.prototype.raycast : disabledRaycast;
}
