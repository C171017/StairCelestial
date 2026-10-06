import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CIRRUS_WIND, createCloudAdvection, sampleCloudAdvection } from './cloudAdvection';
import { createCloudField, type CloudDefinition } from './cloudField';

const sample = () => ({ aU: 0, aV: 0, bU: 0, bV: 0, blend: 0 });
const clouds = createCloudField();
const wisps = clouds.filter(cloud => cloud.wisp);
function surfaceFor(cloud: CloudDefinition) {
  const surface = new THREE.Object3D();
  surface.position.set(cloud.x, cloud.y, cloud.z);
  surface.scale.set(cloud.width, cloud.height, 1);
  surface.lookAt(0, cloud.wisp ? 20 : 25, 0);
  surface.updateMatrixWorld();
  return surface;
}

test('banks and cirrus project one coherent horizontal world wind onto every card', () => {
  for (const cloud of clouds) {
    const flow = createCloudAdvection(cloud);
    const surface = surfaceFor(cloud);
    const origin = new THREE.Vector3().applyMatrix4(surface.matrixWorld);
    const displacement = new THREE.Vector3(flow.velocityU, flow.velocityV, 0)
      .applyMatrix4(surface.matrixWorld).sub(origin);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(surface.quaternion);
    const near = Math.hypot(cloud.x, cloud.z) < 500;
    const speed = cloud.wisp ? (near ? 1.7 : 2.8) : (near ? 0.6 : 0.85);
    const expected = new THREE.Vector3(CIRRUS_WIND.x, CIRRUS_WIND.y, CIRRUS_WIND.z)
      .projectOnPlane(normal).multiplyScalar(speed);
    assert.ok(displacement.distanceTo(expected) < 1e-10, `wind reversed on card ${cloud.index}`);
    assert.ok(Math.abs(flow.velocityU * flow.period / 2) < 0.18);
    assert.ok(Math.abs(flow.velocityV * flow.period / 2) < (cloud.wisp ? 0.08 : 0.11));
  }
});

test('moving samples reset only at zero weight while the other sample stays continuous', () => {
  for (const cloud of clouds) {
    const flow = createCloudAdvection(cloud);
    for (const boundary of [0.5, 1]) {
      const time = (boundary - flow.phaseOffset) * flow.period;
      const before = sampleCloudAdvection(time - 0.0001, flow, sample());
      const after = sampleCloudAdvection(time + 0.0001, flow, sample());
      if (boundary === 1) {
        assert.ok(before.blend < 1e-8 && after.blend < 1e-8);
        assert.ok(Math.abs(after.bU - before.bU - flow.velocityU * 0.0002) < 1e-10);
        assert.ok(Math.abs(after.bV - before.bV - flow.velocityV * 0.0002) < 1e-10);
      } else {
        assert.ok(1 - before.blend < 1e-8 && 1 - after.blend < 1e-8);
        assert.ok(Math.abs(after.aU - before.aU - flow.velocityU * 0.0002) < 1e-10);
        assert.ok(Math.abs(after.aV - before.aV - flow.velocityV * 0.0002) < 1e-10);
      }
    }
    const target = sample();
    for (const time of [-720, 0, 3, 5, 42, 48, 600, 3600, 86400, 1e9]) {
      assert.equal(sampleCloudAdvection(time, flow, target), target, 'sampling must reuse its target');
      assert.ok(Object.values(target).every(Number.isFinite));
      assert.ok(target.blend >= 0 && target.blend <= 1);
      const first = { ...target };
      sampleCloudAdvection(time, flow, target);
      assert.deepEqual(target, first, 'a paused ambient clock must freeze the exact composed state');
    }
  }
});

test('recognizable artwork travels without crossfade for most of each cycle', () => {
  const flow = createCloudAdvection(wisps[1]);
  const target = sample();
  let travellingAlone = 0;
  for (let step = 0; step < 1000; step++) {
    sampleCloudAdvection(step / 1000 * flow.period, flow, target);
    if (target.blend === 0 || target.blend === 1) travellingAlone++;
  }
  assert.ok(travellingAlone >= 830, 'continual crossfading would look like morphing instead of wind');
});

test('cirrus keeps visible but restrained drift after the speed reduction', () => {
  const camera = new THREE.PerspectiveCamera(42, 1280 / 720, 0.1, 3000);
  camera.position.set(0, 5.2, 24);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const visibleLayers = new Set<number>();
  for (const cloud of wisps.filter(cloud => cloud.opacity > 0.04)) {
    const flow = createCloudAdvection(cloud);
    const surface = surfaceFor(cloud);
    for (let u = -0.3; u <= 0.3; u += 0.05) for (let v = -0.15; v <= 0.15; v += 0.05) {
      const before = new THREE.Vector3(u, v, 0).applyMatrix4(surface.matrixWorld).project(camera);
      if (Math.abs(before.x) > 0.9 || before.y < 0.1 || before.y > 0.95 || before.z > 1 || before.z < -1) continue;
      const after = new THREE.Vector3(u + flow.velocityU * 5, v + flow.velocityV * 5, 0)
        .applyMatrix4(surface.matrixWorld).project(camera);
      const viewportTravel = (after.x - before.x) / 2;
      assert.ok(viewportTravel > 0.007 && viewportTravel < 0.025,
        `card ${cloud.index} travelled ${viewportTravel * 100}% in five seconds`);
      visibleLayers.add(cloud.index);
    }
  }
  assert.deepEqual([...visibleLayers], [65, 66, 70], 'both distant and near cirrus should be measurable');
});

test('large bank silhouettes drift more slowly than cirrus and keep translating at rest', () => {
  for (const cloud of clouds.filter(cloud => !cloud.wisp && cloud.opacity > 0.04)) {
    const bank = createCloudAdvection(cloud);
    const cirrus = createCloudAdvection({ ...cloud, wisp: true });
    const bankSpeed = Math.hypot(bank.velocityU, bank.velocityV);
    const cirrusSpeed = Math.hypot(cirrus.velocityU, cirrus.velocityV);
    assert.ok(bankSpeed > 0 && bankSpeed < cirrusSpeed * 0.5);
    const start = (0.3 - bank.phaseOffset) * bank.period;
    const before = sampleCloudAdvection(start, bank, sample());
    const after = sampleCloudAdvection(start + 5, bank, sample());
    assert.equal(before.blend, 1);
    assert.equal(after.blend, 1);
    assert.ok(Math.hypot(after.aU - before.aU, after.aV - before.aV) > 0.0001);
  }
});
