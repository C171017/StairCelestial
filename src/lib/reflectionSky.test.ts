import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { syncReflectionSky } from "./reflectionSky";

test("reflection snapshots reuse the hierarchy but follow transforms, visibility and live materials", () => {
  const source = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry();
  const material = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 } } });
  const cloud = new THREE.Mesh(geometry, material);
  source.add(cloud);
  const first = syncReflectionSky(source, null);
  cloud.position.set(2, 3, 4); cloud.scale.setScalar(2); cloud.rotation.y = 0.5; cloud.visible = false;
  material.uniforms.time.value = 9;
  const next = syncReflectionSky(source, first);
  assert.equal(next, first);
  const reflected = next.root.children[0] as THREE.Mesh;
  assert.deepEqual(reflected.position.toArray(), cloud.position.toArray());
  assert.deepEqual(reflected.quaternion.toArray(), cloud.quaternion.toArray());
  assert.deepEqual(reflected.scale.toArray(), cloud.scale.toArray());
  assert.equal(reflected.visible, false);
  assert.equal(reflected.geometry, geometry);
  assert.equal(reflected.material, material);
  assert.equal((reflected.material as THREE.ShaderMaterial).uniforms.time.value, 9);
  geometry.dispose(); material.dispose();
});

test("late optional sky content rebuilds the snapshot and keeps meteors out of reflections", () => {
  const source = new THREE.Scene();
  const cloud = new THREE.Object3D(); source.add(cloud);
  const first = syncReflectionSky(source, null);
  const effects = new THREE.Group(); effects.name = "sky-effects"; effects.visible = true;
  source.add(effects);
  const next = syncReflectionSky(source, first);
  assert.notEqual(next.root, first.root);
  assert.equal(next.root.getObjectByName("sky-effects")?.visible, false);
  assert.equal(effects.visible, true);
  source.remove(cloud);
  assert.notEqual(syncReflectionSky(source, next).root, next.root);
});
