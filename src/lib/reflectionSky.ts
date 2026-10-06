import * as THREE from "three";

export type ReflectionSkySnapshot = {
  root: THREE.Object3D;
  pairs: { source: THREE.Object3D; copy: THREE.Object3D }[];
  copies: Map<THREE.Object3D, THREE.Object3D>;
};

/** Borrow sky geometry/materials while keeping its capture hierarchy independent. */
export function syncReflectionSky(source: THREE.Object3D, previous: ReflectionSkySnapshot | null): ReflectionSkySnapshot {
  const matches = previous?.pairs.every(({ source: original, copy }) =>
    original.children.length === copy.children.length &&
    original.children.every((child, index) => previous.copies.get(child) === copy.children[index]),
  ) && previous.pairs[0]?.source === source;
  let snapshot = previous;
  if (!matches || !snapshot) {
    const root = source.clone(true);
    const pairs: ReflectionSkySnapshot["pairs"] = [];
    const copies = new Map<THREE.Object3D, THREE.Object3D>();
    const pairChildren = (original: THREE.Object3D, copy: THREE.Object3D) => {
      pairs.push({ source: original, copy });
      copies.set(original, copy);
      original.children.forEach((child, index) => pairChildren(child, copy.children[index]));
    };
    pairChildren(source, root);
    snapshot = { root, pairs, copies };
  }
  for (const { source: original, copy } of snapshot.pairs) {
    copy.position.copy(original.position);
    copy.quaternion.copy(original.quaternion);
    copy.scale.copy(original.scale);
    copy.matrix.copy(original.matrix);
    copy.matrixAutoUpdate = original.matrixAutoUpdate;
    copy.visible = original.name === "sky-effects" ? false : original.visible;
    copy.renderOrder = original.renderOrder;
    if (original instanceof THREE.Mesh && copy instanceof THREE.Mesh) {
      copy.geometry = original.geometry;
      copy.material = original.material;
    }
  }
  return snapshot;
}
