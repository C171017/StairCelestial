"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const base = "/textures/sanctuary/materials/Marble021_4K-JPG";
const sources = [`${base}_Color.jpg`, `${base}_Roughness.jpg`, `${base}_Displacement.jpg`];

/** Loader-owned maps are shared by all marble ribbon sections. Materials are
 * instance-owned; disposing them must not dispose these cached textures. */
export function useStoneTextures() {
  const textures = useTexture(sources);
  const { gl } = useThree();
  return useMemo(() => {
    textures.forEach((texture, index) => {
      texture.colorSpace = index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
    });
    return { color: textures[0], roughness: textures[1], height: textures[2] };
  }, [textures, gl]);
}
