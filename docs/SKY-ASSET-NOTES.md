# Sky assets: observations and reusable practice

Updated October 3, 2026. Read with [SKY-DESIGN-PLAN.md](SKY-DESIGN-PLAN.md). This file exists to preserve evidence across agent context resets. Observed outcomes below are separate from proposed future practice.

The approved layered implementation is documented in [SKY-IMPLEMENTATION.md](SKY-IMPLEMENTATION.md). The historical panorama master and four original model outputs have now been preserved under `assets/sky/source/`; they no longer depend on the temporary directory described below.

## Observations from the layered-image implementation

1. **Separate moving assets before spending on resolution.** We generated four isolated banks and a separate cirrus sheet using the old panorama's palette. The fixed plate contains no clouds. The flattened-panorama overlap workflow was therefore replaced by independent cloud-bank enlargement; an unchanged 8K/16K/24K panorama comparison was not run.
2. **The upscaler dropped alpha.** ByteDance 4K returned RGB even with `remove_bg: false` and a transparency-preservation prompt. We restored the original source alpha at output size. Alpha under fully transparent source pixels sometimes contained cyan RGB; inspect a correctly composited image before calling that a visible fringe.
3. **Premultiply exactly once, in linear light.** Runtime files contain linear-premultiplied RGB encoded into sRGB plus an alpha channel. Hardware performs sRGB decoding; the cloud shader unpremultiplies before ordinary blending. Do not also enable conventional texture premultiplication or explicitly decode sRGB again.
4. **Assert atlas coverage.** A trial Sharp `blend: 'source'` composition erased earlier quadrants. `blend: 'over'` on disjoint tiles retained all four; the preparation script now checks each quadrant's mean alpha. This was a real missing-cloud bug, not a shader or camera problem.
5. **Trial compressed assets visually.** The 8K UASTC trial was 24,587,574 bytes; accepted ETC1S was 6,275,067 bytes. Both were inspected in the scene. Comparisons also involved render-target changes, so those screenshots are not an isolated quantitative codec benchmark. Original PNG masters remain the fidelity reference.
6. **KTX2 orientation matters.** Encoding with `-y_flip` matched the TextureLoader fallback's orientation. Without an explicit orientation convention, an LOD upgrade can visibly flip artwork even when dimensions and alpha are correct.
7. **Cloud motion must be translation.** The accepted field has a shared world wind and slower cirrus. A simple moving horizontal cloud deck looked like a flat watery surface and was rejected. Heavy full-image warping was not needed; a small periodic sine warp only softens edges. The 18-second deformation phase is continuous at its boundary.
8. **Stable portal containers matter during live editing.** Keeping the separate sky scene in `useState` avoids replacing the React Three Fiber portal container during memo/effect replay. A prior offscreen trial lost its children after a hot update; a reload alone was not an adequate fix.
9. **Composite before glass transmission.** Transparent cloud edges do not enter Three's normal opaque transmission buffer. Rendering the whole sky once into a background target lets glass show the complete cloud image, including soft edges, and avoids repeated cloud drawing in the foreground passes.
10. **Measure the displayed tab.** Duplicate previews, GPU asset work, hidden/occluded browser windows, and large high-DPI targets distorted early frame-time readings. Record actual drawing-buffer size and viewport, close agent-created duplicate previews, and distinguish sky-only timing from the full glass scene. Phone-width browser results are not physical-phone results.
11. **Exported cube rows need a documented convention.** The browser exporter uses CubeCamera-style negative-Y up vectors and retains raw WebGL row order. Its manifest records every face basis. An additional generic vertical flip would invert the result. The strip projector uses these bases directly; the final 24K wrap crop was inspected.
12. **A bigger composite is not more native model detail.** The rendered reference is 24,576 × 12,288, while individual accepted cloud sources are 4096 square. No further recursive generation was performed. The delicate cirrus upscale failed twice, so the source wisps were retained rather than claiming a successful upscale.
13. **Distinguish emulation padding from page layout.** The 1920 × 1080 browser override produced a scaled capture with surrounding gray padding. The canvas bounds were 1920 × 1080 and the fixed development button was at Y=1026; a native-window capture showed the smaller emulated page inside the larger browser. Resetting the override restored a full-window image. Check DOM bounds and a normal-window capture before changing application geometry to compensate for test-surface scaling.

Durable inputs, raw model outputs, trial artifacts, and the rendered reference are in `assets/sky/`. Shipping textures are in `public/textures/sanctuary/layers/`. SHA-256 hashes and actual dimensions are in [the asset manifest](validation/layered-sky/assets.json). The review route and processing scripts are listed in the implementation note.

## Current sources and evidence

At planning inspection, repository HEAD was `8bf83d0`. Concurrent intro work existed in the checkout; the planning task did not change runtime code or regenerate assets.

- Original panorama: `public/textures/sanctuary/cloudscape-360.webp`, 1774 × 887, 242,002 bytes.
- Current high-resolution panorama: `cloudscape-360-8k.webp` in the same directory, 8192 × 4096, 1,313,292 bytes.
- Compact derivative: `cloudscape-360-4k.webp`, 4096 × 2048, 559,154 bytes.
- Separate room backdrop: `cloudscape-4k.webp`, 4096 × 2305, previously recorded at 172,818 bytes.
- Existing tooling: `scripts/prepare-sky-upscale.mjs`, `scripts/stitch-sky-upscale.mjs`, `scripts/prepare-sky-video.py`, and `scripts/check-sky-composite.py`.
- Video measurements: `docs/validation/sky-video-loop.json` retains raw/encoded evidence; `sky-video-displayed.json` describes the latest measured composite, not every historical blend.
- Upscale provenance copied into `docs/validation/sky-upscale/`: source manifest, stitch report, and source/output checksums. Numerical pilot observations below originate in the recorded implementation log, `WEB-PHASES.md`; no missing original pixel report has been invented.

Lossless panorama master and four model outputs were still present at `/private/tmp/sky-upscale-test/` during planning: `panorama-master.png` (~40 MiB) and `tile-0-4k.png` through `tile-3-4k.png` (~9–18 MiB each). These files are temporary and are NOT guaranteed to survive. Before another upscale, preserve them in durable, non-public asset storage with checksums. If they are unavailable, reconstruct from archived model outputs where possible; an 8K WebP can serve as a fallback source but has already undergone lossy encoding. Notes and checksums alone are not an asset backup.

## What happened in the first image pass

1. Image generation was asked for a larger 2:1 panorama, but returned **1774 × 887**, including after a detail request specifying 3840 × 1920. Requested dimensions are not output dimensions. Inspect decoded files, never infer resolution from prompt text or a model label.
2. Two overlapping **887 × 887** crops were tested first with Higgsfield MCP `bytedance_image_upscale`, `4k`, background removal disabled. Both returned **4096 × 4096**. Visual comparison to Lanczos enlargement found clearer cloud detail without an obvious macro-composition change.
3. Recorded downsampled mean RGB differences were **3.62 and 3.35 /255**; overlap disagreement was **3.48 /255**. These were fidelity/alignment screens, not scores of perceptual quality or proof of recovered real detail.
4. After those tests, the remaining two panorama crops and the separate flat backdrop were processed. One panorama job failed and one retry succeeded. Historical account balance moved **2999 → 2989**, ten credits net for five successful images. This is history, not a future price guarantee or a claim of unlimited generation.
5. Four overlapping outputs formed an **8192 × 4096** master. The encoded panorama was about **1.3 MB**, and the smaller derivative about **559 KB**. A small download still expands to a much larger GPU texture.

Historical upscale prompt:

> Faithfully upscale this cloud sky to 4K. Preserve the exact cloud silhouettes, positions, colors and lighting. Recover fine natural cloud detail without inventing new objects or changing the composition.

Successful job IDs: `7fffad1a-f84c-46ae-9902-bd4d89109ab0`, `e689ed06-d54a-45dd-b81a-ca78f916c921`, `d576f815-ae0b-48fc-9da4-01f246f73c5e`, `ebc18308-99dc-43ba-bcaa-2460d88b4c1b`, `8d927100-3c1a-4de5-9198-2a0c77b2379c`. The old log did not map every ID to a specific tile; do not invent that mapping.

## Stitching practices that worked

- The first tiles covered approximately half the original panorama width and overlapped by roughly 50%. A dedicated wrapping crop included both sides of longitude 0°/360° inside one model input. An edge-only crop cannot see the context on the other side.
- The original panorama join was repaired inside that wrapping input. The output was not repaired a second time in the runtime shader. Duplicate seam feathering would soften the result again.
- Stitching used smooth sinusoidal overlap weights, normalized across contributors, in **linear light**. Blending sRGB byte values directly is not equivalent.
- Retain fractional placement after scaling. The original quarter starts were integer source positions `0, 443, 887, 1330`; multiplying by a non-integer scale produces fractional output coordinates. The stitcher interpolates them rather than rounding every placement independently. This prevents avoidable registration errors; it does not align arbitrary model-induced geometric drift.
- Measured master wrap-column difference was **0.30086 /255**, versus **0.32829 /255** in neighboring columns. Compare boundary gradients with neighboring gradients, not just zero. A real continuous edge need not have identical adjacent pixels.
- Final encoded wrap crops were also visually inspected. A smooth source master is not proof that a lossy export or its mip levels are seamless.
- The current scripts are specialized for four horizontal square crops and fixed 8K/4K output. They remove alpha. **Do not run them unchanged on new RGBA cloud layers or assume they implement a general 2D tile pyramid.** Extend/replace them with explicit X/Y placement, overlap, output scale, alpha handling, and per-level gutters.

## Failures and limits learned from video

- MiniMax H3 pilot job: `c7c90341-187f-4ba6-b9df-12b847fe59e7`; ten seconds/2K request, same reference at both endpoints. Preflight estimate was twenty credits. Source output was **2720 × 1344**, not exact 2:1. Processing preserved the entire frame and remapped the small aspect difference to 2720 × 1360.
- Matching first/last references did not automatically produce a tested loop. The first ten seconds were blended with a two-second linear-light smoothstep overlap, producing 192 frames/eight seconds. Longitude edges were repaired on every frame; the two sizes encoded directly from the repaired RGB frames.
- Desktop video is **8,609,827 bytes**; compact is **5,736,283 bytes**. At the final 0.8 playback rate the loop takes ten seconds.
- Compact raw video retains two conservative endpoint position flags, roughly 1.03/255; its velocity and spatial checks pass. Both displayed composites pass the published screens. Preserve those raw flags rather than silently loosening thresholds.
- Most importantly, **playing + seamless did not mean the requested motion was achieved**. User review and later inspection found mostly local cloud morphing, not sustained directional travel. Increasing the blend from 32–46% to 65–80% and speed from 0.5 to 0.8 improved visibility but did not turn morphing into advection.
- Future acceptance must include a locked-camera demonstration of recognizable features travelling. A screenshot, elapsed video time, or a passing endpoint metric alone is insufficient.

## Runtime findings worth keeping

- In installed Three r175, the custom video sampler needed explicit `sRGBTransferEOTF` decoding before linear-light blending. This is a finding about that path/version; do not blindly apply it again to color textures already hardware-decoded from sRGB.
- The player waits for an actually decoded frame and preserves the last frame while buffering. Missing media or blocked autoplay must leave a valid still sky, not black pixels. It releases its decoder/texture/frame callbacks on teardown.
- Strict Mode/Fast Refresh effect replay previously reset entrance state to `hidden` after the one-shot readiness callback had fired. `introSession.ts` now distinguishes replay from a real exit, and the eye overlay preserves a completed handoff. Ambient sky playback is independent of the entrance's input gate. Preserve these fixes in a new effect renderer.
- Reduced motion was verified in Chrome: video disabled with zero blend, still sky remained visible, and removing emulation resumed playback. A new layered sky needs a composed frozen cloud state too.
- Previous 393 × 852 checks were desktop-browser viewport tests, not physical-phone thermal, memory, touch, or frame-rate benchmarks.
- The same checkout has been edited by other chats. Transient compile/HMR errors occurred during unrelated source changes. Record the tested revision/time, inspect errors after a clean reload, and do not claim a stale tab reflects the final code. Preserve unrelated changes.

## Rules proposed for the next asset pass

1. Keep one canonical palette, lighting direction, composition, and projection reference. Separate static plate and moving clouds before mass upscaling, so resources are spent on the intended layers.
2. Keep every earlier master. Never make the only high-quality copy the input to a destructive or lossy rewrite. Store generation metadata and checksums beside a complete durable manifest.
3. Use overlapping context on both axes when a crop grid has multiple rows. Keep longitude wrap neighbors and polar treatment explicit. Do not infer depth just from a horizontal stripe cut through the flattened panorama.
4. Trial three crops before a batch: adjacent wrap pair plus difficult cloud detail. Compare one pass against an additional recursive pass and a simple resize control in matched camera views.
5. Recursive enlargement can amplify AI texture, noise, plastic edges, and lighting drift. Preserve original macro silhouettes and low-frequency color, stop when visible gains plateau, and regenerate/repaint a specific bad region instead of repeatedly upscaling its defect.
6. For alpha clouds, avoid blue matte fringes and independently changing RGB/alpha contours. Extend valid cloud RGB into transparent borders, filter/composite in a consistent premultiplied linear representation, and inspect on both sky colors. Choose export alpha conventions deliberately.
7. Reconstruct what lies behind each moving formation. Keeping the same formation painted into the static plate creates obvious doubles when it moves.
8. Separate continuous world-space translation from subtle edge deformation. Fade/recycle without pop; ensure periodic lookup works at all times, directions, and mip levels. World-fixed lighting should not rotate with a texture patch.
9. Dimensions, download bytes, GPU allocation, fidelity metrics, and visible quality are five different measurements. Record each separately. Asset tiling saves memory only when residency is bounded; loading every tile reproduces the original cost.
10. Maintain a dated record per pilot: input hashes; crop rectangles/gutters; prompt; model/settings; job IDs; actual cost if available; output dimensions; registration transform; seam/color/alpha checks; normal-size screenshots; motion capture; device/viewport/DPR; decision and rejected variants.

## Primary references

- [Valve flow-map presentation](https://cdn.cloudflare.steamstatic.com/apps/valve/2010/siggraph2010_vlachos_waterflow.pdf): short deformation intervals, offset phases, and repetition/pulsing mitigation. Cloud use is an adaptation requiring validation.
- [Three.js textures](https://threejs.org/manual/pages/textures.html): approximate uncompressed allocation depends on dimensions and mipmaps, not compressed download size.
- [Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html): detect GPU support before choosing/transcoding compressed textures.
- [Topaz core models](https://docs.topazlabs.com/topaz-gigapixel/enhancements/ai-models/core-models): fidelity-oriented models are useful comparison candidates; model names and access can change.
