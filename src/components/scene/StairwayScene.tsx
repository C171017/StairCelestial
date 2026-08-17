"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { useVirtualScrollIndex } from "@/hooks/useVirtualScrollIndex";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { CelestialBackground } from "./CelestialBackground";
import { IntroSceneReveal } from "./IntroSceneReveal";
import { Lights } from "./Lights";
import { PlayControl3D } from "./PlayControl3D";
import { SceneReadyMarker } from "./SceneReadyMarker";
import { SpiralStaircase } from "./SpiralStaircase";

function SceneContent() {
  const virtualIndexRef = useVirtualScrollIndex();

  return (
    <>
      <IntroSceneReveal>
        <Lights />
        <CelestialBackground />
        <SpiralStaircase virtualIndexRef={virtualIndexRef} />
      </IntroSceneReveal>
      <PlayControl3D />
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
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <Atmosphere />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
