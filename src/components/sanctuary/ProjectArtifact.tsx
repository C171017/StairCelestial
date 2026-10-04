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
  const sculpture = useRef<THREE.Group>(null);
  const pointerStart = useRef<[number, number] | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  useFrame(({ camera }) => {
    if (!sculpture.current) return;
    // The frame and interior each finish their own fade. Hiding this parent
    // when another door is selected would cut off the interior's longer exit.
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
    <group>
      <group ref={sculpture}>
        <GlassDoor study={study} amount={selected ? 1 : 0} dimmed={dimmed} />
        <Suspense fallback={null}>
          <ProjectSculpture study={study} project={project} selected={selected} maskId={maskId} />
        </Suspense>
      </group>
      <mesh position={[0, 1.7, 0]}
        raycast={interactiveMeshRaycast(enabled)}
        onPointerDown={(e) => { if (enabled) { e.stopPropagation(); pointerStart.current = [e.clientX, e.clientY]; } }}
        onClick={activate}
        onPointerOver={() => { if (enabled) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}>
        <boxGeometry args={[2.7, 3.5, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center position={[0, -0.38, 0.8]} distanceFactor={20} zIndexRange={[20, 0]} style={{ pointerEvents: enabled ? "auto" : "none" }}>
        <button ref={button} className={`artifact-label${selected ? " is-selected" : ""}`} onClick={onSelect} disabled={!enabled} aria-label={`${study.number} ${study.name} — explore ${project.title}`} />
      </Html>
    </group>
  );
}
