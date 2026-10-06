# Portfolio documentation

The active homepage is the Sanctuary floating-portal experience. Read:

- **[Performance and loading brief](PERFORMANCE-AND-LOADING.md) — durable requirements for quality-preserving adaptation, the readiness-driven eye, staged entrance work, and user-experience validation.**

- **[Integrated cloud, mist and light motion](validation/integrated-motion-2026-10-06/README.md) — latest October 6 implementation: all three approved effects are active on the homepage, with balanced strengths, separate wind/time clocks and shared artwork.**

- **[Equal moods and visible effects](validation/atmosphere-visibility-2026-10-06/README.md) — latest October 6 correction: 25% journey per mood, golden sunrise/pink sunset, restored shadows, denser stars, full-night meteors, visible shared-wind clouds, and actual motion recording.**

- [Previous atmosphere implementation and review](validation/atmosphere/README.md) — October 5 baseline and three Astra High scores (7.2 → 7.5 → 7.8; target 8.0 not reached). These scores do not grade the October 6 correction.
- [ATMOSPHERE-REFINEMENT.md](ATMOSPHERE-REFINEMENT.md) — selected art direction and historical brainstorming; exact proportionality was relaxed by the owner.

- **[MATERIAL-BUILD-HANDOFF.md](MATERIAL-BUILD-HANDOFF.md) — start here for the next build: selected white marble spiral and deep black/gold frames; current state, source map, references, and validation.**

- [TEXTURE-REFINEMENT.md](TEXTURE-REFINEMENT.md) — October 5 material pass, visual-ceiling direction, and deferred cloud/24-hour world refinements.

1. [PORCELAIN-IMPLEMENTATION.md](PORCELAIN-IMPLEMENTATION.md) — active floating B2 renderer, atmospheric clock, shadows, and validation.
2. [PROJECT.md](PROJECT.md) — current user direction, scope, content, and constraints.
3. [ARCHITECTURE.md](ARCHITECTURE.md) — rendering, motion, focus, entrance, and assets.
4. [WEB-PHASES.md](WEB-PHASES.md) — implementation and validation status.
5. [REVIEW-NOTES.md](REVIEW-NOTES.md) — independent design reviews and decisions for the owner.
6. [ASSETS.md](ASSETS.md) — asset source and generation notes.
7. [VISUAL-POLISH-REVIEW.md](VISUAL-POLISH-REVIEW.md) — October 4 design critique, measured preview limits, proposed M2 performance budget, and deferred ascent-to-night idea.

Update these documents whenever the mounted experience, interactions, or asset pipeline changes. Run `npm test`, `npm run lint`, and `npm run build` for substantive scene changes; record manual browser evidence separately from automated tests.

The old `src/components/scene/` implementation, `docs/visual-guide.html`, and `blender/md/` prompts describe the dark celestial staircase. They are historical references and are not the active specification. Current user instructions take precedence over that historical art direction.

## CV subdomain

The independent static CV site lives in [`../cv/`](../cv/README.md).
It serves the supplied PDF in a full-height viewer at `cv.c171017.com`
and deploys separately from the 3D homepage.
