# Celestial Stairway Portfolio

Interactive 3D portfolio homepage: scroll up an endless-feeling celestial spiral staircase and interact with project doors.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Audio (intro gate)

Site audio lives in [`public/audio/`](public/audio/): `consent-sting.m4a` (short opt-in clip) and `ambient-loop.m4a` / `ambient-loop.webm` (full track with format fallback). See [`public/audio/README.md`](public/audio/README.md).

## Controls

- **Scroll** — ascend the spiral (seamless infinite scroll)
- **Click door once** — zoom in, open door + preview
- **Click portal object** — open project URL in a new tab
- **Click door again (while open)** — close door; auto-drift resumes
- **Scroll away** — zoom back to the spiral path (door closes)

## Project data

Edit `src/lib/projects.ts` and add preview images under `public/previews/`. No new Blender export needed per project — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation (for agents & contributors)

**Start here:** [`docs/README.md`](docs/README.md)

| Doc | Purpose |
|-----|---------|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Vision, rules, status, current focus |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Code map, pool, scroll, camera, door zoom |
| [`docs/README.md`](docs/README.md) | Agent index + **doc maintenance rules** |
| [`docs/WEB-PHASES.md`](docs/WEB-PHASES.md) | Web implementation phases W1–W6 |
| [`blender/md/`](blender/md/) | Blender MCP prompts (complete) |

## Stack

Next.js · TypeScript · React Three Fiber · Drei · GSAP · Zustand · Tailwind · GLB assets from Blender
