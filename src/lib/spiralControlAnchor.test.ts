import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { spiralControlAnchor, getCloudControlFinalScale } from "./spiralControlAnchor";
import { createRibbonFocus, advanceRibbonFocus } from "./ribbonFocus";
import { ribbonOrbitPosition } from "./ribbonOrbit";

test("the control stays on the transformed spiral axis at camera height throughout focus and return", () => {
  const point = new THREE.Vector3();
  const frame = new THREE.Object3D();
  for (const viewYaw of [0, 0.7, Math.PI, 5.8]) {
    const focus = createRibbonFocus();
    for (let tick = 0; tick < 360; tick++) {
      const anchor = tick < 120 ? { x: 5, y: -3, z: 2 }
        : tick < 240 ? { x: -4, y: 6, z: -3 } : null;
      advanceRibbonFocus(focus, anchor, 1 / 60, {
        doorYaw: tick < 120 ? -0.4 : 2.1,
        viewYaw, cameraPosition: { x: 0, y: 2.8, z: 24 },
        focusPosition: { x: 0, y: 2.3, z: 4.2 },
      });
      frame.position.set(focus.x, focus.y, focus.z);
      frame.scale.setScalar(focus.scale);
      frame.rotation.set(focus.pitch, focus.yaw, 0);
      frame.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), focus.viewYaw));
      frame.updateMatrixWorld();
      for (const cameraHeight of [0, 2.8, 8]) {
        spiralControlAnchor(frame.matrixWorld, cameraHeight, point);
        assert.equal(point.y, cameraHeight);
        const local = frame.worldToLocal(point.clone());
        assert.ok(Math.abs(local.x) < 1e-10);
        assert.ok(Math.abs(local.z) < 1e-10);
      }
    }
  }
});

test("camera orbit and vertical pool recycling do not detach the axis anchor", () => {
  const expected = new THREE.Vector3(0, 2.8, 0);
  for (const turns of [-1, -0.25, 0, 0.2, 0.5, 1.001]) {
    for (const offset of [-100, -5, 0, 11, 100]) {
      const scrollingFrame = new THREE.Matrix4().makeTranslation(0, offset, 0);
      const camera = ribbonOrbitPosition(turns);
      assert.ok(spiralControlAnchor(scrollingFrame, camera.y, new THREE.Vector3()).distanceTo(expected) < 1e-10);
    }
  }
});

test("a focused spiral moves the control off the viewport center naturally", () => {
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 650);
  camera.position.set(0, 2.8, 24);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const frame = new THREE.Matrix4().makeTranslation(-6, 1, 3);
  const control = spiralControlAnchor(frame, camera.position.y, new THREE.Vector3());
  const screen = control.clone().project(camera);
  assert.ok(Math.abs(screen.x) > 0.3);
  assert.equal(control.x, -6);
  assert.equal(control.y, camera.position.y);
  assert.equal(control.z, 3);
});

test("final control size is reduced by 30 percent at both responsive sizes", () => {
  assert.equal(getCloudControlFinalScale(390), 8.1 * 0.7);
  assert.equal(getCloudControlFinalScale(1280), 17.5 * 0.7);
});
