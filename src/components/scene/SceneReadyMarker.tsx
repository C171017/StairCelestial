"use client";

import { useEffect } from "react";
import { usePortfolioStore } from "@/lib/store";

/** Mounts when Suspense + all useGLTF children in the scene tree are ready. */
export function SceneReadyMarker() {
  const setSceneBootstrapped = usePortfolioStore((s) => s.setSceneBootstrapped);

  useEffect(() => {
    setSceneBootstrapped(true);
  }, [setSceneBootstrapped]);

  return null;
}
