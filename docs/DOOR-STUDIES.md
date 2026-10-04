# Six possible passages

October 2, 2026. Original shape studies for the Sanctuary cloud-and-glass space.

The current direction uses mirrors as a form metaphor: irregular frames holding semitransparent colored glass slabs. There are no pulls, hinges, or folding motions; selection dissolves the slab in place. All six are modeled in Blender, placed on the homepage ribbon, and presented together at `/door-studies`. They are proposals for selection, not a final choice of six project doors.

## Forms

1. **Melt** — an asymmetric, softened arch with a wavering upright and gently pooled base. Pearl ivory ceramic.
2. **Seed** — a leaning almond, narrowing toward a high off-center tip. Soft sage ceramic.
3. **Fault** — a cut, angular shard with opposed notches and a slanted crown. Ice-blue ceramic.
4. **Hourglass** — an exaggerated pinched waist joining two unequal rounded lobes. Shell blush ceramic.
5. **Cloud** — a broad, scalloped contour that wanders around a roughly enclosed passage. Vanilla cream ceramic.
6. **Orbit** — one complete, continuous oval surround around a colored slab, with no detached outer arc or frame gaps. Mist lavender ceramic.

Each consists of a stationary glazed ceramic surround, champagne-gold inner lining, warm light strips on both frame faces, colored glass slab, and polished edge. `src/lib/doorPalette.json` supplies one coherent palette to both the Blender builder and Three.js. The source retains editable contours and bevel modifiers. The runtime shares GLB geometry while owning materials per instance so entrance, dimming, and slab dissolution stay independent. The stationary trim remains visible when the slab disappears. A single cloud/studio environment capture supplies view-dependent reflections; the emissive strips do not simulate bounced illumination or caustics.

## Reference directions

- [Nendo / WonderGlass, Melt (2019)](https://www.nendo.jp/en/works/melt_wg/) — glass shaped by viscosity and gravity; a reference for softened edges and the feeling of a rigid material becoming pliant.
- [Tony Cragg, Listeners (2015)](https://www.tony-cragg.com/works/sculptures/2010-2019/listeners-1.html) — glass sculpture; a material and organic-volume reference.
- [Olafur Eliasson, Inhale, exhale (2018)](https://olafureliasson.net/artwork/inhale-exhale-2018) — overlapping transparent color; a reference for subtle material layering and perception.

These inform material and spatial ideas. The six silhouettes are original proposals, not reproductions of the referenced artworks.

## Reviewing

The comparison room starts with visible slabs so silhouettes can be compared. Select a number or a door to isolate it; All six or Escape returns to the collection. Click the isolated slab to toggle its dissolve. The Present/Absent slider and turn slider work on the whole collection or the isolated model. Reduced-motion preference removes the comparison's interpolation. No choice is saved as the final design.

The homepage remains text-free and retains selection, project navigation, infinite ribbon motion, and its entrance. Selecting a door brings its face toward the fixed camera, dissolves the slab, and reveals the original 3D project sculpture behind it. Close, Escape, or scroll hides that sculpture again and restores the overview. Shape identity has a permanent project/link/sculpture assignment: Melt and Cloud lead to Music, Seed and Orbit to JazzTree, Fault to Guanchang, and Hourglass to Columbia-Barnard Network. All original project sculptures and Blender scenes remain available.

## Hardware and arrangement refinement

The owner requested removal of all exposed hinges and regular placement. All hinge barrels, mounting arms, straps, and Orbit axle/spine meshes are removed from both GLBs and Blender source. The ribbon uses stable randomized spacing, lateral placement, size, and facing direction for every occurrence. The comparison room and Blender studio use an asymmetric arrangement with different depths and orientations. The later mirror refinement also removes the pulls and hidden hinge pivots from the source and GLBs; only dissolve behavior remains.

The homepage also draws door shapes independently in random order, including repeats and clusters. Each visit gets a new arrangement seed with wider spacing, lateral, and size variation; scroll reversal and focus preserve that visit's existing doors. Project assignments depend on shape identity alone.

The two cylindrical support feet beneath every door are also removed from all six GLBs, the editable Blender source, and the reproducible builder.
