"use client";

import { Html, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { doorStudies, doorModelUrl } from "@/lib/doorStudies";
import { doorScatter } from "@/lib/doorPlacement";
import { GlassDoor } from "./GlassDoor";
import { Sky, StudioLight } from "./SceneEnvironment";

type Props = {
  selected: number | null; amount: number; angle: number;
  onSelect: (index: number) => void; onReady: () => void;
};

function Collection({ selected, amount, angle, onSelect, onReady }: Props) {
  useGLTF(doorStudies.map(doorModelUrl));
  const { viewport, size } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const compact = size.width < 700;
  // Pack an irregular constellation into the space between header and controls.
  const scale = Math.min(viewport.width / (compact ? 8.8 : 21), viewport.height * (compact ? .037 : .059));
  const spreadX = viewport.width * (compact ? .30 : .36);
  const spreadY = viewport.height * (compact ? .31 : .24);
  const centerY = viewport.height * (compact ? .025 : .04);
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
      const placement = doorScatter[index];
      const point = compact ? placement.narrow : placement.wide;
      const isSelected = selected === index;
      const targetScale = selected === null ? scale * placement.scale : isSelected ? Math.min(viewport.height * .15, viewport.width * .23) : 0;
      const x = selected === null ? point[0] * spreadX : 0;
      const y = selected === null ? point[1] * spreadY + centerY - 1.55 * targetScale : -1.55 * targetScale;
      group.position.x = THREE.MathUtils.lerp(group.position.x, x, blend);
      group.position.y = THREE.MathUtils.lerp(group.position.y, y, blend);
      group.position.z = THREE.MathUtils.lerp(group.position.z, selected === null ? placement.depth : 0, blend);
      group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, blend));
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, placement.yaw + angle * Math.PI / 180, blend);
      group.visible = group.scale.x > .005;
    });
  });
  return <>{doorStudies.map((study, index) => <group key={study.id} ref={value => { groups.current[index] = value; }} scale={0}>
    <GlassDoor study={study} amount={amount / 100} onSelect={() => onSelect(index)} enabled={selected === null || selected === index} />
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
