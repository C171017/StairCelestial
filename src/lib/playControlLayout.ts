import type { NdcAnchor } from "./viewportAnchor";

/** Center screen — aligned with eye / play control overlay. */
export const PLAY_INTRO_NDC: NdcAnchor = { x: 0, y: 0 };

/** Viewport-fixed dock: horizontally centered near the top edge. */
export const PLAY_DOCK_NDC: NdcAnchor = { x: 0, y: 0.76 };

/** Closer = larger on screen; scale is computed from FOV + viewport to match SVG iris. */
export const PLAY_INTRO_VIEW_DISTANCE = 28;
/** Nearer than intro fly end so the docked control reads larger on screen. */
export const PLAY_DOCK_VIEW_DISTANCE = 40;

/** World-space tilt when docked (radians). */
export const PLAY_DOCK_TILT: [number, number, number] = [0.22, 0.48, 0.12];

/** Must match StairwayScene canvas camera fov. */
export const PLAY_CAMERA_FOV = 58;
