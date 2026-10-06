import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { addMetalTangents } from "./metalGeometry";
import { createBeveledPlayShapeGeometry } from "./beveledPlayShape";
import { createPlayShapeGeometry } from "./playShapeGeometry";

function checkTangents(geometry: THREE.BufferGeometry) {
  const normals = geometry.getAttribute("normal");
  const tangents = geometry.getAttribute("tangent");
  const normal = new THREE.Vector3(), tangent = new THREE.Vector3();
  assert.equal(tangents.count, normals.count);
  for (let i = 0; i < normals.count; i++) {
    normal.fromBufferAttribute(normals, i);
    tangent.fromBufferAttribute(tangents, i);
    assert.ok(Math.abs(tangent.length() - 1) < 1e-5);
    assert.ok(Math.abs(normal.dot(tangent)) < 1e-5);
    assert.equal(tangents.getW(i), 1);
  }
}

test("metal tangents stay finite and orthogonal at poles and contour centers", () => {
  for (const geometry of [new THREE.SphereGeometry(1, 24, 16), new THREE.BoxGeometry()]) {
    for (const contour of [false, true]) checkTangents(addMetalTangents(geometry, contour));
    geometry.dispose();
  }
});

test("beveled control stays closed, finite and inside the original morph envelope", () => {
  const original = createPlayShapeGeometry();
  const beveled = createBeveledPlayShapeGeometry();
  const vertex = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const vertexKey = (i: number, p: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map(value => value.toFixed(6)).join(",");
  for (const amount of [0, 0.00001, 0.001, 0.1, 0.25, 0.5, 0.75, 0.99, 0.99999, 1, 0.5, 0]) {
    original.update(amount); beveled.update(amount);
    original.geometry.computeBoundingBox();
    const bounds = original.geometry.boundingBox!.clone().expandByScalar(1e-6);
    const positions = beveled.geometry.getAttribute("position");
    assert.ok(positions.count > 36, "Bevels add actual surface facets");
    checkTangents(beveled.geometry);
    const edges = new Map<string, number>();
    let volume = 0;
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      assert.ok(bounds.containsPoint(vertex), "Bevel must not enlarge the silhouette");
      const next = i - i % 3 + (i % 3 + 1) % 3;
      const edge = [vertexKey(i, positions), vertexKey(next, positions)].sort().join("|");
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
      if (i % 3 === 0) {
        a.fromBufferAttribute(positions, i); b.fromBufferAttribute(positions, i + 1); c.fromBufferAttribute(positions, i + 2);
        volume += a.dot(b.cross(c)) / 6;
      }
    }
    assert.ok(volume > 0.0001, "Closed solid retains outward winding and volume");
    assert.ok([...edges.values()].every(count => count === 2), `Every edge closes at morph ${amount}`);
  }
  original.geometry.dispose(); beveled.geometry.dispose();
});
