import * as THREE from "three";
import palette from "@/lib/doorPalette.json";
import type { DoorStudy } from "@/lib/doorStudies";

/** Instance-owned materials keep each door's entrance and dissolve independent. */
export function createDoorMaterials(study: DoorStudy) {
  const ceramic = new THREE.MeshPhysicalMaterial({
    name: `PearlCeramic_${study.id}`,
    color: palette.doors[study.id].color,
    metalness: 0,
    roughness: 0.25,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
    ior: 1.48,
    iridescence: 0.055,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [240, 340],
    envMapIntensity: 0.85,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: "ChampagneGold",
    color: palette.gold,
    metalness: 1,
    roughness: 0.27,
    envMapIntensity: 1.15,
  });
  const light = new THREE.MeshStandardMaterial({
    name: "WarmInnerLight",
    color: palette.light,
    emissive: palette.light,
    emissiveIntensity: 2.5,
    roughness: 0.45,
    toneMapped: false,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    name: "LavenderFrostedGlassLeaf",
    // A restrained lavender filter separates the doorway from the clear,
    // blue-white ribbon. Keep this treatment local to the moving glass leaf.
    color: "#d0c9e7",
    transmission: 0.72,
    // A visible surface contribution is essential: full transmission combined
    // with low alpha made the leaf read as an empty hole. Keep alpha blending
    // for overlapping ribbon turns; opaque depth writes would cut them out.
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    roughness: 0.28,
    thickness: 0.2,
    ior: 1.46,
    attenuationColor: "#b7b0df",
    attenuationDistance: 0.85,
    envMapIntensity: 0.95,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12,
    side: THREE.FrontSide,
  });
  // A polished rim reflects light independently of the frosted pane. This
  // uses the existing thin edge mesh and travels/dissolves with the leaf.
  const glassEdge = new THREE.MeshPhysicalMaterial({
    name: "PolishedGlassBoundary",
    color: "#e4dff5",
    metalness: 0.18,
    roughness: 0.09,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  return { ceramic, gold, light, glass, glassEdge };
}
