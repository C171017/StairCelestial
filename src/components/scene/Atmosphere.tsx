"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

const STAR_COUNT = 3200;
const STAR_RADIUS = 135;
const STAR_DEPTH = 70;
const STAR_MIN_PIXEL_SIZE = 1.45;

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function BrowserSafeStars() {
  const materialRef = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          pixelRatio: { value: 1 },
          time: { value: 0 },
        },
        vertexShader: `
          uniform float pixelRatio;
          uniform float time;
          attribute float size;
          attribute float twinkle;
          varying float vTwinkle;

          void main() {
            vTwinkle = 0.72 + 0.28 * sin(time * 0.8 + twinkle);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float perspectiveSize = size * pixelRatio * (58.0 / -mvPosition.z);
            gl_PointSize = max(${STAR_MIN_PIXEL_SIZE.toFixed(2)}, perspectiveSize);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vTwinkle;

          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = smoothstep(0.5, 0.14, d) * vTwinkle;
            gl_FragColor = vec4(vec3(0.86, 0.91, 1.0), alpha);

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const { gl } = useThree();

  const geometry = useMemo(() => {
    const random = seededRandom(17017);
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const twinkles = new Float32Array(STAR_COUNT);
    const spherical = new THREE.Spherical();
    const vector = new THREE.Vector3();

    for (let i = 0; i < STAR_COUNT; i += 1) {
      spherical.radius = STAR_RADIUS + random() * STAR_DEPTH;
      spherical.phi = Math.acos(1 - random() * 2);
      spherical.theta = random() * Math.PI * 2;
      vector.setFromSpherical(spherical);

      const positionIndex = i * 3;
      positions[positionIndex] = vector.x;
      positions[positionIndex + 1] = vector.y;
      positions[positionIndex + 2] = vector.z;
      sizes[i] = 2.2 + random() * 2.8;
      twinkles[i] = random() * Math.PI * 2;
    }

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    bufferGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    bufferGeometry.setAttribute(
      "twinkle",
      new THREE.BufferAttribute(twinkles, 1),
    );
    return bufferGeometry;
  }, []);

  useFrame((state) => {
    materialRef.uniforms.time.value = state.clock.elapsedTime;
    materialRef.uniforms.pixelRatio.value = Math.min(gl.getPixelRatio(), 2);
  });

  return <points geometry={geometry} material={materialRef} />;
}

export function Atmosphere() {
  return (
    <>
      <color attach="background" args={["#030508"]} />
      <fog attach="fog" args={["#030508", 22, 95]} />
      <BrowserSafeStars />
    </>
  );
}
