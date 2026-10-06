# Black metal, gold and white marble — actual-site validation

October 5, 2026 (America/Los_Angeles). Local implementation in the existing
checkout; all prior uncommitted assets and work were retained. Nothing was
committed or deployed. These JPEGs are direct browser captures of the website,
not generated material studies or Blender renders.

## Implemented finish

- Softly polished white marble: restrained color contrast, very shallow relief,
  a narrow roughness range, and no clearcoat. The original three 4K Marble 021
  maps and continuous recycled coordinates are retained.
- Neutral black satin metal: full metallic response, roughness 0.34, quiet
  filtered machining, and no stone texture, clearcoat, or emission. The final
  pass lifted the dark base slightly and broadened its highlights after the
  first pass looked too tightly glossy in the close-up.
- A separate brushed-gold recessed reveal. Cast-glass colors, transmission,
  polished glass boundaries, and the existing inner light are unchanged.
- Per-finish sky-reflection strength compensates for Three r175 ignoring
  material intensity with an inherited scene environment. A fifth feathered
  rear reflection card gives the marble's broad faces a soft grazing highlight.
  It is present only in the reflection capture; the visible cloud world is
  unchanged.

See [current material documentation](../../TEXTURE-REFINEMENT.md) for exact
parameters and [architecture](../../ARCHITECTURE.md) for lifecycle contracts.

## Actual browser evidence

The fixed overview uses `?reviewSeed=8&reviewStill=1`, with `reviewTravel=2` for
sunset and `reviewTravel=4` for night. Day, sunset, night, and the main close-up
captures use a 1280 × 720 viewport. Placement/camera are fixed for the overview
comparison, but the audio sculpture and cloud interior continue animating.
The compact capture uses 430 × 932. These are responsive browser captures,
not physical-device benchmarks.

| Capture | What it establishes |
| --- | --- |
| [Before daylight](before-day.jpg) | Preserved starting ivory-frame / honed-marble trial. |
| [Final daylight](after-day.jpg) | Predominantly black frames against white polished marble, with the original tinted panes. |
| [Final close-up](after-focus.jpg) | Selected Melt, gold reveal, fixed black surround, dissolved slab and existing Music sculpture. |
| [Final night](after-night.jpg) | Cool marble with a soft reflection, restrained gold and readable dark silhouettes. |
| [Night close-up](after-night-focus.jpg) | Quiet marble veining and rounded-edge reflection under the existing night mood. |
| [Sunset](after-sunset.jpg) | The same finishes respond to warm illumination without turning the outer frames bronze. |
| [All six studies](study-all.jpg) | Shared finishes across all existing organic profiles. |
| [Study close-up](study-close.jpg) | Angled black-metal profile, recessed gold and undissolved glass. |
| [Compact daylight](after-compact.jpg) | Preserved narrow-layout composition and material separation. |
| [Negative travel](scroll-negative.jpg) / [positive travel](scroll-positive.jpg) | Actual scrolling and recycled geometry with continuous marble. Positive-travel capture has the browser's temporary 1376 × 1344 panel size. |

`study-first-pass.jpg` records the earlier, darker/tighter black-metal trial,
not the final finish. Existing prior validation and generated references remain
in their original directories.

## Checks

- All **108 existing tests passed**; see [test output](tests.log). This includes
  reduced-motion arrival/focus/reveal, reversible movement, recycling, coverage
  fades, shadow opacity, and interaction contracts.
- TypeScript `tsc --noEmit`, ESLint, and whitespace checks passed.
- Production compilation and static export passed; see [build output](build.log).
- Fresh browser loads compiled the WebGL materials without captured warnings
  or errors. The recorded environment has five reflection cards and a 4096
  shadow map. Shader-hook composition was also inspected against the installed
  Three shader source.
- Browser inspection covered automatic entrance, retained audio control,
  daylight/sunset/night, close-up selection and Escape return, slab dissolve
  and restoration in `/door-studies`, viewing-angle changes, all six profiles,
  scrolling and reversal through negative and positive recycling boundaries,
  and compact layout.

Reduced-motion logic was checked by the existing automated tests; an OS-level
reduced-motion browser pass was not emulated. No physical touch-device or
performance certification is claimed. Reflections remain sky/card-based PMREM,
not nearby-object ray tracing or glass caustics. Broader clouds, the 24-hour
world redesign, and device optimization remain deferred.
