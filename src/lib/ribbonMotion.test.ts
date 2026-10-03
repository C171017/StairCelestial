import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addRibbonInput,
  advanceRibbonMotion,
  createRibbonMotion,
  positiveModulo,
  relativeCycle,
  RIBBON_MAX_SPEED,
} from "./ribbonMotion";
import { ORBIT_RADIUS, ribbonOrbitPosition } from "./ribbonOrbit";

test("the orbit has no idle drift and settles after explicit navigation", () => {
  const state = createRibbonMotion();
  const options = { cruiseSpeed: 0, maxSpeed: 0.18 };
  for (let i = 0; i < 600; i++) advanceRibbonMotion(state, 1 / 60, options);
  assert.equal(state.position, 0);
  addRibbonInput(state, 900);
  for (let i = 0; i < 1200; i++) advanceRibbonMotion(state, 1 / 120, options);
  assert.ok(Math.abs(state.position + 0.5) < 1e-5);
  assert.ok(Math.abs(state.velocity) < 1e-5);
});

test("camera orbit crosses every turn boundary continuously in both directions", () => {
  for (const turns of [-10000, -2, -1, 0, 1, 2, 10000]) {
    const before = ribbonOrbitPosition(turns - 1e-6);
    const after = ribbonOrbitPosition(turns + 1e-6);
    assert.ok(before.distanceTo(after) < 0.00031);
    assert.ok(Math.abs(Math.hypot(after.x, after.z) - ORBIT_RADIUS) < 1e-10);
    assert.ok(ribbonOrbitPosition(turns).distanceTo(ribbonOrbitPosition(0)) < 1e-10);
  }
  assert.ok(ribbonOrbitPosition(0.25).distanceTo(ribbonOrbitPosition(0.75)) > 47.99);
});

test("sustained input travels beyond full orbits and reverses without an angle reset", () => {
  const state = createRibbonMotion();
  const options = { cruiseSpeed: 0, maxSpeed: 0.18 };
  for (let i = 0; i < 1800; i++) {
    if (i % 20 === 0) addRibbonInput(state, 120);
    advanceRibbonMotion(state, 1 / 60, options);
    assert.ok(Math.abs(state.velocity) <= options.maxSpeed);
  }
  assert.ok(state.position < -4);
  const before = ribbonOrbitPosition(state.position);
  addRibbonInput(state, -1800);
  advanceRibbonMotion(state, 1 / 60, options);
  assert.ok(before.distanceTo(ribbonOrbitPosition(state.position)) < 0.46);
});

test("infinite copies wrap symmetrically in both scroll directions", () => {
  assert.equal(positiveModulo(-0.25, 1), 0.75);
  assert.equal(relativeCycle(2.75), -0.25);
  assert.equal(relativeCycle(-2.75), 0.25);
  assert.equal(relativeCycle(4.25, 2), 0.25);
});

test("wheel displacement and cruise are consistent at 30 and 120 fps", () => {
  const simulate = (fps: number) => {
    const state = createRibbonMotion();
    addRibbonInput(state, 720);
    for (let i = 0; i < fps * 5; i += 1) advanceRibbonMotion(state, 1 / fps);
    return state;
  };
  assert.ok(Math.abs(simulate(30).position - simulate(120).position) < 0.0001);
  assert.ok(simulate(120).position < -0.49);
});

test("large and reversing inputs respect the velocity limit", () => {
  const state = createRibbonMotion();
  for (let i = 0; i < 1200; i += 1) {
    if (i % 10 === 0) addRibbonInput(state, i < 600 ? 10000 : -10000);
    advanceRibbonMotion(state, 1 / 120);
    assert.ok(Math.abs(state.velocity) <= RIBBON_MAX_SPEED + 1e-10);
  }
  assert.equal(state.direction, 1);
});

test("reduced motion remains stationary without explicit input", () => {
  const state = createRibbonMotion();
  for (let i = 0; i < 600; i += 1) advanceRibbonMotion(state, 1 / 60, { reducedMotion: true });
  assert.equal(state.position, 0);
  assert.equal(state.velocity, 0);
});

test("selection smoothly stops cruise and release resumes without a jump", () => {
  const state = createRibbonMotion();
  for (let i = 0; i < 180; i += 1) advanceRibbonMotion(state, 1 / 60);
  const beforePause = state.position;
  for (let i = 0; i < 180; i += 1) advanceRibbonMotion(state, 1 / 60, { paused: true });
  assert.ok(Math.abs(state.position - beforePause) < 0.01);
  assert.ok(Math.abs(state.velocity) < 0.000001);
  const beforeResume = state.position;
  advanceRibbonMotion(state, 1 / 60);
  assert.ok(Math.abs(state.position - beforeResume) < 0.0001);
});

test("idle travel and both input directions use the reversed movement", () => {
  const idle = createRibbonMotion();
  const down = createRibbonMotion();
  const up = createRibbonMotion();
  addRibbonInput(down, 720);
  addRibbonInput(up, -720);
  for (let i = 0; i < 120; i += 1) {
    advanceRibbonMotion(idle, 1 / 120);
    advanceRibbonMotion(down, 1 / 120);
    advanceRibbonMotion(up, 1 / 120);
  }
  assert.ok(idle.position < 0);
  assert.ok(down.position < idle.position);
  assert.ok(up.position > 0);
  assert.ok(Math.abs(down.position + up.position) < 1e-10);
});
