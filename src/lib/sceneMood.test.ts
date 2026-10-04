import assert from "node:assert/strict";
import { test } from "node:test";
import { addRibbonInput, advanceRibbonMotion, createRibbonMotion } from "./ribbonMotion";
import { advanceSceneMood, moodForAscent, sampleSceneMood } from "./sceneMood";

test("idle cruise and pool recycling do not advance the time of day", () => {
  const motion = createRibbonMotion();
  const mood = sampleSceneMood();
  for (let i = 0; i < 60 * 200; i++) {
    advanceRibbonMotion(motion, 1 / 60);
    advanceSceneMood(mood, motion.userTravel, 1 / 60);
  }
  assert.ok(motion.position < -4);
  assert.equal(motion.userTravel, 0);
  assert.equal(mood.value, sampleSceneMood().value);
});

test("ascent darkens smoothly and equal descent restores the same lighting", () => {
  const motion = createRibbonMotion();
  const mood = sampleSceneMood();
  const advance = () => {
    advanceRibbonMotion(motion, 1 / 120);
    const previous = mood.value;
    advanceSceneMood(mood, motion.userTravel, 1 / 120);
    assert.ok(Math.abs(mood.value - previous) < 0.002);
  };
  for (const pixels of [-720, 720]) {
    addRibbonInput(motion, pixels);
    for (let i = 0; i < 1200; i++) advance();
    if (pixels < 0) assert.ok(mood.value > 0.59);
  }
  assert.ok(Math.abs(motion.userTravel) < 1e-5);
  assert.ok(Math.abs(mood.value - sampleSceneMood().value) < 1e-5);
});

test("lighting is finite and continuous at positive/negative mesh turn boundaries", () => {
  for (const ascent of [-10000, -3, -2, -1, 0, 1, 2, 3, 10000]) {
    assert.ok(Math.abs(moodForAscent(ascent + 1e-7) - moodForAscent(ascent - 1e-7)) < 1e-6);
    const mood = sampleSceneMood(moodForAscent(ascent), ascent);
    assert.ok(Math.abs(mood.day + mood.sunset + mood.night - 1) < 1e-12);
    assert.ok(mood.value >= 0 && mood.value <= 1);
  }
});

test("reduced motion still permits gradual explicit ascent and keeps idle still", () => {
  const motion = createRibbonMotion();
  addRibbonInput(motion, -720, true);
  for (let i = 0; i < 1200; i++) advanceRibbonMotion(motion, 1 / 120, { reducedMotion: true });
  assert.ok(Math.abs(motion.position - motion.userTravel) < 1e-12);
  assert.ok(moodForAscent(motion.userTravel) > sampleSceneMood().value);
});

test("overscrolling past either lighting endpoint cannot create a reversal dead zone", () => {
  for (const direction of [-1, 1]) {
    const mood = sampleSceneMood();
    for (let turn = 1; turn <= 100; turn++) advanceSceneMood(mood, turn * direction, 1 / 60);
    assert.equal(mood.target, direction > 0 ? 1 : 0);
    advanceSceneMood(mood, 99.5 * direction, 1 / 60);
    assert.ok(Math.abs(mood.target - (direction > 0 ? 0.9 : 0.1)) < 1e-12);
  }
});
