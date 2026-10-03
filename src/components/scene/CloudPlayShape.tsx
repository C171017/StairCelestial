"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPlayShapeGeometry } from "@/lib/playShapeGeometry";

export function CloudPlayShape({ playing, scale }: { playing: boolean; scale: number }) {
  const shape = useMemo(createPlayShapeGeometry, []);
  const progress = useRef(0);
  const edges = useMemo(() => new THREE.LineSegments(
    new THREE.EdgesGeometry(shape.geometry, 20),
    new THREE.LineBasicMaterial({ color: "#bcc8d2", transparent: true, opacity: 0.22, depthWrite: false }),
  ), [shape]);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reducedMotion.current = query.matches; };
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => () => {
    shape.geometry.dispose(); edges.geometry.dispose(); edges.material.dispose();
  }, [shape, edges]);
  useFrame((_, dt) => {
    const target = playing ? 1 : 0;
    if (progress.current === target) return;
    const next = reducedMotion.current ? target : THREE.MathUtils.damp(progress.current, target, 5.5, Math.min(dt, 0.05));
    progress.current = Math.abs(target - next) < 0.001 ? target : next;
    shape.update(progress.current);
    edges.geometry.dispose();
    edges.geometry = new THREE.EdgesGeometry(shape.geometry, 20);
  });
  return <group scale={scale}>
    <mesh geometry={shape.geometry}>
      <meshPhysicalMaterial color="#080a0d"
        metalness={0.35} roughness={0.14} clearcoat={1} clearcoatRoughness={0.055}
        envMapIntensity={1.8}
        flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
    <primitive object={edges} />
  </group>;
}
