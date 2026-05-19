"use client";

import type { Object3D } from "three";

type StairSegmentProps = {
  object: Object3D;
};

export function StairSegment({ object }: StairSegmentProps) {
  return <primitive object={object} castShadow receiveShadow />;
}
