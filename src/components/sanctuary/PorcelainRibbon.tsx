"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { createRibbonSections, RIBBON_PITCH } from "@/lib/ribbonGeometry";
import { applyMineralFinish, applyFinishEnvironment } from "@/lib/mineralFinish";
import { useStoneTextures } from "./useStoneTextures";

/** Softly polished white marble with mineral detail beneath a quiet reflection. */
export function PorcelainRibbon({ radius, width, cycle = 0 }: { radius: number; width: number; cycle?: number }) {
  const textures = useStoneTextures();
  const stoneOffset = useMemo(() => new THREE.Vector3(), []);
  useLayoutEffect(() => { stoneOffset.y = cycle * RIBBON_PITCH; }, [cycle, stoneOffset]);
  const sections = useMemo(() => createRibbonSections(radius, width), [radius, width]);
  const material = useMemo(() => {
    const finish = new THREE.MeshPhysicalMaterial({
      name: "SoftPolishedWhiteMarbleRibbon", color: "#eeeee9",
      roughness: 0.22, metalness: 0, ior: 1.54,
      clearcoat: 0,
      envMapIntensity: 0.95,
    });
    applyMineralFinish(finish, textures, { scale: 0.045, contrast: 1.65, relief: 0.00022, polishVariation: 0.065, offset: stoneOffset });
    applyFinishEnvironment(finish);
    return finish;
  }, [textures, stoneOffset]);
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
