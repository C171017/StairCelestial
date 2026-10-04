import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createDoorShadowMaterial } from "./doorShadowMaterial";
import { setIntroMaterialOpacity, setLocalMaterialOpacity } from "./materialReveal";

function shaderUniforms(shadow: ReturnType<typeof createDoorShadowMaterial>) {
  const shader = {
    uniforms: {},
    vertexShader: THREE.ShaderLib.depth.vertexShader,
    fragmentShader: THREE.ShaderLib.depth.fragmentShader,
  } as THREE.WebGLProgramParametersWithUniforms;
  shadow.material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
  return shader.uniforms;
}

test("door frame shadows follow the combined entrance and local fade, including reversal", () => {
  const ceramic = new THREE.MeshPhysicalMaterial();
  const shadow = createDoorShadowMaterial(ceramic);
  const uniforms = shaderUniforms(shadow);
  setIntroMaterialOpacity(ceramic, 0.4);
  setLocalMaterialOpacity(ceramic, 0.25);
  shadow.update();
  assert.equal(uniforms.doorShadowOpacity.value, 0.1);
  setIntroMaterialOpacity(ceramic, 1);
  setLocalMaterialOpacity(ceramic, 0);
  shadow.update();
  assert.equal(uniforms.doorShadowOpacity.value, 0, "hidden frames leave no opaque shadow");
  setLocalMaterialOpacity(ceramic, 1);
  shadow.update();
  assert.equal(uniforms.doorShadowOpacity.value, 1);
  ceramic.dispose(); shadow.material.dispose();
});

test("glass shadows stay partially transmissive and disappear with their independent slab dissolve", () => {
  const glass = new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.98, depthWrite: false });
  const frame = new THREE.MeshPhysicalMaterial();
  const glassShadow = createDoorShadowMaterial(glass, 0.24);
  const frameShadow = createDoorShadowMaterial(frame);
  const glassUniforms = shaderUniforms(glassShadow);
  const frameUniforms = shaderUniforms(frameShadow);
  glassShadow.update(); frameShadow.update();
  assert.equal(glassUniforms.doorShadowOpacity.value, 0.98 * 0.24);
  setLocalMaterialOpacity(glass, 0);
  glassShadow.update(); frameShadow.update();
  assert.equal(glassUniforms.doorShadowOpacity.value, 0);
  assert.equal(frameUniforms.doorShadowOpacity.value, 1, "fixed surround retains its shadow as slab dissolves");
  for (const material of [glass, frame, glassShadow.material, frameShadow.material]) material.dispose();
});
