"use client";

import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  SCENE_HEIGHT,
  SPIRAL_RADIUS,
  STAIR_ANGLE_STEP,
  STAIR_COUNT,
  STAIR_HEIGHT_STEP,
} from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";

export function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const targetLookAt = useRef(new THREE.Vector3(0, 4, 0));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const progress = scroll.offset;
    usePortfolioStore.getState().setScrollProgress(progress);

    const maxStairIndex = STAIR_COUNT - 1;
    const floatIndex = progress * maxStairIndex;
    const angle = floatIndex * STAIR_ANGLE_STEP;
    const y = floatIndex * STAIR_HEIGHT_STEP + 2.2;

    const camRadius = SPIRAL_RADIUS + 7.5;
    desiredPosition.set(
      Math.cos(angle) * camRadius,
      y,
      Math.sin(angle) * camRadius,
    );

    desiredLookAt.set(
      Math.cos(angle) * (SPIRAL_RADIUS - 1),
      y - 1.5,
      Math.sin(angle) * (SPIRAL_RADIUS - 1),
    );

    camera.position.lerp(desiredPosition, 0.08);
    targetLookAt.current.lerp(desiredLookAt, 0.08);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}

export function getScrollPages(): number {
  return Math.max(3, SCENE_HEIGHT / 4);
}
