import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceSanctuaryAtmosphere, atmosphereTravelFromRibbon, ATMOSPHERE_CYCLE_TURNS, createSanctuaryAtmosphere, sampleSanctuaryAtmosphere } from "./sanctuaryAtmosphere";
import { addRibbonInput, advanceRibbonMotion, createRibbonMotion } from "./ribbonMotion";

const sample = (travel: number) => sampleSanctuaryAtmosphere(travel, createSanctuaryAtmosphere());
const lightness = (color: readonly number[]) => color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;

test("scrolling down advances pink sunset, night, golden sunrise; scrolling back reverses it", () => {
  const motion = createRibbonMotion();
  const scroll = (pixels: number) => {
    addRibbonInput(motion, pixels);
    for (let frame = 0; frame < 900; frame++) advanceRibbonMotion(motion, 1 / 120, { cruiseSpeed: 0 });
    return sample(atmosphereTravelFromRibbon(motion.userPosition));
  };
  for (const key of ["sunset", "night", "dawn", "daylight"] as const) {
    for (let gesture = 0; gesture < 3; gesture++) scroll(900);
    assert.equal(scroll(900)[key], 1, `downward scroll should reach ${key}`);
  }
  for (let gesture = 0; gesture < 3; gesture++) scroll(-900);
  assert.equal(scroll(-900).dawn, 1, "reversing from the next noon returns to golden sunrise");
});

test("the clock starts at pearl daylight, passes sunset and reaches readable indigo night", () => {
  const day = sample(0), sunset = sample(2), night = sample(4);
  assert.equal(day.daylight, 1);
  assert.equal(day.starVisibility, 0);
  assert.ok(sunset.dusk > 0.9);
  assert.equal(night.night, 1);
  assert.equal(night.starVisibility, 1);
  assert.ok(lightness(day.skyZenith) > lightness(sunset.skyZenith));
  assert.ok(lightness(sunset.skyZenith) > lightness(night.skyZenith));
  assert.ok(lightness(night.cloudHighlight) > lightness(night.cloudShadow) * 3);
  assert.ok(night.keyIntensity > 1 && night.environmentIntensity > 0.4);
  // The night key rotates behind the objects. Its front-facing sky fill must
  // retain enough energy for pale ceramic surfaces to separate from the sky.
  assert.ok(lightness(night.fillColor) * night.fillIntensity > 0.4);
  assert.ok(lightness(night.ambientColor) * night.ambientIntensity > 0.15);
});

test("every clock angle has bounded light, a normalized safe shadow direction and coherent blends", () => {
  for (let travel = -24; travel <= 24; travel += 0.01) {
    const mood = sample(travel);
    assert.ok(Math.abs(mood.daylight + mood.dusk + mood.night - 1) < 1e-12);
    assert.ok(mood.keyDirection[1] >= 0.30, `key too low at ${travel}`);
    assert.ok(Math.abs(Math.hypot(...mood.keyDirection) - 1) < 1e-12);
    for (const [key, value] of Object.entries(mood)) {
      if (Array.isArray(value) && !key.endsWith("Direction")) assert.ok(value.every(channel => channel >= 0 && channel <= 1), key);
      if (Array.isArray(value) && key.endsWith("Direction")) assert.ok(Math.abs(Math.hypot(...value) - 1) < 1e-12, key);
    }
  }
});

test("sunrise and sunset are distinct, with coherent moving celestial directions", () => {
  const dawn = sample(6), sunset = sample(2), night = sample(4), day = sample(0);
  assert.ok(dawn.dawn > .9 && dawn.sunset === 0);
  assert.ok(sunset.sunset > .9 && sunset.dawn === 0);
  assert.ok(dawn.cloudHighlight[1] > sunset.cloudHighlight[1]);
  assert.ok(sunset.cloudHighlight[2] > dawn.cloudHighlight[2]);
  assert.ok(dawn.sunDirection[0] < 0 && sunset.sunDirection[0] > 0);
  assert.ok(night.moonDirection[1] > 0 && night.moonVisibility === 1);
  assert.ok(day.sunVisibility < .02 && day.moonVisibility === 0);
  assert.equal(dawn.worldHour, 6); assert.equal(sunset.worldHour, 18);
});

test("meteors remain visible through sunset and the whole night, fading into sunrise", () => {
  assert.equal(sample(2).meteorVisibility, 0.78);
  assert.equal(sample(4).meteorVisibility, 1);
  assert.equal(sample(4.5).meteorVisibility, 1);
  assert.ok(sample(5).meteorVisibility > 0 && sample(5).meteorVisibility < 1);
  for (const t of [0, 0.5, 6, 7, -2]) assert.equal(sample(t).meteorVisibility, 0);
  for (const t of [1.5, 3, 4.9]) assert.ok(Math.abs(sample(t).meteorVisibility - sample(t+8).meteorVisibility) < 1e-12);
});

test("all four moods receive equal journey length with broad full-color cores", () => {
  const keys = ["daylight", "sunset", "night", "dawn"] as const;
  const integrals = [0, 0, 0, 0], dominant = [0, 0, 0, 0];
  const target = createSanctuaryAtmosphere();
  for (let i = 0; i < 8000; i++) {
    sampleSanctuaryAtmosphere((i + 0.5) / 1000, target);
    let winner = 0;
    keys.forEach((key, j) => {
      integrals[j] += target[key] / 1000;
      if (target[key] > target[keys[winner]]) winner = j;
    });
    dominant[winner]++;
  }
  for (let j = 0; j < keys.length; j++) {
    assert.ok(Math.abs(integrals[j] - 2) < 1e-8, `${keys[j]} must occupy one quarter of the cycle`);
    assert.equal(dominant[j], 2000);
    for (const offset of [-0.5, 0, 0.5]) assert.equal(sample(j * 2 + offset)[keys[j]], 1);
  }
});

test("full-color holds meet gradual blends without color or star visibility jumps", () => {
  for (let quarter = -4; quarter < 8; quarter++) for (const offset of [.56, 1, 1.44, 2]) {
    const boundary = quarter * 2 + offset;
    const a = sample(boundary - 1e-6), b = sample(boundary + 1e-6);
    for (const key of ["daylight", "dawn", "sunset", "night", "starVisibility", "meteorVisibility"] as const)
      assert.ok(Math.abs(a[key] - b[key]) < 1e-5, `${key} jumped at ${boundary}`);
  }
});

test("forward and reverse travel preserve the same mood without pool-boundary or day-boundary jumps", () => {
  for (const boundary of [-16, -8, -6, -4, -2, 0, 2, 4, 6, 8, 16]) {
    const before = sample(boundary - 1e-6), after = sample(boundary + 1e-6);
    for (const key of ["daylight", "dusk", "night", "starVisibility"] as const) assert.ok(Math.abs(before[key] - after[key]) < 1e-5);
    assert.ok(Math.hypot(...before.keyDirection.map((channel, i) => channel - after.keyDirection[i])) < 1e-5);
  }
  for (const travel of [-2.34, 0, 1.3, 2.7, 4, 7.9]) {
    const a = sample(travel), b = sample(travel + ATMOSPHERE_CYCLE_TURNS * 100);
    assert.ok(Math.abs(a.night - b.night) < 1e-10);
    assert.ok(Math.abs(a.solarPhase + Math.PI * 200 - b.solarPhase) < 1e-10);
    assert.ok(Math.hypot(...a.keyDirection.map((channel, i) => channel - b.keyDirection[i])) < 1e-10);
  }
});

test("idle cruise never advances the atmosphere; explicit input survives while geometry recycles", () => {
  const motion = createRibbonMotion();
  for (let frame = 0; frame < 6000; frame++) advanceRibbonMotion(motion, 1 / 60);
  assert.ok(motion.position < -2);
  assert.equal(motion.userPosition, 0);
  addRibbonInput(motion, -720);
  for (let frame = 0; frame < 1200; frame++) advanceRibbonMotion(motion, 1 / 120);
  assert.ok(Math.abs(motion.userPosition - 0.4) < 1e-5);
  addRibbonInput(motion, 720);
  for (let frame = 0; frame < 1200; frame++) advanceRibbonMotion(motion, 1 / 120);
  assert.ok(Math.abs(motion.userPosition) < 1e-5);
});

test("atmosphere easing is frame-rate independent, reversible, and bounded after suspension", () => {
  const simulate = (fps: number) => {
    const mood = createSanctuaryAtmosphere();
    for (let frame = 0; frame < fps; frame++) advanceSanctuaryAtmosphere(mood, 2, 1 / fps);
    return mood;
  };
  assert.ok(Math.abs(simulate(30).userTravel - simulate(120).userTravel) < 1e-12);
  const mood = simulate(60);
  const before = mood.userTravel;
  advanceSanctuaryAtmosphere(mood, -2, 1 / 60);
  assert.ok(mood.userTravel < before && mood.userTravel > -2);
  const suspended = createSanctuaryAtmosphere();
  advanceSanctuaryAtmosphere(suspended, 4, 100);
  assert.ok(suspended.userTravel < 1.6);
  const unchanged = structuredClone(suspended);
  advanceSanctuaryAtmosphere(suspended, NaN, 1 / 60);
  advanceSanctuaryAtmosphere(suspended, 4, NaN);
  assert.deepEqual(suspended, unchanged);
  advanceSanctuaryAtmosphere(suspended, 4, 1 / 60, true);
  assert.equal(suspended.userTravel, 4, "reduced motion follows explicit input without lingering color motion");
});
