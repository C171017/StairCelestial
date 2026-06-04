"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Group, Object3D } from "three";
import { DoubleSide, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { createExternalLinkPointerHandlers } from "@/lib/externalLinkPointerHandlers";
import {
  setInteractiveHoverScale,
  setPointerCursor,
} from "@/lib/interactiveHoverZoom";
import { MODEL_PATHS } from "@/lib/models";
import { openExternalUrl } from "@/lib/openExternalUrl";
import { isPortfolioSceneInteractive, usePortfolioStore } from "@/lib/store";
import { SATURN_TEXTURES } from "@/lib/textures";
import { getViewportAnchorPosition } from "@/lib/viewportAnchor";
import { applySaturnMaterials } from "./saturnMaterials";

export const SATURN_VIDEO_URL = "https://youtu.be/RKF_uDYrnuk";

/** Fixed viewport anchor (NDC): right side, upper area */
const RINGED_NDC = { x: 0.72, y: 0.24 };
/** Closer than fog far so stairs keep depth while Saturn stays clear */
const RINGED_VIEW_DISTANCE = 62;
const RINGED_SCALE = 4.2;
const ATMOSPHERE_SCALE = 1.06;

/** World-fixed tilt — rings read from typical camera angles without copying camera rotation */
const SATURN_TILT: [number, number, number] = [0.35, 0.55, 0.08];

/**
 * Jupiter backdrop placement (derived from camera helix vs GLB bounds).
 * Camera orbits at CAMERA_ORBIT_RADIUS (25) around Y, climbing STAIR_HEIGHT_STEP per scroll.
 * GLB mesh radius ≈ 9.45; world radius = scale × 9.45.
 * Sampled min distance camera→center ≈ 313 at [110, 40, -320] → margin ≈ 6.6× radius (never inside).
 * Apparent diameter ≈ 2×atan(R/minDist) ≈ 17° (reference: large right backdrop, not filling FOV).
 */
const JUPITER_POSITION: [number, number, number] = [110, 40, -320];
const JUPITER_SCALE = 5;

function applyJupiterBackgroundMaterial(root: Object3D) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    child.material = new MeshBasicMaterial({
      color: "#c8b498",
      fog: false,
    });
  });
}

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

const SATURN_HIT_RADIUS = 1.15;

function FixedRingedPlanet() {
  const groupRef = useRef<Group>(null);
  const hoverVisualRef = useRef<Group>(null);
  const hoverTweenRef = useRef<gsap.core.Tween | null>(null);
  const ndcAnchor = useMemo(() => new Vector3(), []);
  const viewRay = useMemo(() => new Vector3(), []);
  const { camera } = useThree();
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const saturnInteractive = isPortfolioSceneInteractive(introPlayPhase);
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

    getViewportAnchorPosition(
      camera,
      RINGED_NDC,
      RINGED_VIEW_DISTANCE,
      group.position,
      ndcAnchor,
      viewRay,
    );
  });

  useEffect(() => {
    if (saturnInteractive) return;
    setPointerCursor(false);
    setInteractiveHoverScale(hoverVisualRef.current, false, hoverTweenRef);
  }, [saturnInteractive]);

  const saturnLinkHandlers = useMemo(
    () =>
      createExternalLinkPointerHandlers(() => {
        if (!saturnInteractive) return;
        openExternalUrl(SATURN_VIDEO_URL);
      }),
    [saturnInteractive],
  );

  const handleSaturnPointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!saturnInteractive) return;
      event.stopPropagation();
      setPointerCursor(true);
      setInteractiveHoverScale(hoverVisualRef.current, true, hoverTweenRef);
    },
    [saturnInteractive],
  );

  const handleSaturnPointerOut = useCallback(() => {
    if (!saturnInteractive) return;
    setPointerCursor(false);
    setInteractiveHoverScale(hoverVisualRef.current, false, hoverTweenRef);
  }, [saturnInteractive]);

  const saturnPointerHandlers = saturnInteractive
    ? {
        ...saturnLinkHandlers,
        onPointerOver: handleSaturnPointerOver,
        onPointerOut: handleSaturnPointerOut,
      }
    : {};

  return (
    <group ref={groupRef}>
      <SaturnLights />
      <group ref={hoverVisualRef}>
        <group rotation={SATURN_TILT}>
          <SaturnAtmosphere />
          <primitive object={ringedClone} scale={RINGED_SCALE} />
        </group>
        <mesh scale={RINGED_SCALE} {...saturnPointerHandlers}>
          <sphereGeometry args={[SATURN_HIT_RADIUS, 20, 16]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}

export function CelestialBackground() {
  const jupiter = useGLTF(MODEL_PATHS.jupiter);
  const jupiterClone = useMemo(() => {
    const clone = jupiter.scene.clone(true);
    applyJupiterBackgroundMaterial(clone);
    return clone;
  }, [jupiter.scene]);

  return (
    <group>
      <primitive
        object={jupiterClone}
        position={JUPITER_POSITION}
        scale={JUPITER_SCALE}
      />
      <FixedRingedPlanet />
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.jupiter);
useGLTF.preload(MODEL_PATHS.ringed);
