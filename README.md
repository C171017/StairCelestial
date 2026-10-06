# Sanctuary — c171017

Latest follow-up: [continuous day cycle, slower layered wind, and photographic twilight colors](docs/validation/continuous-atmosphere-2026-10-06/README.md).
All three approved effects run on the homepage with slow depth-dependent wind,
balanced opacity and intermittent light accents. Scrolling changes the day;
ambient wind continues independently. The preceding [material-depth pass](docs/validation/material-depth/README.md)
records the marble, directional metal and beveled platinum control refinements.

**Current material build:** softly polished white marble spiral, deep black
satin-metal frames and restrained gold reveals. See the [updated handoff](docs/MATERIAL-BUILD-HANDOFF.md)
and [actual website screenshots and validation](docs/validation/black-gold-marble/README.md).

A personal portfolio carried by an endless softly polished white-marble ribbon above pearl clouds. Six sculptural glass portals float above it and cast soft moving shadows. Moving the ribbon and portals downward advances a continuous daylight–pink sunset–night–golden sunrise–daylight cycle; moving them upward reverses the clock. Idle drifting leaves that clock unchanged.

The October 5 [material refinement](docs/TEXTURE-REFINEMENT.md) implements restrained marble veins, softly shaped reflections, blackened-metal outer frames and brushed-gold insets. It retains the local CC0 marble maps, floating B2 forms and tinted glass. The earlier ivory-frame trial is documented as history. Visual quality comes first; device optimization follows the accepted visual reference. Generated studies are labeled separately from actual browser captures.

The current design pass uses six irregular framed glass slabs: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. All six travel on the homepage ribbon. Visit `/door-studies` for a numbered comparison room, individual inspection, viewing-angle adjustment, and dissolve experiments. These are provisional shape studies; the six forms reuse the four existing project destinations until a final selection is made.

The active design retains the floating B2 composition with its updated marble and metal finishes. Earlier glass-ribbon and celestial-staircase modules remain as references. [The porcelain implementation](docs/PORCELAIN-IMPLEMENTATION.md) preserves the October 4 geometry, lighting and interaction history; [current architecture](docs/ARCHITECTURE.md) describes the active renderer.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Controls

- The eye opens into two sculpted glass rings, with soft particles carrying the transition. The central sculpture begins turning as it appears, grows through two eased revolutions over 7.8 seconds, and settles on the ribbon’s center axis at its composed height. That world-space anchor follows the spiral when a door opens, rather than staying at the viewport center. The rings dissolve while the ribbon fades in; clicking the control opts into audio without restarting its movement.
- Scroll or swipe vertically to move the ribbon. Explicit travel rotates the key light and its real cast shadows through daylight, sunset and night; reversing travel reverses the clock. Twenty user-driven turns complete a day, making the background time change 2.5 times slower relative to the structures. Gentle idle travel resumes in the last direction without changing the selected time of day.
- Mobile uses a small document overflow to paint the scene behind Safari's floating bars. Swipes move the ribbon virtually while the large-viewport canvas stays stationary, avoiding scroll-timeline jumps and flashes. The bars no longer collapse/expand with each ribbon swipe. The original intro and pinch zoom remain available; desktop input and layout are unchanged.
- Select a project sculpture to bring it into focus.
- Activate the selected sculpture again to open its project. Scroll, press Escape, or use the close control to return smoothly.
- LinkedIn and GitHub objects are independent of ribbon movement. Both URLs remain unconfigured; their placeholder status is available to assistive technology.

A new sound design and conventional navigation remain deferred. The original intro audio opt-in and central play/pause control are restored with the original audio assets. Reduced-motion preferences disable automatic cruising and focus travel.

Audio starts on a completed tap/click so touch Safari receives user activation before the media and AudioContext start. A swipe across the control does not toggle playback. The stationary mobile viewport was checked in Safari on an iOS 27 simulator: 2,539 recorded frames of scripted touch reversals kept a reference line at the same pixel position, with no blank flashes. The eye-to-sphere-to-triangle entrance and full-screen coverage were checked separately. This is simulator verification, not a physical-device performance guarantee. Regression tests cover document positioning, desktop isolation, and zoom/pan cleanup.

## Content and assets

Project URLs remain in `src/lib/projects.ts`; display copy, model assignments, and social destinations are in `src/lib/sanctuaryContent.ts`.

The four sculptures are exported from [`blender/sanctuary-assets.blend`](blender/sanctuary-assets.blend). The reproducible builder is [`blender/build_sanctuary_assets.py`](blender/build_sanctuary_assets.py). Runtime GLBs are in `public/models/sanctuary/`. The sky keeps camera-independent painter order while complete cloud silhouettes drift at different depths: large banks move slowly beneath faster cirrus, sailing clouds, and mist. A shared atmospheric clock continuously grades the sky, clouds, lights and reflections between equally spaced peak moments. Textures are in `public/textures/sanctuary/layers/`: an 8K desktop cloud atlas and a 4K compact atlas, with WebP fallbacks. Original artwork and the 24K rendered reference are retained in `assets/sky/`. The door-study room keeps its flat 4K backdrop.

The crowned door geometry was exported from [`blender/door-studies-pearl.blend`](blender/door-studies-pearl.blend) by [`blender/build_door_studies.py`](blender/build_door_studies.py); the current black-metal and gold materials are assigned at runtime. Six stationary slab GLBs live in `public/models/doors/` (about 1.99 MB total). Their coordinated glass colors are shared through `src/lib/doorPalette.json`. The earlier project sculptures and Blender scenes are preserved. Shape descriptions and reference links are in [the door study notes](docs/DOOR-STUDIES.md).

## Development notes

- [Project direction and scope](docs/PROJECT.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Floating porcelain, moving shadows, and the atmospheric clock](docs/PORCELAIN-IMPLEMENTATION.md)
- [Proposed flowing-cloud sky and scored options](docs/SKY-DESIGN-PLAN.md)
- [Sky upscaling experiments and reusable lessons](docs/SKY-ASSET-NOTES.md)
- [Implemented layered sky, resolution, and validation](docs/SKY-IMPLEMENTATION.md)
- [Implementation and validation checklist](docs/WEB-PHASES.md)

The active implementation is `src/components/sanctuary/`. Older `src/components/scene/`, door/orbit modules, and `blender/md/` describe the legacy version, not the current design.

Door panes use partially silvered cast glass with polished edges and optical thickness variation. Crowned blackened-metal surrounds have a recessed brushed-gold reveal. `floatingDoor.ts` holds each frame above the highest point of its curved footprint, preserving an intentional air gap. A directional sun/moon casts real soft shadows onto the white marble in `PorcelainRibbon.tsx`; pane shadow coverage is a partial-transmission approximation, not colored caustics. Reflection maps capture the actual layered sky with five shaped highlight cards, including a feathered rear bounce, and refresh as the clock changes. These shared environment reflections are not full-scene ray tracing. Occluded far portals and viewport-edge fragments fade gently; the selected doorway remains fully visible. The original analytic contact shader and glass ribbon are no longer mounted here.

The reconstruction is implemented and undergoing browser validation and independent design review. Do not infer measured performance, a review score, or deployment readiness from this README.

Solid door finishes and sculptures use a coverage fade (`materialReveal.ts`) to retain depth and opaque-pass membership during focus/return transitions. This introduces fine grain during partial fades but avoids exposing hidden frame layers and switching the glass refraction buffer at the final frame. The ribbon is split into 72 seamless, independently sorted arcs, and door instances keep their occurrence identity across pool recycling. Transmissive surfaces still use alpha blending without depth writes; these changes reduce sorting jumps rather than providing order-independent glass rendering.

Interior sculptures have their own reversible easing (`sculptureReveal.ts`), reaching roughly 95% visibility in 0.8 seconds and fading to 5% in 0.7 seconds. A subtle 5% scale and short depth movement accompany the dissolve; reduced motion keeps only a brief dissolve. Closing or scrolling away preserves the current reveal state, and the parent door never cuts off the outgoing sculpture's fade.

Stack: Next.js 15, React 19, TypeScript, React Three Fiber, Drei, Three.js, and Blender GLBs.
