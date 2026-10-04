import assert from "node:assert/strict";
import { test } from "node:test";
import { doorPlacement, doorShapeIndex, MIN_DOOR_TURN_GAP } from "./doorPlacement";
import { doorStudies } from "./doorStudies";
import { projectIndexForDoor, sanctuaryProjects } from "./sanctuaryContent";
import { ribbonPoint, RIBBON_PITCH } from "./ribbonGeometry";

test("every sliding window contains all shapes before any repeat, across visits and cycle boundaries", () => {
  for (const count of [1, 2, 3, doorStudies.length]) {
    for (const seed of [0, 19, 81, 12345, 0xffffffff]) {
      for (const start of [-30000, -150, 0, 30000]) {
        const sequence = Array.from({ length: 150 }, (_, i) => doorShapeIndex(start + i, count, seed));
        assert.ok(sequence.every(shape => shape >= 0 && shape < count));
        for (let i = 0; i <= sequence.length - count; i++) {
          assert.equal(new Set(sequence.slice(i, i + count)).size, count);
          if (i >= count) assert.equal(sequence[i], sequence[i - count]);
        }
      }
    }
  }
});

test("fixed shape order retains irregular gaps, including between repetitions of a shape", () => {
  for (const seed of [0, 19, 81, 0xffffffff]) {
    const placements = Array.from({ length: 120 }, (_, i) => doorPlacement(i - 60, seed));
    const gaps = placements.slice(1).map((p, i) => p.turn - placements[i].turn);
    assert.ok(Math.max(...gaps) - Math.min(...gaps) > 0.06);
    // Six shapes at three doors per turn keeps matching silhouettes nearly
    // two full turns apart, while the spatial arrangement does not loop.
    for (let i = doorStudies.length; i < placements.length; i++) {
      assert.ok(placements[i].turn - placements[i - doorStudies.length].turn > 1.94);
      assert.notEqual(placements[i].lateral, placements[i - doorStudies.length].lateral);
    }
  }
});

test("doors maintain minimum spacing on desktop and compact ribbons", () => {
  for (const seed of [0, 13, 731, 12345, 0xffffffff]) {
    for (const [radius, width] of [[5.7, 2.25], [2.6, 1.45]]) {
      for (const start of [-30000, -150, 0, 30000]) {
        const placements = Array.from({ length: 150 }, (_, i) => doorPlacement(start + i, seed));
        const points = placements.map(p => ribbonPoint(p.turn, radius + p.lateral * width));
        for (let i = 0; i < points.length; i++) {
          if (i > 0) assert.ok(placements[i].turn - placements[i - 1].turn >= MIN_DOOR_TURN_GAP - 1e-10);
          // Check every pair, including doors on neighboring turns.
          for (let j = 0; j < i; j++) assert.ok(points[i].distanceTo(points[j]) >= 4);
        }
      }
    }
  }
});

test("neighbor exclusion works with small shape collections and negative occurrences", () => {
  for (const count of [1, 2, 3, 6]) {
    for (const seed of [0, 19, 81]) {
      for (let occurrence = -100; occurrence < 100; occurrence++) {
        const shape = doorShapeIndex(occurrence, count, seed);
        assert.ok(shape >= 0 && shape < count);
        if (count > 1) assert.notEqual(shape, doorShapeIndex(occurrence + 1, count, seed));
      }
    }
  }
});

test("new visit seeds change order and placement, while revisiting an occurrence restores it", () => {
  const occurrences = Array.from({ length: 120 }, (_, i) => i - 60);
  const first = occurrences.map(i => ({ placement: doorPlacement(i, 19), shape: doorShapeIndex(i, 6, 19) }));
  const second = occurrences.map(i => ({ placement: doorPlacement(i, 81), shape: doorShapeIndex(i, 6, 81) }));
  assert.ok(first.some((door, i) => door.shape !== second[i].shape));
  assert.ok(first.every((door, i) => door.placement.yaw !== second[i].placement.yaw));
  for (let i = occurrences.length - 1; i >= 0; i--) {
    assert.deepEqual(doorPlacement(occurrences[i], 19), first[i].placement);
    assert.equal(doorShapeIndex(occurrences[i], 6, 19), first[i].shape);
  }
});

test("random shapes and placements survive pool recycling in both scroll directions", () => {
  for (const seed of [13, 731, 0xffffffff]) {
    for (const cycle of [-10000, -1, 0, 1, 10000]) {
      for (const direction of [-1, 1]) {
        for (let slot = -3; slot < 6; slot++) {
          const occurrence = slot + cycle * 3;
          const nextCycle = cycle + direction;
          const nextOccurrence = slot - direction * 3 + nextCycle * 3;
          assert.equal(doorShapeIndex(occurrence, 6, seed), doorShapeIndex(nextOccurrence, 6, seed));
          const placement = doorPlacement(occurrence, seed);
          const old = ribbonPoint(placement.turn - cycle, 5.7 + placement.lateral * 2.25);
          const next = ribbonPoint(doorPlacement(nextOccurrence, seed).turn - nextCycle, 5.7 + placement.lateral * 2.25);
          old.y += cycle * RIBBON_PITCH;
          next.y += nextCycle * RIBBON_PITCH;
          assert.ok(old.distanceTo(next) < 1e-8);
        }
      }
    }
  }
});

test("each shape always resolves to the same project, link, and sculpture across visits and occurrences", () => {
  const expected = {
    melt: ["music", "https://music.c171017.com", "music"],
    seed: ["jazztree", "https://jazztree.c171017.com", "jazz"],
    fault: ["guanchang", "https://guanchang.me", "atlas"],
    hourglass: ["columbia-network", "https://c171017.github.io/Social-Network-Columbia-Barnard/", "network"],
    cloud: ["music", "https://music.c171017.com", "music"],
    orbit: ["jazztree", "https://jazztree.c171017.com", "jazz"],
  };
  for (const seed of [19, 81, 999]) {
    for (let occurrence = -100; occurrence < 100; occurrence++) {
      const shape = doorStudies[doorShapeIndex(occurrence, doorStudies.length, seed)];
      const project = sanctuaryProjects[projectIndexForDoor(shape.id)];
      assert.deepEqual([project.id, project.url, project.model], expected[shape.id]);
    }
  }
});
