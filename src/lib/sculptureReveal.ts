export type SculptureReveal = { value: number; velocity: number };

export function createSculptureReveal(): SculptureReveal {
  return { value: 0, velocity: 0 };
}

/** A separate, reversible dissolve; the leaf's fast motion never gates it. */
export function advanceSculptureReveal(state: SculptureReveal, selected: boolean, delta: number, reducedMotion = false) {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const dt = Math.min(delta, 0.05);
  const target = selected ? 1 : 0;
  // Critical damping preserves velocity when a user closes/reopens mid-fade.
  // Normal entry reaches 95% in ~0.8s; exit in ~0.7s. Reduced motion keeps
  // a short dissolve, with no spatial movement (see sculptureRevealPose).
  const response = reducedMotion ? 24 : selected ? 6 : 7;
  const offset = state.value - target;
  const impulse = state.velocity + response * offset;
  const decay = Math.exp(-response * dt);
  state.value = target + (offset + impulse * dt) * decay;
  state.velocity = (state.velocity - response * impulse * dt) * decay;
  if (Math.abs(state.value - target) < 0.0001 && Math.abs(state.velocity) < 0.001) {
    state.value = target;
    state.velocity = 0;
  }
}

export function sculptureRevealPose(value: number, reducedMotion = false) {
  const hidden = 1 - value;
  return {
    scale: reducedMotion ? 1 : 1 - hidden * 0.05,
    // Stay behind the leaf throughout the entrance, around the fitted center.
    depth: reducedMotion ? 0 : -hidden * 0.08,
  };
}
