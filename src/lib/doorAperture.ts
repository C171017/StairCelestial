import * as THREE from "three";

type Segment = { a: THREE.Vector2; b: THREE.Vector2 };
export type DoorAperture = { bounds: THREE.Box2; center: THREE.Vector2; segments: Segment[] };

/** Slice the exported leaf at its midplane to recover its concave opening. */
export function getDoorAperture(scene: THREE.Object3D): DoorAperture {
  scene.updateWorldMatrix(true, true);
  const rootInverse = scene.matrixWorld.clone().invert();
  const segments: Segment[] = [];
  const bounds = new THREE.Box2();
  scene.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh || !mesh.name.startsWith("Slab_Glass")) return;
    const transform = rootInverse.clone().multiply(mesh.matrixWorld);
    const positions = mesh.geometry.getAttribute("position");
    const index = mesh.geometry.index;
    const vertices = Array.from({ length: positions.count }, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(transform));
    const sliceZ = new THREE.Box3().setFromPoints(vertices).getCenter(new THREE.Vector3()).z;
    const count = index?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      const triangle = [0, 1, 2].map(offset => vertices[index ? index.getX(i + offset) : i + offset]);
      const crossings: THREE.Vector2[] = [];
      for (let edge = 0; edge < 3; edge++) {
        const a = triangle[edge];
        const b = triangle[(edge + 1) % 3];
        if ((a.z < sliceZ) === (b.z < sliceZ)) continue;
        const t = (sliceZ - a.z) / (b.z - a.z);
        crossings.push(new THREE.Vector2(THREE.MathUtils.lerp(a.x, b.x, t), THREE.MathUtils.lerp(a.y, b.y, t)));
      }
      if (crossings.length === 2 && crossings[0].distanceToSquared(crossings[1]) > 1e-12) {
        segments.push({ a: crossings[0], b: crossings[1] });
        crossings.forEach(point => bounds.expandByPoint(point));
      }
    }
  });
  if (!segments.length) throw new Error("Door model has no glass-leaf aperture");
  const center = bounds.getCenter(new THREE.Vector2());
  // At midheight, center between the actual sides rather than the outer lobes.
  const crossings = segments.filter(({ a, b }) => (a.y > center.y) !== (b.y > center.y))
    .map(({ a, b }) => a.x + (center.y - a.y) * (b.x - a.x) / (b.y - a.y))
    .sort((a, b) => a - b);
  let closest = Infinity;
  const boundsCenterX = center.x;
  for (let i = 0; i + 1 < crossings.length; i += 2) {
    const x = (crossings[i] + crossings[i + 1]) / 2;
    const distance = Math.abs(x - boundsCenterX);
    if (distance < closest) { closest = distance; center.x = x; }
  }
  return { bounds, center, segments };
}

function containsPoint(aperture: DoorAperture, x: number, y: number) {
  let inside = false;
  for (const { a, b } of aperture.segments) {
    if ((a.y > y) !== (b.y > y) && x < a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y)) inside = !inside;
  }
  return inside;
}

/** Whether a contour segment touches the rectangle (slab intersection). */
function intersectsRectangle({ a, b }: Segment, minX: number, maxX: number, minY: number, maxY: number) {
  let enter = 0;
  let exit = 1;
  for (const [start, direction, min, max] of [
    [a.x, b.x - a.x, minX, maxX],
    [a.y, b.y - a.y, minY, maxY],
  ]) {
    if (Math.abs(direction) < 1e-12) {
      if (start < min || start > max) return false;
    } else {
      const t1 = (min - start) / direction;
      const t2 = (max - start) / direction;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) return false;
    }
  }
  return true;
}

/** Corners alone miss inward curves, such as the Hourglass waist. */
export function apertureContainsRectangle(aperture: DoorAperture, center: THREE.Vector2, width: number, height: number) {
  const minX = center.x - width / 2;
  const maxX = center.x + width / 2;
  const minY = center.y - height / 2;
  const maxY = center.y + height / 2;
  return [[minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY]].every(([x, y]) => containsPoint(aperture, x, y))
    && !aperture.segments.some(segment => intersectsRectangle(segment, minX, maxX, minY, maxY));
}

export const PROJECT_FRAME_CLEARANCE = 0.09;

/** Uniformly shrink the complete object bounds, including its depth and arms. */
export function fitProjectToDoor(bounds: THREE.Box3, aperture: DoorAperture) {
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const openingCenter = aperture.center;
  let low = 0;
  let high = Math.min(1.5 / Math.max(size.x, 1e-6), 1.75 / Math.max(size.y, 1e-6), 0.6 / Math.max(size.z, 1e-6));
  for (let i = 0; i < 24; i++) {
    const scale = (low + high) / 2;
    if (apertureContainsRectangle(aperture, openingCenter,
      size.x * scale + PROJECT_FRAME_CLEARANCE * 2,
      size.y * scale + PROJECT_FRAME_CLEARANCE * 2)) low = scale;
    else high = scale;
  }
  return {
    scale: low,
    position: new THREE.Vector3(openingCenter.x - center.x * low, openingCenter.y - center.y * low, -0.55 - center.z * low),
  };
}
