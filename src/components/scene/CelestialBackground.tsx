"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Group, Object3D } from "three";
import { DoubleSide, Vector3 } from "three";
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
import { applyJupiterMaterials } from "./jupiterMaterials";
import { applySaturnMaterials } from "./saturnMaterials";

export const SATURN_VIDEO_URL = "https://youtu.be/RKF_uDYrnuk";

/** Fixed viewport anchor (NDC): parked quietly in the lower-right. */
const RINGED_NDC = { x: 0.78, y: -0.16 };
/** Closer than fog far so stairs keep depth while Saturn stays clear */
const RINGED_VIEW_DISTANCE = 62;
const RINGED_SCALE = 4.2;

/** Slight screen-space cant; the ring texture already supplies its ellipse. */
const SATURN_TILT: [number, number, number] = [0, 0, -0.08];

/** Large, distant counterweight parked opposite Saturn. */
const JUPITER_NDC = { x: -0.76, y: 0.34 };
const JUPITER_VIEW_DISTANCE = 82;
const JUPITER_SCALE = 1.6;
const JUPITER_YAW_SPEED = 0.01;

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
    group.quaternion.copy(camera.quaternion);
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
      <group ref={hoverVisualRef}>
        <group rotation={SATURN_TILT}>
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

function FixedJupiter() {
  const groupRef = useRef<Group>(null);
  const visualRef = useRef<Object3D>(null);
  const ndcAnchor = useMemo(() => new Vector3(), []);
  const viewRay = useMemo(() => new Vector3(), []);
  const { camera } = useThree();
  const jupiter = useGLTF(MODEL_PATHS.jupiter);
  const jupiterClone = useMemo(() => {
    const clone = jupiter.scene.clone(true);
    applyJupiterMaterials(clone);
    return clone;
  }, [jupiter.scene]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    getViewportAnchorPosition(
      camera,
      JUPITER_NDC,
      JUPITER_VIEW_DISTANCE,
      group.position,
      ndcAnchor,
      viewRay,
    );

    if (visualRef.current) {
      visualRef.current.rotation.y += delta * JUPITER_YAW_SPEED;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        ref={visualRef}
        object={jupiterClone}
        scale={JUPITER_SCALE}
      />
    </group>
  );
}

export function CelestialBackground() {
  return (
    <group>
      <FixedJupiter />
      <FixedRingedPlanet />
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.jupiter);
useGLTF.preload(MODEL_PATHS.ringed);
