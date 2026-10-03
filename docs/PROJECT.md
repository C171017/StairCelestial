# Project direction

## Active experience

Sanctuary is a bright, glassy portfolio with a cloud atmosphere, pearl surfaces, champagne highlights, and a vertically endless glass helix. It replaces the former dark celestial staircase on branch `codex/glass-ribbon`.

The latest direction restores the door metaphor while retaining the bright cloud environment, glass ribbon, and fixed camera. Six strongly differentiated irregular door shapes are provisional studies for the owner to choose among.

## Interaction contract

The current presentation has no visible interface text or floating link indicators. Retain accessible names; brand marks on the social sculptures remain part of the objects. Select a project sculpture to focus it, then activate the same sculpture again to open its destination. Scroll, Escape, or the close control returns to the ribbon.

- Only the ribbon and its project sculptures respond to scrolling. Keep the camera, cloud backdrop, and social objects outside the scrolling and focus transforms.
- Preserve deliberate continuous idle travel. Smooth acceleration, reversals, selection, and return; no abrupt target reset.
- Place the six sculptural glass doors directly on the ribbon. Each has a fixed frame, moving glass leaf, and visible hinge or pivot. The current six studies reuse four project destinations; final shape assignments await the owner's selection.
- Select a sculpture to reveal details; the project link opens its destination. Focus moves the ribbon composition, not the camera.
- The inexpensive SVG eye entrance conceals preparation of the initial 3D scene. Do not show a raw model-loading screen. If preparation fails or exceeds the entrance timeout, provide working project links.
- The original AudioConsentGate/EyeConsentSvg opening and PlayControl3D tetrahedron-to-docked-control choreography are restored. The click-await interval is two seconds; other opening, handoff, flight, and reduced-motion timing remains original. Cloud styling uses a pearl backdrop and restrained blue/champagne tones. Automatic entry stays silent; clicking restores the original audio consent/play behavior.
- Respect reduced-motion preferences and distinguish a mobile swipe from a tap.

New sound design and ordinary navigation are deferred. The latest user request explicitly restores the original intro and its existing audio-control behavior; do not add a conventional menu.

## Content

Retain these existing destinations:

- Music — `https://music.c171017.com`
- JazzTree — `https://jazztree.c171017.com`
- Guanchang — `https://guanchang.me`
- Columbia-Barnard Network — `https://c171017.github.io/Social-Network-Columbia-Barnard/`

Both social destinations are intentionally placeholders for this pass. Keep `github` and `linkedin` unconfigured in `src/lib/sanctuaryContent.ts` until the owner supplies or approves the personal URLs; the interface explains the missing link when activated.

## Asset direction

The active assets are six original cast-glass thresholds: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. They vary in contour and proportion, with subtle sea-glass tints and restrained silver/champagne hardware. Source and builder are `blender/door-studies.blend` and `blender/build_door_studies.py`; portable GLBs live in `public/models/doors/`. The prior sculptures and original Blender scenes are preserved.

`/door-studies` is a separate comparison room with numbered labels, all-six and individual views, a turn control, and reversible hinge/dissolve experiments. The text-free homepage and existing entrance remain intact. Shape selection is the purpose of this pass; movement is exploratory.

The glass ribbon and social tokens are authored in code. A generated cloud image is served as an approximately 38 KB WebP. Keep textures and geometry finite; imply infinity through recycling, composition, and offscreen geometry.

## Current status

- The Sanctuary homepage and four Blender sculptures are implemented.
- The original eye gate, play control, audio provider, intro reveal, and intro store are reused. The old staircase, planets, and orbit helpers remain unmounted.
- Production export and eleven motion/focus tests pass; desktop and narrow browser interactions were checked.
- Independent Astra review: 7.8/10 on round one, then 8.4/10 after refinement on round two. The requested threshold was met within the three-round limit; see [REVIEW-NOTES.md](REVIEW-NOTES.md).
- There is no claim of measured device performance or deployment readiness.

## Contributor guidance

Read [ARCHITECTURE.md](ARCHITECTURE.md) before editing the scene. Keep performance-sensitive motion outside React state updates per frame, preserve finite geometry, and dispose owned resources. Run the relevant motion checks and production build after substantive changes, then record the actual results in [WEB-PHASES.md](WEB-PHASES.md).

Update current docs when behavior changes. Treat `blender/md/` and the old scene modules as historical references, not active requirements.
