export const CLOUD_FIELD_SIZE = 1680;
export const CLOUD_WIND = { x: 2.8, z: 0.65 };

export function wrapCloudCoordinate(value: number, size = CLOUD_FIELD_SIZE) {
  return ((value + size / 2) % size + size) % size - size / 2;
}

export function cloudVisibility(distance: number) {
  const smooth = (a: number, b: number) => {
    const t = Math.max(0, Math.min(1, (distance - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // Recycling happens outside the visible annulus, in every viewing direction.
  return smooth(100, 185) * (1 - smooth(660, 810));
}

export function cloudHash(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function cloudPosition(x: number, z: number, seconds: number, speed = 1) {
  return {
    x: wrapCloudCoordinate(x + CLOUD_WIND.x * seconds * speed),
    z: wrapCloudCoordinate(z + CLOUD_WIND.z * seconds * speed),
  };
}
