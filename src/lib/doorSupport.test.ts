import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { doorStudies } from "./doorStudies";
import { doorPlacement } from "./doorPlacement";
import { fitDoorSupport, getDoorBase, ribbonSurfaceHeight, doorBaseWorldPoint } from "./doorSupport";
import { RIBBON_PITCH } from "./ribbonGeometry";

const bases = Promise.all(doorStudies.map(async study => {
  const bytes = await readFile(new URL(`../../public/models/doors/${study.id}.glb`, import.meta.url));
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  return getDoorBase(scene);
}));

test("every exported door base fits within both ribbon sizes across seeded placements", async () => {
  for (const base of await bases) {
    for (const compact of [false, true]) {
      const radius = compact ? 2.6 : 5.7, width = compact ? 1.45 : 2.25;
      for (const seed of [0, 731, 0xffffffff]) {
        for (let occurrence = -12; occurrence <= 12; occurrence++) {
          const support = fitDoorSupport(doorPlacement(occurrence, seed), base, radius, width, compact);
          assert.ok(support.scale > 0.5, "fitting retains useful door size");
          for (const point of support.perimeter) {
            const world = doorBaseWorldPoint(support, point);
            const r = Math.hypot(world.x, world.z);
            assert.ok(r > radius - width / 2 + 0.09 && r < radius + width / 2 - 0.09, "base stays inside the rounded ribbon edges");
          }
          const center = doorBaseWorldPoint(support, new THREE.Vector2((base.minX + base.maxX) / 2, 0));
          const bottom = support.position.y + base.bottom * support.scale;
          assert.ok(Math.abs(bottom - ribbonSurfaceHeight(center.x, center.z, support.turn)) < 1e-8, "base sits directly on the ribbon without the old sill clearance");
        }
      }
    }
  }
});

test("fitted doors preserve position, size, and facing across forward and reverse pool recycling", async () => {
  for (const base of await bases) {
    for (const direction of [-1, 1]) {
      const placement = doorPlacement(-29, 731);
      const a = fitDoorSupport(placement, base, 2.6, 1.45, true);
      const b = fitDoorSupport({ ...placement, turn: placement.turn - direction }, base, 2.6, 1.45, true);
      assert.ok(Math.abs(a.position.x - b.position.x) < 1e-10);
      assert.ok(Math.abs(a.position.z - b.position.z) < 1e-10);
      assert.ok(Math.abs(a.position.y - b.position.y - direction * RIBBON_PITCH) < 1e-10);
      assert.equal(a.scale, b.scale);
      assert.ok(Math.abs(Math.sin(a.yaw - b.yaw)) < 1e-10);
    }
  }
});
