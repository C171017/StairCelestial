"use client";

import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import { SCROLL_START_OFFSET } from "@/lib/spiral";

type CenteredScrollRefs = {
  targetUnboundedOffsetRef: MutableRefObject<number>;
  displayUnboundedOffsetRef: MutableRefObject<number>;
  lastOffsetRef: MutableRefObject<number>;
};

/**
 * Centers the Drei scroll container and syncs integration refs so climb works
 * both directions from the first frame. Seeds `lastOffsetRef` from damped
 * `scroll.offset` after layout so it matches Drei, not the idealized 0.5 seed.
 */
export function useCenteredScrollInit(refs: CenteredScrollRefs) {
  const scroll = useScroll();
  const doneRef = useRef(false);
  const userInteractedRef = useRef(false);
  const centerUntilRef = useRef<number | null>(null);

  const applyCenter = () => {
    const el = scroll.el;
    if (!el) return false;

    const threshold = el.scrollHeight - el.clientHeight;
    if (threshold <= 1) return false;

    const top = threshold / 2;
    el.scrollTop = top;
    el.dispatchEvent(new Event("scroll"));

    refs.targetUnboundedOffsetRef.current = SCROLL_START_OFFSET;
    refs.displayUnboundedOffsetRef.current = SCROLL_START_OFFSET;
    refs.lastOffsetRef.current = scroll.offset;
    return true;
  };

  useFrame((state) => {
    if (doneRef.current || userInteractedRef.current) return;
    if (!applyCenter()) return;

    if (centerUntilRef.current === null) {
      centerUntilRef.current = state.clock.elapsedTime + 3;
    }
    if (state.clock.elapsedTime >= centerUntilRef.current) {
      doneRef.current = true;
    }
  });

  useEffect(() => {
    if (doneRef.current) return;
    const el = scroll.el;
    if (!el) return;

    let cancelled = false;
    let userInteracted = false;
    const originalScrollRestoration = window.history.scrollRestoration;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const markUserInteracted = () => {
      userInteracted = true;
      userInteractedRef.current = true;
    };
    el.addEventListener("wheel", markUserInteracted, { passive: true });
    el.addEventListener("touchstart", markUserInteracted, { passive: true });
    el.addEventListener("pointerdown", markUserInteracted, { passive: true });
    window.addEventListener("keydown", markUserInteracted);

    const tryCenter = () => {
      if (cancelled || doneRef.current) return;
      if (!applyCenter()) {
        requestAnimationFrame(tryCenter);
        return;
      }

      // Some browsers restore nested scroll positions after the first paint.
      // Re-apply briefly so the infinite scroll starts from the middle runway.
      [50, 150, 300, 600, 1000, 1600, 2400].forEach((delay) => {
        window.setTimeout(() => {
          if (!cancelled && !userInteracted) applyCenter();
        }, delay);
      });
    };

    tryCenter();
    return () => {
      cancelled = true;
      el.removeEventListener("wheel", markUserInteracted);
      el.removeEventListener("touchstart", markUserInteracted);
      el.removeEventListener("pointerdown", markUserInteracted);
      window.removeEventListener("keydown", markUserInteracted);
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = originalScrollRestoration;
      }
    };
    // refs are stable MutableRefObjects; only scroll.el mount matters
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per scroll container
  }, [scroll]);
}
