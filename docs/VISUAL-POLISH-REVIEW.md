# Sanctuary visual polish review

October 4, 2026. Inspection baseline: `2c04420`. This is design advice and a proposed evaluation plan, not an implemented visual change. The future ascent concept below records the owner's request and remains deferred.

## Design judgment

Preserve the endless ribbon, irregular portals, pearl/champagne palette, and generous quiet sky. The strongest weakness is that the objects do not feel made from distinct materials or convincingly seated in the same world. The clouds have warm highlights and cool modeled shadows, while the doors are evenly bright, uniformly extruded, and weakly grounded. Higher image resolution alone cannot resolve that mismatch.

Recommended direction: satin ivory porcelain, a fine recessed champagne-metal lining, cast colored glass with polished edges, and carefully fitted organic connections to the ribbon. Keep the atmosphere luminous, but allow local shadow and contrast to describe weight and thickness.

## What was actually inspected

- The supplied screenshot, the running local homepage at compact and desktop widths, scroll movement, a focused project, and the separate `/door-studies` room.
- Current mounted Sanctuary source, cloud-loading/compositing code, material definitions, lighting, ribbon contact shading, support calculations, Blender construction, and asset manifests.
- Cloud source/composite previews and the six GLB inventories. No wing-named asset was found in `src`, `public`, or `assets`; wing artwork has not been independently identified.
- Short instrumented measurements in the Codex browser on an **Apple M4**, using the development server. These are not physical M2 iPad/MacBook measurements or production benchmarks. See [measurement evidence](validation/visual-polish/measurements.json).

The opening section of [SKY-IMPLEMENTATION.md](SKY-IMPLEMENTATION.md) is the current sky specification. Older moving-cloud sections and some architecture/asset descriptions are historical.

## 1. Finish the door-to-ribbon junction first

The frames currently look balanced on, or cut into, a transparent strip. `doorSupport.ts` seats each base at one center point on the curved ramp. It does not shape the complete underside to the receiver. `ribbonShadows.ts` supplies a generic soft ellipse rather than a contact footprint matching each frame.

Proposed treatment:

- Let the ceramic frame broaden very slightly into an integral, asymmetric foot at its base, like porcelain settling into a shallow fitted recess. Keep this detail small; avoid an added pedestal or exposed hardware.
- Fit the underside to the local ribbon slope and curvature. Because occurrence yaw, scale, and position vary, one fixed flat foot will not solve every placement. A small runtime-fitted underside or constrained contact region is preferable to simply tilting the whole door.
- Give the actual contact line a tight, soft occlusion band, with a weaker shadow immediately around it. Follow the base outline. A faint tint/reflection at the joint can be an artistic approximation rather than expensive physical caustics.
- Make the ribbon's edge thickness and underside slightly more readable near these joints. Preserve transparency elsewhere.

Expected computational cost: low if the fitted mesh is computed when placement changes and shares the current contact-shading pass. This is a geometry and art-direction problem before it is a shadow-rendering problem. Generic full-screen ambient occlusion does not reliably solve contact between transparent objects.

## 2. Separate porcelain, metal, and glass

All six GLBs have six meshes and no image textures. Runtime ceramic uses uniform roughness `0.25` and clearcoat `0.85`; metal roughness is uniformly `0.27`. The repeated broad glossy response suggests molded plastic. The glass panes are tinted, frosted transmission materials, not real mirrors.

Proposed treatment:

- Porcelain: slightly softer satin finish, restrained glaze, and barely visible variation in roughness and surface normal. Start by testing roughness around `0.32–0.42` and less clearcoat, then choose visually under the final lighting. These are trial values, not a prescription.
- Metal: a thinner, recessed champagne lining with sharper but less ubiquitous highlights. Give the recess enough depth to produce a readable dark seam.
- Glass: preserve a quiet, lightly frosted interior, clarify its polished edge and thickness, and reduce the feeling of a uniformly colored panel. Avoid adding more saturation to compensate for weak reflections.
- Geometry: vary frame cross-section and bevel radius deliberately. The current inner outline is largely a scaled version of the outer outline with a repeated extrusion treatment. An organic outline is not sufficient if every section has the same manufactured profile.
- Keep surface detail subordinate at normal viewing distance. Do not add dirt, obvious grain, grunge, or random waviness merely to make something tactile.

Expected cost: very low for parameter and profile changes; low for one shared small roughness/normal texture set. The six unique shapes already total about 95,560 triangles; blanket subdivision is not the useful investment. If the desired identity becomes a true mirror, treat it as a separate material decision rather than silently adding expensive live scene reflections to every pane.

## 3. Make the light describe the objects

The current setup has warm directional intensity `2.2`, cool directional `1.2`, and ambient `0.45`, without shadow maps. Reflections come from a one-time 256-pixel cube capture of an older cloud panorama plus studio panels. The visible layered sky and reflected environment share a palette but are not the same composition. The bright inner strips are emissive meshes; they do not illuminate neighboring surfaces.

Proposed treatment:

- Establish one convincing warm light direction consistent with the cloud artwork. Reduce fill enough to reveal a cool shadow side and the frame's depth.
- Reposition reflection cards so porcelain receives broad soft light, while metal and glass catch narrow, controlled highlights. Dark reflection shapes are as useful as brighter lights.
- Align the reflection environment's palette and light direction with the visible sky. Test a one-time 512 cube capture only after the light design is right.
- Give emissive strips a recessed origin and local, restrained apparent light spill. Avoid an equally bright outline around every object.
- Do not darken the whole scene or use broad bloom to hide flat shading. Preserve the bright atmosphere and create contrast locally.

Expected cost: essentially unchanged for light balance and reflection-card design. A 256→512 one-time environment capture uses four times the face texels and more initialization work; it does not require a new capture every frame.

## 4. Address cloud sharpness at the correct stage

The desktop cloud atlas is already **8192 × 8192**, with four 4096-square upscaled banks. The accepted KTX2 is **6,275,067 bytes**; compact uses a 4096-square atlas of **1,840,118 bytes**. Cirrus is 2048 × 1024. The 1024 × 512 clean sky plate contains a smooth gradient, so enlarging that plate is unlikely to help.

Two limits matter:

1. `LayeredSky.tsx` caps the sky composition at one render pixel per CSS pixel for widths ≥700. `SanctuaryScene.tsx` also caps the whole canvas at DPR 1 for widths ≥1500, and at up to 1.5 below that. On Retina screens this can soften detail even with large source textures.
2. The four original cloud banks were only **627 × 627** each. AI upscaling added plausible internal detail, while the original alpha was enlarged and restored. The 24K archival image is a rendered composite, not native 24K cloud information.

Test in this order:

- Compare a fixed camera, identical cloud composition, and identical output display size at sky scales 1, 1.25, and 1.5. Ensure the final canvas has enough pixels to preserve the sharper sky; a higher-resolution sky target feeding a 1× canvas still has a 1× output ceiling. Change one setting at a time.
- Compare the accepted compressed artwork against a lossless or higher-quality-compressed crop in the actual renderer. A larger file does not guarantee a visible improvement.
- Only then create one or two improved near-cloud banks. Retain the palette and light direction, but introduce thinner vapor, more varied density, less uniformly creamy rounding, and better alpha-edge detail. Judge at actual display size, not only enlarged crops.
- Keep distant clouds softer and lower contrast. More sharpness everywhere removes atmospheric depth. Reduce recognizable repetition before adding more banks.

Image generation through the available image tools or a dedicated upscaler is suitable for a focused asset pilot. A model name or requested “4K/8K” prompt is not proof of delivered resolution. Inspect output dimensions and alpha, preserve source masters, and compare against the original before batching. Do not generate a flattened screenshot to replace the interactive 3D scene.

## 5. Add quiet motion after the finish is convincing

The current homepage freezes all cloud cards and disables sky effects. Six meteors and five glints already exist in a 32-second environment schedule, but are not currently active on the homepage. Unpausing the clock alone does not restore cloud drift: the active cloud renderer no longer applies movement.

Cloud motion was removed after overlapping cards changed draw order during orbit and visibly popped. Preserve the corrected order and composition. A low-risk pilot can use a subtle flow map inside selected wisps or banks, with distortion fading toward the alpha boundary. Keep silhouettes stable and motion slow enough to suggest air moving through vapor. This is an illusion of flow, not true moving volumetric clouds. If clearly recognizable cloud travel is required, prototype that separately and verify complete forward/reverse camera orbits.

Use a few layers and a small shared flow texture before considering video or volumetric ray marching. Avoid a whole-image wobble, swelling foam, or a watery horizontal cloud sheet. Respect reduced motion and pause work when the page is hidden.

More shooting stars would be inexpensive relative to the glass, but are low priority for polish. A suggested starting point is one restrained visible event every 20–40 seconds in darker conditions, not a constant shower. Give effects an independent clock so a fixed cloud field does not disable them. Daylight should remain mostly quiet.

## 6. Preserve compositional restraint

Keep the open sky. Slightly stronger haze and lower contrast on distant ribbon turns can help the foreground read without another render pass. Review recurring edge-on portals, overlaps, and the visual dominance of the dark central audio sculpture. Controlled spacing and a few well-presented silhouettes will feel more considered than uniform detail across the whole screen. Preserve the existing text-free interaction contract; this review does not propose adding a menu.

## Performance envelope and what can be estimated

There is no defensible single percentage of “unused M2 compute” from an M4 preview. M2 iPad Safari, a fanless M2 Air, and an actively cooled M2 Pro machine have different sustained limits. Display size, DPR, overlapping translucent surfaces, browser, and thermal state matter as much as the chip label.

Short local observations on Apple M4, development build, non-overlapping 300-frame windows. Dimensions below are drawing-buffer pixels:

- Homepage cruising at **1440 × 1000, DPR 1**: mean frame interval **15.03 ms**, p95 **21.90 ms**; approximately 143.5 draw calls and 263,221 submitted triangles per frame across sky, transmission, and main rendering.
- Homepage cruising at **2560 × 1440, DPR 1**: mean frame interval **20.33 ms**, p95 **26.30 ms**; approximately 136.6 draw calls and 247,155 submitted triangles. The camera continued moving, so these are different views, not a controlled resolution-only comparison.
- Async GPU timer queries around public renderer calls reported mean summed render work of **15.81 ms** and **22.14 ms**, respectively. These asynchronous samples are diagnostic observations, not end-to-end latency, and should not be subtracted from a frame deadline to certify headroom.
- No interval above 33.34 ms occurred in those two saved windows. This does not establish long-run worst-case behavior.
- A focused-door sample was lighter: mean interval **14.36 ms**, p95 **19.60 ms**. Inactive objects fade out during focus, so it is not representative of the overview.

The temporary probe was removed after inspection. Its source is preserved with the evidence for reproducibility. No physical M2 device, production build benchmark, or thermal soak was performed in this review.

Useful exact arithmetic:

- A 60 fps frame lasts **16.67 ms**; 45 fps is **22.22 ms**; 30 fps is **33.33 ms**. These are deadlines, not recommended GPU-only budgets.
- A resolution multiplier of **1→1.25** adds **56.25% pixels** in each affected target; **1→1.5** adds **125%**; **1→2** adds **300%**. Total frame time does not necessarily scale by those amounts because some work is fixed or CPU-bound.
- Refraction scale **2/3→1** adds **125% pixels to that pass alone**. Keep it at the current scale until a visible issue justifies the cost.
- A 2560 × 1440 RGBA8 sky target with an assumed four-byte depth attachment occupies about **28.1 MiB** before other buffers/overhead; 1.25× dimensions make it **43.9 MiB**, and 1.5× makes it **63.3 MiB**.
- An 8192-square compressed atlas at an assumed 8 bits per texel plus a full mip chain is approximately **85.3 MiB**. An uncompressed RGBA8 equivalent with mipmaps is approximately **341.3 MiB**, despite a small WebP download. Actual compressed allocation depends on the GPU transcode format. Loading a raw 24K composite is not the sensible next step.

Recommended working budget: first pursue changes that stay close to current rendering cost. Aim for stable 60 fps where possible, with a consistent 30 fps as a fallback if that satisfies the owner. Treat 45 fps as an intermediate measurement, not a guaranteed cadence on a 60 Hz panel. Avoid oscillating unpredictably between quality tiers.

Do not spend a speculative extra 20–50% GPU cost yet. After a warm M2 baseline, reserve roughly 20% of the chosen frame deadline for variability, and trial one addition at a time. For example, if synchronized target-device work genuinely fits within 12 ms, a 16.67 ms deadline with a 3.33 ms reserve leaves only about **1.34 ms** for additions. At a 33.33 ms target, a 24 ms baseline with a 6.67 ms reserve leaves about **2.66 ms**. These examples illustrate budget discipline; they are not measurements of this site on M2.

Before accepting a quality increase, use production mode on an M2 iPad Pro in Safari and an M2 Air, both orientations/sensible desktop sizes, idle cruising, vigorous scrolling/reversal, focus/return, and at least 10–15 minutes of warm operation. Record frame distributions, drawing-buffer sizes, GPU timings where available, memory pressure/context loss, and visual artifacts. Use thresholds based on sustained results, not browser width alone.

## Proposed implementation order

1. One representative door: fit its base, reshape its cross-section, separate material finishes, and rebalance the light. Compare it with the current door in the same camera view.
2. Apply the successful treatment to the remaining forms and validate contact through scrolling, focus, and different placements.
3. Run the controlled sky-resolution/encoding comparison; replace only weak near-cloud artwork if necessary.
4. Trial restrained cloud flow and rare meteors independently. Keep either effect only if it improves the atmosphere and survives orbit/motion checks.

Avoid making all of these changes at once. A matched comparison should make the source of any improvement, softness, or slowdown clear.

## Future idea: ascent from daylight toward night — deferred

Owner's requested concept: climbing higher through the spiral gradually moves the scene from the current luminous daylight toward dusk, deep sky, and more visible stars. Descending reverses the transition toward daylight. It may represent altitude, time of day, or a poetic combination; it need not simulate literal travel into space. Distant city lights below are an optional later extension.

Compatibility requirements for today's polish work:

- Keep the clean sky plate, clouds, stars, haze, direct lighting, reflection environment, and object emission separately controllable. Do not bake stars, cities, or the entire lighting transition into one replacement backdrop.
- Use one continuous scene-mood value to coordinate sky hue/luminance, cloud grade, warm/cool light balance, reflection intensity/color, atmospheric depth, and star visibility. Maintain readable glass edges and porcelain at night without leaving them illuminated by daylight.
- Derive future mood from an accumulated logical ascent coordinate, independent of the finite mesh pool's recycled turn indices and the camera's orbit angle. Crossing a pool boundary must not reset night to day. Choose and document whether idle cruising also changes mood before implementation.
- Make changes gradual and reversible. Avoid hard swaps or a simple black overlay. Smooth the response without noticeable lag when the user reverses scroll direction.
- Current clouds contain warm sunlight baked into RGB. New assets should preserve a controllable highlight/shadow mask or include a compatible dusk/night lighting variant. Merely tinting golden highlights blue may look implausible.
- Replace or blend the current one-time daylight reflection environment as mood changes. Prefer a small set of prefiltered environments or bounded, occasional updates; avoid per-door cube captures every frame.
- Stars should reveal behind cloud opacity and strengthen as the sky darkens. Meteors should stay rare. If city lights are introduced, keep them distant, low contrast, and subordinate to the ribbon.
- Preserve the existing reduced-motion behavior and accessible project paths. The transition must not require rapid flashing, excessive zoom, or continuous motion to understand.

No ascent-to-night behavior, replacement artwork, or new visual effect was implemented in this review.

## Technical references

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): transmission target scaling and limitations of transparent-object sorting.
- [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html): higher per-pixel cost of physical shading features.
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): back-buffer scaling, compressed textures, and memory budgeting. These support the cost model, not an M2 performance guarantee.
