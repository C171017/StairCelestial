"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import type { RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { ribbonOrbitPosition } from "@/lib/ribbonOrbit";

export function OrbitCamera({ orbit }: { orbit: RefObject<RibbonMotionSnapshot> }) {
  // Input -> camera -> projection-dependent controls, all before rendering.
  useFrame(({ camera, gl }) => {
    ribbonOrbitPosition(orbit.current.position, camera.position);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    if (process.env.NODE_ENV === "development") {
      gl.domElement.dataset.orbitTurns = orbit.current.position.toFixed(4);
    }
  }, -1);
  return null;
}
