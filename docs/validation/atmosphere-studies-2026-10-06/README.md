# Forward time and optional sky motion studies

October 6, 2026. The owner clarified that scrolling down (perceived ascent)
must advance time. The existing ribbon input stores this direction as
negative user travel. `atmosphereTravelFromRibbon` now negates it before
sampling the atmosphere, leaving camera and geometry navigation intact.

From the initial noon: pearl daylight → pink sunset → moonlit night → golden
sunrise → daylight. Reverse input reverses that clock. Existing equal mood
lengths, soft transitions, shadows and ambient effects are preserved.

## Optional previews

These proposals are available only in `/sky-review` through **Effect study**.
The homepage defaults to `none`; the mist/ray module loads only on demand.
Each recording is 12 seconds from the same stationary entrance camera,
golden sunrise (travel 6), and ambient time near zero. These are actual
rendered sky recordings, without the foreground ribbon and portals.

| Rank | Proposal | Recommendation fit | Rationale / cost |
| --- | --- | --- | --- |
| 1 | [Moving cloud light](light.webm) | 9/10 | Illumination travels across existing cloud relief, keeping silhouettes intact. No added draw calls or texture samples; a little shader arithmetic. |
| 2 | [Low drifting mist](mist.webm) | 8.5/10 | A thin moving veil adds depth among the anchored banks. Four extra feathered planes and a cirrus texture; more transparent overdraw. |
| 3 | [Soft sunbeams](rays.webm) | 7.5/10 | Best as an occasional sunrise accent. A directional, softened fan follows the source; more likely to look decorative. One extra sky sphere and procedural fragment shading. |

Scores express subjective suitability for this scene, not an Astra review
or an award-quality certification. No additional formal review round was
run. The first ray draft was too regular and bright; the delivered version
is softer, asymmetric and lower contrast.

Still frames: [mist](mist.jpg), [light](light.jpg), [rays](rays.jpg).
Interactive example: `http://127.0.0.1:3000/sky-review?study=light&travel=6`.
Use the dropdown to compare with **Current sky**. These effects reuse the
existing paused/reduced-motion ambient clock. No new homepage media downloads.

## Validation

- [122 tests pass](tests.log), including integrated wheel-input forward and
  reverse order, and existing equal-phase coverage.
- TypeScript, ESLint and [production export](build.log) pass.
- [Live homepage scroll check](scroll-direction.json): noon 12.000 → 13.950
  after downward input → 12.000 after equal reverse input, without a review
  travel override. [Forward scene capture](scroll-forward.jpg). No homepage
  console warnings or errors were observed after the clean reload.
- All three modes rendered in the local browser and their actual WebM files
  were recovered from Downloads and verified as nonempty WebM containers.
- An initial duplicate cloud-loader warning was removed by loading only the
  cirrus texture for the study, avoiding a second full bank decoder.
- Cost notes are based on implementation, not device benchmarks. These are
  selectable prototypes; integration with foreground objects and physical
  phone performance would be checked after selection.
