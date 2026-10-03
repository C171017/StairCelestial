# Static sky, flowing clouds, and shooting stars

Implementation update: the user selected option A. See [SKY-IMPLEMENTATION.md](SKY-IMPLEMENTATION.md) for the resulting architecture, actual asset sizes, validation, and adaptations to this original proposal. The scores below remain planning judgments, not measured performance results.

Status: proposal for review, October 3, 2026. This phase changes documentation only. It does not replace the live sky or submit image/video generation jobs.

Read [SKY-ASSET-NOTES.md](SKY-ASSET-NOTES.md) before producing assets. That file distinguishes observations from proposals and preserves the previous experiments.

## Intended result

A bright blue/champagne atmosphere with recognizable clouds visibly travelling in a sustained wind, occasional shooting stars, and unlimited camera orbit. Clouds must move while the camera is stationary. Camera movement and wind are independent. A technically playing texture, or clouds merely inflating and dissolving in place, does not satisfy this requirement.

Recommendation: option A, artwork-based cloud layers with world-space translation and restrained local deformation. Start with two cloud layers. Add option B's small amount of volume only if the prototype cannot preserve the large cumulus silhouettes through the orbit.

## What is static and what moves

- **Blue sky and broad atmospheric color:** static clean panorama, including the broad warm horizon glow. Use a stable world orientation. These are low-frequency features and do not need the largest runtime textures.
- **Distant horizon haze:** predominantly static, soft, and without recognizable cloud silhouettes that will also occur in a moving layer. It fills distant gaps; it must not become a conspicuous stationary cloud wall.
- **Large cloud sea and recognizable cumulus towers:** moving cloud artwork, separated from the clean plate. Slow coherent travel, with the largest/nearest structures providing readable displacement and depth. Do not leave their original painted copies behind.
- **High wisps and cirrus:** a second moving layer, following the same prevailing world wind with a different speed and apparent distance. Slight stretching/curling comes after translation works.
- **Cloud edge softness and local wisps:** small deformation in the cloud shader, masked to appropriate features. Never distort the whole flattened sky image.
- **Shooting stars:** separate world-space trails with an actual advancing head, tapered tail, and fade. Distribute events around the full sky; keep some visible from the entrance. Start from the existing working effect, then adjust scheduling after the cloud composition is settled.
- **Optional occasional effects:** sparse, slow glints or gentle changes in cloud-edge light. No broad flashing exposure changes or constant foreground sparkles. Their inclusion depends on whether they improve the pilot.
- **Scene lighting:** a fixed broad light direction and stable ambient color. A cloud travelling across the scene must not carry a different sky gradient or a rectangular lighting patch with it.

The existing flattened panorama cannot supply all these layers by merely sliding copies over one another. Separation requires a reconstructed background and believable cloud opacity. Blue sky showing through thin clouds is part of a composite, not automatically the cloud's intrinsic RGB color. Inspect edge matting on both blue and warm backgrounds.

## Ranked options

These are planning estimates, not measured quality, FPS, model success rates, or benchmark results. Use roughly ±6 points as judgement uncertainty; A/B/C can change order after a pilot. Every option includes a static sky, flowing clouds, separate shooting stars, and higher-resolution artwork.

Weights: visible directional cloud travel **30%**, natural appearance/art control **25%**, coherent unrestricted orbit **20%**, expected mobile efficiency **15%**, implementation/reliability simplicity **10%**. Each criterion is 0–10, higher is better. Total /100 = 3M + 2.5A + 2C + 1.5P + E. Scores of 5 mean substantial compromises; 8 means a strong fit with manageable work; 10 means an excellent fit to that criterion, not guaranteed production quality.

1. **A — Layered cloud artwork + translation + restrained flow: 87/100 (86.5 unrounded).** Criterion scores M/A/C/P/E = 9/9/9/8/7. Clean static sky; two or three cloud depth layers on world-space surfaces, with continuous travel and a small two-phase flow distortion. Best balance of the current painterly cloud aesthetic, clear movement, seamless coverage, and mobile cost. Main risks: matting, flat-looking towers, flow crossfade ghosting, and transparent overdraw. Medium implementation effort. Recommended first.
2. **B — A plus a few volumetric cloud masses: 83/100.** Scores = 9.5/9/9/6/5. Keep distant clouds image-based; use a small number of actual density volumes for the most prominent billowing formations. Better close parallax and shape evolution. More shader, lighting, compositing, and performance work, with a greater risk of the volumes looking different from the artwork. High effort. Escalation if A's silhouettes look flat, not an automatic addition.
3. **C — Translated cloud cutouts with minimal deformation: 82/100 (81.5 unrounded).** Scores = 8.5/8/8/8/8. Clean sky plus a finite set of cloud patches at different depths, translated by wind. Easiest convincing movement baseline; also a useful lower-cost fallback. Risks: visible card orientation, repetition, and clouds feeling like rigid paper shapes. Low-to-medium effort. Compare directly against A with deformation disabled so complexity has to earn its place.
4. **D — Mostly procedural volumetric clouds over a static sky: 76/100 (76.25 unrounded).** Scores = 10/7.5/10/3/3. Most physically flexible cloud evolution and 360° depth; hardest to match the current image style and keep smooth on ordinary phones. Very high effort, with substantial optimization and lighting work. Not recommended for the first implementation. Desktop game-engine demonstrations do not establish a browser/mobile frame budget.

The ranking favors the combined brief. If maximum physical realism becomes more important than mobile performance and implementation risk, B or D becomes more attractive. Simply rotating or warping the entire panorama is excluded: it moves the horizon/lighting and does not provide convincing separated cloud travel.

## How option A should behave

1. Keep the clean sky in world orientation, outside the scrolling ribbon's transforms.
2. Give cloud layers a shared world-space wind vector. Sample their density/opacity at `worldPosition - wind * elapsedTime`, with controlled speed variation by layer. A camera orbit changes the projection; it does not alter the wind phase. Apparent direction naturally changes as the viewer looks upwind/downwind.
3. For the pilot, test a shallow cloud deck below the camera and a high wisp layer. Use world-space ray/surface intersections or fixed curved patches appropriate to each layer; do not treat longitude scrolling as universal physical wind. Fade the deck into distant haze near grazing angles, where plane sampling becomes unstable. Preserve rising cumulus silhouettes with depth-aware curved patches. If this requires a large collection of obvious cards, reconsider B.
4. Use periodic texture coordinates and finite recycled coverage. Recycle only where the change is invisible or covered, including during rapid orbit; never clamp the camera to hide a seam. Periodic lookup must be continuous at tile boundaries. Keep elapsed phases bounded without resetting visible geometry or advancing paused effects on return.
5. First establish translation. Then test subtle flow-map deformation with two offset phases and soft weights. This borrows a texture-flow technique demonstrated by Valve; cloud suitability remains a prototype question. Limit deformation before the clouds become rubbery; inspect for periodic pulsing and doubled edges.
6. Match all layers' color space, cloud warmth, blue shadow tint, light direction, and distance haze. Blend cloud alpha in linear light with consistent premultiplication and correct edge RGB. Keep cloud rendering within one controlled compositing path where practical, rather than dozens of sorting-sensitive transparent planes.
7. Composite distant shooting stars behind cloud opacity, so a meteor dims/disappears behind a cloud instead of always drawing on top. Preserve foreground door/ribbon occlusion. In the initial upper sky, aim for one plainly visible meteor within 5–10 seconds and subsequent sparse events; validate readability against daylight.

## Resolution target: 24K authoring master, selective runtime detail

Current panorama: 8192 × 4096, derived from a 1774 × 887 reference using four overlapping upscaled crops. File dimensions are confirmed locally. The source is already reconstructed artwork; another enlargement cannot recover unknown ground-truth detail.

Proposed final authoring target: **24,576 × 12,288**, three times the current width/height and nine times its pixel count. Deliver both a layered master and a flattened at-rest panoramic reference at this resolution. Preserve the complete 360° composition. Intermediate quality checkpoint: 16,384 × 8192. Consider 32K only if a controlled viewport comparison demonstrates a useful gain.

The current camera has a 42° vertical field of view and a render-DPR cap of 1.5. An approximate central-view panorama-width requirement for one panorama texel per rendered pixel is `π × renderedHeight / tan(21°)`. This assumes a distant equirectangular environment; actual shell offset, latitude, filtering, and cloud-layer projection require visual checks.

- 1920 × 1080 at DPR 1.5: about **13,258 panorama pixels wide**. A 16K source has reasonable headroom.
- 2560 × 1440 at DPR 1.5: about **17,678 wide**. A 24K master is a more useful high-quality target.
- 393 × 852 at DPR 1.5: about **10,459 wide**. A narrow phone view does not automatically make a 4K panorama sharp. Prioritize sharp visible cloud regions rather than selecting detail solely by CSS width.

Do not upload a 24K RGBA panorama as one ordinary texture. Approximate RGBA8 allocation including a full mip chain: 8K ≈171 MiB, 16K ≈683 MiB, 24K ≈1536 MiB. These are allocation estimates, not measured total scene memory. WebP download size does not represent GPU residency.

Runtime proposal: a small complete fallback plus tiled higher-resolution detail; preload a margin around the visible region and account for both camera orbit and cloud travel. Release unused tiles under a bounded cache. Prepare neighbor-derived gutters and mipmaps so tile edges cannot appear while moving. Test KTX2/Basis GPU compression, especially UASTC for delicate cloud alpha, against uncompressed reference crops. Detect actual GPU support and texture-size limits. Compression can damage wisps or gradients; accept it only after inspection.

Initial sky-only residency targets: ≤128 MiB desktop and ≤48 MiB mobile, including cloud masks and fallback textures. These are design budgets to validate, not promises. The smooth static blue plate can remain low-resolution at runtime while moving cloud silhouettes receive the high-resolution texels. Preserve a still composition for reduced motion; a static cloud-free plate alone would lose the intended scene.

## Small pilot before broad upscaling

1. Preserve originals, lossless masters, masks, prompts, model settings, output dimensions, checksums, and placement manifests before new work. Archive assets currently in `/private/tmp` into durable project asset storage during implementation; those paths are not a backup.
2. Prepare a clean plate and two moving cloud layers at modest resolution. Begin with one recognizable cumulus formation and a wisp region, then extend enough around the sphere to test the join. No full-resolution batch yet.
3. Run the motion pilot in an isolated review route/component. Compare C's translation-only baseline with A's restrained deformation using the same assets, lighting, and camera. Choose by visible cloud travel and naturalness while parked and while orbiting.
4. Pilot upscaling on **three crops**: two neighboring overlapping crops that include the panorama join, plus a difficult cloud/wisp detail region. Compare the existing dedicated ByteDance route against ordinary resampling as a control. Add a fidelity-oriented alternative only if the first result has specific defects. Recheck available models and price before generation; historical credit use is not a current quote.
5. Test one conservative pass versus one additional recursive pass on this same small set. Retain the original reference as the composition/color anchor at every stage. Approve further passes only when they improve normal-size rendered detail without halos, invented cloudlets, silhouette drift, or visible tile differences. More pixels or stronger noise are not improvement.
6. Once the layer separation, motion, and crop pilots pass, assemble 16K, compare against 8K in identical camera views, and produce the proposed 24K master if the added detail is useful. Rebuild moving-layer masks from the accepted aligned result; do not independently hallucinate cloud RGB and alpha contours.
7. Export runtime tiles/mips and fallbacks. Replace the live video path only after the new scene passes the acceptance checks and is reviewed. Keep the prior assets as a rollback reference rather than deleting them.

## Acceptance gates

- **Visible travel:** with camera and ribbon reference fixed, a tracked cloud feature moves roughly 2–5% of viewport width over five seconds in representative crosswind views. This is an initial artistic tuning range, not a demand for identical screen displacement in every direction. Must look like wind, not a camera pan or shape-only morph.
- **Natural layering:** identifiable wisps and cloud masses move; no stationary duplicate underneath, blue rectangular fringes, rubber deformation, pulsing opacity, exposed patch edges, or inconsistent sunlight. Compare at normal viewing size before zoomed crops.
- **360° continuity:** slow and fast forward/reverse orbits, at least three complete turns each way, plus a ten-minute stationary run. Explicitly test tile wraps, deformation phase changes, texture LOD swaps, and cloud recycling. No camera bounds or hidden jump.
- **Sharpness:** compare locked 8K/16K/24K views at 1920 × 1080, 2560 × 1440, and 393 × 852 with known DPR. Cloud-edge/detail gains must survive the actual projection and compression. Stop recursion when the higher tier adds artifacts or no useful visible gain.
- **Initial fidelity screens:** after alignment/downsampling, dominant cloud silhouettes should shift less than 0.5% of crop width; mean RGB drift/overlap disagreement near or below 5/255 is a useful warning screen based on earlier crops. These are proposed thresholds, not universal pass criteria. Human visual failure overrides a numerical pass.
- **Performance:** warm-run target ≥55 fps desktop, ≥30 fps on a representative physical phone, with no persistent upload stalls or runaway memory. Compare frame times against the current still-only scene using identical viewport/DPR, record device/browser and shader cost, and lower layer count/detail if needed. Browser resizing is not physical-phone validation.
- **Lifecycle:** fresh entrance, reload, live update, background/resume, reduced motion, loading failure, and quick resizing. Background sky must not depend on the entrance interaction phase. Under reduced motion, keep a composed still with no moving clouds or meteors.
- **Review evidence:** provide short fixed-camera motion capture, an orbit capture, matched sharpness crops, and recorded performance/asset metadata. A still screenshot or `playing` status cannot demonstrate successful flowing clouds.

## Sources informing the proposal

- [Valve: Water Flow in Left 4 Dead 2 and Portal 2](https://cdn.cloudflare.steamstatic.com/apps/valve/2010/siggraph2010_vlachos_waterflow.pdf) — bounded distortion, offset phases, and repetition/pulsing pitfalls. Applying this to cloud opacity/color is a proposed adaptation, not evidence that it will already look right.
- [Three.js texture memory guidance](https://threejs.org/manual/pages/textures.html) and [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) — dimension-driven GPU allocation and supported compression/transcoding.
- [Guerrilla: real-time volumetric cloudscapes](https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn) — a primary example of the modeling/lighting/optimization scope of full volumes; its engine performance cannot be transferred to this website.
- [Higgsfield image upscaler](https://higgsfield.ai/ai-image-upscaler) and [Topaz core-model guidance](https://docs.topazlabs.com/topaz-gigapixel/enhancements/ai-models/core-models) — candidate tooling and the distinction between fidelity-oriented enlargement and creative reconstruction. Availability through this account's tools must be checked when implementing.
