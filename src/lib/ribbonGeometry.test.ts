import assert from "node:assert/strict";
import { test } from "node:test";
import { createRibbonGeometry, createRibbonSections } from "./ribbonGeometry";

test("glass sections preserve the complete ribbon without visible seams", () => {
  const source = createRibbonGeometry(5.7, 2.25);
  const sections = createRibbonSections(5.7, 2.25);
  assert.equal(sections.reduce((sum, section) => sum + section.getIndex()!.count, 0), source.getIndex()!.count);
  sections.forEach((section, index) => {
    // Small independent sort bounds prevent the entire six-turn ribbon from
    // jumping across a pane when the helix's center passes it or wraps.
    assert.ok(section.boundingSphere!.radius < 2.5);
    if (index === 0) return;
    for (const name of ["position", "normal", "uv"]) {
      const previous = sections[index - 1].getAttribute(name);
      const current = section.getAttribute(name);
      const ringSize = 20 * current.itemSize;
      assert.deepEqual(Array.from(previous.array.slice(-ringSize)), Array.from(current.array.slice(0, ringSize)));
    }
  });
  source.dispose();
  sections.forEach(section => section.dispose());
});
