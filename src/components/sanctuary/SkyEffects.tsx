"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { advanceSkyEffectsTime, sampleSkyEffect, SKY_EFFECTS, type SkyEffectSample } from "@/lib/skyEffects";

const ignoreRaycast = () => null;

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
    float tail = smoothstep(0.0, 0.015, behind)
      * (1.0 - smoothstep(0.025, 0.29, behind));
    float core = exp(-y * y * 190.0) * tail;
    float halo = exp(-y * y * 19.0) * tail * 0.2;
    vec2 tip = vec2((effectUv.x - head) * 48.0, y);
    float headGlow = exp(-dot(tip, tip) * 24.0);
    float alpha = clamp(core + halo + headGlow, 0.0, 1.0) * opacity;
    vec3 color = mix(vec3(1.0, 0.88, 0.61), vec3(1.0, 0.99, 0.94),
      clamp(core + headGlow, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

const glintShader = `
  uniform float opacity;
  varying vec2 effectUv;
  void main() {
    vec2 p = (effectUv - 0.5) * 2.0;
    float halo = exp(-dot(p, p) * 14.0) * 0.4;
    float horizontal = exp(-p.y * p.y * 260.0 - abs(p.x) * 6.5);
    float vertical = exp(-p.x * p.x * 260.0 - abs(p.y) * 6.5);
    float edge = 1.0 - smoothstep(0.65, 1.0, length(p));
    float alpha = clamp(halo + horizontal + vertical, 0.0, 1.0) * opacity * edge;
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.85), alpha);
    #include <colorspace_fragment>
  }
`;

/** World-anchored meteors and slow glints, independent of the sky's video pixels. */
export function SkyEffects({ active = true, time }: { active?: boolean; time?: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const paused = useRef(true);
  const skipFrame = useRef(true);
  const sample = useRef<SkyEffectSample>({ progress: 0, opacity: 0 });
  const resources = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const rotation = new THREE.Matrix4();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const outward = new THREE.Vector3();
    const tilt = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const items = SKY_EFFECTS.map((effect) => {
      const material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: true,
        side: THREE.DoubleSide, toneMapped: false,
        uniforms: { progress: { value: 0 }, opacity: { value: 0 } },
        vertexShader,
        fragmentShader: effect.kind === "meteor" ? meteorShader : glintShader,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const radius = 220;
      mesh.position.set(Math.sin(effect.azimuth) * radius, effect.height, Math.cos(effect.azimuth) * radius);
      right.set(Math.cos(effect.azimuth), 0, -Math.sin(effect.azimuth));
      outward.set(Math.sin(effect.azimuth), 0, Math.cos(effect.azimuth));
      rotation.makeBasis(right, up, outward);
      mesh.quaternion.setFromRotationMatrix(rotation).multiply(tilt.setFromAxisAngle(zAxis, effect.tilt));
      mesh.scale.set(effect.kind === "meteor" ? 60 : 3, effect.kind === "meteor" ? 2.5 : 3, 1);
      mesh.visible = false;
      mesh.renderOrder = -90;
      mesh.raycast = ignoreRaycast;
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

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.visible = active && !paused.current;
    if (!group.current.visible) return;
    if (skipFrame.current) {
      skipFrame.current = false;
      return;
    }
    elapsed.current = time ? time.current : advanceSkyEffectsTime(elapsed.current, delta, false);
    for (const { effect, material, mesh } of resources.items) {
      sampleSkyEffect(effect, elapsed.current, sample.current);
      mesh.visible = sample.current.opacity > 0;
      material.uniforms.progress.value = sample.current.progress;
      material.uniforms.opacity.value = sample.current.opacity;
    }
  });

  return <group ref={group} visible={false}>
    {resources.items.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}
  </group>;
}
