# Performance and loading validation — October 6, 2026

The owner selected **Keep the current balance of detail and smoothness** after the local preview was opened. The durable brief is [PERFORMANCE-AND-LOADING.md](../../PERFORMANCE-AND-LOADING.md). These results describe local validation, not certification across physical phones.

## Delivered behavior

- The eye is present in initial HTML and begins partial blinks while the core scene prepares. Full opening waits for core cloud/plate assets, first sky-derived environment capture, scene shader preparation, and usable frames. Existing audio consent and control choreography remain.
- Optional atmospheric motion begins preparing during the control handoff, compiles unseen, and fades into the background. A separate boundary prevents a failed optional chunk from destroying the usable core scene.
- Quality starts with the measured existing ceiling (native DPR capped at 1.5, transmission 0.85). Sustained slow frames trigger reversible reductions; bounded deeper trials can cross a frame-cadence plateau. No-gain trials restore detail, recovery requires sustained headroom, and hidden/loading/reduced-motion periods do not classify hardware.
- Reflection maps reuse their allocation and synchronized hierarchy. Frozen skies reuse their compositor image; camera, time, resize, preference, layer, or context changes invalidate it. Existing materials, cloud speeds, shadow resolution and sample count remain.
- Compressed cloud artwork loads directly without the unused WebP download/decode. The separate unused 4K reflection panorama is removed. Artwork remains stable through viewport/orientation changes.
- All three marble maps retain 4096 × 4096 dimensions and use visually reviewed quality-98 WebP delivery. Original JPEG sources are retained unchanged.

## Concrete cost reductions

| Work | Before | After |
| --- | ---: | ---: |
| Marble texture file bytes | 23,944,179 | 7,053,360 |
| Unused desktop cloud WebP request | 1,720,854 bytes | No request when compressed artwork succeeds |
| Unused reflection panorama request | 559,154 bytes | No homepage request |
| Reflection hierarchy clones during sampled scrolling | Rebuilt per capture | 2 total while captures increased 2 → 6 |
| Settled reduced-motion sky renders during sampled idle | Repeated compositor pass | Counter stayed 1545 → 1545 |

Marble transfer falls 70.54%. Encoding reduces transfer and decoding input size; it does **not** reduce the GPU memory required for a decoded 4K texture. Runtime pixel budgets address a different cost. Provenance, hashes, source-error measurements, and regeneration instructions are in [SOURCES.md](../../../public/textures/sanctuary/materials/SOURCES.md).

## Visual review

Matched development captures use `reviewSeed=8`, reduced motion, `reviewStill=1`, and `reviewTravel=0` or `4` so the composition, camera, wind and light state are controlled. Production intentionally ignores those review query flags; they must not be used to claim matched production captures.

Compared [source daylight](stone-source-day.png) with [q98 daylight](stone-q98-day.png), and [source night](stone-source-night.png) with [q98 night](stone-q98-night.png). No visible loss in marble detail was identified in these views. Whole-frame mean absolute channel difference was 0.01950/255 by day and 0.02769/255 at night; maxima were 5 and 3. This is a lossy delivery encoding, not pixel equality. [Measurements](stone-render-comparison.json) and [source-texture error](stone-source-compression.json) distinguish these facts.

The implementation was also inspected through actual iOS 27.0 Safari in the iPhone 18 Pro Simulator: entry, swipe navigation, portal tap/focus, and landscape rendering. See [selection](ios-safari-selection.png) and [landscape](ios-safari-landscape.png). Simulator rendering uses the Mac; these observations do not establish physical iPhone frame rate or thermal behavior.

## Browser checks

[Production functional checks](functional-checks.json):

- Artificially delayed GLBs: four distinct loading-eye shapes observed before readiness, then successful entry.
- Essential asset failure: labelled project links and Retry appear; removing the fault and retrying reaches the scene.
- Optional motion chunk failure: core Canvas remains present and interactive without a core failure screen.
- Compressed artwork failure: WebP fallback is requested and entry succeeds.
- Reduced motion: entry succeeds and the eye overlay dismisses.

[Development functional checks](dev-functional-checks.json):

- Core sky and reflection readiness precede the eye handoff; optional effects progress from deferred through preparation/fade to ready.
- Reflection captures update during travel without repeatedly cloning the sky.
- Resizing 900 → 600 → 900 does not refetch cloud artwork.
- Selection and Escape keep actual renderer DPR equal to the chosen budget.
- The settled reduced-motion sky stops redundant compositor renders.
- Synthetic 6× CPU throttling triggered DPR 1.50 → 1.25; removing the constraint restored 1.50 after sustained healthy frames, without oscillation. This verifies the runtime controller, not performance on a particular phone.

Desktop and compact production smoke runs reached the scene with no page errors. Earlier isolated local samples were around 17.6 ms average per frame on desktop and 16.7 ms on a compact viewport at full quality. The final production run also reached the scene with no console or request errors and adapted to DPR 1.25 while another live preview was open. Its frame timing is not an isolated before/after benchmark. Device emulation uses the same Mac GPU; do not generalize these numbers to most phones.

One final-check attempt did not finish initial JavaScript loading and showed the recovery screen; one chunk recorded zero transferred bytes and no Canvas mounted. The file subsequently returned HTTP 200, and a fresh instrumented run loaded all assets and entered without errors. The exact cause of that intermittent local request failure is unconfirmed. The failure/retry paths were separately verified above.

`production-probe.cjs` pins the one-value arrangement RNG inside its test browser for matching portal placement; it does not change application code. `production-functional-probe.cjs` and `dev-functional-probe.cjs` reproduce the browser checks using the bundled Playwright runtime and installed Chrome.

## Automated validation and limits

- 139 tests passed; [test output](tests.log).
- ESLint passed.
- Production build/static export passed; [build output](build.log).
- Source texture hashes, unchanged dimensions, decoded-error bounds, and deterministic regeneration passed.
- `git diff --check` passed.

No physical low-end Android/iPhone, Firefox, sustained battery/thermal run, or production internet-hosted network test was available. The existing approximately nine-second control choreography is retained; this pass does not shorten its authored timing. Source/user changes that predated this pass were preserved, and no deployment or Git commit was made.
