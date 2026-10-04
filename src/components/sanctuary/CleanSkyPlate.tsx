"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

const vertex = `
  varying vec3 skyDirection;
  void main() {
    skyDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 lowerSky;
  uniform vec3 keyDirection;
  uniform float daylight;
  uniform float dusk;
  uniform float stars;
  varying vec3 skyDirection;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  void main() {
    vec3 d = normalize(skyDirection);
    float elevation = d.y;
    vec3 color = mix(horizon, zenith, smoothstep(-0.04, 0.20, elevation));
    color = mix(color, lowerSky, smoothstep(-0.03, 0.70, -elevation));
    // A broad directional atmospheric glow follows the same clock as the key
    // light. This is layered radiance, never a dark overlay over daylight art.
    vec3 sunward = normalize(vec3(keyDirection.x, 0.045, keyDirection.z));
    float glow = pow(max(0.0, dot(d, sunward)), 11.0)
      * exp(-pow(elevation * 4.0, 2.0));
    color += vec3(0.052, 0.033, 0.014) * glow * daylight;
    color += vec3(0.13, 0.046, 0.018) * glow * dusk;
    if (stars > 0.001) {
      // An integer longitude grid wraps exactly; stars are world-fixed and
      // remain behind the separately composited cloud alpha.
      vec2 uv = vec2(atan(d.z, d.x) / 6.28318530718 + 0.5, asin(d.y) / 3.14159265359 + 0.5);
      vec2 grid = uv * vec2(460.0, 230.0);
      vec2 cell = floor(grid);
      float seed = hash(cell);
      vec2 location = vec2(hash(cell + 7.3), hash(cell + 19.6)) * 0.56 + 0.22;
      vec2 point = fract(grid) - location;
      // Slightly resolved pinpoints survive Retina downsampling and the soft
      // cirrus. Derivative filtering avoids subpixel glitter during an orbit.
      vec2 footprint = min(fwidth(grid), vec2(0.15));
      float variance = max(mix(0.0032, 0.008, hash(cell + 3.2)),
        dot(footprint, footprint) * 0.18);
      float star = exp(-dot(point, point) / variance);
      float horizonFade = smoothstep(-0.01, 0.065, elevation);
      float brightness = step(0.988, seed) * mix(0.42, 1.05, hash(cell + 29.1));
      color += vec3(0.69, 0.78, 1.0) * star * brightness * stars * horizonFade;
    }
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** A continuous, separately lit sky plate with a quiet static night star field. */
export function CleanSkyPlate({ onReady, atmosphere }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere> } = {}) {
  const fallback = useMemo(createSanctuaryAtmosphere, []);
  const uniforms = useMemo(() => ({
    zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, lowerSky: { value: new THREE.Color() },
    keyDirection: { value: new THREE.Vector3() }, daylight: { value: 1 }, dusk: { value: 0 }, stars: { value: 0 },
  }), []);
  useEffect(() => { onReady?.(); }, [onReady]);
  useFrame(() => {
    const mood = atmosphere?.current ?? fallback;
    uniforms.zenith.value.setRGB(...mood.skyZenith);
    uniforms.horizon.value.setRGB(...mood.skyHorizon);
    uniforms.lowerSky.value.setRGB(...mood.skyLower);
    uniforms.keyDirection.value.set(...mood.keyDirection);
    uniforms.daylight.value = mood.daylight;
    uniforms.dusk.value = mood.dusk;
    uniforms.stars.value = mood.starVisibility;
  }, -0.8);
  return <mesh renderOrder={-3000} raycast={() => null}>
    <sphereGeometry args={[450, 64, 32]}/>
    <shaderMaterial side={THREE.BackSide} depthWrite={false} toneMapped={false}
      uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}/>
  </mesh>;
}
