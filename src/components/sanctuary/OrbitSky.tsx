"use client";

import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";

/** A world-fixed sky surrounds the entire orbit, including the 0°/360° join. */
export function OrbitSky() {
  const { gl, size } = useThree();
  const maxSize = gl.capabilities.maxTextureSize;
  const resolution = size.width >= 700 && maxSize >= 8192 ? "8k" : maxSize >= 4096 ? "4k" : null;
  const original = "/textures/sanctuary/cloudscape-360.webp";
  // Keep the scene visible while a larger texture loads, including on resize.
  return <Suspense fallback={<Panorama url={original} stitched={false} />}>
    <Panorama url={resolution ? `/textures/sanctuary/cloudscape-360-${resolution}.webp` : original} stitched={!!resolution} />
  </Suspense>;
}

function Panorama({ url, stitched }: { url: string; stitched: boolean }) {
  const source = useTexture(url);
  const { gl } = useThree();
  const texture = useMemo(() => {
    const map = source.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return map;
  }, [source, gl]);
  const uniforms = useMemo(() => ({ panorama: { value: texture }, repairJoin: { value: stitched ? 0 : 1 } }), [texture, stitched]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const image = texture.image as { width: number; height: number };
      gl.domElement.dataset.skyResolution = `${image.width}x${image.height}`;
    }
  }, [gl, texture]);

  return <mesh position={[0, -120, 0]} rotation={[0, Math.PI * 0.15, 0]} renderOrder={-100} raycast={() => null}>
    <sphereGeometry args={[450, 96, 48]} />
    <shaderMaterial uniforms={uniforms} side={THREE.BackSide} depthWrite={false} toneMapped={false}
      vertexShader={`
        varying vec2 skyUv;
        void main() {
          skyUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform sampler2D panorama;
        uniform float repairJoin;
        varying vec2 skyUv;
        void main() {
          vec3 color = texture2D(panorama, skyUv).rgb;
          // Crossfade the narrow longitude join: generated panoramas are not
          // guaranteed to have pixel-identical edges. Both sides meet at their
          // average, with no visible cut when the camera passes behind it.
          float edge = min(skyUv.x, 1.0 - skyUv.x);
          // The upscaled panorama already has a continuous wraparound tile.
          // Only the original low-resolution loading fallback needs repair.
          float join = repairJoin * 0.5 * (1.0 - smoothstep(0.0, 0.035, edge));
          color = mix(color, texture2D(panorama, vec2(1.0 - skyUv.x, skyUv.y)).rgb, join);
          // Latitude collapses at the poles; remove any longitude pinching.
          float pole = smoothstep(0.94, 1.0, abs(skyUv.y * 2.0 - 1.0));
          color = mix(color, texture2D(panorama, vec2(0.5, skyUv.y)).rgb, pole);
          gl_FragColor = vec4(color, 1.0);
          #include <colorspace_fragment>
        }
      `} />
  </mesh>;
}
