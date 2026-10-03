import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTROL_ENTRANCE_SECONDS, CONTROL_SHAPE_FORMED_SECONDS, entranceTurnProgress, sampleControlEntrance } from "./controlEntrance";

test("the iris keeps shaping and moving from the eye handoff with no intermediate hold", () => {
  const early = sampleControlEntrance(0.5);
  assert.ok(early.reveal > 0 && early.reveal < 1);
  assert.ok(early.turn > 0);
  assert.ok(early.travel > 0);
  assert.ok(early.shapeMorph > 0 && early.shapeMorph < 1);
  let previous = sampleControlEntrance(0);
  for (let time = 0.05; time < CONTROL_SHAPE_FORMED_SECONDS; time += 0.05) {
    const current = sampleControlEntrance(time);
    assert.ok(current.shapeMorph > previous.shapeMorph, "Shape must not pause between circle and solid");
    assert.ok(current.travel > previous.travel);
    assert.ok(current.turn > previous.turn);
    previous = current;
  }
  const formed = sampleControlEntrance(CONTROL_SHAPE_FORMED_SECONDS);
  assert.equal(formed.shapeMorph, 1);
  assert.equal(formed.reveal, 1);
  assert.ok(formed.travel > 0 && formed.travel < 1);
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
  for (const boundary of [0, 0.85, CONTROL_SHAPE_FORMED_SECONDS, CONTROL_ENTRANCE_SECONDS]) {
    const before = sampleControlEntrance(boundary - 0.0001);
    const after = sampleControlEntrance(boundary + 0.0001);
    for (const key of ["turn", "travel", "reveal", "shapeMorph"] as const) {
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
  assert.equal(reduced.shapeMorph, 1);
});
