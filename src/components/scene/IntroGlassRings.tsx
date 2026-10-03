"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { ControlEntrance } from "@/lib/controlEntrance";
import { PLAY_INNER_RING_LOCAL_RADIUS, PLAY_PRIMARY_RING_LOCAL_RADIUS } from "@/lib/eyeControlMetrics";

function glassMaterial(color: string) {
  const dissolve = { value: 0 };
  const material = new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness: 0.1, transmission: 0.94,
    thickness: 0.12, ior: 1.46, clearcoat: 1, clearcoatRoughness: 0.08,
    envMapIntensity: 1.25, transparent: true, opacity: 0, depthWrite: false,
    attenuationColor: new THREE.Color(color), attenuationDistance: 1.8,
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
  const materials = useMemo(() => [glassMaterial("#f0e6d6"), glassMaterial("#bcdce6")], []);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useFrame(() => {
    const p = entrance.current;
    materials[0].material.opacity = p.outerOpacity * 0.88;
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
      <torusGeometry args={[PLAY_PRIMARY_RING_LOCAL_RADIUS, 0.0095, 20, 160]} />
    </mesh>
    <mesh ref={inner} material={materials[1].material} position={[0, 0, 0.008]}>
      <torusGeometry args={[PLAY_INNER_RING_LOCAL_RADIUS, 0.0075, 20, 128]} />
    </mesh>
  </group>;
}
