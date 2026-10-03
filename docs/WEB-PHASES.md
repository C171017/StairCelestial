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
