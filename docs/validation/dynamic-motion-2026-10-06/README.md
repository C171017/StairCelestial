# Visible motion, with an unhurried wind

October 6, 2026. The owner rejected the first subtle studies and requested
clearly visible movement at rest, independent of scrolling. After seeing the
moving-cloud direction, they requested distinct layer speeds with a moderate
overall pace so the small artwork library does not feel repetitive.

## Preview and selection

Open `/motion-preview?effect=clouds`. The camera is stationary. Four choices
are available: sailing clouds, flowing mist, shifting light, and clouds + mist.
**Compare original** removes the added study. **Pause motion** freezes ambient
motion. Mood buttons change the day; scrolling moves time forward/backward.
The small `/sky-review` diagnostic page also offers these choices and recording.

Recommended ranking for this request:

1. **Sailing clouds:** visible billowing forms translate over anchored banks.
2. **Flowing mist:** distinct, softer ribbons translate and curl between layers.
3. **Shifting light:** broader source-aligned shafts sway; a secondary accent,
   with less direct cloud movement than the first two.

Clouds + mist is provided as a combination to compare, not a fourth unrelated
effect. No new numerical critic score was requested or run. The prior three
formal reviews remain historical. These studies are not enabled on the homepage.

## Two independent clocks

- User travel controls day/night palette, illumination, celestial placement,
  shadows and effect eligibility. The direction is down-scroll → later time.
- Ambient seconds control wind translation, mist curl and shaft sway. Wind
  never reads user travel. Color responds to the day while its motion continues.
- Existing twinkling/meteors retain their independent clocks and time-of-day
  visibility. No new event density or star treatment was added in this pass.
- Reduced-motion preferences, hidden pages and explicit pause stop ambient
  animation through the shared clock. These safeguards are preserved.

## Pace and repetition

The first strong draft moved bank layers at 15.6/14.4 world units per second.
The delivered near/far speeds are **8.4/4.8**, reductions of 46% and 67%.
The more distant layer also has lower angular speed because of its depth.
Bank periods are staggered at **40/56 seconds**, with different atlas tiles
at near/far depths. Mist uses **10.8/6.0** and **32/46-second** periods.
Feathered cards and complementary premultiplied samples conceal recycling.
The texture set remains finite; this reduces obvious repetition rather than
claiming infinitely unique clouds.

Eight lightweight cloud surfaces per wind option reuse the existing artwork.
The combination has sixteen. Light shafts use one procedural sphere. No
video backgrounds, simulation volume or post-processing blur was added.
The homepage does not mount these optional study components.

## Evidence and limits

- Live stationary-camera previews: `/motion-preview?effect=clouds`,
  `?effect=mist`, `?effect=rays`, and `?effect=combined`.
- Fixed-camera cloud frames at [0 seconds](clouds-0.jpg) and
  [5 seconds](clouds-5.jpg), plus [combined night](night.jpg).
- [Clock separation](clock-separation.json): world time advanced 06:00 → 07:48
  and reversed to 06:00 while ambient seconds advanced 61.397 → 97.652 → 124.184.
- Browser inspection covers the individual effects, combined night, and
  pause/resume. The motion clock remained exactly 603.415 while paused.
  Camera motion is not used to create the effect. [Live preview UI](preview.jpg).
- [122 tests pass](tests.log), TypeScript/ESLint pass and
  [production export passes](build.log). These are functional checks, not
  visual acceptance. Physical phone performance and the final full-scene
  combination remain to be reviewed after selection.

Recording completed in the review UI, but automatic downloads did not appear
in Downloads and the browser media-download call timed out. No new local video
file is claimed or delivered. The recorder now retains a visible **Download
recording** link rather than relying solely on an automatic click. The live
interactive previews are the deliverable and include the latest slower pace.
