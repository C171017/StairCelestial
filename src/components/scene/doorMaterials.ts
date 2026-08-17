import * as THREE from "three";

const doorFrameMaterial = new THREE.MeshStandardMaterial({
  name: "mat_door_graphite_refined",
  color: "#171a1d",
  metalness: 0.06,
  roughness: 0.84,
});

const doorPanelMaterial = new THREE.MeshStandardMaterial({
  name: "mat_door_panel_deep_graphite",
  color: "#0c0f11",
  metalness: 0.04,
  roughness: 0.88,
});

const doorBorderMaterial = new THREE.MeshStandardMaterial({
  name: "mat_door_cyan_border",
  color: "#29484f",
  emissive: "#bcefff",
  emissiveIntensity: 1.4,
  metalness: 0,
  roughness: 0.48,
});

const doorHandleMaterial = new THREE.MeshStandardMaterial({
  name: "mat_door_cyan_handle",
  color: "#3c555c",
  emissive: "#bcefff",
  emissiveIntensity: 0.7,
  metalness: 0,
  roughness: 0.52,
});

/** Apply one restrained material system to every pooled project-door clone. */
export function cloneDoorWithMaterials(source: THREE.Object3D): THREE.Object3D {
  const clone = source.clone(true);

  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const name = child.name.toLowerCase();
    if (name.includes("emissive_strip")) {
      child.material = doorBorderMaterial;
    } else if (name.includes("handle")) {
      child.material = doorHandleMaterial;
    } else if (name.includes("panel")) {
      child.material = doorPanelMaterial;
    } else if (name.includes("frame")) {
      child.material = doorFrameMaterial;
    }
  });

  return clone;
}
