import type { Object3D, Texture } from "three";
import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshStandardMaterial,
  RingGeometry,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
} from "three";

// Shared geometry, proportions, and textures for every screen size.
export const SATURN_BODY_RADIUS = 0.96;
const RING_INNER_RADIUS = SATURN_BODY_RADIUS * 1.35;
const RING_OUTER_RADIUS = SATURN_BODY_RADIUS * 2.25;
const saturnBodyGeometry = new SphereGeometry(SATURN_BODY_RADIUS, 64, 32);
const saturnRingGeometry = new RingGeometry(RING_INNER_RADIUS, RING_OUTER_RADIUS, 192);

// Map the texture across the ring's radius, so detail forms concentric bands
// rather than stretching a flat ellipse image across the geometry.
const positions = saturnRingGeometry.getAttribute("position");
const uv = saturnRingGeometry.getAttribute("uv");
for (let i = 0; i < positions.count; i++) {
  const radius = Math.hypot(positions.getX(i), positions.getY(i));
  uv.setXY(i, (radius - RING_INNER_RADIUS) / (RING_OUTER_RADIUS - RING_INNER_RADIUS), 0.5);
}

function smoothstep(start: number, end: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function createRingTexture(): DataTexture {
  const width = 1024;
  const data = new Uint8Array(width * 4);
  for (let i = 0; i < width; i++) {
    const r = i / (width - 1);
    // A faint inner veil, broad dusty middle, and one restrained division.
    const grain = 0.018 * Math.sin(r * 710) + 0.012 * Math.sin(r * 1291)
      + 0.014 * Math.sin(r * 237);
    const broadBands = 0.035 * Math.sin(r * 23) + 0.018 * Math.sin(r * 59);
    const denseBand = smoothstep(0.12, 0.32, r) * (1 - smoothstep(0.64, 0.75, r));
    const division = smoothstep(0.71, 0.725, r) * (1 - smoothstep(0.75, 0.765, r));
    const edges = smoothstep(0, 0.13, r) * (1 - smoothstep(0.91, 1, r));
    const brightness = 0.76 + denseBand * 0.1 + grain + broadBands - division * 0.16;
    data[i * 4] = Math.round(198 * brightness);
    data[i * 4 + 1] = Math.round(181 * brightness);
    data[i * 4 + 2] = Math.round(155 * brightness);
    data[i * 4 + 3] = Math.round(255 * edges * (0.48 + denseBand * 0.34 + grain - division * 0.32));
  }
  const texture = new DataTexture(data, width, 1, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const saturnRingTexture = createRingTexture();

function isRingMesh(mesh: Mesh): boolean {
  const name = mesh.name.toLowerCase();
  return name.includes("planet_ring") || name.endsWith("_ring");
}

export type SaturnTextureSet = { body: Texture };

export function applySaturnMaterials(root: Object3D, textures: SaturnTextureSet): void {
  textures.body.colorSpace = SRGBColorSpace;
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    // These cached geometries are shared, while each scene clone owns its materials.
    child.scale.set(1, 1, 1);
    if (isRingMesh(child)) {
      child.geometry = saturnRingGeometry;
      child.rotation.set(1.05, 0, 0);
      child.material = new MeshStandardMaterial({
        map: saturnRingTexture,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
        emissive: new Color("#b5a38c"),
        emissiveMap: saturnRingTexture,
        emissiveIntensity: 0.55,
        fog: false,
      });
      return;
    }
    child.geometry = saturnBodyGeometry;
    child.material = new MeshStandardMaterial({
      map: textures.body,
      metalness: 0,
      roughness: 0.94,
      emissive: new Color("#6b4f39"),
      emissiveMap: textures.body,
      emissiveIntensity: 0.2,
      fog: false,
    });
  });
}
