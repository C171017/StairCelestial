"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useSceneMood } from "./SceneMood";

const PERIOD = 192;
const METEORS = [
  { start: 18, duration: 1.9, azimuth: Math.PI - 0.34, height: 70, tilt: -0.38 },
  { start: 78, duration: 1.7, azimuth: Math.PI * 0.43, height: 93, tilt: -0.31 },
  { start: 141, duration: 2.0, azimuth: Math.PI * 1.59, height: 62, tilt: -0.43 },
] as const;

const vertexShader = `
  varying vec2 effectUv;
  void main() {
    effectUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const meteorShader = `
  uniform float progress;
  uniform float opacity;
  varying vec2 effectUv;
  void main() {
    float head = 0.29 + progress * 0.64;
    float behind = head - effectUv.x;
    float y = (effectUv.y - 0.5) * 2.0;
    float tail = smoothstep(0.0, 0.012, behind)
      * (1.0 - smoothstep(0.02, 0.29, behind));
    float core = exp(-y * y * 95.0) * tail;
    float halo = exp(-y * y * 12.0) * tail * 0.13;
    vec2 tip = vec2((effectUv.x - head) * 36.0, y);
    float headGlow = exp(-dot(tip, tip) * 12.0);
    float alpha = clamp(core + halo + headGlow, 0.0, 1.0) * opacity;
    vec3 color = mix(vec3(0.50, 0.67, 1.0), vec3(1.0, 0.94, 0.79),
      clamp(core + headGlow, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/** Three short, quiet meteor passes per 192 seconds across the entire sky. */
export function SkyEffects({ active = true, time }: { active?: boolean; time?: RefObject<number> }) {
  const mood = useSceneMood();
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const paused = useRef(true);
  const skipFrame = useRef(true);
  const resources = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const rotation = new THREE.Matrix4();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const outward = new THREE.Vector3();
    const tilt = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const items = METEORS.map(effect => {
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: false,
        side: THREE.DoubleSide, toneMapped: false,
        uniforms: { progress: { value: 0 }, opacity: { value: 0 } },
        vertexShader, fragmentShader: meteorShader,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const radius = 320;
      mesh.position.set(Math.sin(effect.azimuth) * radius, effect.height, Math.cos(effect.azimuth) * radius);
      right.set(Math.cos(effect.azimuth), 0, -Math.sin(effect.azimuth));
      outward.set(Math.sin(effect.azimuth), 0, Math.cos(effect.azimuth));
      rotation.makeBasis(right, up, outward);
      mesh.quaternion.setFromRotationMatrix(rotation).multiply(tilt.setFromAxisAngle(zAxis, effect.tilt));
      mesh.scale.set(70, 1.65, 1);
      mesh.visible = false;
      mesh.renderOrder = -90;
      mesh.raycast = () => null;
      return { effect, material, mesh };
    });
    return { geometry, items };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      paused.current = query.matches || document.hidden;
      skipFrame.current = true;
      if (paused.current && group.current) group.current.visible = false;
    };
    update();
    query.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => () => {
    resources.geometry.dispose();
    for (const item of resources.items) item.material.dispose();
  }, [resources]);

  useFrame(({ gl }, delta) => {
    if (!group.current) return;
    const visibility = Math.pow(mood.current.stars, 0.65);
    group.current.visible = active && !paused.current && visibility > 0.01;
    if (!group.current.visible) return;
    if (skipFrame.current) { skipFrame.current = false; return; }
    elapsed.current = time ? time.current : elapsed.current + Math.max(0, Math.min(delta, 0.1));
    const phase = ((elapsed.current % PERIOD) + PERIOD) % PERIOD;
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.skyEffectsPhase = phase.toFixed(3);
    for (const { effect, material, mesh } of resources.items) {
      const progress = (phase - effect.start) / effect.duration;
      const envelope = progress <= 0 || progress >= 1 ? 0
        : THREE.MathUtils.smoothstep(progress, 0, 0.18) * (1 - THREE.MathUtils.smoothstep(progress, 0.48, 1));
      mesh.visible = envelope > 0;
      material.uniforms.progress.value = THREE.MathUtils.clamp(progress, 0, 1);
      material.uniforms.opacity.value = envelope * visibility * 0.75;
    }
  }, -0.7);

  return <group ref={group} visible={false} name="sky-effects">
    {resources.items.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}
  </group>;
}
