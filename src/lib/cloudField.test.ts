import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { cloudLayerOrders, createCloudField } from './cloudField';
import { cloudRenderOrder } from './cloudMotion';

test('the fixed field retains the original cloud artwork and time-zero composition', () => {
  const field = createCloudField();
  assert.equal(field.length, 80);
  assert.equal(field.filter(cloud => cloud.wisp).length, 16);
  const bank = field[18];
  assert.equal(bank.x, -295.0408815099945);
  assert.equal(bank.y, -122.10767145830687);
  assert.equal(bank.z, -323.2458055842653);
  assert.equal(bank.width, 441.7809282469534);
  assert.equal(bank.height, 283.1911599164106);
  assert.equal(bank.opacity, 1);
  const wisp = field[64];
  assert.equal(wisp.x, -565.9325803657703);
  assert.equal(wisp.y, 207.78683193959296);
  assert.equal(wisp.z, -538.7417328213633);
  assert.equal(wisp.width, 686.3580794764857);
  assert.equal(wisp.height, 288.270393380124);
  assert.equal(wisp.opacity, 0.036270941222958215);
  assert.deepEqual(createCloudField(), field, 'recreating resources must retain every cloud');
  assert.ok(Object.isFrozen(field));
  assert.ok(field.every(Object.isFrozen));
  for (const cloud of field) {
    assert.ok(cloud.tile >= 0 && cloud.tile < 4);
    assert.ok(cloud.opacity >= 0 && cloud.opacity <= (cloud.wisp ? 0.38 : 1));
    assert.ok(cloud.haze >= 0 && cloud.haze <= 0.42);
  }
});

test('radial layers draw far to near with unique index priorities for equal radii', () => {
  const orders = cloudLayerOrders([
    { x: 100, y: 0, z: 0 },
    { x: 0, y: 0, z: 300 },
    { x: 0, y: -300, z: 0 },
    { x: 0, y: 200, z: 0 },
  ]);
  assert.ok(orders[1] < orders[2], 'equal radii use their stable input indices');
  assert.ok(orders[2] < orders[3]);
  assert.ok(orders[3] < orders[0]);
  assert.deepEqual(cloudLayerOrders([]), []);
  const field = createCloudField();
  assert.equal(new Set(field.map(cloud => cloud.renderOrder)).size, field.length);
  assert.ok(field.every(cloud => cloud.renderOrder >= -80 && cloud.renderOrder < -79));
});

test('overlapping banks retain their painter order across the original orbit failures', () => {
  const field = createCloudField();
  const camera = new THREE.PerspectiveCamera(42, 1440 / 1000, 0.1, 3000);
  const view = (degrees: number) => {
    const angle = degrees * Math.PI / 180;
    camera.position.set(Math.sin(angle) * 24, 2.8, Math.cos(angle) * 24);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    return camera.matrixWorldInverse.elements;
  };
  const failures = [
    { pair: [18, 19], degrees: 19.55 },
    { pair: [18, 26], degrees: 72.55 },
    { pair: [43, 44], degrees: 195.475 },
    { pair: [20, 21], degrees: 340.65 },
  ];
  for (const { pair: [a, b], degrees } of failures) {
    const legacyDifference = (angle: number) => {
      const inverse = view(angle);
      return cloudRenderOrder(field[a], inverse) - cloudRenderOrder(field[b], inverse);
    };
    assert.ok(legacyDifference(degrees - 0.05) * legacyDifference(degrees + 0.05) < 0,
      `banks ${a}/${b} must reproduce the old camera-dependent order reversal`);
  }
  const expected = [...field].sort((a, b) => a.renderOrder - b.renderOrder).map(cloud => cloud.index);
  for (let step = -1440; step <= 1440; step++) {
    const inverse = view(step / 4);
    // Transparent rendering falls back to view depth only when priorities tie.
    const actual = [...field].sort((a, b) => a.renderOrder - b.renderOrder
      || cloudRenderOrder(a, inverse) - cloudRenderOrder(b, inverse)).map(cloud => cloud.index);
    assert.deepEqual(actual, expected, `the painter order changed at ${step / 4} degrees`);
  }
  assert.deepEqual(createCloudField(), field, 'the orbit must leave the field unchanged');
});

test('every cloud surface stays outside the camera orbit and inside the far plane', () => {
  const cameraExtent = Math.hypot(24, 2.8);
  for (const cloud of createCloudField()) {
    const center = new THREE.Vector3(cloud.x, cloud.y, cloud.z);
    const target = new THREE.Vector3(0, cloud.wisp ? 20 : 25, 0);
    const outward = center.clone().sub(target).normalize();
    // The curved card is a tangent plane with at most 0.025 units of inward bend.
    // A plane-distance bound covers its entire surface, including triangle interiors.
    const nearestPlane = center.dot(outward) - 0.025;
    assert.ok(nearestPlane > cameraExtent + 0.1, `cloud ${cloud.index} can enter the camera orbit`);
    const farthestCornerBound = center.length() + Math.hypot(cloud.width, cloud.height) / 2 + 0.025;
    assert.ok(farthestCornerBound + cameraExtent < 3000, `cloud ${cloud.index} can cross the far plane`);
  }
});
