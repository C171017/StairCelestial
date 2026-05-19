"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { MeshBasicMaterial, Vector3 } from "three";
import { MODEL_PATHS } from "@/lib/models";
import { SATURN_TEXTURES } from "@/lib/textures";
import { applySaturnMaterials } from "./saturnMaterials";

/** Fixed viewport anchor (NDC): right side, upper area */
const RINGED_NDC = { x: 0.72, y: 0.24 };
/** Closer than fog far so stairs keep depth while Saturn stays clear */
const RINGED_VIEW_DISTANCE = 62;
const RINGED_SCALE = 4.2;
const ATMOSPHERE_SCALE = 1.06;

/** World-fixed tilt — rings read from typical camera angles without copying camera rotation */
const SATURN_TILT: [number, number, number] = [0.35, 0.55, 0.08];

function SaturnAtmosphere() {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#7a9ad8",
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  return (
    <mesh scale={RINGED_SCALE * ATMOSPHERE_SCALE} material={material}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}

function SaturnLights() {
  return (
    <>
      <directionalLight
        position={[-22, 26, 18]}
        intensity={1.85}
        color="#ffe8d0"
      />
      <pointLight
        position={[14, 10, 20]}
        intensity={1.15}
        color="#c8d4f8"
        distance={200}
      />
    </>
  );
}

function FixedRingedPlanet() {
  const groupRef = useRef<Group>(null);
  const ndcAnchor = useMemo(() => new Vector3(), []);
  const viewRay = useMemo(() => new Vector3(), []);
  const { camera } = useThree();
  const ringed = useGLTF(MODEL_PATHS.ringed);
  const textures = useTexture({
    body: SATURN_TEXTURES.body,
    ringColor: SATURN_TEXTURES.ringColor,
    ringAlpha: SATURN_TEXTURES.ringAlpha,
  });

  const ringedClone = useMemo(() => {
    const clone = ringed.scene.clone(true);
    applySaturnMaterials(clone, textures);
    return clone;
  }, [ringed.scene, textures]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    ndcAnchor.set(RINGED_NDC.x, RINGED_NDC.y, 0.5).unproject(camera);
    viewRay.copy(ndcAnchor).sub(camera.position).normalize();
    group.position.copy(camera.position).addScaledVector(viewRay, RINGED_VIEW_DISTANCE);
  });

  return (
    <group ref={groupRef}>
      <SaturnLights />
      <group rotation={SATURN_TILT}>
        <SaturnAtmosphere />
        <primitive object={ringedClone} scale={RINGED_SCALE} />
      </group>
    </group>
  );
}

export function CelestialBackground() {
  const jupiter = useGLTF(MODEL_PATHS.jupiter);
  const jupiterClone = useMemo(() => jupiter.scene.clone(true), [jupiter.scene]);

  return (
    <group>
      <primitive
        object={jupiterClone}
        position={[36, 22, -68]}
        scale={10}
      />
      <FixedRingedPlanet />
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.jupiter);
useGLTF.preload(MODEL_PATHS.ringed);
