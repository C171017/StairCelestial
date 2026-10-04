/** Keep native document scrolling available to mobile browser toolbars. */
export const MOBILE_SCROLL_QUERY = "(hover: none) and (pointer: coarse)";

export function bindNativeRibbonScroll(
  navigate: (pixels: number) => void,
  isTouching: () => boolean,
) {
  const query = window.matchMedia(MOBILE_SCROLL_QUERY);
  const root = document.documentElement;
  let active = false;
  let previousY = 0;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  const restoration = history.scrollRestoration;

  const maxScroll = () => Math.max(0, root.scrollHeight - root.clientHeight);
  // Safari's rubber-band overscroll must not become reversed ribbon input.
  const scrollY = () => Math.max(0, Math.min(window.scrollY, maxScroll()));
  const clearSettle = () => {
    if (settleTimer !== null) clearTimeout(settleTimer);
    settleTimer = null;
  };
  const center = () => {
    // Rebase only the document coordinate, never the virtual ribbon position.
    previousY = Math.floor(maxScroll() / 2);
    window.scrollTo({ top: previousY, behavior: "instant" });
    root.style.setProperty("--ribbon-scroll-position", `${previousY}px`);
  };
  const settle = () => {
    settleTimer = null;
    if (!active) return;
    if (isTouching()) {
      settleTimer = setTimeout(settle, 200);
      return;
    }
    const y = scrollY();
    // A long runway avoids resetting native momentum on ordinary swipes.
    if (y < 4000 || y > maxScroll() - 4000) center();
  };
  const onScroll = () => {
    if (!active) return;
    const y = scrollY();
    const delta = y - previousY;
    previousY = y;
    // Pinch-zoom pans the visual viewport, not the ribbon.
    if (window.visualViewport && window.visualViewport.scale > 1.01) return;
    if (Math.abs(delta) < 0.1) return;
    navigate(delta * 1.8);
    clearSettle();
    settleTimer = setTimeout(settle, 200);
  };
  const onResize = () => { previousY = scrollY(); };
  const update = () => {
    clearSettle();
    active = query.matches;
    root.classList.toggle("native-ribbon-scroll", active);
    history.scrollRestoration = active ? "manual" : restoration;
    if (active) center();
    else {
      previousY = scrollY();
      root.style.removeProperty("--ribbon-scroll-position");
    }
  };

  update();
  query.addEventListener("change", update);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  return {
    get active() { return active; },
    dispose() {
      clearSettle();
      query.removeEventListener("change", update);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      root.classList.remove("native-ribbon-scroll");
      root.style.removeProperty("--ribbon-scroll-position");
      history.scrollRestoration = restoration;
    },
  };
}
