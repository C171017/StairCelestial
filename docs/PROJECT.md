# Project direction

## Active experience

Sanctuary is a bright, glassy portfolio with a cloud atmosphere, pearl surfaces, champagne highlights, and a vertically endless glass helix. It replaces the former dark celestial staircase on branch `codex/glass-ribbon`.

The user's current direction supersedes earlier instructions about planets, doors, orbiting cameras, and dark materials.

## Interaction contract

- Only the ribbon and its project sculptures respond to scrolling. Keep the camera, cloud backdrop, and social objects outside the scrolling and focus transforms.
- Preserve deliberate continuous idle travel. Smooth acceleration, reversals, selection, and return; no abrupt target reset.
- Place project sculptures directly on the ribbon. There are no project doors.
- Select a sculpture to reveal details; the project link opens its destination. Focus moves the ribbon composition, not the camera.
- The inexpensive SVG eye entrance conceals preparation of the initial 3D scene. Do not show a raw model-loading screen. If preparation fails or exceeds the entrance timeout, provide working project links.
- Respect reduced-motion preferences and distinguish a mobile swipe from a tap.

Sound design and ordinary navigation are explicitly deferred. Do not re-enable legacy audio or add a conventional menu as part of this reconstruction.

## Content

Retain these existing destinations:

- Music — `https://music.c171017.com`
- JazzTree — `https://jazztree.c171017.com`
- Guanchang — `https://guanchang.me`
- Columbia-Barnard Network — `https://c171017.github.io/Social-Network-Columbia-Barnard/`

Both social destinations are intentionally placeholders for this pass. Keep `github` and `linkedin` unconfigured in `src/lib/sanctuaryContent.ts` until the owner supplies or approves the personal URLs; the interface explains the missing link when activated.

## Asset direction

Use smoothly beveled, recognizable objects with coherent materials: a turntable, brass saxophone, cartographic globe, and pearl-node constellation. Blender source and an executable builder live in `blender/`; portable GLBs live in `public/models/sanctuary/`. The original Blender scene was preserved during asset creation.

The glass ribbon and social tokens are authored in code. A generated cloud image is served as an approximately 38 KB WebP. Keep textures and geometry finite; imply infinity through recycling, composition, and offscreen geometry.

## Current status

- The Sanctuary homepage and four Blender sculptures are implemented.
- The old scene, audio, stores, and orbit helpers remain unmounted for reference and rollback.
- Production export and eleven motion/focus tests pass; desktop and narrow browser interactions were checked.
- Independent Astra review: 7.8/10 on round one, then 8.4/10 after refinement on round two. The requested threshold was met within the three-round limit; see [REVIEW-NOTES.md](REVIEW-NOTES.md).
- There is no claim of measured device performance or deployment readiness.

## Contributor guidance

Read [ARCHITECTURE.md](ARCHITECTURE.md) before editing the scene. Keep performance-sensitive motion outside React state updates per frame, preserve finite geometry, and dispose owned resources. Run the relevant motion checks and production build after substantive changes, then record the actual results in [WEB-PHASES.md](WEB-PHASES.md).

Update current docs when behavior changes. Treat `blender/md/` and the old scene modules as historical references, not active requirements.
