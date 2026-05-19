"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { LOOP_LENGTH } from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

/** Virtual stair steps gained per one full scroll offset range (0→1). */
export const CLIMB_SCALE = LOOP_LENGTH;

/** Max virtual-index change per frame (safety net against wrap glitches). */
const MAX_INDEX_DELTA_PER_FRAME = 2.5;

/**
 * Integrates Drei scroll.offset into an unbounded virtual stair index.
 * Uses wrap-aware diff so infinite scroll resets do not spike delta.
 */
export function useVirtualScrollIndex() {
  const scroll = useScroll();
  const virtualIndexRef = useRef(0);
  const lastOffsetRef = useRef(0);
  const unboundedOffsetRef = useRef(0);

  useFrame(() => {
    const o = scroll.offset;
    const last = lastOffsetRef.current;
    const diff = o - last;

    if (diff < -0.5) {
      // Crossed 1 → 0 (Drei infinite wrap while scrolling up the scene)
      unboundedOffsetRef.current += 1 - last + o;
    } else if (diff > 0.5) {
      // Crossed 0 → 1 (scrolling down)
      unboundedOffsetRef.current += -last + o;
    } else {
      unboundedOffsetRef.current += diff;
    }

    lastOffsetRef.current = o;

    const targetIndex = Math.max(
      0,
      unboundedOffsetRef.current * CLIMB_SCALE,
    );
    const prevIndex = virtualIndexRef.current;
    const maxDelta = MAX_INDEX_DELTA_PER_FRAME;
    if (targetIndex > prevIndex + maxDelta) {
      virtualIndexRef.current = prevIndex + maxDelta;
    } else if (targetIndex < prevIndex - maxDelta) {
      virtualIndexRef.current = Math.max(0, prevIndex - maxDelta);
    } else {
      virtualIndexRef.current = targetIndex;
    }

    const index = virtualIndexRef.current;
    usePortfolioStore.getState().setVirtualStairIndex(index);

    const normalized =
      ((index % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH / LOOP_LENGTH;
    usePortfolioStore.getState().setScrollProgress(normalized);
  });

  return virtualIndexRef;
}
