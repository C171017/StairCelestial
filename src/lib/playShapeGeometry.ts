import * as THREE from "three";
import { getPlayCubeEdgeLength, getPlayTetrahedronRadius } from "./eyeControlMetrics";

/** A cube and an inscribed tetrahedron share these eight moving corners.
 * The four other corners settle into face centers in the triangular state.
 * Keeping the same surface throughout makes the transition reversible.
 */
export function createPlayShapeGeometry() {
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
    [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]];
  const retained = (v: THREE.Vector3) => v.x * v.y * v.z > 0;
  const align = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, -1).normalize(), new THREE.Vector3(0, 0, 1),
  );
  const tip = corners[1].clone().applyQuaternion(align);
  const faceRotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1), -Math.atan2(tip.y, tip.x),
  );
  const cubeRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.34, -0.48, -0.04));
  const triangleTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.26, -0.95, -0.06));
  const triangleRotation = triangleTilt.clone().multiply(faceRotation).multiply(align);
  const rotation = new THREE.Quaternion();
  const indices: number[] = [];
  for (const face of faces) {
    // Split each square along the edge shared by two retained tetrahedron corners.
    if (!retained(corners[face[0]])) face.push(face.shift()!);
    indices.push(face[0], face[1], face[2], face[0], face[2], face[3]);
  }
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.Float32BufferAttribute(new Float32Array(indices.length * 3), 3);
  positions.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  const point = new THREE.Vector3();
  function update(amount: number) {
    rotation.slerpQuaternions(triangleRotation, cubeRotation, amount);
    indices.forEach((corner, i) => {
      const radius = THREE.MathUtils.lerp(
        getPlayTetrahedronRadius() / Math.sqrt(3) * (retained(corners[corner]) ? 1 : 1 / 3),
        getPlayCubeEdgeLength() * 0.43,
        amount,
      );
      point.copy(corners[corner]).multiplyScalar(radius).applyQuaternion(rotation);
      positions.setXYZ(i, point.x, point.y, point.z);
    });
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  }
  update(0);
  return { geometry, update };
}
