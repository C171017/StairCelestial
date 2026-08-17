"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

export function Lights() {
  const rigRef = useRef<THREE.Group>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const keyTargetRef = useRef<THREE.Object3D>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const fillTargetRef = useRef<THREE.Object3D>(null);
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (keyRef.current && keyTargetRef.current) {
      keyRef.current.target = keyTargetRef.current;
    }
    if (fillRef.current && fillTargetRef.current) {
      fillRef.current.target = fillTargetRef.current;
    }
  }, []);

  useFrame(() => {
    const rig = rigRef.current;
    if (!rig) return;

    // Keep the light and its shadow volume beside the camera as it climbs.
    rig.position.y = camera.position.y;
  });

  return (
    <>
      <hemisphereLight
        intensity={0.11}
        color="#bdc9d9"
        groundColor="#080706"
      />
      <group ref={rigRef}>
        <directionalLight
          ref={keyRef}
          position={[14, 20, 10]}
          intensity={1.75}
          color="#f2e6d5"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={18}
          shadow-camera-bottom={-18}
          shadow-camera-near={1}
          shadow-camera-far={72}
          shadow-bias={-0.0003}
          shadow-normalBias={0.035}
          shadow-radius={3}
        />
        <object3D ref={keyTargetRef} position={[0, -1.5, 0]} />

        <directionalLight
          ref={fillRef}
          position={[-16, 7, -11]}
          intensity={0.16}
          color="#7f9fbe"
        />
        <object3D ref={fillTargetRef} position={[0, 0, 0]} />
      </group>
    </>
  );
}
