"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createRibbonSections } from "@/lib/ribbonGeometry";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createRibbonShadows, type RibbonDoorShadow } from "./ribbonShadows";
import { useSceneMood } from "./SceneMood";

const DAY_GLASS = new THREE.Color("#fafcff");
const SUNSET_GLASS = new THREE.Color("#f5f6fa");
const NIGHT_GLASS = new THREE.Color("#eaf1ff");
const DAY_ABSORPTION = new THREE.Color("#7897ab");
const SUNSET_ABSORPTION = new THREE.Color("#77859e");
const NIGHT_ABSORPTION = new THREE.Color("#526f99");

/** A solid swept crystal section, rather than a surface with luminous rails.
 * The narrow bevel and polished sidewalls supply their own view-dependent
 * highlights through the same physical lighting used by the broad surface.
 */
export function GlassRibbon({ radius, width, focused, doorShadows }: { radius: number; width: number; focused: boolean; doorShadows: RibbonDoorShadow[] }) {
  const mood = useSceneMood();
  const localOpacity = useRef(0.89);
  const shadows = useMemo(createRibbonShadows, []);
  const material = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: SUNSET_GLASS, roughness: 0.058, metalness: 0,
      transmission: 0.97, thickness: 0.3, ior: 1.43,
      envMapIntensity: 1.8, specularIntensity: 1,
      transparent: true, opacity: 0.89, depthWrite: false,
      clearcoat: 0.28, clearcoatRoughness: 0.045,
      attenuationColor: SUNSET_ABSORPTION, attenuationDistance: 3.6,
      dispersion: 0.13,
    });
    material.name = "Smoked crystal ribbon";
    material.onBeforeCompile = shader => {
      shadows.onBeforeCompile(shader);
      // Neutral glass leaves the refracted sky intact. Smoke comes from
      // optical absorption; tinting baseColor blue would multiply that sky
      // twice and turn the entire top into a flat navy sheet.
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
        // The polished sidewalls catch stronger highlights than the large
        // anti-reflective face. This response still uses the actual normal,
        // view and HDR environment: no luminous stroke follows the outline.
        material.ior = mix(1.66, 1.43, vRibbonFace);
        material.specularColor = mix(vec3(0.0616), vec3(0.0313), vRibbonFace);
        material.clearcoat = mix(0.82, 0.28, vRibbonFace);
      `);
      // Three's standard transmission accepts one thickness for the whole
      // object. These broad top faces and narrow sidewalls have very different
      // optical paths; deepen the side absorption without painting a dark rim.
      shader.fragmentShader = shader.fragmentShader.replace("#include <transmission_fragment>",
        THREE.ShaderChunk.transmission_fragment.replace("material.thickness = thickness;",
          "material.thickness = thickness * mix(3.6, 1.0, vRibbonFace);"));
      shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor *= mix(0.58, 1.0, vRibbonFace);");
    };
    material.customProgramCacheKey = () => "smoked-crystal-ribbon-v4";
    return material;
  }, [shadows]);
  const sections = useMemo(() => createRibbonSections(radius, width), [radius, width]);
  useEffect(() => () => sections.forEach(section => section.dispose()), [sections]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, dt) => {
    const { day, sunset, night } = mood.current;
    // Every component follows the same stable travel coordinate. None of this
    // color evolution depends on the recycled ribbon geometry or door IDs.
    material.color.copy(SUNSET_GLASS).lerp(DAY_GLASS, day).lerp(NIGHT_GLASS, night);
    material.attenuationColor.copy(SUNSET_ABSORPTION).lerp(DAY_ABSORPTION, day).lerp(NIGHT_ABSORPTION, night);
    material.envMapIntensity = 1.7 * day + 1.9 * sunset + 2.0 * night;
    shadows.warmth.value = 0.45 * day + 0.9 * sunset + 0.72 * night;
    shadows.origins.value.forEach((origin, index) => {
      const door = doorShadows[index];
      const pose = shadows.poses.value[index];
      if (!door) { pose.y = 0; return; }
      origin.set(door.position.x, door.position.y, door.position.z, door.scale);
      pose.x = door.yaw;
      pose.y = THREE.MathUtils.damp(pose.y, door.visible ? 1 : 0, 6, Math.min(dt, 0.05));
    });
    localOpacity.current = THREE.MathUtils.damp(localOpacity.current, focused ? 0.23 : 0.89, 5, Math.min(dt, 0.05));
    setLocalMaterialOpacity(material, localOpacity.current);
  });
  return <group>{sections.map((geometry, index) => <mesh key={index} geometry={geometry} material={material} />)}</group>;
}
