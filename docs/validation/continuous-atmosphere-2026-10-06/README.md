# Continuous atmosphere and coherent wind

October 6, 2026. The four concept images now describe peak moments on a
continuous cycle, rather than four held appearances separated by transitions.

## Timing and motion

The eight-turn journey uses the complete two turns between each pair of
peaks for a cosine crossfade. Each palette contributes exactly one quarter
of the total cycle and dominates for the same travel distance. Color and
its first derivative are continuous at every peak and the cycle boundary.
Downward scrolling advances noon → pink sunset → night → golden sunrise.
Reverse scrolling reverses that clock; wind continues independently.

The background banks and moving banks reuse the same uploaded atlas. All
80 background bank/cirrus cards now translate their complete RGBA silhouettes.
Their card positions and painter ordering remain stable around the orbit.
Texture samples stay within their atlas tiles, with zero-weight resets and
staggered handoffs; no extra cloud artwork or duplicate texture upload is needed.

| Layer | Near / far wind multiplier | Near / far loop seconds |
| --- | --- | --- |
| Large background banks | 0.6 / 0.85 | 100 / 120 |
| Cirrus | 1.7 / 2.8 | 60 / 68 |
| Sailing clouds | 5.4 / 3.2 | 62 / 84 |
| Mist | 6.8 / 4.0 | 50 / 69 |

These multiply the common `(1, 0, 0.18)` world-wind vector before projection
onto each card. Distant cirrus/banks remain slower in apparent screen travel.
Sailing clouds and mist are about 33–37% slower than the previous integration;
mist curl is also 35% slower. Pause, hidden-page, and reduced-motion handling
continue to use the existing shared ambient clock.

## Photographic references

- [Hannah Reding — pink clouds over the ocean at sunset](https://unsplash.com/photos/pink-clouds-over-the-ocean-at-sunset--hb1Oqyyd80): rose-peach illuminated clouds, lavender shadow, and a cool upper sky. Viewed directly as a photograph; used as color and contrast guidance.
- [Bernd Dittrich — sun above the clouds](https://unsplash.com/fr/photos/le-soleil-brille-au-dessus-des-nuages-dans-le-ciel-wVXdxyz2gVY): luminous amber horizon, honey highlights, and cooler shadowed clouds beneath it. Viewed directly as a photograph; used to concentrate the warmth around the low sun.

The existing scene artwork is retained. The shared sky/cloud/light palette
and directional sky glow provide the new color treatment. This is an artistic
interpretation of the references, not a claim of exact photographic matching.

## Validation

- 123 tests pass, including continuous change through formerly held intervals,
  equal integrated weights, forward/reverse ordering, smooth color velocity,
  shared wind direction for every bank, and hidden texture reset continuity.
- TypeScript, ESLint, production static export, and Git whitespace checks pass.
- Main-scene browser captures: [pink sunset](sunset.jpg), [golden sunrise](sunrise.jpg), and [just after sunrise at 06:45](after-sunrise.jpg).
- Wide desktop comparison: [sunset](sunset-desktop.jpg) and [sunrise](sunrise-desktop.jpg).
- [Stationary-camera wind sample](wind-clock.json): world time remains 06:00 while ambient time advances from 81.303 to 126.065 seconds. Compare [start](wind-start.jpg) and [later](wind-later.jpg) for translated cloud silhouettes.
- [Real downward-scroll check](scroll-check.json) advances the unforced main scene from 12:00 to 13:12 (0.4 turns). Main-scene screenshots cover both the 583 × 1344 compact layout and the 1280 × 720 desktop layout.
- The live canvas reports all 80 background cards in `continuous-wind-banks-and-cirrus` mode, with the full integrated motion stack and 21 textures. No browser warnings or shader errors were observed in the inspected run.

Visual review is local browser inspection, not user acceptance or a new formal
scored review. Physical-device performance and OS reduced-motion activation
were not re-tested in this pass.
