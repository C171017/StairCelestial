/**
 * Run: npm run test:scroll
 * Assertions for Drei infinite-scroll lap integration (see scrollLapIntegration.ts).
 */
import assert from "node:assert/strict";
import { computeTrackerStep } from "../src/hooks/scrollLapIntegration";
import { assignDoorPoolSlots, type DoorPoolSlot } from "../src/lib/spiralPool";
import { DOOR_POOL_SEARCH_RADIUS, DOOR_POOL_SIZE } from "../src/lib/spiral";

function approxEqual(a: number, b: number, eps = 1e-5) {
  return Math.abs(a - b) < eps;
}

// Bottom reset (forward): offset high → low — tracker step should cancel teleport (~0).
{
  const d = computeTrackerStep(0.92, -0.08);
  assert.ok(
    approxEqual(d, 0, 1e-3),
    `bottom reset: expected ~0, got ${d}`,
  );
}

// Top reset (backward): offset low → high — tracker should use the short
// wrapped distance, not advance a full lap.
{
  const d = computeTrackerStep(0.01, 0.95);
  assert.ok(
    approxEqual(d, 0.06, 1e-3),
    `top reset: expected short wrapped step, got ${d}`,
  );
}

// Top reset after Drei briefly reports a negative offset should also avoid a lap jump.
{
  const d = computeTrackerStep(-0.067, 0.951);
  assert.ok(
    Math.abs(d) <= 0.06,
    `negative top reset: expected capped-size step, got ${d}`,
  );
}

// Small step: no wrap branch — capped signed delta.
{
  const d = computeTrackerStep(0.5, 0.52);
  assert.ok(
    approxEqual(d, -0.02),
    `small step: expected -0.02, got ${d}`,
  );
}

// Large jump but wrong signature for forward reset — should not apply full lap.
{
  const d = computeTrackerStep(0.68, 0.02);
  assert.ok(
    Math.abs(d) <= 0.06,
    `no false forward reset: expected capped step, got ${d}`,
  );
}

// Large jump but wrong signature for backward reset.
{
  const d = computeTrackerStep(0.35, 0.95);
  assert.ok(
    Math.abs(d) <= 0.06,
    `no false backward reset: expected capped step, got ${d}`,
  );
}

// Door pool slots must stay unique while hysteresis keeps incumbents stable.
{
  const doorStep = 7;
  const isDoor = (index: number) =>
    ((index % doorStep) + doorStep) % doorStep === 0;
  let previous: DoorPoolSlot[] | null = null;

  for (let virtualIndex = -220; virtualIndex <= 220; virtualIndex += 0.1) {
    const slots = assignDoorPoolSlots(
      virtualIndex,
      DOOR_POOL_SIZE,
      isDoor,
      DOOR_POOL_SEARCH_RADIUS,
      previous,
    );
    const indices = slots
      .filter((slot): slot is NonNullable<typeof slot> => slot !== null)
      .map((slot) => slot.virtualIndex);
    assert.equal(
      new Set(indices).size,
      indices.length,
      `door pool duplicate at ${virtualIndex.toFixed(1)}: ${indices.join(",")}`,
    );
    previous = slots;
  }
}

console.log("scroll-lap-sanity: all checks passed");
