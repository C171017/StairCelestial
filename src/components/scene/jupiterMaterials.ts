import * as THREE from "three";

const BAND_TEXTURE_WIDTH = 4;
const BAND_TEXTURE_HEIGHT = 128;

function createJupiterBandTexture(): THREE.DataTexture {
  const data = new Uint8Array(
    BAND_TEXTURE_WIDTH * BAND_TEXTURE_HEIGHT * 4,
  );
  const coolDark = [148, 128, 104];
  const warmLight = [211, 193, 161];
  const equatorialOchre = [176, 139, 104];

  for (let y = 0; y < BAND_TEXTURE_HEIGHT; y += 1) {
    const v = y / (BAND_TEXTURE_HEIGHT - 1);
    const broadWave =
      0.5 +
      0.5 * Math.sin(v * Math.PI * 12 + Math.sin(v * Math.PI * 4) * 0.65);
    const quietSecondary = 0.5 + 0.5 * Math.sin(v * Math.PI * 28 + 0.8);
    const bandMix = THREE.MathUtils.clamp(
      0.18 + broadWave * 0.64 + (quietSecondary - 0.5) * 0.08,
      0,
      1,
    );
    const equatorialWarmth =
      Math.exp(-Math.pow((v - 0.54) / 0.075, 2)) * 0.22;

    const color = coolDark.map((channel, index) => {
      const banded = THREE.MathUtils.lerp(
        channel,
        warmLight[index],
        bandMix,
      );
      return Math.round(
        THREE.MathUtils.lerp(
          banded,
          equatorialOchre[index],
          equatorialWarmth,
        ),
      );
    });

    for (let x = 0; x < BAND_TEXTURE_WIDTH; x += 1) {
      const offset = (y * BAND_TEXTURE_WIDTH + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    BAND_TEXTURE_WIDTH,
    BAND_TEXTURE_HEIGHT,
    THREE.RGBAFormat,
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const jupiterBandTexture = createJupiterBandTexture();

const jupiterMaterial = new THREE.MeshStandardMaterial({
  name: "mat_jupiter_quiet_bands",
  color: "#ffffff",
  map: jupiterBandTexture,
  metalness: 0,
  roughness: 1,
  emissive: "#80664c",
  emissiveMap: jupiterBandTexture,
  emissiveIntensity: 0.28,
  fog: false,
});

export function applyJupiterMaterials(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = jupiterMaterial;
  });
}
