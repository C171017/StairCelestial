"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RIBBON_CRUISE_SPEED, type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { type ControlEntrance } from "@/lib/controlEntrance";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createPlayShapeGeometry } from "@/lib/playShapeGeometry";
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
  const intro = useMemo(() => {
    const iris = createIntroIrisMaterial();
    const monochrome = { value: 0 };
    const finishBlend = { value: 0 };
    const compile = iris.material.onBeforeCompile;
    iris.material.onBeforeCompile = (shader, renderer) => {
      compile.call(iris.material, shader, renderer);
      shader.uniforms.uMonochrome = monochrome;
      shader.uniforms.uFinishBlend = finishBlend;
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uMonochrome;\nuniform float uFinishBlend;")
        .replace("#include <dithering_fragment>", `
          #include <dithering_fragment>
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(uMonochrome), uFinishBlend);
        `);
    };
    iris.material.customProgramCacheKey = () => "intro-iris-monochrome-v1";
    return { ...iris, monochrome, finishBlend };
  }, []);
  const bodyMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    name: "DayNightMonochromeControl",
    color: "#000000",
    // Exact black/white endpoints must stay independent of colored lights,
    // reflections, exposure, and atmospheric fog.
    toneMapped: false,
    fog: false,
  }), []);
  const spinAxis = useMemo(() => new THREE.Vector3(0.25, 1, 0.12).normalize(), []);
  const shape = useMemo(createPlayShapeGeometry, []);
  const iris = useMemo(() => {
    const target = createPlayShapeGeometry();
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
  useFrame((_, dt) => {
    const phase = atmosphere?.current.solarPhase ?? 0;
    // Noon -> midnight -> noon, with zero slope at both pure endpoints.
    const shade = (1 - Math.cos(phase)) / 2;
    bodyMaterial.color.setRGB(shade, shade, shade, THREE.SRGBColorSpace);
    intro.monochrome.value = shade;
    const p = entrance.current;
    intro.finishBlend.value = THREE.MathUtils.smoothstep(p.shapeMorph, 0.65, 1);
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
    intro.material.metalness = THREE.MathUtils.lerp(0.08, 1, p.shapeMorph);
    intro.material.roughness = THREE.MathUtils.lerp(0.22, 0.045, p.shapeMorph);
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
