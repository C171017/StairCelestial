# Sanctuary architecture

This document describes the active glass-ribbon homepage. The old staircase, rectangular portals, planets, and moving-camera design are legacy. Six new irregular glass-door studies are mounted on the ribbon.

## Entry and component map

- `src/app/page.tsx` mounts `SanctuaryExperience`.
- `src/components/sanctuary/SanctuaryExperience.tsx` owns entrance intent/readiness, selection, the project detail panel, placeholder notices, Escape handling, and error/timeout fallback. It dynamically imports the Canvas with SSR disabled.
- `SanctuaryScene.tsx` creates the fixed camera, cloud background, studio environment, readiness marker, ribbon world, and independent social objects.
- `GlassRibbon.tsx` renders the procedurally swept glass strip and fine edge highlights.
- `ProjectArtifact.tsx` supplies the door hit target and accessible label. `GlassDoor.tsx` clones each shared GLB hierarchy, owns/disposes cloned materials, and moves only the rig's `door_role=pivot` subtree. Fixed frames remain stationary. Shape identifiers live in `src/lib/doorStudies.ts` independently of project records.
- `/door-studies` mounts `DoorStudyExperience` and `DoorStudyScene`, reusing the cloud texture, studio lighting, and `GlassDoor`. It presents a responsive three-by-two/two-by-three comparison and individual views with hinge, dissolve, and viewing-angle controls. It deliberately bypasses the portfolio entrance for direct review.
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

A selection records a project index and absolute ribbon turn. During selection, cruise eases to a pause. Activating the selected sculpture again opens its project URL. Scroll clears selection and begins the smooth return; the close control and Escape also return to the overview. Floating text and link indicators are not shown.

## Entrance and readiness

The original `AudioConsentGate` and `EyeConsentSvg` supply the opening eye and handoff. `PlayControl3D` preserves the real tetrahedron, idle motion, click behavior, fly-to-top dock, and play/cube states. `AUDIO_CONSENT_TIMING.clickAwaitDuration` is now 2 seconds; all other original timing remains unchanged, including reduced-motion shortcuts. Both components accept a cloud theme without changing the legacy default styling.

`SanctuaryExperience` wraps the Canvas and gate in the original `SiteAudioProvider` and derives entry from the intro store. `PlayControl3D` is outside the project-asset Suspense boundary, so its geometry can appear without waiting for project GLBs. A small Drei HUD layer renders it above the ribbon and gives its pointer events priority over passing project sculptures. `IntroSceneReveal` fades only the ribbon and social objects; the control remains independently visible. The Canvas itself is not faded, which would hide the flying control. Shader/asset readiness sets `sceneBootstrapped`, and the original controller waits for this before revealing the world and unlocking scrolling.

A scene error boundary and entrance timeout expose lightweight project links. The original consent sting and ambient track are available again through the restored control: automatic entry stays muted, clicking opts into audio, and the dock toggles play/pause. New sound design and ordinary navigation remain deferred.


## Content and external links

`src/lib/projects.ts` remains the source for the four project identities and existing URLs. `src/lib/sanctuaryContent.ts` maps those records to their presentation text and `music`, `jazz`, `atlas`, or `network` sculpture.

To add a project, supply both the base project record and its Sanctuary presentation mapping; those arrays assume four entries. The ribbon cycles over six door studies, mapping each study index modulo the four project records. Selection retains both the project index and absolute ribbon turn, so repeated destinations focus the correct occurrence. Final project-to-door assignments are deferred until shape selection.

Both social URLs are deliberately `null`. Activating a token shows a placeholder notice. Once configured, the token and label open the supplied URL with `noopener,noreferrer`. Do not infer a personal social account from a project-hosting URL.

## Assets and rendering budget

- `blender/sanctuary-assets.blend` contains the four sculptures and a studio inspection scene, preserving the original default scene.
- `blender/build_sanctuary_assets.py` builds and exports the sculptures without depending on remote asset downloads.
- `public/models/sanctuary/{music,jazz,atlas,network}.glb` use named portable materials, ground-centered origins, and glTF Y-up coordinates. Each sculpture has 4–7 material meshes; the four files total approximately 1.80 MB uncompressed.
- `public/models/sanctuary/studio-preview.png` is an inspection render, not a runtime texture.
- `public/textures/sanctuary/cloudscape.webp` is the generated, optimized cloud backdrop, approximately 38 KB.
- `blender/door-studies.blend` preserves earlier scenes and adds the six-threshold studio. `blender/build_door_studies.py` reproduces six GLBs with a `door_role=pivot` empty, leaf subtree, static glass frame, pulls, and hardware. `public/models/doors/manifest.json` records export sizes, heights, and source-space pivots; runtime coordinates are glTF Y-up. Total new GLB size is 2,290,620 bytes.

The Canvas caps DPR at 1.5 and captures a low-resolution studio environment once. Avoid full volumetric clouds, unnecessary render passes, per-frame model cloning, or expanding the finite pool. These are implementation choices, not proof of a measured frame rate; device performance still requires validation.

## Validation commands

```bash
npm test
npm run lint
npm run build
```

Browser validation must cover desktop and compact layouts, entrance readiness and failure, scroll continuity across positive/negative cycles, focus interruption and return, social independence, touch tap/drag separation, and reduced motion. Record observed results rather than assuming tests establish visual quality.

## Legacy code

Most of `src/components/scene/` (excluding the reused play control and intro reveal), `useVirtualScrollIndex`, the door/orbit helpers, `public/models/*.glb`, and `blender/stairCelestial.blend` remain for reference. Their presence does not mean the active homepage loads them. The historical Blender prompt sequence under `blender/md/` describes that previous design.
