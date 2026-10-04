"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { doorModelUrl, type DoorStudy } from "@/lib/doorStudies";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createDoorFootGeometry } from "@/lib/doorFoot";
import type { DoorSupport } from "@/lib/doorSupport";
import { createDoorMaterials, updateDoorMaterials } from "./doorMaterials";
import { useSceneMood } from "./SceneMood";

/** A stationary colored glass slab that dissolves inside its ceramic surround. */
export function GlassDoor({ study, amount = 0, dimmed = false, onSelect, enabled = true, openingProgress, support }: {
  study: DoorStudy; amount?: number; dimmed?: boolean;
  onSelect?: () => void; enabled?: boolean;
  openingProgress?: RefObject<number>;
  support?: DoorSupport;
}) {
  const { scene } = useGLTF(doorModelUrl(study));
  const mood = useSceneMood();
  const { model, slab, materials, finishes, footGeometry } = useMemo(() => {
    const model = scene.clone(true);
    let slab: THREE.Object3D | undefined;
    const materials: { material: THREE.Material; dissolves: boolean; opacity: number }[] = [];
    const finishes = createDoorMaterials(study);
    materials.push(...Object.values(finishes).map(material => ({
      material, dissolves: material === finishes.glass || material === finishes.glassEdge, opacity: material.opacity,
    })));
    model.traverse(object => {
      if (object.userData.door_role === "slab") slab = object;
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (object.name.startsWith("Fixed_GlassFrame")) mesh.material = finishes.ceramic;
      else if (object.name.startsWith("Fixed_InnerLight")) mesh.material = finishes.light;
      else if (object.name.startsWith("Slab_PolishedEdge")) mesh.material = finishes.glassEdge;
      else if (object.name.startsWith("Slab_Glass")) mesh.material = finishes.glass;
      else mesh.material = finishes.gold;
    });
    const footGeometry = support ? createDoorFootGeometry(model, support) : undefined;
    if (footGeometry) {
      const foot = new THREE.Mesh(footGeometry, finishes.ceramic);
      foot.name = "Fixed_FittedFrameFillet";
      model.add(foot);
    }
    return { model, slab, materials, finishes, footGeometry };
  }, [scene, study, support]);
  const visibility = useRef(1);
  const travel = useRef(0);
  const reduced = useRef(false);
  const start = useRef<[number, number] | null>(null);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => { query.removeEventListener("change", update); document.body.style.cursor = ""; };
  }, []);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useEffect(() => () => footGeometry?.dispose(), [footGeometry]);
  useFrame((_, dt) => {
    updateDoorMaterials(finishes, mood.current);
    const delta = Math.min(dt, 0.05);
    travel.current = reduced.current ? amount : THREE.MathUtils.damp(travel.current, amount, 7, delta);
    if (Math.abs(travel.current - amount) < 0.001) travel.current = amount;
    if (openingProgress) openingProgress.current = travel.current;
    visibility.current = THREE.MathUtils.damp(visibility.current, dimmed ? 0 : 1, 6, delta);
    // Settle the fade exactly; solid finishes retain depth throughout it.
    if (Math.abs(visibility.current - (dimmed ? 0 : 1)) < 0.001) visibility.current = dimmed ? 0 : 1;
    model.visible = visibility.current > 0.015;
    if (slab) slab.visible = travel.current < 1;
    for (const { material, dissolves, opacity } of materials) {
      const dissolve = dissolves ? 1 - THREE.MathUtils.smoothstep(travel.current, 0, 0.95) : 1;
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
