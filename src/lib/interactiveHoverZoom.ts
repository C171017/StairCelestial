import gsap from "gsap";
import type { MutableRefObject } from "react";
import type * as THREE from "three";

export const INTERACTIVE_HOVER_SCALE = 1.08;
export const INTERACTIVE_HOVER_SCALE_REDUCED = 1.04;
export const INTERACTIVE_HOVER_DURATION = 0.22;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function setInteractiveHoverScale(
  object: THREE.Object3D | null,
  hovered: boolean,
  tweenRef: MutableRefObject<gsap.core.Tween | null>,
) {
  if (!object) return;

  const reduced = prefersReducedMotion();
  const target = hovered
    ? reduced
      ? INTERACTIVE_HOVER_SCALE_REDUCED
      : INTERACTIVE_HOVER_SCALE
    : 1;

  tweenRef.current?.kill();
  tweenRef.current = gsap.to(object.scale, {
    x: target,
    y: target,
    z: target,
    duration: reduced ? 0.08 : INTERACTIVE_HOVER_DURATION,
    ease: "power2.out",
  });
}

export function setPointerCursor(pointer: boolean) {
  if (typeof document === "undefined") return;
  document.body.style.cursor = pointer ? "pointer" : "";
}
