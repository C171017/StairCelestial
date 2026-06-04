"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSiteAudio } from "@/hooks/useSiteAudio";
import { AUDIO_CONSENT_TIMING } from "@/lib/audioConsentTiming";
import {
  getDynamicViewportSize,
  getPlayControlMobileSizeScale,
  getPlayCubeEdgeLength,
  getPlayDockScale,
  getPlayIntroScale,
  getPlayTetrahedronRadius,
  PLAY_INNER_RING_LOCAL_RADIUS,
  PLAY_IRIS_LOCAL_RADIUS,
  PLAY_PRIMARY_RING_LOCAL_RADIUS,
  svgRadiusToLocal,
} from "@/lib/eyeControlMetrics";
import {
  PLAY_DOCK_NDC,
  PLAY_DOCK_TILT,
  PLAY_DOCK_VIEW_DISTANCE,
  PLAY_INTRO_NDC,
  PLAY_INTRO_VIEW_DISTANCE,
} from "@/lib/playControlLayout";
import { usePortfolioStore } from "@/lib/store";
import { getViewportAnchorPosition } from "@/lib/viewportAnchor";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const _faceA = new THREE.Vector3();
const _faceB = new THREE.Vector3();
const _faceC = new THREE.Vector3();
const _faceAb = new THREE.Vector3();
const _faceAc = new THREE.Vector3();
const _faceNormal = new THREE.Vector3();
const _faceTarget = new THREE.Vector3(0, 0, -1);
const PLAY_FACE_ICON_ROTATION = -Math.PI / 2 + 0.22;

/**
 * Rotate geometry so one equilateral face lies in XY (normal -Z).
 * Parent `lookAt(camera)` points local -Z at the camera, so the play state
 * shows that real tetrahedron face head-on as a triangle.
 */
function alignTetrahedronFaceToBillboard(geo: THREE.BufferGeometry) {
  const index = geo.getIndex();
  const pos = geo.getAttribute("position");
  if (!pos) return;

  let bestDot = Infinity;
  const bestNormal = new THREE.Vector3(0, 0, 1);

  const faceCount = (index?.count ?? pos.count) / 3;
  for (let f = 0; f < faceCount; f++) {
    const a = index ? index.getX(f * 3) : f * 3;
    const b = index ? index.getX(f * 3 + 1) : f * 3 + 1;
    const c = index ? index.getX(f * 3 + 2) : f * 3 + 2;
    _faceA.fromBufferAttribute(pos, a);
    _faceB.fromBufferAttribute(pos, b);
    _faceC.fromBufferAttribute(pos, c);
    _faceAb.subVectors(_faceB, _faceA);
    _faceAc.subVectors(_faceC, _faceA);
    _faceNormal.crossVectors(_faceAb, _faceAc).normalize();
    const dot = _faceNormal.z;
    if (dot < bestDot) {
      bestDot = dot;
      bestNormal.copy(_faceNormal);
    }
  }

  const q = new THREE.Quaternion().setFromUnitVectors(bestNormal, _faceTarget);
  geo.applyQuaternion(q);
  // Vertex toward +X so the silhouette reads as play ▶.
  geo.rotateZ(-Math.PI / 2 + PLAY_FACE_ICON_ROTATION);
  geo.computeVertexNormals();
}

/** Regular tetrahedron: loading phase shows one face (triangle); fly-away shows full 3D. */
function createPlayTetrahedronGeometry() {
  const geo = new THREE.TetrahedronGeometry(getPlayTetrahedronRadius(), 0);
  alignTetrahedronFaceToBillboard(geo);
  return geo;
}

type FlyPose = {
  ndcX: number;
  ndcY: number;
  distance: number;
  scale: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  billboard: number;
};

export function PlayControl3D() {
  const groupRef = useRef<THREE.Group>(null);
  const hitRef = useRef<THREE.Mesh>(null);
  const chromeGroupRef = useRef<THREE.Group>(null);
  const playMeshRef = useRef<THREE.Mesh>(null);
  const cubeMeshRef = useRef<THREE.Mesh>(null);
  const introScaleRef = useRef(1);
  const dockScaleRef = useRef(0.4);
  const mobileShapeScaleRef = useRef(1);
  const flyPoseRef = useRef<FlyPose>({
    ndcX: PLAY_INTRO_NDC.x,
    ndcY: PLAY_INTRO_NDC.y,
    distance: PLAY_INTRO_VIEW_DISTANCE,
    scale: 1,
    tiltX: 0,
    tiltY: 0,
    tiltZ: 0,
    billboard: 1,
  });
  const enterStartedRef = useRef(false);
  const awaitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitStartMsRef = useRef(0);
  const reducedMotionRef = useRef(prefersReducedMotion());

  const ndcScratch = useMemo(() => new THREE.Vector3(), []);
  const rayScratch = useMemo(() => new THREE.Vector3(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const faceOnQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const dockQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const dockEuler = useMemo(() => new THREE.Euler(), []);

  const { camera, size } = useThree();
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const {
    soundEnabled,
    setSoundEnabled,
    unlockFromGesture,
    playConsentSting,
    fadeAmbientIn,
    fadeAmbientOut,
  } = useSiteAudio();

  const tetrahedronGeometry = useMemo(() => createPlayTetrahedronGeometry(), []);
  const tetrahedronMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dee1cd",
        emissive: "#f6efd4",
        emissiveIntensity: 0.22,
        roughness: 0.38,
        metalness: 0.08,
        flatShading: true,
      }),
    [],
  );
  const hitGeometry = useMemo(
    () => new THREE.SphereGeometry(PLAY_IRIS_LOCAL_RADIUS, 12, 8),
    [],
  );
  const innerRingGeometry = useMemo(
    () =>
      new THREE.TorusGeometry(
        PLAY_INNER_RING_LOCAL_RADIUS,
        svgRadiusToLocal(0.35),
        8,
        64,
      ),
    [],
  );
  const innerRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#e0e1cc",
        transparent: true,
        opacity: 0.35,
      }),
    [],
  );
  const softRingGeometry = useMemo(
    () =>
      new THREE.TorusGeometry(
        PLAY_PRIMARY_RING_LOCAL_RADIUS,
        svgRadiusToLocal(0.45),
        8,
        64,
      ),
    [],
  );
  const softRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#dcdac4",
        transparent: true,
        opacity: 0.42,
      }),
    [],
  );

  const cubeGeometry = useMemo(() => {
    const edge = getPlayCubeEdgeLength();
    return new THREE.BoxGeometry(edge, edge, edge);
  }, []);
  const cubeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dee1cd",
        emissive: "#f6efd4",
        emissiveIntensity: 0.22,
        roughness: 0.38,
        metalness: 0.08,
        flatShading: true,
      }),
    [],
  );

  const syncShapeVisibility = useCallback((playing: boolean) => {
    if (playMeshRef.current) {
      playMeshRef.current.visible = !playing;
    }
    if (cubeMeshRef.current) {
      cubeMeshRef.current.visible = playing;
    }
  }, []);

  const applyMobileShapeScale = useCallback(() => {
    const scale = mobileShapeScaleRef.current;
    if (playMeshRef.current) playMeshRef.current.scale.setScalar(scale);
    if (cubeMeshRef.current) cubeMeshRef.current.scale.setScalar(scale);
    if (hitRef.current) hitRef.current.scale.setScalar(scale);
  }, []);

  const runMainReveal = useCallback(
    (duration: number, onComplete: () => void) => {
      const run = () => {
        const revealState = {
          main: usePortfolioStore.getState().introMainOpacity,
          shooting: usePortfolioStore.getState().introShootingStarIntensity,
          stars: usePortfolioStore.getState().introStarsOpacity,
        };
        gsap.to(revealState, {
          main: 1,
          shooting: 1,
          stars: 1,
          duration,
          ease: "sine.inOut",
          onUpdate: () => {
            usePortfolioStore.getState().setIntroReveal({
              introMainOpacity: revealState.main,
              introShootingStarIntensity: revealState.shooting,
              introStarsOpacity: revealState.stars,
            });
          },
          onComplete,
        });
      };

      if (!usePortfolioStore.getState().sceneBootstrapped) {
        const unsub = usePortfolioStore.subscribe((state) => {
          if (state.sceneBootstrapped) {
            unsub();
            run();
          }
        });
        return;
      }
      run();
    },
    [],
  );

  const syncScaleFromViewport = useCallback(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const controlViewport = getDynamicViewportSize(size.width, size.height);
    introScaleRef.current = getPlayIntroScale(
      cam,
      PLAY_INTRO_VIEW_DISTANCE,
      size.width,
      size.height,
      controlViewport.width,
      controlViewport.height,
    );
    dockScaleRef.current = getPlayDockScale(
      cam,
      PLAY_DOCK_VIEW_DISTANCE,
      size.width,
      size.height,
      controlViewport.width,
      controlViewport.height,
    );
    mobileShapeScaleRef.current = getPlayControlMobileSizeScale(
      controlViewport.width,
      controlViewport.height,
    );
    applyMobileShapeScale();
    const phase = usePortfolioStore.getState().introPlayPhase;
    if (phase === "hidden" || phase === "awaitClick") {
      flyPoseRef.current.scale = introScaleRef.current;
    }
  }, [applyMobileShapeScale, camera, size.height, size.width]);

  useLayoutEffect(() => {
    syncScaleFromViewport();
  }, [syncScaleFromViewport, introPlayPhase, size.width, size.height]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      syncScaleFromViewport();
    };

    window.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [syncScaleFromViewport]);

  const runFlyTween = useCallback((duration: number) => {
    const pose = flyPoseRef.current;
    gsap.to(pose, {
      ndcX: PLAY_DOCK_NDC.x,
      ndcY: PLAY_DOCK_NDC.y,
      distance: PLAY_DOCK_VIEW_DISTANCE,
      scale: dockScaleRef.current,
      tiltX: PLAY_DOCK_TILT[0],
      tiltY: PLAY_DOCK_TILT[1],
      tiltZ: PLAY_DOCK_TILT[2],
      billboard: 0,
      duration,
      ease: "power2.inOut",
    });
  }, []);

  const beginEnter = useCallback(
    (byClick: boolean) => {
      if (enterStartedRef.current) return;
      enterStartedRef.current = true;

      if (awaitTimeoutRef.current) {
        clearTimeout(awaitTimeoutRef.current);
        awaitTimeoutRef.current = null;
      }

      const t = AUDIO_CONSENT_TIMING;
      const reduced = reducedMotionRef.current;
      const flyDur = reduced ? t.reducedFlyDuration : t.flyDuration;
      const mainDur = reduced ? t.reducedMainReveal : t.mainRevealDuration;
      usePortfolioStore.getState().setIntroPlayPhase("entering", {
        enteredByClick: byClick,
      });

      if (byClick) {
        unlockFromGesture();
        playConsentSting();
        setSoundEnabled(true);
        syncShapeVisibility(true);
      }

      if (reduced) {
        const pose = flyPoseRef.current;
        pose.ndcX = PLAY_DOCK_NDC.x;
        pose.ndcY = PLAY_DOCK_NDC.y;
        pose.distance = PLAY_DOCK_VIEW_DISTANCE;
        pose.scale = dockScaleRef.current;
        pose.tiltX = PLAY_DOCK_TILT[0];
        pose.tiltY = PLAY_DOCK_TILT[1];
        pose.tiltZ = PLAY_DOCK_TILT[2];
        pose.billboard = 0;
      } else {
        runFlyTween(flyDur);
      }

      runMainReveal(mainDur, () => {
        usePortfolioStore.getState().setIntroPlayPhase("active");
        fadeAmbientIn();
      });
    },
    [
      fadeAmbientIn,
      playConsentSting,
      runFlyTween,
      runMainReveal,
      setSoundEnabled,
      syncShapeVisibility,
      unlockFromGesture,
    ],
  );

  const startAwaitTimer = useCallback(() => {
    const t = AUDIO_CONSENT_TIMING;
    const reduced = reducedMotionRef.current;
    const awaitDurationMs =
      (reduced ? t.reducedClickAwait : t.clickAwaitDuration) * 1000;

    awaitStartMsRef.current = performance.now();
    enterStartedRef.current = false;

    awaitTimeoutRef.current = setTimeout(() => {
      beginEnter(false);
    }, awaitDurationMs);
  }, [beginEnter]);

  useEffect(() => {
    if (introPlayPhase !== "awaitClick") return;
    startAwaitTimer();
    return () => {
      if (awaitTimeoutRef.current) {
        clearTimeout(awaitTimeoutRef.current);
        awaitTimeoutRef.current = null;
      }
    };
  }, [introPlayPhase, startAwaitTimer]);

  useEffect(() => {
    if (introPlayPhase === "hidden") return;
    syncShapeVisibility(soundEnabled);
  }, [introPlayPhase, soundEnabled, syncShapeVisibility]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const phase = usePortfolioStore.getState().introPlayPhase;
      if (phase === "awaitClick") {
        beginEnter(true);
        return;
      }
      if (phase !== "active") return;

      const next = !soundEnabled;
      setSoundEnabled(next);
      syncShapeVisibility(next);
      if (next) {
        unlockFromGesture();
        fadeAmbientIn();
      } else {
        fadeAmbientOut();
      }
    },
    [
      beginEnter,
      fadeAmbientIn,
      fadeAmbientOut,
      setSoundEnabled,
      soundEnabled,
      syncShapeVisibility,
      unlockFromGesture,
    ],
  );

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const phase = usePortfolioStore.getState().introPlayPhase;
    if (phase === "hidden") {
      group.visible = false;
      return;
    }

    group.visible = true;
    const chrome = chromeGroupRef.current;
    if (chrome) {
      chrome.visible = phase === "awaitClick";
    }
    const pose = flyPoseRef.current;
    getViewportAnchorPosition(
      camera,
      { x: pose.ndcX, y: pose.ndcY },
      pose.distance,
      worldPos,
      ndcScratch,
      rayScratch,
    );
    group.position.copy(worldPos);

    const baseScale = pose.scale;
    let motionScale = 1;
    let motionRotZ = 0;

    if (phase === "awaitClick" && !reducedMotionRef.current) {
      const t = state.clock.elapsedTime;
      const period = AUDIO_CONSENT_TIMING.idleMotionPeriod;
      const wobble = Math.sin((t / period) * Math.PI * 2);
      const elapsedAwait =
        awaitStartMsRef.current > 0
          ? (performance.now() - awaitStartMsRef.current) / 1000
          : 0;
      const idleBlend = THREE.MathUtils.smoothstep(
        elapsedAwait,
        AUDIO_CONSENT_TIMING.eyeVanishAfterOpen,
        AUDIO_CONSENT_TIMING.eyeVanishAfterOpen + 0.45,
      );
      motionRotZ = wobble * AUDIO_CONSENT_TIMING.idleRotateAmplitude * idleBlend;
      motionScale =
        1 + wobble * AUDIO_CONSENT_TIMING.idleScalePulse * idleBlend;
    }

    group.scale.setScalar(baseScale * motionScale);

    // Face-on to camera: one actual tetrahedron face reads as the play triangle.
    lookTarget.copy(camera.position);
    group.lookAt(lookTarget);
    if (phase === "awaitClick" && !reducedMotionRef.current) {
      group.rotateZ(motionRotZ);
    }
    faceOnQuaternion.copy(group.quaternion);

    if (phase !== "awaitClick") {
      dockEuler.set(pose.tiltX, pose.tiltY, pose.tiltZ);
      dockQuaternion.setFromEuler(dockEuler);
      group.quaternion
        .copy(faceOnQuaternion)
        .slerp(dockQuaternion, 1 - pose.billboard);
    }
  });

  const pointerHandlers = {
    onPointerDown: handlePointerDown,
    onPointerOver: () => {
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  };

  return (
    <group ref={groupRef} visible={false}>
      <pointLight
        position={[0, 0, 0.4]}
        intensity={0.85}
        distance={12}
        color="#f3ecd4"
      />
      <group ref={chromeGroupRef}>
        <mesh geometry={softRingGeometry} material={softRingMaterial} />
        <mesh geometry={innerRingGeometry} material={innerRingMaterial} />
      </group>

      <mesh
        ref={playMeshRef}
        geometry={tetrahedronGeometry}
        material={tetrahedronMaterial}
      />

      <mesh
        ref={cubeMeshRef}
        geometry={cubeGeometry}
        material={cubeMaterial}
        visible={false}
      />

      <mesh ref={hitRef} geometry={hitGeometry} {...pointerHandlers}>
        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
