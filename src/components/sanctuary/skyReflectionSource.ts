import type * as THREE from "three";

export type SkyReflectionSource = Readonly<{ scene: THREE.Scene; ready: boolean }>;

// Scoped to the foreground Scene, never a global singleton sky. Door studies,
// review canvases and concurrent previews cannot borrow another scene's sky.
const sources = new WeakMap<THREE.Scene, SkyReflectionSource>();

export function registerSkyReflectionSource(foreground: THREE.Scene, source: SkyReflectionSource) {
  sources.set(foreground, source);
  return () => { if (sources.get(foreground) === source) sources.delete(foreground); };
}

export function getSkyReflectionSource(foreground: THREE.Scene) { return sources.get(foreground); }
