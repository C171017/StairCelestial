import * as THREE from "three";

export function cloneSkinnedScene(source: THREE.Object3D): THREE.Group {
  const root = new THREE.Group();
  source.updateMatrixWorld(true);

  source.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const clone = mesh.clone();
    clone.geometry = mesh.geometry;
    clone.material = mesh.material;
    clone.position.copy(mesh.position);
    clone.quaternion.copy(mesh.quaternion);
    clone.scale.copy(mesh.scale);
    clone.name = mesh.name;
    root.add(clone);
  });

  return root;
}

export function findChildByNamePart(
  root: THREE.Object3D,
  namePart: string,
): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((child) => {
    if (!found && child.name.toLowerCase().includes(namePart.toLowerCase())) {
      found = child;
    }
  });
  return found;
}
