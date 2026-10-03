"use client";

import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export function Sky() {
  const { scene, size, gl } = useThree();
  const texture = useTexture(gl.capabilities.maxTextureSize >= 4096
    ? "/textures/sanctuary/cloudscape-4k.webp" : "/textures/sanctuary/cloudscape.webp");
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const viewAspect = size.width / size.height;
    const x = Math.min(1, viewAspect / imageAspect);
    const y = Math.min(1, imageAspect / viewAspect);
    texture.repeat.set(x, y);
    texture.offset.set((1 - x) / 2, (1 - y) / 2);
    texture.updateMatrix();
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene, texture, size.width, size.height]);
  return null;
}

export function StudioLight() {
  return <>
    <ambientLight intensity={1.0} color="#e4f1ff" />
    <directionalLight position={[-8, 12, 10]} intensity={3.3} color="#fff2d9" />
    <directionalLight position={[10, 4, -6]} intensity={2.1} color="#b4d9f4" />
    <Environment resolution={128} frames={1}>
      <color attach="background" args={["#a7bccc"]} />
      <Lightformer form="rect" intensity={5} color="#fff8e8" position={[-7, 6, 5]} scale={[4, 12, 1]} rotation={[0, Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[7, 3, 3]} scale={[3, 15, 1]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={4} color="#daeaff" position={[0, 10, 0]} scale={[20, 5, 1]} rotation={[Math.PI / 2, 0, 0]} />
      <Lightformer form="rect" intensity={0.2} color="#314657" position={[0, -5, -10]} scale={[20, 4, 1]} />
      <Lightformer form="rect" intensity={0.15} color="#213847" position={[3, 3, 7]} scale={[1.3, 14, 1]} rotation={[0, -Math.PI / 7, 0]} />
    </Environment>
  </>;
}
