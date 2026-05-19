"use client";

import { Stars } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

function MilkyWayBand() {
  const material = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, "rgba(8, 12, 28, 0)");
      gradient.addColorStop(0.35, "rgba(90, 120, 200, 0.08)");
      gradient.addColorStop(0.5, "rgba(180, 200, 255, 0.14)");
      gradient.addColorStop(0.65, "rgba(90, 120, 200, 0.08)");
      gradient.addColorStop(1, "rgba(8, 12, 28, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh position={[0, 22, -80]} rotation={[0.2, 0.6, -0.35]} material={material}>
      <planeGeometry args={[180, 90]} />
    </mesh>
  );
}

export function Atmosphere() {
  return (
    <>
      <color attach="background" args={["#030508"]} />
      <fog attach="fog" args={["#030508", 18, 72]} />
      <Stars
        radius={120}
        depth={60}
        count={2500}
        factor={3}
        saturation={0.15}
        fade
        speed={0.15}
      />
      <MilkyWayBand />
    </>
  );
}
