"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SanctuaryProject } from "@/lib/sanctuaryContent";
import type { DoorStudy } from "@/lib/doorStudies";
import { interactiveMeshRaycast } from "@/lib/interactiveMeshRaycast";
import { GlassDoor } from "./GlassDoor";
import { ProjectSculpture } from "./ProjectSculpture";

export function ProjectArtifact({ study, project, selected, enabled, onSelect, compact, dimmed, maskId }: {
  study: DoorStudy; project: SanctuaryProject; selected: boolean; enabled: boolean; compact: boolean; dimmed: boolean; onSelect: () => void; maskId: number;
}) {
  const visibility = useRef(1);
  const sculpture = useRef<THREE.Group>(null);
  const openingProgress = useRef(0);
  const hovered = useRef(false);
  const pointerStart = useRef<[number, number] | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const scaleTarget = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  useFrame(({ camera }, dt) => {
    if (!sculpture.current) return;
    const target = hovered.current || selected ? 1.055 : 1;
    sculpture.current.scale.lerp(scaleTarget.setScalar(target), 1 - Math.exp(-8 * dt));
    visibility.current = THREE.MathUtils.damp(visibility.current, dimmed ? 0 : 1, 6, Math.min(dt, 0.05));
    sculpture.current.visible = visibility.current > 0.015;
    if (button.current) {
      sculpture.current.getWorldPosition(projected).project(camera);
      button.current.hidden = dimmed || projected.y > (compact && !selected ? 0.55 : 0.9) || projected.y < -0.84 || Math.abs(projected.x) > 0.88 || projected.z > 1;
    }
  });
  function activate(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (!enabled || !pointerStart.current) return;
    const distance = Math.hypot(e.clientX - pointerStart.current[0], e.clientY - pointerStart.current[1]);
    if (distance < 8) onSelect();
    pointerStart.current = null;
  }
  return (
    <group scale={compact ? 0.78 : 1}>
      <group ref={sculpture}>
        <GlassDoor study={study} amount={selected ? 1 : 0} opening="dissolve" dimmed={dimmed} openingProgress={openingProgress} />
        <Suspense fallback={null}>
          <ProjectSculpture study={study} project={project} openingProgress={openingProgress} maskId={maskId} />
        </Suspense>
      </group>
      <mesh position={[0, 1.7, 0]}
        raycast={interactiveMeshRaycast(enabled)}
        onPointerDown={(e) => { if (enabled) { e.stopPropagation(); pointerStart.current = [e.clientX, e.clientY]; } }}
        onClick={activate}
        onPointerOver={() => { if (enabled) { hovered.current = true; document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { hovered.current = false; document.body.style.cursor = ""; }}>
        <boxGeometry args={[2.7, 3.5, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center position={[0, -0.38, 0.8]} distanceFactor={20} zIndexRange={[20, 0]} style={{ pointerEvents: enabled ? "auto" : "none" }}>
        <button ref={button} className={`artifact-label${selected ? " is-selected" : ""}`} onClick={onSelect} disabled={!enabled} aria-label={`${study.number} ${study.name} — explore ${project.title}`} />
      </Html>
    </group>
  );
}
