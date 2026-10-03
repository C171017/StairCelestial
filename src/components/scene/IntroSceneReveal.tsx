"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { usePortfolioStore } from "@/lib/store";
import { setIntroMaterialOpacity } from "@/lib/materialReveal";

type IntroSceneRevealProps = {
  children: ReactNode;
};

function applyObjectRevealOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => setIntroMaterialOpacity(material, opacity));
  });
}

export function IntroSceneReveal({ children }: IntroSceneRevealProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lastOpacityRef = useRef(-1);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const opacity = usePortfolioStore.getState().introMainOpacity;
    group.visible = opacity > 0.002;
    applyObjectRevealOpacity(group, opacity);
    lastOpacityRef.current = opacity;
  }, [children]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const opacity = usePortfolioStore.getState().introMainOpacity;
    group.visible = opacity > 0.002;

    if (opacity === lastOpacityRef.current) return;
    lastOpacityRef.current = opacity;
    applyObjectRevealOpacity(group, opacity);
  });

  return (
    <group ref={groupRef} visible={false}>
      {children}
    </group>
  );
}
