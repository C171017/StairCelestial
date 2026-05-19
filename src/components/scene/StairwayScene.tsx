"use client";

import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Suspense } from "react";
import { Atmosphere } from "./Atmosphere";
import { CameraRig, getScrollPages } from "./CameraRig";
import { CelestialBackground } from "./CelestialBackground";
import { Lights } from "./Lights";
import { SpiralStaircase } from "./SpiralStaircase";

function SceneContent() {
  return (
    <>
      <Atmosphere />
      <Lights />
      <CelestialBackground />
      <SpiralStaircase />
      <CameraRig />
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
        <ScrollControls pages={getScrollPages()} damping={0.18}>
          <SceneContent />
        </ScrollControls>
      </Suspense>
    </Canvas>
  );
}
