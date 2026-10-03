import { Matrix4, Vector3 } from "three";

export function getCloudControlFinalScale(viewportWidth: number) {
  return (viewportWidth < 650 ? 8.1 : 17.5) * 0.7;
}

/** Intersect the spiral's transformed local Y axis with camera-height world Y.
 * Translation, tilt, orbit, focus scale and scrolling all use the same rule. */
export function spiralControlAnchor(
  frame: Matrix4 | undefined,
  cameraHeight: number,
  target: Vector3,
) {
  if (!frame) return target.set(0, cameraHeight, 0);
  const e = frame.elements;
  const alongAxis = Math.abs(e[5]) > 1e-8 ? (cameraHeight - e[13]) / e[5] : 0;
  return target.set(e[12] + e[4] * alongAxis, cameraHeight, e[14] + e[6] * alongAxis);
}
