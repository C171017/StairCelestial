import assert from "node:assert/strict";
import test from "node:test";
import { AmbientPlayback, AMBIENT_FADE_IN_MS, AMBIENT_FADE_OUT_MS, AMBIENT_VOLUME, sampleAudioFade } from "./ambientPlayback";
import { AUDIO_PATHS, getAmbientSources } from "./siteAudioPaths";

const sources = [
  { src: "/music.webm", type: "audio/webm" },
  { src: "/music.m4a", type: "audio/mp4" },
  { src: "/music.mp3", type: "audio/mpeg" },
];
const flush = async () => { await new Promise<void>((resolve) => setImmediate(resolve)); };
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(playResults: Promise<void>[] = []) {
  const calls: (string | number[])[] = [];
  class Media extends EventTarget {
    src = "";
    currentTime = 42;
    paused = true;
    ended = false;
    play() { calls.push("play"); this.paused = false; return playResults.shift() ?? Promise.resolve(); }
    pause() { calls.push("pause"); this.paused = true; }
    load() { calls.push("load"); }
  }
  const media = new Media();
  const output = {
    unlock: () => { calls.push("unlock"); return Promise.resolve(); },
    fadeTo: (level: number, duration: number) => { calls.push([level, duration]); },
    silence: () => { calls.push("silence"); },
    dispose: () => { calls.push("dispose"); },
  };
  const failures: unknown[] = [];
  const endings: number[] = [];
  const player = new AmbientPlayback(media, output, sources, (error) => failures.push(error), () => endings.push(media.currentTime));
  return { player, media, calls, failures, endings };
}

test("Apple uses AAC, other browsers use Opus, and only supported files are selected", () => {
  const options = { canPlayType: () => "probably" as const, apple: true, saveData: false };
  assert.equal(getAmbientSources(options)[0].src, AUDIO_PATHS.ambientLoopM4a);
  assert.equal(getAmbientSources({ ...options, apple: false })[0].src, AUDIO_PATHS.ambientLoopWebm);
  assert.equal(getAmbientSources({ ...options, saveData: true })[0].src, AUDIO_PATHS.ambientLoopLowM4a);
  const mp3Only = getAmbientSources({ ...options, canPlayType: (type) => type === "audio/mpeg" ? "probably" : "" });
  assert.deepEqual(mp3Only.map((source) => source.src), [AUDIO_PATHS.ambientLoopMp3]);
});

test("confident codec support wins over tentative support and data saving", () => {
  const result = getAmbientSources({ apple: true, saveData: true,
    canPlayType: (type) => type.includes("mp4a.40.2") ? "probably" : "maybe" });
  assert.equal(result[0].src, AUDIO_PATHS.ambientLoopM4a);
});

test("music starts in the gesture and pauses only after fading, retaining its position", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, calls, media } = fixture();
  player.play();
  assert.deepEqual(calls, ["unlock", "play"]);
  await flush();
  assert.deepEqual(calls.at(-1), [AMBIENT_VOLUME, AMBIENT_FADE_IN_MS]);
  player.pause();
  assert.deepEqual(calls.at(-1), [0, AMBIENT_FADE_OUT_MS]);
  t.mock.timers.tick(AMBIENT_FADE_OUT_MS - 1);
  assert.equal(media.paused, false);
  t.mock.timers.tick(1);
  assert.equal(media.paused, true);
  assert.equal(media.currentTime, 42);
  player.dispose();
});

test("stopping during a pending play never starts a stale fade", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = deferred();
  const { player, calls, media } = fixture([pending.promise]);
  player.play();
  player.pause();
  pending.resolve();
  await flush();
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === AMBIENT_VOLUME), false);
  t.mock.timers.tick(AMBIENT_FADE_OUT_MS);
  assert.equal(media.paused, true);
  player.dispose();
});

test("the track ends naturally and another click replays from the beginning", async () => {
  const { player, media, calls, failures, endings } = fixture();
  player.play(); await flush();
  media.currentTime = 180;
  media.paused = true;
  media.ended = true;
  media.dispatchEvent(new Event("ended"));
  await flush();
  assert.deepEqual(endings, [180]);
  assert.equal(media.currentTime, 180);
  assert.equal(media.paused, true);
  assert.equal(calls.filter((call) => call === "play").length, 1);
  assert.equal(calls.at(-1), "silence");
  assert.equal(failures.length, 0);
  player.play();
  assert.equal(media.currentTime, 0);
  await flush();
  assert.equal(media.paused, false);
  assert.equal(calls.filter((call) => call === "play").length, 2);
  assert.deepEqual(calls.at(-1), [AMBIENT_VOLUME, AMBIENT_FADE_IN_MS]);
  player.dispose();
});

test("ending during fade-out cancels the delayed pause before replay", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, media, calls, endings } = fixture();
  player.play(); await flush();
  player.pause();
  media.paused = true;
  media.ended = true;
  media.dispatchEvent(new Event("ended"));
  assert.equal(endings.length, 1);
  player.play(); await flush();
  t.mock.timers.tick(AMBIENT_FADE_OUT_MS * 2);
  assert.equal(media.paused, false);
  assert.equal(calls.includes("pause"), false);
  player.dispose();
});

test("ending invalidates a pending play so it cannot start a stale fade", async () => {
  const pending = deferred();
  const { player, media, calls, endings } = fixture([pending.promise]);
  player.play();
  media.paused = true;
  media.ended = true;
  media.dispatchEvent(new Event("ended"));
  pending.resolve(); await flush();
  assert.equal(endings.length, 1);
  assert.equal(calls.some((call) => Array.isArray(call) && call[0] === AMBIENT_VOLUME), false);
  player.dispose();
});

test("resuming during fade-out cancels the old pause and repeated play does not reset a fade", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, calls, media } = fixture();
  player.play(); await flush();
  player.pause(); t.mock.timers.tick(400);
  player.play(); await flush();
  const count = calls.length;
  player.play();
  assert.equal(calls.length, count);
  t.mock.timers.tick(AMBIENT_FADE_OUT_MS * 2);
  assert.equal(media.paused, false);
  assert.equal(media.currentTime, 42);
  player.dispose();
});

test("a media error and rejected play for one source do not skip two fallback files", async () => {
  const pending = deferred();
  const { player, media, failures } = fixture([pending.promise]);
  player.play();
  media.dispatchEvent(new Event("error"));
  pending.reject(new DOMException("Unsupported", "NotSupportedError"));
  await flush();
  assert.equal(media.src, sources[1].src);
  assert.equal(failures.length, 0);
  player.dispose();
});

test("unsupported playback tries another codec; permission failures return to the triangle", async () => {
  const unsupported = fixture([Promise.reject(new DOMException("Unsupported", "NotSupportedError"))]);
  unsupported.player.play(); await flush();
  assert.equal(unsupported.media.src, sources[1].src);
  assert.equal(unsupported.failures.length, 0);
  unsupported.player.dispose();
  const denied = fixture([Promise.reject(new DOMException("Gesture required", "NotAllowedError"))]);
  denied.player.play(); await flush();
  assert.equal(denied.media.src, sources[0].src);
  assert.equal(denied.media.paused, true);
  assert.equal(denied.failures.length, 1);
  denied.player.dispose();
});

test("cleanup silences audio and invalidates pending callbacks", async () => {
  const pending = deferred();
  const { player, media, calls, endings } = fixture([pending.promise]);
  player.play(); player.dispose();
  const count = calls.length;
  pending.resolve(); await flush();
  media.dispatchEvent(new Event("error"));
  media.dispatchEvent(new Event("ended"));
  player.play();
  assert.equal(calls.length, count);
  assert.equal(media.paused, true);
  assert.equal(endings.length, 0);
});

test("exhausted source failures stop playback and the next click retries from the first source", async () => {
  const { player, media, failures } = fixture();
  player.play(); await flush();
  for (let i = 0; i < sources.length; i++) media.dispatchEvent(new Event("error"));
  await flush();
  assert.equal(media.paused, true);
  assert.equal(failures.length, 1);
  player.play(); await flush();
  assert.equal(media.src, sources[0].src);
  assert.equal(media.paused, false);
  player.dispose();
});

test("fade envelopes are bounded, gradual, and ease gently at both ends", () => {
  for (const [from, to] of [[0, AMBIENT_VOLUME], [AMBIENT_VOLUME, 0], [0.13, AMBIENT_VOLUME]]) {
    assert.equal(sampleAudioFade(from, to, 0), from);
    assert.ok(Math.abs(sampleAudioFade(from, to, 1) - to) < 1e-12);
    let previous = from;
    for (let i = 0; i <= 100; i++) {
      const next = sampleAudioFade(from, to, i / 100);
      assert.ok(next >= Math.min(from, to) - 1e-12 && next <= Math.max(from, to) + 1e-12);
      assert.ok(Math.abs(next - previous) < 0.006);
      previous = next;
    }
    assert.ok(Math.abs(sampleAudioFade(from, to, 0.001) - from) < 0.000002);
    assert.ok(Math.abs(sampleAudioFade(from, to, 0.999) - to) < 0.000002);
  }
});
