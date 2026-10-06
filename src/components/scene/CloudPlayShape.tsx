"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RIBBON_CRUISE_SPEED, type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { type ControlEntrance } from "@/lib/controlEntrance";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createBeveledPlayShapeGeometry } from "@/lib/beveledPlayShape";
import { applyBrushedMetalFinish } from "@/lib/mineralFinish";
import type { SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";
import { createIntroIrisGeometry } from "@/lib/introIrisGeometry";
import { createIntroIrisMaterial } from "@/lib/introIrisMaterial";


export function CloudPlayShape({ playing, scale, active, ribbonMotion, entrance, atmosphere }: {
  playing: boolean;
  scale: number;
  active: boolean;
  ribbonMotion?: RefObject<RibbonMotionSnapshot>;
  entrance: RefObject<ControlEntrance>;
  atmosphere?: RefObject<SanctuaryAtmosphere>;
}) {
  const spinGroup = useRef<THREE.Group>(null);
  const spinAngle = useRef(0);
  const driftSpeed = useRef(0);
  const introMesh = useRef<THREE.Mesh>(null);
  const bodyMesh = useRef<THREE.Mesh>(null);
  const intro = useMemo(createIntroIrisMaterial, []);
  const pearl = useMemo(() => new THREE.Color("#f4f1e9"), []);
  const platinum = useMemo(() => new THREE.Color("#c4c8cd"), []);
  const reflectionTint = useMemo(() => new THREE.Color(1, 1, 1), []);
  const atmosphereTint = useMemo(() => new THREE.Color(), []);
  const directLightScale = useMemo(() => ({ value: 0.68 }), []);
  const reflections = useMemo(() => {
    const width = 256, height = 128;
    const data = new Float32Array(width * height * 4);
    // A luminous upper sky and a quieter cloud bounce separate the sculpture's
    // planes. One soft upper window supplies a reflective gradient; the lower
    // hemisphere keeps enough fill to read as silver rather than black paint.
    for (let y = 0; y < height; y++) {
      const latitude = y / height;
      const elevation = Math.sin((latitude - 0.5) * Math.PI);
      const sky = 0.44 + 0.32 * THREE.MathUtils.smoothstep(elevation, -0.12, 0.5);
      for (let x = 0; x < width; x++) {
        const longitude = x / width;
        const windowDistance = Math.min(Math.abs(longitude - 0.38), 1 - Math.abs(longitude - 0.38));
        const edgeDistance = Math.min(Math.abs(longitude - 0.76), 1 - Math.abs(longitude - 0.76));
        const window = 0.72 * Math.exp(-Math.pow(windowDistance / 0.10, 2)
          - Math.pow((latitude - 0.68) / 0.15, 2));
        const accent = 0.34 * Math.exp(-Math.pow(edgeDistance / 0.024, 2)
          - Math.pow((latitude - 0.56) / 0.19, 2));
        const light = sky + window + accent;
        const index = (y * width + x) * 4;
        data[index] = light * 0.98;
        data[index + 1] = light;
        data[index + 2] = light * 1.025;
        data[index + 3] = 1;
      }
    }
    const map = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    map.mapping = THREE.EquirectangularReflectionMapping;
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    return map;
  }, []);
  const bodyMaterial = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      name: "BrushedPlatinumControlStudy",
      color: "#c4c8cd", metalness: 1, roughness: 0.27,
      anisotropy: 0.42, clearcoat: 0, envMap: reflections, envMapIntensity: 0.84,
    });
    // The control's local geometry is much smaller than a door. Keep the
    // brush at a comparable world scale instead of drawing coarse bands.
    applyBrushedMetalFinish(material, 0.025, 7200);
    // Face brushing and polished chamfers are distinct physical surfaces.
    const previousCompile = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.customProgramCacheKey = () => `${previousKey}:polished-control-bevel-v3`;
    material.onBeforeCompile = (shader, renderer) => {
      previousCompile.call(material, shader, renderer);
      shader.uniforms.controlReflectionTint = { value: reflectionTint };
      shader.uniforms.controlDirectLightScale = directLightScale;
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nattribute float metalBevel;\nvarying float vMetalBevel;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMetalBevel = metalBevel;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vMetalBevel;\nuniform float controlDirectLightScale;")
        .replace("#include <lights_physical_fragment>", "roughnessFactor *= mix(1.0, 0.38, vMetalBevel);\n#include <lights_physical_fragment>")
        // The scene's large studio softbox is sized for the ribbon. Reduce
        // its direct specular gain on this small sculpture so a single plane
        // retains silver tone instead of clipping white, especially at night.
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\nreflectedLight.directSpecular *= controlDirectLightScale;")
        .replace("#include <envmap_physical_pars_fragment>", "uniform vec3 controlReflectionTint;\n"
          + THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll("* envMapIntensity", "* envMapIntensity * controlReflectionTint"));
    };
    return material;
  }, [reflections, reflectionTint, directLightScale]);
  const spinAxis = useMemo(() => new THREE.Vector3(0.25, 1, 0.12).normalize(), []);
  const shape = useMemo(createBeveledPlayShapeGeometry, []);
  const iris = useMemo(() => {
    const target = createBeveledPlayShapeGeometry();
    const geometry = createIntroIrisGeometry(target.geometry, 0.29 / scale);
    target.geometry.dispose();
    return geometry;
  }, [scale]);
  const progress = useRef(0);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reducedMotion.current = query.matches; };
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => () => {
    shape.geometry.dispose(); bodyMaterial.dispose();
  }, [shape, bodyMaterial]);
  useEffect(() => () => iris.dispose(), [iris]);
  useEffect(() => () => intro.material.dispose(), [intro]);
  useEffect(() => () => reflections.dispose(), [reflections]);
  useFrame((_, dt) => {
    const mood = atmosphere?.current;
    bodyMaterial.envMapIntensity = mood ? 0.84 * mood.daylight + 0.65 * mood.dusk + 0.36 * mood.night : 0.84;
    directLightScale.value = mood ? 0.68 * mood.daylight + 0.48 * mood.dusk + 0.28 * mood.night : 0.68;
    reflectionTint.setRGB(1, 1, 1);
    if (mood) reflectionTint.lerp(atmosphereTint.setRGB(...mood.reflectionTint), 0.28 + 0.24 * mood.night);
    const p = entrance.current;
    const forming = p.shapeMorph < 1;
    // Keep the full entrance turns, then let the settled sculpture sway within
    // its three-quarter pose. Integrated phase changes speed smoothly without
    // drifting into a face-on silhouette or snapping after a long session.
    if (active && !reducedMotion.current) {
      const ribbonSpeed = Math.abs(ribbonMotion?.current.velocity ?? 0);
      const spinSpeed = 0.045 + 0.025 * ribbonSpeed / RIBBON_CRUISE_SPEED;
      driftSpeed.current = THREE.MathUtils.damp(driftSpeed.current, spinSpeed, 0.8, Math.min(dt, 0.05));
      spinAngle.current += Math.min(dt, 0.05) * driftSpeed.current;
    }
    if (spinGroup.current) {
      spinGroup.current.scale.setScalar(scale);
      const idleSway = Math.sin(spinAngle.current) * 0.26;
      spinGroup.current.quaternion.setFromAxisAngle(spinAxis, reducedMotion.current ? 0 : entrance.current.turn + idleSway);
    }
    if (introMesh.current) {
      introMesh.current.visible = forming;
      if (introMesh.current.morphTargetInfluences) introMesh.current.morphTargetInfluences[0] = p.shapeMorph;
    }
    if (bodyMesh.current) bodyMesh.current.visible = !forming;
    setLocalMaterialOpacity(intro.material, p.reveal);
    intro.material.color.copy(pearl).lerp(platinum, p.shapeMorph);
    intro.material.metalness = THREE.MathUtils.lerp(0.08, 1, p.shapeMorph);
    intro.material.roughness = THREE.MathUtils.lerp(0.22, 0.27, p.shapeMorph);
    intro.material.clearcoat = 1 - p.shapeMorph;
    intro.detail.value = 1 - THREE.MathUtils.smoothstep(p.shapeMorph, 0, 0.65);
    // Finish the iris-to-tetrahedron before responding to an early audio click.
    const target = playing && !forming ? 1 : 0;
    if (progress.current === target) return;
    const next = reducedMotion.current ? target : THREE.MathUtils.damp(progress.current, target, 5.5, Math.min(dt, 0.05));
    progress.current = Math.abs(target - next) < 0.001 ? target : next;
    shape.update(progress.current);
  });
  return <group ref={spinGroup} scale={scale}>
    <mesh ref={introMesh} args={[iris]} material={intro.material} />
    <mesh ref={bodyMesh} geometry={shape.geometry} material={bodyMaterial} visible={false} />
  </group>;
}
