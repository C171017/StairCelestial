"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { useRibbonMotion } from "@/hooks/useRibbonMotion";
import { type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { advanceRibbonFocus, createRibbonFocus } from "@/lib/ribbonFocus";
import { RIBBON_PITCH } from "@/lib/ribbonGeometry";
import { sanctuaryProjects, projectIndexForDoor } from "@/lib/sanctuaryContent";
import { doorStudies, doorModelUrl } from "@/lib/doorStudies";
import { doorPlacement, doorShapeIndex } from "@/lib/doorPlacement";
import { ORBIT_HEIGHT, ORBIT_RADIUS, ribbonOrbitAngle } from "@/lib/ribbonOrbit";
import { IntroSceneReveal } from "@/components/scene/IntroSceneReveal";
import { PlayControl3D } from "@/components/scene/PlayControl3D";
import { GlassRibbon } from "./GlassRibbon";
import { ProjectArtifact } from "./ProjectArtifact";
import { StudioLight } from "./SceneEnvironment";
import { OrbitSky } from "./OrbitSky";
import { OrbitCamera } from "./OrbitCamera";
import { RIBBON_SHADOW_COUNT } from "./ribbonShadows";
import { fitDoorSupport, getDoorBase, doorBaseWorldPoint } from "@/lib/doorSupport";

const doorModelUrls = doorStudies.map(doorModelUrl);

export type Selection = { index: number; turn: number; occurrence: number };
type Props = {
  active: boolean; selection: Selection | null;
  onSelect: (selection: Selection | null) => void;
  onReady: () => void; onPlaceholder: (name: string) => void;
};

function Ready({ onReady }: { onReady: () => void }) {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false);
  const frames = useRef(0);
  const sent = useRef(false);
  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera).then(() => { if (!cancelled) compiled.current = true; });
    return () => { cancelled = true; };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (compiled.current && !sent.current && ++frames.current > 3) {
      sent.current = true; onReady();
    }
  });
  return null;
}

function RibbonWorld({ active, selection, onSelect, motion, orbit, ribbonFrame }: Pick<Props, "active" | "selection" | "onSelect"> & { motion: RefObject<RibbonMotionSnapshot>; orbit: RefObject<RibbonMotionSnapshot>; ribbonFrame: RefObject<THREE.Group | null> }) {
  // Random draws may omit a shape initially; prepare every shape before entry
  // so its first later appearance cannot suspend the visible world.
  const doorModels = useGLTF(doorModelUrls);
  const bases = useMemo(() => doorModels.map(model => getDoorBase(model.scene)), [doorModels]);
  const { size } = useThree();
  const compact = size.width < 650;
  const radius = compact ? 2.6 : 5.7;
  const width = compact ? 1.45 : 2.25;
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
  const [arrangementSeed] = useState(() => crypto.getRandomValues(new Uint32Array(1))[0]);
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const slots = useMemo(() => Array.from({ length: RIBBON_SHADOW_COUNT }, (_, i) => i - 6), []);
  const doors = useMemo(() => slots.map(slot => {
    const occurrence = slot + cycle * 3;
    const placement = doorPlacement(occurrence, arrangementSeed);
    const studyIndex = doorShapeIndex(occurrence, doorStudies.length, arrangementSeed);
    const support = fitDoorSupport({ ...placement, turn: placement.turn - cycle }, bases[studyIndex], radius, width, compact);
    return { slot, occurrence, placement, studyIndex, support };
  }), [slots, cycle, arrangementSeed, bases, radius, width, compact]);
  const selectedOccurrence = selection?.occurrence;
  const selectedDoor = doors.find(door => door.occurrence === selectedOccurrence);
  const doorShadows = useMemo(() => doors.map(({ occurrence, support }) => {
    const position = doorBaseWorldPoint(support, new THREE.Vector2((support.base.minX + support.base.maxX) / 2, 0));
    position.y = support.position.y;
    return {
      position,
      scale: support.scale,
      yaw: support.yaw,
      visible: selectedOccurrence === undefined || selectedOccurrence === occurrence,
    };
  }), [doors, selectedOccurrence]);
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
      focusScale: compact ? 1.55 : 1.7, reducedMotion: reduced.current,
      // Frame the selected door; the audio control follows the transformed spiral axis.
      focusPosition: { x: 0, y: 2.3, z: 4.2 },
      doorYaw: selectedDoor?.support.yaw ?? 0,
      cameraPosition: { x: 0, y: ORBIT_HEIGHT, z: ORBIT_RADIUS },
      viewYaw: ribbonOrbitAngle(orbit.current.position),
    });
    transform.current.position.set(focus.current.x, focus.current.y, focus.current.z);
    transform.current.scale.setScalar(focus.current.scale);
    transform.current.rotation.set(focus.current.pitch, focus.current.yaw, 0);
    transform.current.quaternion.premultiply(viewRotation.setFromAxisAngle(up, focus.current.viewYaw));
  }, -0.5);
  return <group ref={transform}><group ref={scrollGroup} position={[0, -(motion.current.position - cycle) * RIBBON_PITCH, 0]}>
    <GlassRibbon radius={radius} width={width} focused={!!selection} doorShadows={doorShadows} />
    {doors.map(({ occurrence, placement, studyIndex, support }) => {
      const index = projectIndexForDoor(doorStudies[studyIndex].id);
      const selected = selection?.occurrence === occurrence;
      // Preserve animation and material state when an occurrence moves to a
      // new pool slot. Modulo IDs stay unique across the contiguous pool.
      const maskId = ((occurrence % slots.length) + slots.length) % slots.length + 1;
      return <group key={occurrence} position={support.position} rotation={[0, support.yaw, 0]} scale={support.scale}>
        <ProjectArtifact maskId={maskId} study={doorStudies[studyIndex]} project={sanctuaryProjects[index]} selected={selected} enabled={active && (!selection || selected)} dimmed={!!selection && !selected}
          compact={compact} onSelect={() => {
            if (selected) window.open(sanctuaryProjects[index].url, "_blank", "noopener,noreferrer");
            else onSelect({ index, turn: placement.turn, occurrence });
          }} />
      </group>;
    })}
  </group></group>;
}

function Content(props: Props) {
  const { size, setDpr } = useThree();
  useEffect(() => {
    // A large desktop already supplies enough screen pixels for this artwork.
    // Avoid rendering the glass at 4K+ merely because the display is high-DPI.
    setDpr(Math.min(window.devicePixelRatio, size.width >= 1500 ? 1 : 1.5));
  }, [setDpr, size.width]);
  const ribbonFrame = useRef<THREE.Group>(null);
  const { active, selection, onSelect } = props;
  const onNavigate = useCallback(() => onSelect(null), [onSelect]);
  const { motion, orbit } = useRibbonMotion({ enabled: active, paused: selection !== null, onUserNavigate: onNavigate });
  return <>
    <OrbitCamera orbit={orbit} />
    <StudioLight />
    <PlayControl3D theme="cloud" ribbonMotion={motion} ribbonFrame={ribbonFrame} />
    <Suspense fallback={null}>
      {/* Ambient sky follows page visibility, independently of entrance input gating. */}
      <OrbitSky />
      <IntroSceneReveal>
        <RibbonWorld {...props} motion={motion} orbit={orbit} ribbonFrame={ribbonFrame} />
      </IntroSceneReveal>
      <Ready onReady={props.onReady} />
    </Suspense>
  </>;
}

export function SanctuaryScene(props: Props) {
  return <Canvas camera={{ position: [0, ORBIT_HEIGHT, ORBIT_RADIUS], fov: 42, near: 0.1, far: 2400 }} dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: false, stencil: true, powerPreference: "high-performance" }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 0, 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
      // Refraction samples the completed sky at roughly CSS-pixel resolution;
      // glass silhouettes still use the full, antialiased canvas resolution.
      gl.transmissionResolutionScale = 2 / 3;
      gl.setClearColor("#dceaf0");
    }}><Content {...props} /></Canvas>;
}
