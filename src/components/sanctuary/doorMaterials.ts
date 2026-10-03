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
    name: "ClearGlassLeaf",
    color: "#ffffff",
    transmission: 1,
    // Preserve the site's light glass treatment when several transparent
    // doors and ribbon turns overlap in the screen-space transmission pass.
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    roughness: 0.055,
    thickness: 0.09,
    ior: 1.46,
    attenuationColor: "#f0f7f8",
    attenuationDistance: 6,
    envMapIntensity: 0.75,
    side: THREE.FrontSide,
  });
  return { ceramic, gold, light, glass };
}
