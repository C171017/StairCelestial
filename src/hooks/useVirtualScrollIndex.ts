"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { LOOP_LENGTH } from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

/** Scroll delta → virtual stair index (unbounded upward climb). */
export const SCROLL_SENSITIVITY = 42;

const WRAP_HIGH = 0.85;
const WRAP_LOW = 0.15;
const WRAP_TARGET = 0.5;

/**
 * Accumulates scroll delta into an unbounded virtual stair index and wraps the
 * HTML scroll container so the user never hits a hard end.
 */
export function useVirtualScrollIndex() {
  const scroll = useScroll();
  const virtualIndexRef = useRef(0);

  useFrame(() => {
    const delta = scroll.delta;
    if (delta !== 0) {
      virtualIndexRef.current += delta * SCROLL_SENSITIVITY;
      virtualIndexRef.current = Math.max(0, virtualIndexRef.current);
    }

    const el = scroll.el;
    if (el) {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0) {
        const offset = scroll.offset;
        if (offset > WRAP_HIGH) {
          const targetTop = WRAP_TARGET * maxScroll;
          el.scrollTop = targetTop;
        } else if (offset < WRAP_LOW && virtualIndexRef.current > 0.5) {
          const targetTop = WRAP_TARGET * maxScroll;
          el.scrollTop = targetTop;
        }
      }
    }

    const index = virtualIndexRef.current;
    usePortfolioStore.getState().setVirtualStairIndex(index);

    const normalized =
      ((index % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH / LOOP_LENGTH;
    usePortfolioStore.getState().setScrollProgress(normalized);
  });

  return virtualIndexRef;
}
