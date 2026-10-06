/** Rendering budgets preserve the measured production baseline; only pixel work changes. */
export const RENDER_QUALITY_PROFILES = [
  { name: "full", maxDpr: 1.5, transmissionScale: 0.85 },
  { name: "balanced", maxDpr: 1.25, transmissionScale: 0.7 },
  { name: "efficient", maxDpr: 1, transmissionScale: 0.6 },
  { name: "constrained", maxDpr: 0.875, transmissionScale: 0.5 },
  { name: "minimum", maxDpr: 0.75, transmissionScale: 0.45 },
] as const;

export type RenderQualityTier = 0 | 1 | 2 | 3 | 4;
export type RenderQualityHints = { hardwareConcurrency?: number; deviceMemory?: number };
export type FrameWindow = { meanMs: number; p90Ms: number; slowFraction: number; durationMs: number; frames: number };
type BudgetTrial = {
  fromTier: RenderQualityTier;
  limitTier: RenderQualityTier;
  meanMs: number;
  p90Ms: number;
  observedMeanMs: number;
  observedP90Ms: number;
  windows: number;
};
export type RenderQualityState = {
  tier: RenderQualityTier;
  window: FrameWindow | null;
  /** Kept outside React; collecting samples never rerenders the scene. */
  samples: number[];
  sampledMs: number;
  lastFrameAt: number | null;
  warmupUntil: number;
  slowMs: number;
  healthyMs: number;
  lastChangeAt: number;
  lastChangeWasUpgrade: boolean;
  recoveryBlockedUntil: number;
  adjustmentBlockedUntil: number;
  trial: BudgetTrial | null;
  lastDecision: "startup" | "slow-frames" | "healthy-frames" | "no-measured-gain";
};

const WINDOW_MS = 2_000;
const WARMUP_MS = 3_000;
const CHANGE_COOLDOWN_MS = 8_000;
const RECOVERY_COOLDOWN_MS = 20_000;

/** Missing browser hints are unknown, not evidence of a weak device. */
export function initialRenderQualityTier(hints: RenderQualityHints = {}): RenderQualityTier {
  const { hardwareConcurrency: cores, deviceMemory: memory } = hints;
  return cores && cores > 0 && cores <= 4 && memory && memory > 0 && memory <= 4 ? 1 : 0;
}

export function renderQualityBudget(tier: RenderQualityTier, nativeDpr: number) {
  const profile = RENDER_QUALITY_PROFILES[tier];
  const usableDpr = Number.isFinite(nativeDpr) && nativeDpr > 0 ? nativeDpr : 1;
  // A native 1x display should not pay for invisible supersampling.
  return { ...profile, dpr: Math.min(usableDpr, profile.maxDpr) };
}

export function createRenderQuality(now: number, hints: RenderQualityHints = {}): RenderQualityState {
  return {
    tier: initialRenderQualityTier(hints), window: null, samples: [], sampledMs: 0,
    lastFrameAt: null, warmupUntil: now + WARMUP_MS, slowMs: 0, healthyMs: 0,
    lastChangeAt: now, lastChangeWasUpgrade: false, recoveryBlockedUntil: 0,
    adjustmentBlockedUntil: 0, trial: null, lastDecision: "startup",
  };
}

/** Loading, resize and tab suspension must not look like poor rendering. */
export function pauseRenderQuality(state: RenderQualityState, now: number) {
  state.samples.length = 0;
  state.sampledMs = 0;
  state.lastFrameAt = null;
  state.warmupUntil = now + WARMUP_MS;
  state.slowMs = 0;
  state.healthyMs = 0;
  if (state.trial) {
    state.trial.observedMeanMs = 0;
    state.trial.observedP90Ms = 0;
    state.trial.windows = 0;
  }
}

function finishWindow(state: RenderQualityState, now: number) {
  const samples = state.samples;
  const sorted = [...samples].sort((a, b) => a - b);
  const window: FrameWindow = {
    meanMs: state.sampledMs / samples.length,
    p90Ms: sorted[Math.ceil(samples.length * 0.9) - 1],
    slowFraction: samples.filter(sample => sample > 24).length / samples.length,
    durationMs: state.sampledMs,
    frames: samples.length,
  };
  state.window = window;
  state.samples = [];
  state.sampledMs = 0;

  // Aim at 60Hz where possible. Sustained 40–45Hz or repeated missed frames
  // warrant less pixel work; an isolated stall should not soften the artwork.
  const slow = window.meanMs > 23 || (window.p90Ms > 28 && window.slowFraction > 0.2);
  const healthy = window.meanMs < 18 && window.p90Ms < 20 && window.slowFraction < 0.03;
  state.slowMs = slow ? state.slowMs + window.durationMs : 0;
  state.healthyMs = healthy ? state.healthyMs + window.durationMs : 0;

  if (state.trial) {
    const trial = state.trial;
    trial.observedMeanMs += window.meanMs;
    trial.observedP90Ms += window.p90Ms;
    trial.windows += 1;
    if (trial.windows < 2) return false;
    const mean = trial.observedMeanMs / trial.windows;
    const p90 = trial.observedP90Ms / trial.windows;
    state.trial = null;
    // Browser cadence limits or CPU work can make a pixel reduction useless.
    // Require a sustained benefit before keeping the loss in visual detail.
    const improved = mean < trial.meanMs * 0.92 || (p90 < trial.p90Ms * 0.88 && mean < trial.meanMs * 1.03);
    if (!improved) {
      // Vsync can hide real savings: two different GPU costs may both miss
      // 60Hz and present at 30Hz. Try up to two additional budgets before
      // calling this a cadence limit. Three 3s settles + 4s observations bound
      // the entire no-benefit experiment to about 21s of visible sampling.
      if (state.tier < trial.limitTier) {
        state.trial = trial;
        state.tier = (state.tier + 1) as RenderQualityTier;
        state.lastChangeAt = now;
        pauseRenderQuality(state, now);
        return true;
      }
      state.tier = trial.fromTier;
      state.lastDecision = "no-measured-gain";
      state.lastChangeAt = now;
      state.lastChangeWasUpgrade = false;
      // This is temporary evidence, not a permanent hardware classification.
      state.adjustmentBlockedUntil = now + 60_000;
      pauseRenderQuality(state, now);
      return true;
    }
  }

  const sinceChange = now - state.lastChangeAt;
  if (now < state.adjustmentBlockedUntil) return false;
  if (state.slowMs >= 6_000 && sinceChange >= CHANGE_COOLDOWN_MS && state.tier < 4) {
    // An unsuccessful recovery trial should not repeatedly alternate quality.
    const failedRecovery = state.lastChangeWasUpgrade && sinceChange < 40_000;
    if (failedRecovery) state.recoveryBlockedUntil = now + 120_000;
    else state.trial = {
      fromTier: state.tier, limitTier: Math.min(state.tier + 3, 4) as RenderQualityTier,
      meanMs: window.meanMs, p90Ms: window.p90Ms, observedMeanMs: 0, observedP90Ms: 0, windows: 0,
    };
    state.tier = (state.tier + 1) as RenderQualityTier;
    state.lastDecision = "slow-frames";
    state.lastChangeAt = now;
    state.lastChangeWasUpgrade = false;
    pauseRenderQuality(state, now);
    return true;
  }
  if (state.healthyMs >= 20_000 && sinceChange >= RECOVERY_COOLDOWN_MS && now >= state.recoveryBlockedUntil && state.tier > 0) {
    state.tier = (state.tier - 1) as RenderQualityTier;
    state.lastDecision = "healthy-frames";
    state.lastChangeAt = now;
    state.lastChangeWasUpgrade = true;
    pauseRenderQuality(state, now);
    return true;
  }
  return false;
}

/** Sample visible rAF cadence, not R3F's delta which may include a long pause. */
export function sampleRenderQuality(state: RenderQualityState, now: number, eligible = true) {
  if (!eligible || !Number.isFinite(now)) {
    pauseRenderQuality(state, Number.isFinite(now) ? now : state.warmupUntil);
    return false;
  }
  const previous = state.lastFrameAt;
  state.lastFrameAt = now;
  if (previous === null || now < state.warmupUntil) return false;
  const frameMs = now - previous;
  if (frameMs <= 0) return false;
  // Huge gaps usually mean suspension/debugger/network compilation. Reset the
  // observation window instead of allowing one gap to classify a whole device.
  if (frameMs > 1_000) {
    pauseRenderQuality(state, now);
    return false;
  }
  state.samples.push(frameMs);
  state.sampledMs += frameMs;
  return state.sampledMs >= WINDOW_MS ? finishWindow(state, now) : false;
}
