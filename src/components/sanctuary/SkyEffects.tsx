"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { advanceSkyEffectsTime, sampleSkyEffect, SKY_EFFECTS, type SkyEffectSample } from "@/lib/skyEffects";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

const ignoreRaycast = () => null;

const vertexShader = `
  varying vec2 effectUv;
  void main() {
    effectUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position.z = gl_Position.w * 0.999999;
  }
`;

const meteorShader = `
  uniform float progress;
  uniform float opacity;
  varying vec2 effectUv;
  void main() {
    float head = 0.13 + progress * 0.81;
    float behind = head - effectUv.x;
    float y = (effectUv.y - 0.5) * 2.0;
    float trail = smoothstep(-0.002, 0.012, behind) * exp(-max(behind, 0.0) * 5.0)
      * (1.0 - smoothstep(0.27, 0.40, behind));
    // The advancing warm-white head pulls a long cool trail that narrows and
    // fades behind it. A restrained outer glow reads against pink dusk too.
    float width = mix(0.48, 1.0, 1.0 - smoothstep(0.01, 0.40, max(behind, 0.0)));
    float core = exp(-y * y * 100.0 / (width * width)) * trail;
    float halo = exp(-y * y * 11.0) * trail * 0.42;
    vec2 tip = vec2((effectUv.x - head) * 43.0, y * 1.9);
    float headCore = exp(-dot(tip, tip) * 14.0);
    float headGlow = exp(-dot(tip, tip) * 2.8) * 0.38;
    float alpha = clamp(core + halo + headCore + headGlow, 0.0, 1.0) * opacity;
    vec3 color = mix(vec3(0.66, 0.81, 1.0), vec3(1.0, 0.97, 0.87),
      clamp(core * 1.4 + headCore + headGlow, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

/** Clear, separated sunset/night meteors, drawn behind the cloud layers. */
export function SkyEffects({ active = true, timeOverride = null, atmosphere }: { active?: boolean; timeOverride?: number|null; atmosphere?: RefObject<SanctuaryAtmosphere> }) {
  const group = useRef<THREE.Group>(null);
  const fallback = useMemo(createSanctuaryAtmosphere, []);
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
        fragmentShader: meteorShader,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const radius = 220;
      mesh.position.set(Math.sin(effect.azimuth) * radius, effect.height, Math.cos(effect.azimuth) * radius);
      right.set(Math.cos(effect.azimuth), 0, -Math.sin(effect.azimuth));
      outward.set(Math.sin(effect.azimuth), 0, Math.cos(effect.azimuth));
      rotation.makeBasis(right, up, outward);
      mesh.quaternion.setFromRotationMatrix(rotation).multiply(tilt.setFromAxisAngle(zAxis, effect.tilt));
      mesh.scale.set(68, 3.8, 1);
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
  useEffect(() => { skipFrame.current = true; }, [active]);

  useFrame(({ gl }, delta) => {
    if (!group.current) return;
    group.current.visible = (active || timeOverride !== null) && !paused.current;
    if (!group.current.visible) return;
    if (skipFrame.current && timeOverride === null) {
      skipFrame.current = false;
      return;
    }
    const mood = atmosphere?.current ?? fallback;
    const visibility = mood.meteorVisibility;
    elapsed.current = timeOverride ?? advanceSkyEffectsTime(elapsed.current, delta, false, visibility);
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.skyEffectsPhase = elapsed.current.toFixed(3);
    for (const { effect, material, mesh } of resources.items) {
      sampleSkyEffect(effect, elapsed.current, sample.current);
      mesh.visible = sample.current.opacity * visibility > 0.001;
      material.uniforms.progress.value = sample.current.progress;
      material.uniforms.opacity.value = sample.current.opacity * visibility;
    }
  }, -0.6);

  return <group ref={group} visible={false} name="sky-effects">
    {resources.items.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}
  </group>;
}
