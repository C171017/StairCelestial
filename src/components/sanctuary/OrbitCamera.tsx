"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, type RefObject } from "react";
import type { PerspectiveCamera } from "three";
import { getArtworkViewportSize } from "@/lib/eyeControlMetrics";
import type { RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { getRibbonCameraZoom, ribbonOrbitPosition } from "@/lib/ribbonOrbit";

export function OrbitCamera({ orbit }: { orbit: RefObject<RibbonMotionSnapshot> }) {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!size.width || !size.height) return;
    const viewport = getArtworkViewportSize(size.width, size.height);
    (camera as PerspectiveCamera).zoom = getRibbonCameraZoom(viewport.width, viewport.height, size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

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
