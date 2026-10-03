import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceRibbonFocus, createRibbonFocus } from "./ribbonFocus";
import { positiveModulo } from "./ribbonMotion";
import { ribbonPoint, RIBBON_PITCH } from "./ribbonGeometry";

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
