"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import {
  createRenderQuality, pauseRenderQuality, renderQualityBudget, sampleRenderQuality,
  type RenderQualityState,
} from "@/lib/renderQuality";

/** React only participates when a rendering budget changes, never per frame. */
export function AdaptiveQuality({ enabled }: { enabled: boolean }) {
  const { gl, setDpr, size } = useThree();
  const state = useRef<RenderQualityState | null>(null);
  const reducedMotion = useRef(false);
  const lastDiagnosticAt = useRef(0);
  const applyBudget = useCallback(() => {
    if (!state.current) return;
    const budget = renderQualityBudget(state.current.tier, window.devicePixelRatio);
    setDpr(budget.dpr);
    gl.transmissionResolutionScale = budget.transmissionScale;
  }, [gl, setDpr]);

  useEffect(() => {
    const device = navigator as Navigator & { deviceMemory?: number };
    state.current = createRenderQuality(performance.now(), {
      hardwareConcurrency: device.hardwareConcurrency, deviceMemory: device.deviceMemory,
    });
    applyBudget();
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reset = () => { if (state.current) pauseRenderQuality(state.current, performance.now()); };
    const updatePreference = () => { reducedMotion.current = preference.matches; reset(); };
    updatePreference();
    document.addEventListener("visibilitychange", reset);
    preference.addEventListener("change", updatePreference);
    return () => {
      document.removeEventListener("visibilitychange", reset);
      preference.removeEventListener("change", updatePreference);
    };
  }, [applyBudget]);

  useEffect(() => {
    if (state.current) pauseRenderQuality(state.current, performance.now());
    applyBudget();
  }, [enabled, size.width, size.height, applyBudget]);

  useFrame(({ viewport }) => {
    const policy = state.current;
    if (!policy) return;
    const now = performance.now();
    const desired = renderQualityBudget(policy.tier, window.devicePixelRatio);
    // Canvas configure reapplies its initial dpr prop on parent renders. Own
    // the effective budget here too, so selection/resize cannot silently undo
    // a measured quality decision (or leave diagnostics reporting a fiction).
    if (viewport.dpr !== desired.dpr || gl.getPixelRatio() !== desired.dpr) {
      applyBudget();
      pauseRenderQuality(policy, now);
    }
    // Respect intentionally limited motion and ignore the entrance/asset warmup.
    const eligible = enabled && !document.hidden && !reducedMotion.current;
    if (sampleRenderQuality(policy, now, eligible)) applyBudget();
    if (process.env.NODE_ENV === "development" && now - lastDiagnosticAt.current > 500) {
      lastDiagnosticAt.current = now;
      const budget = renderQualityBudget(policy.tier, window.devicePixelRatio);
      const data = gl.domElement.dataset;
      data.renderQuality = budget.name;
      data.renderQualityDecision = policy.lastDecision;
      data.renderQualitySampling = !eligible ? "paused" : now < policy.warmupUntil ? "warming" : "observing";
      data.renderDpr = gl.getPixelRatio().toFixed(2);
      data.renderDprTarget = budget.dpr.toFixed(2);
      data.transmissionScale = gl.transmissionResolutionScale.toFixed(2);
      data.averageFrameMs = policy.window?.meanMs.toFixed(2) ?? "warming";
      data.frameP90Ms = policy.window?.p90Ms.toFixed(2) ?? "warming";
      // These describe the renderer's latest scene render, not accumulated
      // auxiliary reflection/shadow passes, whose info can reset independently.
      data.sceneDrawCalls = String(gl.info.render.calls);
      data.sceneTriangles = String(gl.info.render.triangles);
      data.renderTextures = String(gl.info.memory.textures);
      data.renderPrograms = String(gl.info.programs?.length ?? 0);
    }
  }, -100);
  return null;
}
