"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useSceneMood } from "./SceneMood";

const hash = (value: number) => {
  const result = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return result - Math.floor(result);
};

/** Sparse, steady stars in world space, composited before every cloud layer. */
export function SkyStars() {
  const mood = useSceneMood();
  const resources = useMemo(() => {
    const count = 1050;
    const positions = new Float32Array(count * 3);
    const qualities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const azimuth = hash(i + 19) * Math.PI * 2;
      const elevation = 0.015 + hash(i + 1703) * 0.985;
      const horizontal = Math.sqrt(1 - elevation * elevation);
      positions.set([Math.cos(azimuth) * horizontal * 1100, elevation * 1100,
        Math.sin(azimuth) * horizontal * 1100], i * 3);
      qualities.set([0.6 + Math.pow(hash(i + 801), 4) * 1.35,
        0.25 + Math.pow(hash(i + 1329), 2) * 0.75, hash(i + 571)], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("quality", new THREE.BufferAttribute(qualities, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
      uniforms: { visibility: { value: 0 }, pixelRatio: { value: 1 } },
      vertexShader: `
        uniform float pixelRatio;
        attribute vec3 quality;
        varying float luminosity;
        varying float tint;
        void main() {
          luminosity = quality.y * smoothstep(0.015, 0.18, normalize(position).y);
          tint = quality.z;
          gl_PointSize = max(1.0, quality.x * pixelRatio * 1.9);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float visibility;
        varying float luminosity;
        varying float tint;
        void main() {
          float r = length(gl_PointCoord - vec2(0.5)) * 2.0;
          float core = exp(-r * r * 5.0) * (1.0 - smoothstep(0.55, 1.0, r));
          vec3 color = mix(vec3(0.58, 0.72, 1.0), vec3(1.0, 0.87, 0.71), tint);
          gl_FragColor = vec4(color, core * luminosity * visibility);
          #include <colorspace_fragment>
        }
      `,
    });
    return { geometry, material };
  }, []);
  useEffect(() => () => { resources.geometry.dispose(); resources.material.dispose(); }, [resources]);
  useFrame(({ gl }) => {
    const twilight = THREE.MathUtils.smoothstep(mood.current.value, 0.38, 0.52);
    resources.material.uniforms.visibility.value = Math.max(twilight * mood.current.sunset * 0.22,
      Math.pow(mood.current.stars, 0.45) * 0.88);
    resources.material.uniforms.pixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
  }, -0.7);
  return <points name="sky-stars" geometry={resources.geometry} material={resources.material}
    renderOrder={-100} raycast={() => null} frustumCulled={false} dispose={null} />;
}
