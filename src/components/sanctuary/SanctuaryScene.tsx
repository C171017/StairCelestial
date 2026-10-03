"use client";

import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useRibbonMotion } from "@/hooks/useRibbonMotion";
import { positiveModulo } from "@/lib/ribbonMotion";
import { advanceRibbonFocus, createRibbonFocus } from "@/lib/ribbonFocus";
import { ribbonPoint, RIBBON_PITCH } from "@/lib/ribbonGeometry";
import { sanctuaryProjects } from "@/lib/sanctuaryContent";
import { GlassRibbon } from "./GlassRibbon";
import { ProjectArtifact } from "./ProjectArtifact";
import { SocialArtifacts } from "./SocialArtifacts";

export type Selection = { index: number; turn: number };
type Props = {
  active: boolean; selection: Selection | null;
  onSelect: (selection: Selection | null) => void;
  onReady: () => void; onPlaceholder: (name: string) => void;
};

function Sky() {
  const texture = useTexture("/textures/sanctuary/cloudscape.webp");
  const { scene, size } = useThree();
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const viewAspect = size.width / size.height;
    const x = Math.min(1, viewAspect / imageAspect);
    const y = Math.min(1, imageAspect / viewAspect);
    texture.repeat.set(x, y);
    texture.offset.set((1 - x) / 2, (1 - y) / 2);
    texture.updateMatrix();
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene, texture, size.width, size.height]);
  return null;
}

function StudioLight() {
  return <>
    <ambientLight intensity={1.0} color="#e4f1ff" />
    <directionalLight position={[-8, 12, 10]} intensity={3.3} color="#fff2d9" />
    <directionalLight position={[10, 4, -6]} intensity={2.1} color="#b4d9f4" />
    <Environment resolution={128} frames={1}>
      <color attach="background" args={["#a7bccc"]} />
      <Lightformer form="rect" intensity={5} color="#fff8e8" position={[-7, 6, 5]} scale={[4, 12, 1]} rotation={[0, Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[7, 3, 3]} scale={[3, 15, 1]} rotation={[0, -Math.PI / 3, 0]} />
      <Lightformer form="rect" intensity={4} color="#daeaff" position={[0, 10, 0]} scale={[20, 5, 1]} rotation={[Math.PI / 2, 0, 0]} />
      <Lightformer form="rect" intensity={0.2} color="#314657" position={[0, -5, -10]} scale={[20, 4, 1]} />
    </Environment>
  </>;
}

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

function RibbonWorld({ active, selection, onSelect }: Pick<Props, "active" | "selection" | "onSelect">) {
  const { size } = useThree();
  const compact = size.width < 650;
  const radius = compact ? 2.6 : 5.7;
  const width = compact ? 1.45 : 2.25;
  const transform = useRef<THREE.Group>(null);
  const scrollGroup = useRef<THREE.Group>(null);
  const [cycle, setCycle] = useState(0);
  const cycleRef = useRef(0);
  const onNavigate = useCallback(() => onSelect(null), [onSelect]);
  const motion = useRibbonMotion({ enabled: active, paused: selection !== null, onUserNavigate: onNavigate });
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const focus = useRef(createRibbonFocus());
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const slots = useMemo(() => Array.from({ length: 15 }, (_, i) => i - 6), []);
  useFrame((_, delta) => {
    if (!transform.current || !scrollGroup.current) return;
    const position = motion.current.position;
    const nextCycle = Math.floor(position);
    if (cycleRef.current !== nextCycle) { cycleRef.current = nextCycle; setCycle(nextCycle); }
    scrollGroup.current.position.y = -(position - cycle) * RIBBON_PITCH;
    if (selection) {
      ribbonPoint(selection.turn - cycle, radius, anchor);
      anchor.y -= (position - cycle) * RIBBON_PITCH;
      anchor.y += compact ? 0.8 : 1;
    }
    advanceRibbonFocus(focus.current, selection ? anchor : null, delta, {
      focusScale: compact ? 1.55 : 1.7, reducedMotion: reduced.current,
      focusPosition: { x: 0, y: compact ? 1 : 0.2, z: 4.2 },
    });
    transform.current.position.set(focus.current.x, focus.current.y, focus.current.z);
    transform.current.scale.setScalar(focus.current.scale);
  });
  return <group ref={transform}><group ref={scrollGroup} position={[0, -(motion.current.position - cycle) * RIBBON_PITCH, 0]}>
    <GlassRibbon radius={radius} width={width} focused={!!selection} />
    {slots.map((slot) => {
      const index = positiveModulo(slot + cycle * 3, sanctuaryProjects.length);
      const turn = slot / 3;
      const position = ribbonPoint(turn, radius);
      const selected = !!selection && Math.abs(selection.turn - turn - cycle) < 0.00001;
      return <group key={slot} position={[position.x, position.y + 0.11, position.z]}>
        <ProjectArtifact project={sanctuaryProjects[index]} selected={selected} enabled={active && (!selection || selected)} dimmed={!!selection && !selected}
          compact={compact} onSelect={() => onSelect(selected ? null : { index, turn: turn + cycle })} />
      </group>;
    })}
  </group></group>;
}

function Content(props: Props) {
  return <Suspense fallback={null}>
    <Sky /><StudioLight /><RibbonWorld {...props} />
    <SocialArtifacts enabled={props.active} onPlaceholder={props.onPlaceholder} />
    <Ready onReady={props.onReady} />
  </Suspense>;
}

export function SanctuaryScene(props: Props) {
  return <Canvas camera={{ position: [0, 2.8, 24], fov: 42, near: 0.1, far: 110 }} dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 0, 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
      gl.setClearColor("#dceaf0");
    }}><Content {...props} /></Canvas>;
}
