"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/** Bounded development measurements, exposed as inspectable canvas attributes. */
export function CrystalDiagnostics({ active }: { active: boolean }) {
  const { gl } = useThree();
  const samples = useRef<{ ms: number[]; calls: number[]; triangles: number[] }>({ ms: [], calls: [], triangles: [] });
  useEffect(() => {
    const previous = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = previous; };
  }, [gl]);
  useFrame((_, delta) => {
    if (active && !document.hidden && delta > 0 && delta < 0.25) {
      const sample = samples.current;
      sample.ms.push(delta * 1000);
      sample.calls.push(gl.info.render.calls);
      sample.triangles.push(gl.info.render.triangles);
      if (sample.ms.length === 300) {
        const sorted = [...sample.ms].sort((a, b) => a - b);
        const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
        gl.domElement.dataset.crystalMetrics = JSON.stringify({
          frames: 300, meanMs: mean(sample.ms), p95Ms: sorted[284], maxMs: sorted[299],
          meanDrawCalls: mean(sample.calls), meanTriangles: mean(sample.triangles),
          textures: gl.info.memory.textures, geometries: gl.info.memory.geometries,
          width: gl.domElement.width, height: gl.domElement.height, dpr: gl.getPixelRatio(),
        });
        samples.current = { ms: [], calls: [], triangles: [] };
      }
    }
    gl.info.reset();
  }, -3);
  return null;
}
