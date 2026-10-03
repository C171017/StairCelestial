import * as THREE from "three";

/** A local reflection map gives the control bright studio panels without
 * changing the lighting of the ribbon and project objects. */
export function createControlReflections() {
  const width = 256, height = 128;
  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = y / height;
    for (let x = 0; x < width; x++) {
      const longitude = x / width;
      const panel = Math.exp(-Math.pow((longitude - 0.18) / 0.055, 2))
        + Math.exp(-Math.pow((longitude - 0.7) / 0.035, 2));
      const overhead = Math.exp(-Math.pow((latitude - 0.78) / 0.1, 2));
      const light = 0.12 + 5 * panel * Math.exp(-Math.pow((latitude - 0.52) / 0.3, 4)) + 3 * overhead;
      const i = (y * width + x) * 4;
      pixels[i] = light; pixels[i + 1] = light; pixels[i + 2] = light * 1.04; pixels[i + 3] = 1;
    }
  }
  const map = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.needsUpdate = true;
  return map;
}

