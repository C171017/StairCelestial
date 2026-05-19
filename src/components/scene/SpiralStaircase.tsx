"use client";

import {
  PLATFORM_STAIR_INDICES,
  STAIR_COUNT,
  getDoorPlacement,
  getPlatformPlacement,
  getStairPlacement,
} from "@/lib/spiral";
import { PlatformLanding } from "./PlatformLanding";
import { ProjectDoor } from "./ProjectDoor";
import { StairSegment } from "./StairSegment";

export function SpiralStaircase() {
  const stairs = Array.from({ length: STAIR_COUNT }, (_, index) => {
    const placement = getStairPlacement(index);
    return (
      <StairSegment
        key={`stair-${index}`}
        position={placement.position}
        rotation={placement.rotation}
      />
    );
  });

  const platforms = PLATFORM_STAIR_INDICES.map((stairIndex, doorIndex) => {
    const platformPlacement = getPlatformPlacement(stairIndex);
    const doorPlacement = getDoorPlacement(stairIndex);
    return (
      <group key={`platform-door-${doorIndex}`}>
        <PlatformLanding
          position={platformPlacement.position}
          rotation={platformPlacement.rotation}
        />
        <ProjectDoor
          doorIndex={doorIndex}
          position={doorPlacement.position}
          rotation={doorPlacement.rotation}
        />
      </group>
    );
  });

  return (
    <group>
      {stairs}
      {platforms}
    </group>
  );
}
