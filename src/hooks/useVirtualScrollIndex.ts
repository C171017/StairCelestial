"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { MutableRefObject } from "react";
import { MathUtils } from "three";
import { computeTrackerStep } from "@/hooks/scrollLapIntegration";
import { useCenteredScrollInit } from "@/hooks/useCenteredScrollInit";
import { SCROLL_FOCUS_RELEASE_THRESHOLD } from "@/lib/doorCameraFocus";
import {
  CLIMB_SCALE,
  LOOP_LENGTH,
  SCROLL_START_OFFSET,
} from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

export { CLIMB_SCALE };

/** Max display offset speed — what camera/geometry consume. */
const MAX_DISPLAY_OFFSET_SPEED = 2.4;
const DISPLAY_DAMPING = 18;
const MAX_FRAME_DELTA = 1 / 30;
const AUTO_LAUNCH_DURATION = 1.25;
const AUTO_SETTLE_DURATION = 3.5;
const AUTO_LAUNCH_OFFSET_SPEED = 0.09;
const AUTO_CRUISE_OFFSET_SPEED = 0.015;

declare global {
  interface Window {
    __scrollDebug?: {
      offset: number;
      targetUnbounded: number;
      displayUnbounded: number;
      virtualIndex: number;
      maxDisplayIndexDelta: number;
      frameCount: number;
    };
  }
}

function clampStep(value: number, max: number): number {
  return Math.max(-max, Math.min(max, value));
}

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function getAutoOffsetSpeed(elapsed: number): number {
  if (elapsed < AUTO_LAUNCH_DURATION) {
    const launchT = elapsed / AUTO_LAUNCH_DURATION;
    return AUTO_LAUNCH_OFFSET_SPEED * smoothstep(launchT);
  }

  const settleT = (elapsed - AUTO_LAUNCH_DURATION) / AUTO_SETTLE_DURATION;
  const blend = smoothstep(settleT);
  return MathUtils.lerp(AUTO_LAUNCH_OFFSET_SPEED, AUTO_CRUISE_OFFSET_SPEED, blend);
}

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Tracker keeps lap accounting; display layer is always capped for steady motion.
 */
export function useVirtualScrollIndex(): MutableRefObject<number> {
  const scroll = useScroll();
  const virtualIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);
  const autoElapsedRef = useRef(0);
  const lastOffsetRef = useRef(SCROLL_START_OFFSET);
  const targetUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const displayUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const maxDisplayIndexDeltaRef = useRef(0);
  const lastDisplayIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);

  const scrollRefs = {
    targetUnboundedOffsetRef,
    displayUnboundedOffsetRef,
    lastOffsetRef,
  };

  useCenteredScrollInit(scrollRefs);

  useFrame((_, delta) => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA);

    const target = targetUnboundedOffsetRef;
    target.current += computeTrackerStep(last, o);

    const { focusedDoorId, focusScrollAnchor, resetDoors } =
      usePortfolioStore.getState();
    const autoScrollPaused = focusedDoorId !== null;
    if (!autoScrollPaused) {
      autoElapsedRef.current += frameDelta;
      target.current += getAutoOffsetSpeed(autoElapsedRef.current) * frameDelta;
    }
    lastOffsetRef.current = o;

    const currentDisplay = displayUnboundedOffsetRef.current;
    const dampedDisplay = MathUtils.damp(
      currentDisplay,
      target.current,
      DISPLAY_DAMPING,
      frameDelta,
    );
    const displayStep = clampStep(
      dampedDisplay - currentDisplay,
      MAX_DISPLAY_OFFSET_SPEED * frameDelta,
    );
    displayUnboundedOffsetRef.current = currentDisplay + displayStep;

    const index = displayUnboundedOffsetRef.current * CLIMB_SCALE;
    const displayDelta = Math.abs(index - lastDisplayIndexRef.current);
    if (displayDelta > maxDisplayIndexDeltaRef.current) {
      maxDisplayIndexDeltaRef.current = displayDelta;
    }
    lastDisplayIndexRef.current = index;
    virtualIndexRef.current = index;

    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      window.__scrollDebug = {
        offset: o,
        targetUnbounded: target.current,
        displayUnbounded: displayUnboundedOffsetRef.current,
        virtualIndex: index,
        maxDisplayIndexDelta: maxDisplayIndexDeltaRef.current,
        frameCount: (window.__scrollDebug?.frameCount ?? 0) + 1,
      };
    }

    if (
      focusedDoorId !== null &&
      focusScrollAnchor !== null &&
      Math.abs(index - focusScrollAnchor) > SCROLL_FOCUS_RELEASE_THRESHOLD
    ) {
      resetDoors();
    }

    usePortfolioStore.getState().setVirtualStairIndex(index);

    const normalized =
      ((index % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH / LOOP_LENGTH;
    usePortfolioStore.getState().setScrollProgress(normalized);
  });

  return virtualIndexRef;
}
