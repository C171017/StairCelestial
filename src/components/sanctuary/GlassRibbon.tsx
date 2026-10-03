"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRibbonEdge, createRibbonGeometry } from "@/lib/ribbonGeometry";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";

export function GlassRibbon({ radius, width, focused }: { radius: number; width: number; focused: boolean }) {
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const localOpacity = useRef(0.62);
  const geometry = useMemo(() => createRibbonGeometry(radius, width), [radius, width]);
  const edges = useMemo(() => [createRibbonEdge(radius - width / 2 + 0.025), createRibbonEdge(radius + width / 2 - 0.025)], [radius, width]);
  useEffect(() => () => { geometry.dispose(); edges.forEach((edge) => edge.dispose()); }, [geometry, edges]);
  useFrame((_, dt) => {
    localOpacity.current = THREE.MathUtils.damp(localOpacity.current, focused ? 0.27 : 0.62, 5, Math.min(dt, 0.05));
    if (material.current) setLocalMaterialOpacity(material.current, localOpacity.current);
  });
  return (
    <group>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial ref={material} color="#f2fbff" roughness={0.035} metalness={0}
          transmission={1} thickness={0.23} ior={1.38} envMapIntensity={0.85}
          transparent opacity={0.62} depthWrite={false}
          clearcoat={0.3} clearcoatRoughness={0.04} attenuationColor="#bfecf3" attenuationDistance={12} />
      </mesh>
      {edges.map((edge, index) => (
        <mesh key={index} geometry={edge}>
          <meshStandardMaterial color={index ? "#f4e7cb" : "#eaf9fc"} metalness={0.65} roughness={0.22} envMapIntensity={1.8} />
        </mesh>
      ))}
    </group>
  );
}
