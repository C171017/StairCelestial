import { CLOUD_FIELD_SIZE, cloudHash, cloudVisibility } from './cloudMotion';

type CloudPosition = Readonly<{ x: number; y: number; z: number }>;

export type CloudDefinition = CloudPosition & Readonly<{
  index: number;
  width: number;
  height: number;
  wisp: boolean;
  tile: number;
  opacity: number;
  haze: number;
  renderOrder: number;
}>;

/** A fixed painter order: distant layers first, with input index breaking ties. */
export function cloudLayerOrders(positions: readonly CloudPosition[]): number[] {
  const layers = positions.map((position, index) => ({
    index,
    radius: Math.hypot(position.x, position.y, position.z),
  }));
  layers.sort((a, b) => b.radius - a.radius || a.index - b.index);
  const orders = new Array<number>(positions.length);
  // Unique priorities prevent Three.js from falling back to camera-space depth.
  // Every cloud remains in front of the sky effects, whose order is -90.
  layers.forEach(({ index }, rank) => { orders[index] = -80 + rank / (layers.length + 1); });
  return orders;
}

/** Anchored banks and low-horizon cirrus, fixed for the scene's lifetime. */
export function createCloudField(): readonly CloudDefinition[] {
  const definitions = Array.from({ length: 80 }, (_, index) => {
    const wisp = index >= 64;
    const n = wisp ? index - 64 : index;
    const grid = wisp ? 4 : 8;
    const spacing = CLOUD_FIELD_SIZE / grid;
    const x = (n % grid + 0.5) * spacing - CLOUD_FIELD_SIZE / 2
      + (cloudHash(index + 70) - 0.5) * spacing * 0.5;
    const z = (Math.floor(n / grid) + 0.5) * spacing - CLOUD_FIELD_SIZE / 2
      + (cloudHash(index + 140) - 0.5) * spacing * 0.5;
    // The normal camera looks slightly down: an overhead cirrus layer misses
    // its clear upper sky. Keep the light wisps near the distant horizon so
    // their drift remains visible in the composed view around the full orbit.
    const y = wisp ? 40 + cloudHash(index + 17) * 50 : -120 - cloudHash(index + 17) * 55;
    const width = wisp ? 570 + cloudHash(index) * 180 : 300 + cloudHash(index) * 150;
    const distance = Math.hypot(x, z);
    return {
      index, x, y, z, width,
      height: wisp ? width * 0.42 : width * (0.5 + cloudHash(index + 123) * 0.18),
      wisp,
      tile: Math.floor(cloudHash(index + 99) * 4),
      opacity: cloudVisibility(distance) * (wisp ? distance < 500 ? 0.16 : 0.21 : 1),
      haze: Math.min(0.42, Math.max(0, (distance - 250) / 1400)),
    };
  });
  const orders = cloudLayerOrders(definitions);
  return Object.freeze(definitions.map((definition, index) => Object.freeze({
    ...definition, renderOrder: orders[index],
  })));
}
