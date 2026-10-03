import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createPlayShapeGeometry } from "./playShapeGeometry";
import { createIntroIrisGeometry } from "./introIrisGeometry";

test("iris morph preserves the sculpture's exact face planes and corners", () => {
  const shape = createPlayShapeGeometry();
  const iris = createIntroIrisGeometry(shape.geometry, 0.315);
  const positions = iris.getAttribute("position");
  const target = iris.morphAttributes.position[0];
  const original = shape.geometry.getAttribute("position");
  const planes: THREE.Plane[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < original.count; i += 3) {
    planes.push(new THREE.Plane().setFromCoplanarPoints(
      a.fromBufferAttribute(original, i), b.fromBufferAttribute(original, i + 1), c.fromBufferAttribute(original, i + 2),
    ));
  }
  for (let i = 0; i < positions.count; i++) {
    a.fromBufferAttribute(positions, i);
    assert.ok(Math.abs(Math.hypot(a.x, a.y, a.z / 0.18) - 0.315) < 1e-6);
    assert.ok(Math.abs(a.z) <= 0.315 * 0.18 + 1e-6);
    const uv = iris.getAttribute("uv");
    assert.ok(Math.abs(uv.getX(i) - (a.x / 0.315 * 0.5 + 0.5)) < 1e-6);
    assert.ok(Math.abs(uv.getY(i) - (a.y / 0.315 * 0.5 + 0.5)) < 1e-6);
    a.fromBufferAttribute(target, i);
    assert.ok(planes.some(plane => Math.abs(plane.distanceToPoint(a)) < 1e-6));
    b.fromBufferAttribute(iris.morphAttributes.normal[0], i);
    assert.ok(Math.abs(b.length() - 1) < 1e-6);
  }
  for (let i = 0; i < original.count; i++) {
    a.fromBufferAttribute(original, i);
    let found = false;
    for (let j = 0; j < target.count && !found; j++) {
      found = a.distanceToSquared(b.fromBufferAttribute(target, j)) < 1e-12;
    }
    assert.ok(found, "Every original corner must survive the morph");
  }
  iris.dispose();
  shape.geometry.dispose();
});
