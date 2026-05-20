"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useCenteredScrollInit } from "@/hooks/useCenteredScrollInit";
import { SCROLL_FOCUS_RELEASE_THRESHOLD } from "@/lib/doorCameraFocus";
import {
  CLIMB_SCALE,
  LOOP_LENGTH,
  SCROLL_START_OFFSET,
} from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

export { CLIMB_SCALE };

/** Max tracker step per frame on normal integration (non-wrap). */
const MAX_TRACKER_STEP = 0.06;

/** Max display offset step per frame — what camera/geometry consume. */
const MAX_DISPLAY_STEP = 0.04;

const WRAP_TOP_ENTER = 0.85;
const WRAP_TOP_EXIT = 0.15;
const WRAP_BOTTOM_ENTER = 0.15;
const WRAP_BOTTOM_EXIT = 0.85;
/** Drei damp can overshoot past 1.0 — not a real lap boundary. */
const OFFSET_MAX = 1.02;

/** Min |Δoffset| to treat as Drei infinite teleport (not fast damp). */
const RESET_DISCONTINUITY = 0.45;

/** Explicit Drei infinite-reset signatures (offset discontinuity). */
const DREI_RESET_HIGH_LAST = 0.7;
const DREI_RESET_LOW_OFFSET = 0.25;
const DREI_RESET_LOW_LAST = 0.3;
const DREI_RESET_HIGH_OFFSET = 0.75;

/** Wheel down → descend the spiral (negative virtual index). */
const SCROLL_CLIMB_SIGN = -1;

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

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Tracker keeps lap accounting; display layer is always capped for steady motion.
 */
export function useVirtualScrollIndex() {
  const scroll = useScroll();
  const virtualIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);
  const lastOffsetRef = useRef(SCROLL_START_OFFSET);
  const targetUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const displayUnboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const armedTopWrapRef = useRef(false);
  const armedBottomWrapRef = useRef(false);
  const maxDisplayIndexDeltaRef = useRef(0);
  const lastDisplayIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);

  const scrollRefs = {
    targetUnboundedOffsetRef,
    displayUnboundedOffsetRef,
    lastOffsetRef,
    armedTopWrapRef,
    armedBottomWrapRef,
  };

  useCenteredScrollInit(scrollRefs);

  useFrame(() => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const diff = SCROLL_CLIMB_SIGN * (o - last);
    const offsetJump = Math.abs(o - last);

    if (o > WRAP_TOP_ENTER && o <= OFFSET_MAX) {
      armedTopWrapRef.current = true;
    }
    if (o > OFFSET_MAX) {
      armedBottomWrapRef.current = false;
      armedTopWrapRef.current = true;
    }
    if (o < WRAP_BOTTOM_ENTER) {
      armedBottomWrapRef.current = true;
    }

    const crossedTop =
      armedTopWrapRef.current &&
      last > WRAP_TOP_EXIT &&
      last <= OFFSET_MAX &&
      o < WRAP_TOP_EXIT;

    const crossedBottom =
      armedBottomWrapRef.current &&
      last < WRAP_BOTTOM_ENTER &&
      o > WRAP_BOTTOM_EXIT &&
      o <= OFFSET_MAX;

    const dreiForwardReset =
      offsetJump > RESET_DISCONTINUITY &&
      last > DREI_RESET_HIGH_LAST &&
      o < DREI_RESET_LOW_OFFSET;
    const dreiBackwardReset =
      offsetJump > RESET_DISCONTINUITY &&
      last < DREI_RESET_LOW_LAST &&
      o > DREI_RESET_HIGH_OFFSET;

    const target = targetUnboundedOffsetRef;

    if (crossedTop || dreiForwardReset) {
      target.current += SCROLL_CLIMB_SIGN * (1 - last + o);
      armedTopWrapRef.current = false;
    } else if (crossedBottom || dreiBackwardReset) {
      target.current += SCROLL_CLIMB_SIGN * (-last + o);
      armedBottomWrapRef.current = false;
    } else {
      const capped = clampStep(diff, MAX_TRACKER_STEP);
      target.current += capped;
    }

    lastOffsetRef.current = o;

    const displayStep = clampStep(
      target.current - displayUnboundedOffsetRef.current,
      MAX_DISPLAY_STEP,
    );
    displayUnboundedOffsetRef.current += displayStep;

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

    const store = usePortfolioStore.getState();
    const { focusedDoorId, focusScrollAnchor, resetDoors } = store;
    if (
      focusedDoorId !== null &&
      focusScrollAnchor !== null &&
      Math.abs(index - focusScrollAnchor) > SCROLL_FOCUS_RELEASE_THRESHOLD
    ) {
      resetDoors();
    }

    store.setVirtualStairIndex(index);

    const normalized =
      ((index % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH / LOOP_LENGTH;
    usePortfolioStore.getState().setScrollProgress(normalized);
  });

  return virtualIndexRef;
}
