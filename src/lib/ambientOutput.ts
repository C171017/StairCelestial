import { sampleAudioFade, type AmbientOutput } from "./ambientPlayback";

/** Web Audio gain works on iOS too; element.volume is only the legacy fallback. */
export function createAmbientOutput(media: HTMLAudioElement): AmbientOutput {
  let context: AudioContext | null = null;
  let gain: GainNode | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let frame: number | null = null;
  let level = 0;
  let fade: { from: number; to: number; start: number; duration: number } | null = null;
  media.volume = 0;

  const now = () => context ? context.currentTime * 1000 : performance.now();
  const currentLevel = () => fade
    ? sampleAudioFade(fade.from, fade.to, (now() - fade.start) / fade.duration)
    : level;

  const cancel = () => {
    level = currentLevel();
    fade = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (context && gain) {
      // Remove the entire active curve before scheduling a reversal.
      gain.gain.cancelScheduledValues(0);
      gain.gain.setValueAtTime(level, context.currentTime);
    } else {
      media.volume = level;
    }
  };

  const silence = () => {
    cancel();
    level = 0;
    if (context && gain) gain.gain.setValueAtTime(0, context.currentTime);
    else media.volume = 0;
  };

  return {
    unlock: () => {
      if (!context) {
        const Ctor = window.AudioContext ??
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) {
          context = new Ctor();
          gain = context.createGain();
          gain.gain.value = currentLevel();
          source = context.createMediaElementSource(media);
          source.connect(gain);
          gain.connect(context.destination);
          media.volume = 1;
        }
      }
      return context && context.state !== "running" ? context.resume() : Promise.resolve();
    },
    fadeTo: (target, duration) => {
      cancel();
      fade = { from: level, to: target, start: now(), duration };
      if (context && gain) {
        const curve = new Float32Array(65);
        for (let i = 0; i < curve.length; i++) {
          curve[i] = sampleAudioFade(level, target, i / (curve.length - 1));
        }
        gain.gain.setValueCurveAtTime(curve, context.currentTime, duration / 1000);
      } else {
        const tick = () => {
          media.volume = currentLevel();
          if (fade && now() < fade.start + fade.duration) {
            frame = requestAnimationFrame(tick);
          } else {
            frame = null;
          }
        };
        frame = requestAnimationFrame(tick);
      }
    },
    silence,
    dispose: () => {
      silence();
      source?.disconnect();
      gain?.disconnect();
      void context?.close().catch(() => {});
    },
  };
}
