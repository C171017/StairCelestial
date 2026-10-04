# Sanctuary C — smoked crystal

Local implementation, October 4, 2026. The target is `assets/design-directions/c-smoked-crystal.png`. This checkout is independent of the porcelain exploration. No saved premium-pass patch was applied.

## Travel and time of day

`RibbonMotionState.userTravel` integrates only the signed, eased input displacement from the existing motion integrator. Idle cruise, camera orbit, and recycled mesh indices never contribute. Positive ribbon travel moves the viewer upward through the helix: wheel-up advances toward night, wheel-down returns toward daylight. Touch keeps the established site's input convention. The logical coordinate is unbounded and never wrapped.

The scene begins at warm sunset (`0.52`). The target advances by each change in accumulated user travel divided by five and saturates between 0 and 1: roughly 2.4 user-driven turns above the entrance reaches night and 2.6 turns below reaches daylight. The raw travel coordinate remains unbounded. Extra travel past an endpoint is not banked as invisible lighting travel, so reversing direction changes light immediately even after a long ascent or descent. A short exponential response removes small frame steps. It does not reset on focus, a direction reversal, or a recycled ribbon slot. Time of day is intentionally not tied to idle drift.

One ref-based `SceneMood` updates before the camera/sky passes. Its continuous daylight/sunset/night weights coordinate the sky dome, cloud highlights and shadows, cloud-distance haze, direct and ambient lights, reflection environment, portal illumination, crystal absorption, and star visibility. No full-screen dark overlay is used. Reduced motion stops idle travel/orbit and meteors; explicit input still changes mood gradually.

## Geometry and optics

The ribbon remains a finite six-turn closed swept mesh, with the same support surface height and 72 sorting sections. Its tighter bevel makes the flat sidewall legible. Smoked absorption, physical transmission, Fresnel reflection and a polished bevel replace the earlier metal tube rails. Top and side surfaces have different optical paths and reflection response. The light is directional, rather than an emissive outline following every edge.

The six portal silhouettes and their project mappings are preserved. Frames use a warm, pale polished finish with champagne recesses. Jewel-colored cast panes have a shallow static normal variation. Recessed light is strongest near each base, coordinated with the changing light. A small integral fillet is raycast against the actual GLB underside and fitted point-by-point to the curved ribbon below. The ribbon itself receives bounded analytic contact shading and a small warm glint. These contact effects approximate local occlusion and reflection; they are not ray-traced caustics.

The reflection environment is captured from the actual separate sky scene at daylight, sunset and night, with reflection-only softboxes for polished definition. Three 512-face PMREM captures are retained; a linear HDR blend updates as mood changes. There are no per-portal cube captures or continuous six-face recaptures. A development pixel probe confirms the blend contains nonzero radiance and is bound to the foreground scene.

The audio tetrahedron retains its entrance, shape change and playback behavior, with a more reflective graphite finish. Project focus, slab-only dissolve, artwork reveal, activation of project links, Escape and scroll-to-return remain intact. The ordinary homepage remains text-free.

## Atmosphere and bounded resources

The sky is a directional radiance dome. Existing cloud banks are retained as independent transparent image layers, with separate inferred highlight/shadow grading. Their unique, immutable painter order remains independent of camera azimuth. Cloud cards do not translate or exchange order. Stars are steady world-space points composited behind cloud opacity. Three short meteors are scheduled across the full sky in 192 seconds; their visibility depends on night and they stop for reduced motion/hidden documents.

The 8K/4K cloud masters and fallbacks are unchanged. Clouds remain layered artwork, not volumetric weather. The baked RGB can only support an artistic relighting approximation. No screenshot or generated flat backdrop replaces the interactive scene.

Canvas and sky composition allow up to 1.5 DPR, including wide desktops; transmission is sampled at full drawing-buffer resolution. These choices deliberately favor the requested quality pass over the old M2 budget. Meshes, materials, textures, render targets and environment captures remain finite with teardown cleanup.

## Local review

Run `npm run dev -- --hostname 127.0.0.1 --port 3001`. Port 3000 belongs to the separate original exploration.

In development only, `/?crystal-review=1` fixes the door seed and disables idle cruise for repeatable comparisons. Optional `ascent` and `turns` parameters set the initial logical user ascent and ribbon position. They do not replace the production travel mechanism; wheel/touch input still uses that mechanism. Examples: `ascent=-2.6` for daylight, `ascent=0` for sunset, `ascent=2.4` for night. One full camera orbit spans four ribbon turns. Production ignores these review parameters.

Development canvas attributes expose scene mood, user ascent, ribbon/orbit turns and bounded 300-frame timing samples. Timing is browser-observed frame interval, including other work, not isolated GPU time or physical-phone performance. The existing `/sky-review` page retains the complete forward/reverse 360-degree probe and 0.01-degree samples at the historical popping angles. Its Light slider and Effect time input allow inspection of the separate sky and a fixed meteor moment. This interface is deliberately separate from the text-free homepage.

Final validation evidence and screenshots live in `docs/validation/crystal-c/`. See `review.json` for the measured conditions and results.

## Verified results and limits

All 102 unit tests, ESLint, the production export build and diff whitespace checks pass. The browser orbit probe matched 360 forward/reverse views exactly and returned to the initial image with zero changed pixels. The worst dense 0.01-degree block change was 1.60/255; a single-pixel threshold flag remains documented in `review.json`.

Chrome on Apple M4 was inspected at 1440 × 1000 and 393 × 852 CSS pixels. Entrance, play/pause shape feedback, portal focus/artwork, Escape/scroll return and second-click navigation to JazzTree were exercised. Reduced-motion emulation kept ordinary idle travel and the effect clock at zero; explicit scrolling still changed lighting. A retained-entry Canvas remount exposed an uninitialized audio-control clock; its fallback now restores the completed control.

The saved short development timing windows vary substantially (desktop sunset around 16 ms mean; a compact focus window around 33 ms mean with a 60 ms p95). These are browser observations on one M4, with dev tools and OS scheduling in the environment, not comparable production benchmarks or evidence of A18/A19 performance. No physical mobile Safari/touch validation or thermal soak was performed. The quality-first 1.5 DPR ceiling and full-resolution transmission still need device tuning.

The actual chat Fast-mode setting was not verified or altered.
