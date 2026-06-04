/**
 * Shared sizing with EyeConsentSvg (viewBox 200×200, center 100,100).
 * 1 local unit = 1 SVG pixel / 100 (half viewBox extent).
 */
import type { PerspectiveCamera } from "three";
import { EYE_CONTROL_VMIN } from "@/lib/eyeConsentLayout";

export const EYE_VIEWBOX = 200;
export const EYE_VIEWBOX_HALF = EYE_VIEWBOX / 2;

/** Visible eyeball (iris). */
export const EYE_IRIS_RADIUS_PX = 29;
/** Soft ring from playRing circle. */
export const EYE_PLAY_RING_RADIUS_PX = 23;
/** Inner guide stroke in iconGroup. */
export const EYE_INNER_RING_RADIUS_PX = 17.5;

/** Play icon polygon in SVG px (relative to center). */
export const EYE_PLAY_TRIANGLE_HALF_HEIGHT_PX = 7;
export const EYE_PLAY_TRIANGLE_DEPTH_PX = 13;

export function svgRadiusToLocal(radiusPx: number): number {
  return radiusPx / EYE_VIEWBOX_HALF;
}

export const PLAY_IRIS_LOCAL_RADIUS = svgRadiusToLocal(EYE_IRIS_RADIUS_PX);
export const PLAY_INNER_RING_LOCAL_RADIUS = svgRadiusToLocal(
  EYE_INNER_RING_RADIUS_PX,
);
/** Primary visible play ring: matches the open-eye iris for the handoff. */
export const PLAY_PRIMARY_RING_LOCAL_RADIUS = PLAY_IRIS_LOCAL_RADIUS;
export const PLAY_SOFT_RING_LOCAL_RADIUS = svgRadiusToLocal(
  EYE_PLAY_RING_RADIUS_PX,
);

/** Circumradius of a regular tetrahedron matching the SVG play icon footprint. */
export function getPlayTetrahedronRadius(): number {
  const halfH = svgRadiusToLocal(EYE_PLAY_TRIANGLE_HALF_HEIGHT_PX);
  const depth = svgRadiusToLocal(EYE_PLAY_TRIANGLE_DEPTH_PX);
  return Math.max(halfH, depth * 0.65) * 1.25;
}

/** Matches eyeConsentLayout: min(90vmin, 100vw - 2rem, 100vh - 2rem). */
export function getEyeControlSidePx(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const vmin = Math.min(viewportWidth, viewportHeight);
  return Math.min(
    EYE_CONTROL_VMIN * vmin,
    Math.max(0, viewportWidth - 32),
    Math.max(0, viewportHeight - 32),
  );
}

/**
 * Scale so the 3D iris ring matches the SVG iris on screen at `viewDistance`.
 * Uses the same control-size heuristic as the HTML overlay.
 */
export function getPlayIntroScale(
  camera: PerspectiveCamera,
  viewDistance: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const controlSide = getEyeControlSidePx(viewportWidth, viewportHeight);
  const irisScreenRadius = (EYE_IRIS_RADIUS_PX / EYE_VIEWBOX_HALF) * (controlSide / 2);
  const visibleHalfHeight =
    viewportHeight / (2 * Math.tan((camera.fov * Math.PI) / 180 / 2));
  const worldRadiusNeeded =
    (irisScreenRadius / visibleHalfHeight) * viewDistance;
  return worldRadiusNeeded / PLAY_IRIS_LOCAL_RADIUS;
}

/** Docked widget: fraction of intro angular size on screen (larger = easier to tap). */
export const PLAY_DOCK_ANGULAR_FRACTION = 0.42;

export function getPlayDockScale(
  camera: PerspectiveCamera,
  viewDistance: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  return (
    getPlayIntroScale(camera, viewDistance, viewportWidth, viewportHeight) *
    PLAY_DOCK_ANGULAR_FRACTION
  );
}
