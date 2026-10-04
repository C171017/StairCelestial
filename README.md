# Sanctuary — c171017

A personal portfolio carried by an endless milk-ivory porcelain ribbon above pearl clouds. Six sculptural glass portals float above it and cast soft moving shadows. Scrolling orbits the scene and turns a continuous daylight–sunset–night clock; idle drifting leaves that clock unchanged.

The current design pass uses six irregular framed glass slabs: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. All six travel on the homepage ribbon. Visit `/door-studies` for a numbered comparison room, individual inspection, viewing-angle adjustment, and dissolve experiments. These are provisional shape studies; the six forms reuse the four existing project destinations until a final selection is made.

The active design is the floating porcelain B2 direction. Earlier glass-ribbon and celestial-staircase modules remain as references. See [the porcelain implementation](docs/PORCELAIN-IMPLEMENTATION.md) for current rendering and validation details.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Controls

- The eye opens into two sculpted glass rings, with soft particles carrying the transition. The central sculpture begins turning as it appears, grows through two eased revolutions over 7.8 seconds, and settles on the ribbon’s center axis at its composed height. That world-space anchor follows the spiral when a door opens, rather than staying at the viewport center. The rings dissolve while the ribbon fades in; clicking the control opts into audio without restarting its movement.
- Scroll or swipe vertically to move the ribbon. Explicit travel rotates the key light and its real cast shadows through daylight, sunset and night; reversing travel reverses the clock. Eight user-driven turns complete a day. Gentle idle travel resumes in the last direction without changing the selected time of day.
- Mobile uses a small document overflow to paint the scene behind Safari's floating bars. Swipes move the ribbon virtually while the large-viewport canvas stays stationary, avoiding scroll-timeline jumps and flashes. The bars no longer collapse/expand with each ribbon swipe. The original intro and pinch zoom remain available; desktop input and layout are unchanged.
- Select a project sculpture to bring it into focus.
- Activate the selected sculpture again to open its project. Scroll, press Escape, or use the close control to return smoothly.
- LinkedIn and GitHub objects are independent of ribbon movement. Both URLs remain unconfigured; their placeholder status is available to assistive technology.

A new sound design and conventional navigation remain deferred. The original intro audio opt-in and central play/pause control are restored with the original audio assets. Reduced-motion preferences disable automatic cruising and focus travel.

Audio starts on a completed tap/click so touch Safari receives user activation before the media and AudioContext start. A swipe across the control does not toggle playback. The stationary mobile viewport was checked in Safari on an iOS 27 simulator: 2,539 recorded frames of scripted touch reversals kept a reference line at the same pixel position, with no blank flashes. The eye-to-sphere-to-triangle entrance and full-screen coverage were checked separately. This is simulator verification, not a physical-device performance guarantee. Regression tests cover document positioning, desktop isolation, and zoom/pan cleanup.

## Content and assets

Project URLs remain in `src/lib/projects.ts`; display copy, model assignments, and social destinations are in `src/lib/sanctuaryContent.ts`.

The four sculptures are exported from [`blender/sanctuary-assets.blend`](blender/sanctuary-assets.blend). The reproducible builder is [`blender/build_sanctuary_assets.py`](blender/build_sanctuary_assets.py). Runtime GLBs are in `public/models/sanctuary/`. The sky keeps fixed cloud silhouettes and camera-independent painter order. A shared atmospheric clock grades the sky, clouds, lights and reflections, while subtle flow stays inside cloud silhouettes. Textures are in `public/textures/sanctuary/layers/`: an 8K desktop cloud atlas and a 4K compact atlas, with WebP fallbacks. Original artwork and the 24K rendered reference are retained in `assets/sky/`. The door-study room keeps its flat 4K backdrop.

The active crowned porcelain and champagne-gold doors are exported from [`blender/door-studies-pearl.blend`](blender/door-studies-pearl.blend) by [`blender/build_door_studies.py`](blender/build_door_studies.py). Six stationary slab GLBs live in `public/models/doors/` (about 1.99 MB total). Their coordinated colors are shared through `src/lib/doorPalette.json`. The earlier project sculptures and Blender scenes are preserved. Shape descriptions and reference links are in [the door study notes](docs/DOOR-STUDIES.md).

## Development notes

- [Project direction and scope](docs/PROJECT.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Floating porcelain, moving shadows, and the atmospheric clock](docs/PORCELAIN-IMPLEMENTATION.md)
- [Proposed flowing-cloud sky and scored options](docs/SKY-DESIGN-PLAN.md)
- [Sky upscaling experiments and reusable lessons](docs/SKY-ASSET-NOTES.md)
- [Implemented layered sky, resolution, and validation](docs/SKY-IMPLEMENTATION.md)
- [Implementation and validation checklist](docs/WEB-PHASES.md)

The active implementation is `src/components/sanctuary/`. Older `src/components/scene/`, door/orbit modules, and `blender/md/` describe the legacy version, not the current design.

Door panes use partially silvered cast glass with polished edges and optical thickness variation. Crowned satin porcelain surrounds have a recessed champagne reveal. `floatingDoor.ts` holds each frame above the highest point of its curved footprint, preserving an intentional air gap. A directional sun/moon casts real soft shadows onto `PorcelainRibbon.tsx`; pane shadow coverage is a partial-transmission approximation, not colored caustics. Reflection maps capture the actual layered sky with shaped highlight cards and refresh as the clock changes. Occluded far portals and viewport-edge fragments fade gently; the selected doorway remains fully visible. The original analytic contact shader and glass ribbon are no longer mounted here.

The reconstruction is implemented and undergoing browser validation and independent design review. Do not infer measured performance, a review score, or deployment readiness from this README.

Solid door finishes and sculptures use a coverage fade (`materialReveal.ts`) to retain depth and opaque-pass membership during focus/return transitions. This introduces fine grain during partial fades but avoids exposing hidden frame layers and switching the glass refraction buffer at the final frame. The ribbon is split into 72 seamless, independently sorted arcs, and door instances keep their occurrence identity across pool recycling. Transmissive surfaces still use alpha blending without depth writes; these changes reduce sorting jumps rather than providing order-independent glass rendering.

Interior sculptures have their own reversible easing (`sculptureReveal.ts`), reaching roughly 95% visibility in 0.8 seconds and fading to 5% in 0.7 seconds. A subtle 5% scale and short depth movement accompany the dissolve; reduced motion keeps only a brief dissolve. Closing or scrolling away preserves the current reveal state, and the parent door never cuts off the outgoing sculpture's fade.

Stack: Next.js 15, React 19, TypeScript, React Three Fiber, Drei, Three.js, and Blender GLBs.
