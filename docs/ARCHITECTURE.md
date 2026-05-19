# Architecture — agent prompt

Technical map of the **web app**. Read before editing scene, camera, or doors.

## Folder map

```txt
src/app/
  page.tsx              — Home: <StairwayScene /> + <ProjectOverlay />
  layout.tsx            — Root layout, metadata
  globals.css           — Full-viewport, dark background

src/components/scene/
  StairwayScene.tsx     — <Canvas>, ScrollControls infinite, Suspense
  SpiralStaircase.tsx   — Pooled stairs + door/platform groups (useFrame)
  StairSegment.tsx      — Renders one pre-cloned stair Object3D
  PlatformLanding.tsx   — Renders one pre-cloned platform Object3D
  ProjectDoor.tsx       — Door + preview screen + GSAP + clicks (pooled)
  CameraRig.tsx         — virtualStairIndex → camera lerp on helix
  CelestialBackground.tsx — Jupiter + ringed planet GLBs
  Atmosphere.tsx        — fog, Stars, Milky Way plane
  Lights.tsx            — ambient + directional + point
  cloneScene.ts         — findChildByNamePart() helper

src/hooks/
  useVirtualScrollIndex.ts — wrap-aware scroll.offset → virtualStairIndex

src/components/ui/
  ProjectOverlay.tsx    — HTML overlay, scroll %, open project card
  LoadingScreen.tsx     — Canvas loading fallback

src/lib/
  spiral.ts             — LOOP_LENGTH, placements, camera orbit, door helpers
  spiralPool.ts         — assignPoolSlots, assignDoorPoolSlots
  models.ts             — MODEL_PATHS for all GLBs
  projects.ts           — Project[] (data-only growth)
  store.ts              — usePortfolioStore (Zustand)
```

## GLB assets

| File | Role |
|------|------|
| `stair_segment.glb` | One stair slab; **14 pool clones** |
| `platform_landing.glb` | Landing; **4 pool clones** |
| `project_door_portal.glb` | Frame + panel; **4 pool clones** |
| `preview_screen.glb` | Plane behind door; texture applied in code |
| `jupiter_planet.glb` | Background |
| `ringed_planet.glb` | Background |

Paths: `src/lib/models.ts` → `public/models/`

**Naming quirk:** Blender export may suffix nodes (e.g. `door_01_panel.001`). Code uses `findChildByNamePart(root, "panel")` — partial name match, not exact string.

## Spiral layout (`src/lib/spiral.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `LOOP_LENGTH` | 28 | One full XZ turn; angle uses `index % LOOP_LENGTH` |
| `STAIR_POOL_SIZE` | 14 | Active stair instances around camera |
| `DOOR_POOL_SIZE` | 4 | Active door+platform groups in view |
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

**When stairs/doors float or clip:** tune constants here first, not in Blender, unless scale is fundamentally wrong.

## Infinite illusion (pool + fog)

```txt
Drei ScrollControls infinite
scroll.offset → armed lap detection → unboundedOffset → virtualStairIndex
14 pooled stairs + 4 pooled door slots reposition each frame
XZ repeats every LOOP_LENGTH; Y keeps climbing
Fog (#030508, near 14, far 85) hides recycled segments
```

**Add a project (no Blender):** append to `projects` in `src/lib/projects.ts` + preview under `public/previews/`. `DOOR_STEP` auto-adjusts from project count (min 6 steps apart).

## Scroll integration (`useVirtualScrollIndex.ts`)

Do **not** drive climb from raw `scroll.delta` — it spikes when Drei resets offset.

Current behavior:

1. Integrate `scroll.offset` with capped normal diffs (`±0.1` per frame).
2. On true forward lap cross (`offset` was high, then `< 0.15`): add `1 - last + offset`.
3. On true backward lap cross (`offset` was low, then `> 0.85` and `≤ 1.02`): add `-last + offset`.
4. If `|diff| > 0.15` without a valid lap cross (e.g. damp overshoot past 1.0): **resync only** — skip that frame.
5. `virtualStairIndex = unboundedOffset × CLIMB_SCALE` (28 steps per full scroll range).

## Scroll camera

- `StairwayScene`: `<ScrollControls pages={3} damping={0.18} infinite>`
- `CameraRig`: `getContinuousOrbitAngle` + fixed `CAMERA_ORBIT_RADIUS`; looks at void center
- Canvas FOV `58`; `scrollProgress` in UI = position within current loop (0–1)

## Door state machine

**Store:** `src/lib/store.ts`

| Field | Meaning |
|-------|---------|
| `activeDoorId` | `pool-door-0` … `pool-door-3` |
| `openedDoorId` | Door currently open |
| `currentProject` | Project linked to open door |
| `virtualStairIndex` | Unbounded climb index |
| `doorPoolVirtualIndices` | Per-slot virtual stair index (-1 = hidden) |
| `scrollProgress` | Loop-normalized 0–1 for UI |

**Interaction** (`ProjectDoor.tsx`):

1. First pointer down → open + preview from `getProjectForStairIndex(virtualIndex)`
2. Second pointer down → `window.open(project.url)`
3. When a pool slot’s virtual index changes, door closes and preview texture reloads

`projects.ts` `doorIndex` is legacy for static mapping; pooled doors use `getProjectForStairIndex` from virtual stair index.

## What lives in code vs Blender

| In GLB | In Three.js code |
|--------|------------------|
| Stairs, platforms, doors, planets | Starfield (`Stars`), fog, Milky Way plane |
| Door mesh + emissive materials | Door open animation, preview texture |
| | Virtual scroll + segment pool |
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
