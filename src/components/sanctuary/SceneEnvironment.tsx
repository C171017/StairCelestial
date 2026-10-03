"use client";

import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
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
    <ambientLight intensity={0.45} color="#e4f1ff" />
    <directionalLight position={[-8, 12, 10]} intensity={2.2} color="#fff2e2" />
    <directionalLight position={[10, 4, -6]} intensity={1.2} color="#c5dff4" />
    <Suspense fallback={null}><CloudReflections /></Suspense>
  </>;
}

/** Capture once; reflections follow viewing angle without recapturing each frame. */
function CloudReflections() {
  const { gl } = useThree();
  const source = useTexture(gl.capabilities.maxTextureSize >= 4096
    ? "/textures/sanctuary/cloudscape-360-4k.webp" : "/textures/sanctuary/cloudscape-360.webp");
  const texture = useMemo(() => {
    const map = source.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }, [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <Environment resolution={256} frames={1}>
      <mesh rotation={[0, Math.PI * .15, 0]}>
        <sphereGeometry args={[50, 48, 24]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <Lightformer form="rect" intensity={3} color="#fff8e8" position={[-7, 6, 5]} scale={[4, 12, 1]} rotation={[0, Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={2} color="#ffffff" position={[7, 3, 3]} scale={[3, 15, 1]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={2.5} color="#daeaff" position={[0, 10, 0]} scale={[20, 5, 1]} rotation={[Math.PI / 2, 0, 0]} />
      <Lightformer form="rect" intensity={0.2} color="#314657" position={[0, -5, -10]} scale={[20, 4, 1]} />
      <Lightformer form="rect" intensity={0.15} color="#213847" position={[3, 3, 7]} scale={[1.3, 14, 1]} rotation={[0, -Math.PI / 7, 0]} />
    </Environment>;
}
