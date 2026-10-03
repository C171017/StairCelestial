"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { doorModelUrl, type DoorOpening, type DoorStudy } from "@/lib/doorStudies";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { createDoorMaterials } from "./doorMaterials";
import { createDoorSill, type DoorSupport } from "@/lib/doorSupport";

/** A pearl-ceramic surround, lit gold reveal, and independently opening glass leaf. */
export function GlassDoor({ study, amount = 0, opening = "hinge", dimmed = false, onSelect, enabled = true, openingProgress, support }: {
  study: DoorStudy; amount?: number; opening?: DoorOpening; dimmed?: boolean;
  onSelect?: () => void; enabled?: boolean;
  openingProgress?: RefObject<number>;
  support?: DoorSupport;
}) {
  const { scene } = useGLTF(doorModelUrl(study));
  const { model, pivot, restQuaternion, materials, sill } = useMemo(() => {
    const model = scene.clone(true);
    let pivot: THREE.Object3D | undefined;
    const materials: { material: THREE.Material; moving: boolean; opacity: number }[] = [];
    const finishes = createDoorMaterials(study);
    // Moving hardware needs its own material so dissolving the handle never
    // fades the stationary gold trim. Geometry remains shared with the GLB.
    const movingGold = finishes.gold.clone();
    const ownedMaterials = [...Object.values(finishes), movingGold];
    materials.push(...ownedMaterials.map(material => ({
      material, moving: material === finishes.glass || material === finishes.glassEdge || material === movingGold, opacity: material.opacity,
    })));
    model.traverse(object => {
      if (object.userData.door_role === "pivot") pivot = object;
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (object.name.startsWith("Fixed_GlassFrame")) mesh.material = finishes.ceramic;
      else if (object.name.startsWith("Fixed_InnerLight")) mesh.material = finishes.light;
      else if (object.name.startsWith("Moving_Pull")) mesh.material = movingGold;
      else if (object.name.startsWith("Moving_PolishedEdge")) mesh.material = finishes.glassEdge;
      else if (object.name.startsWith("Moving_")) mesh.material = finishes.glass;
      else mesh.material = finishes.gold;
    });
    const sill = support ? createDoorSill(support) : undefined;
    if (sill) {
      const ceramic = new THREE.Mesh(sill.ceramic, finishes.ceramic);
      const gold = new THREE.Mesh(sill.gold, finishes.gold);
      ceramic.name = "Fixed_CeramicSill";
      gold.name = "Fixed_SillGoldEdge";
      model.add(ceramic, gold);
    }
    return { model, pivot, restQuaternion: pivot?.quaternion.clone(), materials, sill };
  }, [scene, study, support]);
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
  useEffect(() => () => { sill?.ceramic.dispose(); sill?.gold.dispose(); }, [sill]);
  useFrame((_, dt) => {
    const delta = Math.min(dt, 0.05);
    travel.current = reduced.current ? amount : THREE.MathUtils.damp(travel.current, amount, 7, delta);
    if (Math.abs(travel.current - amount) < 0.001) travel.current = amount;
    if (openingProgress) openingProgress.current = travel.current;
    visibility.current = THREE.MathUtils.damp(visibility.current, dimmed ? 0 : 1, 6, delta);
    // Settle the fade exactly; solid finishes retain depth throughout it.
    if (Math.abs(visibility.current - (dimmed ? 0 : 1)) < 0.001) visibility.current = dimmed ? 0 : 1;
    model.visible = visibility.current > 0.015;
    if (pivot && restQuaternion) {
      rotation.setFromAxisAngle(axis, opening === "hinge" ? -travel.current * Math.PI * 0.48 : 0);
      pivot.quaternion.copy(rotation).multiply(restQuaternion);
      pivot.visible = opening !== "dissolve" || travel.current < 1;
    }
    for (const { material, moving, opacity } of materials) {
      const dissolve = opening === "dissolve" && moving ? 1 - THREE.MathUtils.smoothstep(travel.current, 0, 0.95) : 1;
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
