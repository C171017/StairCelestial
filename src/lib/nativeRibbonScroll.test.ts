import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { bindNativeRibbonScroll } from "./nativeRibbonScroll";

function browser(t: TestContext, mobile = true) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const classes = new Set<string>();
  const query = Object.assign(new EventTarget(), { matches: mobile });
  const root = {
    clientHeight: 664,
    get scrollHeight() { return classes.has("native-ribbon-scroll") ? 200000 : 664; },
    classList: {
      toggle(name: string, enabled: boolean) { if (enabled) classes.add(name); else classes.delete(name); },
      remove(name: string) { classes.delete(name); },
    },
  };
  const win = Object.assign(new EventTarget(), {
    scrollY: 0,
    visualViewport: { scale: 1 },
    matchMedia: () => query,
    scrollTo({ top = 0 }: ScrollToOptions) { this.scrollY = top; },
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
  let touching = false;
  const input: number[] = [];
  const binding = bindNativeRibbonScroll(pixels => input.push(pixels), () => touching);
  t.after(() => { binding.dispose(); restore.forEach(reset => reset()); });
  const scroll = (y: number) => { win.scrollY = y; win.dispatchEvent(new Event("scroll")); };
  return { win, root, history, query, binding, input, classes, scroll, setTouching: (value: boolean) => { touching = value; } };
}

test("native swipes and momentum drive the ribbon once, with no initialization jump", t => {
  const b = browser(t);
  assert.equal(b.binding.active, true);
  assert.equal(b.history.scrollRestoration, "manual");
  const center = b.win.scrollY;
  b.scroll(center);
  assert.deepEqual(b.input, []);
  b.scroll(center + 100);
  b.scroll(center + 140);
  b.scroll(center + 120);
  assert.deepEqual(b.input, [180, 72, -36]);
});

test("Safari rubber-band bounce does not feed reversed movement into the ribbon", t => {
  const b = browser(t);
  b.scroll(0);
  b.input.length = 0;
  b.scroll(-90);
  b.scroll(-20);
  b.scroll(0);
  assert.deepEqual(b.input, []);
  b.scroll(b.root.scrollHeight - b.root.clientHeight);
  b.input.length = 0;
  b.scroll(b.win.scrollY + 70);
  b.scroll(b.root.scrollHeight - b.root.clientHeight);
  assert.deepEqual(b.input, []);
});

test("the infinite runway recenters after momentum settles without adding ribbon movement", t => {
  const b = browser(t);
  b.setTouching(true);
  b.scroll(100);
  b.input.length = 0;
  t.mock.timers.tick(200);
  assert.equal(b.win.scrollY, 100, "never move the document under a held finger");
  b.setTouching(false);
  t.mock.timers.tick(200);
  assert.equal(b.win.scrollY, 99668);
  b.scroll(b.win.scrollY);
  assert.deepEqual(b.input, []);
  b.scroll(b.win.scrollY - 20);
  assert.deepEqual(b.input, [-36]);
});

test("pinch zoom and viewport resizing do not navigate the ribbon", t => {
  const b = browser(t);
  b.win.visualViewport.scale = 2;
  b.scroll(b.win.scrollY + 100);
  b.win.visualViewport.scale = 1;
  b.win.scrollY += 50;
  b.win.dispatchEvent(new Event("resize"));
  b.scroll(b.win.scrollY);
  assert.deepEqual(b.input, []);
  b.scroll(b.win.scrollY + 10);
  assert.deepEqual(b.input, [18]);
});

test("desktop stays virtual and leaving mobile restores document settings and listeners", t => {
  const b = browser(t, false);
  assert.equal(b.binding.active, false);
  assert.equal(b.classes.size, 0);
  assert.equal(b.history.scrollRestoration, "auto");
  b.query.matches = true;
  b.query.dispatchEvent(new Event("change"));
  assert.equal(b.binding.active, true);
  b.scroll(100);
  b.input.length = 0;
  b.binding.dispose();
  t.mock.timers.tick(500);
  b.scroll(200);
  assert.deepEqual(b.input, []);
  assert.equal(b.classes.size, 0);
  assert.equal(b.history.scrollRestoration, "auto");
});
