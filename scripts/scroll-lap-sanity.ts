/**
 * Run: npm run test:scroll
 * Assertions for Drei infinite-scroll lap integration (see scrollLapIntegration.ts).
 */
import assert from "node:assert/strict";
import { computeTrackerStep } from "../src/hooks/scrollLapIntegration";

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

// Top reset (backward): offset low → high — tracker should gain ~+1 lap (not ~−1).
{
  const d = computeTrackerStep(-0.067, 0.951);
  assert.ok(
    d > 1 && d < 1.05,
    `top reset: expected ~+1.02, got ${d}`,
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

console.log("scroll-lap-sanity: all checks passed");
