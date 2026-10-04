import * as THREE from "three";
import palette from "@/lib/doorPalette.json";
import type { DoorStudy } from "@/lib/doorStudies";
import { applyCastGlassFinish, applyPorcelainFinish } from "@/lib/porcelainFinish";

/** Instance-owned materials keep each door's entrance and dissolve independent. */
export function createDoorMaterials(study: DoorStudy) {
  const slabColor = new THREE.Color(palette.doors[study.id].slabColor);
  const ceramic = new THREE.MeshPhysicalMaterial({
    name: `PearlCeramic_${study.id}`,
    color: new THREE.Color("#f0e6d7").lerp(new THREE.Color(palette.doors[study.id].color), 0.08),
    metalness: 0,
    roughness: 0.32,
    clearcoat: 0.3,
    clearcoatRoughness: 0.22,
    ior: 1.48,
    envMapIntensity: 0.9,
  });
  applyPorcelainFinish(ceramic);
  const gold = new THREE.MeshStandardMaterial({
    name: "ChampagneGold",
    color: "#c4a46a",
    metalness: 1,
    roughness: 0.19,
    envMapIntensity: 1.4,
  });
  const light = new THREE.MeshStandardMaterial({
    name: "WarmInnerLight",
    color: palette.light,
    emissive: palette.light,
    emissiveIntensity: 0.32,
    roughness: 0.34,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    name: `CastGlassLeaf_${study.id}`,
    // A thin reflective backing keeps a quiet cloud reflection visible even
    // when the transmitted background is plain sky. This is deliberately a
    // partially silvered art-glass finish, rather than opaque colored enamel.
    color: slabColor.clone().lerp(new THREE.Color("#ffffff"), 0.64),
    metalness: 0.24,
    transmission: 0.76,
    // A visible surface contribution is essential: full transmission combined
    // with low alpha made the leaf read as an empty hole. Keep alpha blending
    // for overlapping ribbon turns; opaque depth writes would cut them out.
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    roughness: 0.085,
    thickness: 0.38,
    ior: 1.5,
    attenuationColor: slabColor,
    attenuationDistance: 0.75,
    envMapIntensity: 1.45,
    clearcoat: 0.4,
    clearcoatRoughness: 0.085,
    side: THREE.FrontSide,
  });
  applyCastGlassFinish(glass);
  // A polished rim reflects light independently of the frosted pane. This
  // uses the existing thin edge mesh and travels/dissolves with the leaf.
  const glassEdge = new THREE.MeshPhysicalMaterial({
    name: "PolishedGlassBoundary",
    color: slabColor.clone().lerp(new THREE.Color("#ffffff"), 0.5),
    metalness: 0.16,
    roughness: 0.065,
    clearcoat: 0.65,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  return { ceramic, gold, light, glass, glassEdge };
}
