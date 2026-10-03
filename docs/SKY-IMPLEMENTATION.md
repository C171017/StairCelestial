# Layered sky implementation — October 3, 2026

Implements the approved option A from [the design plan](SKY-DESIGN-PLAN.md). The homepage uses a fixed, cloud-free color plate, moving image-based cumulus and cirrus, restrained edge deformation, and world-anchored shooting stars. The video path is no longer mounted. Historical assets remain available for comparison.

## What is in the image, and what moves

- The static image contains blue sky, warm distant light, and broad haze. It contains no painted cloud formations that would remain behind as their moving copies travel.
- Four original cloud banks are individually upscaled to 4096 × 4096 and packed into an 8192 × 8192 RGBA atlas. Desktop loads a compressed 8K atlas; narrow screens load a compressed 4K atlas. Complete WebP fallbacks appear first.
- Separate soft cirrus artwork forms the high layer. The dedicated upscaler failed twice for this source; the renderer uses the original artwork with ordinary resampling. Do not describe those wisps as AI-upscaled.
- Clouds travel in a shared world-space wind. Small bounded sine deformation softens their contours. Deformation does not supply their travel. Wisps travel at 70% of the bank speed.
- A finite field of 64 bank patches and 16 wisp patches recycles beyond a zero-opacity boundary. Recycling is invisible from every camera angle. Orbit is unrestricted; patches do not reset when the camera crosses 360°.
- Shooting stars and glints have their own world positions and share the ambient clock. They appear behind cloud opacity. Reduced motion preserves composed clouds and disables motion/effects; page visibility pauses the clock independently of entrance state.

## Resolution and memory

The visual detail is allocated to the clouds, rather than to a very large uniform blue gradient. Each desktop cloud bank has 4096 square source pixels. The fixed plate is 1024 × 512; it contains no high-frequency detail. The wisps use 2048 × 1024 runtime artwork.

The durable **24,576 × 12,288 rendered reference** is `assets/sky/master-24k/layered-sky-24576.png` (69,083,269 bytes). It was projected from six 6144-square browser-rendered cube faces at cloud time 10 seconds. This is a high-resolution composite of the accepted artwork, not a claim that the model generated 24K native detail. Original lossless artwork is retained separately. The website does not download this reference.

The shipping 8K ETC1S atlas is 6,275,067 bytes; the 4K atlas is 1,840,118 bytes. GPU allocation differs from transfer size. At 8 bits per texel plus mipmaps, the atlas is approximately 85.3 MiB desktop / 21.3 MiB compact. Cirrus and fixed plate add approximately 13.3 MiB. The sky color/depth target adds about 24.7 MiB at 2560 × 1267, or 5.7 MiB at 393 × 852 with 1.5 DPR. These are allocation estimates, not a measurement of total browser or foreground-scene memory.

The complete sky is drawn once into a target, then presented as an opaque background. This allows the glass to refract both solid clouds and soft edges. Large desktop views use one pixel per CSS pixel; narrower views retain up to 1.5 DPR. Foreground silhouettes remain antialiased. Glass refraction sampling uses two thirds of the canvas dimensions. Source cloud detail stays at its accepted 4K-per-bank resolution regardless of this display sampling.

## Tools and reproducibility

- `scripts/prepare-cloud-artwork.mjs` restores original alpha, premultiplies in linear light, and creates the atlas/fallbacks. It asserts that all four atlas quadrants contain cloud opacity.
- `scripts/bake-sky-plate.mjs` generates the fixed plate from the shared palette and light direction.
- Basis Universal encoder v1.16.3 from the reputable `@gpu-tex-enc/basis` npm package produced KTX2 using `-ktx2 -q 255 -comp_level 2 -mipmap -mip_srgb -mip_clamp -y_flip`. The transcoder and Three license are in `public/basis/`.
- `/sky-review` provides pause, translation-only comparison, a fixed-time input, motion recording, and six-face master export. It is separate from the text-free homepage.
- `scripts/project-sky-master.py` projects the exported cube faces into an equirectangular reference in bounded strips. Face orientation is preserved in the export manifest. It does not run a generative model or invent further detail.
- [Asset manifest](validation/layered-sky/assets.json) records dimensions, sizes, SHA-256 hashes, and model job IDs.

## Generation briefs and upscale prompts

The built-in image generation tool produced a transparent 2 × 2 atlas of isolated pearl/champagne cumulus banks, using the previous panorama as a palette/lighting reference. The requested large dimensions were not guaranteed: actual source output was **1254 × 1254**, or 627 square pixels per bank. A separate transparent cirrus sheet was **1774 × 887**. These are summaries of the generation briefs, not verbatim prompt transcripts.

The first dedicated-upscale prompt was:

> Faithfully upscale this isolated cloud. Preserve all cloud silhouettes, colors, soft transparency and lighting. Recover fine natural cloud detail without new shapes or objects. Keep the transparent background.

Subsequent dedicated-upscale prompt:

> Faithfully upscale the cloud artwork. Preserve exact shapes, positions, colors and light. Improve fine natural cloud detail, no new objects or composition changes.

Preflight estimate was two credits per upscaled image. Four bank jobs completed. Two wisp jobs failed; an actual final account debit was not measured. No recursive generative pass was applied: the accepted individual bank resolution already exceeds typical displayed bank detail. The proposed 8K/16K/24K flattened-panorama trial was adapted to independent moving assets, so it must not be reported as having been performed unchanged.

## Review boundaries

Measured fixed-camera cloud-center travel was **53.73 CSS pixels over five seconds**, or **2.10% of the 2560-pixel view**. Actual motion and the shooting-star trail were captured. Native vertical scrolling carried the homepage from 0 to −4.1056 turns, then reversed to −0.9925 turns. Compact and desktop atlas loading, composed reduced motion, and resumed animation were verified. The 24K join's mean adjacent RGB difference was 0.1614/255 versus 0.1423/255 for neighboring columns, and its crop was visually continuous.

The final active desktop frame-time sample was 13.33 ms; compact samples were 13.33–13.43 ms. Earlier large/high-DPI and occluded samples were substantially slower, so these are spot checks rather than a universal frame-rate claim. Full details and limitations are retained in [review.json](validation/layered-sky/review.json). The final lint, production build, and all 67 tests passed.

Automated checks cover world movement, invisible recycling, long-duration finite positions, the existing orbit, effects, and entrance lifecycle. Browser review covers actual cloud travel, cloud silhouettes and alpha, foreground blending, forward/reverse orbit, desktop and phone-width layouts, and motion preferences. Browser viewport emulation does not establish physical-phone thermal or memory performance.

The intended artistic result is still subject to owner review. Four source bank silhouettes recur around the environment with differing scale, depth, and overlap; this is an image-layer system, not a volumetric weather simulation.

Saved review evidence: [desktop](validation/layered-sky/desktop.png), [phone-width view](validation/layered-sky/mobile.png), [shooting star](validation/layered-sky/shooting-star.png), and [fixed-camera motion recording](validation/layered-sky/fixed-camera.webm). The final normal-window sample is retained in [final-canvas.json](validation/layered-sky/final-canvas.json).
