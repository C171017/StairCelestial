import * as THREE from "three";

/** Quiet, object-space glaze variation. No UV seams, texture requests, or noise
 * animation: the material should read as satin porcelain, not moving grain. */
export function applyPorcelainFinish(material: THREE.MeshStandardMaterial) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}:satin-porcelain-v1`;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vPorcelainPosition;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vPorcelainPosition = position;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vPorcelainPosition;
      float porcelainGlaze(vec3 p) {
        return sin(dot(p, vec3(53.1, 71.7, 43.4)))
          * sin(dot(p, vec3(83.9, -41.3, 61.2)));
      }
    `).replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
      float glaze = porcelainGlaze(vPorcelainPosition);
      roughnessFactor = clamp(roughnessFactor + glaze * 0.019, 0.04, 1.0);
    `).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Sub-pixel bump amplitude is filtered by screen derivatives. At the
      // overview distance this only broadens highlights; it never reads gritty.
      float porcelainHeight = porcelainGlaze(vPorcelainPosition) * 0.00024;
      vec3 porcelainDx = dFdx(-vViewPosition);
      vec3 porcelainDy = dFdy(-vViewPosition);
      vec3 porcelainR1 = cross(porcelainDy, normal);
      vec3 porcelainR2 = cross(normal, porcelainDx);
      float porcelainDet = dot(porcelainDx, porcelainR1);
      vec3 porcelainGradient = (porcelainR1 * dFdx(porcelainHeight)
        + porcelainR2 * dFdy(porcelainHeight))
        * sign(porcelainDet) / max(abs(porcelainDet), 0.000001);
      normal = normalize(normal - porcelainGradient);
    `);
  };
}

/** Low-amplitude casting variation bends reflections through the slab while
 * retaining its quiet silhouette and polished edge. */
export function applyCastGlassFinish(material: THREE.MeshPhysicalMaterial) {
  const previousCompile = material.onBeforeCompile;
  const previousKey = material.customProgramCacheKey();
  material.customProgramCacheKey = () => `${previousKey}:cast-glass-v3`;
  material.onBeforeCompile = (shader, renderer) => {
    previousCompile.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vCastPosition;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      vCastPosition = position;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vCastPosition;
    `).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Exported slab vertices use glTF Y-up coordinates. A shallow
      // meniscus eases one reflection across the face; tiny cast variation
      // prevents a mathematically flat plate without a visible wave effect.
      vec2 castFace = vCastPosition.xy - vec2(0.0, 1.65);
      float castHeight = dot(castFace, castFace) * 0.012
        + sin(dot(vCastPosition, vec3(3.7, 2.3, 4.1)))
        * sin(dot(vCastPosition, vec3(2.2, 4.8, -2.6))) * 0.0035;
      vec3 castDx = dFdx(-vViewPosition);
      vec3 castDy = dFdy(-vViewPosition);
      vec3 castR1 = cross(castDy, normal);
      vec3 castR2 = cross(normal, castDx);
      float castDet = dot(castDx, castR1);
      vec3 castGradient = (castR1 * dFdx(castHeight) + castR2 * dFdy(castHeight))
        * sign(castDet) / max(abs(castDet), 0.000001);
      normal = normalize(normal - castGradient);
    `).replace("#include <transmission_fragment>", THREE.ShaderChunk.transmission_fragment.replace(
      "material.thickness = thickness;",
      `// Cast glass is optically lighter through its center and thicker around
       // the rolled perimeter. Absorption varies with real ray thickness.
       float glassPerimeter = smoothstep(0.22, 1.0,
         length((vCastPosition.xy - vec2(0.0, 1.65)) / vec2(0.95, 1.55)));
       material.thickness = thickness * mix(0.32, 1.65, glassPerimeter);`
    ));
  };
}
