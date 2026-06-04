/** iPhone / iPod / iPad (including iPadOS desktop UA). */
export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Primary input is touch (phones, most tablets). */
export function isCoarsePointerDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * When true, fade/mute via HTMLMediaElement.volume (OS media keys still apply).
 * When false, route ambient audio through a GainNode so in-page fades work on
 * desktop browsers where element.volume alone is unreliable.
 *
 * Mobile must stay on element.volume: Web Audio + MediaElementSource often plays
 * silently when AudioContext.resume() runs outside a user gesture.
 */
export function mediaVolumeControlWorks(): boolean {
  if (typeof window === "undefined") return true;
  return isAppleMobile() || isCoarsePointerDevice();
}
