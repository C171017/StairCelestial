"use client";

import { LayeredSky } from "./LayeredSky";
import type { RefObject } from "react";
import type * as THREE from "three";
import type { SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";
import { usePortfolioStore } from "@/lib/store";

/** Anchored distant banks with independent wind layers and coordinated light. */
export function OrbitSky({ onReady, atmosphere, reflectionScene }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; reflectionScene?: RefObject<THREE.Scene|null> } = {}) {
  const phase = usePortfolioStore(state => state.introPlayPhase);
  return <LayeredSky study="all" deferEffects effectsEnabled={phase!=="hidden"} onReady={onReady} atmosphere={atmosphere} reflectionScene={reflectionScene}/>;
}
