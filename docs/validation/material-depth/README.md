# Bright-day marble depth and metal refinement

October 5, 2026. Follow-up to the owner's review of the first black/gold build.
The owner found that bright light erased the marble, the frames still read as
plastic, and the central gold triangle/cube looked flat. This pass implements
a stronger marble response, directional metal, and a **first platinum control
option for owner review**. The environment-matching and inverse-color control
ideas remain fallbacks, not selected or implemented options.

## Actual implementation

- Marble retains the original CC0 maps. Mapping scale is now 0.045, contrast
  1.65, base `#eeeee9`, roughness 0.22, IOR 1.54, relief 0.00022, and local
  environment strength 0.95. Albedo retains 12% of the source chroma, so stronger
  veins read neutral rather than amplifying warm speckles. The larger veins
  remain visible in the overview; the body remains white.
- Daylight key intensity is reduced by 23%; hemisphere multiplier changes from
  2.1 to 1.6 in daylight, and the rear reflection card from 2.6 to 1.9. Sunset
  and night direct-light settings are retained. This preserves stone highlight
  headroom without lowering the visible sky exposure or painting fake shadows.
- Frames use dark titanium-colored metal `#646970`, metalness 1, roughness 0.22,
  anisotropy 0.55, local reflection strength 1.0, and no clearcoat. The gold
  reveal retains its color and width, with anisotropy 0.35. Explicit tangents
  follow the opening contour on owned geometry clones; cached GLBs are not
  altered. Unlike the first pass's roughness-only brush treatment, this uses
  Three's directional physical BRDF.
- The central control now uses brushed platinum `#b8bdc1`, metalness 1,
  roughness 0.24 and anisotropy 0.42. Actual chamfer faces replace mathematically
  sharp edges; chamfers have lower roughness than the main brushed faces.
  A separate studio reflection map creates stronger face-to-face contrast,
  with intensity 0.9/0.65/0.32 for day/dusk/night. It is an art-directed material
  study, not a full capture of nearby scene objects. No emissive glow or flat
  environment-color fallback is used.
- The same convex body still morphs reversibly between tetrahedron and cube.
  Its beveled vertices stay inside the original envelope, and the iris morph
  targets that same beveled surface. Thin painted edge lines were removed in
  favor of physical chamfer highlights. Old GPU geometry buffers are released
  when morph topology changes.

Existing floating gaps, glass transmission and tints, project links, focus and
dissolve, automatic silent entrance, control position/scale, and audio behavior
are preserved. Existing assets and uncommitted work remain. No deployment or
commit was made. Cloud artwork, world-clock redesign, and device optimization
remain deferred.

## Browser evidence

These are actual website screenshots, without generated or repainted content.
Desktop comparisons use 1280 × 720 and `?reviewSeed=8&reviewStill=1`;
night adds `reviewTravel=4`. The control continues to rotate, so its facet angle
differs across captures. The compact browser check uses 430 × 932.

- [Before bright daylight](before-day.jpg) and [after bright daylight](after-day.jpg).
- [Marble close-up](marble-close.jpg), including the selected fixed metal frame.
- [Frame close-up](frame-close.jpg), angled with the original glass present.
- [Platinum triangle detail](control-triangle.jpg): direct browser crop of the
  central object; [cube form](control-cube.jpg) is shown in the full scene.
- [Night](after-night.jpg).
- [Compact daylight](after-compact.jpg).

## Validation

- **110 tests passed**: the prior 108 plus two geometry regressions covering
  finite orthogonal tangents and closed, outward-facing beveled solids throughout
  forward/reverse morphing. See [test output](tests.log).
- TypeScript, ESLint, production build/static export and whitespace checks
  passed. See [production output](build.log).
- Live WebGL shader compilation showed no captured warnings/errors.
- Inspected bright daylight, close-up stone and frames, both central control
  states, night, door selection/dissolve, viewing-angle changes, and compact
  composition. Audio was returned to the triangular/stopped state after the
  cube test. Existing reduced-motion behavior is covered by the automated suite;
  no OS reduced-motion or physical-device benchmark is claimed.

This is a revised material option for review. It does not claim subjective
visual acceptance. Prior screenshots in `black-gold-marble` remain the record
of the first pass that prompted this refinement.
