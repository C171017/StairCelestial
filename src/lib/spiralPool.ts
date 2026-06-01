export type PoolSlotAssignment = {
  poolId: number;
  virtualIndex: number;
};

/** Prefer incumbent door slot until a candidate is this much closer (steps). */
const DOOR_SLOT_HYSTERESIS_STEPS = 1.5;

export function computeVisibleRange(
  virtualIndex: number,
  poolSize: number,
): [number, number] {
  const centerIndex = Math.floor(virtualIndex);
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
  previous: DoorPoolSlot[] | null = null,
): DoorPoolSlot[] {
  const center = Math.floor(virtualIndex);
  const candidates: number[] = [];

  for (let i = center - searchRadius; i <= center + searchRadius; i++) {
    if (isDoor(i)) candidates.push(i);
  }

  candidates.sort(
    (a, b) => Math.abs(a - center) - Math.abs(b - center),
  );

  const proposed = Array.from({ length: poolSize }, (_, poolId) => {
    const index = candidates[poolId];
    if (index === undefined) return null;
    return { poolId, virtualIndex: index };
  });

  if (!previous || previous.length !== poolSize) {
    return proposed;
  }

  const assigned: DoorPoolSlot[] = Array.from(
    { length: poolSize },
    () => null,
  );
  const usedIndices = new Set<number>();
  const candidateSet = new Set(candidates);

  proposed.forEach((newSlot, poolId) => {
    const prevSlot = previous[poolId];
    if (!prevSlot || usedIndices.has(prevSlot.virtualIndex)) return;
    if (!candidateSet.has(prevSlot.virtualIndex)) return;

    const oldIdx = prevSlot.virtualIndex;
    const dOld = Math.abs(oldIdx - center);
    const dNew = newSlot
      ? Math.abs(newSlot.virtualIndex - center)
      : Number.POSITIVE_INFINITY;
    if (dNew + DOOR_SLOT_HYSTERESIS_STEPS < dOld) return;

    assigned[poolId] = { poolId, virtualIndex: oldIdx };
    usedIndices.add(oldIdx);
  });

  let candidateCursor = 0;
  return assigned.map((slot, poolId) => {
    if (slot) return slot;

    while (
      candidateCursor < candidates.length &&
      usedIndices.has(candidates[candidateCursor])
    ) {
      candidateCursor += 1;
    }

    const index = candidates[candidateCursor];
    if (index === undefined) return null;

    candidateCursor += 1;
    usedIndices.add(index);
    return { poolId, virtualIndex: index };
  });
}
