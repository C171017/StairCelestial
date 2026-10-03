import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTROL_ENTRANCE_SECONDS, entranceTurnProgress, sampleControlEntrance } from "./controlEntrance";

test("the sculpture is already turning and growing while both rings are visible", () => {
  const early = sampleControlEntrance(0.5);
  assert.ok(early.reveal > 0 && early.reveal < 1);
  assert.ok(early.turn > 0.06);
  assert.ok(early.travel > 0);
  assert.ok(early.outerOpacity > 0 && early.innerOpacity > 0);
  const overlap = sampleControlEntrance(2.2);
  assert.ok(overlap.outerDissolve > 0 && overlap.outerOpacity > 0);
  assert.ok(overlap.innerDissolve > 0 && overlap.innerOpacity > 0);
  assert.ok(overlap.turn > early.turn);
});

test("spin accelerates from a visible crawl and decelerates to rest without reversing", () => {
  const speed = (t: number) => (entranceTurnProgress(t + 0.0001) - entranceTurnProgress(t)) / 0.0001;
  assert.ok(speed(0) > 0.1);
  assert.ok(speed(0.2) > speed(0.05));
  assert.ok(speed(0.45) > speed(0.2));
  assert.ok(speed(0.8) < speed(0.6));
  assert.ok(speed(0.999) < 0.001);
  for (let i = 0; i < 1000; i++) assert.ok(speed(i / 1000) >= 0);
  assert.equal(entranceTurnProgress(-1), 0);
  assert.equal(entranceTurnProgress(2), 1);
});

test("phase boundaries do not cut off the rings or jump the sculpture", () => {
  for (const boundary of [1.05, 1.4, 2, 4.5, 5.05, CONTROL_ENTRANCE_SECONDS]) {
    const before = sampleControlEntrance(boundary - 0.0001);
    const after = sampleControlEntrance(boundary + 0.0001);
    for (const key of ["turn", "travel", "reveal", "outerOpacity", "innerOpacity"] as const) {
      assert.ok(Math.abs(after[key] - before[key]) < 0.001, `${key} jumps at ${boundary}`);
    }
  }
  const end = sampleControlEntrance(CONTROL_ENTRANCE_SECONDS);
  assert.equal(end.outerOpacity, 0);
  assert.equal(end.innerOpacity, 0);
  assert.equal(end.travel, 1);
  assert.equal(end.reveal, 1);
});

test("reduced motion arrives without spin, rings or an animated scale transition", () => {
  const reduced = sampleControlEntrance(0, true);
  assert.equal(reduced.turn, 0);
  assert.equal(reduced.travel, 1);
  assert.equal(reduced.reveal, 1);
  assert.equal(reduced.outerOpacity + reduced.innerOpacity, 0);
});
