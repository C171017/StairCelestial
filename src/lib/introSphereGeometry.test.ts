import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createPlayShapeGeometry } from "./playShapeGeometry";
import { createIntroSphereGeometry } from "./introSphereGeometry";

test("sphere morph preserves the sculpture's exact face planes and corners", () => {
  const shape = createPlayShapeGeometry();
  const sphere = createIntroSphereGeometry(shape.geometry, 0.315);
  const positions = sphere.getAttribute("position");
  const target = sphere.morphAttributes.position[0];
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
    assert.ok(Math.abs(a.length() - 0.315) < 1e-6);
    a.fromBufferAttribute(target, i);
    assert.ok(planes.some(plane => Math.abs(plane.distanceToPoint(a)) < 1e-6));
    b.fromBufferAttribute(sphere.morphAttributes.normal[0], i);
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
  sphere.dispose();
  shape.geometry.dispose();
});
