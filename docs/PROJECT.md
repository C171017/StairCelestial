# Project — agent prompt

## What this is

A **personal portfolio homepage** built as a 3D web experience:

- An **endless-feeling celestial spiral staircase** in space
- **Scroll** moves a guided third-person camera up the **outer edge** of the spiral
- **Project doors** on platform landings: **first click** opens door + preview + **zooms camera to the door**; **second click** opens project URL; **scroll away** returns to spiral view
- Must stay **smooth on desktop and mobile** (zoom framing is aspect-aware in `doorCameraFocus.ts`)

## Visual direction (do not drift)

```txt
Slow wide spiral staircase
Third-person camera outside the spiral, fixed orbit radius, looking at the void center
Modern graphite project doors with thin cyan-white emissive accents
One large distant Jupiter-like planet, one smaller ringed planet
Subtle Milky Way band, sparse starfield
Fog/mist hiding repetition
```

**Avoid:** fantasy castles, medieval doors, spaceship interiors, characters, clutter, heavy simulations, huge textures, true infinite mesh count.

## Hard rules (repeat in every 3D change)

```txt
Keep geometry modular, low-poly, clearly named, export-ready for Three.js.
Door panel must be separate from frame, with hinge-side pivot (not center pivot).
Do not build a truly infinite staircase — recycle segments + fog + camera illusion.
New portfolio entries are data-only (projects.ts + preview image), not new door GLBs.
```

## Stack

```txt
Next.js 15 (App Router) + TypeScript
React Three Fiber + @react-three/drei
GSAP (door animation)
Zustand (door + scroll state)
Tailwind CSS 4
Blender → GLB in public/models/
Deploy target: Vercel
```

Deeper stack rationale: [`blender/md/threejs-portfolio-tech-stack.md`](../blender/md/threejs-portfolio-tech-stack.md) (note: scroll section in code uses `useVirtualScrollIndex`, not raw `scroll.delta`).

## Status checklist

Update this section when you complete a milestone.

| Track | Item | Status |
|-------|------|--------|
| Blender | Modular GLBs exported to `public/models/` | **Done** |
| Blender | Door panel hinge pivot verified in Blender | **Verify in browser** |
| Web | Next.js + R3F scaffold | **Done** |
| Web | Pooled helix (14 stairs, 4 doors) + GLB load | **Done** |
| Web | Scroll camera (fixed orbit, void look-at) | **Done** |
| Web | Seamless infinite scroll (lap wraps) | **Done** |
| Web | Door click → open → second click → URL | **Done** |
| Web | Door-focus camera zoom (any pooled door) | **Done** |
| Web | Atmosphere (fog, stars, Milky Way, planets) | **Done (tune)** |
| Web | Real project URLs in `src/lib/projects.ts` | **Done** |
| Web | Real preview images (replace SVG placeholders) | **Todo** |
| Web | Spiral/door alignment (`DOOR_Y_OFFSET` from GLB bounds) | **Done** |
| Web | Mobile performance pass | **Todo** |
| Web | Deploy Vercel | **Todo** |

## Current focus

**Phase W4–W6** (see [WEB-PHASES.md](./WEB-PHASES.md)): real preview images for doors, mobile perf, deploy. Door zoom/framing: tune `src/lib/doorCameraFocus.ts` if composition feels off.

## Agent instructions

- Prefer **small, focused diffs** — match existing patterns in `src/`
- Before changing layout, scroll, or doors, read `spiral.ts`, `doorCameraFocus.ts`, `useVirtualScrollIndex.ts`, and [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Update docs in the same change** when behavior or UX differs from [docs/](./README.md) — see **Keeping docs in sync** in [docs/README.md](./README.md)
- Do **not** join stairs/doors into one mesh in Blender re-exports
- Do **not** add heavy post-processing or physics unless the user asks
- After substantive changes, run `npm run build` and note any manual browser checks
- Do **not** commit `.cursor/` debug logs or stray root `.blend` files (see `.gitignore`)

## Key paths

```txt
src/app/page.tsx              — homepage, dynamic Canvas import
src/hooks/useVirtualScrollIndex.ts — scroll → virtualStairIndex
src/components/scene/         — all R3F scene components
src/lib/spiral.ts             — helix + orbit camera + door placement Y
src/lib/doorCameraFocus.ts    — zoom pose + viewport centering (tune framing here)
src/lib/spiralPool.ts         — pool slot assignment
src/lib/projects.ts           — portfolio entries
src/lib/store.ts              — Zustand
public/models/*.glb           — exported assets
public/previews/              — preview images for doors
blender/stairCelestial.blend  — source scene (tracked)
blender/md/                   — Blender MCP prompts (archive)
```
