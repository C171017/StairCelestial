"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { usePortfolioStore } from "@/lib/store";

type IntroSceneRevealProps = {
  children: ReactNode;
};

type RevealMaterialData = {
  introRevealBaseDepthWrite?: boolean;
  introRevealBaseOpacity?: number;
  introRevealBaseTransparent?: boolean;
};

function applyRevealOpacity(material: THREE.Material, opacity: number) {
  const data = material.userData as RevealMaterialData;
  if (data.introRevealBaseOpacity === undefined) {
    data.introRevealBaseOpacity = material.opacity;
    data.introRevealBaseTransparent = material.transparent;
    data.introRevealBaseDepthWrite = material.depthWrite;
  }

  const baseOpacity = data.introRevealBaseOpacity ?? 1;
  const baseTransparent = data.introRevealBaseTransparent ?? false;
  const baseDepthWrite = data.introRevealBaseDepthWrite ?? true;
  const nextTransparent = baseTransparent || opacity < 0.995 || baseOpacity < 0.995;
  const transparencyChanged = material.transparent !== nextTransparent;

  material.opacity = baseOpacity * opacity;
  material.transparent = nextTransparent;
  material.depthWrite = baseDepthWrite;

  if (transparencyChanged) {
    material.needsUpdate = true;
  }
}

function applyObjectRevealOpacity(object: THREE.Object3D, opacity: number) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => applyRevealOpacity(material, opacity));
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

    if (Math.abs(opacity - lastOpacityRef.current) < 0.002) return;
    lastOpacityRef.current = opacity;
    applyObjectRevealOpacity(group, opacity);
  });

  return (
    <group ref={groupRef} visible={false}>
      {children}
    </group>
  );
}
