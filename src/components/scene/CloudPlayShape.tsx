"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RIBBON_CRUISE_SPEED, type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { CONTROL_SHAPE_FORMED_SECONDS, type ControlEntrance } from "@/lib/controlEntrance";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createPlayShapeGeometry } from "@/lib/playShapeGeometry";
import { createIntroIrisGeometry } from "@/lib/introIrisGeometry";
import { createIntroIrisMaterial } from "@/lib/introIrisMaterial";


export function CloudPlayShape({ playing, scale, active, ribbonMotion, entrance }: {
  playing: boolean;
  scale: number;
  active: boolean;
  ribbonMotion?: RefObject<RibbonMotionSnapshot>;
  entrance: RefObject<ControlEntrance>;
}) {
  const spinGroup = useRef<THREE.Group>(null);
  const spinAngle = useRef(0);
  const driftSpeed = useRef(0);
  const bodyMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const introMesh = useRef<THREE.Mesh>(null);
  const bodyMesh = useRef<THREE.Mesh>(null);
  const intro = useMemo(createIntroIrisMaterial, []);
  const pearl = useMemo(() => new THREE.Color("#f4f1e9"), []);
  const obsidian = useMemo(() => new THREE.Color("#080a0d"), []);
  const spinAxis = useMemo(() => new THREE.Vector3(0.25, 1, 0.12).normalize(), []);
  const shape = useMemo(createPlayShapeGeometry, []);
  const iris = useMemo(() => {
    const target = createPlayShapeGeometry();
    const geometry = createIntroIrisGeometry(target.geometry, 0.29 / scale);
    target.geometry.dispose();
    return geometry;
  }, [scale]);
  const progress = useRef(0);
  const edges = useMemo(() => new THREE.LineSegments(
    new THREE.EdgesGeometry(shape.geometry, 20),
    new THREE.LineBasicMaterial({ color: "#bcc8d2", transparent: true, opacity: 0.22, depthWrite: false }),
  ), [shape]);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reducedMotion.current = query.matches; };
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => () => {
    shape.geometry.dispose(); edges.geometry.dispose(); edges.material.dispose();
  }, [shape, edges]);
  useEffect(() => () => iris.dispose(), [iris]);
  useEffect(() => () => intro.material.dispose(), [intro]);
  useFrame((_, dt) => {
    const p = entrance.current;
    const forming = p.shapeMorph < 1;
    // Integrate speed so ribbon acceleration never causes a jump in orientation.
    // The base spin continues even when the ribbon settles to a stop.
    if (active && !reducedMotion.current) {
      const ribbonSpeed = Math.abs(ribbonMotion?.current.velocity ?? 0);
      const spinSpeed = 0.045 + 0.025 * ribbonSpeed / RIBBON_CRUISE_SPEED;
      driftSpeed.current = THREE.MathUtils.damp(driftSpeed.current, spinSpeed, 0.8, Math.min(dt, 0.05));
      spinAngle.current += Math.min(dt, 0.05) * driftSpeed.current;
    }
    if (spinGroup.current) {
      spinGroup.current.scale.setScalar(scale);
      spinGroup.current.quaternion.setFromAxisAngle(spinAxis, reducedMotion.current ? 0 : entrance.current.turn + spinAngle.current);
    }
    if (introMesh.current) {
      introMesh.current.visible = forming;
      if (introMesh.current.morphTargetInfluences) introMesh.current.morphTargetInfluences[0] = p.shapeMorph;
    }
    if (bodyMesh.current) bodyMesh.current.visible = !forming;
    setLocalMaterialOpacity(intro.material, p.reveal);
    intro.material.color.copy(pearl).lerp(obsidian, p.shapeMorph);
    intro.material.metalness = THREE.MathUtils.lerp(0.08, 0.35, p.shapeMorph);
    intro.material.roughness = THREE.MathUtils.lerp(0.22, 0.14, p.shapeMorph);
    intro.detail.value = 1 - THREE.MathUtils.smoothstep(p.shapeMorph, 0, 0.65);
    edges.material.opacity = reducedMotion.current ? 0.22
      : 0.22 * THREE.MathUtils.smoothstep(p.elapsed, CONTROL_SHAPE_FORMED_SECONDS, CONTROL_SHAPE_FORMED_SECONDS + 0.4);
    // Finish the iris-to-tetrahedron before responding to an early audio click.
    const target = playing && !forming ? 1 : 0;
    if (progress.current === target) return;
    const next = reducedMotion.current ? target : THREE.MathUtils.damp(progress.current, target, 5.5, Math.min(dt, 0.05));
    progress.current = Math.abs(target - next) < 0.001 ? target : next;
    shape.update(progress.current);
    edges.geometry.dispose();
    edges.geometry = new THREE.EdgesGeometry(shape.geometry, 20);
  });
  return <group ref={spinGroup} scale={scale}>
    <mesh ref={introMesh} args={[iris]} material={intro.material} />
    <mesh ref={bodyMesh} geometry={shape.geometry} visible={false}>
      <meshPhysicalMaterial ref={bodyMaterial} color="#080a0d"
        metalness={0.35} roughness={0.14} clearcoat={1} clearcoatRoughness={0.055}
        envMapIntensity={1.8} depthTest depthWrite
        flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
    <primitive object={edges} />
  </group>;
}
