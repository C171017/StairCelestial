import type { AmbientSource } from "./siteAudioPaths";

export const AMBIENT_VOLUME = 0.35;
export const AMBIENT_FADE_IN_MS = 1200;
export const AMBIENT_FADE_OUT_MS = 1400;

export function sampleAudioFade(from: number, to: number, progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return from + (to - from) * t * t * (3 - 2 * t);
}

export type AmbientOutput = {
  unlock: () => Promise<void>;
  fadeTo: (level: number, durationMs: number) => void;
  silence: () => void;
  dispose: () => void;
};

type AmbientMedia = Pick<HTMLAudioElement,
  "src" | "currentTime" | "paused" | "ended" | "play" | "pause" | "load" | "addEventListener" | "removeEventListener">;

/** Keep asynchronous play requests, source fallback and fade completion in sync. */
export class AmbientPlayback {
  private playing = false;
  private disposed = false;
  private generation = 0;
  private sourceIndex = 0;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly media: AmbientMedia,
    private readonly output: AmbientOutput,
    private readonly sources: AmbientSource[],
    private readonly onFailure: (error: unknown) => void,
    private readonly onEnded: () => void,
  ) {
    media.src = sources[0].src;
    media.addEventListener("error", this.handleMediaError);
    media.addEventListener("ended", this.handleMediaEnded);
  }

  private cancelPause() {
    if (this.pauseTimer !== null) clearTimeout(this.pauseTimer);
    this.pauseTimer = null;
  }

  unlock() {
    // Invoke resume synchronously inside the pointer gesture, before any await.
    if (!this.disposed) void this.output.unlock().catch(() => {});
  }

  play() {
    if (this.disposed || this.playing) return;
    this.playing = true;
    this.cancelPause();
    if (this.media.ended) this.media.currentTime = 0;
    if (this.sourceIndex >= this.sources.length) {
      this.sourceIndex = 0;
      this.media.src = this.sources[0].src;
      this.media.load();
    }
    void this.start();
  }

  private async start() {
    const generation = ++this.generation;
    try {
      // Both calls must happen in the gesture's call stack for mobile autoplay.
      const ready = this.output.unlock();
      const started = this.media.play();
      await Promise.all([ready, started]);
      if (this.disposed || generation !== this.generation || !this.playing) return;
      this.output.fadeTo(AMBIENT_VOLUME, AMBIENT_FADE_IN_MS);
    } catch (error: unknown) {
      if (this.disposed || generation !== this.generation || !this.playing) return;
      if (error instanceof Error && error.name === "NotSupportedError") {
        this.nextSource(error);
      } else {
        this.fail(error);
      }
    }
  }

  private handleMediaError = () => {
    if (!this.disposed) this.nextSource(new Error(`Could not load ${this.media.src}`));
  };

  private handleMediaEnded = () => {
    if (this.disposed) return;
    this.playing = false;
    ++this.generation;
    this.cancelPause();
    this.output.silence();
    this.onEnded();
  };

  private nextSource(error: unknown) {
    ++this.generation;
    if (++this.sourceIndex >= this.sources.length) {
      this.fail(error);
      return;
    }
    this.output.silence();
    this.media.src = this.sources[this.sourceIndex].src;
    this.media.load();
    if (this.playing) void this.start();
  }

  private fail(error: unknown) {
    this.stop();
    this.onFailure(error);
  }

  pause() {
    if (this.disposed || !this.playing) return;
    this.playing = false;
    const generation = ++this.generation;
    this.output.fadeTo(0, AMBIENT_FADE_OUT_MS);
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      if (this.disposed || this.playing || generation !== this.generation) return;
      this.media.pause();
      this.output.silence();
    }, AMBIENT_FADE_OUT_MS);
  }

  stop() {
    this.playing = false;
    ++this.generation;
    this.cancelPause();
    this.media.pause();
    this.output.silence();
    this.media.currentTime = 0;
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.media.removeEventListener("error", this.handleMediaError);
    this.media.removeEventListener("ended", this.handleMediaEnded);
    this.media.src = "";
    this.output.dispose();
  }
}
