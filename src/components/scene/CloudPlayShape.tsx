"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RIBBON_CRUISE_SPEED, type RibbonMotionSnapshot } from "@/lib/ribbonMotion";
import { createPlayShapeGeometry } from "@/lib/playShapeGeometry";

/** A local reflection map gives the control bright studio panels without
 * changing the lighting of the ribbon and project objects. */
function createControlReflections() {
  const width = 256, height = 128;
  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = y / height;
    for (let x = 0; x < width; x++) {
      const longitude = x / width;
      const panel = Math.exp(-Math.pow((longitude - 0.18) / 0.055, 2))
        + Math.exp(-Math.pow((longitude - 0.7) / 0.035, 2));
      const overhead = Math.exp(-Math.pow((latitude - 0.78) / 0.1, 2));
      const light = 0.12 + 5 * panel * Math.exp(-Math.pow((latitude - 0.52) / 0.3, 4)) + 3 * overhead;
      const i = (y * width + x) * 4;
      pixels[i] = light; pixels[i + 1] = light; pixels[i + 2] = light * 1.04; pixels[i + 3] = 1;
    }
  }
  const map = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.needsUpdate = true;
  return map;
}

export function CloudPlayShape({ playing, scale, active, ribbonMotion }: {
  playing: boolean;
  scale: number;
  active: boolean;
  ribbonMotion?: RefObject<RibbonMotionSnapshot>;
}) {
  const spinGroup = useRef<THREE.Group>(null);
  const spinAngle = useRef(0);
  const spinAxis = useMemo(() => new THREE.Vector3(0.25, 1, 0.12).normalize(), []);
  const shape = useMemo(createPlayShapeGeometry, []);
  const reflections = useMemo(createControlReflections, []);
  const progress = useRef(0);
  const edges = useMemo(() => new THREE.LineSegments(
    new THREE.EdgesGeometry(shape.geometry, 20),
    new THREE.LineBasicMaterial({ color: "#bcc8d2", transparent: true, opacity: 0.22, depthWrite: false }),
  ), [shape]);
  const reducedMotion = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => { reducedMotion.current = query.matches; };
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => () => {
    shape.geometry.dispose(); edges.geometry.dispose(); edges.material.dispose(); reflections.dispose();
  }, [shape, edges, reflections]);
  useFrame((_, dt) => {
    // Integrate speed so ribbon acceleration never causes a jump in orientation.
    // The base spin continues even when the ribbon settles to a stop.
    if (active && !reducedMotion.current) {
      const ribbonSpeed = Math.abs(ribbonMotion?.current.velocity ?? 0);
      const spinSpeed = 0.045 + 0.025 * ribbonSpeed / RIBBON_CRUISE_SPEED;
      spinAngle.current += Math.min(dt, 0.05) * spinSpeed;
    }
    if (spinGroup.current) {
      spinGroup.current.quaternion.setFromAxisAngle(spinAxis, reducedMotion.current ? 0 : spinAngle.current);
    }
    const target = playing ? 1 : 0;
    if (progress.current === target) return;
    const next = reducedMotion.current ? target : THREE.MathUtils.damp(progress.current, target, 5.5, Math.min(dt, 0.05));
    progress.current = Math.abs(target - next) < 0.001 ? target : next;
    shape.update(progress.current);
    edges.geometry.dispose();
    edges.geometry = new THREE.EdgesGeometry(shape.geometry, 20);
  });
  return <group ref={spinGroup} scale={scale}>
    <mesh geometry={shape.geometry}>
      <meshPhysicalMaterial color="#080a0d"
        metalness={0.35} roughness={0.14} clearcoat={1} clearcoatRoughness={0.055}
        envMap={reflections} envMapIntensity={1.8}
        flatShading polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
    <primitive object={edges} />
  </group>;
}
