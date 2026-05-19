"use client";

import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getProjectForStairIndex } from "@/lib/spiral";
import { usePortfolioStore } from "@/lib/store";
import { MODEL_PATHS } from "@/lib/models";
import { findChildByNamePart } from "./cloneScene";

type ProjectDoorProps = {
  poolId: number;
};

const DOOR_OPEN_ANGLE = -Math.PI * 0.55;
const SINGLE_CLICK_DELAY_MS = 280;

export function ProjectDoor({ poolId }: ProjectDoorProps) {
  const doorId = `pool-door-${poolId}`;
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Object3D | null>(null);
  const previewRef = useRef<THREE.Mesh | null>(null);
  const isOpenRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevVirtualIndexRef = useRef(-1);

  const { scene: doorScene } = useGLTF(MODEL_PATHS.door);
  const { scene: previewScene } = useGLTF(MODEL_PATHS.previewScreen);

  const virtualIndex = usePortfolioStore(
    (s) => s.doorPoolVirtualIndices[poolId] ?? -1,
  );
  const openedDoorId = usePortfolioStore((s) => s.openedDoorId);
  const setOpenedDoor = usePortfolioStore((s) => s.setOpenedDoor);
  const setActiveDoor = usePortfolioStore((s) => s.setActiveDoor);
  const resetDoors = usePortfolioStore((s) => s.resetDoors);

  const doorClone = useMemo(() => doorScene.clone(true), [doorScene]);
  const previewClone = useMemo(() => previewScene.clone(true), [previewScene]);

  const project =
    virtualIndex >= 0 ? getProjectForStairIndex(virtualIndex) : undefined;

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
    if (previewRef.current) previewRef.current.visible = false;
    if (usePortfolioStore.getState().openedDoorId === doorId) {
      resetDoors();
    }
  }, [doorId, resetDoors]);

  const clearClickTimer = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    panelRef.current = findChildByNamePart(doorClone, "panel");
    const previewMesh = findChildByNamePart(
      previewClone,
      "preview_screen",
    ) as THREE.Mesh | null;
    previewRef.current = previewMesh;

    if (previewMesh) {
      previewMesh.visible = false;
      const mat = previewMesh.material;
      if (mat && !Array.isArray(mat) && mat instanceof THREE.MeshStandardMaterial) {
        mat.emissive = new THREE.Color("#1a3048");
        mat.emissiveIntensity = 0.35;
      }
    }

    if (groupRef.current && previewClone) {
      previewClone.position.set(0, 0, -0.12);
      previewClone.scale.set(0.85, 0.85, 0.85);
      groupRef.current.add(previewClone);
    }
  }, [doorClone, previewClone]);

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
    if (!project?.previewImage || !previewRef.current) return;

    const loader = new THREE.TextureLoader();
    let cancelled = false;
    loader.load(project.previewImage, (texture) => {
      if (cancelled) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      const mesh = previewRef.current;
      if (!mesh) return;

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: new THREE.Color("#224466"),
        emissiveIntensity: 0.25,
        metalness: 0.1,
        roughness: 0.4,
      });
      mesh.material = material;
    });

    return () => {
      cancelled = true;
    };
  }, [project?.previewImage, project?.id]);

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
      if (previewRef.current) previewRef.current.visible = false;
    }
  }, [openedDoorId, doorId]);

  const openDoor = useCallback(() => {
    if (!panelRef.current || !project || isOpenRef.current) return;

    resetDoors();
    setOpenedDoor(doorId, project);
    isOpenRef.current = true;

    tweenRef.current?.kill();
    tweenRef.current = gsap.to(panelRef.current.rotation, {
      y: DOOR_OPEN_ANGLE,
      duration: 0.85,
      ease: "power2.out",
    });

    if (previewRef.current) {
      previewRef.current.visible = true;
      gsap.fromTo(
        previewRef.current.scale,
        { x: 0.92, y: 0.92, z: 0.92 },
        { x: 1, y: 1, z: 1, duration: 0.6, ease: "power2.out" },
      );
    }
  }, [doorId, project, resetDoors, setOpenedDoor]);

  const toggleDoor = useCallback(() => {
    if (isOpenRef.current) {
      closeDoor();
    } else {
      openDoor();
    }
  }, [closeDoor, openDoor]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    setActiveDoor(doorId);
    clearClickTimer();
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      toggleDoor();
    }, SINGLE_CLICK_DELAY_MS);
  };

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    clearClickTimer();
    if (!project?.url) return;
    window.open(project.url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => () => clearClickTimer(), [clearClickTimer]);

  if (virtualIndex < 0) return null;

  return (
    <group ref={groupRef}>
      <primitive object={doorClone} />
      <mesh
        position={[0, 1.1, 0.35]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
          setActiveDoor(doorId);
        }}
        onPointerOut={() => {
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
useGLTF.preload(MODEL_PATHS.previewScreen);
