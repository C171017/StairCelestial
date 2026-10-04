"use client";

import { Mask, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { fitProjectToDoor, getDoorAperture } from "@/lib/doorAperture";
import { doorModelUrl, type DoorStudy } from "@/lib/doorStudies";
import { setLocalMaterialOpacity } from "@/lib/materialReveal";
import { sanctuaryProjects, type SanctuaryProject } from "@/lib/sanctuaryContent";
import { advanceSculptureReveal, createSculptureReveal, sculptureRevealPose } from "@/lib/sculptureReveal";

/** The preserved project model lives wholly behind the door's local Z=0 leaf. */
export function ProjectSculpture({ study, project, selected, maskId, focusSide = 1 }: {
  focusSide?: 1 | -1;
  study: DoorStudy;
  project: SanctuaryProject;
  selected: boolean;
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
      if (!mesh.isMesh || !mesh.name.startsWith("Slab_Glass")) return;
      geometry = mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
      const positions = geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) positions.setZ(i, 0);
      geometry.computeBoundingSphere();
    });
    return geometry;
  }, [doorScene]);
  const group = useRef<THREE.Group>(null);
  const content = useRef<THREE.Group>(null);
  const facing = useRef<1 | -1>(1);
  const reveal = useRef(createSculptureReveal());
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
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
    // Animate around the fitted object's center, without moving the aperture
    // mask or scaling the object from the door's floor.
    model.position.copy(position).sub(new THREE.Vector3(aperture.center.x, aperture.center.y, -0.55));
    return { model, materials };
  }, [scene, project.model, aperture, maskId]);
  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials]);
  useEffect(() => () => maskGeometry?.dispose(), [maskGeometry]);
  useFrame((_, dt) => {
    if (selected) facing.current = focusSide;
    advanceSculptureReveal(reveal.current, selected, dt, reduced.current);
    const opacityFactor = reveal.current.value;
    if (group.current) group.current.visible = opacityFactor > 0;
    if (content.current) {
      const pose = sculptureRevealPose(opacityFactor, reduced.current);
      content.current.scale.setScalar(pose.scale);
      // Present the sculpture through either face, retaining the last side
      // throughout its exit so closing never flips the visible artwork.
      content.current.position.z = (-0.55 + pose.depth) * facing.current;
      content.current.rotation.y = facing.current === -1 ? Math.PI : 0;
    }
    for (const { material, opacity } of materials) {
      setLocalMaterialOpacity(material, opacity * opacityFactor);
    }
  });
  return <group ref={group} visible={false}>
    {/* Clip to the doorway in screen space, including during focus turns. */}
    <Mask id={maskId} geometry={maskGeometry} raycast={() => null}>
      <meshBasicMaterial side={THREE.DoubleSide} />
    </Mask>
    <group ref={content} position={[aperture.center.x, aperture.center.y, -0.55]}>
      <primitive object={model} />
    </group>
  </group>;
}

sanctuaryProjects.forEach(project => useGLTF.preload(`/models/sanctuary/${project.model}.glb`));
