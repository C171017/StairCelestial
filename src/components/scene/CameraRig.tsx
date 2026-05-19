"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useVirtualScrollIndex } from "@/hooks/useVirtualScrollIndex";
import {
  CAMERA_LOOK_AT_Y_OFFSET,
  CAMERA_ORBIT_RADIUS,
  CAMERA_Y_OFFSET,
  getContinuousOrbitAngle,
  STAIR_HEIGHT_STEP,
} from "@/lib/spiral";

const CAMERA_LERP = 0.1;

export function CameraRig() {
  const virtualIndexRef = useVirtualScrollIndex();
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const floatIndex = virtualIndexRef.current;
    const angle = getContinuousOrbitAngle(floatIndex);
    const y = floatIndex * STAIR_HEIGHT_STEP;

    desiredPosition.set(
      Math.cos(angle) * CAMERA_ORBIT_RADIUS,
      y + CAMERA_Y_OFFSET,
      Math.sin(angle) * CAMERA_ORBIT_RADIUS,
    );

    desiredLookAt.set(0, y + CAMERA_LOOK_AT_Y_OFFSET, 0);

    camera.position.lerp(desiredPosition, CAMERA_LERP);
    lookAtTarget.current.lerp(desiredLookAt, CAMERA_LERP);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

/** Small fixed pages — travel is driven by accumulated scroll offset. */
export function getScrollPages(): number {
  return 3;
}
