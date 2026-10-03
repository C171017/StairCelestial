"use client";

import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** A world-fixed sky surrounds the entire orbit, including the 0°/360° join. */
export function OrbitSky() {
  const source = useTexture("/textures/sanctuary/cloudscape-360.webp");
  const texture = useMemo(() => {
    const map = source.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.needsUpdate = true;
    return map;
  }, [source]);
  const uniforms = useMemo(() => ({ panorama: { value: texture } }), [texture]);
  useEffect(() => () => texture.dispose(), [texture]);

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
        varying vec2 skyUv;
        void main() {
          vec3 color = texture2D(panorama, skyUv).rgb;
          // Crossfade the narrow longitude join: generated panoramas are not
          // guaranteed to have pixel-identical edges. Both sides meet at their
          // average, with no visible cut when the camera passes behind it.
          float edge = min(skyUv.x, 1.0 - skyUv.x);
          float join = 0.5 * (1.0 - smoothstep(0.0, 0.035, edge));
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
