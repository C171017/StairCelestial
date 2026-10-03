import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { doorStudies } from "./doorStudies";
import { doorPlacement } from "./doorPlacement";
import { createDoorSill, fitDoorSupport, getDoorBase, ribbonSurfaceHeight, sillWorldPoint } from "./doorSupport";
import { RIBBON_PITCH } from "./ribbonGeometry";

const bases = Promise.all(doorStudies.map(async study => {
  const bytes = await readFile(new URL(`../../public/models/doors/${study.id}.glb`, import.meta.url));
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "");
  return getDoorBase(scene);
}));

test("every exported door sill and gold edge fit within both ribbon sizes across seeded placements", async () => {
  for (const base of await bases) {
    for (const compact of [false, true]) {
      const radius = compact ? 2.6 : 5.7, width = compact ? 1.45 : 2.25;
      for (const seed of [0, 731, 0xffffffff]) {
        for (let occurrence = -12; occurrence <= 12; occurrence++) {
          const support = fitDoorSupport(doorPlacement(occurrence, seed), base, radius, width, compact);
          const sill = createDoorSill(support);
          assert.ok(support.scale > 0.5, "fitting retains useful door size");
          for (const geometry of Object.values(sill)) {
            const vertices = geometry.getAttribute("position");
            for (let i = 0; i < vertices.count; i++) {
              const world = sillWorldPoint(support, new THREE.Vector2(vertices.getX(i), vertices.getZ(i)));
              const r = Math.hypot(world.x, world.z);
              assert.ok(r > radius - width / 2 + 0.09 && r < radius + width / 2 - 0.09, "sill stays inside the rounded ribbon edges");
            }
            geometry.dispose();
          }
        }
      }
    }
  }
});

test("sill underside meets the helix while its level top supports the frame above the slope", async () => {
  for (const base of await bases) {
    for (const compact of [false, true]) {
      const support = fitDoorSupport(doorPlacement(7, 731), base, compact ? 2.6 : 5.7, compact ? 1.45 : 2.25, compact);
      const sill = createDoorSill(support);
      const vertices = sill.ceramic.getAttribute("position");
      let lowerCount = 0;
      for (let i = 0; i < vertices.count; i++) {
        const world = sillWorldPoint(support, new THREE.Vector2(vertices.getX(i), vertices.getZ(i)));
        const surface = ribbonSurfaceHeight(world.x, world.z, support.turn);
        const height = support.position.y + vertices.getY(i) * support.scale;
        const top = support.position.y + base.bottom * support.scale;
        assert.ok(top - surface >= 0.02, "frame clears uphill side of ribbon");
        assert.ok(top - surface < 0.38, "sill remains a thin threshold");
        if (Math.abs(height - top) > 1e-6) {
          assert.ok(Math.abs(height - surface + 0.008) < 1e-6, "underside meets ribbon with a tiny embed");
          lowerCount++;
        }
      }
      assert.ok(lowerCount > 0);
      sill.ceramic.dispose(); sill.gold.dispose();
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
