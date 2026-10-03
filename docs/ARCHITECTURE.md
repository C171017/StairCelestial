# Sanctuary architecture

This document describes the active glass-ribbon homepage. The staircase, doors, planets, and moving-camera design are legacy and are not mounted by `src/app/page.tsx`.

## Entry and component map

- `src/app/page.tsx` mounts `SanctuaryExperience`.
- `src/components/sanctuary/SanctuaryExperience.tsx` owns entrance intent/readiness, selection, the project detail panel, placeholder notices, Escape handling, and error/timeout fallback. It dynamically imports the Canvas with SSR disabled.
- `SanctuaryScene.tsx` creates the fixed camera, cloud background, studio environment, readiness marker, ribbon world, and independent social objects.
- `GlassRibbon.tsx` renders the procedurally swept glass strip and fine edge highlights.
- `ProjectArtifact.tsx` loads a shared GLB, clones its object hierarchy for each repeated sculpture, and supplies a hit target and HTML label.
- `SocialArtifacts.tsx` renders the LinkedIn and GitHub tokens and their labels outside the moving ribbon hierarchy.
- `src/app/globals.css` supplies the entrance, overlays, typography, responsive layout, and atmosphere framing.

## Coordinates and infinite illusion

`src/lib/ribbonGeometry.ts` supplies the helix pitch, point placement, rounded ribbon geometry, and edge geometry. A finite six-turn strip extends beyond the view. Project slots repeat along it; there is no unbounded mesh allocation.

`RibbonWorld` wraps the scrolling group in a separate focus-transform group. Scroll changes the ribbon group's vertical position. The integer cycle selects the repeating project identities; the fractional cycle determines the local offset. The camera and sky are independent of this hierarchy. Social tokens may gently bob, but scrolling does not move them.

The viewport selects a narrower ribbon and smaller sculpture scale for compact screens. Model geometry remains grounded at local Y=0 with centered X/Z origins.

## Motion and focus

`src/lib/ribbonMotion.ts` is a pure motion integrator expressed in ribbon turns. It caps queued input and speed, eases acceleration and cruise velocity, handles either direction, and limits catch-up after a delayed frame.

`src/hooks/useRibbonMotion.ts` connects wheel and vertical-touch input on `#portfolio-scroll-surface` to that integrator. It ignores interactive elements and pinch gestures, normalizes wheel units, suppresses post-swipe clicks, watches reduced-motion preferences, and clears velocities when the page becomes hidden. The render loop consumes a ref; React state is not updated for every motion frame.

`src/lib/ribbonFocus.ts` eases the currently rendered ribbon transform toward a selected anchor. Clearing or replacing a selection changes the destination while retaining the current pose. This addresses the old abrupt return caused by resetting a camera focus target. Reduced-motion mode keeps the overview composition instead of applying focus travel.

A selection records a project index and absolute ribbon turn. During selection, cruise eases to a pause. Scroll clears selection and begins the smooth return. The detail close control, Escape, and selecting the same sculpture also return to the overview.

## Entrance and readiness

The SVG eye and HTML entrance render independently of the lazy 3D scene. Clicking the entrance records intent. The reveal waits until assets have resolved, `compileAsync` completes, and the scene advances several frames. Readiness and entry intent are separate states.

A scene error boundary and entrance timeout expose links to all four projects. This fallback is deliberately lightweight. The full sound system and ordinary navigation are outside this pass; the old audio gate is not mounted.

## Content and external links

`src/lib/projects.ts` remains the source for the four project identities and existing URLs. `src/lib/sanctuaryContent.ts` maps those records to their presentation text and `music`, `jazz`, `atlas`, or `network` sculpture.

To add a project, supply both the base project record and its Sanctuary presentation/model mapping; the current mapping arrays assume four entries. This reconstruction no longer uses door indices to lay out the active experience.

Both social URLs are deliberately `null`. Activating a token shows a placeholder notice. Once configured, the token and label open the supplied URL with `noopener,noreferrer`. Do not infer a personal social account from a project-hosting URL.

## Assets and rendering budget

- `blender/sanctuary-assets.blend` contains the four sculptures and a studio inspection scene, preserving the original default scene.
- `blender/build_sanctuary_assets.py` builds and exports the sculptures without depending on remote asset downloads.
- `public/models/sanctuary/{music,jazz,atlas,network}.glb` use named portable materials, ground-centered origins, and glTF Y-up coordinates. Each sculpture has 4–7 material meshes; the four files total approximately 1.80 MB uncompressed.
- `public/models/sanctuary/studio-preview.png` is an inspection render, not a runtime texture.
- `public/textures/sanctuary/cloudscape.webp` is the generated, optimized cloud backdrop, approximately 38 KB.

The Canvas caps DPR at 1.5 and captures a low-resolution studio environment once. Avoid full volumetric clouds, unnecessary render passes, per-frame model cloning, or expanding the finite pool. These are implementation choices, not proof of a measured frame rate; device performance still requires validation.

## Validation commands

```bash
npm test
npm run lint
npm run build
```

Browser validation must cover desktop and compact layouts, entrance readiness and failure, scroll continuity across positive/negative cycles, focus interruption and return, social independence, touch tap/drag separation, and reduced motion. Record observed results rather than assuming tests establish visual quality.

## Legacy code

`src/components/scene/`, the old UI/audio gate, `useVirtualScrollIndex`, the door/orbit helpers, old Zustand scene state, `public/models/*.glb`, and `blender/stairCelestial.blend` remain for reference. Their presence does not mean the active homepage loads them. The historical Blender prompt sequence under `blender/md/` describes that previous design.
