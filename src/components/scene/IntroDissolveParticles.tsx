"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { ControlEntrance } from "@/lib/controlEntrance";

const COUNT = 156;
const random = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const bezier = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;

/** Small, non-looping motes born on the eyelids and the two glass rims. */
export function IntroDissolveParticles({ entrance, reduced }: {
  entrance: RefObject<ControlEntrance>; reduced: RefObject<boolean>;
}) {
  const points = useRef<THREE.Points>(null);
  const { gl } = useThree();
  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const t = random(i + 2);
      const angle = t * Math.PI * 2;
      if (i < 60) {
        const upper = i % 2 === 0;
        positions[i * 3] = (bezier(11, upper ? 43 : 57, upper ? 127 : 158, 190, t) - 100) / 100;
        positions[i * 3 + 1] = (100 - bezier(103, upper ? 55 : 157, upper ? 31 : 145, 94, t)) / 100;
      } else {
        const radius = i % 2 === 0 ? 0.29 : 0.175;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
      }
      positions[i * 3 + 2] = 0.025;
      seeds[i * 4] = i < 60 ? random(i + 17) * 1.25 : 1.3 + random(i + 17) * 2.1;
      seeds[i * 4 + 1] = 2.1 + random(i + 39) * 1.5;
      seeds[i * 4 + 2] = random(i + 53);
      seeds[i * 4 + 3] = random(i + 71);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    return geo;
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uTime;
      uniform float uDpr;
      varying float vAlpha;
      varying float vTint;
      void main() {
        float age = max(0.0, uTime - aSeed.x);
        float life = clamp(age / aSeed.y, 0.0, 1.0);
        vAlpha = smoothstep(0.0, 0.2, age) * (1.0 - smoothstep(0.18, 1.0, life));
        vTint = aSeed.z;
        vec2 outward = normalize(position.xy + vec2(0.0001));
        vec2 tangent = vec2(-outward.y, outward.x);
        vec3 p = position;
        p.xy += outward * age * (0.02 + aSeed.z * 0.038);
        p.xy += tangent * sin(age * 0.8) * (0.018 + aSeed.w * 0.04);
        p.y += age * age * 0.009;
        p.z += sin(age + aSeed.z * 6.28) * age * 0.014;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (2.4 + aSeed.w * 3.4) * uDpr * (1.0 - life * 0.55);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vTint;
      void main() {
        float radius = length(gl_PointCoord - 0.5) * 2.0;
        float glow = exp(-radius * radius * 4.8) * (1.0 - smoothstep(0.65, 1.0, radius));
        vec3 color = mix(vec3(0.38, 0.57, 0.65), vec3(1.0, 0.95, 0.81), vTint);
        gl_FragColor = vec4(color, glow * vAlpha * 0.7);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }), []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(() => {
    const elapsed = entrance.current.elapsed;
    if (points.current) points.current.visible = !reduced.current && elapsed > 0 && elapsed < 7;
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uDpr.value = gl.getPixelRatio();
  });
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
