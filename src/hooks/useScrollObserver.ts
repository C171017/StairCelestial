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
  /** True while pointer/touch is down or wheel/trackpad scroll has not settled. */
  scrollInteractionActiveRef: MutableRefObject<boolean>;
};

/**
 * GSAP Observer on the portfolio scroll surface — unified wheel/touch/pointer
 * deltas accumulated for useVirtualScrollIndex to apply each frame.
 */
export function useScrollObserver(): ScrollObserverRefs {
  const pendingOffsetDeltaRef = useRef(0);
  const scrollInteractionActiveRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const wheelActiveRef = useRef(false);

  useEffect(() => {
    const target = document.getElementById(PORTFOLIO_SCROLL_SURFACE_ID);
    if (!target) return;

    const syncInteractionActive = () => {
      scrollInteractionActiveRef.current =
        pointerActiveRef.current || wheelActiveRef.current;
    };

    const observer = Observer.create({
      target,
      type: "wheel,touch,pointer",
      preventDefault: true,
      allowClicks: true,
      tolerance: 8,
      dragMinimum: 4,
      onPress: () => {
        pointerActiveRef.current = true;
        syncInteractionActive();
      },
      onRelease: () => {
        pointerActiveRef.current = false;
        syncInteractionActive();
      },
      onWheel: () => {
        wheelActiveRef.current = true;
        syncInteractionActive();
      },
      onStop: () => {
        wheelActiveRef.current = false;
        syncInteractionActive();
      },
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
      pointerActiveRef.current = false;
      wheelActiveRef.current = false;
      scrollInteractionActiveRef.current = false;
    };
  }, []);

  return { pendingOffsetDeltaRef, scrollInteractionActiveRef };
}
