export interface RibbonFocusAnchor {
  x: number;
  y: number;
  z: number;
}

export interface RibbonFocusState extends RibbonFocusAnchor {
  scale: number;
  yaw: number;
  pitch: number;
  viewYaw: number;
}

export interface RibbonFocusOptions {
  focusScale?: number;
  focusPosition?: RibbonFocusAnchor;
  reducedMotion?: boolean;
  /** Orient the selected door's local +Z face toward the camera. */
  doorYaw?: number;
  /** Camera azimuth; cameraPosition/focusPosition use its unrotated frame. */
  viewYaw?: number;
  cameraPosition?: RibbonFocusAnchor;
}

export function createRibbonFocus(): RibbonFocusState {
  return { x: 0, y: 0, z: 0, scale: 1, yaw: 0, pitch: 0, viewYaw: 0 };
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
  // A door still needs a legible front view with reduced motion; settle that
  // pose immediately instead of animating the orbit. Legacy focus stays still.
  const doorFocus = options.doorYaw !== undefined;
  const focused = anchor !== null && (!options.reducedMotion || doorFocus);
  const scale = focused ? options.focusScale ?? 1.7 : 1;
  const position = options.focusPosition;
  const yaw = focused ? -(options.doorYaw ?? 0) : 0;
  const camera = options.cameraPosition;
  const viewYaw = focused ? options.viewYaw ?? 0 : 0;
  const pitch = focused && camera
    ? -Math.atan2(camera.y - (position?.y ?? 0.2), camera.z - (position?.z ?? 4.2))
    : 0;
  // Three's XYZ Euler rotates around Y first, then X. Translate the rotated
  // anchor so changing the facing direction does not change the final framing.
  const rotatedX = anchor ? anchor.x * Math.cos(yaw) + anchor.z * Math.sin(yaw) : 0;
  const yawZ = anchor ? -anchor.x * Math.sin(yaw) + anchor.z * Math.cos(yaw) : 0;
  const rotatedY = anchor ? anchor.y * Math.cos(pitch) - yawZ * Math.sin(pitch) : 0;
  const rotatedZ = anchor ? anchor.y * Math.sin(pitch) + yawZ * Math.cos(pitch) : 0;
  const localX = focused ? (position?.x ?? 0) - rotatedX * scale : 0;
  const y = focused ? (position?.y ?? 0.2) - rotatedY * scale : 0;
  const localZ = focused ? (position?.z ?? 4.2) - rotatedZ * scale : 0;
  const x = localX * Math.cos(viewYaw) + localZ * Math.sin(viewYaw);
  const z = -localX * Math.sin(viewYaw) + localZ * Math.cos(viewYaw);
  const response = options.reducedMotion ? 16 : 4.5;
  const blend = options.reducedMotion && doorFocus ? 1 : -Math.expm1(-response * Math.min(delta, 0.05));
  state.x += (x - state.x) * blend;
  state.y += (y - state.y) * blend;
  state.z += (z - state.z) * blend;
  state.scale += (scale - state.scale) * blend;
  // Choose the shortest turn even when switching doors across -π / +π.
  state.yaw += Math.atan2(Math.sin(yaw - state.yaw), Math.cos(yaw - state.yaw)) * blend;
  state.pitch += (pitch - state.pitch) * blend;
  state.viewYaw += Math.atan2(Math.sin(viewYaw - state.viewYaw), Math.cos(viewYaw - state.viewYaw)) * blend;

  if (
    !focused && Math.abs(state.x) + Math.abs(state.y) + Math.abs(state.z) + Math.abs(state.scale - 1) + Math.abs(Math.sin(state.yaw / 2)) + Math.abs(state.pitch) + Math.abs(Math.sin(state.viewYaw / 2)) < 0.00001
  ) {
    state.x = 0;
    state.y = 0;
    state.z = 0;
    state.scale = 1;
    state.yaw = 0;
    state.pitch = 0;
    state.viewYaw = 0;
  }
}
