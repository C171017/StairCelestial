# Sanctuary architecture

This document describes the active glass-ribbon homepage. The old staircase, rectangular portals, planets, and former staircase camera rig are legacy. Six new irregular glass-door studies are mounted on the ribbon.

## Entry and component map

- `src/app/page.tsx` mounts `SanctuaryExperience`.
- `src/components/sanctuary/SanctuaryExperience.tsx` owns entrance intent/readiness, selection, the project detail panel, placeholder notices, Escape handling, and error/timeout fallback. It dynamically imports the Canvas with SSR disabled.
- `SanctuaryScene.tsx` creates the orbit camera, surrounding cloud sky, studio environment, readiness marker, and ribbon world.
- `OrbitSky.tsx` blends the high-resolution still panorama with a cloud video on the same world-fixed sphere. `useSkyVideo.ts` owns playback and fallback; `SkyEffects.tsx` adds separate world-anchored shooting stars and slow glints.
- `GlassRibbon.tsx` renders the procedurally swept glass strip and fine edge highlights.
- `ProjectArtifact.tsx` supplies the door hit target and accessible label. `GlassDoor.tsx` clones each shared GLB hierarchy, owns/disposes cloned materials, and dissolves only the stationary `door_role=slab` subtree. Fixed frames remain stationary. `ProjectSculpture.tsx` mounts the matching preserved project sculpture only for the selected door, wholly behind its slab, with its own reversible reveal easing. Shape identifiers live in `src/lib/doorStudies.ts` independently of project records.
- `/door-studies` mounts `DoorStudyExperience` and `DoorStudyScene`, reusing the cloud texture, studio lighting, and `GlassDoor`. It presents a responsive irregular scatter and individual views with dissolve and viewing-angle controls. It deliberately bypasses the portfolio entrance for direct review.
- `SocialArtifacts.tsx` renders the LinkedIn and GitHub tokens and their labels outside the moving ribbon hierarchy.
- `src/app/globals.css` supplies the entrance, overlays, typography, responsive layout, and atmosphere framing.

## Coordinates and infinite illusion

`src/lib/ribbonGeometry.ts` supplies the helix pitch, point placement, rounded ribbon geometry, and edge geometry. A finite six-turn strip extends beyond the view. Project slots repeat along it; there is no unbounded mesh allocation.

`RibbonWorld` wraps the scrolling group in a separate focus-transform group. Scroll changes the ribbon group's vertical position. The integer cycle selects the repeating project identities; the fractional cycle determines the local offset. The camera and sky are independent of this hierarchy. Vertical input also drives a separate, continuous camera orbit; the sky stays fixed in world space, so its projected view changes with the camera.

The viewport selects a narrower ribbon and smaller sculpture scale for compact screens. Model geometry remains grounded at local Y=0 with centered X/Z origins.

## Motion and focus

`src/lib/ribbonMotion.ts` is a pure motion integrator expressed in ribbon turns. It caps queued input and speed, eases acceleration and cruise velocity, handles either direction, and limits catch-up after a delayed frame.

`src/hooks/useRibbonMotion.ts` connects wheel and vertical-touch input on `#portfolio-scroll-surface` to that integrator. It ignores interactive elements and pinch gestures, normalizes wheel units, suppresses post-swipe clicks, watches reduced-motion preferences, and clears velocities when the page becomes hidden. The render loop consumes refs; React state is not updated for every motion frame. The ribbon retains its cruise, but the separate orbit integrator has zero cruise and caps angular speed at 0.18 turns/second (0.09 with reduced motion). One full orbit corresponds to 3,600 wheel pixels or 2,000 vertical touch pixels. Queued input is capped for responsiveness; the accumulated angle is unrestricted in both directions. Input advances before the camera, and the camera updates before projection-dependent controls.

`src/lib/ribbonFocus.ts` eases the currently rendered ribbon transform toward a selected anchor. Focus now also cancels the selected occurrence's random yaw and matches the camera's viewing pitch and azimuth, presenting the front face of the doorway. Translation accounts for the rotated anchor and the current camera azimuth, keeping the door centered above the audio control at every point around the orbit. Clearing or replacing a selection changes the destination while retaining the current pose, and orientation takes the shortest turn. Reduced-motion door selection settles immediately into the readable frontal view without an animated orbit.

A selection records a project index, absolute ribbon turn, and occurrence. During selection, cruise eases to a pause, the colored slab dissolves in place, and the corresponding project sculpture appears behind it. Activating the selected door again opens its project URL. Scroll, the close control, and Escape clear selection, fade out the sculpture, restore the slab, and return the ribbon's position, scale, and orientation to the overview. Inactive doors' invisible pick volumes are disabled during focus. `interactiveMeshRaycast.ts` explicitly restores Three's mesh raycast when a door becomes enabled: Fiber ignores `undefined` props, so using `undefined` would leave click detection disabled after entry or return. Floating text and link indicators are not shown.

## Entrance and readiness

`AudioConsentGate` and `EyeConsentSvg` supply the opening eye, waiting for scene readiness before starting. The cloud theme overlaps a 1.8-second displaced/softened eye fade with the appearance of the 3D control. `controlEntrance.ts` defines one 7.8-second clock for the sculpture’s reveal, growth and two-turn entrance, plus staggered ring dissolution. Its integrated velocity curve starts slowly, accelerates, then decelerates to rest. Changing interaction phase or clicking for audio does not restart this clock. The much slower ambient spin eases in afterward.

`IntroGlassRings` uses rounded torus meshes, a glossy black outer ring with studio reflections, a clear transmissive inner ring, and a soft procedural breakup. `IntroDissolveParticles` supplies a bounded, non-looping field of motes along the original eyelids and both rims. Rings and particles retain the eye’s footprint while `CloudPlayShape` settles at 70% of its previous final world size. `spiralControlAnchor.ts` intersects the spiral’s transformed local Y axis with camera-height world Y, keeping the control centered on the actual helix during orbit, door focus and return. The settled orientation is world-fixed apart from its own spin; focus does not pin it to the viewport or rescale it. The legacy theme retains its original fly-to-top behavior. Reduced motion skips the spin, particles and moving rings.

`SanctuaryExperience` wraps the Canvas and gate in `SiteAudioProvider` and derives entry from the intro store. `PlayControl3D` sits outside the project-asset Suspense boundary in the same scene, so the control participates in depth and glass transmission. Fully revealed solid control/project materials restore opaque rendering and depth writes, making them available to the glass transmission pass. The control shares the scene’s lighting and reflection environment. `IntroSceneReveal` fades the ribbon and its project objects independently. `materialReveal.ts` multiplies the scene fade by each object’s local opacity, so per-frame glass updates cannot overwrite the entrance fade and cause flashing. Shader/asset readiness sets `sceneBootstrapped`; scrolling unlocks when the entrance finishes.

A scene error boundary and entrance timeout expose lightweight project links. Automatic entry stays muted, clicking opts into audio, and the central control toggles play/pause during and after the entrance. New sound design and ordinary navigation remain deferred.


## Content and external links

`src/lib/projects.ts` remains the source for the four project identities and existing URLs. `src/lib/sanctuaryContent.ts` maps those records to their presentation text and `music`, `jazz`, `atlas`, or `network` sculpture.

To add a project, supply both the base project record and its Sanctuary presentation mapping; those arrays assume four entries. `doorProjectIds` in `sanctuaryContent.ts` explicitly binds shape identity to a project: Melt and Cloud → Music; Seed and Orbit → JazzTree; Fault → Guanchang; Hourglass → Columbia-Barnard Network. The project record supplies both the link and sculpture model, so random ordering cannot change either. Selection retains the project index and absolute occurrence, focusing the correct repeated door.

Both social URLs are deliberately `null`. Activating a token shows a placeholder notice. Once configured, the token and label open the supplied URL with `noopener,noreferrer`. Do not infer a personal social account from a project-hosting URL.

## Assets and rendering budget

- `blender/sanctuary-assets.blend` contains the four sculptures and a studio inspection scene, preserving the original default scene.
- `blender/build_sanctuary_assets.py` builds and exports the sculptures without depending on remote asset downloads.
- `public/models/sanctuary/{music,jazz,atlas,network}.glb` use named portable materials, ground-centered origins, and glTF Y-up coordinates. Each sculpture has 4–7 material meshes; the four files total approximately 1.80 MB uncompressed.
- `public/models/sanctuary/studio-preview.png` is an inspection render, not a runtime texture.
- `public/textures/sanctuary/cloudscape-360-8k.webp` is the 8192 × 4096 homepage sky (1,313,292 bytes), assembled from four overlapping ByteDance 4K upscales. Screens below 700 CSS pixels use `cloudscape-360-4k.webp` (4096 × 2048; 559,154 bytes). GPU texture limits can lower the selection further. A nested Suspense keeps the original `cloudscape-360.webp` visible while the selected texture loads. The high-resolution panorama already has a continuous wraparound section; only the original fallback needs the shader longitude repair. Both retain pole blending and a world-fixed sky shell with subtle positional parallax. This is not volumetric cloud geometry.
- The door-study room uses `cloudscape-4k.webp` (4096 × 2305; 172,818 bytes). The original `cloudscape.webp` is retained for low-limit GPUs and the CSS loading background.
- `scripts/prepare-sky-upscale.mjs` creates the overlapping source tiles and repairs the original longitude join within a single wraparound tile. `scripts/stitch-sky-upscale.mjs` validates tile dimensions, aligns fractional offsets, blends overlaps in linear light, exports the 8K/4K assets, and measures boundary continuity. Run both from the repository root with a working-directory argument; place the four 4096-square model outputs in that directory as specified by its manifest.
- `public/videos/sanctuary/cloud-drift-desktop.mp4` is 2720 × 1360 (8,609,827 bytes); `cloud-drift-compact.mp4` is 1536 × 768 (5,736,283 bytes). Each muted H.264 file contains 192 frames at 24 fps: an eight-second loop played at 0.8 speed for a ten-second cycle. The compact version serves screens below 700 CSS pixels or GPUs with texture limits below 4096.
- `blender/door-studies.blend` preserves earlier scenes and adds the six-threshold studio. `blender/build_door_studies.py` reproduces six GLBs with a centered `door_role=slab` group, glass surface and polished edge, beveled ceramic frame, champagne lining, and paired warm light strips, without handles or hinge rigs. `public/models/doors/manifest.json` records export sizes, heights, and source-space slab centers; runtime coordinates are glTF Y-up. Total door GLB size is 2,098,068 bytes.
- `src/lib/doorPalette.json` is shared by Blender and runtime `doorMaterials.ts`. Clearcoat ceramic is opaque; gold uses metallic-roughness shading. The clear leaves preserve the site's alpha/transmission approximation for overlapping glass. Only the slab surface and polished edge dissolve; instance-owned ceramic, gold, and light materials keep the frame intact. `StudioLight` captures the cloud panorama plus studio highlight panels once into a 256-pixel cube environment; reflections change with viewing angle, but do not track the animated sky video. The warm strips are emissive surfaces, not dynamic area lights.

The Canvas caps DPR at 1.5 and captures a low-resolution studio environment once. Avoid full volumetric clouds, unnecessary render passes, per-frame model cloning, or expanding the finite pool. These are implementation choices, not proof of a measured frame rate; device performance still requires validation.

## Animated sky and loop validation

The sky shader explicitly decodes video sRGB before blending in linear light. At steady playback, video contributes 65% near the cloud floor, rising smoothly to 80% in the upper sky; the 8K/4K still retains sharp structure. Both poles taper back to the still panorama. Video and effects remain fixed in world space as the camera orbits. Shooting stars and glints use a separate bounded 32-second schedule, so a meteor is not cut by the cloud video's loop boundary.

`retainIntroSession` preserves entrance state across Strict Mode/Fast Refresh effect replay and clears all intro fields only after the final owner truly unmounts. The eye overlay never restarts a completed handoff.

`useSkyVideo` waits for a decoded frame before revealing its texture. Reduced-motion and data-saving preferences disable video loading/playback; hidden documents pause it. The homepage keeps ambient sky playback independent of entrance interaction gating, so an entrance transition cannot freeze a visible sky. Load/decode failures or rejected autoplay retain the still sky. Brief buffering preserves the last decoded frame, and cleanup releases the media request, texture, and frame callbacks. Shooting stars and glints also pause when inactive or hidden, and are disabled by reduced motion.

`scripts/prepare-sky-video.py` processes the first ten seconds of the generated panorama with a two-second smoothstep overlap in linear light. It preserves the complete frame while normalizing the small aspect discrepancy to 2:1, blends the outer 2.5% longitude margins into matching edge columns on every frame, and encodes both sizes directly from repaired RGB frames. The reproducible pilot arguments are `--source-duration 10 --overlap 2 --fps 24 --compact-crf 14`; the script requires NumPy, Pillow, and FFmpeg or `imageio-ffmpeg`.

[Isolated-video measurements](validation/sky-video-loop.json) compare decoded frame and velocity changes across the loop with ordinary changes throughout the clip, by quadrant and horizon, and measure every longitude join. Desktop passes all numerical screens. The isolated compact video retains two conservative position flags (lower-left 1.033/255 versus a 1.023 limit; horizon 1.031/255 versus 1.000), while its velocity and longitude screens pass. [Displayed-composite measurements](validation/sky-video-displayed.json) apply the actual 65–80% linear blend and pole taper: both formats pass the same screens without changing thresholds. Reproduce the displayed checks with `scripts/check-sky-composite.py`, which reads the current blend from the shader and uses each format’s shipping still image. These 512 × 256 CPU measurements supplement browser inspection; they do not establish GPU sampling, playback smoothness, or physical-device performance.

## Validation commands

```bash
npm test
npm run lint
npm run build
```

Browser validation must cover desktop and compact layouts, entrance readiness and failure, scroll continuity across positive/negative cycles, focus interruption and return, social independence, touch tap/drag separation, and reduced motion. Record observed results rather than assuming tests establish visual quality.

## Legacy code

Most of `src/components/scene/` (excluding the reused play control and intro reveal), `useVirtualScrollIndex`, the door/orbit helpers, `public/models/*.glb`, and `blender/stairCelestial.blend` remain for reference. Their presence does not mean the active homepage loads them. The historical Blender prompt sequence under `blender/md/` describes that previous design.

Door placement uses `doorPlacement.ts` with a fresh cryptographic arrangement seed for each mounted visit. Shape draws are independent per occurrence, allowing repeats and clusters rather than a six-shape sequence. Turn jitter spans 0.31 turns, lateral offset spans 84% of ribbon width, scales range from 0.72 to 1.22, and yaw covers the full circle. A visit's seed remains stable through rerenders, focus, resizing, slot recycling, and reverse scrolling. Selection uses that same seed for its anchor and facing direction. All six door GLBs prepare before entry even when the initial random draws omit one. The separate comparison room retains its asymmetric wide/narrow scatter arrangements.
