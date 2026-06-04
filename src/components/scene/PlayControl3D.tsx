"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSiteAudio } from "@/hooks/useSiteAudio";
import {
  AUDIO_CONSENT_TIMING,
  getClickAwaitSliceDuration,
} from "@/lib/audioConsentTiming";
import {
  getPlayDockScale,
  getPlayIntroScale,
  getPlayTetrahedronRadius,
  PLAY_DOT_RING_LOCAL_RADIUS,
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
const _faceTarget = new THREE.Vector3(0, 0, 1);

/**
 * Rotate geometry so one equilateral face lies in XY (normal +Z).
 * Parent `lookAt(camera)` then shows that face head-on as a triangle.
 */
function alignTetrahedronFaceToBillboard(geo: THREE.BufferGeometry) {
  const index = geo.getIndex();
  const pos = geo.getAttribute("position");
  if (!index || !pos) return;

  let bestDot = -Infinity;
  const bestNormal = new THREE.Vector3(0, 0, -1);

  const faceCount = index.count / 3;
  for (let f = 0; f < faceCount; f++) {
    _faceA.fromBufferAttribute(pos, index.getX(f * 3));
    _faceB.fromBufferAttribute(pos, index.getX(f * 3 + 1));
    _faceC.fromBufferAttribute(pos, index.getX(f * 3 + 2));
    _faceAb.subVectors(_faceB, _faceA);
    _faceAc.subVectors(_faceC, _faceA);
    _faceNormal.crossVectors(_faceAb, _faceAc).normalize();
    const dot = _faceNormal.z;
    if (dot > bestDot) {
      bestDot = dot;
      bestNormal.copy(_faceNormal);
    }
  }

  const q = new THREE.Quaternion().setFromUnitVectors(bestNormal, _faceTarget);
  geo.applyQuaternion(q);
  // Vertex toward +X so the silhouette reads as play ▶.
  geo.rotateZ(-Math.PI / 2);
  geo.computeVertexNormals();
}

/** Regular tetrahedron: loading phase shows one face (triangle); fly-away shows full 3D. */
function createPlayTetrahedronGeometry() {
  const geo = new THREE.TetrahedronGeometry(getPlayTetrahedronRadius(), 0);
  alignTetrahedronFaceToBillboard(geo);
  return geo;
}

function createCountdownDots(count: number, radius: number) {
  const group = new THREE.Group();
  const dotGeo = new THREE.SphereGeometry(svgRadiusToLocal(1.6), 8, 8);
  const dotMat = new THREE.MeshStandardMaterial({
    color: "#e0e1cc",
    emissive: "#c8c9b4",
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.55,
    roughness: 0.45,
    metalness: 0.1,
  });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dot = new THREE.Mesh(dotGeo, dotMat.clone());
    dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    dot.userData.dotIndex = i;
    group.add(dot);
  }
  return group;
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
  const dotsGroupRef = useRef<THREE.Group>(null);
  const chromeGroupRef = useRef<THREE.Group>(null);
  const playMeshRef = useRef<THREE.Mesh>(null);
  const pauseGroupRef = useRef<THREE.Group | null>(null);
  const introScaleRef = useRef(1);
  const dockScaleRef = useRef(0.4);
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
  const visibleDotCountRef = useRef<number>(AUDIO_CONSENT_TIMING.countdownDotCount);
  const awaitStartMsRef = useRef(0);
  const reducedMotionRef = useRef(prefersReducedMotion());

  const ndcScratch = useMemo(() => new THREE.Vector3(), []);
  const rayScratch = useMemo(() => new THREE.Vector3(), []);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const { camera, size } = useThree();
  const introPlayPhase = usePortfolioStore((s) => s.introPlayPhase);
  const {
    soundEnabled,
    setSoundEnabled,
    unlockFromGesture,
    playConsentSting,
    startAmbientIfEnabled,
    stopAmbient,
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
    () => new THREE.CircleGeometry(PLAY_IRIS_LOCAL_RADIUS, 32),
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

  const countdownDots = useMemo(
    () =>
      createCountdownDots(
        AUDIO_CONSENT_TIMING.countdownDotCount,
        PLAY_DOT_RING_LOCAL_RADIUS,
      ),
    [],
  );

  const pauseBarGeometry = useMemo(
    () =>
      new THREE.BoxGeometry(
        svgRadiusToLocal(4.5),
        svgRadiusToLocal(18),
        svgRadiusToLocal(2),
      ),
    [],
  );
  const pauseBarMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8dec8",
        emissive: "#e8e6d0",
        emissiveIntensity: 0.15,
        roughness: 0.4,
      }),
    [],
  );

  const updateDotVisibility = useCallback((count: number) => {
    const dots = dotsGroupRef.current;
    if (!dots) return;
    dots.children.forEach((child, i) => {
      const visible = i < count;
      child.visible = visible;
      if (child instanceof THREE.Mesh) {
        child.scale.setScalar(visible ? 1 : 0.001);
      }
    });
    visibleDotCountRef.current = count;
  }, []);

  const dismissDots = useCallback((duration: number) => {
    const dots = dotsGroupRef.current;
    if (!dots) return;
    dots.children.forEach((child, i) => {
      gsap.to(child.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration,
        delay: i * 0.012,
        ease: "power2.in",
      });
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        gsap.to(mat, { opacity: 0, duration, delay: i * 0.012, ease: "power2.in" });
      }
    });
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
    introScaleRef.current = getPlayIntroScale(
      cam,
      PLAY_INTRO_VIEW_DISTANCE,
      size.width,
      size.height,
    );
    dockScaleRef.current = getPlayDockScale(
      cam,
      PLAY_DOCK_VIEW_DISTANCE,
      size.width,
      size.height,
    );
    const phase = usePortfolioStore.getState().introPlayPhase;
    if (phase === "hidden" || phase === "awaitClick") {
      flyPoseRef.current.scale = introScaleRef.current;
    }
  }, [camera, size.height, size.width]);

  useLayoutEffect(() => {
    syncScaleFromViewport();
  }, [syncScaleFromViewport, introPlayPhase, size.width, size.height]);

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
      const dotDur = byClick ? t.dotDismissDurationClick : t.dotDismissDuration;

      usePortfolioStore.getState().setIntroPlayPhase("entering", {
        enteredByClick: byClick,
      });

      if (byClick) {
        unlockFromGesture();
        playConsentSting();
        setSoundEnabled(true);
      }

      dismissDots(dotDur);
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
        startAmbientIfEnabled();
      });
    },
    [
      dismissDots,
      playConsentSting,
      runFlyTween,
      runMainReveal,
      setSoundEnabled,
      startAmbientIfEnabled,
      unlockFromGesture,
    ],
  );

  const startAwaitTimer = useCallback(() => {
    const t = AUDIO_CONSENT_TIMING;
    const reduced = reducedMotionRef.current;
    const awaitDuration = reduced ? t.reducedClickAwait : t.clickAwaitDuration;
    const sliceMs = getClickAwaitSliceDuration(t, reduced) * 1000;
    const dotCount = t.countdownDotCount;

    awaitStartMsRef.current = performance.now();
    updateDotVisibility(dotCount);
    enterStartedRef.current = false;

    const tick = () => {
      const elapsed = performance.now() - awaitStartMsRef.current;
      const remaining = Math.max(0, awaitDuration - elapsed / 1000);
      const visible = Math.ceil(remaining / (awaitDuration / dotCount));
      updateDotVisibility(visible);

      if (remaining <= 0) {
        beginEnter(false);
        return;
      }
      awaitTimeoutRef.current = setTimeout(tick, sliceMs);
    };

    awaitTimeoutRef.current = setTimeout(tick, sliceMs);
  }, [beginEnter, updateDotVisibility]);

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
    if (introPlayPhase !== "active") return;
    pauseGroupRef.current?.scale.set(1, 1, 1);
    if (playMeshRef.current) {
      playMeshRef.current.visible = !soundEnabled;
    }
    if (pauseGroupRef.current) {
      pauseGroupRef.current.visible = soundEnabled;
    }
  }, [introPlayPhase, soundEnabled]);

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
      if (next) {
        unlockFromGesture();
        startAmbientIfEnabled();
      } else {
        stopAmbient();
      }
      if (playMeshRef.current) {
        playMeshRef.current.visible = !next;
      }
      if (pauseGroupRef.current) {
        pauseGroupRef.current.visible = next;
      }
    },
    [
      beginEnter,
      setSoundEnabled,
      soundEnabled,
      startAmbientIfEnabled,
      stopAmbient,
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

    if (pose.billboard > 0.001) {
      // Face-on to camera: one tetrahedron face reads as a flat play triangle.
      lookTarget.copy(camera.position);
      group.lookAt(lookTarget);
      if (phase === "awaitClick" && !reducedMotionRef.current) {
        group.rotateZ(motionRotZ);
      }
    } else {
      group.rotation.set(pose.tiltX, pose.tiltY, pose.tiltZ);
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
        <group ref={dotsGroupRef}>
          <primitive object={countdownDots} />
        </group>
      </group>

      <mesh
        ref={playMeshRef}
        geometry={tetrahedronGeometry}
        material={tetrahedronMaterial}
        {...pointerHandlers}
      />

      <group
        ref={pauseGroupRef}
        visible={false}
        {...pointerHandlers}
      >
        <mesh
          geometry={pauseBarGeometry}
          material={pauseBarMaterial}
          position={[-svgRadiusToLocal(6.25), 0, 0.01]}
        />
        <mesh
          geometry={pauseBarGeometry}
          material={pauseBarMaterial}
          position={[svgRadiusToLocal(6.25), 0, 0.01]}
        />
      </group>

      <mesh
        ref={hitRef}
        geometry={hitGeometry}
        visible={false}
        {...pointerHandlers}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
