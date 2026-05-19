"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { MODEL_PATHS } from "@/lib/models";
export function CelestialBackground() {
  const jupiter = useGLTF(MODEL_PATHS.jupiter);
  const ringed = useGLTF(MODEL_PATHS.ringed);

  const jupiterClone = useMemo(() => jupiter.scene.clone(true), [jupiter.scene]);
  const ringedClone = useMemo(() => ringed.scene.clone(true), [ringed.scene]);

  return (
    <group>
      <primitive
        object={jupiterClone}
        position={[28, 18, -42]}
        scale={14}
      />
      <primitive
        object={ringedClone}
        position={[-34, 26, -58]}
        scale={7}
      />
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.jupiter);
useGLTF.preload(MODEL_PATHS.ringed);
