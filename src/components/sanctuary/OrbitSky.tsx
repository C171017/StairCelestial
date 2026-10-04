"use client";

import { LayeredSky } from "./LayeredSky";
import type { RefObject } from "react";
import type * as THREE from "three";
import type { SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

/** The layer composition stays fixed as its daylight and atmosphere evolve. */
export function OrbitSky({ onReady, atmosphere, reflectionScene }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; reflectionScene?: RefObject<THREE.Scene|null> } = {}) {
  return <LayeredSky onReady={onReady} atmosphere={atmosphere} reflectionScene={reflectionScene}/>;
}
