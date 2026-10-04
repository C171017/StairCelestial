# Sanctuary — c171017

A personal portfolio carried by an endless glass ribbon above clouds. Project sculptures travel with the ribbon; vertical scrolling also orbits the camera continuously around its center, inside a surrounding cloud sky.

The current design pass uses six irregular framed glass slabs: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. All six travel on the homepage ribbon. Visit `/door-studies` for a numbered comparison room, individual inspection, viewing-angle adjustment, and dissolve experiments. These are provisional shape studies; the six forms reuse the four existing project destinations until a final selection is made.

This reconstruction lives on `codex/glass-ribbon`. The previous celestial staircase remains in Git and in unmounted legacy modules.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Controls

- The eye opens into two sculpted glass rings, with soft particles carrying the transition. The central sculpture begins turning as it appears, grows through two eased revolutions over 7.8 seconds, and settles on the ribbon’s center axis at camera height. That world-space anchor follows the spiral when a door opens, rather than staying at the viewport center. The rings dissolve while the ribbon fades in; clicking the control opts into audio without restarting its movement.
- Scroll or swipe vertically to move the ribbon. Gentle continuous movement resumes in the last travel direction.
- Mobile touch devices use native document scrolling behind the fixed scene, allowing Safari to collapse its browser bars. The scene follows the dynamic viewport height. Safari controls when its bars reappear; the site cannot enforce tap-only restoration. Desktop retains virtual scrolling.
- Select a project sculpture to bring it into focus.
- Activate the selected sculpture again to open its project. Scroll, press Escape, or use the close control to return smoothly.
- LinkedIn and GitHub objects are independent of ribbon movement. Both URLs remain unconfigured; their placeholder status is available to assistive technology.

A new sound design and conventional navigation remain deferred. The original intro audio opt-in and central play/pause control are restored with the original audio assets. Reduced-motion preferences disable automatic cruising and focus travel.

Audio starts on a completed tap/click so touch Safari receives user activation before the media and AudioContext start. A swipe across the control does not toggle playback. Mobile checks cover first-tap playback during and after the intro, pause/resume, native scrolling, viewport resizing, and landscape in desktop WebKit with iPhone emulation, plus trusted touch swipes in Chrome. These checks do not simulate Safari's iOS browser bars; toolbar collapse still needs a physical iPhone or an Xcode iOS simulator.

## Content and assets

Project URLs remain in `src/lib/projects.ts`; display copy, model assignments, and social destinations are in `src/lib/sanctuaryContent.ts`.

The four sculptures are exported from [`blender/sanctuary-assets.blend`](blender/sanctuary-assets.blend). The reproducible builder is [`blender/build_sanctuary_assets.py`](blender/build_sanctuary_assets.py). Runtime GLBs are in `public/models/sanctuary/`. The orbit sky uses a fixed plate, flowing cloud image layers, and shooting stars. Textures are in `public/textures/sanctuary/layers/`: an 8K desktop cloud atlas and a 4K compact atlas, with WebP fallbacks. Original artwork and the 24K rendered reference are retained in `assets/sky/`. The door-study room keeps its flat 4K backdrop.

The active pearl-ceramic and champagne-gold doors are exported from [`blender/door-studies.blend`](blender/door-studies.blend) by [`blender/build_door_studies.py`](blender/build_door_studies.py). Six stationary slab GLBs live in `public/models/doors/` (about 2.10 MB total). Their coordinated colors are shared through `src/lib/doorPalette.json`. The earlier project sculptures and Blender scenes are preserved. Shape descriptions and reference links are in [the door study notes](docs/DOOR-STUDIES.md).

## Development notes

- [Project direction and scope](docs/PROJECT.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Proposed flowing-cloud sky and scored options](docs/SKY-DESIGN-PLAN.md)
- [Sky upscaling experiments and reusable lessons](docs/SKY-ASSET-NOTES.md)
- [Implemented layered sky, resolution, and validation](docs/SKY-IMPLEMENTATION.md)
- [Implementation and validation checklist](docs/WEB-PHASES.md)

The active implementation is `src/components/sanctuary/`. Older `src/components/scene/`, door/orbit modules, and `blender/md/` describe the legacy version, not the current design.

Door panes use a lightly frosted, tinted physical material with a polished reflection layer (`doorMaterials.ts`). Their existing leaf-edge mesh has its own polished finish, which dissolves with the pane. Doors are fitted using their exported ceramic base contours (`doorSupport.ts`): their bases face mostly across the slope, their bases remain inside the ribbon edges, and oversized bases are scaled down on the compact layout. Frames sit directly on the ribbon without added sills or gold bars; hover scaling is disabled so contact stays fixed. Soft contact footprints are shaded directly into the curved ribbon (`ribbonShadows.ts`), following each occurrence's position, scale, facing, and focus visibility without additional scene renders. The shading is concentrated at the door base, with no broad cast patch. These are stylized grounding shadows, not accurate door silhouettes or glass caustics. Three.js's built-in transmission pass does not include other transparent surfaces, so the ribbon seen through a pane is not truly blurred; overlapping glass can still show sorting limitations. Keep depth writes disabled for these translucent surfaces to avoid cutting out the ribbon behind them.

The reconstruction is implemented and undergoing browser validation and independent design review. Do not infer measured performance, a review score, or deployment readiness from this README.

Solid door finishes and sculptures use a coverage fade (`materialReveal.ts`) to retain depth and opaque-pass membership during focus/return transitions. This introduces fine grain during partial fades but avoids exposing hidden frame layers and switching the glass refraction buffer at the final frame. The ribbon is split into 72 seamless, independently sorted arcs, and door instances keep their occurrence identity across pool recycling. Transmissive surfaces still use alpha blending without depth writes; these changes reduce sorting jumps rather than providing order-independent glass rendering.

Interior sculptures have their own reversible easing (`sculptureReveal.ts`), reaching roughly 95% visibility in 0.8 seconds and fading to 5% in 0.7 seconds. A subtle 5% scale and short depth movement accompany the dissolve; reduced motion keeps only a brief dissolve. Closing or scrolling away preserves the current reveal state, and the parent door never cuts off the outgoing sculpture's fade.

Stack: Next.js 15, React 19, TypeScript, React Three Fiber, Drei, Three.js, and Blender GLBs.
