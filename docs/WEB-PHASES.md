# Web implementation phases — agent prompt

Phases for the **Next.js / R3F app**. Blender is complete; do not repeat `blender/md/01–06` unless user requests re-export.

Mark phase status in [PROJECT.md](./PROJECT.md) when done.

---

## W1 — Scaffold & GLB smoke test ✅ Done

**Goal:** App runs; each GLB loads once without errors.

**Done when:**

- `npm run dev` serves `/`
- No GLTF load errors in console
- At least one instance of each model visible

**Key files:** `StairwayScene.tsx`, `StairSegment.tsx`, `public/models/`

---

## W2 — Spiral alignment (current priority)

**Goal:** Stairs, platforms, and doors sit correctly relative to each other and match Blender scale.

**Tasks:**

1. Run dev server; scroll full height; inspect gaps, overlaps, floating doors
2. Tune `src/lib/spiral.ts`: `SPIRAL_RADIUS`, `STAIR_HEIGHT_STEP`, `STAIR_ANGLE_STEP`, platform/door offsets
3. Adjust `CelestialBackground.tsx` planet positions if they break composition
4. Document final constants in a one-line comment in `spiral.ts` if non-obvious

**Done when:**

- Spiral reads clearly from default scroll positions
- Doors sit on platforms, not inside stairs or void
- No z-fighting between platform and door

**Do not:** Re-export GLBs unless scale is wrong by ~10× or more

---

## W3 — Camera & scroll feel

**Goal:** Scroll feels like ascending the outer edge; nearby stair + one door readable; far stairs fade in fog.

**Tasks:**

1. Tune `ScrollControls` `pages` and `damping` in `StairwayScene.tsx`
2. Tune `CameraRig` lerp factor, radius offset (`SPIRAL_RADIUS + 7.5`), lookAt height
3. Tune fog in `Atmosphere.tsx` (`near`, `far`) to hide far repetition

**Done when:**

- Smooth scroll on desktop trackpad
- Camera never clips through stairs
- At least one door prominent in first third of scroll

---

## W4 — Doors, previews & project data

**Goal:** Production-ready project wiring and reliable door interaction.

**Tasks:**

1. Replace placeholder entries in `src/lib/projects.ts` (real titles, URLs, descriptions)
2. Add real preview images to `public/previews/` (PNG/WebP; update paths)
3. Verify hinge: panel opens on hinge side; fix axis in `ProjectDoor.tsx` if needed
4. Optional: keyboard accessible focus, `cursor` states, close door on scroll away

**Done when:**

- All 4 doors map to real projects
- First click opens preview texture; second opens URL
- Only one door open at a time

**Door IDs:** `door-0` … `door-3` ↔ `doorIndex` 0–3 in `projects.ts`

---

## W5 — Atmosphere & visual polish

**Goal:** Premium, mysterious, calm — not noisy or overexposed.

**Tasks:**

1. Tune `Lights.tsx` intensities and colors
2. Refine `Atmosphere.tsx`: star count, Milky Way opacity, background color
3. Restrain emissive door strips (material emissiveIntensity if too bright)
4. Optional: `@react-three/postprocessing` bloom — **light touch only**

**Done when:**

- Stairs readable against space background
- Planets visible but secondary
- Emissive cyan accents visible but not neon

**Avoid:** Heavy bloom, harsh contrast, dense star clutter

---

## W6 — Infinite illusion, mobile, deploy

**Goal:** Performance-safe “infinite” stair + shipped site.

**Tasks:**

1. **Segment recycling:** pool of 14 stairs + 4 doors; `virtualStairIndex` from scroll delta (see `src/lib/spiralPool.ts`, `useVirtualScrollIndex.ts`)
2. Mobile: lower `dpr` cap, reduce star count, test touch door taps
3. `npm run build` clean; deploy Vercel; verify GLB paths on production URL

**Done when:**

- Scrolling feels endless without adding mesh count
- Acceptable FPS on mid-range phone
- Live URL loads all assets

**Do not:** Add true infinite geometry or physics engine for MVP

---

## Phase picker for agents

| User asks for… | Start phase |
|----------------|-------------|
| “doors broken / won’t open” | W4 |
| “stairs floating / wrong layout” | W2 |
| “scroll feels bad” | W3 |
| “looks flat / lighting” | W5 |
| “make it infinite / slow on phone / deploy” | W6 |
| “new GLB from Blender” | W2 after re-export |

Always read [ARCHITECTURE.md](./ARCHITECTURE.md) before editing scene code.
