"use client";

import { useScroll } from "@react-three/drei";
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

  useEffect(() => {
    if (doneRef.current) return;
    const el = scroll.el;
    if (!el) return;

    let cancelled = false;

    const applyCenter = () => {
      const threshold = el.scrollHeight - el.clientHeight;
      if (threshold <= 1) return false;

      const top = threshold / 2;
      el.scrollTop = top;
      el.dispatchEvent(new Event("scroll"));

      refs.targetUnboundedOffsetRef.current = SCROLL_START_OFFSET;
      refs.displayUnboundedOffsetRef.current = SCROLL_START_OFFSET;

      const syncLastFromDrei = () => {
        if (cancelled) return;
        refs.lastOffsetRef.current = scroll.offset;
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(syncLastFromDrei);
      });

      doneRef.current = true;
      return true;
    };

    const tryCenter = () => {
      if (cancelled || doneRef.current) return;
      if (!applyCenter()) requestAnimationFrame(tryCenter);
    };

    tryCenter();
    return () => {
      cancelled = true;
    };
    // refs are stable MutableRefObjects; only scroll.el mount matters
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per scroll container
  }, [scroll]);
}
