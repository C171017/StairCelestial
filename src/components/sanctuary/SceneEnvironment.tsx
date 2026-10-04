"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sampleSceneMood } from "@/lib/sceneMood";
import { useSceneMood } from "./SceneMood";
import { getSkyReflectionSource } from "./skyReflectionSource";

/** The separate door study keeps its original image backdrop. */
export function Sky() {
  const { scene, size, gl } = useThree();
  const texture = useTexture(gl.capabilities.maxTextureSize >= 4096
    ? "/textures/sanctuary/cloudscape-4k.webp" : "/textures/sanctuary/cloudscape.webp");
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const viewAspect = size.width / size.height;
    const x = Math.min(1, viewAspect / imageAspect);
    const y = Math.min(1, imageAspect / viewAspect);
    texture.repeat.set(x, y); texture.offset.set((1 - x) / 2, (1 - y) / 2); texture.updateMatrix();
    scene.background = texture;
    return () => { scene.background = null; };
  }, [scene, texture, size.width, size.height]);
  return null;
}

const dayKey = new THREE.Color("#fff4dd");
const sunsetKey = new THREE.Color("#ffc49a");
const nightKey = new THREE.Color("#a9c4ff");
const dayFill = new THREE.Color("#c0dcff");
const duskFill = new THREE.Color("#91a9ea");
const nightFill = new THREE.Color("#8caef5");

function blendColor(target: THREE.Color, a: THREE.Color, b: THREE.Color, c: THREE.Color, x: number, y: number, z: number) {
  target.setRGB(a.r*x+b.r*y+c.r*z, a.g*x+b.g*y+c.g*z, a.b*x+b.b*y+c.b*z);
}

export function StudioLight() {
  const mood = useSceneMood();
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const { day, sunset, night } = mood.current;
    if (key.current) {
      blendColor(key.current.color, dayKey, sunsetKey, nightKey, day, sunset, night);
      key.current.intensity = 2.5 * day + 1.9 * sunset + 0.72 * night;
      key.current.position.set(13, 9 * day + 4.5 * sunset + 12 * night, -15);
    }
    if (fill.current) {
      blendColor(fill.current.color, dayFill, duskFill, nightFill, day, sunset, night);
      fill.current.intensity = 0.85 * day + 0.64 * sunset + 0.67 * night;
    }
    if (ambient.current) ambient.current.intensity = 0.46 * day + 0.26 * sunset + 0.23 * night;
  }, -0.7);
  return <>
    <hemisphereLight ref={ambient} color="#c1d5ff" groundColor="#51434e" intensity={0.26} />
    <directionalLight ref={key} position={[13, 4.5, -15]} intensity={1.9} color="#ffc49a" />
    <directionalLight ref={fill} position={[-9, 8, 9]} intensity={0.64} color="#91a9ea" />
    <CrystalReflections />
  </>;
}

const reflectionVertex = `varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const reflectionFragment = `
  uniform vec3 weights;
  varying vec3 direction;
  void main(){
    vec3 d=normalize(direction);
    vec3 sun=normalize(vec3(.65,.08,-.76));
    float elevation=smoothstep(-.35,.7,d.y);
    float sunward=pow(max(dot(d,sun),0.),5.);
    float horizon=exp(-pow((d.y-.015)*5.,2.));
    vec3 day=mix(vec3(.40,.46,.52),vec3(.17,.34,.59),elevation)+vec3(.62,.43,.20)*horizon*sunward;
    vec3 dusk=mix(vec3(.10,.12,.19),vec3(.024,.061,.16),elevation)+vec3(.61,.25,.10)*horizon*(.18+.82*sunward);
    vec3 night=mix(vec3(.025,.041,.080),vec3(.011,.022,.058),elevation)+vec3(.10,.135,.24)*horizon*.22;
    // Broad broken cloud reflections, deliberately lower contrast than the cards.
    float clouds=sin(d.x*14.+sin(d.z*9.)*2.)*sin(d.z*18.+d.y*7.);
    float cloudBand=exp(-pow((d.y+.25)*3.1,2.));
    vec3 color=day*weights.x+dusk*weights.y+night*weights.z;
    color+=vec3(.045,.053,.067)*cloudBand*(.5+.5*clouds)*(weights.x+weights.y*.6+weights.z*.2);
    // Long soft grazing sources, plus a dark seam. They are reflection-only
    // studio shaping, not luminous outlines attached to the ribbon geometry.
    float warmCard=exp(-pow((d.x-.60)*14.,2.)-pow((d.z+.70)*5.5,2.))*smoothstep(-.4,.12,d.y);
    float coolCard=exp(-pow((d.x+.75)*18.,2.)-pow((d.z-.35)*5.,2.))*smoothstep(-.25,.18,d.y);
    float overhead=pow(max(d.y,0.),5.);
    float frontCard=exp(-pow((d.x+.22)*3.0,2.)-pow((d.y-.37)*2.7,2.))*smoothstep(.35,.8,d.z);
    float darkCard=exp(-pow((d.x+.28)*17.,2.)-pow((d.z-.86)*9.,2.))*smoothstep(-.5,.1,d.y);
    color*=1.-darkCard*.64;
    color+=vec3(1.,.75,.48)*warmCard*(2.8*weights.x+2.3*weights.y+.38*weights.z);
    color+=vec3(.57,.76,1.)*coolCard*(1.5*weights.x+.95*weights.y+.65*weights.z);
    color+=vec3(.70,.81,1.)*overhead*(1.65*weights.x+1.25*weights.y+.48*weights.z);
    color+=vec3(.92,.85,.78)*frontCard*(1.4*weights.x+1.3*weights.y+.32*weights.z);
    gl_FragColor=vec4(color,1.);
  }`;

const softboxFragment = `
  uniform vec3 weights;
  varying vec3 direction;
  void main() {
    vec3 d = normalize(direction);
    float warmCard=exp(-pow((d.x-.60)*14.,2.)-pow((d.z+.70)*5.5,2.))*smoothstep(-.4,.12,d.y);
    float coolCard=exp(-pow((d.x+.75)*18.,2.)-pow((d.z-.35)*5.,2.))*smoothstep(-.25,.18,d.y);
    float overhead=pow(max(d.y,0.),5.);
    float frontCard=exp(-pow((d.x+.22)*3.0,2.)-pow((d.y-.37)*2.7,2.))*smoothstep(.35,.8,d.z);
    float darkCard=exp(-pow((d.x+.28)*17.,2.)-pow((d.z-.86)*9.,2.))*smoothstep(-.5,.1,d.y);
    vec3 radiance = vec3(1.,.75,.48)*warmCard*(2.8*weights.x+2.3*weights.y+.38*weights.z);
    radiance += vec3(.57,.76,1.)*coolCard*(1.5*weights.x+.95*weights.y+.65*weights.z);
    radiance += vec3(.70,.81,1.)*overhead*(1.65*weights.x+1.25*weights.y+.48*weights.z);
    radiance += vec3(.92,.85,.78)*frontCard*(1.4*weights.x+1.3*weights.y+.32*weights.z);
    // C_out = radiance + C_sky * (1 - darkCard): the actual clouds remain,
    // with broad reflection-only sources and one dark seam defining the polish.
    gl_FragColor = vec4(radiance, darkCard * .55);
  }
`;

type ReflectionResources = {
  targets: THREE.WebGLRenderTarget[];
  blend: THREE.WebGLRenderTarget;
  scene: THREE.Scene;
  camera: THREE.Camera;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  capturedSource: THREE.Scene | null;
  lastMood: number;
};

function disposeReflections(state: ReflectionResources) {
  state.targets.forEach(target => target.dispose());
  state.blend.dispose(); state.material.dispose(); state.geometry.dispose(); state.scene.clear();
}

/** Synchronous, three-time capture; restore all live sky values before rendering. */
function captureSky(gl: THREE.WebGLRenderer, source: THREE.Scene | null) {
  const generator = new THREE.PMREMGenerator(gl);
  const room = source ?? new THREE.Scene();
  const geometry = new THREE.SphereGeometry(source ? 1300 : 50, 64, 32);
  const weights = new THREE.Vector3();
  const material = new THREE.ShaderMaterial({
    vertexShader: reflectionVertex, fragmentShader: source ? softboxFragment : reflectionFragment,
    uniforms: { weights: { value: weights } }, side: THREE.BackSide, toneMapped: false,
    depthTest: false, depthWrite: false, transparent: !!source,
    blending: source ? THREE.CustomBlending : THREE.NoBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const shaping = new THREE.Mesh(geometry, material);
  shaping.renderOrder = 100; shaping.frustumCulled = false;
  const moodUniforms: { value: THREE.Vector3; original: THREE.Vector3 }[] = [];
  const visibilityUniforms: { uniform: { value: number }; original: number }[] = [];
  const effects = room.getObjectByName("sky-effects");
  const effectsVisible = effects?.visible;
  room.traverse(object => {
    const candidate = object as THREE.Mesh;
    const materials = Array.isArray(candidate.material) ? candidate.material : [candidate.material];
    for (const candidateMaterial of materials) {
      if (!(candidateMaterial instanceof THREE.ShaderMaterial)) continue;
      const uniform = candidateMaterial.uniforms.mood;
      if (uniform?.value instanceof THREE.Vector3) moodUniforms.push({ value: uniform.value, original: uniform.value.clone() });
      if (object.name === "sky-stars" && candidateMaterial.uniforms.visibility) {
        const visibility = candidateMaterial.uniforms.visibility;
        visibilityUniforms.push({ uniform: visibility, original: visibility.value });
      }
    }
  });
  const targets: THREE.WebGLRenderTarget[] = [];
  room.add(shaping);
  if (effects) effects.visible = false;
  try {
    for (const value of [0, 0.5, 1]) {
      const state = sampleSceneMood(value);
      weights.set(state.day, state.sunset, state.night);
      moodUniforms.forEach(uniform => uniform.value.copy(weights));
      const twilight = THREE.MathUtils.smoothstep(value, 0.38, 0.52);
      const starVisibility = Math.max(twilight * state.sunset * 0.22, Math.pow(state.stars, 0.45) * 0.88);
      visibilityUniforms.forEach(({ uniform }) => { uniform.value = starVisibility; });
      room.updateMatrixWorld(true);
      targets.push(generator.fromScene(room, 0, 0.1, source ? 3000 : 100, { size: 512 }));
    }
  } catch (error) {
    targets.forEach(target => target.dispose());
    throw error;
  } finally {
    moodUniforms.forEach(uniform => uniform.value.copy(uniform.original));
    visibilityUniforms.forEach(({ uniform, original }) => { uniform.value = original; });
    if (effects && effectsVisible !== undefined) effects.visible = effectsVisible;
    room.remove(shaping); geometry.dispose(); material.dispose(); generator.dispose();
  }
  return targets;
}

function createReflections(gl: THREE.WebGLRenderer, source: THREE.Scene | null): ReflectionResources {
  const targets = captureSky(gl, source);
  const blend = new THREE.WebGLRenderTarget(targets[0].width, targets[0].height, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false,
  });
  blend.texture.mapping = THREE.CubeUVReflectionMapping;
  blend.texture.colorSpace = THREE.LinearSRGBColorSpace;
  const material = new THREE.ShaderMaterial({
    uniforms: { day: { value: targets[0].texture }, dusk: { value: targets[1].texture }, night: { value: targets[2].texture }, weights: { value: new THREE.Vector3() } },
    depthWrite: false, depthTest: false, toneMapped: false,
    vertexShader: `varying vec2 screenUv;void main(){screenUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform sampler2D day;uniform sampler2D dusk;uniform sampler2D night;uniform vec3 weights;varying vec2 screenUv;void main(){gl_FragColor=texture2D(day,screenUv)*weights.x+texture2D(dusk,screenUv)*weights.y+texture2D(night,screenUv)*weights.z;}`,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const blendScene = new THREE.Scene();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  blendScene.add(mesh);
  return { targets, blend, scene: blendScene, camera: new THREE.Camera(), material, geometry, capturedSource: source, lastMood: -1 };
}

/** Six base-face samples distinguish a valid HDR capture from a black target. */
function sampleReflectionTarget(gl: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
  const pixel = new Uint16Array(4);
  const size = target.width / 3;
  return Array.from({ length: 6 }, (_, face) => {
    gl.readRenderTargetPixels(target, Math.floor((face % 3 + 0.5) * size), Math.floor((Math.floor(face / 3) + 0.5) * size), 1, 1, pixel);
    return Array.from(pixel.slice(0, 3), channel => Number(THREE.DataUtils.fromHalfFloat(channel).toFixed(4)));
  });
}

/** Actual cloud PMREMs captured once, then blended in linear HDR during travel. */
function CrystalReflections() {
  const { gl, scene } = useThree();
  const mood = useSceneMood();
  const resources = useRef<ReflectionResources | null>(null);
  useEffect(() => {
    const previous = scene.environment;
    return () => {
      const state = resources.current;
      if (!state) return;
      if (scene.environment === state.blend.texture) scene.environment = previous;
      disposeReflections(state); resources.current = null;
    };
  }, [scene]);
  useFrame(() => {
    const source = getSkyReflectionSource(scene);
    if (source && !source.ready) return;
    const sky = source?.scene ?? null;
    if (!resources.current || resources.current.capturedSource !== sky) {
      const state = createReflections(gl, sky);
      const previous = resources.current;
      resources.current = state;
      scene.environment = state.blend.texture;
      if (previous) disposeReflections(previous);
      if (process.env.NODE_ENV === "development") {
        gl.domElement.dataset.reflectionCapture = sky ? "layered-clouds" : "procedural-study";
        gl.domElement.dataset.reflectionSources = JSON.stringify(state.targets.map(target => sampleReflectionTarget(gl, target)));
      }
    }
    const state = resources.current;
    if (Math.abs(state.lastMood - mood.current.value) < 0.00002) return;
    const { day, sunset, night, value } = mood.current;
    state.material.uniforms.weights.value.set(day, sunset, night);
    const target = gl.getRenderTarget();
    const xr = gl.xr.enabled;
    try {
      gl.xr.enabled = false; gl.setRenderTarget(state.blend); gl.render(state.scene, state.camera);
      if (process.env.NODE_ENV === "development" && state.lastMood < 0) {
        gl.domElement.dataset.reflectionBlend = JSON.stringify(sampleReflectionTarget(gl, state.blend));
        gl.domElement.dataset.reflectionBound = String(scene.environment === state.blend.texture);
      }
      state.lastMood = value;
    } finally { gl.setRenderTarget(target); gl.xr.enabled = xr; }
  }, -0.6);
  return null;
}
