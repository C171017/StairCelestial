import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceRibbonFocus, createRibbonFocus } from "./ribbonFocus";
import { positiveModulo } from "./ribbonMotion";
import { ribbonPoint, RIBBON_PITCH } from "./ribbonGeometry";
import { doorPlacement } from "./doorPlacement";
import * as THREE from "three";
import { ORBIT_HEIGHT, ORBIT_RADIUS, ribbonOrbitPosition, ribbonOrbitAngle } from "./ribbonOrbit";

test("doors face and remain centered on the viewer throughout a complete camera orbit", () => {
  const up = new THREE.Vector3(0, 1, 0);
  for (const turns of [-1.001, -0.75, -0.5, -0.25, -0.001, 0, 0.25, 0.5, 0.75, 1.001]) {
    for (const occurrence of [-4, 0, 3]) {
      const angle = ribbonOrbitAngle(turns);
      const placement = doorPlacement(occurrence);
      const anchor = ribbonPoint(placement.turn, 5.7);
      const state = createRibbonFocus();
      for (let i = 0; i < 600; i++) advanceRibbonFocus(state, anchor, 1 / 120, {
        doorYaw: placement.yaw, viewYaw: angle,
        cameraPosition: { x: 0, y: ORBIT_HEIGHT, z: ORBIT_RADIUS },
        focusPosition: { x: 0, y: 2.3, z: 4.2 },
      });
      const transform = new THREE.Quaternion().setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0))
        .premultiply(new THREE.Quaternion().setFromAxisAngle(up, state.viewYaw));
      const center = anchor.clone().applyQuaternion(transform).multiplyScalar(state.scale)
        .add(new THREE.Vector3(state.x, state.y, state.z));
      const expected = new THREE.Vector3(0, 2.3, 4.2).applyAxisAngle(up, angle);
      assert.ok(center.distanceTo(expected) < 1e-6);
      const face = new THREE.Vector3(0, 0, 1).applyAxisAngle(up, placement.yaw).applyQuaternion(transform);
      assert.ok(face.dot(ribbonOrbitPosition(turns).sub(center).normalize()) > 0.999999);
    }
  }
});

test("a settled focus places the chosen object's center at the intended destination", () => {
  const state = createRibbonFocus();
  const anchor = { x: 4, y: -3, z: 5 };
  for (let i = 0; i < 600; i++) advanceRibbonFocus(state, anchor, 1 / 120);
  assert.ok(Math.abs(anchor.x * state.scale + state.x) < 0.000001);
  assert.ok(Math.abs(anchor.y * state.scale + state.y - 0.2) < 0.000001);
  assert.ok(Math.abs(anchor.z * state.scale + state.z - 4.2) < 0.000001);
});

test("switching focused projects begins at the existing pose without an anchor jump", () => {
  const state = createRibbonFocus();
  for (let i = 0; i < 180; i++) advanceRibbonFocus(state, { x: 4, y: -3, z: 5 }, 1 / 60);
  const previous = { ...state };
  const nextAnchor = { x: -4, y: 5, z: -3 };
  advanceRibbonFocus(state, nextAnchor, 1 / 120);
  const blend = 1 - Math.exp(-4.5 / 120);
  assert.ok(Math.abs(state.x - (previous.x + (6.8 - previous.x) * blend)) < 1e-12);
  assert.ok(Math.abs(state.x - previous.x) < 0.6);
  assert.ok(Math.abs(state.y - previous.y) < 0.6);
});

test("return does not require or clear an outgoing anchor to preserve continuity", () => {
  const state = createRibbonFocus();
  for (let i = 0; i < 180; i++) advanceRibbonFocus(state, { x: 4, y: -3, z: 5 }, 1 / 60);
  const previous = { ...state };
  advanceRibbonFocus(state, null, 1 / 60);
  assert.ok(Math.abs(state.x) > Math.abs(previous.x) * 0.9);
  assert.ok(state.scale > 1.6);
  for (let i = 0; i < 240; i++) advanceRibbonFocus(state, null, 1 / 60);
  assert.deepEqual(state, createRibbonFocus());
});

test("focus interpolation has the same result at 30 and 120 fps", () => {
  const simulate = (fps: number) => {
    const state = createRibbonFocus();
    for (let i = 0; i < fps; i++) advanceRibbonFocus(state, { x: 4, y: -3, z: 5 }, 1 / fps);
    return state;
  };
  const slow = simulate(30);
  const fast = simulate(120);
  for (const key of ["x", "y", "z", "scale"] as const) assert.ok(Math.abs(slow[key] - fast[key]) < 1e-12);
});

test("reduced motion permits selection without spatial focus travel", () => {
  const state = createRibbonFocus();
  advanceRibbonFocus(state, { x: 4, y: -3, z: 5 }, 1 / 60, { reducedMotion: true });
  assert.deepEqual(state, createRibbonFocus());
});

test("recycling equivalent slots preserves world position and project identity in either direction", () => {
  for (const cycle of [-10000, -1, 0, 1, 10000]) {
    const position = cycle + 0.999;
    for (let slot = -3; slot < 6; slot++) {
      const old = ribbonPoint(slot / 3, 5.7);
      old.y -= (position - cycle) * RIBBON_PITCH;
      const next = ribbonPoint((slot - 3) / 3, 5.7);
      next.y -= (position - (cycle + 1)) * RIBBON_PITCH;
      assert.ok(old.distanceTo(next) < 1e-10);
      assert.equal(positiveModulo(slot + cycle * 3, 4), positiveModulo(slot - 3 + (cycle + 1) * 3, 4));
    }
  }
});

test("scattered doors retain their position and orientation when the ribbon recycles", () => {
  for (const cycle of [-10000, -1, 0, 1, 10000]) {
    for (const direction of [-1, 1]) {
      for (let slot = -3; slot < 6; slot++) {
        const occurrence = slot + cycle * 3;
        const nextCycle = cycle + direction;
        const nextSlot = slot - direction * 3;
        const before = doorPlacement(occurrence);
        const after = doorPlacement(nextSlot + nextCycle * 3);
        assert.deepEqual(before, after);
        const old = ribbonPoint(before.turn - cycle, 5.7 + before.lateral * 2.25);
        const next = ribbonPoint(after.turn - nextCycle, 5.7 + after.lateral * 2.25);
        old.y += cycle * RIBBON_PITCH;
        next.y += nextCycle * RIBBON_PITCH;
        assert.ok(old.distanceTo(next) < 1e-8);
      }
    }
  }
});

test("every scattered facing angle settles front-on with its center at the focus destination", () => {
  for (const compact of [false, true]) {
    const destination = { x: 0, y: 2.3, z: 4.2 };
    const camera = new THREE.Vector3(0, 2.8, 24);
    for (let occurrence = -12; occurrence < 12; occurrence++) {
      const placement = doorPlacement(occurrence);
      const anchor = ribbonPoint(placement.turn, 5.7 + placement.lateral * 2.25);
      const state = createRibbonFocus();
      for (let frame = 0; frame < 600; frame++) advanceRibbonFocus(state, anchor, 1 / 120, {
        doorYaw: placement.yaw, cameraPosition: camera, focusPosition: destination,
        focusScale: compact ? 1.55 : 1.7,
      });
      const orientation = new THREE.Euler(state.pitch, state.yaw, 0);
      const center = anchor.clone().applyEuler(orientation).multiplyScalar(state.scale)
        .add(new THREE.Vector3(state.x, state.y, state.z));
      assert.ok(center.distanceTo(new THREE.Vector3(destination.x, destination.y, destination.z)) < 1e-6);
      const face = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), placement.yaw).applyEuler(orientation);
      const view = camera.clone().sub(center).normalize();
      assert.ok(face.dot(view) > 0.999999, `door ${occurrence} must face the viewer`);
    }
  }
});

test("switching door orientations takes the shortest turn and returning restores the overview", () => {
  const state = createRibbonFocus();
  const anchor = { x: 4, y: -3, z: 5 };
  const options = { doorYaw: Math.PI - 0.05, cameraPosition: { x: 0, y: 2.8, z: 24 } };
  for (let frame = 0; frame < 240; frame++) advanceRibbonFocus(state, anchor, 1 / 60, options);
  const previous = { ...state };
  advanceRibbonFocus(state, anchor, 1 / 60, { ...options, doorYaw: -Math.PI + 0.05 });
  assert.ok(Math.abs(state.yaw - previous.yaw) < 0.01);
  const focused = { ...state };
  advanceRibbonFocus(state, null, 1 / 60, options);
  assert.ok(Math.abs(state.pitch - focused.pitch) < 0.02);
  assert.ok(Math.abs(state.yaw - focused.yaw) < 0.25);
  for (let frame = 0; frame < 300; frame++) advanceRibbonFocus(state, null, 1 / 60, options);
  assert.deepEqual(state, createRibbonFocus());
});

test("reduced-motion door selection immediately presents the front and resets on return", () => {
  const state = createRibbonFocus();
  const options = { doorYaw: 1.7, cameraPosition: { x: 0, y: 2.8, z: 24 }, reducedMotion: true };
  advanceRibbonFocus(state, { x: 4, y: -3, z: 5 }, 1 / 60, options);
  assert.equal(state.yaw, -1.7);
  assert.equal(state.scale, 1.7);
  advanceRibbonFocus(state, null, 1 / 60, options);
  assert.deepEqual(state, createRibbonFocus());
});
