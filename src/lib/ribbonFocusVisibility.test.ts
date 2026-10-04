import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { chooseRibbonFocusSide } from "./ribbonFocusVisibility";
import { getDoorAperture } from "./doorAperture";
import { doorStudies } from "./doorStudies";
import { doorPlacement } from "./doorPlacement";
import { getDoorBase, fitDoorSupport } from "./doorSupport";
import { createRibbonSections } from "./ribbonGeometry";
import { floatDoorSupport } from "./floatingDoor";
import { ORBIT_HEIGHT, ORBIT_RADIUS } from "./ribbonOrbit";

const options = {
  focusScale: 1.7, focusPosition: { x: 0, y: 2.3, z: 4.2 },
  cameraPosition: new THREE.Vector3(0, ORBIT_HEIGHT, ORBIT_RADIUS),
};

async function loadDoor(id: string) {
  const bytes = await readFile(new URL(`../../public/models/doors/${id}.glb`, import.meta.url));
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "")).scene;
}

test("focus chooses the unobstructed face and retains the front on a clear tie", async () => {
  const model = await loadDoor("hourglass");
  const support = fitDoorSupport(doorPlacement(0), getDoorBase(model), 5.7, 2.25, false);
  support.position.set(0, 0, 0);
  support.yaw = 0;
  const aperture = getDoorAperture(model);
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 0.2), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  for (const z of [-3, 3]) {
    obstacle.position.set(0, 1.5, z);
    const chosen = chooseRibbonFocusSide(obstacle, support, aperture, options);
    assert.equal(chosen.side, z > 0 ? -1 : 1);
    assert.equal(chosen.blocked, 0);
  }
  obstacle.position.x = 100;
  assert.equal(chooseRibbonFocusSide(obstacle, support, aperture, options).side, 1);
  obstacle.geometry.dispose(); obstacle.material.dispose();
});

test("both obstructed faces select the smaller obstruction", async () => {
  const model = await loadDoor("hourglass");
  const support = fitDoorSupport(doorPlacement(0), getDoorBase(model), 5.7, 2.25, false);
  support.position.set(0, 0, 0); support.yaw = 0;
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const front = new THREE.BoxGeometry(10, 10, 0.2).translate(0, 1.5, 3).toNonIndexed();
  const back = new THREE.BoxGeometry(0.3, 10, 0.2).translate(0, 1.5, -3).toNonIndexed();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    ...front.getAttribute("position").array, ...back.getAttribute("position").array,
  ], 3));
  const chosen = chooseRibbonFocusSide(new THREE.Mesh(geometry, material), support, getDoorAperture(model), options);
  assert.equal(chosen.side, -1);
  assert.ok(chosen.blocked > 0);
  front.dispose(); back.dispose(); geometry.dispose(); material.dispose();
});

test("all six floating door openings find clear views on desktop and compact porcelain spirals", async () => {
  for (const compact of [false, true]) {
    const radius = compact ? 2.6 : 5.7, width = compact ? 1.45 : 2.25;
    const sections = createRibbonSections(radius, width);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const ribbon = new THREE.Group().add(...sections.map(section => new THREE.Mesh(section, material)));
    for (const study of doorStudies) {
      const model = await loadDoor(study.id);
      for (const occurrence of [-3, 0, 3]) {
        const support = floatDoorSupport(fitDoorSupport(doorPlacement(occurrence, 731), getDoorBase(model), radius, width, compact));
        const result = chooseRibbonFocusSide(ribbon, support, getDoorAperture(model), { ...options, focusScale: compact ? 1.55 : 1.7 });
        assert.equal(result.blocked, 0, `${study.id}, compact=${compact}, occurrence=${occurrence}`);
      }
    }
    sections.forEach(section => section.dispose()); material.dispose();
  }
});
