import test from "node:test";
import assert from "node:assert/strict";
import { createIntroEyeReadiness } from "./introEyeReadiness";

test("the eye can blink before readiness and opens once its current blink ends", () => {
  let openings = 0;
  const eye = createIntroEyeReadiness(() => openings++);
  assert.equal(eye.beginBlink(), true);
  eye.finishBlink();
  assert.equal(openings, 0);
  assert.equal(eye.beginBlink(), true);
  eye.setReady(true);
  assert.equal(openings, 0);
  eye.finishBlink();
  assert.equal(openings, 1);
  eye.setReady(true);
  eye.finishBlink();
  assert.equal(openings, 1);
  assert.equal(eye.beginBlink(), false);
});

test("fast readiness and readiness during the idle pause add no blink delay", () => {
  for (const afterBlink of [false, true]) {
    let openings = 0;
    const eye = createIntroEyeReadiness(() => openings++);
    if (afterBlink) {
      eye.beginBlink();
      eye.finishBlink();
    }
    eye.setReady(true);
    assert.equal(openings, 1);
    assert.equal(eye.beginBlink(), false);
  }
});

test("withdrawn readiness and callbacks from an unmounted gate cannot open it", () => {
  let openings = 0;
  const eye = createIntroEyeReadiness(() => openings++);
  eye.beginBlink();
  eye.setReady(true);
  eye.setReady(false);
  eye.finishBlink();
  assert.equal(openings, 0);
  eye.beginBlink();
  eye.dispose();
  eye.setReady(true);
  eye.finishBlink();
  assert.equal(openings, 0);
  assert.equal(eye.beginBlink(), false);
});
