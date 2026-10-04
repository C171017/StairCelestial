import * as THREE from "three";
import { doorBaseWorldPoint, ribbonSurfaceHeight, type DoorSupport } from "./doorSupport";

/** A small integral fillet, fitted between the actual frame and curved glass.
 * All returned positions are in door-local coordinates; moving/recycling the
 * parent therefore cannot leave a world-space contact patch behind.
 */
export function createDoorFootGeometry(model: THREE.Object3D, support: DoorSupport) {
  model.updateWorldMatrix(true, true);
  const frames: THREE.Object3D[] = [];
  model.traverse(object => {
    if ((object as THREE.Mesh).isMesh && object.name.startsWith("Fixed_GlassFrame")) frames.push(object);
  });
  const inverse = model.matrixWorld.clone().invert();
  const centerX = (support.base.minX + support.base.maxX) / 2;
  const width = support.base.maxX - support.base.minX;
  const ray = new THREE.Raycaster();
  const upward = new THREE.Vector3(0, 1, 0).transformDirection(model.matrixWorld);
  const local = new THREE.Vector3();
  const foot: { x: number; z: number; lower: number; upperX: number; upperZ: number; upper: number }[] = [];
  for (const point of support.perimeter) {
    const world = doorBaseWorldPoint(support, point);
    const lower = (ribbonSurfaceHeight(world.x, world.z, support.turn) - support.position.y) / support.scale + 0.002;
    const upperX = centerX + (point.x - centerX) * Math.max(0.6, (width - 0.13) / width);
    const upperZ = point.y * 0.64;
    // Raycast the underside of the exported frame, including its bevels,
    // instead of inventing a common flat pedestal for all six silhouettes.
    ray.set(local.set(upperX, support.base.bottom - 1, upperZ).applyMatrix4(model.matrixWorld), upward);
    const hit = ray.intersectObjects(frames, false)[0];
    const frameY = hit ? local.copy(hit.point).applyMatrix4(inverse).y : support.base.bottom + 0.1;
    const upper = Math.max(lower + 0.018, Math.min(frameY + 0.018, support.base.bottom + 0.24));
    foot.push({ x: point.x, z: point.y, lower, upperX, upperZ, upper });
  }
  const vertices: number[] = [];
  const indices: number[] = [];
  // Rounded fillet profile: the contact flares only a few hundredths, then
  // tightens into the lower frame. It has no separate platform or hardware.
  for (let ring = 0; ring < 5; ring++) {
    const t = ring / 4;
    const inset = Math.sin(t * Math.PI / 2);
    const height = 1 - Math.cos(t * Math.PI / 2);
    for (const point of foot) vertices.push(
      THREE.MathUtils.lerp(point.x, point.upperX, inset),
      THREE.MathUtils.lerp(point.lower, point.upper, height),
      THREE.MathUtils.lerp(point.z, point.upperZ, inset),
    );
  }
  const n = foot.length;
  for (let ring = 0; ring < 4; ring++) {
    for (let i = 0; i < n; i++) {
      const a = ring * n + i, b = ring * n + (i + 1) % n;
      indices.push(a, a + n, b, b, a + n, b + n);
    }
  }
  // The caps are internal to the receiver/frame, but close the volume so
  // transmission never reveals an open shell when looking up from below.
  for (let i = 1; i < n - 1; i++) {
    indices.push(0, i, i + 1);
    indices.push(4 * n, 4 * n + i + 1, 4 * n + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.name = "FittedFrameFillet";
  return geometry;
}
