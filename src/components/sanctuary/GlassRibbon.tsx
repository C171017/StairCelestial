"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRibbonEdge, createRibbonSections } from "@/lib/ribbonGeometry";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createRibbonShadows, type RibbonDoorShadow } from "./ribbonShadows";

export function GlassRibbon({ radius, width, focused, doorShadows }: { radius: number; width: number; focused: boolean; doorShadows: RibbonDoorShadow[] }) {
  const localOpacity = useRef(0.62);
  const shadows = useMemo(createRibbonShadows, []);
  const material = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: "#f2fbff", roughness: 0.035, metalness: 0,
      transmission: 1, thickness: 0.23, ior: 1.38, envMapIntensity: 0.85,
      transparent: true, opacity: 0.62, depthWrite: false,
      clearcoat: 0.3, clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color("#bfecf3"), attenuationDistance: 12,
    });
    material.onBeforeCompile = shadows.onBeforeCompile;
    material.customProgramCacheKey = () => "ribbon-contact-shadows-v1";
    return material;
  }, [shadows]);
  const sections = useMemo(() => createRibbonSections(radius, width), [radius, width]);
  const edges = useMemo(() => [createRibbonEdge(radius - width / 2 + 0.025), createRibbonEdge(radius + width / 2 - 0.025)], [radius, width]);
  useEffect(() => () => { sections.forEach(section => section.dispose()); edges.forEach(edge => edge.dispose()); }, [sections, edges]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, dt) => {
    shadows.origins.value.forEach((origin, index) => {
      const door = doorShadows[index];
      const pose = shadows.poses.value[index];
      if (!door) { pose.y = 0; return; }
      origin.set(door.position.x, door.position.y, door.position.z, door.scale);
      pose.x = door.yaw;
      pose.y = THREE.MathUtils.damp(pose.y, door.visible ? 1 : 0, 6, Math.min(dt, 0.05));
    });
    localOpacity.current = THREE.MathUtils.damp(localOpacity.current, focused ? 0.27 : 0.62, 5, Math.min(dt, 0.05));
    setLocalMaterialOpacity(material, localOpacity.current);
  });
  return (
    <group>
      {sections.map((geometry, index) => <mesh key={index} geometry={geometry} material={material} />)}
      {edges.map((edge, index) => (
        <mesh key={index} geometry={edge}>
          <meshStandardMaterial color={index ? "#f4e7cb" : "#eaf9fc"} metalness={0.65} roughness={0.22} envMapIntensity={1.8} />
        </mesh>
      ))}
    </group>
  );
}
