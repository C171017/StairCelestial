"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { createCloudField } from "@/lib/cloudField";
import { createCloudAdvection, sampleCloudAdvection } from "@/lib/cloudAdvection";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

const vertex = `
  uniform vec3 sunDirection;
  varying vec2 cloudUv;
  varying float sunAlignment;
  #ifdef LIGHT_STUDY
    uniform float studyTime;
    varying float studyLight;
  #endif
  void main() {
    cloudUv = uv;
    // Broad world-space grazing response is cheap at these few vertices and
    // stays attached to the shared sun as the viewing camera moves around it.
    vec3 worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    sunAlignment = dot(normalize(worldPosition), sunDirection);
    #ifdef LIGHT_STUDY
      studyLight = pow(.5+.5*sin(worldPosition.x*.014+worldPosition.z*.008-studyTime*.65),2.);
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  uniform sampler2D artwork;
  uniform vec2 atlasOffset;
  uniform float atlasScale;
  uniform float opacity;
  uniform float haze;
  uniform float flowPhase;
  uniform float flowStrength;
  uniform float flowSeed;
  uniform vec4 flowOffsets;
  uniform float flowBlend;
  uniform vec3 cloudHighlight;
  uniform vec3 cloudShadow;
  uniform vec3 cloudHaze;
  uniform vec3 cloudSunlight;
  uniform float twilightLight;
  varying vec2 cloudUv;
  varying float sunAlignment;
  #ifdef LIGHT_STUDY
    varying float studyLight;
  #endif
  #ifdef WISP_FLOW
    vec4 sampleWisp(vec2 position) {
      vec2 edge = smoothstep(vec2(0.0), vec2(0.08), position)
        * (1.0 - smoothstep(vec2(0.92), vec2(1.0), position));
      return texture2D(artwork, clamp(position, 0.002, 0.998)) * edge.x * edge.y;
    }
  #endif
  void main() {
    #ifdef WISP_FLOW
      // Full RGBA features travel continuously with a shared wind. Each sample
      // resets only at zero weight; premultiplied mixing avoids doubled opacity.
      // CPU offsets replace the old per-pixel sine/cosine deformation.
      vec4 c = mix(sampleWisp(cloudUv - flowOffsets.zw),
        sampleWisp(cloudUv - flowOffsets.xy), flowBlend);
      vec2 edge = smoothstep(vec2(0.0), vec2(0.1), cloudUv)
        * (1.0 - smoothstep(vec2(0.9), vec2(1.0), cloudUv));
      c *= edge.x * edge.y;
    #else
    vec2 edge = smoothstep(vec2(0.0), vec2(0.018), cloudUv)
      * (1.0 - smoothstep(vec2(0.982), vec2(1.0), cloudUv));
    // The artwork contains linear-premultiplied RGB, encoded as sRGB.
    vec4 c = texture2D(artwork, atlasOffset + clamp(cloudUv, 0.002, 0.998) * atlasScale)
      * edge.x * edge.y;
    #endif
    if (c.a * opacity < 0.002) discard;
    vec3 source = c.rgb / max(c.a, 0.0001);
    #ifdef INTERIOR_FLOW
      // The alpha is always sampled at its original location. Vapor detail
      // drifts inside each cloud without moving its silhouette or layer order.
      vec2 pattern = vec2(cloudUv.y * 7.0, cloudUv.x * 8.0) + flowSeed;
      vec2 drift = vec2(sin(pattern.x + flowPhase * 2.0) - sin(pattern.x),
        cos(pattern.y + flowPhase) - cos(pattern.y)) * flowStrength;
      vec4 moved = texture2D(artwork,
        atlasOffset + clamp(cloudUv + drift, 0.002, 0.998) * atlasScale);
      float interior = smoothstep(0.08, 0.55, c.a) * smoothstep(0.08, 0.55, moved.a);
      source = mix(source, moved.rgb / max(moved.a, 0.0001), interior * 0.7);
    #endif
    // Keep photographic shape/detail while replacing the former baked yellow
    // cast with pearl highlights and blue-grey shadow. Night is a different
    // cloud lighting palette, not an opacity fade over daylight artwork.
    float luminance = dot(source, vec3(0.2126, 0.7152, 0.0722));
    float relief = smoothstep(0.035, 0.92, luminance);
    float sunward = smoothstep(0.52, 0.985, sunAlignment);
    // The source's painted relief already describes each billow. At grazing
    // light, preserve its cooler midtones and pick out bright crests rather
    // than placing an orange/pink wash across the whole cloud bank.
    float directedRelief = relief * (0.76 + 0.24 * sunward);
    float litRelief = mix(relief, directedRelief * directedRelief, twilightLight * 0.42);
    vec3 color = mix(cloudShadow, cloudHighlight, litRelief);
    color *= mix(vec3(1.0), source / max(luminance, 0.02), 0.055);
    float crest = smoothstep(0.46, 0.9, relief);
    // A wide alpha shoulder gives a little translucent edge response without
    // derivatives, new texture taps, or a noisy one-pixel outline.
    float softEdge = smoothstep(0.12, 0.52, c.a) * (1.0 - smoothstep(0.7, 0.98, c.a));
    float grazing = twilightLight * sunward * crest * (0.5 + 0.28 * softEdge);
    vec3 warmCrest = mix(cloudHighlight, cloudSunlight, 0.72);
    color = mix(color, warmCrest, grazing);
    #ifdef LIGHT_STUDY
      float crestLight=studyLight*smoothstep(.3,.88,relief);
      color=mix(color,mix(cloudHighlight,cloudSunlight,.38)*1.18,crestLight*.44);
    #endif
    color = mix(color, cloudHaze, haze * (1.0 - grazing * 0.35));
    gl_FragColor = vec4(color, c.a * opacity);
    #include <colorspace_fragment>
  }
`;

/** Anchored banks and painter order, with two softly drifting cirrus depths. */
export function CloudField({ onReady, atmosphere, time, sources, lightStudy=false }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; time?: RefObject<number>;sources: readonly THREE.Texture[]|null;lightStudy?:boolean }) {
  const fallback = useMemo(createSanctuaryAtmosphere, []);
  useEffect(() => {
    if (sources !== null) onReady?.();
  }, [sources, onReady]);
  const resources = useMemo(() => {
    const textures = sources ?? [];
    const geometry = new THREE.PlaneGeometry(1, 1, 12, 4);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, 0.1 * (0.25 - positions.getX(i) ** 2));
    geometry.computeVertexNormals();
    const clouds = (sources?.length === 2 ? createCloudField() : []).map(cloud => {
      const { wisp, tile } = cloud;
      const flowStrength = !wisp && Math.hypot(cloud.x, cloud.z) < 440 ? 0.0028 : 0;
      // Existing surfaces keep the two wind depths and fixed painter order.
      const advection = wisp ? createCloudAdvection(cloud) : null;
      const flowSample = { aU: 0, aV: 0, bU: 0, bV: 0, blend: 0 };
      const flowSeed = cloud.index * 1.618;
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex, fragmentShader: fragment, transparent: true,
        // This sky is composited separately from the foreground. One immutable
        // painter stack avoids both view-sorted alpha swaps and core/edge seams.
        depthWrite: false, depthTest: false, toneMapped: false,
        side: THREE.DoubleSide, forceSinglePass: true,
        defines: { ...(wisp ? { WISP_FLOW: 1 } : flowStrength ? { INTERIOR_FLOW: 1 } : {}), ...(lightStudy ? { LIGHT_STUDY: 1 } : {}) },
        uniforms: {
          artwork: { value: textures[wisp ? 1 : 0] }, atlasScale: { value: wisp ? 1 : 0.5 },
          atlasOffset: { value: new THREE.Vector2(wisp ? 0 : (tile % 2) * 0.5, wisp ? 0 : Math.floor(tile / 2) * 0.5) },
          opacity: { value: cloud.opacity }, haze: { value: cloud.haze },
          flowPhase: { value: 0 }, flowStrength: { value: flowStrength }, flowSeed: { value: flowSeed },
          flowOffsets: { value: new THREE.Vector4() }, flowBlend: { value: 0 },
          studyTime: { value: 0 },
          cloudHighlight: { value: new THREE.Color() }, cloudShadow: { value: new THREE.Color() }, cloudHaze: { value: new THREE.Color() },
          sunDirection: { value: new THREE.Vector3() }, cloudSunlight: { value: new THREE.Color() }, twilightLight: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `cloud-${cloud.index}`;
      mesh.raycast = () => null;
      mesh.position.set(cloud.x, cloud.y, cloud.z);
      mesh.scale.set(cloud.width, cloud.height, 1);
      mesh.lookAt(0, wisp ? 20 : 25, 0);
      mesh.renderOrder = cloud.renderOrder;
      mesh.visible = cloud.opacity > 0.001;
      return { mesh, material, wisp, advection, flowSample };
    });
    return { textures, geometry, clouds };
  }, [sources, lightStudy]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, gl, size }) => {
    const mood = atmosphere?.current ?? fallback;
    // LayeredSky owns this ambient clock and pauses it for reduced motion,
    // hidden pages, and explicit pause independently of the world-time mood.
    const seconds = time?.current ?? 0;
    const phase = (seconds % 720) / 720 * Math.PI * 2;
    for (const { material, wisp, advection, flowSample } of resources.clouds) {
      material.uniforms.cloudHighlight.value.setRGB(...mood.cloudHighlight);
      material.uniforms.cloudShadow.value.setRGB(...mood.cloudShadow);
      material.uniforms.cloudHaze.value.setRGB(...mood.cloudHaze);
      material.uniforms.sunDirection.value.set(...mood.sunDirection);
      material.uniforms.cloudSunlight.value.setRGB(...mood.keyColor);
      material.uniforms.twilightLight.value = (mood.dawn + mood.sunset) * (wisp ? 0.45 : 1);
      material.uniforms.flowPhase.value = phase * 2;
      material.uniforms.studyTime.value = seconds;
      if (advection) {
        sampleCloudAdvection(seconds, advection, flowSample);
        material.uniforms.flowOffsets.value.set(flowSample.aU, flowSample.aV, flowSample.bU, flowSample.bV);
        material.uniforms.flowBlend.value = flowSample.blend;
      }
    }
    if (process.env.NODE_ENV !== "development") return;
    const landmark = resources.clouds[19]?.mesh;
    if (!landmark) return;
    projected.copy(landmark.position).project(camera);
    gl.domElement.dataset.cloudLandmarkX = ((projected.x + 1) * size.width / 2).toFixed(2);
    gl.domElement.dataset.cloudLandmarkZ = landmark.position.z.toFixed(2);
    gl.domElement.dataset.cloudArtwork = String(resources.textures[0]?.image?.width ?? 0);
    gl.domElement.dataset.cloudLayout = "fixed";
    gl.domElement.dataset.cloudCount = String(resources.clouds.length);
    gl.domElement.dataset.cloudFlow = "continuous-wind-cirrus";
  }, -0.7);
  useEffect(() => () => {
    resources.geometry.dispose();
    resources.clouds.forEach(cloud => cloud.material.dispose());
  }, [resources]);
  return <group name="cloud-field">{resources.clouds.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}</group>;
}
