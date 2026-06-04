"use client";

import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const _worldPos = new THREE.Vector3();
const _worldQuat = new THREE.Quaternion();
import {
  placementToFocusTarget,
  worldRootToFocusTarget,
} from "@/lib/doorCameraFocus";
import { getDoorPlacement, getProjectForStairIndex } from "@/lib/spiral";
import { isPortfolioSceneInteractive, usePortfolioStore } from "@/lib/store";
import { MODEL_PATHS } from "@/lib/models";
import { findChildByNamePart } from "./cloneScene";

type ProjectDoorProps = {
  poolId: number;
};

const DOOR_OPEN_ANGLE = -Math.PI * 0.55;

export function ProjectDoor({ poolId }: ProjectDoorProps) {
  const doorId = `pool-door-${poolId}`;
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Object3D | null>(null);
  const isOpenRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const prevVirtualIndexRef = useRef(-1);

  const { scene: doorScene } = useGLTF(MODEL_PATHS.door);

  const virtualIndex = usePortfolioStore(
    (s) => s.doorPoolVirtualIndices[poolId] ?? -1,
  );
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const openedDoorId = usePortfolioStore((s) => s.openedDoorId);
  const setOpenedDoor = usePortfolioStore((s) => s.setOpenedDoor);
  const setActiveDoor = usePortfolioStore((s) => s.setActiveDoor);
  const setDoorFocus = usePortfolioStore((s) => s.setDoorFocus);
  const resetDoors = usePortfolioStore((s) => s.resetDoors);

  const doorClone = useMemo(() => doorScene.clone(true), [doorScene]);

  const project = getProjectForStairIndex(virtualIndex);
  const doorInteractive =
    isPortfolioSceneInteractive(introPlayPhase) && virtualIndex >= 0;

  const closeDoor = useCallback(() => {
    if (!isOpenRef.current) return;

    isOpenRef.current = false;
    tweenRef.current?.kill();
    if (panelRef.current) {
      tweenRef.current = gsap.to(panelRef.current.rotation, {
        y: 0,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }
    if (usePortfolioStore.getState().openedDoorId === doorId) {
      resetDoors();
    }
  }, [doorId, resetDoors]);

  useEffect(() => {
    panelRef.current = findChildByNamePart(doorClone, "panel");
  }, [doorClone]);

  useEffect(() => {
    if (
      prevVirtualIndexRef.current >= 0 &&
      virtualIndex !== prevVirtualIndexRef.current
    ) {
      closeDoor();
    }
    prevVirtualIndexRef.current = virtualIndex;
  }, [virtualIndex, closeDoor]);

  useEffect(() => {
    if (openedDoorId !== doorId && isOpenRef.current) {
      isOpenRef.current = false;
      tweenRef.current?.kill();
      if (panelRef.current) {
        gsap.to(panelRef.current.rotation, {
          y: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    }
  }, [openedDoorId, doorId]);

  const openDoor = useCallback(() => {
    if (!panelRef.current || !project) return;

    resetDoors();
    setOpenedDoor(doorId, project);

    const doorRoot = groupRef.current?.parent ?? groupRef.current;
    let focusTarget;
    if (doorRoot) {
      doorRoot.updateWorldMatrix(true, true);
      doorRoot.getWorldPosition(_worldPos);
      doorRoot.getWorldQuaternion(_worldQuat);
      focusTarget = worldRootToFocusTarget(_worldPos, _worldQuat);
    } else {
      focusTarget = placementToFocusTarget(getDoorPlacement(virtualIndex));
    }
    setDoorFocus(doorId, focusTarget, virtualIndex);
    isOpenRef.current = true;

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(panelRef.current.rotation, {
      y: DOOR_OPEN_ANGLE,
      duration: 0.85,
      ease: "power2.out",
    });
  }, [doorId, project, resetDoors, setDoorFocus, setOpenedDoor, virtualIndex]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!doorInteractive) return;
    event.stopPropagation();
    setActiveDoor(doorId);

    if (isOpenRef.current && project) {
      window.open(project.url, "_blank", "noopener,noreferrer");
      return;
    }

    openDoor();
  };

  return (
    <group ref={groupRef}>
      <primitive object={doorClone} />
      <mesh
        position={[0, 1.1, 0.35]}
        raycast={doorInteractive ? undefined : () => null}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          if (!doorInteractive) return;
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setActiveDoor(doorId);
        }}
        onPointerOut={() => {
          if (!doorInteractive) return;
          document.body.style.cursor = "default";
          if (usePortfolioStore.getState().openedDoorId !== doorId) {
            setActiveDoor(null);
          }
        }}
      >
        <boxGeometry args={[1.5, 2.6, 0.35]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.door);
