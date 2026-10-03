"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DoorOpening, DoorStudy } from "@/lib/doorStudies";

/** A fixed cast-glass surround and an independently rigged, moving glass leaf. */
export function GlassDoor({ study, amount = 0, opening = "hinge", dimmed = false, onSelect, enabled = true }: {
  study: DoorStudy; amount?: number; opening?: DoorOpening; dimmed?: boolean;
  onSelect?: () => void; enabled?: boolean;
}) {
  const { scene } = useGLTF(`/models/doors/${study.id}.glb`);
  const { model, pivot, restQuaternion, materials } = useMemo(() => {
    const model = scene.clone(true);
    let pivot: THREE.Object3D | undefined;
    const materials: { material: THREE.MeshStandardMaterial; moving: boolean; opacity: number }[] = [];
    const clones = new Map<string, THREE.MeshStandardMaterial>();
    model.traverse(object => {
      if (object.userData.door_role === "pivot") pivot = object;
      if (!(object instanceof THREE.Mesh)) return;
      const moving = object.name.startsWith("Moving_");
      const clone = (original: THREE.MeshStandardMaterial) => {
        const key = `${original.uuid}:${moving}`;
        const existing = clones.get(key);
        if (existing) return existing;
        const material = original.clone();
        let opacity = 1;
        // Consistent transmission and a subtle interference sheen in the cloud light.
        if (material instanceof THREE.MeshPhysicalMaterial && material.name.includes("Glass")) {
          material.color.lerp(new THREE.Color("#f2fbff"), moving ? 0.62 : 0.38);
          material.transmission = 1;
          material.roughness = moving ? 0.045 : 0.035;
          material.thickness = moving ? 0.16 : 0.38;
          material.ior = 1.46;
          material.iridescence = moving ? 0.13 : 0.24;
          material.iridescenceIOR = 1.3;
          material.iridescenceThicknessRange = [100, 280];
          material.envMapIntensity = moving ? 0.8 : 1.25;
          material.attenuationColor.set(study.tint);
          material.attenuationDistance = 3;
          opacity = moving ? 0.55 : 0.86;
        }
        material.transparent = true;
        material.opacity = opacity;
        material.depthWrite = opacity > 0.98;
        clones.set(key, material);
        materials.push({ material, moving, opacity });
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    });
    return { model, pivot, restQuaternion: pivot?.quaternion.clone(), materials };
  }, [scene, study.tint]);
  const visibility = useRef(1);
  const travel = useRef(0);
  const rotation = useMemo(() => new THREE.Quaternion(), []);
  // Compose with the exported rest pose so the hinge remains vertical.
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const reduced = useRef(false);
  const start = useRef<[number, number] | null>(null);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => { query.removeEventListener("change", update); document.body.style.cursor = ""; };
  }, []);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05);
    travel.current = reduced.current ? amount : THREE.MathUtils.damp(travel.current, amount, 7, delta);
    visibility.current = THREE.MathUtils.damp(visibility.current, dimmed ? 0 : 1, 6, delta);
    model.visible = visibility.current > 0.015;
    if (pivot && restQuaternion) {
      rotation.setFromAxisAngle(axis, opening === "hinge" ? -travel.current * 1.12 : 0);
      pivot.quaternion.copy(rotation).multiply(restQuaternion);
    }
    for (const { material, moving, opacity } of materials) {
      const dissolve = opening === "dissolve" && moving ? 1 - travel.current * 0.96 : 1;
      material.opacity = opacity * visibility.current * dissolve;
      material.depthWrite = material.opacity > 0.98;
    }
  });
  function activate(event: ThreeEvent<MouseEvent>) {
    if (!onSelect || !enabled) return;
    event.stopPropagation();
    if (start.current && Math.hypot(event.clientX - start.current[0], event.clientY - start.current[1]) < 8) onSelect();
    start.current = null;
  }
  return <group
    onPointerDown={onSelect ? event => { if (enabled) { event.stopPropagation(); start.current = [event.clientX, event.clientY]; } } : undefined}
    onClick={onSelect ? activate : undefined}
    onPointerOver={onSelect ? () => { if (enabled) document.body.style.cursor = "pointer"; } : undefined}
    onPointerOut={onSelect ? () => { document.body.style.cursor = ""; } : undefined}>
    <primitive object={model} />
  </group>;
}
