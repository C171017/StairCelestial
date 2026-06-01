"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Suspense } from "react";
import { useVirtualScrollIndex } from "@/hooks/useVirtualScrollIndex";
import { Atmosphere } from "./Atmosphere";
import { CameraRig, getScrollPages } from "./CameraRig";
import { CelestialBackground } from "./CelestialBackground";
import { Lights } from "./Lights";
import { SceneReadyMarker } from "./SceneReadyMarker";
import { SpiralStaircase } from "./SpiralStaircase";

function SceneContent() {
  const virtualIndexRef = useVirtualScrollIndex();

  return (
    <>
      <Atmosphere />
      <Lights />
      <CelestialBackground />
      <SpiralStaircase virtualIndexRef={virtualIndexRef} />
      <CameraRig virtualIndexRef={virtualIndexRef} />
      <SceneReadyMarker />
    </>
  );
}

export function StairwayScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [25, 4, 0], fov: 58, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ScrollControls pages={getScrollPages()} damping={0.3} infinite>
          <SceneContent />
        </ScrollControls>
      </Suspense>
    </Canvas>
  );
}
