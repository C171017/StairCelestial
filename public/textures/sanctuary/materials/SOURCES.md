# Sanctuary stone maps

Downloaded October 5, 2026 from [ambientCG Marble 021](https://ambientcg.com/view?id=Marble021).

- Author/provider: ambientCG (Lennart Demes).
- License: CC0 1.0 Universal; [provider license](https://docs.ambientcg.com/license/).
- Package: `https://ambientcg.com/get?file=Marble021_4K-JPG.zip`.
- Creation method reported by provider: procedural. These are not claimed to be scans.
- The three original 4096 × 4096 JPEG files are retained without image edits.
- Color uses sRGB; roughness and height are linear data.
- Height is used for very shallow normal perturbation, not geometry displacement.
- Runtime shader adjusts vein contrast, scale, and material response on the
  marble ribbon. The metal frames do not load these stone maps.
- No remote URL is required at runtime; the maps ship with the site.

SHA-256:

| File | SHA-256 |
| --- | --- |
| Marble021_4K-JPG_Color.jpg | 819bef00ff76e751bcad618942f36e0200471fd08b68a3ef23cb755c2ad95d8b |
| Marble021_4K-JPG_Roughness.jpg | 8f9f214e4de35fab0460c94fcf6240176200c8c9b78c90db6c1fea81dbebec1f |
| Marble021_4K-JPG_Displacement.jpg | 960be54ababd3077c625a5cccdd8a58e070fa66115a5ff4d3e205fa59ab17721 |

Total source map size: 23,944,179 bytes. All originals remain alongside the
runtime derivatives with their recorded hashes intact.

## Runtime delivery, October 6, 2026

The homepage loads visually reviewed near-lossless WebP delivery at the same
4096 × 4096 dimensions. Sharp 0.34.5 / libwebp 1.6.0 encoded the JPEG sources
with `quality: 98, effort: 6`. Color-space assignments, sampling, anisotropy,
and the marble shader parameters stay as documented above.

| Map | Original bytes | Runtime bytes | Decoded MAE / max / p99, 8-bit |
| --- | ---: | ---: | --- |
| Color | 11,820,808 | 2,399,366 | 0.95159 / 50 / 4 |
| Roughness | 4,426,721 | 1,230,424 | 0.51963 / 5 / 2 |
| Displacement | 7,696,650 | 3,423,570 | 0.67357 / 6 / 3 |
| Total | 23,944,179 | 7,053,360 | |

This saves 16,890,819 bytes (70.54%) on the three runtime requests. Decoded
texture error was checked against the retained source pixels. Matched actual
homepage daylight and night captures preserved marble detail on visual review;
whole-image MAE was 0.01950 and 0.02769 out of 255, with maximum differences of
5 and 3. See [the rendered comparison measurements](../../../../docs/validation/performance-2026-10-06/stone-render-comparison.json)
and the adjacent `stone-{source,q98}-{day,night}.png` captures. These measurements
describe the reviewed views; decoded texture differences are quantified above.

| Runtime file | SHA-256 |
| --- | --- |
| Marble021_4K-JPG_Color-q98.webp | c486ffa86454e1210081f6ff744c2264ac4aee8438bfa9e3bdc9829894f2db6d |
| Marble021_4K-JPG_Roughness-q98.webp | 382e113c7910a1be041231a8e60d739b3d813cae8b46c00f434a2f522726f38f |
| Marble021_4K-JPG_Displacement-q98.webp | 03a23e1b5a93058c2a982321aef2adb030c137af6dbf9c9f12e5f576a7bef44a |

Reproduce with `node scripts/prepare-stone-textures.mjs`; verify existing assets
with `node scripts/prepare-stone-textures.mjs --check`. The script checks original
source hashes, unchanged dimensions/channels, byte savings, and bounds on decoded
MAE, maximum error, and the 99th percentile before publishing each derivative.
4K remains the selected source resolution.

Marble 012 was also previewed and rejected because its dense gray mottling was
less suited to the requested quiet finish. Its files are not included.
