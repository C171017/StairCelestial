import test from "node:test";
import assert from "node:assert/strict";
import { retainIntroSession } from "./introSession";
import { usePortfolioStore } from "./store";

test("effect replay preserves an entered scene and its one-shot readiness signal", async () => {
  const release = retainIntroSession();
  usePortfolioStore.setState({ sceneBootstrapped: true, introPlayPhase: "active", introMainOpacity: 1, introEpochMs: 42 });
  release();
  const releaseReplay = retainIntroSession();
  await Promise.resolve();
  assert.equal(usePortfolioStore.getState().sceneBootstrapped, true);
  assert.equal(usePortfolioStore.getState().introPlayPhase, "active");
  assert.equal(usePortfolioStore.getState().introEpochMs, 42);
  releaseReplay();
  await Promise.resolve();
  assert.equal(usePortfolioStore.getState().introPlayPhase, "hidden");
  assert.equal(usePortfolioStore.getState().sceneBootstrapped, false);
  assert.equal(usePortfolioStore.getState().introMainOpacity, 0);
  assert.equal(usePortfolioStore.getState().introEpochMs, null);
});

test("an outgoing owner cannot reset an overlapping scene or a new visit", async () => {
  const releaseA = retainIntroSession();
  const releaseB = retainIntroSession();
  usePortfolioStore.setState({ introPlayPhase: "entering", introMainOpacity: 0.6 });
  releaseA();
  releaseA();
  await Promise.resolve();
  assert.equal(usePortfolioStore.getState().introPlayPhase, "entering");
  releaseB();
  await Promise.resolve();
  const releaseNewVisit = retainIntroSession();
  assert.equal(usePortfolioStore.getState().introPlayPhase, "hidden");
  assert.equal(usePortfolioStore.getState().introMainOpacity, 0);
  releaseNewVisit();
  await Promise.resolve();
});
