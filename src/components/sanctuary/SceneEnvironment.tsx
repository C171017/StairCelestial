"use client";

import { SoftShadows, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

// Shared BRDF lookup textures are initialized once, including Fast Refresh.
if (!("LTC_FLOAT_1" in THREE.UniformsLib)) RectAreaLightUniformsLib.init();

export function Sky() {
  const { scene, size, gl } = useThree();
  const texture = useTexture(gl.capabilities.maxTextureSize >= 4096
    ? "/textures/sanctuary/cloudscape-4k.webp" : "/textures/sanctuary/cloudscape.webp");
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const viewAspect = size.width / size.height;
    const x = Math.min(1, viewAspect / imageAspect), y = Math.min(1, imageAspect / viewAspect);
    texture.repeat.set(x, y); texture.offset.set((1 - x) / 2, (1 - y) / 2); texture.updateMatrix();
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene, texture, size.width, size.height]);
  return null;
}

type LightProps = {
  atmosphere?: RefObject<SanctuaryAtmosphere>;
  reflectionScene?: RefObject<THREE.Scene | null>;
};

/** One moving sun/moon governs form, cast shadows and reflection highlights. */
export function StudioLight({ atmosphere, reflectionScene }: LightProps = {}) {
  const fallback = useRef(createSanctuaryAtmosphere());
  const clock = atmosphere ?? fallback;
  const { scene, gl } = useThree();
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const softbox = useRef<THREE.RectAreaLight>(null);
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const groundColor = useMemo(() => new THREE.Color("#b1a394"), []);
  useFrame(() => {
    const mood = clock.current;
    if (key.current) {
      key.current.position.fromArray(mood.keyDirection).multiplyScalar(38);
      key.current.color.setRGB(...mood.keyColor);
      // Preserve highlight headroom on white stone in the brightest mood.
      key.current.intensity = mood.keyIntensity * (1 - 0.23 * mood.daylight);
      key.current.shadow.normalBias = 0.015;
    }
    if (softbox.current) {
      softbox.current.position.fromArray(mood.keyDirection).multiplyScalar(18);
      softbox.current.lookAt(0, 1, 0);
      softbox.current.color.setRGB(...mood.keyColor);
      // Keep most diffuse shape light in the shadow-casting key. The former
      // broad unshadowed softbox was filling the frame shadows back in.
      softbox.current.intensity = 2.4 * mood.daylight + 1.3 * mood.dusk + 0.8 * mood.night;
    }
    if (fill.current) {
      fill.current.position.set(-mood.keyDirection[0] * 15, 7, -mood.keyDirection[2] * 15);
      fill.current.color.setRGB(...mood.fillColor);
      fill.current.intensity = mood.fillIntensity * 0.88;
    }
    if (hemisphere.current) {
      hemisphere.current.color.setRGB(...mood.ambientColor);
      hemisphere.current.groundColor.copy(groundColor).multiplyScalar(1 - mood.night * 0.45);
      hemisphere.current.intensity = mood.ambientIntensity * (2.1 - 0.5 * mood.daylight);
    }
    scene.environmentIntensity = mood.environmentIntensity * 0.95;
    if (process.env.NODE_ENV === "development") {
      gl.domElement.dataset.sunDirection = mood.keyDirection.map(v => v.toFixed(3)).join(",");
      gl.domElement.dataset.environmentMap = scene.environment?.uuid ?? "none";
      gl.domElement.dataset.shadowMapSize = String(key.current?.shadow.mapSize.x ?? 0);
    }
  }, -0.65);
  return <>
    <SoftShadows size={50} samples={20} />
    <hemisphereLight ref={hemisphere} args={["#d6e1f1", "#8b8179", 0.35]} />
    <directionalLight ref={key} position={[-18, 24, 22]} intensity={3.2} color="#fff0da"
      castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.00008}
      shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={25} shadow-camera-bottom={-25}
      shadow-camera-near={0.1} shadow-camera-far={95} />
    <rectAreaLight ref={softbox} width={9} height={14} intensity={4.5} color="#fff0da" />
    <directionalLight ref={fill} position={[10, 7, -12]} intensity={0.45} color="#b9d2f0" />
    <Suspense fallback={null}><ReflectionEnvironment atmosphere={clock} reflectionScene={reflectionScene} /></Suspense>
  </>;
}

/** Match the visible layered sky, with a few deliberate studio reflection
 * shapes. A changed solar phase refreshes the prefiltered map, never per door. */
function ReflectionEnvironment({ atmosphere, reflectionScene }: Required<Pick<LightProps, "atmosphere">> & Pick<LightProps, "reflectionScene">) {
  const { gl, scene } = useThree();
  const source = useTexture("/textures/sanctuary/cloudscape-360-4k.webp");
  const fallbackTexture = useMemo(() => {
    const texture = source.clone(); texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; return texture;
  }, [source]);
  const resources = useMemo(() => {
    const capture = new THREE.Scene();
    const sphereGeometry = new THREE.SphereGeometry(450, 48, 24);
    const sphereMaterial = new THREE.MeshBasicMaterial({ map: fallbackTexture, side: THREE.BackSide, toneMapped: false });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial); sphere.renderOrder = -4000;
    capture.add(sphere);
    const geometry = new THREE.PlaneGeometry(1, 1);
    const panels = Array.from({ length: 5 }, () => {
      const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(geometry, material); mesh.renderOrder = 5000; capture.add(mesh); return mesh;
    });
    panels[0].scale.set(7, 20, 1); panels[1].scale.set(2.2, 15, 1);
    panels[2].scale.set(11, 15, 1); panels[3].scale.set(28, 10, 1);
    // A feathered rear sky bounce gives the broad marble face a readable
    // grazing reflection. It is only in the environment capture, never a
    // visible card in the cloud world or a second sharp sun/shadow source.
    const featherData = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const edge = Math.min(x, y, 63 - x, 63 - y) / 12;
      const value = Math.round(255 * THREE.MathUtils.smoothstep(edge, 0, 1));
      featherData.set([255, value, 255, 255], (y * 64 + x) * 4);
    }
    const feather = new THREE.DataTexture(featherData, 64, 64);
    feather.minFilter = feather.magFilter = THREE.LinearFilter;
    feather.needsUpdate = true;
    panels[4].scale.set(24, 8, 1); panels[4].material.alphaMap = feather;
    const target = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
    const camera = new THREE.CubeCamera(0.1, 3000, target);
    const pmrem = new THREE.PMREMGenerator(gl);
    return { capture, sphere, sphereGeometry, sphereMaterial, geometry, panels, feather, target, camera, pmrem };
  }, [gl, fallbackTexture]);
  const prefiltered = useRef<THREE.WebGLRenderTarget | null>(null);
  const clonedSky = useRef<THREE.Object3D | null>(null);
  const phase = useRef(Infinity);
  const captureInterval = useRef(0);
  const sourceId = useRef("");
  const previous = useRef(scene.environment);
  useEffect(() => {
    phase.current = Infinity; sourceId.current = "";
    // Strict Mode replays setup after cleanup: reattach owned highlight cards.
    resources.capture.add(resources.sphere, ...resources.panels);
    resources.pmrem.compileCubemapShader();
    const priorEnvironment = previous.current;
    return () => {
    scene.environment = priorEnvironment;
    prefiltered.current?.dispose();
    resources.target.dispose(); resources.pmrem.dispose(); resources.geometry.dispose();
    resources.panels.forEach(panel => panel.material.dispose());
    resources.feather.dispose();
    resources.sphereGeometry.dispose(); resources.sphereMaterial.dispose(); fallbackTexture.dispose();
    resources.capture.clear(); prefiltered.current = null; clonedSky.current = null;
    };
  }, [scene, resources, fallbackTexture]);
  useFrame((_, delta) => {
    captureInterval.current += Math.min(delta, 0.1);
    const mood = atmosphere.current;
    const sky = reflectionScene?.current;
    const id = sky ? `${sky.uuid}:${sky.getObjectByName("cloud-0")?.uuid ?? "plate"}` : "fallback";
    if (Math.abs(mood.solarPhase - phase.current) < 0.045 && sourceId.current === id) return;
    // A six-face capture + PMREM is the expensive part of changing time. Keep
    // direct lighting smooth each frame, and bound these broad reflection
    // updates during a fast scroll without reducing material resolution.
    if (sourceId.current === id && captureInterval.current < 0.16) return;
    captureInterval.current = 0;
    phase.current = mood.solarPhase; sourceId.current = id;
    if (clonedSky.current) resources.capture.remove(clonedSky.current);
    clonedSky.current = sky?.clone(true) ?? null;
    if (clonedSky.current) {
      const effects = clonedSky.current.getObjectByName("sky-effects");
      if (effects) effects.visible = false;
      resources.capture.add(clonedSky.current);
    }
    resources.sphere.visible = !sky;
    resources.sphereMaterial.color.setRGB(...mood.reflectionTint);
    const azimuth = Math.atan2(mood.keyDirection[0], mood.keyDirection[2]);
    const poses = [[azimuth - 0.28, 12, 32], [azimuth + 1.85, 8, 28], [azimuth + 2.7, 0, 26], [azimuth, -22, 30], [azimuth + Math.PI, 9, 32]];
    resources.panels.forEach((panel, index) => {
      const [angle, height, radius] = poses[index];
      panel.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius); panel.lookAt(0, 0, 0);
    });
    resources.panels[0].material.color.setRGB(...mood.keyColor).multiplyScalar(4.6 - mood.night * 3.25);
    resources.panels[1].material.color.setRGB(...mood.fillColor).lerp(new THREE.Color("#ffebcb"), 0.4)
      .multiplyScalar(2.8 * mood.daylight + 2.4 * mood.dusk + 1.3 * mood.night);
    resources.panels[2].material.color.setRGB(...mood.fillColor).multiplyScalar(0.055);
    resources.panels[3].material.color.setRGB(...mood.reflectionTint).multiplyScalar(0.12);
    resources.panels[4].material.color.setRGB(...mood.reflectionTint).multiplyScalar(1.9 * mood.daylight + 1.5 * mood.dusk + 0.85 * mood.night);
    if (process.env.NODE_ENV === "development") gl.domElement.dataset.reflectionPanels = String(resources.panels.filter(panel => panel.parent === resources.capture).length);
    const shadowEnabled = gl.shadowMap.enabled;
    try {
      gl.shadowMap.enabled = false;
      resources.camera.update(gl, resources.capture);
      const next = resources.pmrem.fromCubemap(resources.target.texture);
      const old = prefiltered.current;
      prefiltered.current = next; scene.environment = next.texture; old?.dispose();
    } finally { gl.shadowMap.enabled = shadowEnabled; }
  }, -0.55);
  return null;
}
