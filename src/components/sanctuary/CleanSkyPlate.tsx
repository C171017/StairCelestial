"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useSceneMood } from "./SceneMood";

const vertex = `
  varying vec3 skyDirection;
  void main() {
    skyDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = `
  uniform vec3 mood;
  varying vec3 skyDirection;
  void main() {
    vec3 d = normalize(skyDirection);
    float elevation = d.y;
    vec3 sunDirection = normalize(vec3(0.65, 0.025, -0.76));
    float towardSun = pow(max(0.0, dot(d, sunDirection)), 3.5);
    float horizon = exp(-pow((elevation + 0.035) * 5.5, 2.0));
    float upper = smoothstep(-0.10, 0.44, elevation);
    float duskUpper = smoothstep(-0.28, 0.25, elevation);
    float lower = smoothstep(0.06, 0.85, -elevation);

    // Values are linear radiance. The sunset is directional; its opposite
    // horizon retains a cool violet afterglow rather than a uniform orange band.
    vec3 day = mix(vec3(0.62, 0.72, 0.79), vec3(0.15, 0.32, 0.57), upper);
    day += vec3(0.15, 0.078, 0.015) * towardSun * horizon;
    day = mix(day, vec3(0.36, 0.49, 0.64), lower);

    vec3 duskHorizon = mix(vec3(0.12, 0.17, 0.32), vec3(0.86, 0.39, 0.20), towardSun);
    vec3 dusk = mix(duskHorizon, vec3(0.015, 0.052, 0.177), duskUpper);
    dusk += vec3(0.12, 0.031, 0.005) * towardSun * horizon;
    dusk = mix(dusk, vec3(0.035, 0.065, 0.160), lower);
    dusk = mix(dusk, vec3(0.007, 0.021, 0.069), smoothstep(0.42, 0.97, elevation));

    vec3 night = mix(vec3(0.026, 0.040, 0.088), vec3(0.0035, 0.009, 0.032), upper);
    night += vec3(0.022, 0.017, 0.023) * towardSun * horizon;
    night = mix(night, vec3(0.013, 0.024, 0.058), lower);

    vec3 color = day * mood.x + dusk * mood.y + night * mood.z;
    // Sub-quantization dither prevents visible steps in the large smooth dome.
    float noise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    color += noise * 0.0007;
    gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
    #include <colorspace_fragment>
  }
`;

/** A world-fixed radiance dome; ascent changes its light, never its geometry. */
export function CleanSkyPlate({ onReady }: { onReady?: () => void } = {}) {
  const mood = useSceneMood();
  const uniforms = useMemo(() => ({ mood: { value: new THREE.Vector3(0, 1, 0) } }), []);
  useEffect(() => { onReady?.(); }, [onReady]);
  useFrame(() => {
    const state = mood.current;
    uniforms.mood.value.set(state.day, state.sunset, state.night);
  }, -0.7);
  return <mesh renderOrder={-3000} raycast={() => null}>
    <sphereGeometry args={[1400, 64, 32]} />
    <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}
      side={THREE.BackSide} depthWrite={false} depthTest={false} toneMapped={false} />
  </mesh>;
}
