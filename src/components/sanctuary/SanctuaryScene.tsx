"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useRibbonMotion } from "@/hooks/useRibbonMotion";
import { MOBILE_SCROLL_QUERY } from "@/lib/nativeRibbonScroll";
import { type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { advanceRibbonFocus, createRibbonFocus } from "@/lib/ribbonFocus";
import { getDoorAperture } from "@/lib/doorAperture";
import { chooseRibbonFocusSide } from "@/lib/ribbonFocusVisibility";
import { createRibbonSections, RIBBON_PITCH } from "@/lib/ribbonGeometry";
import { sanctuaryProjects, projectIndexForDoor } from "@/lib/sanctuaryContent";
import { doorStudies, doorModelUrl } from "@/lib/doorStudies";
import { doorPlacement, doorShapeIndex } from "@/lib/doorPlacement";
import { ORBIT_HEIGHT, ORBIT_RADIUS, ribbonOrbitAngle } from "@/lib/ribbonOrbit";
import { IntroSceneReveal } from "@/components/scene/IntroSceneReveal";
import { PlayControl3D } from "@/components/scene/PlayControl3D";
import { PorcelainRibbon } from "./PorcelainRibbon";
import { ProjectArtifact } from "./ProjectArtifact";
import { StudioLight } from "./SceneEnvironment";
import { OrbitSky } from "./OrbitSky";
import { OrbitCamera } from "./OrbitCamera";
import { floatDoorSupport, FLOATING_DOOR_COUNT, readReviewSeed } from "@/lib/floatingDoor";
import { fitDoorSupport, getDoorBase } from "@/lib/doorSupport";
import { doorPresentationSamples } from "@/lib/portalPresentation";
import { AdaptiveQuality } from "./AdaptiveQuality";

const FOCUS_POSITION = { x: 0, y: 2.3, z: 4.2 };
const FOCUS_CAMERA = new THREE.Vector3(0, ORBIT_HEIGHT, ORBIT_RADIUS);

const doorModelUrls = doorStudies.map(doorModelUrl);

export type Selection = { index: number; turn: number; occurrence: number };
type Props = {
  active: boolean; selection: Selection | null;
  onSelect: (selection: Selection | null) => void;
  onReady: () => void; onPlaceholder: (name: string) => void;
};

function Ready({ ready, onReady }: { ready: boolean; onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false);
  const frames = useRef(0);
  const sent = useRef(false);
  const [failure, setFailure] = useState<Error | null>(null);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    compiled.current = false;
    frames.current = 0;
    // Compile after the sky-derived environment exists so the visible material
    // variant is prepared before the eye hands off to the scene.
    Promise.resolve().then(() => gl.compileAsync(scene, camera)).then(() => {
      if (!cancelled) compiled.current = true;
    }).catch((error: unknown) => {
      if (!cancelled) setFailure(error instanceof Error ? error : new Error("Scene preparation failed"));
    });
    return () => { cancelled = true; };
  }, [ready, gl, scene, camera]);
  useFrame(() => {
    if (ready && compiled.current && !sent.current && ++frames.current > 3) {
      sent.current = true; onReady();
    }
  });
  if (failure) throw failure;
  return null;
}

function RibbonWorld({ active, selection, onSelect, motion, orbit, ribbonFrame }: Pick<Props, "active" | "selection" | "onSelect"> & { motion: RefObject<RibbonMotionSnapshot>; orbit: RefObject<RibbonMotionSnapshot>; ribbonFrame: RefObject<THREE.Group | null> }) {
  // Prepare every shape before entry so scrolling into another occurrence
  // cannot suspend the visible world.
  const doorModels = useGLTF(doorModelUrls);
  const bases = useMemo(() => doorModels.map(model => getDoorBase(model.scene)), [doorModels]);
  const apertures = useMemo(() => doorModels.map(model => getDoorAperture(model.scene)), [doorModels]);
  const { size } = useThree();
  const compact = size.width < 650;
  const radius = compact ? 2.6 : 5.7;
  const width = compact ? 1.45 : 2.25;
  const focusScale = compact ? 1.55 : 1.7;
  const focusObstacle = useMemo(() => {
    const sections = createRibbonSections(radius, width);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    // Section bounds prune sightline tests without scanning the whole helix.
    const group = new THREE.Group().add(...sections.map(section => new THREE.Mesh(section, material)));
    return { group, sections, material };
  }, [radius, width]);
  useEffect(() => () => {
    focusObstacle.sections.forEach(section => section.dispose()); focusObstacle.material.dispose();
  }, [focusObstacle]);
  const transform = ribbonFrame;
  const scrollGroup = useRef<THREE.Group>(null);
  const [cycle, setCycle] = useState(0);
  const cycleRef = useRef(0);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const focus = useRef(createRibbonFocus());
  const viewRotation = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  // A fresh visit gets a new arrangement; rerenders and reverse scrolling keep
  // every existing occurrence intact, including its focus target.
  const [arrangementSeed] = useState(readReviewSeed);
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const slots = useMemo(() => Array.from({ length: FLOATING_DOOR_COUNT }, (_, i) => i - 6), []);
  const doors = useMemo(() => slots.map(slot => {
    const occurrence = slot + cycle * 3;
    const placement = doorPlacement(occurrence, arrangementSeed);
    const studyIndex = doorShapeIndex(occurrence, doorStudies.length, arrangementSeed);
    const support = floatDoorSupport(fitDoorSupport({ ...placement, turn: placement.turn - cycle }, bases[studyIndex], radius, width, compact));
    const presentationSamples = doorPresentationSamples(support, apertures[studyIndex]);
    return { slot, occurrence, placement, studyIndex, support, presentationSamples };
  }), [slots, cycle, arrangementSeed, bases, apertures, radius, width, compact]);
  const selectedOccurrence = selection?.occurrence;
  const selectedDoor = doors.find(door => door.occurrence === selectedOccurrence);
  const focusSide = useMemo(() => selectedDoor ? chooseRibbonFocusSide(
    focusObstacle.group, selectedDoor.support, apertures[selectedDoor.studyIndex],
    { focusScale, focusPosition: FOCUS_POSITION, cameraPosition: FOCUS_CAMERA },
  ).side : 1, [selectedDoor, focusObstacle, apertures, focusScale]);
  useFrame((_, delta) => {
    if (!transform.current || !scrollGroup.current) return;
    const position = motion.current.position;
    const nextCycle = Math.floor(position);
    if (cycleRef.current !== nextCycle) { cycleRef.current = nextCycle; setCycle(nextCycle); }
    scrollGroup.current.position.y = -(position - cycle) * RIBBON_PITCH;
    if (selectedDoor) {
      anchor.copy(selectedDoor.support.position);
      anchor.y -= (position - cycle) * RIBBON_PITCH;
      anchor.y += 1.45 * selectedDoor.support.scale;
    }
    advanceRibbonFocus(focus.current, selectedDoor ? anchor : null, delta, {
      focusScale, reducedMotion: reduced.current,
      // Frame the selected door; the audio control follows the transformed spiral axis.
      focusPosition: FOCUS_POSITION,
      doorYaw: (selectedDoor?.support.yaw ?? 0) + (focusSide === -1 ? Math.PI : 0),
      cameraPosition: FOCUS_CAMERA,
      viewYaw: ribbonOrbitAngle(orbit.current.position),
    });
    transform.current.position.set(focus.current.x, focus.current.y, focus.current.z);
    transform.current.scale.setScalar(focus.current.scale);
    transform.current.rotation.set(focus.current.pitch, focus.current.yaw, 0);
    transform.current.quaternion.premultiply(viewRotation.setFromAxisAngle(up, focus.current.viewYaw));
  }, -0.5);
  return <group ref={transform}><group ref={scrollGroup} position={[0, -(motion.current.position - cycle) * RIBBON_PITCH, 0]}>
    <PorcelainRibbon radius={radius} width={width} cycle={cycle} />
    {doors.map(({ occurrence, placement, studyIndex, support, presentationSamples }) => {
      const index = projectIndexForDoor(doorStudies[studyIndex].id);
      const selected = selection?.occurrence === occurrence;
      // Preserve animation and material state when an occurrence moves to a
      // new pool slot. Modulo IDs stay unique across the contiguous pool.
      const maskId = ((occurrence % slots.length) + slots.length) % slots.length + 1;
      return <group key={occurrence} position={support.position} rotation={[0, support.yaw, 0]} scale={support.scale}>
        <ProjectArtifact focusSide={focusSide} maskId={maskId} study={doorStudies[studyIndex]} project={sanctuaryProjects[index]} selected={selected} enabled={active && (!selection || selected)} dimmed={!!selection && !selected}
          presentation={{ obstacle: focusObstacle.group, root: scrollGroup, samples: presentationSamples }}
          compact={compact} onSelect={() => {
            if (selected) window.open(sanctuaryProjects[index].url, "_blank", "noopener,noreferrer");
            else onSelect({ index, turn: placement.turn, occurrence });
          }} />
      </group>;
    })}
  </group></group>;
}

function Content(props: Props) {
  const [skyReady, setSkyReady] = useState(false);
  const handleSkyReady = useCallback(() => setSkyReady(true), []);
  const [environmentReady, setEnvironmentReady] = useState(false);
  const handleEnvironmentReady = useCallback(() => setEnvironmentReady(true), []);
  const ribbonFrame = useRef<THREE.Group>(null);
  const reflectionScene = useRef<THREE.Scene | null>(null);
  const { active, selection, onSelect } = props;
  const onNavigate = useCallback(() => onSelect(null), [onSelect]);
  const { motion, orbit, atmosphere } = useRibbonMotion({ enabled: active, paused: selection !== null, onUserNavigate: onNavigate });
  return <>
    <AdaptiveQuality enabled={active} />
    <OrbitCamera orbit={orbit} />
    <StudioLight atmosphere={atmosphere} reflectionScene={reflectionScene} onReady={handleEnvironmentReady} />
    <PlayControl3D theme="cloud" anchorHeight={2.8} ribbonMotion={motion} ribbonFrame={ribbonFrame} atmosphere={atmosphere} />
    <Suspense fallback={null}>
      {/* Finish the immutable sky before allowing the entrance to reveal it. */}
      <OrbitSky onReady={handleSkyReady} atmosphere={atmosphere} reflectionScene={reflectionScene} />
      <IntroSceneReveal>
        <RibbonWorld {...props} motion={motion} orbit={orbit} ribbonFrame={ribbonFrame} />
      </IntroSceneReveal>
      <Ready ready={skyReady && environmentReady} onReady={props.onReady} />
    </Suspense>
  </>;
}

export function SanctuaryScene(props: Props) {
  const [nativeViewport, setNativeViewport] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(MOBILE_SCROLL_QUERY);
    const update = () => setNativeViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  // Mobile's canvas is pinned; scroll cannot change its dimensions.
  // ResizeObserver still handles orientation and actual size changes.
  return <Canvas camera={{ position: [0, ORBIT_HEIGHT, ORBIT_RADIUS], fov: 42, near: 0.1, far: 2400 }} dpr={[1, 1.5]} shadows
    resize={{ scroll: !nativeViewport }}
    gl={{ antialias: true, alpha: false, stencil: true, powerPreference: "high-performance" }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 0, 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.0;
      // Preserve the full sky detail in the tinted cast-glass portals.
      gl.transmissionResolutionScale = 0.85;
      gl.setClearColor("#dceaf0");
    }}><Content {...props} /></Canvas>;
}
