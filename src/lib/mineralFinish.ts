import * as THREE from "three";

export type StoneTextures = { color: THREE.Texture; roughness: THREE.Texture; height: THREE.Texture };
type StoneOptions = {
  scale: number;
  contrast: number;
  relief: number;
  polishVariation: number;
  offset?: THREE.Vector3;
};

/** Object-space triplanar mapping wraps the mineral through rounded profiles
 * without requiring GLB UVs. The same coordinates drive color, polish and
 * micro-relief, so veins remain fixed to the stone while the light moves. */
export function applyMineralFinish(material: THREE.MeshPhysicalMaterial, textures: StoneTextures, options: StoneOptions) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}:polished-marble-v3`;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, {
      stoneColor: { value: textures.color },
      stoneRoughness: { value: textures.roughness },
      stoneHeight: { value: textures.height },
      stoneScale: { value: options.scale },
      stoneContrast: { value: options.contrast },
      stoneRelief: { value: options.relief },
      stonePolishVariation: { value: options.polishVariation },
      stoneOffset: { value: options.offset ?? new THREE.Vector3() },
    });
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vStonePosition;
      varying vec3 vStoneNormal;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vStonePosition = position;
      vStoneNormal = normal;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vStonePosition;
      varying vec3 vStoneNormal;
      uniform sampler2D stoneColor;
      uniform sampler2D stoneRoughness;
      uniform sampler2D stoneHeight;
      uniform float stoneScale;
      uniform float stoneContrast;
      uniform float stoneRelief;
      uniform float stonePolishVariation;
      uniform vec3 stoneOffset;
      vec3 sampleStone(sampler2D source, vec3 p, vec3 weights) {
        return texture2D(source, p.yz).rgb * weights.x
          + texture2D(source, p.zx).rgb * weights.y
          + texture2D(source, p.xy).rgb * weights.z;
      }
    `).replace("#include <map_fragment>", `#include <map_fragment>
      vec3 stoneP = (vStonePosition + stoneOffset) * stoneScale;
      vec3 stoneWeights = pow(abs(normalize(vStoneNormal)), vec3(6.0));
      stoneWeights /= max(dot(stoneWeights, vec3(1.0)), 0.0001);
      vec3 mineralColor = sampleStone(stoneColor, stoneP, stoneWeights);
      // Neutral mineral seams retain depth in daylight without amplifying the
      // source's warm speckles into a stained or weathered-looking surface.
      float mineralValue = dot(mineralColor, vec3(0.2126, 0.7152, 0.0722));
      mineralColor = mix(vec3(mineralValue), mineralColor, 0.12);
      mineralColor = clamp(vec3(1.0) - (vec3(1.0) - mineralColor) * stoneContrast, 0.18, 1.0);
      diffuseColor.rgb *= mineralColor;
    `).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
      float mineralPolish = sampleStone(stoneRoughness, stoneP, stoneWeights).g;
      roughnessFactor = clamp(roughnessFactor + (mineralPolish - 0.5) * stonePolishVariation, 0.16, 0.38);
    `).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Height affects only the optical surface: the smooth silhouette and
      // shadow receiver stay intact, as with finely polished architectural stone.
      float mineralHeight = sampleStone(stoneHeight, stoneP, stoneWeights).r * stoneRelief;
      vec3 stoneDx = dFdx(-vViewPosition);
      vec3 stoneDy = dFdy(-vViewPosition);
      vec3 stoneR1 = cross(stoneDy, normal);
      vec3 stoneR2 = cross(normal, stoneDx);
      float stoneDet = dot(stoneDx, stoneR1);
      vec3 stoneGradient = (stoneR1 * dFdx(mineralHeight) + stoneR2 * dFdy(mineralHeight))
        * sign(stoneDet) / max(abs(stoneDet), 0.000001);
      normal = normalize(normal - stoneGradient);
    `);
  };
}

/** Fine machining follows the inset metal, with derivative-filtered scratches
 * that broaden into satin highlights at a distance instead of sparkling. */
export function applyBrushedMetalFinish(material: THREE.MeshStandardMaterial, strength: number, frequency = 720) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}:satin-metal-v3`;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.uniforms.brushStrength = { value: strength };
    shader.uniforms.brushFrequency = { value: frequency };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vBrushedPosition;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vBrushedPosition = position;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vBrushedPosition;
      uniform float brushStrength;
      uniform float brushFrequency;
    `).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
      float brushedPhase = (vBrushedPosition.y + vBrushedPosition.x * 0.0125) * brushFrequency;
      float brushedVisibility = 1.0 - smoothstep(0.6, 3.0, fwidth(brushedPhase));
      float brushedGrain = sin(brushedPhase) * sin(brushedPhase * 0.731 + 1.4);
      roughnessFactor = clamp(roughnessFactor + brushedGrain * brushedVisibility * brushStrength, 0.2, 0.48);
    `);
  };
}

/** Three r175 uses the scene's intensity in place of the material's when its
 * envMap is null. Keep the shared, changing sky map and give these finishes a
 * deliberate local multiplier without pinning a soon-to-be-disposed PMREM. */
export function applyFinishEnvironment(material: THREE.MeshStandardMaterial) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}:finish-environment-v1`;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.uniforms.finishEnvironmentIntensity = { value: material.envMapIntensity };
    shader.fragmentShader = shader.fragmentShader.replace("#include <envmap_physical_pars_fragment>",
      "uniform float finishEnvironmentIntensity;\n" + THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll(
        "* envMapIntensity", "* envMapIntensity * finishEnvironmentIntensity",
      ));
  };
}
