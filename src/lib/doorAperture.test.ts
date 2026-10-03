import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { apertureContainsRectangle, fitProjectToDoor, getDoorAperture, PROJECT_FRAME_CLEARANCE } from "./doorAperture";
import { doorStudies } from "./doorStudies";
import { projectIndexForDoor, sanctuaryProjects } from "./sanctuaryContent";

async function loadModel(path: string) {
  const buffer = await readFile(new URL(`../../public/models/${path}.glb`, import.meta.url));
  return (await new GLTFLoader().parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "")).scene;
}

test("each exported project fits its actual door contour with clearance, centered behind the glass", async () => {
  for (const study of doorStudies) {
    const project = sanctuaryProjects[projectIndexForDoor(study.id)];
    const door = await loadModel(`doors/${study.id}`);
    const model = await loadModel(`sanctuary/${project.model}`);
    if (project.model === "music") model.rotateX(0.65);
    const aperture = getDoorAperture(door);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const fit = fitProjectToDoor(bounds, aperture);
    assert.ok(fit.scale > 0.04, `${study.id} retains a visible object`);
    model.scale.multiplyScalar(fit.scale);
    model.position.copy(fit.position);
    const placed = new THREE.Box3().setFromObject(model);
    const center = placed.getCenter(new THREE.Vector3());
    assert.ok(Math.abs(center.x - aperture.center.x) < 1e-6, study.id);
    assert.ok(Math.abs(center.y - aperture.center.y) < 1e-6, study.id);
    assert.ok(placed.max.z <= -0.249999, `${study.id} stays behind the frame`);
    assert.ok(apertureContainsRectangle(aperture, aperture.center,
      size.x * fit.scale + 2 * PROJECT_FRAME_CLEARANCE,
      size.y * fit.scale + 2 * PROJECT_FRAME_CLEARANCE), `${study.id} clears its curved sides`);
  }
});

test("a rectangle fitting the Hourglass outer bounds still cannot cross its waist", async () => {
  const aperture = getDoorAperture(await loadModel("doors/hourglass"));
  const size = aperture.bounds.getSize(new THREE.Vector2());
  assert.ok(size.x > 1.5);
  assert.equal(apertureContainsRectangle(aperture, aperture.center, 1.15, 1.75), false);
});
