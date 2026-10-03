import * as THREE from "three";

/** Iris details stay attached to the original surface as it gains depth.
 * This only shades the surface; no noise, displacement, or extra render pass. */
export function createIntroIrisMaterial() {
  const detail = { value: 1 };
  const material = new THREE.MeshPhysicalMaterial({
    color: "#f4f1e9", metalness: 0.08, roughness: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.055, envMapIntensity: 1.8,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.uIrisDetail = detail;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vIrisPoint;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvIrisPoint = uv * 2.0 - 1.0;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vIrisPoint;\nuniform float uIrisDetail;")
      .replace("#include <color_fragment>", `
        #include <color_fragment>
        float radius = length(vIrisPoint);
        float angle = atan(vIrisPoint.y, vIrisPoint.x + 0.00001);
        float irisBand = smoothstep(0.40, 0.46, radius) * (1.0 - smoothstep(0.87, 1.0, radius));
        float fibers = pow(0.5 + 0.5 * cos(angle * 40.0), 8.0);
        float irisShade = irisBand * (0.22 + fibers * 0.09);
        // The cloud eye uses an inverted palette: a pale pupil and cool iris.
        diffuseColor.rgb *= mix(vec3(1.0), vec3(1.0 - irisShade), uIrisDetail);
      `);
  };
  material.customProgramCacheKey = () => "intro-iris-detail-v1";
  return { material, detail };
}
