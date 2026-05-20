# Architecture — agent prompt

Technical map of the **web app**. Read before editing scene, camera, or doors.

## Folder map

```txt
src/app/
  page.tsx              — Home: <StairwayScene /> + <ProjectOverlay />
  layout.tsx            — Root layout, metadata
  globals.css           — Full-viewport, dark background

src/components/scene/
  StairwayScene.tsx     — <Canvas>, ScrollControls infinite; SceneContent runs `useVirtualScrollIndex`, passes ref to `SpiralStaircase` + `CameraRig`
  SpiralStaircase.tsx   — Pooled stairs + door/platform groups (useFrame); reads `virtualIndexRef` (same float as camera)
  StairSegment.tsx      — Renders one pre-cloned stair Object3D
  PlatformLanding.tsx   — Renders one pre-cloned platform Object3D
  ProjectDoor.tsx       — Door + preview screen + GSAP + clicks (pooled)
  CameraRig.tsx         — Orbit camera + door-focus zoom blend (consumes `virtualIndexRef`)
  CelestialBackground.tsx — Jupiter + ringed planet GLBs
  Atmosphere.tsx        — fog, Stars, Milky Way plane
  Lights.tsx            — ambient + directional + point
  cloneScene.ts         — findChildByNamePart() helper

src/hooks/
  useVirtualScrollIndex.ts — wrap-aware scroll.offset → virtualStairIndex (store + smoothing)
  scrollLapIntegration.ts — `computeTrackerStep` (Drei lap teleports vs capped delta); `npm run test:scroll`
  useCenteredScrollInit.ts — center scroll DOM; seed refs; sync `lastOffsetRef` from damped `scroll.offset`

src/components/ui/
  ProjectOverlay.tsx    — HTML overlay, scroll %, open project card
  LoadingScreen.tsx     — Canvas loading fallback

src/lib/
  spiral.ts             — LOOP_LENGTH, placements, camera orbit, door Y offset
  doorCameraFocus.ts    — Zoom-to-door pose, viewport framing, scroll release threshold
  spiralPool.ts         — assignPoolSlots (floor-centered window), assignDoorPoolSlots (nearest doors + slot hysteresis)
  models.ts             — MODEL_PATHS for all GLBs
  projects.ts           — Project[] (data-only growth)
  store.ts              — usePortfolioStore (Zustand)
```

## GLB assets

| File | Role |
|------|------|
| `stair_segment.glb` | One stair slab; **64 pool clones** |
| `platform_landing.glb` | Landing; **12 pool clones** |
| `project_door_portal.glb` | Frame + panel; **12 pool clones** |
| `preview_screen.glb` | Plane behind door; texture applied in code |
| `jupiter_planet.glb` | Background |
| `ringed_planet.glb` | Background |

Paths: `src/lib/models.ts` → `public/models/`

**Naming quirk:** Blender export may suffix nodes (e.g. `door_01_panel.001`). Code uses `findChildByNamePart(root, "panel")` — partial name match, not exact string.

## Spiral layout (`src/lib/spiral.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `LOOP_LENGTH` | 28 | One full XZ turn; angle uses `index % LOOP_LENGTH` |
| `STAIR_POOL_SIZE` | 64 | Active stair instances around camera |
| `DOOR_POOL_SIZE` | 12 | Active door+platform groups in view |
| `DOOR_POOL_SEARCH_RADIUS` | 56 | Virtual steps ±center when collecting door slot candidates |
| `SPIRAL_RADIUS` | 11 | Helix radius for stair/platform placement |
| `STAIR_HEIGHT_STEP` | 0.52 | Vertical rise per stair (Y is unbounded) |
| `STAIR_ANGLE_STEP` | 2π/28 | Rotation per loop step |
| `CAMERA_ORBIT_RADIUS` | 25 | Fixed camera distance from central axis (`SPIRAL_RADIUS + 14`) |
| `CAMERA_Y_OFFSET` | 3 | Camera height above current stair index |
| `CAMERA_LOOK_AT_Y_OFFSET` | 1.2 | Look-at on void center `(0, y + offset, 0)` |

Door spacing: `DOOR_STEP = max(6, floor(LOOP_LENGTH / projects.length))`. For 4 projects, doors at virtual indices 0, 7, 14, 21…

Functions:

- `getStairPlacement(virtualIndex)` — XZ from loop modulo; Y from full index
- `getPlatformPlacement` / `getDoorPlacement` — outward offsets
- `getContinuousOrbitAngle(virtualIndex)` — unbounded angle for camera (no modulo)
- `isDoorStairIndex` / `getDoorSlotIndex` / `getProjectForStairIndex`
- `DOOR_Y_OFFSET_ABOVE_PLATFORM` — derived from GLB bounds so door bottom sits on platform top (~1.75), not a hand-tuned `0.12`

**When stairs/doors float or clip:** tune `DOOR_Y_OFFSET` / platform offsets here first, not in Blender, unless scale is fundamentally wrong.

## Infinite illusion (pool + fog)

```txt
Drei ScrollControls infinite
scroll.offset → computeTrackerStep (lap vs capped delta) → unboundedOffset → virtualStairIndex
64 pooled stairs + 12 pooled door slots reposition each frame
XZ repeats every LOOP_LENGTH; Y keeps climbing
Fog (#030508, near 22, far 95) softens distant geometry and recycled segments
```

**Add a project (no Blender):** append to `projects` in `src/lib/projects.ts` + preview under `public/previews/`. `DOOR_STEP` auto-adjusts from project count (min 6 steps apart).

## Scroll integration (`useVirtualScrollIndex.ts` + `scrollLapIntegration.ts`)

Do **not** drive climb from raw `scroll.delta` — it spikes when Drei resets offset.

Lap math lives in [`scrollLapIntegration.ts`](src/hooks/scrollLapIntegration.ts) (`computeTrackerStep`) so it stays testable; the hook wires it to the store and display smoothing.

Two-layer integration (tracker + display):

1. On mount, `useCenteredScrollInit` sets `scrollTop` to half the track and seeds **target** and **display** unbounded offsets at `SCROLL_START_OFFSET` (0.5). After layout, `lastOffsetRef` is synced from damped `scroll.offset` (double `requestAnimationFrame`) so the first integration step matches Drei, not a stale 0.5 guess.
2. **Tracker** (`targetUnboundedOffset`): each frame adds `computeTrackerStep(last, offset)` — capped normal diffs (`±0.06` per frame) unless a Drei infinite teleport is detected.
3. **Forward / bottom teleport** (`|Δoffset| > 0.45`, `last > 0.7`, `offset < 0.25`): add `SCROLL_CLIMB_SIGN * (1 - last + offset)` (~0 when Drei snaps high → low).
4. **Backward / top teleport** (`|Δoffset| > 0.45`, `last < 0.12`, `offset > 0.75`): add **`-SCROLL_CLIMB_SIGN * (-last + offset)`** (~+1 lap in climb direction — the naive `SCROLL_CLIMB_SIGN * (-last + offset)` was inverted and caused harsh jumps). `last < 0.12` keeps this branch off normal damp motion in the 0.2–0.3 band.
5. **Display** (`displayUnboundedOffset`): each frame moves toward the tracker with `±0.04` max step — this value drives the store/camera so lap teleports never lurch in one frame.
6. `virtualStairIndex = displayUnbounded × CLIMB_SCALE` (28 steps per full scroll range); index may go negative (stairs below start elevation).
7. While a door is focused: if `|virtualStairIndex - focusScrollAnchor| > SCROLL_FOCUS_RELEASE_THRESHOLD` (~0.35 steps), call `resetDoors()` (zoom out + close door). Uses **display** index so release matches visible motion.

**Scene wiring:** `useVirtualScrollIndex()` runs once in `StairwayScene` `SceneContent`; the returned ref is passed to `SpiralStaircase` and `CameraRig` so geometry reads the same float index as the camera without waiting on Zustand per frame.

Dev: `window.__scrollDebug` (development only) exposes per-frame `maxDisplayIndexDelta` for profiling. CI/local: `npm run test:scroll` exercises lap detection edge cases.

## Scroll camera

- `StairwayScene`: `<ScrollControls pages={3} damping={0.3} infinite>`
- **Orbit mode:** `getContinuousOrbitAngle` + fixed `CAMERA_ORBIT_RADIUS`; looks at void center
- **Focus mode:** blends toward `getFocusCameraPose()` when `doorFocusTarget` is set (see below)
- Canvas FOV `58`; `scrollProgress` in UI = position within current loop (0–1)

## Door interaction & zoom

**User flow**

1. **First click** on any visible pooled door → open panel + preview texture + **camera zooms to that door**
2. **Second click** (same door, while open) → `window.open(project.url)`
3. **Scroll away** from anchor position → zoom returns to orbit, door closes, overlay clears

**`doorCameraFocus.ts`**

- `worldRootToFocusTarget()` — focus point from the door root’s **world matrix** (correct for pooled slots)
- `getFocusCameraPose()` — distance from FOV + aspect; extra **viewport frame bias** lowers look-at so the portal sits centered (stronger on portrait / narrow widths)
- Tune vertical framing: `DOOR_LOOK_AT_HEIGHT`, `getViewportFrameBias()`, camera `position.y` offset in `getFocusCameraPose`
- `SCROLL_FOCUS_RELEASE_THRESHOLD` — scroll delta before releasing focus

**`CameraRig.tsx`**

- `focusBlend` lerps 0↔1 between orbit pose and focus pose
- Uses stored `doorFocusTarget` from the click (not recomputed from a stale index alone)

## Door state machine

**Store:** `src/lib/store.ts`

| Field | Meaning |
|-------|---------|
| `activeDoorId` | `pool-door-0` … `pool-door-11` |
| `openedDoorId` | Door currently open |
| `currentProject` | Project linked to open door |
| `virtualStairIndex` | Unbounded climb index |
| `doorPoolVirtualIndices` | Per-slot virtual stair index (-1 = hidden) |
| `scrollProgress` | Loop-normalized 0–1 for UI |
| `focusedDoorId` | Door receiving camera zoom (`pool-door-0` … `11`) |
| `doorFocusTarget` | World-space look-at + forward for zoom framing |
| `focusVirtualIndex` | Stair index of focused door (metadata) |
| `focusScrollAnchor` | `virtualStairIndex` when focus started — scroll release uses **this**, not `focusVirtualIndex` |

**Interaction** (`ProjectDoor.tsx`):

1. First pointer down → `setDoorFocus` + open + preview from `getProjectForStairIndex(virtualIndex)`
2. Second pointer down → `window.open(project.url)`
3. When a pool slot’s virtual index changes, door closes and preview texture reloads

`projects.ts` `doorIndex` is legacy slot order; pooled doors use `getProjectForStairIndex(virtualIndex)`.

**Current projects** (edit in `projects.ts`): Music, Stars, Guanchang, Columbia-Barnard Network — preview images still placeholder SVGs under `public/previews/`.

## What lives in code vs Blender

| In GLB | In Three.js code |
|--------|------------------|
| Stairs, platforms, doors, planets | Starfield (`Stars`), fog, Milky Way plane |
| Door mesh + emissive materials | Door open animation, preview texture |
| | Virtual scroll + segment pool |
| | Door-focus camera zoom + viewport framing |
| | HTML overlay UI |

## Build / run

```bash
npm run dev    # localhost:3000
npm run build  # must pass before PR
```

`page.tsx` uses `dynamic(..., { ssr: false })` for Canvas — do not remove without a plan for SSR.

## Common agent mistakes to avoid

- Merging all stairs into one mesh export
- Center pivot on door panel
- Using `scroll.delta` directly for climb index (causes lap-boundary jumps)
- Applying modulo to camera orbit angle (360° snap each lap)
- Thousands of star meshes instead of `Stars` or instanced points
- Putting infinite loop logic inside GLB instead of recycling transforms
- Breaking `ScrollControls` by moving `CameraRig` outside its provider
- Cloning GLB per frame instead of reusing pool clones + updating transforms
- Releasing door focus when `|index - focusVirtualIndex| > threshold` (use `focusScrollAnchor` instead)
- Forgetting to update `docs/` after changing door/zoom/scroll UX (see [README.md](./README.md) § Keeping docs in sync)
