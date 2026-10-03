import * as THREE from "three";

export type RibbonDoorShadow = {
  position: THREE.Vector3;
  scale: number;
  yaw: number;
  visible: boolean;
};

export const RIBBON_SHADOW_COUNT = 15;

/** Analytic contact shading on the receiver itself: no floating decals,
 * shadow-map render passes, or dark patches spilling beyond the ribbon edge.
 * These deliberately soft footprints are not exact door silhouettes/caustics.
 */
export function createRibbonShadows() {
  const origins = { value: Array.from({ length: RIBBON_SHADOW_COUNT }, () => new THREE.Vector4(0, 0, 0, 1)) };
  const poses = { value: Array.from({ length: RIBBON_SHADOW_COUNT }, () => new THREE.Vector2()) };
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.ribbonShadowOrigins = origins;
    shader.uniforms.ribbonShadowPoses = poses;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vRibbonPosition;
      varying float vRibbonTop;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vRibbonPosition = position;
      vRibbonTop = smoothstep(0.1, 0.8, normal.y);
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vRibbonPosition;
      varying float vRibbonTop;
      uniform vec4 ribbonShadowOrigins[${RIBBON_SHADOW_COUNT}];
      uniform vec2 ribbonShadowPoses[${RIBBON_SHADOW_COUNT}];
    `).replace("#include <opaque_fragment>", `
      float ribbonShade = 0.0;
      for (int i = 0; i < ${RIBBON_SHADOW_COUNT}; i++) {
        vec4 origin = ribbonShadowOrigins[i];
        vec2 pose = ribbonShadowPoses[i];
        vec3 offset = (vRibbonPosition - origin.xyz) / origin.w;
        // Ignore the other turns above/below this door. The broad height
        // window follows the sloping receiver without a flat-plane seam.
        float heightMask = 1.0 - smoothstep(0.45, 1.3, abs(offset.y));
        float c = cos(pose.x), s = sin(pose.x);
        vec2 local = vec2(c * offset.x - s * offset.z, s * offset.x + c * offset.z);
        vec2 contact = local / vec2(0.72, 0.30);
        float nearShadow = exp(-2.0 * dot(contact, contact)) * 0.42;
        ribbonShade += nearShadow * heightMask * pose.y;
      }
      outgoingLight *= mix(vec3(1.0), vec3(0.42, 0.51, 0.61),
        min(ribbonShade, 0.65) * vRibbonTop);
      #include <opaque_fragment>
    `);
  };
  return { origins, poses, onBeforeCompile };
}
