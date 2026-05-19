import type { Object3D, Texture } from "three";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";

function isRingMesh(mesh: Mesh): boolean {
  const name = mesh.name.toLowerCase();
  return name.includes("ring");
}

export type SaturnTextureSet = {
  body: Texture;
  ringColor: Texture;
  ringAlpha: Texture;
};

export function applySaturnMaterials(
  root: Object3D,
  textures: SaturnTextureSet,
): void {
  textures.body.colorSpace = SRGBColorSpace;
  textures.ringColor.colorSpace = SRGBColorSpace;

  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;

    if (isRingMesh(child)) {
      const ringMaterial = new MeshStandardMaterial({
        map: textures.ringColor,
        alphaMap: textures.ringAlpha,
        transparent: true,
        opacity: 0.95,
        metalness: 0,
        roughness: 0.7,
        side: DoubleSide,
        depthWrite: false,
        emissive: new Color("#2a2418"),
        emissiveIntensity: 0.2,
      });
      ringMaterial.fog = false;
      child.material = ringMaterial;
      return;
    }

    const bodyMaterial = new MeshBasicMaterial({
      map: textures.body,
      fog: false,
    });
    child.material = bodyMaterial;
  });
}
