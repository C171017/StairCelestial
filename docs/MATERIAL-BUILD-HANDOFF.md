# Material build handoff — current material refinement

October 5, 2026. Updated after the local black/gold and white-marble build.

**Current state:** the owner found the first black/gold pass still plastic-like
and the marble washed out in bright light. The follow-up adds larger neutral
veins and daylight headroom, anisotropic dark-titanium frames, and a beveled
brushed-platinum central control **for review**. See the
[latest parameters, screenshots and validation](validation/material-depth/README.md).
Matching or reversing the environment color is a fallback for the control,
not a decision to implement yet. Preserve this
checkout's uncommitted work and assets. See [current material parameters](TEXTURE-REFINEMENT.md)
and the latest validation link above. The original handoff and initial
black/gold build details below are historical context; their numeric material
parameters are superseded by the latest refinement.

## Owner's final decision

- **Spiral/stair: white marble with a soft polish**, restrained mineral veins,
  shallow surface detail, and broad moving highlights/soft sky reflections.
  “Use one” refers to the latest stair-only ranking: white marble, the stair
  family shared by palette options 1 and 3. It does NOT select the gold outer
  frames from palette option 1.
- **Frames: deep dark black with a little gold.** Black is the dominant outer
  frame color; gold is a restrained accent, naturally suited to the existing
  recessed inner reveal. This supersedes both brown bronze and the slightly
  darker bronze preview. Preserve the organic profiles the owner liked.
- **Primary priority: eliminate the plastic appearance.** Aim for believable,
  high-end craftsmanship through differentiated materials, shaped highlights,
  controlled polish, readable bevels, and subtle surface variation. More noise
  or uniformly higher gloss is not success.
- Establish the strongest visual reference before performance optimization.
  Later device tiers should preserve as much of that reference as practical.

Implementation interpretation, not an additional owner requirement: use
satin blackened metal for the broad frame, retaining subtle warm metallic
edge reflections and a small brushed-gold inner accent. Avoid flat featureless
black, glossy black plastic, bright gold framing, decorative gold veins, or
making the whole frame brown. The exact black metal/shader parameters are an
implementation choice to judge in the live scene. Keep dark forms readable at
night without making them emissive.

## Original handoff scope — historical

The owner originally asked a prior session to prepare documentation and a prompt,
before a new session performed the actual build. **No black-and-gold frame or
new polished-marble implementation was performed during handoff preparation.**
The subsequent build has now implemented those settled choices. Do not restart
palette selection or treat the original handoff state as the current renderer.

## Workspace and current state

- Repository: `/Users/c171017/Project/c171017.com`, current branch `main`.
- Local site was running at `http://127.0.0.1:3000/`; verify availability anew.
- There are uncommitted source/doc changes and untracked assets from this
  conversation. They are intentional work, not disposable files. Continue from
  this checkout; do not reset, clean, or replace it with a fresh checkout that
  omits them. Nothing was committed or deployed by this session.
- Current implementation: softly polished white-marble ribbon, deep-black
  satin metal outer frames, brushed-gold recessed reveals, and the existing
  tinted cast glass. The ivory-stone frame trial is preserved in earlier
  documentation and screenshots as history.
- Three original local 4K ambientCG Marble 021 maps provide color, roughness and
  height. See `public/textures/sanctuary/materials/SOURCES.md` for CC0 provenance,
  hashes and interpretation. They are procedural PBR assets, not scans.

## Initial black/gold implementation map — historical parameters

Read `docs/ARCHITECTURE.md` and `docs/TEXTURE-REFINEMENT.md`, then inspect:

| File | Role / next-step relevance |
| --- | --- |
| `src/components/sanctuary/doorMaterials.ts` | Black frame (`#34363a`, metalness 1, roughness 0.34, local environment multiplier 1.2), gold reveal (`#bca477`, metalness 1, roughness 0.28, multiplier 1.05), and preserved inner light/cast glass/polished glass edge. |
| `src/components/sanctuary/GlassDoor.tsx` | Assigns finishes by GLB mesh names. `Fixed_GlassFrame` now uses `frame`. Owns cloned materials, fade and shadow behavior. It no longer loads stone textures. |
| `src/components/sanctuary/PorcelainRibbon.tsx` | Active white marble despite its historical name: `#fcfbf8`, roughness 0.205, clearcoat 0, IOR 1.54, local environment multiplier 1.15. |
| `src/lib/mineralFinish.ts` | Triplanar color/roughness/height mapping, derivative-filtered metal roughness, and the Three r175 material IBL multiplier correction. Brushing is not a full anisotropic metal model. |
| `src/components/sanctuary/useStoneTextures.ts` | Loader-cached maps used by the marble ribbon. Material disposal must not dispose these cached textures. |
| `src/components/sanctuary/SceneEnvironment.tsx` | Directional soft shadows, five reflection cards, and a 512 cube/PMREM capture of the layered sky. The fifth card supplies a feathered rear sky bounce for marble polish. |
| `src/components/sanctuary/SanctuaryScene.tsx` | Active scene, ribbon cycle, focus and finite portal pool. |
| `src/lib/materialReveal.ts` / `doorShadowMaterial.ts` | Coverage fades and corresponding shadows; retain these contracts. |

The ribbon's stone-coordinate Y offset follows its recycled cycle, synchronized
with a layout effect. Preserve continuity at section and pool boundaries.
Current ribbon mapping: scale 0.16, contrast 0.85, relief 0.00022, roughness-map
variation 0.065. Shader roughness includes that modulation and is clamped to
0.16–0.38 before Three's geometric adjustment. Frame/gold directional roughness
strength is 0.018/0.035. The earlier frame stone mapping (scale 0.48, contrast
1.10, relief 0.0006) has been removed from the active finish.

Three r175 ignores the material's own environment intensity when it uses
`scene.environment` with no explicit `envMap`. `applyFinishEnvironment` now
adds a local IBL multiplier for marble and both metals, retaining the shared
changing sky capture and avoiding per-material stale PMREM references. Glass
keeps its existing shader response. The added rear card is 24 × 8 at key
azimuth + PI, height 9 and radius 32, with power 2.6/1.5/0.85 at day/dusk/night.
Its feather texture is owned/disposed with capture resources. It is invisible
in the main scene and adds no shadow source.

The active renderer is `src/components/sanctuary/`. Legacy staircase code under
`src/components/scene/` and historical Blender notes are not the active material
implementation. Existing GLBs have named frame/reveal/glass submeshes; this
surface pass retained those meshes and did not require Blender rebuilding.

## Visual references and their limits

- Current actual browser captures and verification:
  [docs/validation/black-gold-marble/README.md](validation/black-gold-marble/README.md).
- Historical ivory-frame trial captures: `docs/validation/texture-refinement/`
  — before, after-day, after-focus, after-night and after-compact.
- Generated pairings and exact prompts:
  `assets/design-directions/material-pairings/`.
- `03-white-marble-bronze.png` shows the outer-frame form/material family the
  owner liked; `03b-white-marble-darker-bronze.png` explores a darker brown.
  **Both are superseded in frame color by the final deep-black-plus-gold choice.**
- `01-white-marble-champagne.png` and option 3 illustrate the selected marble
  family. Keep the fine vein scale restrained and test polish in motion.
- `04-porcelain-titanium.png` and the warm alabaster options are alternatives,
  not the chosen stair finish. There is no generated final black/gold preview.

Generated images are direction studies, not screenshots or proof of exact
real-time reflection behavior. Current evidence uses actual browser screenshots
and observed interaction/motion checks. The environment reflection
capture is not full scene ray tracing; do not promise reflected nearby doors
or caustics from a generated image alone.

## Acceptance guidance for subsequent refinements

1. Inspect the current diff, materials, lighting and live site. Preserve the
   earlier work and record a fixed baseline.
2. Preserve deep-black satin metal outer frames with restrained gold reveals,
   and the white marble's soft polish. When refining, judge
   color, roughness, fine bump, metal response and reflection-card shape
   together. Do not simply recolor the existing stone material black.
3. Compare matched daylight views, close-up frame views, sunset and night.
   Ensure the black frame has readable form, gold stays restrained, and marble
   remains white with subtle veins and smooth moving highlights. Avoid noisy
   grain, tiled seams, texture swimming, uniformly wet gloss and plastic sheen.
4. Check scrolling/reversal, pool recycling, focus/dissolve/return, entrance,
   compact layout and reduced motion. Preserve the floating gaps, colored
   panes, scene geometry, project links, audio consent and text-free homepage.
   `/door-studies` shares the frame materials and needs inspection too.
5. Run the repository's tests, lint and production build. Save actual captures
   and update the current design/validation docs with what was implemented.

Earlier trial validation: all 108 tests, TypeScript, lint and production export
passed; browser checks included day/night, focus and compact layout with no
captured errors. Those are historical results, not validation of the new build;
use the separate [current validation record](validation/black-gold-marble/README.md).
During development, a full reload restored the audio sculpture after hot
refresh; inspect a fresh load before diagnosing an absent sculpture as a new
material regression.

## Local tooling notes

The default shell previously had no Node/npm on PATH; system Git encountered
an unaccepted Xcode license. Use the bundled runtime or rediscover its paths
with `load_workspace_dependencies`; do not accept system agreements on behalf
of the owner. Last verified paths:

```text
Node: /Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
Git: /Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/git
```

Equivalent checks without npm (run in repository root):

```sh
RUNTIME_NODE=/Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
"$RUNTIME_NODE" --import tsx --test src/lib/*.test.ts
"$RUNTIME_NODE" node_modules/eslint/bin/eslint.js src
PATH="$(dirname "$RUNTIME_NODE"):$PATH" "$RUNTIME_NODE" node_modules/next/dist/bin/next build
```

The Next config separates `.next-dev` from production `.next`. Chrome was not
available through the connected browser tool; the built-in browser worked.
Useful existing dev-only review parameters: `?reviewSeed=8&reviewStill=1` for
stable placement/no idle cruise, and `&reviewTravel=4` for night. These do not
freeze every animation. Restore the normal homepage after review.

Blender and Blender MCP setup are permitted if useful. MCP has not been set up
by this conversation. The existing web renderer can handle this surface pass;
avoid making Blender setup a prerequisite without a concrete need.

## Deferred design roadmap

Improve cloud source detail and subtle motion; refine equal vertical travel
to equal elapsed time in a reversible 24-hour world; coordinate light/shadow,
sun, moon, stars and mood; decide celestial paths and new sound later; optimize
device tiers after accepting the visual ceiling. Existing cloud flow and an
eight-user-turn lighting clock already exist. These are follow-up phases, not
part of the immediate material build unless the owner expands the task.
