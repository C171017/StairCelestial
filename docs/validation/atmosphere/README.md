# Atmosphere implementation and three-round review

Historical October 5 baseline. The owner's October 6 correction and current
runtime parameters are documented in [Equal moods and visible effects](../atmosphere-visibility-2026-10-06/README.md).
The scores here do not grade that later revision.

October 5, 2026. Local implementation of the selected moving celestial paths
and atmosphere effects. No deployment or commit was requested or performed.

## Result and review limit

The owner chose rank 1 and relaxed strict mathematical/physical synchronization
in favor of visual coherence and performance. The local app now has distinct
red/gold dawn, pearl daylight, pink sunset and moonlit night, with world-space
sun/moon arcs, flowing horizon wisps, sparse stars, gentle twinkling, a moon
halo and evening-only shooting stars.

An independent **GPT-6 Astra, high reasoning** agent reviewed actual browser
captures in exactly three formal rounds. Its requested calibration was
8/10 = award-level professional design quality. This is a subjective benchmark,
not an award claim. The final result **did not reach 8.0**; visual iteration
stopped at the owner's three-round limit.

| Round | Atmosphere 25% | Materials 25% | Composition 25% | Motion 15% | Celestial restraint 10% | Overall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 7.4 | 6.6 | 7.2 | 7.4 | 8.0 | **7.2** |
| 2 | 7.6 | 6.8 | 7.7 | 7.8 | 8.2 | **7.5** |
| 3 | 7.8 | 7.4 | 8.0 | 7.8 | 8.2 | **7.8** |

Round 1 identified a flat dark central control, muted frame/trim definition,
compact overlaps and broadly tinted twilight clouds. Round 2 improved spacing
and material edges but overfilled the control into an almost flat white
diamond. The final pass restored its adjacent-plane contrast, coupled its
reflection tint and brightness to the atmosphere, limited idle sway to about
±15 degrees, and localized twilight haze toward the sun.

The final critic found the control solid and the compact composition resolved,
but its broad surfaces still read more matte than platinum. Dawn remains more
peach/gold than the reference's richer red/gold, and cloud lighting still has
some uniform tint. Those are remaining art-direction limitations, not passed
acceptance claims. Motion scores include stated evidence limits below.

## Actual final screenshots

The files below are browser captures, not generated images. Desktop captures
use 1280 × 720 CSS pixels; compact captures use 430 × 932. Review seed 8 and a
still camera keep the composition comparable while the control/clouds move.

- [Pearl daylight](round-3/day.jpg)
- [Pink sunset](round-3/sunset.jpg)
- [Red/gold sunrise](round-3/sunrise.jpg)
- [Moonlit night](round-3/night.jpg)
- [Compact daylight](round-3/mobile-day.jpg)
- [Compact night](round-3/mobile-night.jpg)
- [Portal material close-up, round 2](round-2/frame-close.jpg)
- [Meteor in the composited sky, round 2](round-2/meteor.jpg)

The earlier `round-1/sky-debug-night.jpg` records a diagnosed missing-uniform
bug and is deliberately not a final result. The original generated
[four-mood board](../../../assets/design-directions/atmosphere/four-moods.png)
remains an art-direction reference only.

## Implementation

- **Timing and color:** retain the smooth reversible eight-user-turn clock and
  parked world time during idle travel. Dawn and sunset have separate palettes.
  Colors, light, reflection tint and celestial visibility share one atmosphere
  snapshot. Clock easing and elevated shadow lights are deliberate visual
  approximations, accepted by the owner's revised brief.
- **Celestial paths:** low art-directed world-space arcs fit the current
  downward-looking camera. Compact views use a narrower world-space arc;
  freely orbiting can still take a body out of view. This is not a lunar
  calendar or physically exact sun/moon opposition.
- **Sky rendering:** sun, procedural lunar texture/halo and stars are shaded
  on the existing sky sphere behind cloud alpha. Only the small lunar region
  evaluates surface noise. A minority of stars vary by less than 8%; ambient
  time freezes under the existing visibility/reduced-motion handling.
- **Uniform fix:** React Three Fiber copied scalar uniform wrappers, so
  updating the original memo changed colors/vectors but left visibility
  scalars at their defaults. `CleanSkyPlate` now writes the actual material's
  uniform table. Browser telemetry and visible sun/moon/stars verified the fix.
- **Clouds:** preserve all 64 bank placements and their relative painter
  order. The 16 existing cirrus cards sit at heights 40–90 with near/far opacity
  ceilings 0.10/0.16. Complete RGBA artwork drifts inside their fixed feathered
  surfaces in two bounded 4/6-minute cycles. This is gentle cyclical drift,
  not infinite advection or volumetric simulation. No extra textures/cards
  were added. Twilight sunward crest/edge lighting uses existing luminance,
  alpha and vertex direction, with no additional texture samples.
- **Meteors:** five non-overlapping world trails per 200 active evening seconds,
  spaced 38–42 seconds apart after the first event. Visibility builds after
  18:00 and fades out by midnight. The event clock pauses outside that window
  without rewinding or bursting on reverse travel. Hidden/reduced-motion
  behavior uses the existing lifecycle handling.
- **Materials and control:** black-metal roughness 0.18/environment multiplier
  1.18; fine gold reveal `#c9ac78`, roughness 0.23/environment multiplier 1.28.
  Marble maps/geometry are preserved. The platinum control uses asymmetric
  local HDR reflections, atmosphere tint, and a moderated direct-specular
  response. Compact size is 12% smaller and the settled anchor 0.65 scene units
  lower. Full entrance turns and the reversible tetrahedron/cube audio morph
  remain; settled idle motion is a restrained ±15-degree sway.

## Performance and validation

- New sky effects reuse the existing sphere, textures and cloud cards. No new
  media downloads or volumetric passes were added.
- Main canvas DPR is capped at 1.5; glass transmission scale is 0.85. Shadow
  maps are 2048² with 20 PCSS samples. Broad environment captures remain 512²
  and update at most once per 160 ms during travel, while direct light updates
  every frame.
- On the local browser reporting Apple M6, initial evening samples at DPR 2
  were about 30 ms/frame. After cost reductions, one full-scene night sample
  was **15.13 ms/frame** at DPR 1.5. These short development-browser samples
  are not sustained FPS, battery, thermal or physical-phone guarantees.
- **115 automated tests pass**, including new distinct-dawn/dusk, meteor-window,
  reverse event-clock, normalized celestial-direction and wisp-projection
  checks. TypeScript, ESLint and production static export are validated; logs
  are stored beside this report after final checks.
- The [actual GPU orbit probe](round-2/orbit-probe.json) covered 360 forward and
  reverse views at a frozen evening/effect phase, plus dense known-problem
  angles. It reported 0/360 reverse mismatches, zero full-loop pixel change,
  zero same-view change after 60 frames, and a worst dense-step patch mean of
  1.062/255. This verifies the sampled sky composition, not every continuously
  moving final-scene state.
- Parked-camera cloud captures 44.686 active seconds apart showed wisp travel;
  evening/reverse captures confirmed smooth mood changes. Desktop and compact
  moods, moon placement, metal close-up, selection and Escape return were
  inspected. No captured WebGL warnings/errors appeared in those checks.
- On the normal homepage without review overrides, an upward scroll advanced
  user travel from 0 to 0.65 turns and time from 12:00 to 13:57. A reverse
  scroll returned user travel to 0 and world time to 12:00 while the idle
  camera continued its independent cruise. Final samples were 13.33–14.36
  ms/frame with no captured warnings/errors; see [browser check](browser-check.json).
- The browser provider did not expose reduced-motion emulation. Its lifecycle
  path was checked in code/tests and composed paused sky was inspected, but
  **actual OS reduced-motion activation and physical-phone testing remain
  unverified**. Do not describe them as completed device tests.

## Reproduce a local comparison

In development, use `/?reviewSeed=8&reviewStill=1&reviewTravel=0`. Wait until
`data-intro-phase="active"`. Keys 1/2/3/4 select noon/sunset/midnight/sunrise;
left/right arrows step world time by 45 minutes. The override is development
only and absent when `reviewTravel` is omitted. Use the normal homepage to
verify genuine scrolling. `/sky-review` supplies controlled azimuth, effect
time, pause and the GPU continuity probe.
