"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { getFocusCameraPose } from "@/lib/doorCameraFocus";
import { usePortfolioStore } from "@/lib/store";
import {
  CAMERA_LOOK_AT_Y_OFFSET,
  CAMERA_ORBIT_RADIUS,
  CAMERA_Y_OFFSET,
  getContinuousOrbitAngle,
  STAIR_HEIGHT_STEP,
} from "@/lib/spiral";

const CAMERA_LERP = 0.1;
const FOCUS_BLEND_LERP = 0.08;

type CameraRigProps = {
  virtualIndexRef: MutableRefObject<number>;
};

export function CameraRig({ virtualIndexRef }: CameraRigProps) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);
  const orbitPosition = useMemo(() => new THREE.Vector3(), []);
  const orbitLookAt = useMemo(() => new THREE.Vector3(), []);
  const focusBlend = useRef(0);

  useFrame((state) => {
    const floatIndex = virtualIndexRef.current;
    const angle = getContinuousOrbitAngle(floatIndex);
    const y = floatIndex * STAIR_HEIGHT_STEP;

    orbitPosition.set(
      Math.cos(angle) * CAMERA_ORBIT_RADIUS,
      y + CAMERA_Y_OFFSET,
      Math.sin(angle) * CAMERA_ORBIT_RADIUS,
    );
    orbitLookAt.set(0, y + CAMERA_LOOK_AT_Y_OFFSET, 0);

    const { focusedDoorId, doorFocusTarget } = usePortfolioStore.getState();
    const targetBlend =
      focusedDoorId !== null && doorFocusTarget !== null ? 1 : 0;
    focusBlend.current = THREE.MathUtils.lerp(
      focusBlend.current,
      targetBlend,
      FOCUS_BLEND_LERP,
    );

    if (focusBlend.current > 0.001 && doorFocusTarget) {
      const aspect = state.size.width / Math.max(state.size.height, 1);
      const { position, lookAt } = getFocusCameraPose(
        camera as THREE.PerspectiveCamera,
        doorFocusTarget,
        aspect,
        state.size.width,
      );
      desiredPosition.lerpVectors(orbitPosition, position, focusBlend.current);
      desiredLookAt.lerpVectors(orbitLookAt, lookAt, focusBlend.current);
    } else {
      desiredPosition.copy(orbitPosition);
      desiredLookAt.copy(orbitLookAt);
    }

    const positionLerp =
      focusBlend.current > 0.05 || targetBlend > 0 ? 0.12 : CAMERA_LERP;
    camera.position.lerp(desiredPosition, positionLerp);
    lookAtTarget.current.lerp(desiredLookAt, positionLerp);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

/** Small fixed pages — travel is driven by accumulated scroll offset. */
export function getScrollPages(): number {
  return 3;
}
