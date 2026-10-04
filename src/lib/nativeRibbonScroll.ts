/** Keep the mobile artwork inside a small, stationary document overflow. */
export const MOBILE_SCROLL_QUERY = "(hover: none) and (pointer: coarse)";

export function bindNativeRibbonScroll() {
  const query = window.matchMedia(MOBILE_SCROLL_QUERY);
  const root = document.documentElement;
  const viewport = window.visualViewport;
  let active = false;
  let zoomed = false;
  let paintedY: number | null = null;
  let orientationTimer: ReturnType<typeof setTimeout> | null = null;
  const restoration = history.scrollRestoration;

  const pin = (y: number) => {
    if (paintedY === y) return;
    paintedY = y;
    root.style.setProperty("--ribbon-scroll-position", `${y}px`);
  };
  const syncZoom = () => {
    const next = active && (viewport?.scale ?? 1) > 1.01;
    if (next === zoomed) return;
    zoomed = next;
    root.classList.toggle("native-ribbon-zoomed", zoomed);
  };
  const syncPosition = () => {
    if (!active) return;
    syncZoom();
    // Leave the artwork at its document coordinate while zoomed so native
    // one-finger panning can explore it. Resume pinning when zoom returns to 1.
    if (zoomed) return;
    // Native scrolling is exceptional (for example Safari's scroll-to-top).
    // Follow its actual paint coordinate without moving the document again or
    // treating browser movement, including zoom, as ribbon navigation.
    pin(window.scrollY);
  };
  const center = () => {
    const y = Math.floor(Math.max(0, root.scrollHeight - root.clientHeight) / 2);
    pin(y);
    window.scrollTo({ top: y, behavior: "instant" });
  };
  const clearOrientation = () => {
    if (orientationTimer !== null) clearTimeout(orientationTimer);
    orientationTimer = null;
  };
  const onOrientationChange = () => {
    clearOrientation();
    if (!active) return;
    syncZoom();
    if (zoomed) return;
    // Safari can reset the document to its edge during rotation. Restore the
    // overflow after that transition, never during ordinary toolbar resizing.
    orientationTimer = setTimeout(() => {
      orientationTimer = null;
      if (!active) return;
      syncZoom();
      if (!zoomed) center();
    }, 350);
  };
  const update = () => {
    if (active === query.matches) return;
    clearOrientation();
    active = query.matches;
    root.classList.toggle("native-ribbon-scroll", active);
    syncZoom();
    history.scrollRestoration = active ? "manual" : restoration;
    if (active) {
      if (zoomed) {
        // Mounting or switching input modes must not reset an existing zoom.
        pin(window.scrollY);
        return;
      }
      // Establish the document coordinate once. Touch/wheel navigation moves
      // the virtual ribbon, so neither gestures nor toolbar resizes rebase it.
      center();
    } else {
      paintedY = null;
      root.style.removeProperty("--ribbon-scroll-position");
    }
  };

  update();
  query.addEventListener("change", update);
  window.addEventListener("scroll", syncPosition, { passive: true });
  window.addEventListener("resize", syncPosition);
  window.addEventListener("orientationchange", onOrientationChange);
  viewport?.addEventListener("resize", syncPosition);
  return {
    get active() { return active; },
    dispose() {
      active = false;
      clearOrientation();
      query.removeEventListener("change", update);
      window.removeEventListener("scroll", syncPosition);
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("orientationchange", onOrientationChange);
      viewport?.removeEventListener("resize", syncPosition);
      root.classList.remove("native-ribbon-scroll");
      root.classList.remove("native-ribbon-zoomed");
      root.style.removeProperty("--ribbon-scroll-position");
      history.scrollRestoration = restoration;
    },
  };
}
