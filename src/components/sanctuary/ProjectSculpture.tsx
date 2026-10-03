"use client";

import { Mask, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { fitProjectToDoor, getDoorAperture } from "@/lib/doorAperture";
import { doorModelUrl, type DoorStudy } from "@/lib/doorStudies";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { sanctuaryProjects, type SanctuaryProject } from "@/lib/sanctuaryContent";

/** The preserved project model lives wholly behind the door's local Z=0 leaf. */
export function ProjectSculpture({ study, project, openingProgress, maskId }: {
  study: DoorStudy;
  project: SanctuaryProject;
  openingProgress: RefObject<number>;
  maskId: number;
}) {
  const { scene } = useGLTF(`/models/sanctuary/${project.model}.glb`);
  const { scene: doorScene } = useGLTF(doorModelUrl(study));
  const aperture = useMemo(() => getDoorAperture(doorScene), [doorScene]);
  const maskGeometry = useMemo(() => {
    let geometry: THREE.BufferGeometry | undefined;
    doorScene.updateWorldMatrix(true, true);
    const inverse = doorScene.matrixWorld.clone().invert();
    doorScene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.name.startsWith("Moving_GlassLeaf")) return;
      geometry = mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
      const positions = geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) positions.setZ(i, 0);
      geometry.computeBoundingSphere();
    });
    return geometry;
  }, [doorScene]);
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
        material.stencilWrite = true;
        material.stencilRef = maskId;
        material.stencilFunc = THREE.EqualStencilFunc;
        material.stencilFail = THREE.KeepStencilOp;
        material.stencilZFail = THREE.KeepStencilOp;
        material.stencilZPass = THREE.KeepStencilOp;
        materials.push({ material, opacity: material.opacity });
        setLocalMaterialOpacity(material, 0);
        clones.set(source, material);
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(clone) : clone(mesh.material);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const { scale, position } = fitProjectToDoor(bounds, aperture);
    model.scale.multiplyScalar(scale);
    model.position.copy(position);
    return { model, materials };
  }, [scene, project.model, aperture, maskId]);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useEffect(() => () => maskGeometry?.dispose(), [maskGeometry]);
  useFrame(() => {
    const reveal = THREE.MathUtils.smoothstep(openingProgress.current, 0.35, 0.85);
    if (group.current) group.current.visible = reveal > 0.001;
    for (const { material, opacity } of materials) {
      setLocalMaterialOpacity(material, opacity * reveal);
    }
  });
  return <group ref={group} visible={false}>
    {/* Clip to the doorway in screen space, including during focus turns. */}
    <Mask id={maskId} geometry={maskGeometry} raycast={() => null}>
      <meshBasicMaterial side={THREE.DoubleSide} />
    </Mask>
    <primitive object={model} />
  </group>;
}

sanctuaryProjects.forEach(project => useGLTF.preload(`/models/sanctuary/${project.model}.glb`));
