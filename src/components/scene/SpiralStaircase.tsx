"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MODEL_PATHS } from "@/lib/models";
import {
  DOOR_POOL_SIZE,
  STAIR_POOL_SIZE,
  getDoorPlacement,
  getPlatformPlacement,
  getStairPlacement,
  isDoorStairIndex,
} from "@/lib/spiral";
import { assignDoorPoolSlots, assignPoolSlots } from "@/lib/spiralPool";
import { usePortfolioStore } from "@/lib/store";
import { PlatformLanding } from "./PlatformLanding";
import { ProjectDoor } from "./ProjectDoor";
import { StairSegment } from "./StairSegment";

export function SpiralStaircase() {
  const { scene: stairScene } = useGLTF(MODEL_PATHS.stair);
  const { scene: platformScene } = useGLTF(MODEL_PATHS.platform);

  const stairGroups = useRef<(THREE.Group | null)[]>([]);
  const platformGroups = useRef<(THREE.Group | null)[]>([]);
  const doorRootGroups = useRef<(THREE.Group | null)[]>([]);
  const lastDoorPoolIndices = useRef<number[]>([]);

  const stairObjects = useMemo(
    () =>
      Array.from({ length: STAIR_POOL_SIZE }, () => stairScene.clone(true)),
    [stairScene],
  );

  const platformObjects = useMemo(
    () =>
      Array.from({ length: DOOR_POOL_SIZE }, () => platformScene.clone(true)),
    [platformScene],
  );

  useFrame(() => {
    const virtualIndex = usePortfolioStore.getState().virtualStairIndex;
    const stairSlots = assignPoolSlots(virtualIndex, STAIR_POOL_SIZE);

    stairSlots.forEach(({ poolId, virtualIndex: vi }) => {
      const group = stairGroups.current[poolId];
      if (!group) return;
      const placement = getStairPlacement(vi);
      group.position.set(...placement.position);
      group.rotation.set(...placement.rotation);
    });

    const doorSlots = assignDoorPoolSlots(
      virtualIndex,
      DOOR_POOL_SIZE,
      isDoorStairIndex,
    );

    const poolIndices: number[] = [];

    doorSlots.forEach((slot, poolId) => {
      const platformGroup = platformGroups.current[poolId];
      const doorRoot = doorRootGroups.current[poolId];
      if (!platformGroup || !doorRoot) return;

      if (!slot) {
        platformGroup.visible = false;
        doorRoot.visible = false;
        poolIndices[poolId] = -1;
        return;
      }

      const vi = slot.virtualIndex;
      poolIndices[poolId] = vi;
      platformGroup.visible = true;
      doorRoot.visible = true;

      const platformPlacement = getPlatformPlacement(vi);
      platformGroup.position.set(...platformPlacement.position);
      platformGroup.rotation.set(...platformPlacement.rotation);

      const doorPlacement = getDoorPlacement(vi);
      doorRoot.position.set(...doorPlacement.position);
      doorRoot.rotation.set(...doorPlacement.rotation);
    });

    const prev = lastDoorPoolIndices.current;
    const changed =
      poolIndices.length !== prev.length ||
      poolIndices.some((v, i) => v !== prev[i]);
    if (changed) {
      lastDoorPoolIndices.current = [...poolIndices];
      usePortfolioStore.getState().setDoorPoolVirtualIndices(poolIndices);
    }
  });

  return (
    <group>
      {stairObjects.map((object, poolId) => (
        <group
          key={`stair-pool-${poolId}`}
          ref={(el) => {
            stairGroups.current[poolId] = el;
          }}
        >
          <StairSegment object={object} />
        </group>
      ))}

      {platformObjects.map((platformObject, poolId) => (
        <group key={`door-pool-${poolId}`}>
          <group
            ref={(el) => {
              platformGroups.current[poolId] = el;
            }}
            visible={false}
          >
            <PlatformLanding object={platformObject} />
          </group>
          <group
            ref={(el) => {
              doorRootGroups.current[poolId] = el;
            }}
            visible={false}
          >
            <ProjectDoor poolId={poolId} />
          </group>
        </group>
      ))}
    </group>
  );
}

useGLTF.preload(MODEL_PATHS.stair);
useGLTF.preload(MODEL_PATHS.platform);
