import * as THREE from "three";
import palette from "@/lib/doorPalette.json";
import type { DoorStudy } from "@/lib/doorStudies";
import type { SceneMoodState } from "@/lib/sceneMood";

const paneColors: Record<DoorStudy["id"], string> = {
  melt: "#bd966d", seed: "#79ad9c", fault: "#839fb9",
  hourglass: "#b5829c", cloud: "#c4b17f", orbit: "#a393bb",
};
const dayInsetLight = new THREE.Color(palette.light);
const nightInsetLight = new THREE.Color("#ffcf95");

/** Instance-owned materials keep each door's entrance and dissolve independent. */
export function createDoorMaterials(study: DoorStudy) {
  const slabColor = new THREE.Color(paneColors[study.id]);
  const ceramic = new THREE.MeshPhysicalMaterial({
    name: `WarmPolishedCeramic_${study.id}`,
    // Almost neutral shells share the scene's warm/cool light. The project
    // identity lives in the cast pane, rather than a uniformly colored frame.
    color: new THREE.Color("#e9e2d5").lerp(new THREE.Color(palette.doors[study.id].color), 0.055),
    metalness: 0.17,
    roughness: 0.22,
    clearcoat: 0.74,
    clearcoatRoughness: 0.105,
    ior: 1.5,
    iridescence: 0.025,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [240, 340],
    envMapIntensity: 1.04,
  });
  const gold = new THREE.MeshStandardMaterial({
    name: "ChampagneGold",
    color: "#c0aa87",
    metalness: 1,
    roughness: 0.19,
    envMapIntensity: 1.22,
  });
  const light = new THREE.MeshStandardMaterial({
    name: "WarmInnerLight",
    color: palette.light,
    emissive: palette.light,
    emissiveIntensity: 0.2,
    metalness: 0.42,
    roughness: 0.23,
    envMapIntensity: 0.85,
  });
  // The inset is a reflective, recessed line with a quiet light source near
  // its base. Avoid outlining every silhouette with an equally bright halo.
  light.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vDoorLightPosition;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vDoorLightPosition = position;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vDoorLightPosition;
    `).replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
      float lowerGlow = 1.0 - smoothstep(0.12, 1.9, vDoorLightPosition.y);
      totalEmissiveRadiance *= 0.035 + 0.965 * lowerGlow * lowerGlow;
    `);
  };
  light.customProgramCacheKey = () => "crystal-door-recess-v2";
  const glass = new THREE.MeshPhysicalMaterial({
    name: `SmokedCastGlassLeaf_${study.id}`,
    color: slabColor,
    transmission: 0.8,
    // A visible surface contribution is essential: full transmission combined
    // with low alpha made the leaf read as an empty hole. Keep alpha blending
    // for overlapping ribbon turns; opaque depth writes would cut them out.
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    roughness: 0.11,
    thickness: 0.34,
    ior: 1.51,
    attenuationColor: slabColor,
    attenuationDistance: 1.35,
    envMapIntensity: 1.45,
    clearcoat: 1,
    clearcoatRoughness: 0.055,
    side: THREE.FrontSide,
  });
  // A very shallow cast-glass undulation bends the reflected light without
  // animating the slab or replacing its physical transmission with an image.
  glass.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vCastPosition;
      varying vec3 vCastAxisX;
      varying vec3 vCastAxisY;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vCastPosition = position;
      vCastAxisX = normalMatrix * vec3(1.0, 0.0, 0.0);
      vCastAxisY = normalMatrix * vec3(0.0, 1.0, 0.0);
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vCastPosition;
      varying vec3 vCastAxisX;
      varying vec3 vCastAxisY;
    `).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      vec3 castPerturbation = normalize(vCastAxisX) * sin(vCastPosition.y * 2.2 + vCastPosition.x * 1.3) * 0.045
        + normalize(vCastAxisY) * cos(vCastPosition.x * 2.8 - vCastPosition.y * 0.8) * 0.024;
      normal = normalize(normal + castPerturbation * faceDirection);
    `).replace("#include <clearcoat_normal_fragment_begin>", `#include <clearcoat_normal_fragment_begin>
      #ifdef USE_CLEARCOAT
        clearcoatNormal = normalize(clearcoatNormal + castPerturbation * 0.7 * faceDirection);
      #endif
    `);
  };
  glass.customProgramCacheKey = () => "smoked-cast-glass-v2";
  // A polished rim reflects light independently of the frosted pane. This
  // uses the existing thin edge mesh and travels/dissolves with the leaf.
  const glassEdge = new THREE.MeshPhysicalMaterial({
    name: "PolishedGlassBoundary",
    color: slabColor.clone().lerp(new THREE.Color("#e6e6e0"), 0.54),
    metalness: 0.4,
    roughness: 0.075,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  });
  return { ceramic, gold, light, glass, glassEdge };
}

/** Keep each finish responsive to the same continuous sky/light clock. */
export function updateDoorMaterials(finishes: ReturnType<typeof createDoorMaterials>, mood: SceneMoodState) {
  finishes.ceramic.envMapIntensity = 1.04 + mood.sunset * 0.16 + mood.night * 0.12;
  finishes.gold.envMapIntensity = 1.2 + mood.sunset * 0.18;
  finishes.glass.envMapIntensity = 1.4 + mood.sunset * 0.22 + mood.night * 0.16;
  finishes.glassEdge.envMapIntensity = 1.3 + mood.sunset * 0.2;
  finishes.light.emissive.copy(dayInsetLight).lerp(nightInsetLight, mood.night);
  // This source is only a 0.01-unit inset. At night it needs enough radiance
  // to remain legible below a pixel, concentrated at the foot by the shader.
  finishes.light.emissiveIntensity = 0.13 + mood.sunset * 0.25 + mood.night * 1.67;
}
