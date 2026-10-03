import { isAppleMobile } from "./mediaVolumeControl";

const MUSIC_VERSION = "z2QKPDDApTE";
const musicPath = (extension: string) => `/audio/ambient-loop.${extension}?v=${MUSIC_VERSION}`;

export const AUDIO_PATHS = {
  consentStingM4a: "/audio/consent-sting.m4a",
  ambientLoopM4a: musicPath("m4a"),
  ambientLoopWebm: musicPath("webm"),
  ambientLoopOpus: musicPath("opus"),
  ambientLoopMp3: musicPath("mp3"),
  ambientLoopLowM4a: `/audio/ambient-loop-low.m4a?v=${MUSIC_VERSION}`,
} as const;

export type AmbientSource = { src: string; type: string };

const AAC = { src: AUDIO_PATHS.ambientLoopM4a, type: 'audio/mp4; codecs="mp4a.40.2"' };
const WEBM = { src: AUDIO_PATHS.ambientLoopWebm, type: 'audio/webm; codecs="opus"' };
const OPUS = { src: AUDIO_PATHS.ambientLoopOpus, type: 'audio/ogg; codecs="opus"' };
const MP3 = { src: AUDIO_PATHS.ambientLoopMp3, type: "audio/mpeg" };
const LOW_AAC = { src: AUDIO_PATHS.ambientLoopLowM4a, type: 'audio/mp4; codecs="mp4a.40.5"' };

/** Test support first; save bandwidth only when the visitor requests it. */
export function getAmbientSources(options?: {
  canPlayType: (type: string) => CanPlayTypeResult;
  apple: boolean;
  saveData: boolean;
}): AmbientSource[] {
  if (!options && typeof document === "undefined") return [AAC, MP3];
  const probe = options ? null : document.createElement("audio");
  const canPlayType = options?.canPlayType ?? ((type: string) => probe!.canPlayType(type));
  const apple = options?.apple ?? (isAppleMobile() || /Macintosh|MacIntel/.test(navigator.userAgent));
  const saveData = options?.saveData ?? Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  );
  const order = apple ? [AAC, WEBM, OPUS, MP3] : [WEBM, OPUS, AAC, MP3];
  if (saveData) order.unshift(LOW_AAC);
  const support = order.map((source) => ({ source, support: canPlayType(source.type) }));
  const supported = ["probably", "maybe"].flatMap((confidence) =>
    support.filter((item) => item.support === confidence).map((item) => item.source),
  );
  return supported.length ? supported : [AAC, MP3];
}
