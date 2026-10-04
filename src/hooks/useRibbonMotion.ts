"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { syncRibbonOrbit } from "@/lib/ribbonOrbit";
import { bindNativeRibbonScroll } from "@/lib/nativeRibbonScroll";
import {
  addRibbonInput,
  advanceRibbonMotion,
  createRibbonMotion,
} from "@/lib/ribbonMotion";

interface RibbonMotionOptions {
  enabled: boolean;
  paused: boolean;
  onUserNavigate: () => void;
}

const INTERACTIVE_SELECTOR = 'a,button,input,select,textarea,[role="button"],[contenteditable="true"],[data-ribbon-no-scroll]';

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

/** Travel and orbit share one eased clock, including cruise and pause. */
export function useRibbonMotion(options: RibbonMotionOptions) {
  const motion = useRef(createRibbonMotion());
  const orbit = useRef(createRibbonMotion());
  const latest = useRef(options);
  const reducedMotion = useRef(false);
  const visible = useRef(true);
  latest.current = options;

  useEffect(() => {
    if (options.paused || !options.enabled) {
      motion.current.pendingInput = 0;
    }
  }, [options.paused, options.enabled]);

  useEffect(() => {
    const surface = document.getElementById("portfolio-scroll-surface");
    if (!surface) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { reducedMotion.current = preference.matches; };
    const updateVisibility = () => {
      visible.current = document.visibilityState !== "hidden";
      if (!visible.current) {
        for (const state of [motion.current, orbit.current]) {
          state.pendingInput = 0;
          state.inputVelocity = 0;
          state.cruiseVelocity = 0;
          state.velocity = 0;
        }
      }
    };
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);

    let lastNavigation = -Infinity;
    let touch: { x: number; y: number; previousY: number; dragging: boolean } | null = null;
    let suppressClickUntil = 0;

    const navigate = (pixels: number) => {
      if (!latest.current.enabled || !visible.current) return;
      const now = performance.now();
      if (latest.current.paused || now - lastNavigation > 150) {
        latest.current.onUserNavigate();
        lastNavigation = now;
      }
      addRibbonInput(motion.current, pixels, reducedMotion.current);
    };

    const nativeScroll = bindNativeRibbonScroll();
    const isZoomed = () => nativeScroll.active && (window.visualViewport?.scale ?? 1) > 1.01;

    const onWheel = (event: WheelEvent) => {
      if (!latest.current.enabled || event.ctrlKey || isInteractive(event.target) || Math.abs(event.deltaY) < 0.1) return;
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1;
      navigate(event.deltaY * units);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!latest.current.enabled || event.touches.length !== 1 || isZoomed() || isInteractive(event.target)) {
        touch = null;
        return;
      }
      const point = event.touches[0];
      touch = { x: point.clientX, y: point.clientY, previousY: point.clientY, dragging: false };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isZoomed()) { touch = null; return; }
      if (!touch || !latest.current.enabled) return;
      const point = event.touches[0];
      const distanceX = point.clientX - touch.x;
      const distanceY = point.clientY - touch.y;
      if (!touch.dragging) {
        if (Math.abs(distanceY) < 8 || Math.abs(distanceY) <= Math.abs(distanceX) * 1.15) return;
        touch.dragging = true;
      }
      suppressClickUntil = performance.now() + 450;
      // The same eased motion drives touch and wheel input. Keep the mobile
      // document stationary so Safari never translates the WebGL surface.
      event.preventDefault();
      navigate((touch.previousY - point.clientY) * 1.8);
      touch.previousY = point.clientY;
    };

    const onTouchEnd = () => {
      if (touch?.dragging) suppressClickUntil = performance.now() + 450;
      touch = null;
    };
    const onClick = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntil && !isInteractive(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("wheel", onWheel, { passive: false });
    surface.addEventListener("touchstart", onTouchStart, { passive: true });
    surface.addEventListener("touchend", onTouchEnd);
    surface.addEventListener("touchcancel", onTouchEnd);
    surface.addEventListener("click", onClick, true);
    return () => {
      nativeScroll.dispose();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
      surface.removeEventListener("wheel", onWheel);
      surface.removeEventListener("touchstart", onTouchStart);
      surface.removeEventListener("touchmove", onTouchMove);
      surface.removeEventListener("touchend", onTouchEnd);
      surface.removeEventListener("touchcancel", onTouchEnd);
      surface.removeEventListener("click", onClick, true);
    };
  }, []);

  useFrame((_, delta) => {
    if (!visible.current || !latest.current.enabled) return;
    advanceRibbonMotion(motion.current, delta, {
      paused: latest.current.paused,
      reducedMotion: reducedMotion.current,
    });
    syncRibbonOrbit(motion.current, orbit.current);
  }, -2);

  return { motion, orbit };
}
