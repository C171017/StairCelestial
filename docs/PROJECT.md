# Project direction

## Latest owner correction — October 6, 2026

The owner found the previous atmosphere pass too subtle. The four moods now
have equal dominant journey length, with broad full-color cores and gradual
blends. Sunrise is distinctly gold, sunset pink, stars are denser, meteors
continue through the full night, and horizon wisps visibly translate in a
shared wind. Higher key elevation, tighter shadow filtering and less
unshadowed fill restore readable portal shadows on the ribbon. See
[actual captures, motion recording and validation](validation/atmosphere-visibility-2026-10-06/README.md).
This instruction supersedes brief twilight durations and the midnight meteor
cutoff. Prior review scores below belong to the previous implementation.

## Latest owner direction — October 5, 2026

The owner selected the moving celestial paths and atmosphere effects, and
explicitly relaxed exact distance/time/shadow proportionality in favor of
visual coherence and performance. [The local implementation](validation/atmosphere/README.md)
adds flowing wisps, warm sunrise, pearl daylight, pink sunset, moon/stars/halo,
and evening meteors. The requested three Astra High review rounds scored
7.2 → 7.5 → 7.8; the 8.0 target was not met, and visual iteration stopped at the
three-round limit. [The design brief](ATMOSPHERE-REFINEMENT.md) retains the
selection and earlier brainstorming history.

Follow-up review: the marble must remain visible in the brightest daylight;
door frames must read as metal. Try a premium central-control material first,
then consider environment-matching or inverse colors only if that option is
rejected. The [implemented follow-up](validation/material-depth/README.md)
uses larger neutral veins, directional dark metal and beveled brushed platinum.
The platinum option is for review, not an approved final choice.

**Implemented final choice: softly polished white
marble spiral and deep dark black frames with a little gold. Eliminating the
plastic appearance is the top priority.** This supersedes the earlier bronze
frame previews. [Build handoff](MATERIAL-BUILD-HANDOFF.md) contains the current
code state and continuation guidance. The original handoff-only session and
ivory-frame trial are historical; the black/gold finish is now in the local
homepage and `/door-studies`. [Actual website evidence and validation](validation/black-gold-marble/README.md)
record the implemented result.

[Texture refinement](TEXTURE-REFINEMENT.md) records the current priority:
restrained, high-end material craftsmanship, with visual quality established
before device optimization. The active material pass uses softly polished white
marble with restrained mineral detail, black satin-metal frames, and recessed
brushed-gold accents. A feathered fifth reflection card improves polish
readability; existing geometry, tinted glass, direct lighting and interactions
remain the baseline. The owner wants a design-award level of polish; this is an
aspiration and review standard, not a claim of an award or flawless execution.

The atmosphere pass retains the existing eased eight-turn user clock and idle
time policy. Celestial arcs, flowing wisps and visibility rules are now local
runtime behavior. New sound remains deferred. The latest instruction makes
performance a practical constraint alongside material quality.

## Active experience

Sanctuary is a sculptural portfolio with six floating cast-glass portals, deep-black metal frames, restrained gold reveals, and a vertically endless white-marble helix. Pearl daylight evolves through sunset to indigo night with explicit user travel.

The owner selected the floating B2 direction and requested tasteful maximal lighting/shadow quality before performance optimization. Vertical scrolling drives unrestricted camera orbit and a reversible atmospheric clock; its rotating key light gives the floating portals clock-like cast shadows. A separately requested chat explores glass version C.

## Interaction contract

The current presentation has no visible interface text or floating link indicators. Retain accessible names; brand marks on the social sculptures remain part of the objects. Select a project sculpture to focus it, then activate the same sculpture again to open its destination. Scroll, Escape, or the close control returns to the ribbon.

- Vertical wheel/swipe input moves the ribbon and orbits the camera around its center with no turn limit. Keep the camera and world-fixed sky outside the ribbon scrolling/focus transforms. Horizontal input is not mapped to orbit.
- Preserve deliberate continuous idle travel with proportional rotation (one quarter orbit turn per ribbon turn). Scroll rotation is half the earlier amount. Smooth acceleration, reversals, selection, and return; no abrupt target reset.
- Suspend the six sculptural glass doors above the ribbon with a deliberate air gap and real cast shadows. The whole footprint clears the curved receiver. Each has a fixed frame and moving glass leaf with an invisible animation pivot. Exposed hinges, mounting arms, and axle hardware are removed from all six. Randomize shape order, spacing, lateral placement, size, and yaw anew for each visit; the floating presentation biases frames toward readable three-quarter views; preserve visited occurrences when scrolling back. Shapes always retain their dedicated project, link, and sculpture: Melt/Cloud → Music, Seed/Orbit → JazzTree, Fault → Guanchang, Hourglass → Columbia-Barnard Network.
- Select a door to move closer and face whichever finished side has fewer spiral obstructions. Its leaf opens and reveals the corresponding 3D project sculpture behind it; activating the selected door opens the project's destination. Returning to the default view hides the sculpture and closes the door. Focus moves and rotates the ribbon composition toward the current camera viewpoint; reduced motion settles the selected view immediately.
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

The active assets are six crowned blackened-metal surrounds with semitransparent, partially silvered colored glass slabs: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. Their ivory, sage, ice-blue, blush, cream, and lavender glass tints retain the existing optical finish, polished edges and warm inner light; a restrained brushed-gold reveal sits inside the black frame. Glass colors live in `src/lib/doorPalette.json`, with runtime materials in `doorMaterials.ts`. Source and builder are `blender/door-studies-pearl.blend` and `blender/build_door_studies.py`; portable GLBs live in `public/models/doors/`. The material pass did not rebuild the geometry. The prior sculptures and original Blender scenes are preserved.

`/door-studies` is a separate comparison room with numbered labels, all-six and individual views, a turn control, and reversible dissolve experiments. The text-free homepage and existing entrance remain intact. The slabs remain stationary within their frames and dissolve on selection.

The marble ribbon and social tokens are authored in code. The ribbon's local CC0 color, roughness and height maps remain fixed to the geometry through section/pool recycling. The cloud field retains fixed positions, silhouettes and painter order to avoid the previous orbital popping. Internal vapor detail flows gently; a continuous atmospheric palette changes cloud lighting rather than fading a black overlay over the scene. The clock also controls the sky, key/fill lights, reflection capture, haze colors, stars and rare meteors. The current atlas remains 8K desktop / 4K compact with WebP fallbacks. Master artwork is preserved outside public assets. Keep resources finite and owned/disposed correctly even while visual quality is prioritized.

## Current status

- The Sanctuary homepage now carries six Blender door studies. The four earlier project sculptures appear behind the selected open door and disappear on return.
- The original eye gate, play control, audio provider, intro reveal, and intro store are reused. The old staircase, planets, and orbit helpers remain unmounted.
- The black/gold and white-marble implementation is in place. Its completed checks and actual browser captures are recorded in [current material validation](validation/black-gold-marble/README.md); shared environment reflections are not ray tracing or nearby-object reflections.
- Historical reconstruction validation passed production export and eleven motion/focus tests, with desktop and narrow browser checks. Historical independent Astra review scored 7.8/10 on round one and 8.4/10 after refinement on round two; these are not scores for the new material pass. See [REVIEW-NOTES.md](REVIEW-NOTES.md).
- There is no claim of measured device performance or deployment readiness.

## Contributor guidance

### Historical floating porcelain selection — October 4, 2026

The owner selected floating portals for B, explicitly prioritizing tasteful visual quality over performance tuning. Its real cast shadows rotate with the scroll-controlled day clock; shadow and object illumination must agree. That geometry, lighting and interaction work is documented in [PORCELAIN-IMPLEMENTATION.md](PORCELAIN-IMPLEMENTATION.md); its material parameters are superseded by the current marble/black/gold build. The earlier [visual critique](VISUAL-POLISH-REVIEW.md) and [generated comparisons](../assets/design-directions/README.md) retain the design history, not an unselected/paused state.

The separate C worktree was requested with Astra Ultra for polished smoked-crystal glass and smooth day/night progression. This checkout implements B independently. Initial M2 and later M4/A18/A19 budgets are historical targets; the latest brief defers performance optimization and does not establish measured device guarantees.

Explicit user travel drives the clock; idle drift keeps its time of day. Upward motion advances daylight toward sunset/night, downward motion reverses it. A continuous eight-turn cycle permits unlimited travel without pool-boundary jumps. Distant city lights remain a future idea and are not implemented.

### Implementation guidance

Read [ARCHITECTURE.md](ARCHITECTURE.md) before editing the scene. Keep performance-sensitive motion outside React state updates per frame, preserve finite geometry, and dispose owned resources. Run the relevant motion checks and production build after substantive changes, then record the actual results in [WEB-PHASES.md](WEB-PHASES.md).

Before sky or cloud asset work, read [SKY-IMPLEMENTATION.md](SKY-IMPLEMENTATION.md) for the current renderer and [SKY-ASSET-NOTES.md](SKY-ASSET-NOTES.md) for observed upscaling, alpha, compression, and lifecycle pitfalls. [SKY-DESIGN-PLAN.md](SKY-DESIGN-PLAN.md) retains the original scored options; option A was selected.

Update current docs when behavior changes. Treat `blender/md/` and the old scene modules as historical references, not active requirements.
