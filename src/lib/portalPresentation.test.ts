import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { apertureContainsRectangle, getDoorAperture } from "./doorAperture";
import { getDoorBase, fitDoorSupport } from "./doorSupport";
import { doorPlacement } from "./doorPlacement";
import { doorStudies } from "./doorStudies";
import { createPortalOcclusionProbe, doorPresentationSamples, portalOcclusionVisibility, portalViewportVisibility } from "./portalPresentation";

test("portal probe distinguishes clear, fully blocked and partially blocked openings", () => {
  const samples = [-0.64, 0, 0.64].flatMap(x => [0.36, 1, 1.64].map(y => new THREE.Vector3(x, y, 0)));
  const camera = new THREE.Vector3(0, 1, 5);
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.1), new THREE.MeshBasicMaterial());
  const measure = createPortalOcclusionProbe();
  obstacle.position.set(0, 1, -2); obstacle.updateMatrixWorld();
  assert.equal(measure(obstacle, camera, samples), 1, "ribbon behind the opening must not hide it");
  obstacle.position.z = 2; obstacle.updateMatrixWorld();
  assert.equal(measure(obstacle, camera, samples), 0);
  obstacle.scale.x = 0.8 / 3; obstacle.position.x = -0.5; obstacle.updateMatrixWorld();
  const partiallyClear = measure(obstacle, camera, samples);
  assert.equal(partiallyClear, 2 / 3);
  assert.ok(portalOcclusionVisibility(partiallyClear) > 0 && portalOcclusionVisibility(partiallyClear) < 1);
  assert.equal(portalOcclusionVisibility(4 / 9), 0, "a mostly blocked opening must not leave a visible fragment");
  obstacle.geometry.dispose(); obstacle.material.dispose();
});

test("vertical viewport edges fade gradually before only a sliver remains", () => {
  const samples = [-0.3, 0, 0.3].map(y => new THREE.Vector3(0, y, 0));
  const transform = new THREE.Matrix4();
  assert.equal(portalViewportVisibility(samples, transform), 1);
  transform.makeTranslation(0, 0.95, 0);
  const partial = portalViewportVisibility(samples, transform);
  assert.ok(partial > 0 && partial < 1);
  transform.makeTranslation(0, 1.3, 0);
  assert.equal(portalViewportVisibility(samples, transform), 0);
  transform.makeTranslation(0, -1.3, 0);
  assert.equal(portalViewportVisibility(samples, transform), 0);
  transform.makeTranslation(0, 0, 2);
  assert.equal(portalViewportVisibility(samples, transform), 0, "points beyond the camera depth range stay hidden");
});

test("compact views remove sliced openings while desktop retains gradual partial visibility", () => {
  assert.equal(portalOcclusionVisibility(6 / 9, true), 0, "one fully blocked sample row hides a compact portal");
  assert.ok(portalOcclusionVisibility(6 / 9) > 0, "desktop behavior remains unchanged");
  assert.equal(portalOcclusionVisibility(7 / 9, true), 0, "a still-sliced opening cannot remain as a dithered ghost");
  assert.equal(portalOcclusionVisibility(8 / 9, true), 1, "an almost-clear silhouette targets opaque porcelain");
  assert.equal(portalOcclusionVisibility(1, true), 1);
});

test("all nine presentation samples stay inside each real exported opening", async () => {
  for (const study of doorStudies) {
    const bytes = await readFile(new URL(`../../public/models/doors/${study.id}.glb`, import.meta.url));
    const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
    const aperture = getDoorAperture(scene);
    const support = fitDoorSupport(doorPlacement(3, 731), getDoorBase(scene), 5.7, 2.25, false);
    const inverse = new THREE.Matrix4().compose(support.position,
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), support.yaw),
      new THREE.Vector3().setScalar(support.scale)).invert();
    const samples = doorPresentationSamples(support, aperture);
    assert.equal(samples.length, 9);
    for (const sample of samples) {
      const local = sample.clone().applyMatrix4(inverse);
      assert.ok(apertureContainsRectangle(aperture, new THREE.Vector2(local.x, local.y), 0, 0), study.id);
    }
  }
});
