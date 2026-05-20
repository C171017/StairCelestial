# Web implementation phases — agent prompt

Phases for the **Next.js / R3F app**. Blender is complete; do not repeat `blender/md/01–06` unless user requests re-export.

Mark phase status in [PROJECT.md](./PROJECT.md) when done.

---

## W1 — Scaffold & GLB smoke test ✅ Done

**Goal:** App runs; each GLB loads once without errors.

**Key files:** `StairwayScene.tsx`, `StairSegment.tsx`, `public/models/`

---

## W2 — Spiral alignment ✅ Mostly done

**Goal:** Stairs, platforms, and doors sit correctly relative to each other and match Blender scale.

**Done:**

- `DOOR_Y_OFFSET_ABOVE_PLATFORM` in `spiral.ts` from GLB mesh bounds (doors on platform tops)
- Visual pass in browser — doors no longer clip through slabs

**Remaining (optional):**

- Fine-tune `SPIRAL_RADIUS`, `STAIR_HEIGHT_STEP`, planet positions in `CelestialBackground.tsx`

**Do not:** Re-export GLBs unless scale is wrong by ~10× or more

---

## W3 — Camera & scroll feel ✅ Mostly done

**Goal:** Smooth ascent; stable camera; far geometry fades in fog.

**Implemented:**

- `ScrollControls` with `infinite`, `pages={3}`, `damping={0.3}`
- `useVirtualScrollIndex` — wrap-aware offset integration (see [ARCHITECTURE.md](./ARCHITECTURE.md))
- `CameraRig` — orbit + **door-focus zoom blend** (`doorCameraFocus.ts`)
- Fog in `Atmosphere.tsx` — `near: 14`, `far: 85`
- Focus release on scroll via `focusScrollAnchor` (not door stair index)

**Optional tuning:**

- `CameraRig` `CAMERA_LERP` / `FOCUS_BLEND_LERP`, FOV in `StairwayScene.tsx`
- `doorCameraFocus.ts` — `DOOR_LOOK_AT_HEIGHT`, `getViewportFrameBias()` for vertical centering
- `MAX_TRACKER_STEP` / `MAX_DISPLAY_STEP` in `useVirtualScrollIndex.ts` if scroll feels slow/fast

---

## W4 — Doors, previews & project data (in progress)

**Goal:** Production-ready project wiring and reliable door interaction.

**Done:**

- Real project URLs in `projects.ts` (Music, Stars, Guanchang, Columbia-Barnard Network)
- First click → open + preview + zoom; second click → URL
- Scroll away → `resetDoors()` (zoom out + close)
- Zoom works for **any** visible pooled door (`focusScrollAnchor` + world-space focus target)

**Tasks:**

1. Add real preview images to `public/previews/` (PNG/WebP; update `previewImage` paths)
2. Verify hinge: panel opens on hinge side; fix axis in `ProjectDoor.tsx` if needed
3. Optional: keyboard accessible focus

**Done when:**

- Projects repeat correctly each lap via `getProjectForStairIndex`
- Preview textures are real screenshots, not SVG placeholders
- Only one door open at a time

**Door IDs in store:** `pool-door-0` … `pool-door-3` (not `door-0`)

---

## W5 — Atmosphere & visual polish

**Goal:** Premium, mysterious, calm — not noisy or overexposed.

**Tasks:**

1. Tune `Lights.tsx` intensities and colors
2. Refine `Atmosphere.tsx`: star count, Milky Way opacity
3. Restrain emissive door strips if too bright
4. Optional: light post-processing bloom only

### Saturn (ringed planet) — in-code pass done

**Implemented in web (no Blender re-export):**

- Screen-fixed NDC anchor in `CelestialBackground.tsx` (no horizontal swing on scroll)
- Cinematic textures in `public/textures/saturn/` + `applySaturnMaterials` in `saturnMaterials.ts`
- Rim Fresnel + backside atmosphere shell + dedicated planet lights

**Evaluate in browser; use Blender only if still lacking:**

| Issue | Blender follow-up |
|-------|-------------------|
| Ring looks flat / pancake | Rebuild ring (torus or multi-plane) |
| Texture stretching on poles or ring | Re-unwrap UVs |
| Silhouette / tilt wrong for composition | Adjust mesh pose in Blender |
| Needs close-up surface detail | Bake normal/roughness maps into GLB |
| Jupiter should match Saturn quality | Same texture pipeline for `jupiter_planet.glb` |

---

## W6 — Infinite illusion, mobile, deploy

**Goal:** Performance-safe endless stair + shipped site.

| Task | Status |
|------|--------|
| Segment pool (14 stairs, 4 doors) + `spiralPool.ts` | **Done** |
| Seamless scroll / lap wraps (`useVirtualScrollIndex`) | **Done** |
| Mobile: DPR cap, star count, touch door taps | **Todo** |
| `npm run build` + Vercel deploy | **Todo** |

**Do not:** Add true infinite geometry, raw `scroll.delta` climb, or a physics engine for MVP

---

## Phase picker for agents

| User asks for… | Start phase |
|----------------|-------------|
| “doors broken / won’t open” | W4 |
| “zoom wrong / door low on screen” | W3 — `doorCameraFocus.ts` |
| “zoom only works on first door” | W3 — use `focusScrollAnchor`, not door index |
| “stairs floating / wrong layout” | W2 |
| “scroll jumps / stutter at lap” | W3 — read `useVirtualScrollIndex.ts` |
| “looks flat / lighting” | W5 |
| “slow on phone / deploy” | W6 |
| “new GLB from Blender” | W2 after re-export |

Always read [ARCHITECTURE.md](./ARCHITECTURE.md) before editing scene code.
