"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RIBBON_CRUISE_SPEED, type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { socialDestinations } from "@/lib/sanctuaryContent";

const GITHUB_PATH = "M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.922.435.375.81 1.11.81 2.237 0 1.617-.015 2.917-.015 3.312 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

// The white letterforms are holes in the logo, open through the full depth.
const LINKEDIN_PATH = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

function extrudedLogo(kind: "github" | "linkedin") {
  const path = kind === "github" ? GITHUB_PATH : LINKEDIN_PATH;
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="#000" fill-rule="evenodd" /></svg>`);
  const shapes = svg.paths.flatMap((outline) => SVGLoader.createShapes(outline));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 4,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.16,
    bevelSize: 0.12,
    bevelSegments: 3,
    curveSegments: 24,
  });
  // SVG coordinates point down; rotate into the scene while keeping winding intact.
  geometry.rotateX(Math.PI);
  geometry.scale(1.05 / 24, 1.05 / 24, 1.05 / 24);
  geometry.center();
  return geometry;
}

function SocialToken({ kind, position, orbitDepth, onPlaceholder, enabled, motion }: {
  motion: RefObject<RibbonMotionSnapshot>;
  orbitDepth: number;
  kind: "github" | "linkedin"; position: [number, number, number]; onPlaceholder: (name: string) => void; enabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const logo = useRef<THREE.Mesh>(null);
  const motionTime = useRef(0);
  const spinTime = useRef(0);
  const geometry = useMemo(() => extrudedLogo(kind), [kind]);
  const name = kind === "github" ? "GitHub" : "LinkedIn";
  const hover = useRef(false);
  const reduced = useRef(false);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = preference.matches; };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, dt) => {
    if (!group.current || !logo.current) return;
    // Pause under the pointer so a drifting logo stays easy to click.
    if (enabled && !reduced.current && !hover.current) {
      const step = Math.min(dt, 0.05);
      // Use the ribbon's eased scene velocity, never wheel/touch input velocity.
      motionTime.current += step * 0.14 * Math.abs(motion.current.velocity) / RIBBON_CRUISE_SPEED;
      spinTime.current += step;
    }
    const t = motionTime.current;
    const spin = spinTime.current;
    const phase = kind === "github" ? 2.4 : 0.7;
    const direction = kind === "github" ? -1 : 1;
    if (reduced.current) {
      group.current.position.set(...position);
      logo.current.rotation.set(0.04, direction * 0.18, direction * -0.09);
      return;
    }
    // Horizontal XZ ellipse around the staircase; altitude stays fixed.
    // Opposite starting phases keep the two satellites separated on the orbit.
    const orbitAngle = t * 0.34 + (kind === "linkedin" ? Math.PI : 0);
    group.current.position.set(
      Math.abs(position[0]) * Math.cos(orbitAngle),
      position[1],
      orbitDepth * Math.sin(orbitAngle),
    );
    logo.current.rotation.set(
      0.04 + Math.sin(spin * 0.08 + phase) * 0.16,
      direction * (0.18 + spin * 0.075),
      direction * -0.09 + Math.sin(spin * 0.06 + phase) * 0.12,
    );
  });
  function activate() {
    if (!enabled) return;
    const url = socialDestinations[kind];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else onPlaceholder(name);
  }
  return (
    <group ref={group} position={position}>
      <mesh ref={logo} geometry={geometry}
        onClick={(e) => { e.stopPropagation(); activate(); }}
        onPointerOver={() => { hover.current = true; if (enabled) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { hover.current = false; document.body.style.cursor = ""; }}>
        <meshPhysicalMaterial color={kind === "linkedin" ? "#0a66c2" : "#314756"} roughness={0.13} metalness={0.22} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.8} />
      </mesh>
      <Html center position={[0, -0.99, 0]} zIndexRange={[25, 0]}>
        <button className="social-label" onClick={activate} disabled={!enabled} aria-label={name} />
      </Html>
    </group>
  );
}

export function SocialArtifacts({ enabled, onPlaceholder, motion }: { enabled: boolean; onPlaceholder: (name: string) => void; motion: RefObject<RibbonMotionSnapshot> }) {
  const { viewport, size } = useThree();
  const compact = size.width < 650;
  // Both ellipse axes clear the ribbon's outer edge, including the logo itself.
  const scale = compact ? 0.8 : 1;
  const x = compact ? 4.4 : Math.max(7.8, Math.min(viewport.width * 0.36, 9.5));
  const orbitDepth = (compact ? 4.1 : 7.6) / scale;
  return (
    <group scale={scale}>
      <SocialToken orbitDepth={orbitDepth} motion={motion} kind="linkedin" position={[-x / scale, compact ? 8.4 : 2.6, 0]} enabled={enabled} onPlaceholder={onPlaceholder} />
      <SocialToken orbitDepth={orbitDepth} motion={motion} kind="github" position={[x / scale, compact ? 8.4 : -1.6, 0]} enabled={enabled} onPlaceholder={onPlaceholder} />
    </group>
  );
}
