# All three effects integrated on the homepage

October 6, 2026. The owner approved sailing clouds, flowing mist and shifting
light together, at a level that is apparent without looking artificial.

## Delivered behavior

- **Sailing clouds:** eight moving surfaces, split into two depths. Near/far
  speeds stay at 8.4/4.8 world units per second, with staggered 40/56-second
  periods and different source shapes. Nominal opacity is 0.78/0.50 instead
  of the isolated study's 0.94/0.68, reduced another 12% at full night.
- **Flowing mist:** eight thinner surfaces at 10.8/6.0 units per second, with
  32/46-second periods. Nominal opacity is 0.46/0.28 instead of 0.78/0.48.
  At noon it falls another 18%; at night another 24%, preserving stars and moon.
- **Shifting light:** one procedural source-aligned sphere. Lower strengths
  (dawn 0.44, dusk 0.36, day 0.07, night 0.12), 35% slower sway, and a smooth
  72-second envelope make it an occasional accent. A squared zero-strength
  solar/lunar handoff prevents a visible jump between sources.
- **Independent motion:** scrolling advances/reverses the established world
  clock. Wind, mist curl and shaft sway read ambient seconds only. Lighting
  and visibility follow the mood; wind never reverses with the clock.

The main scene explicitly mounts the balanced `all` mode. Individual studies
remain available, and `/motion-preview?effect=all` compares the deployed local
mix with the original sky. Existing ribbon/portal geometry, materials, focus,
shadow direction, stars, meteors, and equal four-mood timing are preserved.

## Resource and lifecycle handling

The former study component is now `SkyAtmosphericMotion.tsx`. `LayeredSky`
loads artwork once through `useCloudArtwork`; both fixed and moving layers
reuse those exact textures. There are no extra image downloads or duplicate
atlas decoders. Moving layers own only their geometry/materials. This avoids
the preview's additional low-resolution atlas and duplicate cirrus allocation.
The intro waits for the complete motion layer. Shared reduced-motion,
visibility and pause behavior still governs the ambient clock.

The additional scene contains 16 simple wind surfaces and one shaft sphere.
The main DPR limit, shadow resolution, and environment capture policy stay
unchanged. Environment reflections refresh on world-light changes rather
than re-rendering a cubemap every frame just to follow clouds.

## Browser evidence

Actual main-scene captures with matching seed and camera:
[daylight](daylight.jpg), [pink sunset](sunset.jpg), [moonlit night](night.jpg),
and [golden sunrise](sunrise.jpg).

[Idle clock sample](idle-clock.json): night remains exactly 00:00 while the
ambient clock advances from 125.473 to 249.659 seconds. The camera/ribbon are
held for this comparison; [later night](night-later.jpg) shows changed clouds.

[Full-orbit GPU probe](orbit-probe.json), using the complete balanced layer
at sunset with ambient time frozen at 12 seconds: **0/360 reverse mismatches**,
**zero full-loop pixel change**, and worst dense 0.01-degree block delta
**1.053/255**. This checks fixed-state orbit continuity, not every animation
time or physical device.

The first clean main-scene sample reported 13.33 ms/frame and 21 textures;
night reported 14.67 ms before concurrent orbit/build work. These are short
local browser observations, not a phone benchmark or sustained FPS promise.
No warning/error was observed after the main-scene reload.

## Automated validation

- [122 tests pass](tests.log), including existing day-cycle, wind recycling,
  projected speed, orbit, material geometry and reverse-input regressions.
- TypeScript and ESLint pass.
- [Production static export passes](build.log).
- Git whitespace validation passes.

No additional formal scored critique was run. The historical three-round
7.8/10 result is not a grade for this integration. Physical-device performance
and actual OS reduced-motion activation have not been re-tested in this pass.
