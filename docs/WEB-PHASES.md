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

## 4. Independent design review — accepted at 8.4/10

The user requested an Astra review scored from 0 to 10, with 10 representing an award-level production result. Aim for at least 8. If a review is below 8, incorporate its concrete improvement directions and request another review, for at most three attempts total.

Round one scored 7.8/10. Correcting mobile cloud proportions and reducing focus clutter produced 8.4/10 in round two. Astra verified desktop and portrait interactions directly. No third round was needed. Details and the owner's remaining decisions are in [REVIEW-NOTES.md](REVIEW-NOTES.md).

## Deferred scope

Sound design, a conventional navigation system, personal social URLs, and deployment are separate follow-up work. Retain the old implementation for reference and rollback, but do not mount its audio, planets, doors, or orbiting camera in the Sanctuary experience.
