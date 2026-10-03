"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkyEffects } from "./SkyEffects";
import { useSkyVideo } from "@/hooks/useSkyVideo";

/** A world-fixed sky surrounds the entire orbit, including the 0°/360° join. */
export function OrbitSky({ active = true }: { active?: boolean }) {
  const { gl, size } = useThree();
  const maxSize = gl.capabilities.maxTextureSize;
  const resolution = size.width >= 700 && maxSize >= 8192 ? "8k" : maxSize >= 4096 ? "4k" : null;
  const original = "/textures/sanctuary/cloudscape-360.webp";
  // A development-only still frame makes sparse effects reviewable without
  // changing their real timing or exposing debug controls in the production UI.
  const reviewTime = useMemo(() => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return undefined;
    const value = new URLSearchParams(window.location.search).get("sky-review");
    const seconds = value === null ? NaN : Number(value);
    return Number.isFinite(seconds) && seconds >= 0 && seconds < 32 ? { current: seconds } : undefined;
  }, []);
  const video = useSkyVideo({
    src: `/videos/sanctuary/cloud-drift-${size.width < 700 || maxSize < 4096 ? "compact" : "desktop"}.mp4`,
    active,
  });
  // Keep the scene visible while a larger texture loads, including on resize.
  return <><Suspense fallback={<Panorama url={original} stitched={false} motion={video} />}>
    <Panorama url={resolution ? `/textures/sanctuary/cloudscape-360-${resolution}.webp` : original} stitched={!!resolution} motion={video} />
  </Suspense><SkyEffects active={active} time={reviewTime} /></>;
}

function Panorama({ url, stitched, motion }: { url: string; stitched: boolean; motion: ReturnType<typeof useSkyVideo> }) {
  const source = useTexture(url);
  const { gl } = useThree();
  const playback = useRef({ video: motion.video, previousTime: 0, loops: 0 });
  const texture = useMemo(() => {
    const map = source.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    return map;
  }, [source, gl]);
  const uniforms = useMemo(() => ({
    panorama: { value: texture }, repairJoin: { value: stitched ? 0 : 1 },
    videoPanorama: { value: texture as THREE.Texture }, videoMix: { value: 0 },
  }), [texture, stitched]);
  useFrame((_, delta) => {
    uniforms.videoPanorama.value = motion.texture ?? texture;
    uniforms.videoMix.value = motion.texture
      ? THREE.MathUtils.damp(uniforms.videoMix.value, 1, 1.8, Math.min(delta, 0.1)) : 0;
    if (process.env.NODE_ENV === "development") {
      if (playback.current.video !== motion.video) playback.current = { video: motion.video, previousTime: 0, loops: 0 };
      const now = motion.video?.currentTime ?? 0;
      if (now < playback.current.previousTime - 0.5) playback.current.loops++;
      playback.current.previousTime = now;
      gl.domElement.dataset.skyVideoStatus = motion.status;
      gl.domElement.dataset.skyVideoTime = now.toFixed(3);
      gl.domElement.dataset.skyVideoDuration = String(motion.video?.duration || 0);
      gl.domElement.dataset.skyVideoLoops = String(playback.current.loops);
      gl.domElement.dataset.skyVideoRate = String(motion.video?.playbackRate || 0);
      gl.domElement.dataset.skyVideoMix = uniforms.videoMix.value.toFixed(3);
    }
  });
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
        uniform sampler2D videoPanorama;
        uniform float videoMix;
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
          if (videoMix > 0.001) {
            // Video is decoded separately: Three's custom samplers do not
            // automatically apply the VideoTexture sRGB transfer function.
            vec3 clouds = sRGBTransferEOTF(texture2D(videoPanorama, skyUv)).rgb;
            // Make the moving cloud layer legible while retaining still detail.
            float atmosphere = mix(0.65, 0.80, smoothstep(0.43, 0.8, skyUv.y));
            color = mix(color, clouds, videoMix * atmosphere);
          }
          // Latitude collapses at the poles; remove any longitude pinching.
          float pole = smoothstep(0.94, 1.0, abs(skyUv.y * 2.0 - 1.0));
          color = mix(color, texture2D(panorama, vec2(0.5, skyUv.y)).rgb, pole);
          gl_FragColor = vec4(color, 1.0);
          #include <colorspace_fragment>
        }
      `} />
  </mesh>;
}
