"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { SCROLL_FOCUS_RELEASE_THRESHOLD } from "@/lib/doorCameraFocus";
import { LOOP_LENGTH } from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

/** Virtual stair steps gained per one full scroll offset range (0→1). */
export const CLIMB_SCALE = LOOP_LENGTH;

/** Max normal scroll progress change per frame (non-wrap). */
const MAX_DIFF_PER_FRAME = 0.1;

const WRAP_TOP_ENTER = 0.85;
const WRAP_TOP_EXIT = 0.15;
const WRAP_BOTTOM_ENTER = 0.15;
const WRAP_BOTTOM_EXIT = 0.85;
/** Drei damp can overshoot past 1.0 — not a real lap boundary. */
const OFFSET_MAX = 1.02;

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Only treats true 1→0 / 0→1 boundary crosses as wraps (not offset>1 overshoot).
 */
export function useVirtualScrollIndex() {
  const scroll = useScroll();
  const virtualIndexRef = useRef(0);
  const lastOffsetRef = useRef(0);
  const unboundedOffsetRef = useRef(0);
  const armedTopWrapRef = useRef(false);
  const armedBottomWrapRef = useRef(false);

  useFrame(() => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const diff = o - last;

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

    if (crossedTop) {
      unboundedOffsetRef.current += 1 - last + o;
      armedTopWrapRef.current = false;
    } else if (crossedBottom) {
      unboundedOffsetRef.current += -last + o;
      armedBottomWrapRef.current = false;
    } else if (Math.abs(diff) <= 0.15) {
      const capped = Math.max(
        -MAX_DIFF_PER_FRAME,
        Math.min(MAX_DIFF_PER_FRAME, diff),
      );
      unboundedOffsetRef.current += capped;
    }

    if (unboundedOffsetRef.current < 0) {
      unboundedOffsetRef.current = 0;
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
