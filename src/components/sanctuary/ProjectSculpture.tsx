"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { sanctuaryProjects, type SanctuaryProject } from "@/lib/sanctuaryContent";

/** The preserved project model lives wholly behind the door's local Z=0 leaf. */
export function ProjectSculpture({ project, openingProgress }: {
  project: SanctuaryProject;
  openingProgress: RefObject<number>;
}) {
  const { scene } = useGLTF(`/models/sanctuary/${project.model}.glb`);
  const group = useRef<THREE.Group>(null);
  const { model, materials } = useMemo(() => {
    const model = scene.clone(true);
    // The turntable's platter lies horizontally; tip it toward the doorway so
    // the frontal view shows the record and arm rather than only its thin edge.
    if (project.model === "music") model.rotateX(0.65);
    const materials: { material: THREE.Material; opacity: number }[] = [];
    const clones = new Map<THREE.Material, THREE.Material>();
    model.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const clone = (source: THREE.Material) => {
        const existing = clones.get(source);
        if (existing) return existing;
        const material = source.clone();
        materials.push({ material, opacity: material.opacity });
        material.transparent = true;
        material.opacity = 0;
        material.depthWrite = false;
        clones.set(source, material);
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = Math.min((project.model === "music" ? 1.5 : 1.15) / size.x, 1.75 / size.y, 0.9 / size.z);
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, 1.55 - center.y * scale, -0.75 - center.z * scale);
    return { model, materials };
  }, [scene, project.model]);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useFrame(() => {
    const reveal = THREE.MathUtils.smoothstep(openingProgress.current, 0.35, 0.85);
    if (group.current) group.current.visible = reveal > 0.001;
    for (const { material, opacity } of materials) {
      material.opacity = opacity * reveal;
      material.depthWrite = material.opacity > 0.98;
    }
  });
  return <group ref={group} visible={false}>
    <primitive object={model} />
  </group>;
}

sanctuaryProjects.forEach(project => useGLTF.preload(`/models/sanctuary/${project.model}.glb`));
