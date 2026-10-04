# Portfolio documentation

The active homepage is the Sanctuary glass-ribbon experience. Read:

1. [PROJECT.md](PROJECT.md) — current user direction, scope, content, and constraints.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — rendering, motion, focus, entrance, and assets.
3. [WEB-PHASES.md](WEB-PHASES.md) — implementation and validation status.
4. [REVIEW-NOTES.md](REVIEW-NOTES.md) — independent design reviews and decisions for the owner.
5. [ASSETS.md](ASSETS.md) — asset source and generation notes.

Update these documents whenever the mounted experience, interactions, or asset pipeline changes. Run `npm test`, `npm run lint`, and `npm run build` for substantive scene changes; record manual browser evidence separately from automated tests.

The old `src/components/scene/` implementation, `docs/visual-guide.html`, and `blender/md/` prompts describe the dark celestial staircase. They are historical references and are not the active specification. Current user instructions take precedence over that historical art direction.

## CV subdomain

The independent static CV site lives in [`../cv/`](../cv/README.md).
It serves the supplied PDF in a full-height viewer at `cv.c171017.com`
and deploys separately from the 3D homepage.
