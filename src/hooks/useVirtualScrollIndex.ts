"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { MutableRefObject } from "react";
import { useScrollObserver } from "@/hooks/useScrollObserver";
import { SCROLL_FOCUS_RELEASE_THRESHOLD } from "@/lib/doorCameraFocus";
import { introMotionBlend } from "@/lib/introMotion";
import {
  clampOffsetStep,
  SCROLL_INPUT_THRESHOLD,
} from "@/lib/scrollInput";
import {
  CLIMB_SCALE,
  LOOP_LENGTH,
  SCROLL_START_OFFSET,
} from "@/lib/spiral";
import { isPortfolioSceneInteractive, usePortfolioStore } from "@/lib/store";

export { CLIMB_SCALE };

const MAX_FRAME_DELTA = 1 / 30;
const AUTO_CRUISE_OFFSET_SPEED = 0.018;
const MAX_CRUISE_STEP_PER_FRAME = 0.55;

declare global {
  interface Window {
    __scrollDebug?: {
      unboundedOffset: number;
      pendingDelta: number;
      lastDirection: number;
      idleStep: number;
      userInteracted: boolean;
      virtualIndex: number;
      maxDisplayIndexDelta: number;
      frameCount: number;
    };
  }
}

function getAutoOffsetSpeed(elapsed: number): number {
  return AUTO_CRUISE_OFFSET_SPEED * introMotionBlend(elapsed);
}

/**
 * Integrates GSAP Observer scroll deltas into an unbounded virtual stair index.
 * Intro ramp and idle cruise advance offset when the user is not scrolling.
 */
export function useVirtualScrollIndex(): MutableRefObject<number> {
  const { pendingOffsetDeltaRef } = useScrollObserver();
  const virtualIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);
  const unboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const autoElapsedRef = useRef(0);
  const hasUserInteractedRef = useRef(false);
  const lastScrollDirectionRef = useRef(1);
  const maxDisplayIndexDeltaRef = useRef(0);
  const lastDisplayIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);

  useFrame((_, delta) => {
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA);
    const pendingDelta = pendingOffsetDeltaRef.current;
    pendingOffsetDeltaRef.current = 0;

    const { focusedDoorId, focusScrollAnchor, resetDoors } =
      usePortfolioStore.getState();
    const scrollInteractive = isPortfolioSceneInteractive(
      usePortfolioStore.getState().introPlayPhase,
    );
    const hasScrollInput =
      Math.abs(pendingDelta) > SCROLL_INPUT_THRESHOLD && scrollInteractive;
    const autoScrollPaused = focusedDoorId !== null && !hasScrollInput;

    let idleStep = 0;

    if (hasScrollInput) {
      if (focusedDoorId !== null) {
        resetDoors();
      }

      hasUserInteractedRef.current = true;
      const step = clampOffsetStep(pendingDelta);
      lastScrollDirectionRef.current = Math.sign(step) || lastScrollDirectionRef.current;
      unboundedOffsetRef.current += step;
    } else if (!autoScrollPaused) {
      if (!hasUserInteractedRef.current) {
        const epochMs = usePortfolioStore.getState().introEpochMs;
        if (epochMs !== null) {
          autoElapsedRef.current = (performance.now() - epochMs) / 1000;
        } else {
          autoElapsedRef.current += frameDelta;
        }
        idleStep = getAutoOffsetSpeed(autoElapsedRef.current) * frameDelta;
      } else {
        idleStep =
          lastScrollDirectionRef.current *
          AUTO_CRUISE_OFFSET_SPEED *
          frameDelta;
      }

      idleStep = clampOffsetStep(
        idleStep,
        MAX_CRUISE_STEP_PER_FRAME * frameDelta,
      );
      unboundedOffsetRef.current += idleStep;
    }

    const index = unboundedOffsetRef.current * CLIMB_SCALE;
    const displayDelta = Math.abs(index - lastDisplayIndexRef.current);
    if (displayDelta > maxDisplayIndexDeltaRef.current) {
      maxDisplayIndexDeltaRef.current = displayDelta;
    }
    lastDisplayIndexRef.current = index;
    virtualIndexRef.current = index;

    if (typeof window !== "undefined") {
      window.__scrollDebug = {
        unboundedOffset: unboundedOffsetRef.current,
        pendingDelta,
        lastDirection: lastScrollDirectionRef.current,
        idleStep,
        userInteracted: hasUserInteractedRef.current,
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
