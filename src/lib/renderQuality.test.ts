import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRenderQuality, initialRenderQualityTier, pauseRenderQuality,
  renderQualityBudget, sampleRenderQuality, type RenderQualityState,
} from "./renderQuality";

function advance(state: RenderQualityState, clock: { now: number }, seconds: number, frameMs = 1000 / 60, eligible = true) {
  const end = clock.now + seconds * 1000;
  const changes: number[] = [];
  while (clock.now < end) {
    clock.now += frameMs;
    if (sampleRenderQuality(state, clock.now, eligible)) changes.push(state.tier);
  }
  return changes;
}

test("unknown capability retains full quality; only combined modest hardware hints affect startup", () => {
  assert.equal(initialRenderQualityTier(), 0);
  assert.equal(initialRenderQualityTier({ hardwareConcurrency: 4 }), 0);
  assert.equal(initialRenderQualityTier({ deviceMemory: 4 }), 0);
  assert.equal(initialRenderQualityTier({ hardwareConcurrency: 12, deviceMemory: 4 }), 0);
  assert.equal(initialRenderQualityTier({ hardwareConcurrency: 4, deviceMemory: 4 }), 1);
  assert.equal(initialRenderQualityTier({ hardwareConcurrency: 0, deviceMemory: 0 }), 0);
});

test("full detail respects native display resolution and measured production baseline", () => {
  assert.equal(renderQualityBudget(0, 1).dpr, 1);
  assert.equal(renderQualityBudget(0, 1.5).dpr, 1.5);
  assert.equal(renderQualityBudget(0, 2).dpr, 1.5);
  assert.equal(renderQualityBudget(0, 3).dpr, 1.5);
  assert.equal(renderQualityBudget(0, Number.NaN).dpr, 1);
  assert.equal(renderQualityBudget(0, 2).transmissionScale, 0.85);
});

test("healthy 60Hz rendering and acceptable 50Hz rendering keep full visual detail", () => {
  for (const frameMs of [1000 / 60, 20]) {
    const state = createRenderQuality(0);
    const changes = advance(state, { now: 0 }, 90, frameMs);
    assert.deepEqual(changes, []);
    assert.equal(state.tier, 0);
  }
});

test("isolated hitches and occasional slow bursts do not classify the device as weak", () => {
  const state = createRenderQuality(0);
  const clock = { now: 0 };
  advance(state, clock, 12);
  clock.now += 180;
  sampleRenderQuality(state, clock.now);
  for (let burst = 0; burst < 8; burst++) {
    advance(state, clock, 2, 1000 / 30);
    advance(state, clock, 6);
  }
  assert.equal(state.tier, 0);
});

test("sustained slow work reduces one budget and preserves it when cadence improves", () => {
  const state = createRenderQuality(0);
  const clock = { now: 0 };
  assert.deepEqual(advance(state, clock, 10, 1000 / 30), [1]);
  assert.equal(state.tier, 1);
  assert.deepEqual(advance(state, clock, 12, 20), []);
  assert.equal(state.tier, 1, "a sustained improvement justifies the smaller pixel budget");
  assert.equal(state.trial, null);
});

test("a browser cadence limit restores visual quality when smaller buffers do not help", () => {
  const state = createRenderQuality(0);
  const clock = { now: 0 };
  assert.deepEqual(advance(state, clock, 32, 1000 / 30), [1, 2, 3, 0]);
  assert.equal(state.lastDecision, "no-measured-gain");
  assert.deepEqual(advance(state, clock, 40, 1000 / 30), []);
  assert.equal(state.tier, 0, "a failed reduction backs off instead of repeatedly softening the scene");
  assert.ok(advance(state, clock, 25, 1000 / 30).includes(1), "changed conditions may be retried later");
});

test("a bounded deeper trial crosses a vsync plateau before deciding reductions do not help", () => {
  for (const usefulTier of [2, 3]) {
    const state = createRenderQuality(0);
    const clock = { now: 0 };
    const changes: number[] = [];
    while (clock.now < 34_000) {
      clock.now += state.tier >= usefulTier ? 1000 / 60 : 1000 / 30;
      if (sampleRenderQuality(state, clock.now)) changes.push(state.tier);
    }
    assert.equal(state.tier, usefulTier, "keep the first tier that produces measurable smoothness");
    assert.deepEqual(changes, usefulTier === 2 ? [1, 2] : [1, 2, 3]);
    assert.equal(state.trial, null);
  }
});

test("render-bound work reaches a useful floor without removing authored materials", () => {
  const state = createRenderQuality(0);
  const clock = { now: 0 };
  const frameTimes = [60, 45, 34, 25, 20];
  while (clock.now < 100_000) {
    clock.now += frameTimes[state.tier];
    sampleRenderQuality(state, clock.now);
  }
  assert.equal(state.tier, 4);
  assert.ok(state.window && state.window.meanMs <= 20.001);
  assert.ok(renderQualityBudget(state.tier, 3).transmissionScale > 0);
});

test("hidden, intro, deliberate motion limits and resume gaps do not lower quality", () => {
  const state = createRenderQuality(0);
  const clock = { now: 0 };
  advance(state, clock, 30, 100, false);
  assert.equal(state.tier, 0);
  advance(state, clock, 4, 1000 / 30);
  assert.equal(state.tier, 0, "resume warmup excludes suspended cadence");
  pauseRenderQuality(state, clock.now);
  clock.now += 60_000;
  sampleRenderQuality(state, clock.now);
  advance(state, clock, 15);
  assert.equal(state.tier, 0);
});

test("sustained recovery improves one tier while a failed upgrade avoids oscillation", () => {
  const state = createRenderQuality(0, { hardwareConcurrency: 4, deviceMemory: 4 });
  const clock = { now: 0 };
  assert.deepEqual(advance(state, clock, 25), [0]);
  assert.deepEqual(advance(state, clock, 12, 1000 / 30), [1]);
  assert.ok(state.recoveryBlockedUntil > clock.now);
  assert.deepEqual(advance(state, clock, 75), []);
  assert.equal(state.tier, 1);
  assert.deepEqual(advance(state, clock, 60), [0]);
});
