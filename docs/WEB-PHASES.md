# Sanctuary implementation and validation

The active reconstruction is on `codex/glass-ribbon`. This checklist replaces the old W1–W6 staircase/door phases; those phases are historical and must not guide the active scene.

## 1. Foundation and assets — implemented

- Replace the mounted homepage with `SanctuaryExperience` and a lazily loaded R3F scene.
- Create a bright cloud atmosphere and a continuous, rounded glass helix.
- Build four recognizable sculptures in Blender; retain the editable source and reproducible export script.
- Optimize the generated cloudscape to an approximately 38 KB WebP.
- Preserve all four existing project destinations and keep both social destinations as intentional placeholders.

## 2. Interaction reconstruction — implemented and browser checked

- Move only the ribbon and project sculptures in response to scrolling.
- Preserve gentle continuous travel, with controlled acceleration and reversal.
- Replace doors with directly selectable sculptures and project details.
- Ease the current ribbon transform through focus changes and return, avoiding the old abrupt target reset.
- Keep the camera, background, and social objects independent of scroll and focus transforms.
- Use an inexpensive eye entrance while assets and shaders prepare; provide project links if the scene cannot become ready.
- Support compact layouts, reduced motion, and touch drag/tap separation.

## 3. Validation — build, tests, and browser checks passed

Eleven automated motion/focus tests and the production build pass. Browser checks covered the following; physical phone benchmarking remains a follow-up:

- Entrance behavior before, during, and after preparation; slow/error fallback.
- Smooth scroll, reversal, and repeated-cycle boundaries in both directions.
- Selecting every project, switching selection, interrupting focus, and returning.
- Stable social/background placement while scrolling and focusing.
- Correct project URLs and honest placeholder behavior for social URLs.
- Desktop and narrow layouts, touch gestures, keyboard-accessible labels, and reduced motion.
- Resource cost and frame behavior on representative devices before making performance claims.

No completed production measurements or deployment readiness are asserted here.

### Movement refinement — October 2, 2026

- Reversed the initial cruise and wheel/swipe mapping together.
- Increased normal input acceleration and response, plus cruise acceleration and response, by 25%; retained speed limits, selection braking, and reduced-motion behavior.
- All twelve motion/focus tests and the production export passed. Lint passed with the existing audio effect cleanup warning in `useSiteAudio.tsx`.
- Checked the desktop preview while scrolling and reversing direction. Compact layout and touch were not rechecked for this adjustment.
- Follow-up: increased normal wheel/swipe acceleration and response another 20%. All twelve tests and production export passed, with the existing audio cleanup warning. This follow-up was not browser rechecked.

## 4. Independent design review — accepted at 8.4/10

The user requested an Astra review scored from 0 to 10, with 10 representing an award-level production result. Aim for at least 8. If a review is below 8, incorporate its concrete improvement directions and request another review, for at most three attempts total.

Round one scored 7.8/10. Correcting mobile cloud proportions and reducing focus clutter produced 8.4/10 in round two. Astra verified desktop and portrait interactions directly. No third round was needed. Details and the owner's remaining decisions are in [REVIEW-NOTES.md](REVIEW-NOTES.md).

## Deferred scope

Sound design, a conventional navigation system, personal social URLs, and deployment are separate follow-up work. Retain the old staircase implementation for reference and rollback. The latest request restores a new sculptural door metaphor, not the old rectangular portals or orbiting camera.

## 5. Irregular glass door studies — October 2, 2026

- Created six original Blender models: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. Exported separate fixed frames and moving pivot/leaf hierarchies, preserving earlier Blender scenes and sculptures.
- Placed all six on the ribbon and added `/door-studies` for comparison, isolation, turning, and reversible hinge/dissolve experiments. Project destinations remain the original four and are reused provisionally across the six studies.
- Shared cloud/studio setup now lives in `SceneEnvironment.tsx`; the comparison room does not load the portfolio entrance or its audio code.
- Production export, TypeScript, and all 12 motion/focus tests passed. Build lint has only the pre-existing `useSiteAudio.tsx` cleanup warning.
- Audited all six GLBs: valid containers, one pivot each, leaf and moving hardware under that pivot, fixed frames outside it, and exported transmission materials. Total new model size: 2,290,620 bytes.
- Browser checks observed the desktop/narrow collection, individual selection, hinge opening, and leaf-only dissolve. The homepage was checked with the new doors on the ribbon. No deployment, physical-device performance benchmark, or final shape selection is implied.

### Hinge removal and irregular placement — October 2, 2026

- Removed 33 visible hinge, mount, strap, axle, and spine objects from all six Blender models; re-exported and verified that no such meshes remain in the GLBs. Animation pivots remain invisible.
- Replaced equal ribbon spacing with stable per-occurrence turn/lateral offsets, varied scale, and full-circle facing directions. Focus uses the matching scattered anchor. The comparison room and source studio are also irregularly arranged.
- Production build and all 13 motion/focus tests pass, including a new recycling continuity check for scattered positions and orientations. The existing audio cleanup lint warning remains.

### Frontal door focus and hidden project sculptures — October 3, 2026

- Opening a door now eases its random facing angle into a front view while retaining close framing and the fixed camera. The ribbon's rotated anchor stays at the focus destination, above the audio control; returning restores the overview orientation as well as position and scale.
- The selected leaf opens to approximately 86 degrees. The matching preserved Music, JazzTree, Guanchang, or Network GLB appears wholly behind the doorway as the hinge opens, and unmounts immediately when selection clears. The turntable is tilted to show its platter in the frontal view. Owned material clones are disposed on unmount.
- Reduced-motion door focus settles immediately into the frontal pose. Inactive doors' invisible hit targets cannot intercept selected-door interactions.
- All 16 motion/focus tests, TypeScript, lint, and the production export pass. Lint retains the existing `useSiteAudio.tsx` cleanup warning. New tests cover front-face alignment across 24 scattered occurrences at both focus scales, shortest-turn switching, return orientation, and reduced-motion selection.
- Browser checks covered open-door reveals at 1280×800 and 390×844, plus the normal narrow preview, and verified close, Escape, and scroll return with the sculptures hidden. No browser console errors were observed. No deployment or physical-device performance claim is implied.

### Random ordering with permanent shape identities — October 3, 2026

- Replaced the repeating six-shape order with independent random draws, allowing repeats and clusters. Each mounted visit receives a fresh arrangement seed; existing occurrences retain their shape and placement through scroll reversal, recycling, focus, and rerenders.
- Increased turn jitter to 0.31 turns, lateral variation to 84% of ribbon width, and scale variation to 0.72–1.22; retained full-circle facing angles. The density stays bounded within the finite pool.
- Made shape-to-project assignments explicit in `sanctuaryContent.ts`. Each shape always resolves to the same project record, URL, and sculpture model, independent of visit seed, occurrence, or slot. All six GLBs prepare before entry even if the initial random sequence omits a shape.
- All 20 motion/focus/placement tests and the production build passed after this change; the existing audio cleanup warning remained. Added checks for nonperiodic sequences with repeats, per-visit variation, reverse/recycling continuity, and the six permanent shape assignments across 600 random draws.
- Browser checks observed repeated shapes in irregular arrangements, a Fault door opening Guanchang with its globe sculpture, and the same randomized doors returning after Escape. Concurrent camera/background edits temporarily interrupted the preview; after those files arrived, a reload showed a fresh working random arrangement with consistent shape assignments. TypeScript and lint also passed for the combined version, retaining the existing audio warning.

### Door click restoration — October 3, 2026

- Reproduced the reported mouse-click failure. The hit volume installed a disabled raycast during the entrance, then passed `undefined` when enabled; Fiber ignores that value, leaving click detection disabled. Returning from another door's focus had the same problem.
- Added an explicit mesh raycast restoration for enabled doors while retaining disabled pick targets during entrance and other doors' focus.
- Added regression checks using Fiber's real property application and Three's ray intersections for entrance activation and repeated focus/return cycles. The test command now includes every library test file, including orbit tests.
- All 26 tests and the production build passed, with the existing audio cleanup warning. Browser mouse clicks opened Seed after a fresh entrance and Orbit after closing Seed; the expected sculpture and project destination appeared.


## Continuous scroll orbit — October 3, 2026

Vertical wheel/swipe input now drives a continuous 360° camera orbit while preserving the ribbon's existing vertical travel and idle cruise. The camera always faces the central axis, has no angular bounds, and eases to rest when user input settles. Horizontal gestures remain unmapped. Door focus now accounts for the current camera azimuth. Pinch/multitouch cancels a pending one-finger swipe.

A new world-fixed sky sphere surrounds the camera. Its panoramic texture is `public/textures/sanctuary/cloudscape-360.webp` (1774 × 887, 242,002 bytes). The original flat texture remains available for the separate door-study room. A narrow shader crossfade closes the panorama's longitude join; the clouds are a distant environment shell, not separately modeled volumes.

Validation: 24 motion, focus, and placement tests pass, including positive/negative full-turn continuity, sustained navigation beyond complete revolutions, orbit settling, and door facing at ten camera azimuths. Type checking and production static export pass. Lint has only the existing `useSiteAudio.tsx:146` cleanup-ref warning. Browser checks crossed more than one complete turn and reversed direction. A selected Cloud/Music doorway settled front-facing from an orbited angle, and reverse scrolling closed it and returned to the overview. The 393 × 852 phone layout rendered without runtime errors. Automated touch input stalled in Chrome device emulation, so real touch-device verification remains unconfirmed.

Sky generation used the built-in image-generation tool, with the existing cloudscape as reference. The second pass improves detail, but the tool returned 1774 × 887 rather than the requested 3840 × 1920; the asset was encoded as WebP without artificial upscaling. Prompts:

Initial: Use case: stylized-concept. Asset type: seamless 360-degree equirectangular sky environment texture for a Three.js portfolio. Edit the supplied cloudscape into a full spherical panorama, 2:1 aspect ratio, preferably 4096 by 2048. Preserve its pale blue sky, pearl white cumulus, soft champagne morning light, delicate photoreal painterly feel. Viewpoint is floating high above a vast sea of clouds. Correct equirectangular projection: entire 360 degrees longitude left to right, zenith at top, nadir at bottom, horizon at exactly image mid-height. Top half predominantly blue sky, subtle wisps; below the horizon abundant varied billowing clouds with blue-gray shadows and warm creamy highlights. A few cloud towers reach just above horizon. Panoramic variation all around, no repeated/mirrored sections. Edges left/right must match seamlessly in color and cloud formations; poles smoothly uniform. This is a texture, not a picture of a panorama: fill the whole frame, no borders, no text, no sun disc, no ground, no objects or spiral. Keep the horizon lower-contrast so glass geometry will stay readable. The image is used wrapped on the inside of a sphere.

Detail pass: Edit target: this 360-degree equirectangular cloud panorama. Increase true fine detail and output resolution to 3840 pixels wide by 1920 pixels tall (2:1). This is a full 360 spherical texture viewed close-up, so it must be SHARP, with crisp photographic cumulus detail rather than painterly blur. Preserve the composition and palette: bright pale blue sky upper half, pearl cumulus cloud sea lower half, champagne horizon centered vertically, no objects. Correct the left/right seam so the two vertical edges match seamlessly with the same cloud shapes and sky colors; no mirrored/repeated strips. Top and bottom poles should be uniform. Keep horizon heights, sunlight and palette coherent around the full 360 degrees. No text or borders. High resolution panoramic environment asset.


## High-resolution cloud sky — October 3, 2026

Chose a dedicated super-resolution model before experimenting with video. The original 1774 × 887 panorama provides very few source pixels within the camera field of view. Two overlapping 887-square pilot crops were upscaled with Higgsfield MCP `bytedance_image_upscale`, resolution `4k`, background removal disabled. Both outputs were 4096-square. Visual checks against Lanczos enlargement found clearer cloud detail with matching cloud structure. Mean absolute RGB change at source scale was 3.62 and 3.35 / 255; their overlapping area differed by 3.48 / 255. These are alignment/fidelity checks, not a perceptual quality score.

After the pilot, processed the remaining two panorama crops and the original flat cloud backdrop. One panorama job failed; one retry succeeded. The account credit balance changed from 2999 to 2989: 10 credits net for five successful images. No video generation was submitted.

Panorama assembly uses roughly 50% overlap, fractional placement alignment, smooth sinusoidal weights, linear-light blending, and a wraparound tile that sees the original longitude join within its own frame. Final panorama: 8192 × 4096, 1,313,292-byte WebP. Mobile/smaller-screen variant: 4096 × 2048, 559,154 bytes. Flat backdrop: 4096 × 2305, 172,818 bytes. The panorama master boundary has mean adjacent RGB change 0.301 / 255, compared with 0.328 / 255 in its neighboring columns. Final encoded wrap crop was visually inspected without a hard cut.

The sky loader respects GPU texture-size limits and selects 4K below 700 CSS pixels. Original images remain as loading/low-capability fallbacks. The stitched panorama bypasses the original shader seam crossfade to avoid blurring the repaired join a second time. Texture anisotropy is capped at four.

Generation prompt: “Faithfully upscale this cloud sky to 4K. Preserve the exact cloud silhouettes, positions, colors and lighting. Recover fine natural cloud detail without inventing new objects or changing the composition.” Model: ByteDance Image Upscale through Higgsfield MCP. Successful job IDs: `7fffad1a-f84c-46ae-9902-bd4d89109ab0`, `e689ed06-d54a-45dd-b81a-ca78f916c921`, `d576f815-ae0b-48fc-9da4-01f246f73c5e`, `ebc18308-99dc-43ba-bcaa-2460d88b4c1b`, `8d927100-3c1a-4de5-9198-2a0c77b2379c`.

Validation: 34 existing tests pass; TypeScript and production export pass. Lint reports only the existing `useSiteAudio.tsx:146` cleanup-ref warning. Browser inspection confirmed the active 8192 × 4096 texture, scrolling past -1.0024 turns with no hard sky seam, and reverse scrolling. Resizing to 393 × 852 first showed the original loading sky and then the 4096 × 2048 variant without hiding the scene; restoring desktop size restored 8K. No new console errors appeared during the clean verification run. The separate door-study view also rendered its upscaled flat backdrop without console errors. This checks responsive browser rendering, not physical-device performance.

Next animation recommendation: keep this still panorama as the foundation and first test restrained scene-space cloud drift/particles. Ordinary image-to-video generation does not establish spherical coherence or a seamless temporal loop. A dedicated 360° video experiment would need independent checks for every viewing angle, the longitude join, loop endpoints, and mobile decoding cost. References: [Higgsfield image upscaler](https://higgsfield.ai/ai-image-upscaler), [Topaz core-model fidelity guidance](https://docs.topazlabs.com/topaz-gigapixel/enhancements/ai-models/core-models), [Imagine360 research](https://arxiv.org/abs/2412.03552).

## Animated cloud panorama and shooting stars — October 3, 2026

Added a generated cloud-motion layer to the existing world-fixed sky, plus separate world-anchored shooting stars and slow glints. The eight-second cloud asset plays at `playbackRate = 0.5`, producing a sixteen-second cycle. Explicit sRGB decoding and a 32–46% linear-light video blend preserve the sharp still panorama underneath; pole blending returns to the still image. Effects follow their own 32-second schedule and remain coherent as the camera orbits.

The pilot used Higgsfield MiniMax H3 image-to-video (ten seconds, 2K; preflight estimate 20 credits), with the same panorama supplied at both endpoints. The prompt requested a locked camera, gentle cloud drift, preserved horizon/projection/palette, a continuous longitude join, and a smooth return to the reference. Stars were excluded from the generated footage so their timing and placement could be controlled in the scene. Generation job: `c7c90341-187f-4ba6-b9df-12b847fe59e7`.

The source was 2720 × 1344 at 24 fps. `scripts/prepare-sky-video.py` retains the full frame, normalizes it to 2720 × 1360, and uses the first 240 frames with a 48-frame smoothstep overlap to produce exactly 192 frames. Every frame receives a narrow longitude repair with identical pre-encoding edge columns. Desktop output is 8,609,827 bytes; the 1536 × 768 compact output is 5,736,283 bytes. Both encode directly from repaired RGB, avoiding a second lossy encode for compact screens. Reproduce with `--source-duration 10 --overlap 2 --fps 24 --compact-crf 14`.

The first pilot exposed a small compression-related loop-boundary difference, especially in the compact file. Direct encoding and higher quality reduced it. [Preserved isolated-video QA](validation/sky-video-loop.json) records all-frame quadrant/horizon position and velocity metrics plus spatial-join measurements: desktop passes every screen; compact passes velocity and longitude screens but retains two conservative position flags near 1.03/255 RGB. Those flags were not removed or relaxed. [Displayed-composite QA](validation/sky-video-displayed.json) uses the shipping blend and pole taper and passes the same screens for both files. Its compact cloud/horizon boundary difference is 0.30–0.35/255 RGB, and whole-image brightness changes by 0.046/255 at the wrap (desktop: 0.031/255). CPU screening uses 512 × 256 decoded frames and does not replace browser loop inspection.

Endpoint and full-loop contact sheets showed no hard cloud-position cut. The generated upper cloud gradually morphs through the overlap, which is why the still panorama remains prominent. Working evidence is in `/private/tmp/sky-video-pilot/processed/`: `loop-endpoints.jpg`, `loop-overview.jpg`, `sky-video-report.json`, and `displayed-composite-report.json`; the two JSON reports are also preserved in `docs/validation/` under the links above.

Reduced-motion or data-saving preferences disable cloud video. Inactive scenes and background tabs pause playback; errors and denied autoplay retain the still image. The player waits for a decoded frame before revealing video and preserves the last frame during temporary buffering. Effects pause when hidden/inactive and disappear with reduced motion. These implementation and numerical checks do not imply a physical-device performance benchmark or deployment.

Final verification: 48 tests and the production export pass; the existing `useSiteAudio.tsx:146` cleanup-ref lint warning remains. Chrome inspection confirmed desktop playback, a visible shooting star, navigation beyond a full orbit, and a completed video repeat. At 393 × 852, the sky switched to the 4K still and compact video, played through a repeat, and remained visible during reverse scrolling. Returning to desktop restored the large assets. No new console errors appeared after a clean reload; an earlier door-palette HMR error belonged to concurrent work. Browser control was interrupted during reduced-motion emulation, so reduced-motion/data-saving and denied-autoplay behavior received code review but no final visual confirmation. This is responsive desktop-browser testing, not testing on a physical phone.


## Pearl ceramic door collection — October 3, 2026

Replaced the six glass surrounds with opaque glazed ceramic in pearl ivory, soft sage, ice blue, shell blush, vanilla cream, and mist lavender. `src/lib/doorPalette.json` is shared by the Blender builder and runtime materials. All doors share champagne-gold inner linings and pulls, paired warm emissive strips, and clear glass leaves. Rounded frame edges and smooth curved normals retain the original silhouettes; Orbit remains one complete loop. The liner is slightly inset from the ceramic wall to avoid overlapping surfaces and flicker. Blender source, generator, six GLBs, and export manifest are updated; total GLBs are 2,112,168 bytes.

The runtime owns separate stationary and moving hardware materials per instance, so the frame stays lit while the leaf dissolves. Fully restored frames return to opaque depth writing after dimming. A one-time 256-pixel cube capture combines the cloud panorama and studio highlight panels; it produces view-dependent PBR reflections without per-frame environment capture. Emissive strips do not simulate indirect light, and the glass retains an alpha/transmission approximation for overlapping ribbon turns.

Validation: all 48 existing tests passed; the seven aperture and material-reveal tests passed again after final changes. TypeScript and production export passed. Lint retains only the existing `useSiteAudio.tsx:146` cleanup-ref warning. Browser checks covered the desktop collection, close-up gold lining, Orbit hinge opening, homepage selection/dissolve, and both routes at 393 × 852. A transient Turbopack JSON-module HMR error cleared on reload, with no later error entries during inspection. Screenshots are in `.screenshots/pearl-ceramic-collection.jpg` and `.screenshots/pearl-ceramic-mobile.jpg`. No physical-device performance measurement or deployment was performed.

## Sky playback recovery and visibility — October 3, 2026

Reproduced a visible page stuck in `hidden` with sky playback paused. The entrance owner's cleanup reset the shared store during effect replay, while its readiness signal had already fired. `introSession.ts` now retains the session across Strict Mode/Fast Refresh cleanup/setup and resets all entrance fields only on a real exit. `AudioConsentGate` preserves a completed handoff instead of resetting it after its DOM has disappeared. Two regression tests cover replay, overlapping owners, and a genuinely new visit.

Ambient sky playback no longer depends on the entrance's input gate. It follows document visibility and motion/data preferences, and rechecks playback on page restoration. Cloud speed is now 0.8 (ten-second playback period), with a 65–80% video contribution. Stars retain their independent 32-second cycle. These values supersede the earlier sixteen-second/32–46% pilot settings above.

Added `scripts/check-sky-composite.py` to reproduce composite QA from the actual shipping assets and current shader weights. The refreshed `sky-video-displayed.json` passes all desktop and compact temporal/spatial screens at the stronger blend. Horizon endpoint differences are 0.590/255 desktop and 0.688/255 compact; whole-image mean brightness changes are 0.064/255 and 0.094/255. Raw video assets and their original measurements are unchanged.

Browser verification confirmed fresh entrance completion, playback during entry, and `active`/`playing` after separate live updates to the entrance owner and eye overlay. The desktop preview completed ten video loops while orbiting beyond -1.3 turns, and the 393 × 852 compact preview completed two loops. A shooting star was visibly present during normal scrolling. Chrome reduced-motion emulation produced `disabled`, zero video mix, and the intact still panorama; removing emulation restored `playing`, full mix, and repeated loops. All 61 tests and the production build passed with no lint warnings. Physical-phone performance and denied-autoplay/network-error paths were not simulated.


## Gentler orbit and clearer door focus — October 3, 2026

Idle orbit now shares the ribbon motion clock at a 0.25 turn ratio, with a nominal 160-second rotation. The normal scroll-to-orbit distance is half its earlier amount (7,200 wheel pixels per orbit); peak angular velocity also falls from 0.18 to 0.125 turns/second. Pause, return, reversals, visibility, and reduced-motion behavior follow the shared integrator.

Door focus compares sightlines through the actual exported opening from both finished faces. It tests bounded sections of the same spiral geometry and chooses fewer blocked samples, retaining the front on a tie. The sculpture faces the chosen side and keeps that orientation through its fade-out. Geometry checks cover clear versus blocked sides, unequal obstruction on both sides, and all six actual door shapes at three placements on both ribbon sizes.

Validation: 87 tests, lint, and production export passed. Desktop Chrome confirmed selection, a settled stationary orbit, Escape return, and idle rotation; a 393 × 852 preview confirmed the Orbit/JazzTree doorway with a clear opening and scroll-to-return. No portfolio browser errors were logged (an initial wrong-port visit produced an unrelated PoliMap database error). No physical-device comfort or performance measurement and no deployment were performed.
