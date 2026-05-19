"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { MODEL_PATHS } from "@/lib/models";
type StairSegmentProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

export function StairSegment({ position, rotation }: StairSegmentProps) {
  const { scene } = useGLTF(MODEL_PATHS.stair);
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

useGLTF.preload(MODEL_PATHS.stair);
