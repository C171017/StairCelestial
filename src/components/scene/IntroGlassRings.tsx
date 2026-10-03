"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { createControlReflections } from "@/lib/controlReflections";
import type { ControlEntrance } from "@/lib/controlEntrance";
import { PLAY_INNER_RING_LOCAL_RADIUS, PLAY_PRIMARY_RING_LOCAL_RADIUS } from "@/lib/eyeControlMetrics";

function ringMaterial(kind: "obsidian" | "glass", reflections: THREE.Texture) {
  const dark = kind === "obsidian";
  const color = dark ? "#080a0d" : "#e1f5fa";
  const dissolve = { value: 0 };
  const material = new THREE.MeshPhysicalMaterial({
    color, metalness: dark ? 0.35 : 0, roughness: dark ? 0.13 : 0.065,
    transmission: dark ? 0 : 0.98,
    thickness: 0.12, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.055,
    envMap: dark ? reflections : null,
    envMapIntensity: dark ? 1.8 : 1.1, transparent: true, opacity: 0, depthWrite: false,
    attenuationColor: new THREE.Color(color), attenuationDistance: 3.5,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDissolve = dissolve;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRingLocal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRingLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRingLocal;\nuniform float uDissolve;")
      .replace("#include <opaque_fragment>", `
        float angle = atan(vRingLocal.y, vRingLocal.x);
        float grain = 0.5 + 0.23 * sin(angle * 9.0 + vRingLocal.z * 90.0)
          + 0.17 * sin(angle * 17.0 - vRingLocal.z * 120.0);
        float coverage = 1.0 - smoothstep(grain - 0.18, grain + 0.18, uDissolve);
        diffuseColor.a *= coverage;
        #include <opaque_fragment>
      `);
  };
  material.customProgramCacheKey = () => "intro-glass-dissolve-v1";
  return { material, dissolve };
}

export function IntroGlassRings({ entrance }: { entrance: RefObject<ControlEntrance> }) {
  const outer = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const reflections = useMemo(createControlReflections, []);
  const materials = useMemo(() => [ringMaterial("obsidian", reflections), ringMaterial("glass", reflections)], [reflections]);
  useEffect(() => () => {
    materials.forEach(({ material }) => material.dispose());
    reflections.dispose();
  }, [materials, reflections]);
  useFrame(() => {
    const p = entrance.current;
    materials[0].material.opacity = p.outerOpacity;
    materials[1].material.opacity = p.innerOpacity * 0.9;
    materials[0].dissolve.value = p.outerDissolve;
    materials[1].dissolve.value = p.innerDissolve;
    if (outer.current) {
      outer.current.visible = p.outerOpacity > 0.001;
      outer.current.rotation.set(0.1 + p.outerDissolve * 0.28, -0.12 - p.outerDissolve * 0.3, p.elapsed * 0.045);
      outer.current.scale.setScalar(1 + p.outerDissolve * 0.12);
    }
    if (inner.current) {
      inner.current.visible = p.innerOpacity > 0.001;
      inner.current.rotation.set(-0.14 - p.innerDissolve * 0.25, 0.14 + p.innerDissolve * 0.4, -p.elapsed * 0.06);
      inner.current.scale.setScalar(1 + p.innerDissolve * 0.16);
    }
  });
  return <group>
    <mesh ref={outer} material={materials[0].material}>
      <torusGeometry args={[PLAY_PRIMARY_RING_LOCAL_RADIUS, 0.014, 24, 160]} />
    </mesh>
    <mesh ref={inner} material={materials[1].material} position={[0, 0, 0.008]}>
      <torusGeometry args={[PLAY_INNER_RING_LOCAL_RADIUS, 0.011, 24, 128]} />
    </mesh>
  </group>;
}
