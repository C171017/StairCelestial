import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceSkyEffectsTime, sampleSkyEffect, SKY_EFFECTS, SKY_EFFECTS_PERIOD } from "./skyEffects";

test("sky effects are dark on both sides of their independent cycle boundary", () => {
  for (const effect of SKY_EFFECTS) {
    for (const cycle of [-1000, -2, -1, 0, 1, 2, 1000]) {
      const boundary = cycle * SKY_EFFECTS_PERIOD;
      for (const offset of [-0.2, -1 / 60, 0, 1 / 60, 0.2]) {
        assert.equal(sampleSkyEffect(effect, boundary + offset, { progress: 0, opacity: 0 }).opacity, 0);
      }
    }
  }
});

test("each effect fades continuously into and out of invisibility with no brightness jump", () => {
  for (const effect of SKY_EFFECTS) {
    const sample = { progress: 0, opacity: 0 };
    const epsilon = 0.0001;
    assert.equal(sampleSkyEffect(effect, effect.start, sample).opacity, 0);
    assert.ok(sampleSkyEffect(effect, effect.start + epsilon, sample).opacity / epsilon < 0.004);
    assert.ok(sampleSkyEffect(effect, effect.start + effect.duration - epsilon, sample).opacity / epsilon < 0.004);
    assert.equal(sampleSkyEffect(effect, effect.start + effect.duration + epsilon, sample).opacity, 0);
    let previous = 0;
    for (let frame = 0; frame < 120 * SKY_EFFECTS_PERIOD; frame++) {
      const opacity = sampleSkyEffect(effect, frame / 120, sample).opacity;
      assert.ok(opacity >= 0 && opacity <= effect.intensity);
      assert.ok(Math.abs(opacity - previous) < 0.045);
      previous = opacity;
    }
  }
});

test("world events repeat deterministically through forward and reverse cycles", () => {
  for (const effect of SKY_EFFECTS) {
    for (const t of [0, effect.start, effect.start + effect.duration * 0.3,
      effect.start + effect.duration * 0.8, effect.start + effect.duration + 0.1]) {
      const reference = sampleSkyEffect(effect, t, { progress: 0, opacity: 0 });
      for (const cycle of [-100, -2, -1, 1, 2, 100]) {
        const next = sampleSkyEffect(effect, t + cycle * SKY_EFFECTS_PERIOD, { progress: 0, opacity: 0 });
        assert.ok(Math.abs(reference.opacity - next.opacity) < 1e-10);
        assert.ok(Math.abs(reference.progress - next.progress) < 1e-10);
      }
    }
  }
});

test("meteors are sparse, non-overlapping world events with a quiet cycle boundary", () => {
  const first = SKY_EFFECTS[0];
  assert.equal(first.kind, "meteor");
  assert.ok(Math.cos(first.azimuth) < -0.98);
  assert.ok(sampleSkyEffect(first, first.start + first.duration * 0.4, { progress: 0, opacity: 0 }).opacity > 0.7);
  const meteors = SKY_EFFECTS.filter(effect => effect.kind === "meteor");
  for (let index = 0; index < meteors.length; index++) {
    const current = meteors[index];
    const nextStart = index + 1 < meteors.length ? meteors[index + 1].start : meteors[0].start + SKY_EFFECTS_PERIOD;
    assert.ok(nextStart - current.start >= 10, "keep at least 10 active seconds between worldwide meteors");
    assert.ok(nextStart - current.start <= 18, "keep the requested 10–18 second cadence");
    assert.ok(nextStart - current.start - current.duration > 7, "leave quiet sky between prominent trails");
  }
  assert.ok(meteors.filter(effect => Math.cos(effect.azimuth) < -0.9).length >= 4,
    "several events should be visible from the entrance view");
  assert.ok(meteors.some(effect => Math.cos(effect.azimuth) > 0.9),
    "camera orbit should reveal events on the opposite side too");
});

test("hidden daylight and dawn do not consume the sunset/night clock", () => {
  let elapsed = 8;
  for (const visibility of [0, 0.0001, 0.001, -1, Number.NaN]) {
    for (let frame = 0; frame < 600; frame++) elapsed = advanceSkyEffectsTime(elapsed, 1 / 60, false, visibility);
  }
  assert.equal(elapsed, 8);
  for (let frame = 0; frame < 600; frame++) elapsed = advanceSkyEffectsTime(elapsed, 1 / 60, false, 0.8);
  assert.ok(Math.abs(elapsed - 18) < 1e-10);
});

test("reversing across sunset or dawn never rewinds the meteor schedule", () => {
  let elapsed = 8;
  let activeFrames = 0;
  // These visibility ramps represent traversing the dark sections in either direction.
  // Clock progression is independent of either world-time direction.
  const crossings = [0, 0.05, 0.4, 1, 0.4, 0.05, 0, 0.05, 0.4, 1, 0.4, 0.05, 0];
  for (const visibility of crossings) {
    for (let frame = 0; frame < 60; frame++) {
      const previous = elapsed;
      elapsed = advanceSkyEffectsTime(elapsed, 1 / 60, false, visibility);
      if (visibility > 0.001) activeFrames++;
      assert.ok(elapsed >= previous, "world-time reversal cannot replay an earlier trail");
    }
  }
  assert.ok(Math.abs(elapsed - (8 + activeFrames / 60)) < 1e-10);
});

test("paused clocks do not advance and returning from suspension cannot skip an event", () => {
  assert.equal(advanceSkyEffectsTime(4, 90, true), 4);
  assert.ok(Math.abs(advanceSkyEffectsTime(4, 90, false) - 4.1) < 1e-12);
  assert.equal(advanceSkyEffectsTime(4, -1, false), 4);
  assert.equal(advanceSkyEffectsTime(4, Number.NaN, false), 4);
  assert.equal(advanceSkyEffectsTime(4, Number.POSITIVE_INFINITY, false), 4);
  assert.equal(advanceSkyEffectsTime(4, 90, true, 1), 4);
  assert.ok(Math.abs(advanceSkyEffectsTime(SKY_EFFECTS_PERIOD - 0.01, 0.02, false) - 0.01) < 1e-12);
});
