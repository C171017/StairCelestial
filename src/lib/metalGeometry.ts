import * as THREE from "three";

/** Explicit tangents give untextured metal a real anisotropic BRDF. The
 * contour direction follows the door opening, rather than an absent UV map.
 * Call on owned geometry only; loader-cached GLB buffers stay untouched. */
export function addMetalTangents(geometry: THREE.BufferGeometry, contour = false) {
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const tangents = new Float32Array(positions.count * 4);
  const normal = new THREE.Vector3();
  const direction = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    normal.fromBufferAttribute(normals, i).normalize();
    if (contour) direction.set(-(positions.getY(i) - 1.65), positions.getX(i), 0);
    else direction.set(0, 1, 0);
    direction.addScaledVector(normal, -direction.dot(normal));
    if (direction.lengthSq() < 0.000001) {
      direction.set(Math.abs(normal.x) < 0.8 ? 1 : 0, 0, Math.abs(normal.x) < 0.8 ? 0 : 1);
      direction.addScaledVector(normal, -direction.dot(normal));
    }
    direction.normalize();
    tangents.set([direction.x, direction.y, direction.z, 1], i * 4);
  }
  geometry.setAttribute("tangent", new THREE.BufferAttribute(tangents, 4));
  return geometry;
}
