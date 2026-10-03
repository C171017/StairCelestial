import assert from "node:assert/strict";
import { test } from "node:test";
import { applyProps } from "@react-three/fiber";
import { BoxGeometry, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { interactiveMeshRaycast } from "./interactiveMeshRaycast";

function hitTarget() {
  const geometry = new BoxGeometry(2.7, 3.5, 0.8);
  const material = new MeshBasicMaterial({ transparent: true, opacity: 0 });
  const mesh = new Mesh(geometry, material);
  mesh.updateMatrixWorld();
  const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
  return { mesh, ray, dispose: () => { geometry.dispose(); material.dispose(); } };
}

test("a door disabled during entry becomes clickable when the scene is active", () => {
  const { mesh, ray, dispose } = hitTarget();
  try {
    applyProps(mesh, { raycast: interactiveMeshRaycast(false) });
    assert.equal(ray.intersectObject(mesh).length, 0);
    // This was the regression: undefined does not undo the disabled raycast.
    applyProps(mesh, { raycast: undefined });
    assert.equal(ray.intersectObject(mesh).length, 0);
    applyProps(mesh, { raycast: interactiveMeshRaycast(true) });
    assert.ok(ray.intersectObject(mesh).length > 0);
  } finally { dispose(); }
});

test("doors become clickable again after another door is focused and closed", () => {
  const { mesh, ray, dispose } = hitTarget();
  try {
    for (let selection = 0; selection < 5; selection++) {
      applyProps(mesh, { raycast: interactiveMeshRaycast(true) });
      assert.ok(ray.intersectObject(mesh).length > 0);
      applyProps(mesh, { raycast: interactiveMeshRaycast(false) });
      assert.equal(ray.intersectObject(mesh).length, 0);
      applyProps(mesh, { raycast: interactiveMeshRaycast(true) });
      assert.ok(ray.intersectObject(mesh).length > 0);
    }
  } finally { dispose(); }
});
