import * as THREE from "three";

/** Directional shadow-map coverage follows the fully composed reveal opacity.
 * The slab's filtered coverage approximates partial transmission, never an
 * opaque card. RGBADepthPacking ignores material.opacity, so supply coverage
 * explicitly before Three's stable object-space alpha-hash discard. */
export function createDoorShadowMaterial(source: THREE.Material, coverage = 1) {
  const opacity = { value: source.opacity * coverage };
  const material = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    alphaHash: true,
  });
  material.name = `${source.name}_Shadow`;
  material.customProgramCacheKey = () => "door-shadow-coverage-v1";
  material.onBeforeCompile = shader => {
    shader.uniforms.doorShadowOpacity = opacity;
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      uniform float doorShadowOpacity;
    `).replace("#include <alphahash_fragment>", `
      diffuseColor.a *= doorShadowOpacity;
      #include <alphahash_fragment>
    `);
  };
  return { material, update: () => { opacity.value = source.opacity * coverage; } };
}
