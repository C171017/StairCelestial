import type { Object3D, Texture } from "three";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
} from "three";

const SATURN_BODY_RADIUS = 2.2575;
const saturnBodyGeometry = new SphereGeometry(
  SATURN_BODY_RADIUS,
  64,
  32,
);

function isRingMesh(mesh: Mesh): boolean {
  const name = mesh.name.toLowerCase();
  return name.includes("planet_ring") || name.endsWith("_ring");
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
      // The authored ring is an elliptical image on an XZ plane. Face that
      // plane toward the camera-relative planet rig and restore its intended
      // ellipse after the 4:1 image is mapped onto the square GLB plane.
      child.rotation.set(Math.PI / 2, 0, 0);
      child.scale.set(1, 1, 0.72);
      const ringMaterial = new MeshBasicMaterial({
        map: textures.ringColor,
        alphaMap: textures.ringAlpha,
        transparent: true,
        opacity: 0.9,
        side: DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      ringMaterial.fog = false;
      child.material = ringMaterial;
      return;
    }

    child.geometry = saturnBodyGeometry;
    const bodyMaterial = new MeshStandardMaterial({
      map: textures.body,
      metalness: 0,
      roughness: 0.94,
      emissive: new Color("#6b4f39"),
      emissiveMap: textures.body,
      emissiveIntensity: 0.2,
    });
    bodyMaterial.fog = false;
    child.material = bodyMaterial;
  });
}
