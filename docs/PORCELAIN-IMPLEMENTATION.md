# B2 floating porcelain implementation

The October 5 [material refinement](TEXTURE-REFINEMENT.md) now implements
softly polished white marble, satin blackened-metal frames and restrained
brushed-gold reveals. It supersedes the porcelain finish parameters below
and adds a fifth feathered reflection card plus the Three r175 local IBL
multiplier correction. Existing glass, geometry, floating placement, fades
and interactions remain in place. See [current website evidence and validation](validation/black-gold-marble/README.md).

## Historical implementation — October 4, 2026

This records the October 4 source implementation of the selected [B2 floating pearl-sky direction](../assets/design-directions/b2-floating-pearl-sky.png). Material descriptions and four-card capture details below are historical; current values are in the material refinement document above. Visual quality was the priority for this pass; performance optimization was deferred. No physical-device performance claim is made.

The selected direction replaces the earlier proposal to attach each frame through a fitted foot. Portals now hover deliberately above a milk-ivory porcelain ribbon, with real cast shadows explaining the air gap. The glass-ribbon component remains in the repository for reference but is no longer mounted on the homepage.

## Floating composition and shadows

[`SanctuaryScene.tsx`](../src/components/sanctuary/SanctuaryScene.tsx) mounts `PorcelainRibbon` and a finite pool of 15 portal occurrences. The underlying ribbon remains a six-turn, rounded-section helix. It is divided into 72 mesh sections; their shared boundaries preserve the normals of the complete geometry. Compact screens retain the narrower radius and ribbon width.

[`floatingDoor.ts`](../src/lib/floatingDoor.ts) raises each frame above the highest sampled ribbon surface beneath its lower perimeter. Clearance is `0.3 × door scale` in world units. The position is calculated when placement changes, rather than animated as a bob. An additional ±0.55-radian yaw presents more of the face; the base-center position is preserved through that rotation. Shape selection and placement remain stable for a mounted visit.

The opaque porcelain ribbon casts and receives directional shadows. Ceramic frames and champagne liners also cast and receive shadows. Glass slabs contribute a lighter shadow through 24% alpha-hashed depth coverage, multiplied by their current reveal opacity. This is an artistic approximation of partial transmission; it does not calculate colored-glass caustics. Dissolving or hidden doors fade their shadow coverage with their visible material state.

The moving key uses a 4096-square shadow map. Its camera covers X ±22 and Y ±25 world units, with near/far bounds of 0.1/95. The current `SoftShadows` configuration uses size 180 and 40 samples. The light stands 38 world units along the shared normalized key direction. Actual shadow direction therefore changes with the time-of-day clock.

A 9-by-14 rectangular light follows the same direction at 18 world units, supplying a broad highlight across ceramic edges. Its intensity follows day/sunset/night at 4.5/3.2/2.1. It does not cast another shadow; the directional key remains the shadow source. The viewing camera is raised to 5.2 world units while the audio sculpture retains a 2.8-unit anchor on the transformed spiral axis.

Portals mostly blocked by the opaque ribbon, or reduced to a cropped fragment at the vertical viewport boundary, fade out. [`portalPresentation.ts`](../src/lib/portalPresentation.ts) samples nine points within each real opening; `ProjectArtifact` staggers the visibility check every fifth frame. Hidden presentations cannot intercept pointer or keyboard activation. Selected portals remain visible, and focus still chooses the face with fewer ribbon obstructions.

Compact layouts use a stricter presentation threshold: at least eight of nine samples must be clear. The target is fully hidden or fully visible, with temporal damping providing the transition; a partly blocked frame does not remain as a faint dithered ghost. This prevents the narrower foreground ribbon from visually cutting across a portal's hovering gap. Desktop retains the more permissive depth layering.

## Material and asset finish

[`build_door_studies.py`](../blender/build_door_studies.py) now builds a crowned ceramic cross-section with restrained perimeter variation in shoulder depth and width. It preserves the inner aperture instead of treating the entire frame as a uniform extrusion. The champagne liner is recessed slightly into the opening to avoid coincident surfaces; both faces retain finished details. Fault keeps its angular outline with softened corners.

The six regenerated GLBs are under [`public/models/doors`](../public/models/doors). Their [manifest](../public/models/doors/manifest.json) totals 1,991,408 bytes. Runtime model URLs use the `v=8` cache version. Project identity, opening geometry, and the stationary `door_role=slab` hierarchy remain in use; the colored slab dissolves in place to reveal the corresponding project sculpture.

[`doorMaterials.ts`](../src/components/sanctuary/doorMaterials.ts) separates the finishes:

- Satin ivory ceramic uses roughness 0.32 and restrained clearcoat. The ribbon uses its own warmer milk-ivory physical material.
- Champagne metal has a more distinct metallic response and a thinner recessed reveal. Inner light strips are restrained emissive surfaces, not local light sources.
- Tinted art glass combines transmission, color absorption, a partial reflective backing, and an independently polished edge. It is deliberately partially silvered art glass, rather than a perfect mirror.

[`porcelainFinish.ts`](../src/lib/porcelainFinish.ts) adds small, static, object-space variation to porcelain roughness and normals. Cast glass receives a shallow meniscus and a slight normal variation, plus a thickness gradient from the center toward the perimeter. These are shader finish treatments; the scene does not add animated grain, dirt textures, or a new texture download for them.

The central audio sculpture now uses champagne-colored metal in place of its previous dark finish. Its existing entrance, play/pause morph, and interaction remain intact.

## One continuous day–night clock

[`ribbonMotion.ts`](../src/lib/ribbonMotion.ts) separately accumulates `userPosition`, using the integrator's actual accepted input travel. Automatic cruise changes the ribbon position but never this user-only coordinate. Input queue limits, direction changes, and easing therefore affect the atmosphere consistently with navigation actually performed.

[`sanctuaryAtmosphere.ts`](../src/lib/sanctuaryAtmosphere.ts) maps eight unwrapped user turns to a complete solar cycle:

- 0 turns: pearl daylight.
- About 2 turns: sunset.
- About 3–5 turns: indigo night, with midnight at 4.
- 8 turns: daylight again, continuing into the next cycle.

Positive travel corresponds to an upward wheel gesture/climbing through the ribbon. Descending reverses the same mapping. The coordinate is independent of recycled door indices and camera azimuth. Only trigonometric evaluation wraps; the stored travel and solar phase remain unbounded. A short exponential response eases the atmosphere toward accepted travel. It does not accumulate elapsed idle time.

The shared snapshot provides linear-light colors for the sky, cloud highlight/shadow/haze, key and fill lights, ambient light, and reflection tint, as well as their intensity controls. The key moves clockwise around world X/Z. Its normalized elevation stays above 0.35; sunset is lower and the night key rises again. This is an art-directed sun/moon path, not a geographic solar simulation.

Night has its own indigo sky and silver-blue cloud palette, with a stronger pale moon key and soft front fill to preserve porcelain readability. It is not a black overlay over a daylight image. Root lighting applies the shared key intensity directly, fill ×0.88, hemisphere ×2.1, and environment intensity ×0.95 at the current refinement stage.

## Sky, clouds, stars, and reflections

The clean plate is now a procedural gradient with a broad directional atmospheric glow. [`CloudField.tsx`](../src/components/sanctuary/CloudField.tsx) retains the existing 64 bank cards and 16 cirrus cards, their immutable world transforms, alpha silhouettes, and unique camera-independent painter priorities. Their photographic luminance supplies cloud relief; separately controlled highlight, shadow, and haze colors supply the current lighting palette.

The existing cloud source artwork is retained. On supported GPUs, the loader selects the 8192-square compressed atlas for wide views or the 4096-square atlas for compact views/GPU limits, with WebP fallbacks. It resolves the chosen artwork before publishing it so an already visible sky does not undergo a late fallback-to-compressed replacement. Texture anisotropy is capped at 8 or the GPU limit, whichever is lower. This pass does not claim newly generated native 8K detail.

Selected near banks and wisps receive very slow internal color displacement. Alpha is always sampled at the original coordinate. The cloud cards do not travel, recycle, deform, or change ordering as this motion runs. The color-flow cycle is 360 seconds, with an additional harmonic inside it. This suggests moving vapor while preserving the earlier correction for whole-card sorting pops.

The procedural star field is world-fixed, fades in during night, and is drawn behind the cloud alpha. Pinpoints have derivative filtering to reduce subpixel shimmer; they do not blink. Meteors and sparse glints use an independent 120-second schedule, with at least 23 seconds between meteor starts across the entire environment. Their visibility follows dusk/night, keeping daylight quiet.

[`LayeredSky.tsx`](../src/components/sanctuary/LayeredSky.tsx) composites the plate, effects, and clouds into an opaque background before foreground transmission. The target follows the main renderer's DPR up to 2. Sky and cloud uniforms update before the environment capture and the visible sky pass.

After both cloud artwork and the plate are ready, `LayeredSky` exposes its scene through `reflectionScene`. [`SceneEnvironment.tsx`](../src/components/sanctuary/SceneEnvironment.tsx) clones the sky hierarchy into a separate capture scene while sharing its materials and geometry, adds four controlled studio reflection cards, and omits transient meteors/glints from the capture. A 512-square half-float cube target is prefiltered with PMREM. The environment refreshes when solar phase changes by at least 0.045 radians, or when the ready sky/cloud source identity changes. Replaced PMREM targets are disposed; removing a cloned sky does not dispose source-owned assets.

These are shared environment reflections, refreshed in bounded steps. They are not per-door planar reflections, ray tracing, or per-frame captures of every foreground object. The tiny internal cloud flow can therefore differ slightly between a live cloud and a cached reflection until the next environment refresh. A tinted legacy panorama is the environment fallback while the live sky source is unavailable.

## Rendering and lifecycle

The homepage currently requests DPR between 1.5 and 2, antialiasing, shadows, and the high-performance WebGL preference. ACES filmic tone mapping uses exposure 1.0. The transmission target uses full resolution (`transmissionResolutionScale = 1`). These settings intentionally prioritize this visual prototype; no adaptive quality controller or hardware-based quality tier is enabled.

Reduced motion disables idle cruise, automatic cloud detail motion, and meteors/glints. Explicit navigation can still change the atmosphere, with the extra color easing removed so it does not linger after input. Static stars remain part of the night appearance. Hidden documents clear motion velocities and stop atmospheric/effect clocks; returning does not replay suspended time. The existing reduced-motion entrance and focus handling remain in place.

Cloud textures/materials, temporary render targets, and environment resources retain their component ownership and cleanup paths. The sky portal scene itself remains stable through ordinary rerenders. Entrance readiness waits for the selected artwork or settled fallback before revealing the composition.

## Reproducible review

These parameters are development-only and add no production control UI:

- [`/?reviewSeed=731&reviewStill=1&reviewTravel=0`](http://127.0.0.1:3000/?reviewSeed=731&reviewStill=1&reviewTravel=0): stable portal arrangement, no idle cruise, daylight.
- [`/?reviewSeed=731&reviewStill=1&reviewTravel=2`](http://127.0.0.1:3000/?reviewSeed=731&reviewStill=1&reviewTravel=2): the same arrangement at sunset.
- [`/?reviewSeed=731&reviewStill=1&reviewTravel=4`](http://127.0.0.1:3000/?reviewSeed=731&reviewStill=1&reviewTravel=4): the same arrangement at midnight.

`reviewStill` only stops idle cruise; it does not disable wheel input or freeze every ambient animation. `reviewTravel` fixes the atmosphere target without moving the ribbon to that turn. Removing it restores the normal user-driven clock. Reload between different seed/clock scenarios because these development values are read on mount.

[`/sky-review`](http://127.0.0.1:3000/sky-review) exposes camera azimuth, cloud/effect time, and sky travel independently. Its existing full forward/reverse orbit probe and dense checks around previously failing cloud angles remain available. Set a fixed effect time when comparing identical sky views.

Local visual evidence from this pass is stored in [`validation/premium-pass`](validation/premium-pass). Final desktop views are [daylight](validation/premium-pass/b2-final-day.jpg), [sunset](validation/premium-pass/b2-final-sunset.jpg), [night](validation/premium-pass/b2-final-night.jpg), and [night portal focus](validation/premium-pass/b2-final-focus.jpg). Earlier numbered passes are intermediate revisions.

The accepted compact correction is [b2-final-compact-clean.jpg](validation/premium-pass/b2-final-compact-clean.jpg); the earlier `compact-corrected` file still contains a persistent fractional-opacity ghost and is superseded.

## Verification status

The full suite now contains **108 passing tests**. ESLint, TypeScript checking, and the production static export pass. The final compact threshold correction is additionally checked by the portal presentation tests.

Relevant automated coverage includes user-only travel excluding idle cruise, reversible continuous atmosphere cycles, safe normalized key elevation, bounded suspension catch-up, frame-rate-independent atmosphere easing, stable cloud painter ordering at the former failing orbit angles, and sparse continuous meteor envelopes. These tests establish implementation properties, not aesthetic quality or a device frame rate.

Browser checks at 1440×1000 and 393×852 covered entry completion, daylight/sunset/night, portal opening, and Escape return. Actual compact wheel navigation advanced atmosphere travel from 0 to 0.6500 and reversed to 0, returning the key direction from (-0.182, 0.676, 0.714) to the original (-0.468, 0.734, 0.492). These are DOM diagnostics of the running scene, not a fixed image transition. Console checks found no new warnings or errors.

Independent **GPT-6 Astra High** reviewed saved actual browser screenshots over several iterations. Final desktop ratings are **7.5/10 daylight**, **7.8/10 sunset**, and **6.8/10 night**. Sunset has the strongest perceived material depth; night remains less refined because the portal edges receive less useful light and lose some ceramic/champagne separation. These are candid aesthetic assessments, not an award claim. Generated concept scores are recorded separately and are not implementation scores.

Final compact rating is **7.2/10**, up from 6.8 before the occlusion correction. Astra confirmed that removing the sliced portal resolves the conspicuous overlap; subdued material contrast and the central control's relative prominence remain aesthetic limitations.

Physical M4/A18/A19 testing and sustained thermal/performance evaluation have not been performed for this pass; performance optimization remains deferred by the current brief. Nothing was deployed or pushed.
