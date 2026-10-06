# Sanctuary architecture

October 6 atmosphere correction: four equal two-turn palette regions now use
full-color cores and smooth overlapping weights in `sanctuaryAtmosphere.ts`.
The sun/moon/light coordinate remains continuous independently of those
art-directed palette durations. `cloudAdvection.ts` projects one wind into
fixed wisp surfaces and supplies bounded dual-sample offsets/weights; resets
occur only at zero contribution. Stars are denser and meteors span sunset and
night. Key height is raised, PCSS size is 50 at 2048/20 samples, and unshadowed
rect-light power is reduced to restore shadows. See [current evidence](validation/atmosphere-visibility-2026-10-06/README.md).

Latest atmosphere pass: [current parameters and evidence](validation/atmosphere/README.md).
The shared clock now has separate dawn/sunset palettes and moving celestial
vectors. `CleanSkyPlate` renders the sun/moon/stars on its existing sphere and
updates the live material uniform table, not the JSX input uniform wrappers.
Sixteen horizon wisps drift inside fixed surfaces; all banks retain their
layout and painter order. Evening meteors use an independently paused event
clock. The central control has atmosphere-tinted asymmetric reflections and
restrained ±15-degree idle sway; its entrance and audio morph are unchanged.

Latest material-depth follow-up: larger neutral veins and reduced daylight
diffuse lighting preserve marble readability. `metalGeometry.ts` adds explicit
anisotropic tangents to owned frame/reveal geometry clones. `beveledPlayShape.ts`
creates physical chamfers throughout the central tetrahedron/cube morph;
`CloudPlayShape` uses brushed platinum and polished chamfers with a local studio
reflection map whose intensity follows the existing atmosphere. Geometry and
reflection resources are owned and disposed. The same beveled tetrahedron is
the iris morph target. See [current parameters and evidence](validation/material-depth/README.md).
The October 5 first-pass summary below is retained as implementation history.

October 5 material update: the active scene now uses softly polished white
marble, satin blackened-metal outer frames, and restrained brushed-gold reveals.
`PorcelainRibbon` retains its component name and geometry. `useStoneTextures`
supplies its three local 4K ambientCG maps; `mineralFinish` projects them in
object space for color, roughness and shallow relief. The finite ribbon's
material Y offset advances with its cycle so recycling does not reset the
stone coordinates. Frames no longer load stone maps; both metals use filtered
directional roughness. See [TEXTURE-REFINEMENT.md](TEXTURE-REFINEMENT.md) for
parameters and [actual browser evidence](validation/black-gold-marble/README.md).

This document describes the active floating-portal marble homepage. [PORCELAIN-IMPLEMENTATION.md](PORCELAIN-IMPLEMENTATION.md) records the October 4 geometry, rendering and interaction work; its porcelain material settings are historical. The old staircase, rectangular portals, planets, and former staircase camera rig are legacy. Six irregular glass-door studies are mounted on the ribbon.

## Entry and component map

- `src/app/page.tsx` mounts `SanctuaryExperience`.
- `src/components/sanctuary/SanctuaryExperience.tsx` owns entrance intent/readiness, selection, the project detail panel, placeholder notices, Escape handling, and error/timeout fallback. It dynamically imports the Canvas with SSR disabled.
- `SanctuaryScene.tsx` creates the orbit camera, surrounding cloud sky, studio environment, readiness marker, and ribbon world.
- `OrbitSky.tsx` mounts `LayeredSky.tsx`: `CleanSkyPlate` plus 80 fixed `CloudField` image layers are composed into an opaque background for glass refraction. `cloudField.ts` gives every layer a unique, camera-independent radial draw order. The homepage grades the sky with the atmosphere clock and enables restrained night effects; `/sky-review` retains optional effects, an orbit continuity probe, and video recording.
- `PorcelainRibbon.tsx` renders the opaque swept white-marble receiver with soft real shadow maps. `GlassRibbon.tsx` and `ribbonShadows.ts` remain unmounted references. `floatingDoor.ts` adds footprint-safe clearance and three-quarter presentation.
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

`src/hooks/useRibbonMotion.ts` connects wheel and vertical-touch input on `#portfolio-scroll-surface` to that integrator. It ignores interactive elements and pinch gestures, normalizes wheel units, suppresses post-swipe clicks, watches reduced-motion preferences, and clears velocities when the page becomes hidden. The render loop consumes refs; React state is not updated for every motion frame. The camera orbit now derives from the same eased motion at one quarter of the ribbon turn rate. Idle rotation completes a turn in 160 seconds; ordinary scrolling rotates the sky half as far as the previous mapping. One full orbit corresponds to 7,200 wheel pixels or 4,000 vertical touch pixels (before input queue limits). The shared clock preserves proportional acceleration, reversal, pause, and resume; reduced motion disables idle travel and rotation. Peak orbit speed is 0.125 turns/second, or 0.055 with reduced motion. Queued input is capped for responsiveness; the accumulated angle is unrestricted in both directions. Input advances before the camera, and the camera updates before projection-dependent controls.

`src/lib/ribbonFocus.ts` eases the currently rendered ribbon transform toward a selected anchor. Focus cancels the selected occurrence's yaw and matches the camera's viewing pitch and azimuth. `ribbonFocusVisibility.ts` samples sightlines through the actual opening from both finished faces, testing the ribbon's bounded mesh sections, and chooses the face with fewer blocked samples. A tie retains the original front. The choice is memoized for the selected occurrence; no per-frame raycasts are needed. Revealed artwork moves behind the chosen face and turns to face the viewer, retaining that side throughout its exit. Translation accounts for the rotated anchor and the current camera azimuth, keeping the door centered above the audio control at every point around the orbit. Clearing or replacing a selection changes the destination while retaining the current pose, and orientation takes the shortest turn. Reduced-motion door selection settles immediately into the readable frontal view without an animated orbit.

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

## Current assets and rendering

- Six version-8 GLBs, 84,032 total unique triangles and 1,991,408 bytes, are exported from `blender/door-studies-pearl.blend`. The earlier `.blend` remains preserved. Apertures and slab transforms retain their existing contract.
- `doorMaterials.ts` separates satin blackened metal (`#646970`, metalness 1, roughness 0.18, environment multiplier 1.18), a recessed brushed-gold reveal (`#c9ac78`, metalness 1, roughness 0.23, environment multiplier 1.28), and the existing partially silvered cast glass. `porcelainFinish.ts` retains the glass's shallow normal and thickness variation. Neither the black frame nor the white marble uses clearcoat; the glass finish is unchanged.
- Marble uses color `#eeeee9`, roughness 0.22, IOR 1.54, and triplanar scale/contrast/relief 0.045/1.65/0.00022. Its roughness-map variation is 0.065, clamped to 0.16–0.38 before Three's geometric roughness adjustment. These are renderer parameters, not physical measurements.
- Three r175 replaces material environment intensity with scene intensity when `envMap` is null. `applyFinishEnvironment` multiplies the marble and metal IBL shader contributions by their local settings (marble 0.95, frame 1.18, gold 1.28), while retaining the shared changing environment. It does not change the glass shader or bind soon-to-be-disposed PMREM textures to individual materials.
- `SceneEnvironment.tsx` moves a 2048-map directional key light and uses 20-sample PCSS soft shadows. Fade-aware custom depth materials preserve shadow consistency through entrance, focus and dissolve. Shadow elevation is deliberately raised above the low celestial artwork for stable, visually coherent shadows.
- A 512 cube/PMREM capture samples the actual layered sky plus five deliberate reflection cards. The fifth is a feathered 24-by-8 rear sky bounce at key azimuth + PI, height 9 and radius 32, with day/dusk/night intensity 1.9/1.5/0.85. It helps reveal the marble's polished face; it exists only in the capture and adds no visible cloud-world object or shadow source. The map updates after small solar-phase changes; direct lighting updates each frame. Capture resources, including the feather texture, are owned and cleaned up; cards are reattached on StrictMode effect replay. These are environment reflections, not full-scene ray tracing or foreground-object reflections.
- The main canvas uses 1–1.5 DPR, transmission resolution scale 0.85, and a sky compositor following renderer DPR. Expensive reflection captures are limited to one per 160 ms during travel. These are performance-conscious settings, not a certified mobile device tier.
- Source cloud atlases stay 8K desktop / 4K compact, with WebP fallback. The clean sky and cloud palettes come from `sanctuaryAtmosphere.ts`; stars are behind cloud opacity.
- The camera is modestly elevated; the central bronze control keeps a lower composed world-height anchor on the transformed ribbon axis.

## Historical animated sky and loop validation


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
