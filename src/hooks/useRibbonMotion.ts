"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import {
  addRibbonInput,
  advanceRibbonMotion,
  createRibbonMotion,
  type RibbonMotionSnapshot,
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

/** Mount inside the Canvas. Only the ribbon consumes this position. */
export function useRibbonMotion(options: RibbonMotionOptions): MutableRefObject<RibbonMotionSnapshot> {
  const motion = useRef(createRibbonMotion());
  const latest = useRef(options);
  const reducedMotion = useRef(false);
  const visible = useRef(true);
  latest.current = options;

  useEffect(() => {
    if (options.paused || !options.enabled) motion.current.pendingInput = 0;
  }, [options.paused, options.enabled]);

  useEffect(() => {
    const surface = document.getElementById("portfolio-scroll-surface");
    if (!surface) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { reducedMotion.current = preference.matches; };
    const updateVisibility = () => {
      visible.current = document.visibilityState !== "hidden";
      if (!visible.current) {
        motion.current.pendingInput = 0;
        motion.current.inputVelocity = 0;
        motion.current.cruiseVelocity = 0;
        motion.current.velocity = 0;
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

    const onWheel = (event: WheelEvent) => {
      if (!latest.current.enabled || event.ctrlKey || isInteractive(event.target) || Math.abs(event.deltaY) < 0.1) return;
      event.preventDefault();
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1;
      navigate(event.deltaY * units);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!latest.current.enabled || event.touches.length !== 1 || isInteractive(event.target)) {
        touch = null;
        return;
      }
      const point = event.touches[0];
      touch = { x: point.clientX, y: point.clientY, previousY: point.clientY, dragging: false };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touch || event.touches.length !== 1 || !latest.current.enabled) return;
      const point = event.touches[0];
      const distanceX = point.clientX - touch.x;
      const distanceY = point.clientY - touch.y;
      if (!touch.dragging) {
        if (Math.abs(distanceY) < 8 || Math.abs(distanceY) <= Math.abs(distanceX) * 1.15) return;
        touch.dragging = true;
      }
      event.preventDefault();
      suppressClickUntil = performance.now() + 450;
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

    surface.addEventListener("wheel", onWheel, { passive: false });
    surface.addEventListener("touchstart", onTouchStart, { passive: true });
    surface.addEventListener("touchmove", onTouchMove, { passive: false });
    surface.addEventListener("touchend", onTouchEnd);
    surface.addEventListener("touchcancel", onTouchEnd);
    surface.addEventListener("click", onClick, true);
    return () => {
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
  });

  return motion;
}
