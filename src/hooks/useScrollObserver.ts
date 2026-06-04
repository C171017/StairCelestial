"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import {
  pixelsToOffsetDelta,
  PORTFOLIO_SCROLL_SURFACE_ID,
  SCROLL_INPUT_THRESHOLD,
} from "@/lib/scrollInput";
import { isPortfolioSceneInteractive, usePortfolioStore } from "@/lib/store";

gsap.registerPlugin(Observer);

export type ScrollObserverRefs = {
  pendingOffsetDeltaRef: MutableRefObject<number>;
};

/**
 * GSAP Observer on the portfolio scroll surface — unified wheel/touch/pointer
 * deltas accumulated for useVirtualScrollIndex to apply each frame.
 */
export function useScrollObserver(): ScrollObserverRefs {
  const pendingOffsetDeltaRef = useRef(0);

  useEffect(() => {
    const target = document.getElementById(PORTFOLIO_SCROLL_SURFACE_ID);
    if (!target) return;

    const observer = Observer.create({
      target,
      type: "wheel,touch,pointer",
      preventDefault: true,
      allowClicks: true,
      tolerance: 8,
      dragMinimum: 4,
      onChange: (self) => {
        const phase = usePortfolioStore.getState().introPlayPhase;
        if (!isPortfolioSceneInteractive(phase)) return;

        const delta = pixelsToOffsetDelta(self.deltaY);
        if (Math.abs(delta) < SCROLL_INPUT_THRESHOLD) return;

        pendingOffsetDeltaRef.current += delta;
      },
    });

    return () => {
      observer.kill();
    };
  }, []);

  return { pendingOffsetDeltaRef };
}
