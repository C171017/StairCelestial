import * as THREE from "three";

/** Subdivide the actual sculpture faces, then project that same surface onto a
 * sphere. The GPU morph ends on the exact original faces, including their edges. */
export function createIntroSphereGeometry(target: THREE.BufferGeometry, radius: number) {
  const source = target.getAttribute("position");
  const sphere: number[] = [], solid: number[] = [];
  const sphereNormals: number[] = [], solidNormals: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const point = new THREE.Vector3(), normal = new THREE.Vector3(), direction = new THREE.Vector3();
  const divisions = 16;
  const emit = (u: number, v: number) => {
    point.copy(a).multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v);
    direction.copy(point).normalize();
    sphere.push(direction.x * radius, direction.y * radius, direction.z * radius);
    solid.push(point.x, point.y, point.z);
    sphereNormals.push(direction.x, direction.y, direction.z);
    solidNormals.push(normal.x, normal.y, normal.z);
  };
  for (let face = 0; face < source.count; face += 3) {
    a.fromBufferAttribute(source, face);
    b.fromBufferAttribute(source, face + 1);
    c.fromBufferAttribute(source, face + 2);
    normal.subVectors(b, a).cross(direction.subVectors(c, a)).normalize();
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions - i; j++) {
        emit(i / divisions, j / divisions);
        emit((i + 1) / divisions, j / divisions);
        emit(i / divisions, (j + 1) / divisions);
        if (i + j < divisions - 1) {
          emit((i + 1) / divisions, j / divisions);
          emit((i + 1) / divisions, (j + 1) / divisions);
          emit(i / divisions, (j + 1) / divisions);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(sphere, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(sphereNormals, 3));
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(solid, 3)];
  geometry.morphAttributes.normal = [new THREE.Float32BufferAttribute(solidNormals, 3)];
  geometry.computeBoundingSphere();
  return geometry;
}
