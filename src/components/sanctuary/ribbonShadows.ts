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
 * Warm contact reflections are a bounded approximation of the frame's foot,
 * not a claim of full ray-traced portal reflections or refractive caustics.
 */
export function createRibbonShadows() {
  const origins = { value: Array.from({ length: RIBBON_SHADOW_COUNT }, () => new THREE.Vector4(0, 0, 0, 1)) };
  const poses = { value: Array.from({ length: RIBBON_SHADOW_COUNT }, () => new THREE.Vector2()) };
  const warmth = { value: 0.9 };
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.ribbonShadowOrigins = origins;
    shader.uniforms.ribbonShadowPoses = poses;
    shader.uniforms.ribbonContactWarmth = warmth;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vRibbonPosition;
      varying float vRibbonTop;
      varying float vRibbonFace;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vRibbonPosition = position;
      vRibbonTop = smoothstep(0.1, 0.8, normal.y);
      vRibbonFace = smoothstep(0.12, 0.88, abs(normal.y));
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vRibbonPosition;
      varying float vRibbonTop;
      varying float vRibbonFace;
      uniform vec4 ribbonShadowOrigins[${RIBBON_SHADOW_COUNT}];
      uniform vec2 ribbonShadowPoses[${RIBBON_SHADOW_COUNT}];
      uniform float ribbonContactWarmth;
    `).replace("#include <opaque_fragment>", `
      float ribbonShade = 0.0;
      float ribbonContact = 0.0;
      for (int i = 0; i < ${RIBBON_SHADOW_COUNT}; i++) {
        vec4 origin = ribbonShadowOrigins[i];
        vec2 pose = ribbonShadowPoses[i];
        vec3 offset = (vRibbonPosition - origin.xyz) / origin.w;
        // Ignore turns above/below the door; retain the helix's slope rather
        // than cutting a rectangular decal plane through its curved surface.
        float heightMask = 1.0 - smoothstep(0.42, 1.1, abs(offset.y));
        float c = cos(pose.x), s = sin(pose.x);
        vec2 local = vec2(c * offset.x - s * offset.z, s * offset.x + c * offset.z);
        vec2 foot = local / vec2(0.7, 0.17);
        vec2 ambientFoot = local / vec2(0.88, 0.43);
        float contactShadow = exp(-2.0 * dot(foot, foot)) * 0.56;
        float softShadow = exp(-2.0 * dot(ambientFoot, ambientFoot)) * 0.16;
        ribbonShade += (contactShadow + softShadow) * heightMask * pose.y;
        // A thin, compressed contact glint extends beyond the occluded foot.
        // Its view dependence stops this from reading as an emissive sticker.
        vec2 reflection = local / vec2(0.76, 0.55);
        float clearFoot = smoothstep(0.12, 0.25, abs(local.y));
        ribbonContact += exp(-2.5 * dot(reflection, reflection)) * clearFoot * heightMask * pose.y;
      }
      float ribbonGrazing = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.0);
      outgoingLight *= mix(vec3(1.0), vec3(0.30, 0.39, 0.53),
        min(ribbonShade, 0.7) * vRibbonTop);
      outgoingLight += vec3(1.0, 0.63, 0.29) * min(ribbonContact, 0.8)
        * ribbonContactWarmth * (0.045 + 0.19 * ribbonGrazing) * vRibbonTop;
      #include <opaque_fragment>
    `);
  };
  return { origins, poses, warmth, onBeforeCompile };
}
