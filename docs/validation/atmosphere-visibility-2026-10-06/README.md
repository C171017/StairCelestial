# Visible atmosphere and equal-length moods

October 6, 2026. Follow-up to the owner's direct inspection of the previous
pass: most effects were too subtle, twilight was too brief, and cast shadows
had weakened. This record supersedes the October 5 timing/effect parameters.
There was no new formal scored review; the previous three-round review remains
a historical result, not a score for this revision.

## What changed

- **Equal mood length:** daylight, sunset, night and sunrise each dominate
  exactly two of the eight user-travel turns, approximately 25% of the journey.
  Each has a 1.12-turn full-color core, with 0.88-turn smooth overlaps to its
  neighbors. Blends have zero slope at their ends and no day-boundary jump.
  The astronomical cosine no longer determines palette duration, so sunrise
  and sunset are substantial experiences rather than brief twilight flashes.
- **Different color identities:** sunrise is amber/gold with cooler blue-gray
  shadows and a sun-aligned warm haze/glare. Sunset is rose/pink with lavender
  cloud shadows. Pearl daylight and moonlit night remain separate anchors.
- **Visible real shadows:** raised key raw height from
  `0.38 + 0.38 × elevation²` to `0.85 + 0.45 × elevation²`; retained its
  celestial azimuth. PCSS size falls from 150 to 50 at the existing 2048 map
  resolution and 20 samples. Unshadowed rectangular-light intensity falls
  from day/twilight/night 4.5/3.2/2.1 to 2.4/1.3/0.8. The previous low key
  threw much of each silhouette off the narrow ribbon, while excessive blur
  and fill washed out the remainder. No extra shadow light or render pass was
  added. The actual captures now show readable portal silhouettes on marble.
- **Richer stars:** star-cell occupancy increases from 0.6% to 3.3%, about
  5.5× as many candidate stars. Sizes, brightness and cool/warm tones vary,
  with small halos on selected brighter stars. Stars start visibly during
  pink sunset, reach full strength at night and fade through dawn. Clouds and
  moon still occlude them.
- **Clearer, more frequent shooting stars:** longer tapered trails, advancing
  bright heads and restrained blue-white glow. Eight events per 116 active
  seconds, 13–17 seconds between starts; the first starts after five active
  seconds. Five event directions favor the entrance hemisphere; the others
  reward orbit. At most one prominent trail is active. World mood controls
  visibility throughout sunset **and the full night**, fading toward sunrise.
  The latest request supersedes the earlier midnight cutoff. Reverse travel
  does not rewind the event clock or create bursts.
- **Cloud travel that can be seen:** one horizontal world wind is projected
  into the 16 existing fixed cirrus surfaces. Near/far layers move at different
  rates; opacity ceilings rise from 0.10/0.16 to 0.16/0.21. Projected landmarks
  in the normal desktop camera move 1.53–2.92% of viewport width over five
  seconds, roughly 20–37 pixels at 1280 width. This geometric check is
  supplemented by actual paired rendered frames and a recording below.
- **Seamless recycling:** each wisp uses two linear-premultiplied texture
  samples with complementary weights. A recognizable sample travels alone
  for 84% of the cycle; short eased handoffs conceal resets at zero weight.
  Feathered boundaries prevent clamped rectangular edges. Banks and immutable
  painter order stay in place. The extra sample replaces per-pixel wisp curl
  trigonometry and adds no new meshes, textures or draw calls.

The eased eight-turn navigation clock, idle time policy and existing
visibility/reduced-motion handling remain. This is art-directed timing and
lighting, not a physically exact astronomical simulation.

## Actual proof

- [12-second stationary-camera cloud recording](cloud-flow.webm), captured
  from the actual sky compositor at sunset. It also includes the first meteor.
  This is a sky-only recording so the moving vapor can be judged clearly;
  it is not generated animation or a camera pan.
- Same camera and palette at [0 seconds](cloud-0s.jpg) and [5 seconds](cloud-5s.jpg).
  The upper wisps visibly travel; the main banks and sun remain anchored.
- Matched normal-window [shadows before](before-shadows.jpg) and
  [shadows after](after-shadows.jpg). These captures retain the same seed,
  camera and sunset state; clouds and the central control continue animating.
- Desktop [day](day.jpg), [golden sunrise](sunrise.jpg),
  [pink sunset](sunset.jpg), [night](night.jpg).
- Compact 430 × 932 [sunrise](mobile-sunrise.jpg) and [night](mobile-night.jpg).
- [Stronger meteor at a controlled effect time](meteor.jpg).

## Validation and limits

- **121 tests pass.** New tests integrate all four mood weights over a cycle,
  count equal dominant travel, verify full-color cores and smooth boundaries,
  and check full-night meteor eligibility. Cloud regressions cover common
  wind direction, zero-contribution resets, long-running finite phases,
  parked clocks, projected speed and painter-order continuity.
- TypeScript, ESLint and production static export pass. See [test log](tests.log)
  and [build log](build.log).
- [Actual GPU continuity probe](orbit-probe.json): 0/360 reverse mismatches,
  zero full-loop pixel change, and worst dense 0.01° patch delta 0.914/255.
  The probe freezes the ambient phase; it is not a general guarantee about
  every moving state or device.
- The main-scene observed night frame sample was 13.33 ms at 1280 × 720 CSS
  and DPR 1.5; the larger normal-window sunset sample was 18.14 ms. These are
  short local Mac observations, not physical-phone or sustained thermal tests.
- Main rendering budgets remain DPR ≤1.5, transmission scale 0.85, 2048²
  shadows and 160 ms minimum environment-capture interval. No media files are
  added to the homepage's runtime downloads.
- Actual OS reduced-motion activation remains unverified; the existing
  paused-clock/lifecycle code is preserved and tested where covered. The sky
  remains composed when ambient time is held in the review route.

`/sky-review` now includes **Record cloud flow**, which records 12 seconds with
the current camera/mood fixed and ambient motion running, then restores the
previous pause and time override. It saves `sky-cloud-flow-review.webm` through
the browser. The in-app browser's download-event waiter timed out, but the
actual WebM was found in Downloads, copied here and verified as a nonempty
WebM. No recording success was inferred solely from the UI message.

No deployment, commit, new sound design or further numerical visual score is
part of this follow-up.
