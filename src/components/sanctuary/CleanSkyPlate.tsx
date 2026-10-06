"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

const vertex = `
  varying vec3 skyDirection;
  void main() {
    skyDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 lowerSky;
  uniform vec3 keyDirection;
  uniform vec3 sunDirection;
  uniform vec3 moonDirection;
  uniform float daylight;
  uniform float dusk;
  uniform float dawn;
  uniform float sunset;
  uniform float stars;
  uniform float sunVisibility;
  uniform float moonVisibility;
  uniform float ambientTime;
  varying vec3 skyDirection;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float lunarNoise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), f.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), f.x), f.y);
  }
  float crater(vec2 p, vec2 center, float radius) {
    float distance = length(p - center) / radius;
    return -0.11 * (1.0 - smoothstep(0.65, 0.95, distance))
      + 0.07 * exp(-pow((distance - 1.0) * 7.0, 2.0));
  }
  void main() {
    vec3 d = normalize(skyDirection);
    float elevation = d.y;
    vec3 color = mix(horizon, zenith, smoothstep(-0.04, 0.20, elevation));
    color = mix(color, lowerSky, smoothstep(-0.03, 0.70, -elevation));
    // A broad directional atmospheric glow follows the same clock as the key
    // light. This is layered radiance, never a dark overlay over daylight art.
    vec3 sunward = normalize(vec3(sunDirection.x, 0.025, sunDirection.z));
    float facingSun = max(0.0, dot(d, sunward));
    float twilightBand = exp(-pow((elevation - 0.025) * 5.0, 2.0)) * dusk;
    // A cooler, quieter opposite horizon gives the warm low sun a place in
    // the sky, instead of grading the whole horizon with a flat pink wash.
    float opposite = 1.0 - pow(facingSun, 5.0);
    color = mix(color, mix(color, zenith, 0.48), twilightBand * opposite * 0.62);
    float glow = pow(facingSun, 18.0)
      * exp(-pow(elevation * 4.0, 2.0));
    color += vec3(0.052, 0.033, 0.014) * glow * daylight;
    color += (vec3(0.28, 0.12, 0.024) * dawn + vec3(0.19, 0.067, 0.084) * sunset) * glow;
    if (sunVisibility > 0.001) {
      float sunDistance = length(d - sunDirection);
      float sunRadius = mix(0.0085, 0.0105, dawn);
      float aa = max(fwidth(sunDistance), 0.0002);
      float disc = 1.0 - smoothstep(sunRadius - aa, sunRadius + aa, sunDistance);
      // The disc dissolves into pearl daylight. A broad atmospheric bloom is
      // most pronounced at the warm horizon, without a screen-space lens flare.
      float halo = exp(-pow(sunDistance / 0.042, 1.45));
      vec3 sunlight = mix(vec3(1.0, 0.56, 0.48), vec3(1.0, 0.69, 0.30), dawn);
      color += sunlight * halo * sunVisibility * 0.36;
      // Morning's low gold glare has a wider horizontal haze and a soft
      // rising column. It follows the real sun direction and stays behind
      // cloud alpha; there are no screen-space flares or extra cloud passes.
      vec3 sunRight = normalize(cross(vec3(0.0, 1.0, 0.0), sunDirection));
      vec3 sunUp = cross(sunDirection, sunRight);
      vec2 sunOffset = vec2(dot(d, sunRight), dot(d, sunUp));
      float lowHaze = exp(-pow(sunOffset.x / 0.25, 2.0) - pow(sunOffset.y / 0.055, 2.0));
      float morningGlare = exp(-pow(sunOffset.x / 0.10, 2.0) - pow(sunOffset.y / 0.135, 2.0));
      float sunHemisphere = smoothstep(0.0, 0.3, dot(d, sunDirection));
      color += (vec3(0.24, 0.095, 0.019) * lowHaze
        + vec3(0.11, 0.065, 0.024) * morningGlare) * dawn * sunVisibility * sunHemisphere;
      color = mix(color, vec3(1.0, 0.94, 0.75), disc * sunVisibility * 0.95);
    }
    if (moonVisibility > 0.001) {
      float moonDistance = length(d - moonDirection);
      float moonRadius = 0.022;
      // Derivatives must run before the per-pixel lunar surface branch; some
      // mobile GPUs return undefined results for derivatives inside it.
      float moonAA = max(fwidth(moonDistance) / moonRadius, 0.005);
      float moonHalo = exp(-pow(moonDistance / 0.06, 1.65));
      color += vec3(0.065, 0.085, 0.135) * moonHalo * moonVisibility;
      // Only pixels on the tiny lunar disc evaluate surface noise. The rest of
      // the sky needs no texture fetches or volumetric sampling.
      if (moonDistance < moonRadius * 1.12) {
        vec3 moonRight = normalize(cross(vec3(0.0, 1.0, 0.0), moonDirection));
        vec3 moonUp = cross(moonDirection, moonRight);
        vec2 p = vec2(dot(d, moonRight), dot(d, moonUp)) / moonRadius;
        float radius = length(p);
        float disc = 1.0 - smoothstep(1.0 - moonAA, 1.0 + moonAA, radius);
        float surface = lunarNoise(p * 3.3 + 8.1) * 0.55
          + lunarNoise(p * 8.0 + 2.7) * 0.28
          + lunarNoise(p * 21.0 + 3.5) * 0.12
          + lunarNoise(p * 48.0) * 0.05;
        float maria = smoothstep(0.38, 0.64, lunarNoise(p * 2.6 + 5.7));
        float relief = crater(p, vec2(-0.45, 0.28), 0.14)
          + crater(p, vec2(0.29, -0.45), 0.20)
          + crater(p, vec2(0.42, 0.30), 0.09)
          + crater(p, vec2(-0.17, -0.67), 0.10);
        vec3 normal = vec3(p, sqrt(max(0.0, 1.0 - dot(p, p))));
        float sphericalLight = 0.42 + 0.58 * max(0.0,
          dot(normal, normalize(vec3(-0.32, 0.25, 0.91))));
        float tone = (0.66 + surface * 0.40 - maria * 0.20 + relief) * sphericalLight;
        vec3 moonColor = vec3(0.88, 0.91, 0.98) * tone;
        color = mix(color, moonColor, disc * moonVisibility);
      }
    }
    if (stars > 0.001) {
      // An integer longitude grid wraps exactly; stars are world-fixed and
      // remain behind the separately composited cloud alpha.
      vec2 uv = vec2(atan(d.z, d.x) / 6.28318530718 + 0.5, asin(d.y) / 3.14159265359 + 0.5);
      vec2 grid = uv * vec2(460.0, 230.0);
      vec2 cell = floor(grid);
      float seed = hash(cell);
      vec2 location = vec2(hash(cell + 7.3), hash(cell + 19.6)) * 0.56 + 0.22;
      vec2 point = fract(grid) - location;
      // Slightly resolved pinpoints survive Retina downsampling and the soft
      // cirrus. Derivative filtering avoids subpixel glitter during an orbit.
      vec2 footprint = min(fwidth(grid), vec2(0.15));
      float sizeSeed = hash(cell + 3.2);
      float variance = max(mix(0.0025, 0.012, pow(sizeSeed, 2.8)),
        dot(footprint, footprint) * 0.18);
      float star = exp(-dot(point, point) / variance);
      float horizonFade = smoothstep(-0.025, 0.04, elevation);
      float magnitude = hash(cell + 29.1);
      // Five and a half times as many occupied cells, with mostly small stars
      // and a few brighter points. The image stays varied rather than dotted
      // with equally large lights, and costs the same one procedural grid.
      float brightness = step(0.967, seed) * mix(0.30, 1.18, pow(magnitude, 2.0));
      float brightHalo = exp(-dot(point, point) / (variance * 3.8))
        * smoothstep(0.88, 1.0, magnitude) * 0.10;
      // Most stars are still. A small minority breathe by less than 8%, with
      // the shared ambient clock frozen for reduced motion or a hidden tab.
      float twinkle = 1.0 + step(0.86, hash(cell + 43.7)) * 0.075
        * sin(ambientTime * mix(0.38, 0.62, hash(cell + 2.2)) + hash(cell + 18.4) * 6.2831853);
      float moonOcclusion = (1.0 - smoothstep(0.021, 0.024, length(d - moonDirection))) * moonVisibility;
      float sunHaze = exp(-pow(length(d - sunDirection) / 0.16, 1.5)) * sunVisibility * 0.85;
      vec3 starColor = mix(vec3(0.65, 0.79, 1.0), vec3(1.0, 0.89, 0.70),
        pow(hash(cell + 64.8), 4.0) * 0.65);
      color += starColor * (star + brightHalo) * brightness * twinkle * stars
        * horizonFade * (1.0 - moonOcclusion) * (1.0 - sunHaze);
    }
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/** World-fixed celestial paths share the scene lights; cloud alpha occludes them. */
export function CleanSkyPlate({ onReady, atmosphere, time }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; time?: RefObject<number> } = {}) {
  const fallback = useMemo(createSanctuaryAtmosphere, []);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, lowerSky: { value: new THREE.Color() },
    keyDirection: { value: new THREE.Vector3() }, daylight: { value: 1 }, dusk: { value: 0 }, stars: { value: 0 },
    sunDirection: { value: new THREE.Vector3(0, 1, 0) }, moonDirection: { value: new THREE.Vector3(0, -1, 0) },
    dawn: { value: 0 }, sunset: { value: 0 }, sunVisibility: { value: 0 }, moonVisibility: { value: 0 }, ambientTime: { value: 0 },
  }), []);
  useEffect(() => { onReady?.(); }, [onReady]);
  useFrame(({ gl }) => {
    const mood = atmosphere?.current ?? fallback;
    // R3F copies uniform wrappers when applying ShaderMaterial props. Color
    // and Vector instances stay shared, but scalar .value fields do not.
    // Always write the live material so visibility and time reach the GPU.
    const values = (material.current?.uniforms as typeof uniforms | undefined) ?? uniforms;
    values.zenith.value.setRGB(...mood.skyZenith);
    values.horizon.value.setRGB(...mood.skyHorizon);
    values.lowerSky.value.setRGB(...mood.skyLower);
    values.keyDirection.value.set(...mood.keyDirection);
    values.sunDirection.value.set(...mood.sunDirection);
    values.moonDirection.value.set(...mood.moonDirection);
    values.daylight.value = mood.daylight;
    values.dusk.value = mood.dusk;
    values.dawn.value = mood.dawn;
    values.sunset.value = mood.sunset;
    values.stars.value = mood.starVisibility;
    values.sunVisibility.value = mood.sunVisibility;
    values.moonVisibility.value = mood.moonVisibility;
    values.ambientTime.value = time?.current ?? 0;
    if (process.env.NODE_ENV === "development") {
      gl.domElement.dataset.skyMoonVisibility = values.moonVisibility.value.toFixed(4);
      gl.domElement.dataset.skySunVisibility = values.sunVisibility.value.toFixed(4);
      gl.domElement.dataset.skyStarVisibility = values.stars.value.toFixed(4);
      gl.domElement.dataset.skyMoonDirection = values.moonDirection.value.toArray().map(value => value.toFixed(4)).join(",");
      gl.domElement.dataset.skySunDirection = values.sunDirection.value.toArray().map(value => value.toFixed(4)).join(",");
      gl.domElement.dataset.skyMaterialUniformsMatch = String(material.current?.uniforms === values);
      gl.domElement.dataset.skyMaterialMoonVisibility = String(material.current?.uniforms.moonVisibility?.value);
    }
  }, -0.8);
  return <mesh renderOrder={-3000} raycast={() => null}>
    <sphereGeometry args={[450, 64, 32]}/>
    <shaderMaterial ref={material} side={THREE.BackSide} depthWrite={false} toneMapped={false}
      uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment}/>
  </mesh>;
}
