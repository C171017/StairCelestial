import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTROL_ENTRANCE_SECONDS, CONTROL_SHAPE_FORMED_SECONDS, entranceTurnProgress, sampleControlEntrance } from "./controlEntrance";

test("the eye center becomes a sphere before morphing and entering the world", () => {
  const early = sampleControlEntrance(0.5);
  assert.ok(early.reveal > 0 && early.reveal < 1);
  assert.equal(early.turn, 0);
  assert.equal(early.travel, 0);
  assert.equal(early.sphereMorph, 0);
  const sphere = sampleControlEntrance(1);
  assert.equal(sphere.reveal, 1);
  assert.equal(sphere.sphereMorph, 0);
  const morphing = sampleControlEntrance(2.25);
  assert.ok(morphing.sphereMorph > 0 && morphing.sphereMorph < 1);
  assert.equal(morphing.reveal, 1);
  assert.equal(morphing.travel, 0);
  assert.equal(sampleControlEntrance(CONTROL_SHAPE_FORMED_SECONDS).sphereMorph, 1);
  assert.ok(sampleControlEntrance(CONTROL_SHAPE_FORMED_SECONDS + 0.5).travel > 0);
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

test("phase boundaries do not jump the sculpture", () => {
  for (const boundary of [0.65, 1.25, CONTROL_SHAPE_FORMED_SECONDS, CONTROL_ENTRANCE_SECONDS]) {
    const before = sampleControlEntrance(boundary - 0.0001);
    const after = sampleControlEntrance(boundary + 0.0001);
    for (const key of ["turn", "travel", "reveal", "sphereMorph"] as const) {
      assert.ok(Math.abs(after[key] - before[key]) < 0.001, `${key} jumps at ${boundary}`);
    }
  }
  const end = sampleControlEntrance(CONTROL_ENTRANCE_SECONDS);
  assert.equal(end.travel, 1);
  assert.equal(end.reveal, 1);
});

test("reduced motion arrives without spin or an animated shape transition", () => {
  const reduced = sampleControlEntrance(0, true);
  assert.equal(reduced.turn, 0);
  assert.equal(reduced.travel, 1);
  assert.equal(reduced.reveal, 1);
  assert.equal(reduced.sphereMorph, 1);
});
