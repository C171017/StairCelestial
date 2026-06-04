import { Vector3, type Camera, type Object3D } from "three";

export type NdcAnchor = {
  x: number;
  y: number;
};

/** Keep a group centered on the camera so viewport-local shells never drift on scroll. */
export function syncGroupToCamera(group: Object3D, camera: Camera): void {
  group.position.copy(camera.position);
}

/**
 * World position on a ray from the camera through normalized device coords (z=0.5 unproject).
 */
export function getViewportAnchorPosition(
  camera: Camera,
  ndc: NdcAnchor,
  distance: number,
  target: Vector3,
  ndcScratch?: Vector3,
  rayScratch?: Vector3,
): Vector3 {
  const ndcVec = ndcScratch ?? new Vector3();
  const ray = rayScratch ?? new Vector3();
  ndcVec.set(ndc.x, ndc.y, 0.5).unproject(camera);
  ray.copy(ndcVec).sub(camera.position).normalize();
  return target.copy(camera.position).addScaledVector(ray, distance);
}
