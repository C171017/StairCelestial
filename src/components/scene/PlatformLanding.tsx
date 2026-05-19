"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { MODEL_PATHS } from "@/lib/models";
type PlatformLandingProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

export function PlatformLanding({ position, rotation }: PlatformLandingProps) {
  const { scene } = useGLTF(MODEL_PATHS.platform);
  const clone = useMemo(() => scene.clone(true), [scene]);

  return (
    <primitive
      object={clone}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}

useGLTF.preload(MODEL_PATHS.platform);
