"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SanctuaryProject } from "@/lib/sanctuaryContent";
import type { DoorStudy } from "@/lib/doorStudies";
import { createPortalOcclusionProbe, portalOcclusionVisibility, portalViewportVisibility } from "@/lib/portalPresentation";
import { GlassDoor } from "./GlassDoor";
import { ProjectSculpture } from "./ProjectSculpture";

export function ProjectArtifact({ study, project, selected, enabled, onSelect, compact, dimmed, maskId, focusSide = 1, presentation }: {
  focusSide?: 1 | -1;
  study: DoorStudy; project: SanctuaryProject; selected: boolean; enabled: boolean; compact: boolean; dimmed: boolean; onSelect: () => void; maskId: number;
  presentation?: { obstacle: THREE.Object3D; root: RefObject<THREE.Group | null>; samples: THREE.Vector3[] };
}) {
  const sculpture = useRef<THREE.Group>(null);
  const pointerStart = useRef<[number, number] | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const cameraLocal = useMemo(() => new THREE.Vector3(), []);
  const localToClip = useMemo(() => new THREE.Matrix4(), []);
  const measureOcclusion = useMemo(createPortalOcclusionProbe, []);
  const presentationVisibility = useRef(presentation ? 0 : 1);
  const visibilityProgress = useRef(presentation ? 0 : 1);
  const canInteract = useRef(false);
  const hovered = useRef(false);
  const sampleFrame = useRef(maskId % 5);
  const presentationRaycast = useCallback<THREE.Mesh["raycast"]>(function (this: THREE.Mesh, raycaster, hits) {
    if (canInteract.current) THREE.Mesh.prototype.raycast.call(this, raycaster, hits);
  }, []);
  useEffect(() => () => { document.body.style.cursor = ""; }, []);
  useFrame(({ camera }) => {
    if (!sculpture.current) return;
    const root = presentation?.root.current;
    if (selected || !presentation) presentationVisibility.current = 1;
    else if (root && sampleFrame.current++ % 5 === 0) {
      root.updateWorldMatrix(true, false);
      camera.getWorldPosition(cameraLocal); root.worldToLocal(cameraLocal);
      localToClip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(root.matrixWorld);
      const edge = portalViewportVisibility(presentation.samples, localToClip);
      presentationVisibility.current = edge > 0
        ? edge * portalOcclusionVisibility(measureOcclusion(presentation.obstacle, cameraLocal, presentation.samples), compact) : 0;
    }
    canInteract.current = enabled && visibilityProgress.current > 0.35 && presentationVisibility.current > 0.2;
    if (!canInteract.current) {
      pointerStart.current = null;
      if (hovered.current) { hovered.current = false; document.body.style.cursor = ""; }
    }
    // The frame and interior each finish their own fade. Hiding this parent
    // when another door is selected would cut off the interior's longer exit.
    if (button.current) {
      sculpture.current.getWorldPosition(projected).project(camera);
      button.current.disabled = !canInteract.current;
      button.current.hidden = !canInteract.current || dimmed || projected.y > (compact && !selected ? 0.55 : 0.9) || projected.y < -0.84 || Math.abs(projected.x) > 0.88 || projected.z > 1;
    }
  }, -0.4);
  function activate(e: ThreeEvent<MouseEvent>) {
    if (!canInteract.current || !pointerStart.current) return;
    e.stopPropagation();
    const distance = Math.hypot(e.clientX - pointerStart.current[0], e.clientY - pointerStart.current[1]);
    if (distance < 8) onSelect();
    pointerStart.current = null;
  }
  return (
    <group>
      <group ref={sculpture}>
        <GlassDoor study={study} amount={selected ? 1 : 0} dimmed={dimmed}
          presentationVisibility={presentationVisibility} visibilityProgress={visibilityProgress} />
        <Suspense fallback={null}>
          <ProjectSculpture focusSide={focusSide} study={study} project={project} selected={selected} maskId={maskId} />
        </Suspense>
      </group>
      <mesh position={[0, 1.7, 0]}
        raycast={presentationRaycast}
        onPointerDown={(e) => { if (canInteract.current) { e.stopPropagation(); pointerStart.current = [e.clientX, e.clientY]; } }}
        onClick={activate}
        onPointerOver={() => { if (canInteract.current) { hovered.current = true; document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { hovered.current = false; document.body.style.cursor = ""; }}>
        <boxGeometry args={[2.7, 3.5, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center position={[0, -0.38, 0.8]} distanceFactor={20} zIndexRange={[20, 0]} style={{ pointerEvents: enabled ? "auto" : "none" }}>
        <button ref={button} className={`artifact-label${selected ? " is-selected" : ""}`} onClick={() => { if (canInteract.current) onSelect(); }} disabled={!enabled} aria-label={`${study.number} ${study.name} — explore ${project.title}`} />
      </Html>
    </group>
  );
}
