"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { createCloudField } from "@/lib/cloudField";
import { useCloudArtwork } from "@/hooks/useCloudArtwork";
import { createSanctuaryAtmosphere, type SanctuaryAtmosphere } from "@/lib/sanctuaryAtmosphere";

const vertex = `
  varying vec2 cloudUv;
  void main() {
    cloudUv = uv;
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
  uniform vec3 cloudHighlight;
  uniform vec3 cloudShadow;
  uniform vec3 cloudHaze;
  varying vec2 cloudUv;
  void main() {
    vec2 edge = smoothstep(vec2(0.0), vec2(0.018), cloudUv)
      * (1.0 - smoothstep(vec2(0.982), vec2(1.0), cloudUv));
    // The artwork contains linear-premultiplied RGB, encoded as sRGB.
    vec4 c = texture2D(artwork, atlasOffset + clamp(cloudUv, 0.002, 0.998) * atlasScale)
      * edge.x * edge.y;
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
    vec3 color = mix(cloudShadow, cloudHighlight, relief);
    color *= mix(vec3(1.0), source / max(luminance, 0.02), 0.055);
    color = mix(color, cloudHaze, haze);
    gl_FragColor = vec4(color, c.a * opacity);
    #include <colorspace_fragment>
  }
`;

/** Fixed silhouettes and painter order, with separately controlled cloud light. */
export function CloudField({ onReady, atmosphere, time }: { onReady?: () => void; atmosphere?: RefObject<SanctuaryAtmosphere>; time?: RefObject<number> } = {}) {
  const maxAnisotropy = useThree(state => state.gl.capabilities.getMaxAnisotropy());
  const fallback = useMemo(createSanctuaryAtmosphere, []);
  const sources = useCloudArtwork();
  useEffect(() => {
    if (sources !== null) onReady?.();
  }, [sources, onReady]);
  const resources = useMemo(() => {
    const textures = (sources ?? []).map(source => {
      const texture = source.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, maxAnisotropy);
      texture.needsUpdate = true;
      return texture;
    });
    const geometry = new THREE.PlaneGeometry(1, 1, 12, 4);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, 0.1 * (0.25 - positions.getX(i) ** 2));
    geometry.computeVertexNormals();
    const clouds = (sources?.length === 2 ? createCloudField() : []).map(cloud => {
      const { wisp, tile } = cloud;
      const flowStrength = wisp ? 0.006 : Math.hypot(cloud.x, cloud.z) < 440 ? 0.0028 : 0;
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex, fragmentShader: fragment, transparent: true,
        // This sky is composited separately from the foreground. One immutable
        // painter stack avoids both view-sorted alpha swaps and core/edge seams.
        depthWrite: false, depthTest: false, toneMapped: false,
        side: THREE.DoubleSide, forceSinglePass: true,
        defines: flowStrength ? { INTERIOR_FLOW: 1 } : {},
        uniforms: {
          artwork: { value: textures[wisp ? 1 : 0] }, atlasScale: { value: wisp ? 1 : 0.5 },
          atlasOffset: { value: new THREE.Vector2(wisp ? 0 : (tile % 2) * 0.5, wisp ? 0 : Math.floor(tile / 2) * 0.5) },
          opacity: { value: cloud.opacity }, haze: { value: cloud.haze },
          flowPhase: { value: 0 }, flowStrength: { value: flowStrength }, flowSeed: { value: cloud.index * 1.618 },
          cloudHighlight: { value: new THREE.Color() }, cloudShadow: { value: new THREE.Color() }, cloudHaze: { value: new THREE.Color() },
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
      return { mesh, material };
    });
    return { textures, geometry, clouds };
  }, [sources, maxAnisotropy]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, gl, size }) => {
    const mood = atmosphere?.current ?? fallback;
    const phase = ((time?.current ?? 0) % 360) / 360 * Math.PI * 2;
    for (const { material } of resources.clouds) {
      material.uniforms.cloudHighlight.value.setRGB(...mood.cloudHighlight);
      material.uniforms.cloudShadow.value.setRGB(...mood.cloudShadow);
      material.uniforms.cloudHaze.value.setRGB(...mood.cloudHaze);
      material.uniforms.flowPhase.value = phase;
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
    gl.domElement.dataset.cloudFlow = "interior-only";
  }, -0.7);
  useEffect(() => () => {
    resources.geometry.dispose();
    resources.textures.forEach(texture => texture.dispose());
    resources.clouds.forEach(cloud => cloud.material.dispose());
  }, [resources]);
  return <group name="cloud-field">{resources.clouds.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}</group>;
}
