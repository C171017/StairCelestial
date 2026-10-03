import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceSculptureReveal, createSculptureReveal, sculptureRevealPose } from "./sculptureReveal";

function advance(state: ReturnType<typeof createSculptureReveal>, selected: boolean, seconds: number, fps = 60, reduced = false) {
  for (let i = 0; i < Math.round(seconds * fps); i++) advanceSculptureReveal(state, selected, 1 / fps, reduced);
}

test("interior has a perceptible entrance and exit instead of the leaf's short reveal window", () => {
  const state = createSculptureReveal();
  advance(state, true, 0.2);
  assert.ok(state.value > 0.1 && state.value < 0.5);
  advance(state, true, 0.6);
  assert.ok(state.value > 0.94 && state.value < 1);
  advance(state, true, 2);
  assert.equal(state.value, 1);
  advance(state, false, 0.2);
  assert.ok(state.value > 0.5 && state.value < 0.8);
  advance(state, false, 0.5);
  assert.ok(state.value > 0 && state.value < 0.05);
  advance(state, false, 2);
  assert.equal(state.value, 0);
});

test("rapid open, scroll-away, and reopen preserve the current reveal without flashes", () => {
  const state = createSculptureReveal();
  for (const selected of [true, false, true, false, true]) {
    for (let frame = 0; frame < 15; frame++) {
      const previous = state.value;
      advanceSculptureReveal(state, selected, 1 / 60);
      assert.ok(state.value >= 0 && state.value <= 1);
      assert.ok(Math.abs(state.value - previous) < 0.05);
    }
  }
});

test("the same reveal plays consistently at 30, 60, and 120 fps", () => {
  const states = [30, 60, 120].map(fps => {
    const state = createSculptureReveal();
    advance(state, true, 0.4, fps);
    advance(state, false, 0.2, fps);
    advance(state, true, 0.3, fps);
    return state;
  });
  for (const state of states) assert.ok(Math.abs(state.value - states[0].value) < 1e-12);
});

test("reduced motion uses a short dissolve without scale or depth travel", () => {
  const state = createSculptureReveal();
  advance(state, true, 0.2, 60, true);
  assert.ok(state.value > 0.95 && state.value < 1);
  for (const value of [0, 0.25, 0.5, 1]) {
    assert.deepEqual(sculptureRevealPose(value, true), { scale: 1, depth: 0 });
    const pose = sculptureRevealPose(value);
    assert.ok(pose.scale >= 0.95 && pose.scale <= 1);
    assert.ok(pose.depth >= -0.08 && pose.depth <= 0);
  }
});
