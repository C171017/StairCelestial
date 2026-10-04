"use client";

import { LayeredSky } from "./LayeredSky";

/** Fixed cloud geometry with reversible travel-driven light and rare meteors. */
export function OrbitSky({ onReady }: { onReady?: () => void } = {}) {
  return <LayeredSky onReady={onReady}/>;
}
