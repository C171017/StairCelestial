"use client";

import { Html, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { doorStudies, type DoorOpening } from "@/lib/doorStudies";
import { GlassDoor } from "./GlassDoor";
import { Sky, StudioLight } from "./SceneEnvironment";

type Props = {
  selected: number | null; amount: number; opening: DoorOpening; angle: number;
  onSelect: (index: number) => void; onReady: () => void;
};

function Collection({ selected, amount, opening, angle, onSelect, onReady }: Props) {
  useGLTF(doorStudies.map(study => `/models/doors/${study.id}.glb`));
  const { viewport, size } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const compact = size.width < 700;
  const cols = compact ? 2 : 3;
  const rows = compact ? 3 : 2;
  // Reserve space for the quiet header and comparison controls.
  const roomHeight = viewport.height * (compact ? 0.59 : 0.61);
  const scale = Math.min((viewport.width * 0.86) / (cols * 3.8), roomHeight / (rows * 4.5));
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; };
    update(); query.addEventListener("change", update);
    onReady();
    return () => query.removeEventListener("change", update);
  }, [onReady]);
  useFrame((_, dt) => {
    const blend = reduced.current ? 1 : 1 - Math.exp(-6 * Math.min(dt, .05));
    groups.current.forEach((group, index) => {
      if (!group) return;
      const isSelected = selected === index;
      const targetScale = selected === null ? scale : isSelected ? Math.min(viewport.height * .15, viewport.width * .23) : 0;
      const x = selected === null ? (index % cols - (cols - 1) / 2) * 4.05 * scale : 0;
      const y = selected === null ? ((rows - 1) / 2 - Math.floor(index / cols)) * 4.5 * scale - 1.55 * scale + viewport.height * .055 : -1.55 * targetScale;
      group.position.x = THREE.MathUtils.lerp(group.position.x, x, blend);
      group.position.y = THREE.MathUtils.lerp(group.position.y, y, blend);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, blend));
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, doorStudies[index].angle + angle * Math.PI / 180, blend);
      group.visible = group.scale.x > .005;
    });
  });
  return <>{doorStudies.map((study, index) => <group key={study.id} ref={value => { groups.current[index] = value; }} scale={0}>
    <GlassDoor study={study} amount={amount / 100} opening={opening} onSelect={() => onSelect(index)} enabled={selected === null || selected === index} />
    {selected === null && <Html center position={[0, -.37, .1]} zIndexRange={[5, 0]}>
      <button className="study-object-label" onClick={() => onSelect(index)} aria-label={`Inspect ${study.name}`}><span>{study.number}</span>{study.name}</button>
    </Html>}
  </group>)}</>;
}

export function DoorStudyScene(props: Props) {
  return <Canvas orthographic camera={{ position: [0, 0, 25], zoom: 75, near: .1, far: 100 }} dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    onCreated={({ camera, gl }) => {
      camera.lookAt(0, 0, 0);
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.04;
    }}>
    <StudioLight />
    <Suspense fallback={null}><Sky /><Collection {...props} /></Suspense>
  </Canvas>;
}
