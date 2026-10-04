import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { bindNativeRibbonScroll } from "./nativeRibbonScroll";

function browser(t: TestContext, { mobile = true, scale = 1, scrollY = 0, hasViewport = true } = {}) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const classes = new Set<string>();
  const properties = new Map<string, string>();
  const writes: string[] = [];
  const scrolls: ScrollToOptions[] = [];
  let boundsReads = 0;
  const query = Object.assign(new EventTarget(), { matches: mobile });
  const viewport = Object.assign(new EventTarget(), { scale });
  const root = {
    style: {
      setProperty(name: string, value: string) { properties.set(name, value); writes.push(value); },
      removeProperty(name: string) { properties.delete(name); },
      getPropertyValue(name: string) { return properties.get(name) ?? ""; },
    },
    clientHeight: 664,
    get scrollHeight() { boundsReads++; return classes.has("native-ribbon-scroll") ? 2000 : 664; },
    classList: {
      toggle(name: string, enabled: boolean) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(name: string) { classes.delete(name); },
    },
  };
  const win = Object.assign(new EventTarget(), {
    scrollY,
    visualViewport: hasViewport ? viewport : undefined,
    matchMedia: () => query,
    scrollTo(options: ScrollToOptions) { scrolls.push(options); this.scrollY = options.top ?? 0; },
  });
  const history = { scrollRestoration: "auto" };
  const restore: (() => void)[] = [];
  for (const [name, value] of Object.entries({ window: win, document: { documentElement: root }, history })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    restore.push(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const binding = bindNativeRibbonScroll();
  t.after(() => { binding.dispose(); restore.forEach(reset => reset()); });
  const scroll = (y: number) => { win.scrollY = y; win.dispatchEvent(new Event("scroll")); };
  return { win, root, history, query, viewport, binding, classes, scroll, scrolls, writes, get boundsReads() { return boundsReads; } };
}

test("mobile overflow is centered and pinned once when activated", t => {
  const b = browser(t);
  assert.equal(b.binding.active, true);
  assert.equal(b.history.scrollRestoration, "manual");
  assert.equal(b.win.scrollY, 668);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "668px");
  assert.deepEqual(b.scrolls, [{ top: 668, behavior: "instant" }]);
  b.query.dispatchEvent(new Event("change"));
  b.scroll(668);
  assert.equal(b.scrolls.length, 1);
  assert.equal(b.writes.length, 1, "unchanged coordinates need no style update");
});

test("external scrolls pin the raw paint coordinate without bounds reads or recentering", t => {
  const b = browser(t);
  const initialReads = b.boundsReads;
  b.scroll(0);
  b.scroll(-90);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "-90px");
  b.scroll(1335.5);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "1335.5px");
  t.mock.timers.tick(10000);
  assert.equal(b.win.scrollY, 1335.5);
  assert.equal(b.scrolls.length, 1, "no settle timer moves the document after external scrolling");
  assert.equal(b.boundsReads, initialReads, "pin updates do not measure a layout they just changed");
});

test("pinch zoom leaves the artwork stationary while the native viewport pans", t => {
  const b = browser(t);
  b.viewport.scale = 2;
  b.viewport.dispatchEvent(new Event("resize"));
  assert.equal(b.classes.has("native-ribbon-zoomed"), true);
  b.scroll(700.25);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "668px");
  b.root.clientHeight = 420;
  b.win.scrollY = 680;
  b.win.dispatchEvent(new Event("resize"));
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "668px");
  assert.equal(b.viewport.scale, 2);
  assert.equal(b.win.scrollY, 680);
  assert.equal(b.scrolls.length, 1);

  b.viewport.scale = 1;
  b.viewport.dispatchEvent(new Event("resize"));
  assert.equal(b.classes.has("native-ribbon-zoomed"), false);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "680px");
  assert.equal(b.win.scrollY, 680);
  assert.equal(b.scrolls.length, 1);
});

test("activating while already zoomed preserves the browser position and zoom", t => {
  const b = browser(t, { scale: 2, scrollY: 137.5 });
  assert.equal(b.classes.has("native-ribbon-zoomed"), true);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "137.5px");
  assert.equal(b.scrolls.length, 0);
  assert.equal(b.boundsReads, 0);
  assert.equal(b.viewport.scale, 2);
  b.scroll(200);
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "137.5px");
  b.viewport.scale = 1;
  b.viewport.dispatchEvent(new Event("resize"));
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "200px");
  assert.equal(b.scrolls.length, 0, "ending zoom resumes pinning without recentering");
});

test("resizing without VisualViewport updates paint without recentering", t => {
  const b = browser(t, { hasViewport: false });
  b.root.clientHeight = 420;
  b.win.scrollY = 680;
  b.win.dispatchEvent(new Event("resize"));
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "680px");
  assert.equal(b.win.scrollY, 680);
  assert.equal(b.scrolls.length, 1);
});

test("rotation recenters once after its transition, while ordinary resizing never does", t => {
  const b = browser(t);
  b.scroll(0);
  b.win.dispatchEvent(new Event("orientationchange"));
  b.root.clientHeight = 420;
  b.win.dispatchEvent(new Event("resize"));
  t.mock.timers.tick(200);
  b.win.dispatchEvent(new Event("orientationchange"));
  t.mock.timers.tick(349);
  assert.equal(b.scrolls.length, 1, "wait for the final rotation event to settle");
  t.mock.timers.tick(1);
  assert.equal(b.scrolls.length, 2);
  assert.deepEqual(b.scrolls[1], { top: 790, behavior: "instant" });
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "790px");
  b.win.dispatchEvent(new Event("resize"));
  t.mock.timers.tick(1000);
  assert.equal(b.scrolls.length, 2);
});

test("rotation preserves existing zoom and zoom begun during the transition", t => {
  const b = browser(t);
  b.win.dispatchEvent(new Event("orientationchange"));
  b.viewport.scale = 2;
  b.viewport.dispatchEvent(new Event("resize"));
  t.mock.timers.tick(350);
  assert.equal(b.scrolls.length, 1, "a newly started pinch cancels the pending recenter");
  b.win.dispatchEvent(new Event("orientationchange"));
  t.mock.timers.tick(1000);
  assert.equal(b.scrolls.length, 1, "rotation while zoomed leaves native panning intact");
  assert.equal(b.viewport.scale, 2);
});

test("leaving mobile cancels the pending rotation even if mobile mode returns", t => {
  const b = browser(t);
  b.win.dispatchEvent(new Event("orientationchange"));
  b.query.matches = false;
  b.query.dispatchEvent(new Event("change"));
  b.query.matches = true;
  b.query.dispatchEvent(new Event("change"));
  assert.equal(b.scrolls.length, 2, "returning to mobile establishes its initial position");
  t.mock.timers.tick(1000);
  assert.equal(b.scrolls.length, 2);
});

test("desktop stays untouched and leaving mobile restores document settings", t => {
  const b = browser(t, { mobile: false });
  assert.equal(b.binding.active, false);
  assert.equal(b.classes.size, 0);
  assert.equal(b.history.scrollRestoration, "auto");
  b.scroll(100);
  b.win.dispatchEvent(new Event("resize"));
  b.win.dispatchEvent(new Event("orientationchange"));
  t.mock.timers.tick(1000);
  assert.equal(b.scrolls.length, 0);
  assert.equal(b.writes.length, 0);
  b.query.matches = true;
  b.query.dispatchEvent(new Event("change"));
  assert.equal(b.binding.active, true);
  b.viewport.scale = 2;
  b.viewport.dispatchEvent(new Event("resize"));
  assert.equal(b.classes.has("native-ribbon-zoomed"), true);
  b.query.matches = false;
  b.query.dispatchEvent(new Event("change"));
  b.scroll(200);
  assert.equal(b.binding.active, false);
  assert.equal(b.classes.size, 0);
  assert.equal(b.history.scrollRestoration, "auto");
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "");
});

test("disposal removes pinning and media listeners", t => {
  const b = browser(t);
  b.win.dispatchEvent(new Event("orientationchange"));
  b.viewport.scale = 2;
  b.viewport.dispatchEvent(new Event("resize"));
  b.binding.dispose();
  const writes = b.writes.length;
  b.scroll(200);
  b.win.dispatchEvent(new Event("resize"));
  b.win.dispatchEvent(new Event("orientationchange"));
  b.viewport.scale = 1;
  b.viewport.dispatchEvent(new Event("resize"));
  b.query.matches = false;
  b.query.dispatchEvent(new Event("change"));
  b.query.matches = true;
  b.query.dispatchEvent(new Event("change"));
  t.mock.timers.tick(1000);
  assert.equal(b.binding.active, false);
  assert.equal(b.writes.length, writes);
  assert.equal(b.scrolls.length, 1);
  assert.equal(b.classes.size, 0);
  assert.equal(b.history.scrollRestoration, "auto");
  assert.equal(b.root.style.getPropertyValue("--ribbon-scroll-position"), "");
});
