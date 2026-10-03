export interface RibbonFocusAnchor {
  x: number;
  y: number;
  z: number;
}

export interface RibbonFocusState extends RibbonFocusAnchor {
  scale: number;
}

export interface RibbonFocusOptions {
  focusScale?: number;
  focusPosition?: RibbonFocusAnchor;
  reducedMotion?: boolean;
}

export function createRibbonFocus(): RibbonFocusState {
  return { x: 0, y: 0, z: 0, scale: 1 };
}

/**
 * Ease the rendered transform itself, retaining continuity when its destination
 * changes. Clearing or replacing a selection never overwrites the current pose.
 * The anchor is in the ribbon's scrolling coordinates, before focus transforms.
 */
export function advanceRibbonFocus(
  state: RibbonFocusState,
  anchor: RibbonFocusAnchor | null,
  delta: number,
  options: RibbonFocusOptions = {},
): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const focused = anchor !== null && !options.reducedMotion;
  const scale = focused ? options.focusScale ?? 1.7 : 1;
  const position = options.focusPosition;
  const x = focused ? (position?.x ?? 0) - anchor.x * scale : 0;
  const y = focused ? (position?.y ?? 0.2) - anchor.y * scale : 0;
  const z = focused ? (position?.z ?? 4.2) - anchor.z * scale : 0;
  const response = options.reducedMotion ? 16 : 4.5;
  const blend = -Math.expm1(-response * Math.min(delta, 0.05));
  state.x += (x - state.x) * blend;
  state.y += (y - state.y) * blend;
  state.z += (z - state.z) * blend;
  state.scale += (scale - state.scale) * blend;

  if (
    !focused && Math.abs(state.x) + Math.abs(state.y) + Math.abs(state.z) + Math.abs(state.scale - 1) < 0.00001
  ) {
    state.x = 0;
    state.y = 0;
    state.z = 0;
    state.scale = 1;
  }
}
