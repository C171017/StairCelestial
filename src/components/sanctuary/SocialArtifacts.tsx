"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { socialDestinations } from "@/lib/sanctuaryContent";

const GITHUB_PATH = "M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.922.435.375.81 1.11.81 2.237 0 1.617-.015 2.917-.015 3.312 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

function markTexture(kind: "github" | "linkedin") {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = kind === "linkedin" ? "#ffffff" : "#314756";
  if (kind === "linkedin") {
    ctx.font = "bold 210px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("in", 128, 201);
  } else {
    ctx.translate(14, 10); ctx.scale(9.5, 9.5); ctx.fill(new Path2D(GITHUB_PATH));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function SocialToken({ kind, position, onPlaceholder, enabled }: {
  kind: "github" | "linkedin"; position: [number, number, number]; onPlaceholder: (name: string) => void; enabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => markTexture(kind), [kind]);
  const name = kind === "github" ? "GitHub" : "LinkedIn";
  const hover = useRef(false);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches; return () => texture.dispose(); }, [texture]);
  useFrame(({ clock }, dt) => {
    if (!group.current) return;
    const amount = 1 - Math.exp(-5 * dt);
    group.current.position.y = position[1] + (reduced.current ? 0 : Math.sin(clock.elapsedTime * 0.38 + (kind === "github" ? 2 : 0)) * 0.07);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, hover.current ? 0 : kind === "github" ? -0.16 : 0.18, amount);
  });
  function activate() {
    if (!enabled) return;
    const url = socialDestinations[kind];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else onPlaceholder(name);
  }
  return (
    <group ref={group} position={position} rotation={[0.04, 0, kind === "github" ? 0.09 : -0.09]}>
      <RoundedBox args={[1.2, 1.2, 0.28]} radius={0.21} smoothness={5}
        onClick={(e) => { e.stopPropagation(); activate(); }}
        onPointerOver={() => { hover.current = true; if (enabled) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { hover.current = false; document.body.style.cursor = ""; }}>
        <meshPhysicalMaterial color={kind === "linkedin" ? "#659bb5" : "#e5eef0"} roughness={0.13} metalness={0.22} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.148]}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <Html center position={[0, -0.99, 0]} zIndexRange={[25, 0]}>
        <button className="social-label" onClick={activate} disabled={!enabled}>{name}<span aria-hidden>↗</span></button>
      </Html>
    </group>
  );
}

export function SocialArtifacts({ enabled, onPlaceholder }: { enabled: boolean; onPlaceholder: (name: string) => void }) {
  const { viewport, size } = useThree();
  const compact = size.width < 650;
  const x = compact ? viewport.width * 0.31 : Math.min(viewport.width * 0.36, 9.5);
  return (
    <group scale={compact ? 0.8 : 1}>
      <SocialToken kind="linkedin" position={[-x / (compact ? 0.8 : 1), compact ? 8.4 : 2.6, 0]} enabled={enabled} onPlaceholder={onPlaceholder} />
      <SocialToken kind="github" position={[x / (compact ? 0.8 : 1), compact ? 8.4 : -1.6, 0]} enabled={enabled} onPlaceholder={onPlaceholder} />
    </group>
  );
}
