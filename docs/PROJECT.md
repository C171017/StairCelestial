# Project — agent prompt

## What this is

A **personal portfolio homepage** built as a 3D web experience:

- An **endless-feeling celestial spiral staircase** in space
- **Scroll** moves a guided third-person camera up the **outer edge** of the spiral
- **Project doors** on platform landings: **first click** opens door + preview; **second click** opens project URL
- Must stay **smooth on desktop and mobile**

## Visual direction (do not drift)

```txt
Slow wide spiral staircase
Third-person camera outside the spiral, looking upward along the outer edge
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

Deeper stack rationale: [`blender/md/threejs-portfolio-tech-stack.md`](../blender/md/threejs-portfolio-tech-stack.md)

## Status checklist

Update this section when you complete a milestone.

| Track | Item | Status |
|-------|------|--------|
| Blender | Modular GLBs exported to `public/models/` | **Done** |
| Blender | Door panel hinge pivot verified in Blender | **Verify in browser** |
| Web | Next.js + R3F scaffold | **Done** |
| Web | GLBs loaded, 24-stair helix, 4 doors | **Done (tune alignment)** |
| Web | Scroll camera on outer spiral | **Done (tune feel)** |
| Web | Door click → open → second click → URL | **Done** |
| Web | Atmosphere (fog, stars, Milky Way, planets) | **Done (tune)** |
| Web | Real project data in `src/lib/projects.ts` | **Todo** |
| Web | Spiral/door alignment matches GLB scale | **Todo** |
| Web | Infinite stair **recycling** (segment pool) | **Done** |
| Web | Mobile performance pass | **Todo** |
| Web | Deploy Vercel | **Todo** |

## Current focus

**Phase W2–W4** (see [WEB-PHASES.md](./WEB-PHASES.md)): align spiral constants to Blender scale, verify door hinge rotation, replace placeholder previews with real project URLs/images. Infinite pool (W6) is implemented — tune fog/scroll in browser as needed.

## Agent instructions

- Prefer **small, focused diffs** — match existing patterns in `src/`
- Before changing layout, read `src/lib/spiral.ts` and [ARCHITECTURE.md](./ARCHITECTURE.md)
- Do **not** join stairs/doors into one mesh in Blender re-exports
- Do **not** add heavy post-processing or physics unless the user asks
- After substantive changes, run `npm run build` and note any manual browser checks

## Key paths

```txt
src/app/page.tsx              — homepage, dynamic Canvas import
src/components/scene/         — all R3F scene components
src/lib/spiral.ts             — helix math (tune here first)
src/lib/projects.ts           — portfolio entries (doorIndex 0–3)
src/lib/store.ts              — Zustand
public/models/*.glb           — exported assets
public/previews/              — preview images for doors
blender/stairCelestial.blend  — source scene
blender/md/                   — Blender MCP prompts (archive)
```
