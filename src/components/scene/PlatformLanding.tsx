"use client";

import type { Object3D } from "three";

type PlatformLandingProps = {
  object: Object3D;
};

export function PlatformLanding({ object }: PlatformLandingProps) {
  return <primitive object={object} castShadow receiveShadow />;
}
