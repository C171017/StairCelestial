import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { createPlayShapeGeometry } from "./playShapeGeometry";
import { addMetalTangents } from "./metalGeometry";

/** Truncate the moving convex solid by a small fraction of each face. This
 * creates actual edge facets for reflections, while keeping the original
 * tetrahedron/cube morph, orientation and bounding volume. */
export function createBeveledPlayShapeGeometry() {
  const source = createPlayShapeGeometry();
  const geometry = new THREE.BufferGeometry();
  const key = (v: THREE.Vector3) => `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
  let initialized = false;
  function update(amount: number) {
    source.update(amount);
    const unique = new Map<string, THREE.Vector3>();
    const attribute = source.geometry.getAttribute("position");
    for (let i = 0; i < attribute.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(attribute, i);
      unique.set(key(point), point);
    }
    const hull = new ConvexGeometry([...unique.values()]);
    const positions = hull.getAttribute("position");
    const normals = hull.getAttribute("normal");
    const faces = new Map<string, Map<string, THREE.Vector3>>();
    const faceNormals: THREE.Vector3[] = [];
    for (let i = 0; i < positions.count; i++) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, i);
      const normal = new THREE.Vector3().fromBufferAttribute(normals, i);
      const plane = `${key(normal)}:${normal.dot(point).toFixed(6)}`;
      let face = faces.get(plane);
      if (!face) { face = new Map(); faces.set(plane, face); faceNormals.push(normal); }
      face.set(key(point), point);
    }
    const bevelPoints: THREE.Vector3[] = [];
    for (const face of faces.values()) {
      const center = new THREE.Vector3();
      face.forEach(point => center.add(point));
      center.divideScalar(face.size);
      face.forEach(point => bevelPoints.push(point.clone().lerp(center, 0.055)));
    }
    const beveled = addMetalTangents(new ConvexGeometry(bevelPoints));
    const bevelNormals = beveled.getAttribute("normal");
    const bevelMask = new Float32Array(bevelNormals.count);
    const normal = new THREE.Vector3();
    for (let i = 0; i < bevelNormals.count; i++) {
      normal.fromBufferAttribute(bevelNormals, i);
      bevelMask[i] = faceNormals.some(face => face.dot(normal) > 0.9999) ? 0 : 1;
    }
    beveled.setAttribute("metalBevel", new THREE.BufferAttribute(bevelMask, 1));
    // Topology changes during the reversible morph. Release the old GPU
    // attributes before replacing them; the Mesh keeps the same geometry.
    if (initialized) geometry.dispose();
    geometry.copy(beveled);
    geometry.computeBoundingSphere();
    initialized = true;
    hull.dispose(); beveled.dispose();
  }
  update(0);
  source.geometry.dispose();
  return { geometry, update };
}
