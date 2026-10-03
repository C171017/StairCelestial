# Sanctuary — c171017

A personal portfolio carried by an endless glass ribbon above clouds. Project sculptures travel with the ribbon; the camera, sky, and floating social objects stay independent of scrolling.

The current design pass restores the door metaphor with six irregular glass thresholds: Melt, Seed, Fault, Hourglass, Cloud, and Orbit. All six travel on the homepage ribbon. Visit `/door-studies` for a numbered comparison room, individual inspection, viewing-angle adjustment, and hinge/dissolve experiments. These are provisional shape studies; the six forms reuse the four existing project destinations until a final selection is made.

This reconstruction lives on `codex/glass-ribbon`. The previous celestial staircase remains in Git and in unmounted legacy modules.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Controls

- The original animated eye opens and hands off to the original 3D triangle. The control waits two seconds before automatically flying to its top-center dock; clicking it enters immediately with the original audio opt-in. The ribbon fades in during the flight once prepared.
- Scroll or swipe vertically to move the ribbon. Gentle continuous movement resumes in the last travel direction.
- Select a project sculpture to bring it into focus.
- Activate the selected sculpture again to open its project. Scroll, press Escape, or use the close control to return smoothly.
- LinkedIn and GitHub objects are independent of ribbon movement. Both URLs remain unconfigured; their placeholder status is available to assistive technology.

A new sound design and conventional navigation remain deferred. The original intro audio opt-in and docked play/pause control are restored with the original audio assets. Reduced-motion preferences disable automatic cruising and focus travel.

## Content and assets

Project URLs remain in `src/lib/projects.ts`; display copy, model assignments, and social destinations are in `src/lib/sanctuaryContent.ts`.

The four sculptures are exported from [`blender/sanctuary-assets.blend`](blender/sanctuary-assets.blend). The reproducible builder is [`blender/build_sanctuary_assets.py`](blender/build_sanctuary_assets.py). Runtime GLBs are in `public/models/sanctuary/`; the generated cloudscape is optimized to an approximately 38 KB WebP in `public/textures/sanctuary/`.

The active doors are exported from [`blender/door-studies.blend`](blender/door-studies.blend) by [`blender/build_door_studies.py`](blender/build_door_studies.py). Six independently rigged GLBs live in `public/models/doors/` (about 2.29 MB total). The earlier project sculptures and Blender scenes are preserved. Shape descriptions and reference links are in [the door study notes](docs/DOOR-STUDIES.md).

## Development notes

- [Project direction and scope](docs/PROJECT.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Implementation and validation checklist](docs/WEB-PHASES.md)

The active implementation is `src/components/sanctuary/`. Older `src/components/scene/`, door/orbit modules, and `blender/md/` describe the legacy version, not the current design.

The reconstruction is implemented and undergoing browser validation and independent design review. Do not infer measured performance, a review score, or deployment readiness from this README.

Stack: Next.js 15, React 19, TypeScript, React Three Fiber, Drei, Three.js, and Blender GLBs.
