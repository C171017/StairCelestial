export type PoolSlotAssignment = {
  poolId: number;
  virtualIndex: number;
};

export function computeVisibleRange(
  virtualIndex: number,
  poolSize: number,
): [number, number] {
  const centerIndex = Math.round(virtualIndex);
  const half = Math.floor(poolSize / 2);
  const startIndex = centerIndex - half;
  const endIndex = startIndex + poolSize - 1;
  return [startIndex, endIndex];
}

export function assignPoolSlots(
  virtualIndex: number,
  poolSize: number,
): PoolSlotAssignment[] {
  const [startIndex] = computeVisibleRange(virtualIndex, poolSize);
  return Array.from({ length: poolSize }, (_, poolId) => ({
    poolId,
    virtualIndex: startIndex + poolId,
  }));
}

export type DoorPoolSlot = PoolSlotAssignment | null;

/** Nearest door stair indices around the camera, up to poolSize slots. */
export function assignDoorPoolSlots(
  virtualIndex: number,
  poolSize: number,
  isDoor: (index: number) => boolean,
  searchRadius = 24,
): DoorPoolSlot[] {
  const center = Math.round(virtualIndex);
  const candidates: number[] = [];

  for (let i = center - searchRadius; i <= center + searchRadius; i++) {
    if (i >= 0 && isDoor(i)) candidates.push(i);
  }

  candidates.sort(
    (a, b) => Math.abs(a - center) - Math.abs(b - center),
  );

  const picked = candidates.slice(0, poolSize);

  return Array.from({ length: poolSize }, (_, poolId) => {
    const index = picked[poolId];
    if (index === undefined) return null;
    return { poolId, virtualIndex: index };
  });
}
