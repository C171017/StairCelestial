import assert from "node:assert/strict";
import { test } from "node:test";
import { MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { setIntroMaterialOpacity, setLocalMaterialOpacity } from "./materialReveal";

test("local door updates cannot flash to full brightness during the scene fade", () => {
  const material = new MeshPhysicalMaterial({ opacity: 0.72, transparent: true, depthWrite: false });
  setIntroMaterialOpacity(material, 0.1);
  for (let frame = 0; frame < 120; frame++) {
    setLocalMaterialOpacity(material, 0.72);
    assert.ok(Math.abs(material.opacity - 0.072) < 1e-12);
  }
  material.dispose();
});

test("intro and local fades compose identically in either frame callback order", () => {
  const first = new MeshPhysicalMaterial({ opacity: 0.62, transparent: true });
  const second = first.clone();
  for (let frame = 0; frame <= 120; frame++) {
    const intro = frame / 120;
    const local = 0.62 - intro * 0.35;
    setIntroMaterialOpacity(first, intro);
    setLocalMaterialOpacity(first, local);
    setLocalMaterialOpacity(second, local);
    setIntroMaterialOpacity(second, intro);
    assert.equal(first.opacity, second.opacity);
    assert.equal(first.opacity, intro * local);
  }
  first.dispose(); second.dispose();
});

test("the ribbon fade is monotonic and hidden surfaces do not write depth", () => {
  const material = new MeshStandardMaterial();
  let previous = 0;
  for (let frame = 0; frame <= 240; frame++) {
    setIntroMaterialOpacity(material, frame / 240);
    setLocalMaterialOpacity(material, 1);
    assert.ok(material.opacity >= previous);
    assert.equal(material.depthWrite, frame === 240);
    previous = material.opacity;
  }
  assert.equal(material.opacity, 1);
  assert.equal(material.transparent, false);
  material.dispose();
});

test("local dimming and reversal still work after the intro finishes", () => {
  const material = new MeshPhysicalMaterial({ opacity: 0.38, transparent: true, depthWrite: false });
  setIntroMaterialOpacity(material, 1);
  for (const opacity of [0.38, 0.19, 0, 0.2, 0.38]) {
    setLocalMaterialOpacity(material, opacity);
    assert.equal(material.opacity, opacity);
    assert.equal(material.transparent, true);
    assert.equal(material.depthWrite, false);
  }
  material.dispose();
});

test("solid sculptures become depth-writing opaque objects for glass transmission after revealing", () => {
  const sculpture = new MeshPhysicalMaterial({ color: "#080a0d", metalness: 0.35 });
  setLocalMaterialOpacity(sculpture, 0);
  assert.equal(sculpture.transparent, true);
  assert.equal(sculpture.depthWrite, false);
  setLocalMaterialOpacity(sculpture, 0.5);
  assert.equal(sculpture.transparent, true);
  setLocalMaterialOpacity(sculpture, 1);
  // Three includes non-transmissive, non-transparent objects in the opaque
  // scene buffer sampled by physical glass; depth rejects glass behind them.
  assert.equal(sculpture.transmission, 0);
  assert.equal(sculpture.transparent, false);
  assert.equal(sculpture.depthTest, true);
  assert.equal(sculpture.depthWrite, true);
  sculpture.dispose();
});
