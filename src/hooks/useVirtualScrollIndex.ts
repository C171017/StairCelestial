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

/** Max normal scroll progress change per frame (non-wrap). */
const MAX_DIFF_PER_FRAME = 0.1;

const WRAP_TOP_ENTER = 0.85;
const WRAP_TOP_EXIT = 0.15;
const WRAP_BOTTOM_ENTER = 0.15;
const WRAP_BOTTOM_EXIT = 0.85;
/** Drei damp can overshoot past 1.0 — not a real lap boundary. */
const OFFSET_MAX = 1.02;

/** Large offset jump — normal integration only below this. */
const LARGE_DIFF = 0.15;

/** Explicit Drei infinite-reset signatures (offset discontinuity). */
const DREI_RESET_HIGH_LAST = 0.7;
const DREI_RESET_LOW_OFFSET = 0.25;
const DREI_RESET_LOW_LAST = 0.3;
const DREI_RESET_HIGH_OFFSET = 0.75;

/** Wheel down → descend the spiral (negative virtual index). */
const SCROLL_CLIMB_SIGN = -1;

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Handles true 1→0 / 0→1 boundary crosses and Drei infinite DOM teleports.
 */
export function useVirtualScrollIndex() {
  const scroll = useScroll();
  const virtualIndexRef = useRef(SCROLL_START_OFFSET * CLIMB_SCALE);
  const lastOffsetRef = useRef(SCROLL_START_OFFSET);
  const unboundedOffsetRef = useRef(SCROLL_START_OFFSET);
  const armedTopWrapRef = useRef(false);
  const armedBottomWrapRef = useRef(false);

  const scrollRefs = {
    unboundedOffsetRef,
    lastOffsetRef,
    armedTopWrapRef,
    armedBottomWrapRef,
  };

  useCenteredScrollInit(scrollRefs);

  useFrame(() => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const diff = SCROLL_CLIMB_SIGN * (o - last);

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
      last > DREI_RESET_HIGH_LAST && o < DREI_RESET_LOW_OFFSET;
    const dreiBackwardReset =
      last < DREI_RESET_LOW_LAST && o > DREI_RESET_HIGH_OFFSET;
    const postResetOvershoot = o < 0 || o > OFFSET_MAX;

    if (crossedTop || dreiForwardReset) {
      unboundedOffsetRef.current += SCROLL_CLIMB_SIGN * (1 - last + o);
      armedTopWrapRef.current = false;
    } else if (crossedBottom || dreiBackwardReset) {
      unboundedOffsetRef.current += SCROLL_CLIMB_SIGN * (-last + o);
      armedBottomWrapRef.current = false;
    } else if (postResetOvershoot || Math.abs(diff) <= LARGE_DIFF) {
      const capped = Math.max(
        -MAX_DIFF_PER_FRAME,
        Math.min(MAX_DIFF_PER_FRAME, diff),
      );
      unboundedOffsetRef.current += capped;
    }

    lastOffsetRef.current = o;

    const index = unboundedOffsetRef.current * CLIMB_SCALE;
    virtualIndexRef.current = index;

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
