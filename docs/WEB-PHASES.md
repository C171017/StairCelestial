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
