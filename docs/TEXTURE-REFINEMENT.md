# Texture refinement and visual ceiling

October 5, 2026. Owner direction for the active Sanctuary experience.

The later [atmosphere implementation](validation/atmosphere/README.md) updates
metal reflection/roughness parameters, the control's lighting/compact staging,
and performance settings. It also records the owner's relaxed physical timing
requirement and final 7.8/10 score after the maximum three Astra High rounds.
The material-depth parameters immediately below describe the preceding pass;
the linked atmosphere record is authoritative for later refinements.

## Current refinement — daylight depth and metallic response

The owner rejected the first black/gold pass as too white in bright light and
still plastic-looking, and requested a premium material option for the central
control. [Current implementation and actual captures](validation/material-depth/README.md)
record the follow-up: larger neutral marble veins, daylight highlight headroom,
directional black-titanium reflections, and a beveled brushed-platinum control.
The control is an option for review; environment-matching/inverse colors remain
fallbacks. Glass, floating composition, interactions and prior assets remain.

Current marble: base `#eeeee9`, scale 0.045, contrast 1.65, relief 0.00022,
roughness 0.22, IOR 1.54, local environment strength 0.95. Frames: `#646970`,
roughness 0.22, metalness 1, anisotropy 0.55, local environment strength 1.0.
Gold retains its prior palette with anisotropy 0.35. Owned geometry tangents
support the anisotropic BRDF. The table below describes the superseded first
black/gold pass, not these current parameters.

## First black/gold implementation — historical

**Softly polished white marble spiral + deep dark black frames with restrained
gold accents. Removing the plastic appearance is the primary priority.**
The black/gold choice supersedes all earlier bronze frame proposals. The stair
choice is number 1 in the stair-only reflection ranking, not the complete
champagne-frame palette. See [MATERIAL-BUILD-HANDOFF.md](MATERIAL-BUILD-HANDOFF.md)
for implementation context, references, checks and tooling. This direction is
now implemented in the local homepage and shared door-study room. The earlier
ivory-frame trial and its captures remain below as labeled history.

The broad frame uses satin blackened metal with no stone texture or clearcoat.
Gold is confined to the existing recessed reveal. The white marble keeps its
original CC0 source maps with quieter veins, much shallower relief, and a
single polished dielectric response. Existing tinted glass, glass edges,
floating geometry, audio consent and interactions are retained.

| Surface | Current material | Surface variation | Local environment multiplier |
| --- | --- | --- | ---: |
| Ribbon | `#fcfbf8`; roughness 0.205; metalness 0; IOR 1.54; clearcoat 0 | Triplanar scale 0.16, contrast 0.85, relief 0.00022; roughness variation 0.065 | 1.15 |
| Outer frames | `#34363a`; metalness 1; roughness 0.34; no clearcoat | Filtered directional roughness, strength 0.018; no stone maps | 1.2 |
| Recessed reveals | `#bca477`; metalness 1; roughness 0.28 | Filtered directional roughness, strength 0.035 | 1.05 |

Marble shader roughness is `base + (map - 0.5) × 0.065`, clamped to
0.16–0.38 before Three's geometric roughness adjustment. Scale and relief are
renderer parameters, not physical measurement claims. Metal brushing is a
filtered roughness treatment, not a complete anisotropic reflection model;
the current frame/reveal meshes have no UVs or tangent attributes.

`applyFinishEnvironment` addresses Three r175's use of scene intensity in
place of material intensity when a material uses `scene.environment`. It
applies the table's local multiplier to the marble and metals' IBL shader
contributions while retaining the changing shared PMREM. The glass shader
keeps its existing response. No material is pinned to an obsolete capture.

The 512 cube/PMREM capture now includes a fifth, feathered rear reflection
card: 24 × 8, key azimuth + PI, height 9, radius 32, and day/dusk/night power
2.6/1.5/0.85. This broad sky bounce makes polish more legible on the ribbon's
top face without adding visible geometry or another shadow-casting light.
The existing cloud artwork, sky animation and time mapping are unchanged.

The marble's shared mutable Y offset still advances by `cycle × RIBBON_PITCH`
in a layout effect; section normals and material coordinates stay continuous
across recycling. Each door still owns its materials and shadow materials.
Opaque frame coverage fades and corresponding shadow coverage, glass dissolve,
and cached stone-texture ownership remain intact.

See [current validation and actual website screenshots](validation/black-gold-marble/README.md)
for the implemented result and completed checks. The reflections are shared
environment captures, not ray tracing, nearby-door reflections or colored
caustics. Generated studies below remain references, not evidence of the
implemented result. Device benchmarking and cloud/24-hour-world refinements
remain deferred.

## Design priorities

Build the strongest visual reference first. Performance optimization follows
after the owner accepts that ceiling; subsequent device tiers should document
which qualities they preserve and which they simplify. Historical M2/M4/mobile
budgets are not constraints on this art-direction pass. Continue to own and
dispose resources correctly and retain accessible/reduced-motion behavior.

Keep the floating ribbon, organic portal silhouettes, tinted cast glass,
restrained gold accents, and luminous cloud world. The material pass addresses
the earlier uniform ivory surfaces' molded-plastic appearance.

The owner's follow-up emphasizes restrained, high-end craftsmanship and a
design-award level of polish. Added texture is not itself the goal. Judge the
whole composition, edge quality, reflection shape, scale of detail, and lack of
visual defects. Avoid decorative excess, heavy cracks, noise, or grunge.

The earlier follow-up requested deliberately different spiral and frame finishes,
including warm frames with a white spiral or the reverse. Four ranked
[color/material pairings](../assets/design-directions/material-pairings/README.md)
are available as generated proposals. The owner then selected the bronze
frame family from option 3 and requested it slightly darker. A revised
generated preview records that intermediate direction. The final selection
above supersedes it. The white-marble and ivory-frame trial described below is
historical; the active frames are black metal.

## Historical first pass: ivory-frame materials — October 5, 2026

- Ribbon: pale honed marble, restrained warm-grey mineral veins, shallow
  surface relief, spatial variation in roughness, and a soft satin reflection.
  Veins suggest geological seams, not broken or damaged structural slabs.
- Frames: more finely scaled ivory stone with quieter veins and a smoother
  finish than the ribbon; preserve the crowned profiles and floating gaps.
- Recessed metal: brushed champagne with fine directional reflection variation.
- Glass: preserve the current colored cast-glass identity and polished edges.

Investigate existing openly licensed PBR assets before authoring new artwork.
The actual local renderer is the visual authority. A generated image is a
material-direction study, never proof that the website renders identically.
Use a current render as its reference, hold composition, camera, clouds,
geometry, and lighting fixed, and present actual browser evidence alongside it.

## Subsequent work, recorded rather than implemented in this pass

The owner's next brainstorming brief is now expanded in
[ATMOSPHERE-REFINEMENT.md](ATMOSPHERE-REFINEMENT.md). It distinguishes exact
distance/time proportionality from curved lighting responses, proposes
separate sunrise/sunset palettes, compares sun/moon paths, and schedules cloud
and celestial effects. Its recommendations remain unselected proposals.

1. **Cloud artwork and atmosphere.** More pixels alone do not establish better
   clouds. Trial a carefully prompted improvement to selected cloud banks:
   layered density, thin vapor, natural edge detail, coherent illumination,
   restrained contrast. Preserve the established composition and editable
   layers. The existing internal flow is a baseline for improving the illusion
   of moving clouds; avoid whole-background wobble or moving-card popping.
2. **Distance as time.** Equal vertical travel should represent equal elapsed
   world time. Define one continuous, reversible 24-hour coordinate, separate
   from the recycled mesh pool. Shadow direction, light intensity, sky color,
   reflections, and celestial visibility must agree with it. Review input
   normalization, acceleration/queue caps, and the relation of idle movement to
   time before claiming exact proportionality. The current baseline uses eight
   user-driven ribbon turns per day and excludes idle travel from its clock.
3. **Sun, moon, stars, and mood.** Introduce a legible celestial cycle and
   coordinate it with shadows and atmosphere. Circular/elliptical paths versus
   appearance/disappearance remain undecided. The owner's phrase about song
   and mood also leaves room for coordinated sound; selection and timing are
   deferred. Preserve current audio consent.
4. **Device tiers.** After the visual reference is accepted, compare each
   optimized tier with fixed reference views; measure real device behavior
   rather than assigning a speculative fidelity percentage.

## Tooling

The owner permits Blender and setup of Blender MCP if needed. This surface
pass can use the current web renderer and existing GLBs directly, so no Blender
connection is required. The built-in image generator does not expose a model
selector; a specific GPT Image 2.5 model cannot be verified from its interface.

## Historical implemented material trial — October 5, 2026

This section records the earlier ivory-frame trial, before the final black/gold
build above. Its parameters and frame texture usage are no longer current.

Selected [ambientCG Marble 021](https://ambientcg.com/view?id=Marble021), a CC0
procedural PBR material, after comparing its preview with Marble 012. The latter
was too densely mottled for this direction. The selected color, roughness and
height files are unchanged 4096-square JPEGs; [provenance and hashes](../public/textures/sanctuary/materials/SOURCES.md).

`mineralFinish.ts` uses object-space triplanar projection, so the existing
untextured GLBs need no new UV unwrap. Color, polish and shallow bump share
coordinates. The material stays fixed to the geometry while illumination
changes. A cycle offset preserves the ribbon's material coordinate through
mesh recycling; it is synchronized before the next paint. The maps are shared
through the loader cache, while each door still owns and disposes its materials.

| Surface | Finish | Texture scale | Vein contrast | Relief |
| --- | --- | ---: | ---: | ---: |
| Ribbon | Honed ivory marble, roughness 0.36, clearcoat 0.12 | 0.16 | 1.30 | 0.0012 |
| Frames | Quieter carved ivory stone, roughness 0.36, clearcoat 0.12 | 0.48 | 1.10 | 0.0006 |
| Insets | Champagne metal, roughness 0.29 | Directional procedural grain | — | — |

Scale and relief are shader/world-space parameters, not physical measurement
claims. Metal brush marks modulate roughness and filter out with distance;
this is an approximation of brushing, not a complete anisotropic metal model.
The first trial used stronger bump and was rejected as too grainy. The accepted
local trial has much shallower relief and larger, quieter ribbon veining.

The existing cast-glass material, silhouettes, floating gaps, lighting,
clouds, audio, and movement are retained. The homepage and `/door-studies`
share the updated frame finish. No Blender setup, cloud re-generation,
celestial path, or scroll-clock redesign was performed in this pass.

## Historical trial captures and generated study

- [Before](validation/texture-refinement/before.jpg) and
  [after daylight](validation/texture-refinement/after-day.jpg): same 903 × 1344
  viewport, review seed 8, still camera, initial daylight. The audio sculpture
  and cloud detail remain animated, so these are not identical-time frames.
- [Frame close-up](validation/texture-refinement/after-focus.jpg): selected
  Melt portal with its slab dissolved, revealing the existing music sculpture.
- [Night](validation/texture-refinement/after-night.jpg): existing atmosphere
  at travel 4; this capture is 1961 × 1344 after the browser panel widened.
- [Compact](validation/texture-refinement/after-compact.jpg): 430 × 932 browser
  viewport, fresh load, initial daylight. This is responsive browser evidence,
  not a physical-phone test.
- [Generated study](../assets/design-directions/texture-refinement/faithful-material-study.png)
  and [exact prompt](../assets/design-directions/texture-refinement/prompt.txt).
  The built-in generator used the after-day capture as its single image-edit
  reference. Output is 1028 × 1530. It preserves the broad composition but
  slightly strengthens veins, warmth and contrast and reinterprets cloud
  detail. The actual render remains authoritative; the study is not loaded
  into the website. A specific GPT Image 2.5 model was not exposed/verified.

## Historical trial validation — October 5, 2026

These results apply to the ivory-frame trial. Current material-build results
are recorded separately in [black/gold validation](validation/black-gold-marble/README.md).

- All 108 existing automated tests pass.
- TypeScript, ESLint, production build/static export, and whitespace checks pass.
- Browser WebGL compilation completed without reported errors or warnings.
- Checked fresh entrance, daylight, existing night, selected-door close-up,
  compact layout, and scroll response. Screenshots were captured directly from
  the browser; generated imagery is kept in a separate directory.
- No performance optimization or device benchmark was performed. The original
  source-quality maps are intentionally retained for this visual pass.

This was a first implemented material direction for owner review, not a claim
that the entire site's visual design is finished or beyond critique.
