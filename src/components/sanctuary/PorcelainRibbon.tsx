"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createRibbonSections } from "@/lib/ribbonGeometry";
import { applyPorcelainFinish } from "@/lib/porcelainFinish";

/** An opaque, softly rolled porcelain receiver for actual portal shadows. */
export function PorcelainRibbon({ radius, width }: { radius: number; width: number }) {
  const sections = useMemo(() => createRibbonSections(radius, width), [radius, width]);
  const material = useMemo(() => {
    const finish = new THREE.MeshPhysicalMaterial({
      name: "MilkIvoryPorcelainRibbon", color: "#f0dfbe",
      roughness: 0.31, metalness: 0, ior: 1.46,
      clearcoat: 0.34, clearcoatRoughness: 0.24,
      envMapIntensity: 0.75,
    });
    applyPorcelainFinish(finish);
    return finish;
  }, []);
  const depth = useMemo(() => {
    const result = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    result.alphaHash = true;
    const coverage = { value: 1 };
    result.onBeforeCompile = shader => {
      shader.uniforms.ribbonCoverage = coverage;
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float ribbonCoverage;")
        .replace("#include <alphahash_fragment>", "diffuseColor.a = ribbonCoverage;\n#include <alphahash_fragment>");
    };
    result.customProgramCacheKey = () => "porcelain-ribbon-shadow-coverage";
    return { material: result, coverage };
  }, []);
  useEffect(() => () => sections.forEach(section => section.dispose()), [sections]);
  useEffect(() => () => { material.dispose(); depth.material.dispose(); }, [material, depth]);
  return <group name="porcelain-ribbon">{sections.map((geometry, index) =>
    <mesh key={index} geometry={geometry} material={material} castShadow receiveShadow
      customDepthMaterial={depth.material} onBeforeShadow={() => { depth.coverage.value = material.opacity; }} />
  )}</group>;
}
