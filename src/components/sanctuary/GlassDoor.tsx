"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { doorModelUrl, type DoorOpening, type DoorStudy } from "@/lib/doorStudies";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";

/** A fixed cast-glass surround and an independently rigged, moving glass leaf. */
export function GlassDoor({ study, amount = 0, opening = "hinge", dimmed = false, onSelect, enabled = true, openingProgress }: {
  study: DoorStudy; amount?: number; opening?: DoorOpening; dimmed?: boolean;
  onSelect?: () => void; enabled?: boolean;
  openingProgress?: RefObject<number>;
}) {
  const { scene } = useGLTF(doorModelUrl(study));
  const { model, pivot, restQuaternion, materials } = useMemo(() => {
    const model = scene.clone(true);
    let pivot: THREE.Object3D | undefined;
    const materials: { material: THREE.Material; moving: boolean; opacity: number }[] = [];
    const clones = new Map<string, THREE.Material>();
    model.traverse(object => {
      if (object.userData.door_role === "pivot") pivot = object;
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const moving = object.name.startsWith("Moving_");
      const clone = (original: THREE.Material) => {
        const key = `${original.uuid}:${moving}`;
        const existing = clones.get(key);
        if (existing) return existing;
        const material = original.clone();
        let opacity = 1;
        // Consistent transmission and a subtle interference sheen in the cloud light.
        const glass = material as THREE.MeshPhysicalMaterial;
        if (glass.isMeshPhysicalMaterial && material.name.includes("Glass")) {
          glass.color.lerp(new THREE.Color("#f2fbff"), moving ? 0.62 : 0.38);
          glass.transmission = 1;
          glass.roughness = moving ? 0.045 : 0.035;
          glass.thickness = moving ? 0.16 : 0.38;
          glass.ior = 1.46;
          glass.iridescence = moving ? 0.13 : 0.24;
          glass.iridescenceIOR = 1.3;
          glass.iridescenceThicknessRange = [100, 280];
          glass.envMapIntensity = moving ? 0.8 : 1.25;
          glass.attenuationColor.set(study.tint);
          glass.attenuationDistance = 3;
          // Closed volumes already include both surfaces. Drawing backfaces again
          // stacks the alpha and makes a clear leaf read as a frosted solid.
          glass.side = THREE.FrontSide;
          opacity = moving ? 0.38 : 0.72;
        }
        material.transparent = true;
        material.opacity = opacity;
        material.depthWrite = opacity > 0.98;
        clones.set(key, material);
        materials.push({ material, moving, opacity });
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
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
    if (openingProgress) openingProgress.current = travel.current;
    visibility.current = THREE.MathUtils.damp(visibility.current, dimmed ? 0 : 1, 6, delta);
    model.visible = visibility.current > 0.015;
    if (pivot && restQuaternion) {
      rotation.setFromAxisAngle(axis, opening === "hinge" ? -travel.current * Math.PI * 0.48 : 0);
      pivot.quaternion.copy(rotation).multiply(restQuaternion);
    }
    for (const { material, moving, opacity } of materials) {
      const dissolve = opening === "dissolve" && moving ? 1 - travel.current * 0.96 : 1;
      setLocalMaterialOpacity(material, opacity * visibility.current * dissolve);
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
