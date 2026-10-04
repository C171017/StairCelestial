"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createCloudField } from "@/lib/cloudField";
import { useCloudArtwork } from "@/hooks/useCloudArtwork";
import { useSceneMood } from "./SceneMood";

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
  uniform float sunFacing;
  uniform float wisp;
  uniform vec3 mood;
  varying vec2 cloudUv;
  void main() {
    vec2 edge = smoothstep(vec2(0.0), vec2(0.018), cloudUv)
      * (1.0 - smoothstep(vec2(0.982), vec2(1.0), cloudUv));
    // The artwork contains linear-premultiplied RGB, encoded as sRGB.
    vec4 c = texture2D(artwork, atlasOffset + clamp(cloudUv, 0.002, 0.998) * atlasScale)
      * edge.x * edge.y;
    if (c.a * opacity < 0.002) discard;
    vec3 source = c.rgb / max(c.a, 0.0001);
    float luminance = dot(source, vec3(0.2126, 0.7152, 0.0722));
    // Preserve local cloud relief, but separate the baked golden light from
    // blue shadow. Warm highlights lose their energy as the sun falls, instead
    // of being multiplied by a flat blue tint along with everything else.
    float golden = smoothstep(-0.04, 0.27, source.r - source.b);
    float relief = smoothstep(0.20, 0.94, luminance);
    float highlight = pow(relief, 1.45) * mix(0.6, 1.0, golden);
    float lightDirection = mix(0.15, 1.0, sunFacing) * mix(1.0, 0.38, wisp);
    vec3 duskShadow = vec3(0.023, 0.047, 0.133) * (0.48 + luminance * 1.55);
    vec3 dusk = duskShadow + vec3(0.79, 0.405, 0.20) * highlight * lightDirection;
    dusk += vec3(0.070, 0.098, 0.19) * relief * (1.0 - sunFacing);
    vec3 night = vec3(0.009, 0.020, 0.052) * (0.45 + luminance * 1.75)
      + vec3(0.060, 0.095, 0.17) * highlight * (0.55 + 0.45 * sunFacing);
    vec3 color = source * mood.x + dusk * mood.y + night * mood.z;
    vec3 duskHaze = mix(vec3(0.065, 0.12, 0.27), vec3(0.43, 0.26, 0.205), sunFacing);
    vec3 atmosphere = vec3(0.69, 0.76, 0.82) * mood.x + duskHaze * mood.y
      + vec3(0.025, 0.039, 0.081) * mood.z;
    color = mix(color, atmosphere, haze * 0.88);
    gl_FragColor = vec4(color, c.a * opacity);
    #include <colorspace_fragment>
  }
`;

/** Fixed world artwork: scrolling changes the camera, never the cloud composition. */
export function CloudField({ onReady }: { onReady?: () => void } = {}) {
  const mood = useSceneMood();
  const sources = useCloudArtwork();
  useEffect(() => {
    if (sources !== null) onReady?.();
  }, [sources, onReady]);
  const resources = useMemo(() => {
    const textures = (sources ?? []).map(source => {
      const texture = source.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 1;
      texture.needsUpdate = true;
      return texture;
    });
    const geometry = new THREE.PlaneGeometry(1, 1, 12, 4);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, 0.1 * (0.25 - positions.getX(i) ** 2));
    geometry.computeVertexNormals();
    const clouds = (sources?.length === 2 ? createCloudField() : []).map(cloud => {
      const { wisp, tile } = cloud;
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex, fragmentShader: fragment, transparent: true,
        // This sky is composited separately from the foreground. One immutable
        // painter stack avoids both view-sorted alpha swaps and core/edge seams.
        depthWrite: false, depthTest: false, toneMapped: false,
        side: THREE.DoubleSide, forceSinglePass: true,
        uniforms: {
          artwork: { value: textures[wisp ? 1 : 0] }, atlasScale: { value: wisp ? 1 : 0.5 },
          atlasOffset: { value: new THREE.Vector2(wisp ? 0 : (tile % 2) * 0.5, wisp ? 0 : Math.floor(tile / 2) * 0.5) },
          opacity: { value: cloud.opacity }, haze: { value: cloud.haze },
          sunFacing: { value: Math.pow(Math.max(0, (cloud.x * 0.65 - cloud.z * 0.76) / Math.max(1, Math.hypot(cloud.x, cloud.z))), 1.7) },
          wisp: { value: wisp ? 1 : 0 }, mood: { value: new THREE.Vector3(0, 1, 0) },
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
  }, [sources]);
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, gl, size }) => {
    const state = mood.current;
    resources.clouds.forEach(({ material }) => material.uniforms.mood.value.set(state.day, state.sunset, state.night));
    if (process.env.NODE_ENV !== "development") return;
    const landmark = resources.clouds[19]?.mesh;
    if (!landmark) return;
    projected.copy(landmark.position).project(camera);
    gl.domElement.dataset.cloudLandmarkX = ((projected.x + 1) * size.width / 2).toFixed(2);
    gl.domElement.dataset.cloudLandmarkZ = landmark.position.z.toFixed(2);
    gl.domElement.dataset.cloudArtwork = String(resources.textures[0]?.image?.width ?? 0);
    gl.domElement.dataset.cloudLayout = "fixed";
    gl.domElement.dataset.cloudCount = String(resources.clouds.length);
  }, -0.7);
  useEffect(() => () => {
    resources.geometry.dispose();
    resources.textures.forEach(texture => texture.dispose());
    resources.clouds.forEach(cloud => cloud.material.dispose());
  }, [resources]);
  return <group name="cloud-field">{resources.clouds.map(({ mesh }, i) => <primitive key={i} object={mesh} dispose={null} />)}</group>;
}
