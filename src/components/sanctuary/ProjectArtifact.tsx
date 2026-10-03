"use client";

import { Html, useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SanctuaryProject } from "@/lib/sanctuaryContent";

export function ProjectArtifact({ project, selected, enabled, onSelect, compact, dimmed }: {
  project: SanctuaryProject; selected: boolean; enabled: boolean; compact: boolean; dimmed: boolean; onSelect: () => void;
}) {
  const { scene } = useGLTF(`/models/sanctuary/${project.model}.glb`);
  const { model, materials } = useMemo(() => {
    const model = scene.clone(true);
    const materials: THREE.Material[] = [];
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.material = Array.isArray(object.material) ? object.material.map((m: THREE.Material) => m.clone()) : object.material.clone();
      materials.push(...(Array.isArray(object.material) ? object.material : [object.material]));
    });
    return { model, materials };
  }, [scene]);
  const visibility = useRef(1);
  useEffect(() => () => materials.forEach(m => m.dispose()), [materials]);
  const sculpture = useRef<THREE.Group>(null);
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
    for (const material of materials) {
      material.opacity = visibility.current;
      material.transparent = visibility.current < 0.999;
      material.depthWrite = visibility.current >= 0.999;
    }
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
        <primitive object={model} />
      </group>
      <mesh position={[0, 1, 0]}
        onPointerDown={(e) => { e.stopPropagation(); pointerStart.current = [e.clientX, e.clientY]; }}
        onClick={activate}
        onPointerOver={() => { if (enabled) { hovered.current = true; document.body.style.cursor = "pointer"; } }}
        onPointerOut={() => { hovered.current = false; document.body.style.cursor = ""; }}>
        <boxGeometry args={[2.8, 2.6, 2.5]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html center position={[0, -0.38, 0.8]} distanceFactor={20} zIndexRange={[20, 0]} style={{ pointerEvents: enabled ? "auto" : "none" }}>
        <button ref={button} className={`artifact-label${selected ? " is-selected" : ""}`} onClick={onSelect} disabled={!enabled} aria-label={`Explore ${project.title}`}>
          <span>{project.number}</span><span>{project.title === "Columbia-Barnard Network" ? "Connections" : project.title}</span><span aria-hidden>↗</span>
        </button>
      </Html>
    </group>
  );
}
