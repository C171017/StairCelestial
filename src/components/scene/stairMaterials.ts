import * as THREE from "three";

/**
 * One shared finish keeps regular treads and door landings visually continuous.
 * The warmer, slightly darker base and controlled roughness read as honed
 * mineral composite instead of bright foam under the scene lights.
 */
const stairMaterial = new THREE.MeshStandardMaterial({
  name: "mat_stair_honed_mineral",
  color: "#d2c8b7",
  metalness: 0,
  roughness: 0.8,
});

export function cloneStairWithMaterial(source: THREE.Object3D): THREE.Object3D {
  const clone = source.clone(true);

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = stairMaterial;
  });

  return clone;
}
