import { isAppleMobile } from "@/lib/mediaVolumeControl";

/** Public paths for site audio (served from /public/audio). */

export const AUDIO_PATHS = {
  consentStingM4a: "/audio/consent-sting.m4a",
  ambientLoopM4a: "/audio/ambient-loop.m4a",
  ambientLoopWebm: "/audio/ambient-loop.webm",
} as const;

/**
 * Prefer WebM/Opus where supported (better efficiency at similar quality),
 * then M4A/AAC for Safari/iOS and other browsers without WebM audio.
 */
export function pickAmbientLoopSrc(): string {
  if (typeof document === "undefined") {
    return AUDIO_PATHS.ambientLoopWebm;
  }
  if (isAppleMobile()) {
    return AUDIO_PATHS.ambientLoopM4a;
  }
  const probe = document.createElement("audio");
  const webm = probe.canPlayType('audio/webm; codecs="opus"');
  if (webm === "probably" || webm === "maybe") {
    return AUDIO_PATHS.ambientLoopWebm;
  }
  const m4a = probe.canPlayType('audio/mp4; codecs="mp4a.40.2"');
  if (m4a === "probably" || m4a === "maybe") {
    return AUDIO_PATHS.ambientLoopM4a;
  }
  return AUDIO_PATHS.ambientLoopM4a;
}
