import * as THREE from "three";

/** Subdivide the actual sculpture faces, then project that same surface onto a
 * shallow iris lens. One continuous GPU morph adds depth and forms the exact
 * original faces, including their edges; there is no intermediate sphere. */
export function createIntroIrisGeometry(target: THREE.BufferGeometry, radius: number) {
  const source = target.getAttribute("position");
  const iris: number[] = [], solid: number[] = [];
  const irisNormals: number[] = [], solidNormals: number[] = [];
  const uv: number[] = [];
  const depth = 0.18;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const point = new THREE.Vector3(), normal = new THREE.Vector3(), direction = new THREE.Vector3();
  const divisions = 16;
  const emit = (u: number, v: number) => {
    point.copy(a).multiplyScalar(1 - u - v).addScaledVector(b, u).addScaledVector(c, v);
    direction.copy(point).normalize();
    iris.push(direction.x * radius, direction.y * radius, direction.z * radius * depth);
    uv.push(direction.x * 0.5 + 0.5, direction.y * 0.5 + 0.5);
    solid.push(point.x, point.y, point.z);
    direction.set(direction.x, direction.y, direction.z / depth).normalize();
    irisNormals.push(direction.x, direction.y, direction.z);
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
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(iris, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(irisNormals, 3));
  geometry.morphAttributes.position = [new THREE.Float32BufferAttribute(solid, 3)];
  geometry.morphAttributes.normal = [new THREE.Float32BufferAttribute(solidNormals, 3)];
  geometry.computeBoundingSphere();
  return geometry;
}
