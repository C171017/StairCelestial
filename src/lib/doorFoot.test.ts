import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { doorStudies } from "./doorStudies";
import { doorPlacement } from "./doorPlacement";
import { doorBaseWorldPoint, fitDoorSupport, getDoorBase, ribbonSurfaceHeight } from "./doorSupport";
import { createDoorFootGeometry } from "./doorFoot";

test("every fitted frame fillet follows the receiver curve across both sizes and pool recycling", async () => {
  for (const study of doorStudies) {
    const bytes = await readFile(new URL(`../../public/models/doors/${study.id}.glb`, import.meta.url));
    const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
    const base = getDoorBase(scene);
    for (const compact of [false, true]) {
      const placement = doorPlacement(-7, 731);
      const radius = compact ? 2.6 : 5.7, width = compact ? 1.45 : 2.25;
      const support = fitDoorSupport(placement, base, radius, width, compact);
      const recycled = fitDoorSupport({ ...placement, turn: placement.turn + 1 }, base, radius, width, compact);
      const geometry = createDoorFootGeometry(scene, support);
      const next = createDoorFootGeometry(scene, recycled);
      const positions = geometry.getAttribute("position");
      const normals = geometry.getAttribute("normal");
      const nextPositions = next.getAttribute("position");
      for (let i = 0; i < support.perimeter.length; i++) {
        const world = doorBaseWorldPoint(support, new THREE.Vector2(positions.getX(i), positions.getZ(i)));
        const y = support.position.y + (positions.getY(i) - 0.002) * support.scale;
        assert.ok(Math.abs(y - ribbonSurfaceHeight(world.x, world.z, support.turn)) < 1e-6, `${study.id} contact follows ribbon`);
      }
      for (let i = 0; i < positions.array.length; i++) {
        assert.ok(Number.isFinite(positions.array[i]) && Number.isFinite(normals.array[i]), "finite closed geometry");
        assert.ok(Math.abs(positions.array[i] - nextPositions.array[i]) < 1e-5, "fillet remains unchanged when pool recycles");
      }
      geometry.dispose(); next.dispose();
    }
  }
});
