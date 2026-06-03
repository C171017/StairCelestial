"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import { computeTrackerStep } from "@/hooks/scrollLapIntegration";
import { useCenteredScrollInit } from "@/hooks/useCenteredScrollInit";
import { SCROLL_FOCUS_RELEASE_THRESHOLD } from "@/lib/doorCameraFocus";
import {
  CLIMB_SCALE,
  LOOP_LENGTH,
  SCROLL_START_OFFSET,
} from "@/lib/spiral";
import { introMotionBlend } from "@/lib/introMotion";
import { usePortfolioStore } from "@/lib/store";

export { CLIMB_SCALE };

/** Max momentum speed — what camera/geometry consume after user input. */
const MAX_MOMENTUM_OFFSET_SPEED = 0.55;
const MAX_FRAME_DELTA = 1 / 30;
const AUTO_CRUISE_OFFSET_SPEED = 0.018;
const INPUT_STEP_THRESHOLD = 0.000025;
const INPUT_VELOCITY_BLEND = 0.42;
const INPUT_REVERSAL_BLEND = 0.74;
const MOMENTUM_FRICTION = 0.27;
const STOPPED_SPEED_EPSILON = 0.00035;

declare global {
  interface Window {
    __scrollDebug?: {
      offset: number;
      displayUnbounded: number;
      velocity: number;
      userInteracted: boolean;
      virtualIndex: number;
      maxDisplayIndexDelta: number;
      frameCount: number;
    };
  }
}

function clampStep(value: number, max: number): number {
  return Math.max(-max, Math.min(max, value));
}

function getAutoOffsetSpeed(elapsed: number): number {
  return AUTO_CRUISE_OFFSET_SPEED * introMotionBlend(elapsed);
}

function frameLerpAmount(perFrameAmount: number, delta: number): number {
  return 1 - Math.pow(1 - perFrameAmount, delta * 60);
}

function decayTowardCruise(
  velocity: number,
  direction: number,
  delta: number,
): number {
  const cruise = direction * AUTO_CRUISE_OFFSET_SPEED;
  const friction = Math.exp(-MOMENTUM_FRICTION * delta);
  return cruise + (velocity - cruise) * friction;
}

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Tracker keeps lap accounting; display layer is always capped for steady motion.
 */
export function useVirtualScrollIndex(): MutableRefObject<number> {
  const scroll = useScroll();
  const virtualIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);
  const autoElapsedRef = useRef(0);
  const hasUserInteractedRef = useRef(false);
  const lastOffsetRef = useRef(SCROLL_START_OFFSET);
  const targetUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const displayUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const velocityRef = useRef(0);
  const lastMomentumDirectionRef = useRef(1);
  const userHoldingStillRef = useRef(false);
  const maxDisplayIndexDeltaRef = useRef(0);
  const lastDisplayIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);

  const scrollRefs = {
    targetUnboundedOffsetRef,
    displayUnboundedOffsetRef,
    lastOffsetRef,
  };

  useCenteredScrollInit(scrollRefs);

  useEffect(() => {
    const el = scroll.el;
    if (!el) return;

    const holdStill = () => {
      userHoldingStillRef.current = true;
      velocityRef.current = 0;
    };
    const releaseStill = () => {
      userHoldingStillRef.current = false;
    };

    el.addEventListener("pointerdown", holdStill, { passive: true });
    el.addEventListener("pointermove", releaseStill, { passive: true });
    el.addEventListener("touchstart", holdStill, { passive: true });
    el.addEventListener("touchmove", releaseStill, { passive: true });
    el.addEventListener("mousedown", holdStill, { passive: true });
    window.addEventListener("pointerup", releaseStill);
    window.addEventListener("touchend", releaseStill);
    window.addEventListener("mouseup", releaseStill);

    return () => {
      el.removeEventListener("pointerdown", holdStill);
      el.removeEventListener("pointermove", releaseStill);
      el.removeEventListener("touchstart", holdStill);
      el.removeEventListener("touchmove", releaseStill);
      el.removeEventListener("mousedown", holdStill);
      window.removeEventListener("pointerup", releaseStill);
      window.removeEventListener("touchend", releaseStill);
      window.removeEventListener("mouseup", releaseStill);
    };
  }, [scroll.el]);

  useFrame((_, delta) => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const frameDelta = Math.min(delta, MAX_FRAME_DELTA);
    const scrollStep = computeTrackerStep(last, o);

    const target = targetUnboundedOffsetRef;
    target.current += scrollStep;

    const { focusedDoorId, focusScrollAnchor, resetDoors } =
      usePortfolioStore.getState();
    const hasScrollInput = Math.abs(scrollStep) > INPUT_STEP_THRESHOLD;
    const autoScrollPaused = focusedDoorId !== null && !hasScrollInput;

    if (hasScrollInput) {
      if (focusedDoorId !== null) {
        resetDoors();
      }

      hasUserInteractedRef.current = true;
      const measuredVelocity = clampStep(
        scrollStep / Math.max(frameDelta, 0.001),
        MAX_MOMENTUM_OFFSET_SPEED,
      );
      lastMomentumDirectionRef.current = Math.sign(measuredVelocity) || 1;
      const currentVelocity = velocityRef.current;
      const reversing =
        Math.sign(measuredVelocity) !== Math.sign(currentVelocity) &&
        Math.abs(currentVelocity) > STOPPED_SPEED_EPSILON;
      const blend = frameLerpAmount(
        reversing ? INPUT_REVERSAL_BLEND : INPUT_VELOCITY_BLEND,
        frameDelta,
      );
      velocityRef.current =
        currentVelocity + (measuredVelocity - currentVelocity) * blend;
    } else if (userHoldingStillRef.current || autoScrollPaused) {
      velocityRef.current = 0;
    } else if (hasUserInteractedRef.current) {
      velocityRef.current = decayTowardCruise(
        velocityRef.current,
        lastMomentumDirectionRef.current,
        frameDelta,
      );
      if (Math.abs(velocityRef.current) < STOPPED_SPEED_EPSILON) {
        velocityRef.current =
          lastMomentumDirectionRef.current * AUTO_CRUISE_OFFSET_SPEED;
      }
    } else {
      const epochMs = usePortfolioStore.getState().introEpochMs;
      if (epochMs !== null) {
        autoElapsedRef.current = (performance.now() - epochMs) / 1000;
      } else {
        autoElapsedRef.current += frameDelta;
      }
      velocityRef.current = getAutoOffsetSpeed(autoElapsedRef.current);
    }

    lastOffsetRef.current = o;

    const currentDisplay = displayUnboundedOffsetRef.current;
    const displayStep = clampStep(
      velocityRef.current * frameDelta,
      MAX_MOMENTUM_OFFSET_SPEED * frameDelta,
    );
    displayUnboundedOffsetRef.current = currentDisplay + displayStep;
    target.current = displayUnboundedOffsetRef.current;

    const index = displayUnboundedOffsetRef.current * CLIMB_SCALE;
    const displayDelta = Math.abs(index - lastDisplayIndexRef.current);
    if (displayDelta > maxDisplayIndexDeltaRef.current) {
      maxDisplayIndexDeltaRef.current = displayDelta;
    }
    lastDisplayIndexRef.current = index;
    virtualIndexRef.current = index;

    if (typeof window !== "undefined") {
      window.__scrollDebug = {
        offset: o,
        displayUnbounded: displayUnboundedOffsetRef.current,
        velocity: velocityRef.current,
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
