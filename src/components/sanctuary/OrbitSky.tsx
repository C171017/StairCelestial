"use client";

import { LayeredSky } from "./LayeredSky";

/** A fixed environment: only the viewer moves, including across complete orbits. */
export function OrbitSky({ onReady }: { onReady?: () => void } = {}) {
  return <LayeredSky paused onReady={onReady}/>;
}
