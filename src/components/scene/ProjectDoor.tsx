"use client";

import { useGLTF } from "@react-three/drei";
import { type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getProjectByDoorIndex } from "@/lib/projects";
import { usePortfolioStore } from "@/lib/store";
import { MODEL_PATHS } from "@/lib/models";
import { findChildByNamePart } from "./cloneScene";

type ProjectDoorProps = {
  doorIndex: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

const DOOR_OPEN_ANGLE = -Math.PI * 0.55;

export function ProjectDoor({ doorIndex, position, rotation }: ProjectDoorProps) {
  const doorId = `door-${doorIndex}`;
  const groupRef = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Object3D | null>(null);
  const previewRef = useRef<THREE.Mesh | null>(null);
  const isOpenRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const { scene: doorScene } = useGLTF(MODEL_PATHS.door);
  const { scene: previewScene } = useGLTF(MODEL_PATHS.previewScreen);

  const openedDoorId = usePortfolioStore((s) => s.openedDoorId);
  const setOpenedDoor = usePortfolioStore((s) => s.setOpenedDoor);
  const setActiveDoor = usePortfolioStore((s) => s.setActiveDoor);
  const resetDoors = usePortfolioStore((s) => s.resetDoors);

  const doorClone = useMemo(() => doorScene.clone(true), [doorScene]);
  const previewClone = useMemo(() => previewScene.clone(true), [previewScene]);

  const project = getProjectByDoorIndex(doorIndex);

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
    if (!project?.previewImage || !previewRef.current) return;

    const loader = new THREE.TextureLoader();
    loader.load(project.previewImage, (texture) => {
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
  }, [project?.previewImage]);

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

  const openDoor = () => {
    if (!panelRef.current || !project) return;

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
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setActiveDoor(doorId);

    if (isOpenRef.current && project) {
      window.open(project.url, "_blank", "noopener,noreferrer");
      return;
    }

    openDoor();
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={doorClone} />
      <mesh
        position={[0, 1.1, 0.35]}
        onPointerDown={handlePointerDown}
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
