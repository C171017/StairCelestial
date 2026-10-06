"use client";

import { LayeredSky } from "./LayeredSky";
import type { RefObject } from "react";
import type * as THREE from "three";
import type { SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

/** Anchored distant banks with independent wind layers and coordinated light. */
export function OrbitSky({ onReady, atmosphere, reflectionScene }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; reflectionScene?: RefObject<THREE.Scene|null> } = {}) {
  return <LayeredSky study="all" onReady={onReady} atmosphere={atmosphere} reflectionScene={reflectionScene}/>;
}
