# Web implementation phases — agent prompt

Phases for the **Next.js / R3F app**. Blender is complete; do not repeat `blender/md/01–06` unless user requests re-export.

Mark phase status in [PROJECT.md](./PROJECT.md) when done.

---

## W1 — Scaffold & GLB smoke test ✅ Done

**Goal:** App runs; each GLB loads once without errors.

**Key files:** `StairwayScene.tsx`, `StairSegment.tsx`, `public/models/`

---

## W2 — Spiral alignment (current priority)

**Goal:** Stairs, platforms, and doors sit correctly relative to each other and match Blender scale.

**Tasks:**

1. Run dev server; scroll through several laps; inspect gaps, overlaps, floating doors
2. Tune `src/lib/spiral.ts`: `SPIRAL_RADIUS`, `STAIR_HEIGHT_STEP`, platform/door offsets
3. Adjust `CelestialBackground.tsx` planet positions if they break composition

**Done when:**

- Spiral reads clearly while scrolling
- Doors sit on platforms, not inside stairs or void
- No z-fighting between platform and door

**Do not:** Re-export GLBs unless scale is wrong by ~10× or more

---

## W3 — Camera & scroll feel ✅ Mostly done

**Goal:** Smooth ascent; stable camera; far geometry fades in fog.

**Implemented:**

- `ScrollControls` with `infinite`, `pages={3}`, `damping={0.18}`
- `useVirtualScrollIndex` — wrap-aware offset integration (see [ARCHITECTURE.md](./ARCHITECTURE.md))
- `CameraRig` — `CAMERA_ORBIT_RADIUS`, void-center look-at, `getContinuousOrbitAngle`
- Fog in `Atmosphere.tsx` — `near: 14`, `far: 85`

**Optional tuning:**

- `CameraRig` `CAMERA_LERP`, FOV in `StairwayScene.tsx`
- `MAX_DIFF_PER_FRAME` in `useVirtualScrollIndex.ts` if scroll feels slow/fast

---

## W4 — Doors, previews & project data

**Goal:** Production-ready project wiring and reliable door interaction.

**Tasks:**

1. Replace placeholder entries in `src/lib/projects.ts` (real titles, URLs, descriptions)
2. Add real preview images to `public/previews/` (PNG/WebP; update paths)
3. Verify hinge: panel opens on hinge side; fix axis in `ProjectDoor.tsx` if needed
4. Optional: keyboard accessible focus, close door on scroll away

**Done when:**

- Projects repeat correctly each lap via `getProjectForStairIndex`
- First click opens preview texture; second opens URL
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
| “stairs floating / wrong layout” | W2 |
| “scroll jumps / stutter at lap” | W3 — read `useVirtualScrollIndex.ts` |
| “looks flat / lighting” | W5 |
| “slow on phone / deploy” | W6 |
| “new GLB from Blender” | W2 after re-export |

Always read [ARCHITECTURE.md](./ARCHITECTURE.md) before editing scene code.
