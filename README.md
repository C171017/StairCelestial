# Sanctuary — c171017

A personal portfolio carried by an endless glass ribbon above clouds. Project sculptures travel with the ribbon; the camera, sky, and floating social objects stay independent of scrolling.

This reconstruction lives on `codex/glass-ribbon`. The previous celestial staircase remains in Git and in unmounted legacy modules.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Controls

- Select the eye or **Step inside** to enter. The lightweight entrance remains visible while the scene prepares.
- Scroll or swipe vertically to move the ribbon. Gentle continuous movement resumes in the last travel direction.
- Select a project sculpture or its label to bring it into focus and reveal its details.
- Use **Explore project** to open the existing project destination.
- Scroll, select the sculpture again, press Escape, or use the close control to return smoothly.
- LinkedIn and GitHub objects are independent of ribbon movement. Both URLs are intentionally unconfigured and currently show a short placeholder notice.

Sound design and a conventional navigation system are deferred. Legacy audio files are retained but are not loaded by this homepage. Reduced-motion preferences disable automatic cruising and focus travel.

## Content and assets

Project URLs remain in `src/lib/projects.ts`; display copy, model assignments, and social destinations are in `src/lib/sanctuaryContent.ts`.

The four sculptures are exported from [`blender/sanctuary-assets.blend`](blender/sanctuary-assets.blend). The reproducible builder is [`blender/build_sanctuary_assets.py`](blender/build_sanctuary_assets.py). Runtime GLBs are in `public/models/sanctuary/`; the generated cloudscape is optimized to an approximately 38 KB WebP in `public/textures/sanctuary/`.

## Development notes

- [Project direction and scope](docs/PROJECT.md)
- [Current architecture](docs/ARCHITECTURE.md)
- [Implementation and validation checklist](docs/WEB-PHASES.md)

The active implementation is `src/components/sanctuary/`. Older `src/components/scene/`, door/orbit modules, and `blender/md/` describe the legacy version, not the current design.

The reconstruction is implemented and undergoing browser validation and independent design review. Do not infer measured performance, a review score, or deployment readiness from this README.

Stack: Next.js 15, React 19, TypeScript, React Three Fiber, Drei, Three.js, and Blender GLBs.
