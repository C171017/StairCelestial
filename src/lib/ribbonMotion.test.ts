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
import { ORBIT_RADIUS, ribbonOrbitPosition, syncRibbonOrbit } from "./ribbonOrbit";

test("idle orbit remains proportional through navigation, reversal, pause and resume", () => {
  const motion = createRibbonMotion();
  const orbit = { position: 0, velocity: 0 };
  for (let frame = 0; frame < 1200; frame++) {
    if (frame === 120) addRibbonInput(motion, 720);
    if (frame === 300) addRibbonInput(motion, -720);
    advanceRibbonMotion(motion, 1 / 120, { paused: frame >= 600 && frame < 900 });
    syncRibbonOrbit(motion, orbit);
    assert.equal(orbit.position, motion.position * 0.25);
    assert.equal(orbit.velocity, motion.velocity * 0.25);
    if (frame === 119) assert.ok(orbit.position < 0);
    if (frame === 899) assert.ok(Math.abs(orbit.velocity) < 0.000001);
  }
});

test("scrolling turns the sky half as far as the previous half-turn ratio", () => {
  for (const pixels of [-720, 720]) {
    const motion = createRibbonMotion();
    const orbit = { position: 0, velocity: 0 };
    addRibbonInput(motion, pixels);
    for (let i = 0; i < 1200; i++) advanceRibbonMotion(motion, 1 / 120, { cruiseSpeed: 0 });
    syncRibbonOrbit(motion, orbit);
    assert.ok(Math.abs(orbit.position + pixels / 7200) < 1e-5);
  }
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

test("sustained input travels beyond a full orbit and reverses without an angle reset", () => {
  const motion = createRibbonMotion();
  const orbit = { position: 0, velocity: 0 };
  for (let i = 0; i < 1800; i++) {
    if (i % 20 === 0) addRibbonInput(motion, 120);
    advanceRibbonMotion(motion, 1 / 60);
    syncRibbonOrbit(motion, orbit);
    assert.ok(Math.abs(orbit.velocity) <= 0.125);
  }
  assert.ok(orbit.position < -1);
  const before = ribbonOrbitPosition(orbit.position);
  addRibbonInput(motion, -1800);
  advanceRibbonMotion(motion, 1 / 60);
  syncRibbonOrbit(motion, orbit);
  assert.ok(before.distanceTo(ribbonOrbitPosition(orbit.position)) < 0.32);
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
  const orbit = { position: 0, velocity: 0 };
  syncRibbonOrbit(state, orbit);
  assert.deepEqual(orbit, { position: 0, velocity: 0 });
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
